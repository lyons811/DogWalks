import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/create";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { RoutePoint } from "~/types/routes";
import { RouteDrawingMap } from "~/components/RouteDrawingMap";
import {
  RouteForm,
  type RouteFormErrors,
  type RouteFormValues,
} from "~/components/RouteForm";
import { RouteMetrics } from "~/components/RouteMetrics";
import { calculateRouteMetrics } from "~/lib/route-calculations";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create Route - Dog Walks" },
    { name: "description", content: "Create a new dog walking route" },
  ];
}

export default function CreateRoute() {
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [formValues, setFormValues] = useState<RouteFormValues>({ name: "", notes: "" });
  const [formErrors, setFormErrors] = useState<RouteFormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const createRouteMutation = useMutation(api.routes.createRoute);
  const navigate = useNavigate();

  const metrics = useMemo(() => calculateRouteMetrics(points), [points]);
  const pointCount = points.length;
  const hasRoute = pointCount > 0;
  const canSave = pointCount >= 2 && formValues.name.trim().length > 0 && !isSaving;

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

  const handleAddPoint = useCallback((point: RoutePoint) => {
    setPoints((prev) => [...prev, normalizePoint(point)]);
    setError(null);
  }, []);

  const handleUpdatePoint = useCallback((index: number, updated: RoutePoint) => {
    setPoints((prev) =>
      prev.map((point, pointIndex) =>
        pointIndex === index ? { ...point, ...normalizePoint(updated) } : point,
      ),
    );
    setError(null);
  }, []);

  const handleRemovePoint = useCallback((index: number) => {
    setPoints((prev) => prev.filter((_, pointIndex) => pointIndex !== index));
    setError(null);
  }, []);

  const handleClearPoints = useCallback(() => {
    setPoints([]);
    setError(null);
  }, []);

  const handleSaveRoute = useCallback(async () => {
    const trimmedName = formValues.name.trim();

    if (trimmedName.length === 0) {
      setFormErrors({ name: "Please enter a route name." });
      setError("Add a route name and at least two points before saving.");
      return;
    }

    if (pointCount < 2) {
      setError("Add at least two points before saving.");
      return;
    }

    const trimmedNotes = formValues.notes.trim();

    setFormErrors({});
    setError(null);
    setIsSaving(true);

    try {
      const serializedPoints = points.map((point) => {
        const { elevation, ...rest } = point;
        return elevation == null ? rest : { ...rest, elevation };
      });

      const newRouteId = await createRouteMutation({
        name: trimmedName,
        notes: trimmedNotes.length > 0 ? trimmedNotes : undefined,
        points: serializedPoints,
        distance: metrics.distanceMeters,
        estimatedTime: metrics.estimatedMinutes,
        elevationGain: metrics.elevationGainMeters ?? undefined,
        elevationLoss: metrics.elevationLossMeters ?? undefined,
      });

      navigate(`/route/${newRouteId}`);
    } catch (saveError) {
      console.error("Failed to save route", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save route. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    createRouteMutation,
    formValues.name,
    formValues.notes,
    metrics.distanceMeters,
    metrics.elevationGainMeters,
    metrics.elevationLossMeters,
    metrics.estimatedMinutes,
    navigate,
    pointCount,
    points,
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Link to="/">
            <Button variant="outline" size="sm">
              {"<-"} Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Draw Your Route</CardTitle>
                  <CardDescription>Click on the map to add points to your route</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearPoints}
                  disabled={!hasRoute || isSaving}
                >
                  Clear Points
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-[500px]">
                  <RouteDrawingMap
                    className="h-full"
                    points={points}
                    onAddPoint={handleAddPoint}
                    onUpdatePoint={handleUpdatePoint}
                    onRemovePoint={handleRemovePoint}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Route Details</CardTitle>
                <CardDescription>Add information about this route</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RouteForm
                  values={formValues}
                  onChange={handleFormChange}
                  errors={formErrors}
                  disabled={isSaving}
                />

                <div className="border-t pt-4">
                  <h3 className="mb-3 text-sm font-semibold">Route Metrics</h3>
                  <RouteMetrics
                    metrics={metrics}
                    pointCount={pointCount}
                    showPointCount
                  />
                  <p className="mt-3 text-xs text-muted-foreground">
                    Metrics update automatically as you draw.
                  </p>
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <div className="space-y-2 pt-2">
                  <Button
                    className="w-full"
                    onClick={handleSaveRoute}
                    disabled={!canSave}
                  >
                    {isSaving ? "Saving..." : "Save Route"}
                  </Button>
                  <Link to="/" className="block">
                    <Button variant="outline" className="w-full" disabled={isSaving}>
                      Cancel
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
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
