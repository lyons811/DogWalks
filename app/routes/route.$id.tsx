import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConvexHttpClient } from "convex/browser";
import { useMutation, useQuery } from "convex/react";
import { Link, useLoaderData, useNavigate } from "react-router";
import type { Route } from "./+types/route.$id";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import type { RouteDetail, RoutePoint } from "~/types/routes";
import { RouteForm, type RouteFormErrors, type RouteFormValues } from "~/components/RouteForm";
import { RouteMetrics } from "~/components/RouteMetrics";
import { ElevationChart } from "~/components/ElevationChart";
import { RouteMap, type RouteMapRenderProps } from "~/components/RouteMap";
import { RouteDrawingMap } from "~/components/RouteDrawingMap";
import { createRoutePointIcon } from "~/lib/leaflet-icons";
import { buildElevationProfile, calculateRouteMetrics } from "~/lib/route-calculations";
import { getElevationMeters, preloadElevationModel } from "~/lib/elevation";
import { useWalkingSpeed } from "~/lib/walking-speed";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";

const COORDINATE_EPSILON = 1e-6;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export async function loader({ params }: Route.LoaderArgs) {
  const convexUrl = import.meta.env.VITE_CONVEX_URL;

  if (!convexUrl) {
    throw new Error("VITE_CONVEX_URL is not defined");
  }

  const { id } = params;

  if (!id) {
    throw new Response("Not found", { status: 404 });
  }

  const routeId = id as Id<"routes">;
  const client = new ConvexHttpClient(convexUrl);
  const route = await client.query(api.routes.getRoute, { id: routeId });

  if (!route) {
    throw new Response("Not found", { status: 404 });
  }

  return { route, id: routeId };
}

export function meta({ data, params }: Route.MetaArgs) {
  const routeName = data?.route?.name;
  const fallbackTitle = params.id ? `Route ${params.id} - Dog Walks` : "Route Details - Dog Walks";

  return [
    { title: routeName ? `${routeName} - Dog Walks` : fallbackTitle },
    {
      name: "description",
      content: routeName
        ? `View saved details for ${routeName}.`
        : "View your dog walking route details.",
    },
  ];
}

