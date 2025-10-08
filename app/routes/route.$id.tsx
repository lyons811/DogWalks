import { useCallback, useMemo } from "react";
import { ConvexHttpClient } from "convex/browser";
import { useQuery } from "convex/react";
import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/route.$id";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import type { RouteDetail, RoutePoint } from "~/types/routes";
import { RouteForm, type RouteFormValues } from "~/components/RouteForm";
import { RouteMetrics } from "~/components/RouteMetrics";
import { RouteMap, type RouteMapRenderProps } from "~/components/RouteMap";
import { createRoutePointIcon } from "~/lib/leaflet-icons";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";

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

  if (liveRoute === null) {
    return <RouteMissing id={initialRoute.id} />;
  }

  const route = (liveRoute ?? initialRoute) as RouteDetail;
  const readOnlyFormChange = useCallback((values: RouteFormValues) => {
    void values;
  }, []);
  const pointCount = route.points.length;

  const mapBounds = useMemo<LatLngBoundsExpression | undefined>(() => {
    if (route.points.length < 2) {
      return undefined;
    }
    return route.points.map(
      (point) => [point.lat, point.lng] as [number, number],
    ) as LatLngBoundsExpression;
  }, [route.points]);

  const mapCenter = useMemo<LatLngExpression | undefined>(() => {
    if (route.points.length === 1) {
      const onlyPoint = route.points[0];
      return [onlyPoint.lat, onlyPoint.lng] as LatLngExpression;
    }
    return undefined;
  }, [route.points]);

  const renderOverlays = useCallback(
    (props: RouteMapRenderProps) => (
      <RouteDetailOverlays {...props} points={route.points} />
    ),
    [route.points],
  );

  const metrics = useMemo(
    () => ({
      distanceMeters: route.distance,
      estimatedMinutes: route.estimatedTime,
      elevationGainMeters: route.elevationGain ?? undefined,
      elevationLossMeters: route.elevationLoss ?? undefined,
    }),
    [route.distance, route.estimatedTime, route.elevationGain, route.elevationLoss],
  );

  const formValues = useMemo(
    () => ({
      name: route.name,
      notes: route.notes ?? "",
    }),
    [route.name, route.notes],
  );

  const createdDate = dateFormatter.format(new Date(route.createdAt));
  const updatedDate =
    route.updatedAt !== route.createdAt
      ? dateFormatter.format(new Date(route.updatedAt))
      : null;

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
              <h1 className="text-3xl font-semibold tracking-tight">{route.name}</h1>
              <p className="text-sm text-muted-foreground">
                Created {createdDate}
                {updatedDate ? ` • Updated ${updatedDate}` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled title="Editing arrives in Phase 6">
              Edit Route
            </Button>
            <Button variant="destructive" size="sm" disabled title="Delete arrives in Phase 6">
              Delete Route
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Route Map</CardTitle>
                <CardDescription>View your saved route on the map</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <RouteMap
                    className="h-full"
                    bounds={mapBounds}
                    center={mapCenter}
                    renderOverlays={renderOverlays}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Elevation Profile</CardTitle>
                <CardDescription>Elevation insights arrive in Phase 5</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
                  Elevation charts will display here in the next phase.
                </div>
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
                  values={formValues}
                  onChange={readOnlyFormChange}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Editing routes will be enabled in Phase 6.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Route Metrics</CardTitle>
                <CardDescription>Snapshot of your walk</CardDescription>
              </CardHeader>
              <CardContent>
                <RouteMetrics
                  metrics={metrics}
                  pointCount={pointCount}
                  showPointCount
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
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
