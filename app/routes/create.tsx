import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/create";
import { RouteDrawingMap } from "~/components/RouteDrawingMap";
import type { RoutePoint } from "~/types/routes";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create Route - Dog Walks" },
    { name: "description", content: "Create a new dog walking route" },
  ];
}

export default function CreateRoute() {
  const [points, setPoints] = useState<RoutePoint[]>([]);

  const handleAddPoint = useCallback((point: RoutePoint) => {
    setPoints((prev) => [...prev, normalizePoint(point)]);
  }, []);

  const handleUpdatePoint = useCallback((index: number, updated: RoutePoint) => {
    setPoints((prev) =>
      prev.map((point, pointIndex) =>
        pointIndex === index ? { ...point, ...normalizePoint(updated) } : point,
      ),
    );
  }, []);

  const handleRemovePoint = useCallback((index: number) => {
    setPoints((prev) => prev.filter((_, pointIndex) => pointIndex !== index));
  }, []);

  const handleClearPoints = useCallback(() => {
    setPoints([]);
  }, []);

  const { distanceMiles, estimatedMinutes, elevationGainFeet } = useMemo(() => {
    const pointCount = points.length;
    if (pointCount < 2) {
      return { distanceMiles: 0, estimatedMinutes: 0, elevationGainFeet: 0 };
    }

    const segmentCount = pointCount - 1;
    const miles = segmentCount * 0.2;
    const minutes = Math.round(miles * 20);
    const elevation = segmentCount * 35;

    return {
      distanceMiles: Number(miles.toFixed(2)),
      estimatedMinutes: minutes,
      elevationGainFeet: elevation,
    };
  }, [points]);

  const distanceDisplay = useMemo(() => {
    if (!Number.isFinite(distanceMiles) || distanceMiles <= 0) {
      return "0.00 mi";
    }

    const precision = distanceMiles >= 10 ? 1 : 2;
    return `${distanceMiles.toFixed(precision)} mi`;
  }, [distanceMiles]);

  const timeDisplay = useMemo(() => {
    if (!Number.isFinite(estimatedMinutes) || estimatedMinutes <= 0) {
      return "0 min";
    }
    return `${estimatedMinutes} min`;
  }, [estimatedMinutes]);

  const elevationDisplay = useMemo(() => {
    if (!Number.isFinite(elevationGainFeet) || elevationGainFeet <= 0) {
      return "0 ft";
    }
    return `${elevationGainFeet} ft`;
  }, [elevationGainFeet]);

  const hasRoute = points.length > 0;

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
                  disabled={!hasRoute}
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
                <div className="space-y-2">
                  <Label htmlFor="name">Route Name</Label>
                  <Input id="name" placeholder="e.g., Morning Beach Walk" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea id="notes" placeholder="Add notes about this route..." rows={4} />
                </div>

                <div className="border-t pt-4">
                  <h3 className="mb-3 text-sm font-semibold">Route Metrics</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distance:</span>
                      <span className="font-medium">{distanceDisplay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Est. Time:</span>
                      <span className="font-medium">{timeDisplay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Elevation Gain:</span>
                      <span className="font-medium">{elevationDisplay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Route Points:</span>
                      <span className="font-medium">{points.length}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Metrics update as you draw. These values are placeholders until Phase 4 adds real
                    calculations.
                  </p>
                </div>

                <div className="space-y-2 pt-4">
                  <Button className="w-full" disabled>
                    Save Route
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Route saving arrives in Phase 4.
                  </p>
                  <Link to="/" className="block">
                    <Button variant="outline" className="w-full">
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