export default function RouteDetailPage() {
  const { route: initialRoute } = useLoaderData<typeof loader>();
  const skipQuery = typeof window === "undefined";
  const liveRoute = useQuery(
    api.routes.getRoute,
    skipQuery ? "skip" : { id: initialRoute.id },
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editPoints, setEditPoints] = useState<RoutePoint[]>([]);
  const [formValues, setFormValues] = useState<RouteFormValues>({ name: "", notes: "" });
  const [formErrors, setFormErrors] = useState<RouteFormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isMountedRef = useRef(true);
  const [walkingSpeedMph] = useWalkingSpeed();

  const updateRouteMutation = useMutation(api.routes.updateRoute);
  const deleteRouteMutation = useMutation(api.routes.deleteRoute);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined") {
      void preloadElevationModel().catch((preloadError) => {
        console.error("Failed to preload elevation data", preloadError);
      });
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const route = (liveRoute ?? initialRoute) as RouteDetail | null;

  const handleEnterEditMode = useCallback(() => {
    if (!route) return;
    setIsEditing(true);
    setEditPoints(route.points);
    setFormValues({
      name: route.name,
      notes: route.notes ?? "",
    });
    setFormErrors({});
    setError(null);
  }, [route]);

  const handleCancelEdit = useCallback(() => {
    if (!route) return;
    setIsEditing(false);
    setEditPoints([]);
    setFormValues({ name: route.name, notes: route.notes ?? "" });
    setFormErrors({});
    setError(null);
  }, [route]);

  const handleFormChange = useCallback(
    (values: RouteFormValues) => {
      setFormValues(values);
      setError(null);
      if (formErrors.name) {
        setFormErrors((previous) => ({ ...previous, name: undefined }));
      }
    },
    [formErrors.name],
  );

  const loadElevationForPoint = useCallback((index: number, lat: number, lng: number) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    void (async () => {
      try {
        const elevation = await getElevationMeters(lat, lng);

        if (!isMountedRef.current) {
          return;
        }

        setEditPoints((prev) => {
          const target = prev[index];

          if (!target) {
            return prev;
          }

          if (
            Math.abs(target.lat - lat) > COORDINATE_EPSILON ||
            Math.abs(target.lng - lng) > COORDINATE_EPSILON
          ) {
            return prev;
          }

          if ((target.elevation ?? null) === (elevation ?? null)) {
            return prev;
          }

          const next = [...prev];
          next[index] = { ...target, elevation: elevation ?? null };
          return next;
        });
      } catch (lookupError) {
        console.error("Unable to determine elevation for point", lookupError);
      }
    })();
  }, []);

  const handleAddPoint = useCallback(
    (point: RoutePoint) => {
      const normalized = normalizePoint({ ...point, elevation: null });
      setEditPoints((prev) => {
        const next = [...prev, normalized];
        const index = next.length - 1;
        loadElevationForPoint(index, normalized.lat, normalized.lng);
        return next;
      });
      setError(null);
    },
    [loadElevationForPoint],
  );

  const handleUpdatePoint = useCallback(
    (index: number, updated: RoutePoint) => {
      const normalized = normalizePoint({ ...updated, elevation: null });
      setEditPoints((prev) =>
        prev.map((point, pointIndex) =>
          pointIndex === index ? { ...point, ...normalized } : point,
        ),
      );
      loadElevationForPoint(index, normalized.lat, normalized.lng);
      setError(null);
    },
    [loadElevationForPoint],
  );

  const handleRemovePoint = useCallback((index: number) => {
    setEditPoints((prev) => prev.filter((_, pointIndex) => pointIndex !== index));
    setError(null);
  }, []);

  const handleSaveChanges = useCallback(async () => {
    if (!route) return;

    const trimmedName = formValues.name.trim();

    if (trimmedName.length === 0) {
      setFormErrors({ name: "Please enter a route name." });
      setError("Route name is required.");
      return;
    }

    if (editPoints.length < 2) {
      setError("Route must have at least two points.");
      return;
    }

    const trimmedNotes = formValues.notes.trim();

    setFormErrors({});
    setError(null);
    setIsSaving(true);

    try {
      const pointsWithElevation = await ensurePointElevations(editPoints);
      setEditPoints(pointsWithElevation);

      const metricsForSave = calculateRouteMetrics(pointsWithElevation, {
        walkingSpeedMph,
      });

      const serializedPoints = pointsWithElevation.map((point) => {
        const { elevation, ...rest } = point;
        return elevation == null ? rest : { ...rest, elevation };
      });

      await updateRouteMutation({
        id: route.id,
        name: trimmedName,
        notes: trimmedNotes.length > 0 ? trimmedNotes : undefined,
        points: serializedPoints,
        distance: metricsForSave.distanceMeters,
        estimatedTime: metricsForSave.estimatedMinutes,
        elevationGain: metricsForSave.elevationGainMeters ?? undefined,
        elevationLoss: metricsForSave.elevationLossMeters ?? undefined,
      });

      setIsEditing(false);
      setEditPoints([]);
    } catch (saveError) {
      console.error("Failed to save route changes", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save changes. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [editPoints, formValues, route, updateRouteMutation, walkingSpeedMph]);

  const handleDeleteRoute = useCallback(async () => {
    if (!route) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteRouteMutation({ id: route.id });
      navigate("/");
    } catch (deleteError) {
      console.error("Failed to delete route", deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete route. Please try again.",
      );
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteRouteMutation, navigate, route]);

  const currentPoints = isEditing ? editPoints : route?.points ?? [];
  const pointCount = currentPoints.length;

  const mapBounds = useMemo<LatLngBoundsExpression | undefined>(() => {
    if (currentPoints.length < 2) {
      return undefined;
    }
    return currentPoints.map(
      (point) => [point.lat, point.lng] as [number, number],
    ) as LatLngBoundsExpression;
  }, [currentPoints]);

  const mapCenter = useMemo<LatLngExpression | undefined>(() => {
    if (currentPoints.length === 1) {
      const onlyPoint = currentPoints[0];
      return [onlyPoint.lat, onlyPoint.lng] as LatLngExpression;
    }
    return undefined;
  }, [currentPoints]);

  const renderOverlays = useCallback(
    (props: RouteMapRenderProps) => (
      <RouteDetailOverlays {...props} points={currentPoints} />
    ),
    [currentPoints],
  );

  const elevationProfile = useMemo(
    () => buildElevationProfile(currentPoints),
    [currentPoints],
  );

  const metrics = useMemo(() => {
    if (isEditing) {
      return calculateRouteMetrics(editPoints, { walkingSpeedMph });
    }
    return {
      distanceMeters: route?.distance ?? 0,
      estimatedMinutes: route?.estimatedTime ?? 0,
      elevationGainMeters: route?.elevationGain ?? undefined,
      elevationLossMeters: route?.elevationLoss ?? undefined,
    };
  }, [editPoints, isEditing, route, walkingSpeedMph]);

  const currentFormValues = useMemo(() => {
    if (isEditing) {
      return formValues;
    }
    return {
      name: route?.name ?? "",
      notes: route?.notes ?? "",
    };
  }, [formValues, isEditing, route]);

  const createdDate = route ? dateFormatter.format(new Date(route.createdAt)) : "";
  const updatedDate =
    route && route.updatedAt !== route.createdAt
      ? dateFormatter.format(new Date(route.updatedAt))
      : null;

  const isDirty =
    route &&
    isEditing &&
    (formValues.name !== route.name ||
      formValues.notes !== (route.notes ?? "") ||
      JSON.stringify(editPoints) !== JSON.stringify(route.points));

  if (!route) {
    return <RouteMissing id={initialRoute.id} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="outline" size="sm">
                  {"<-"} Back to Dashboard
                </Button>
              </Link>
              <span className="text-sm text-muted-foreground">Route ID: {String(route.id)}</span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {isEditing ? formValues.name || "Untitled Route" : route.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Created {createdDate}
                {updatedDate ? ` • Updated ${updatedDate}` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleEnterEditMode}>
                  Edit Route
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete Route
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={isSaving || !isDirty}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancel Edit
                </Button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Route Map</CardTitle>
                <CardDescription>
                  {isEditing
                    ? "Click to add points, drag to move, right-click or shift-click to delete"
                    : "View your saved route on the map"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {isEditing ? (
                    <RouteDrawingMap
                      className="h-full"
                      points={editPoints}
                      onAddPoint={handleAddPoint}
                      onUpdatePoint={handleUpdatePoint}
                      onRemovePoint={handleRemovePoint}
                      center={mapCenter}
                    />
                  ) : (
                    <RouteMap
                      className="h-full"
                      bounds={mapBounds}
                      center={mapCenter}
                      renderOverlays={renderOverlays}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Elevation Profile</CardTitle>
                <CardDescription>Grade changes along the route</CardDescription>
              </CardHeader>
              <CardContent>
                <ElevationChart profile={elevationProfile} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Route Details</CardTitle>
                <CardDescription>Notes and metadata for this walk</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RouteForm
                  values={currentFormValues}
                  onChange={isEditing ? handleFormChange : () => {}}
                  disabled={!isEditing || isSaving}
                  errors={formErrors}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Route Metrics</CardTitle>
                <CardDescription>
                  {isEditing ? "Live preview as you edit" : "Snapshot of your walk"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RouteMetrics
                  metrics={metrics}
                  pointCount={pointCount}
                  showPointCount
                  walkingSpeedMph={walkingSpeedMph}
                  showWalkingSpeed
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Route?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{route.name}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRoute}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Route"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type RouteDetailOverlaysProps = RouteMapRenderProps & {
  points: RoutePoint[];
};

function RouteDetailOverlays({ components, leaflet, points }: RouteDetailOverlaysProps) {
  if (points.length === 0) {
    return null;
  }

  const { Polyline, Marker, Tooltip, Pane } = components;
  const positions = points.map(
    (point) => [point.lat, point.lng] as LatLngExpression,
  );
  const markerIcons = points.map((_, index) =>
    createRoutePointIcon(leaflet, index, points.length),
  );

  return (
    <>
      <Pane name="route-path" style={{ zIndex: 360 }}>
        <Polyline
          positions={positions}
          pathOptions={{
            color: "#60a5fa",
            weight: 4,
            opacity: 0.85,
            dashArray: "6 8",
          }}
        />
      </Pane>
      <Pane name="route-points" style={{ zIndex: 380 }}>
        {points.map((point, index) => {
          const position: LatLngExpression = [point.lat, point.lng];
          const isStart = index === 0;
          const isEnd = index === points.length - 1 && points.length > 1;

          return (
            <Marker
              key={`${point.lat}-${point.lng}-${index}`}
              position={position}
              icon={markerIcons[index]}
              interactive={false}
            >
              <Tooltip offset={[0, 24]} direction="top">
                {isStart ? "Route start" : isEnd ? "Route end" : `Point ${index + 1}`}
              </Tooltip>
            </Marker>
          );
        })}
      </Pane>
    </>
  );
}

type RouteMissingProps = {
  id: Id<"routes">;
};

function RouteMissing({ id }: RouteMissingProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Route unavailable</h1>
          <p className="mt-3 text-muted-foreground">
            We couldn&apos;t find a route with the ID <span className="font-mono text-foreground">{String(id)}</span>.
            The route may have been deleted or never existed.
          </p>
          <div className="mt-6">
            <Link to="/">
              <Button>Return to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizePoint(point: RoutePoint): RoutePoint {
  return {
    ...point,
    lat: Number(point.lat.toFixed(6)),
    lng: Number(point.lng.toFixed(6)),
  };
}

async function ensurePointElevations(points: RoutePoint[]): Promise<RoutePoint[]> {
  if (points.length === 0 || typeof window === "undefined") {
    return points;
  }

  const tasks = points.map(async (point) => {
    if (point.elevation != null) {
      return point;
    }

    try {
      const elevation = await getElevationMeters(point.lat, point.lng);
      return { ...point, elevation: elevation ?? null };
    } catch (error) {
      console.error("Elevation lookup failed while saving route", error);
      return point;
    }
  });

  return Promise.all(tasks);
}
