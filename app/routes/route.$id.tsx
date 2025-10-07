import { Link, useParams } from "react-router";
import type { Route } from "./+types/route.$id";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Route ${params.id} - Dog Walks` },
    { name: "description", content: "View and edit your dog walking route" },
  ];
}

export default function RouteDetail() {
  const { id } = useParams();
  // TODO: Fetch route from Convex in Phase 4
  // TODO: Implement edit mode in Phase 6

  const isEditMode = false;

  // Mock data for now
  const route = {
    id,
    name: "Loading...",
    notes: "",
    distance: 0,
    estimatedTime: 0,
    elevationGain: 0,
    elevationLoss: 0,
    createdAt: Date.now(),
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/">
            <Button variant="outline" size="sm">
              ← Back to Dashboard
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              {isEditMode ? "Cancel Edit" : "Edit Route"}
            </Button>
            <Button variant="destructive" size="sm">
              Delete Route
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section - 2/3 width on large screens */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Route Map</CardTitle>
                <CardDescription>
                  {isEditMode ? "Click and drag to edit points" : "View your saved route"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* TODO: Map component will go here in Phase 4 */}
                <div className="h-[400px] bg-muted rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Map will be loaded here</p>
                </div>
              </CardContent>
            </Card>

            {/* Elevation Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Elevation Profile</CardTitle>
                <CardDescription>Elevation changes along your route</CardDescription>
              </CardHeader>
              <CardContent>
                {/* TODO: Elevation chart will go here in Phase 5 */}
                <div className="h-[200px] bg-muted rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Elevation chart will be loaded here</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Section - 1/3 width on large screens */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Route Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Route Name</Label>
                  <Input
                    id="name"
                    value={route.name}
                    disabled={!isEditMode}
                    placeholder="Route name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={route.notes}
                    disabled={!isEditMode}
                    placeholder="Add notes..."
                    rows={4}
                  />
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Created {new Date(route.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {isEditMode && (
                  <Button className="w-full">Save Changes</Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Route Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Distance</span>
                  <span className="font-semibold">{route.distance.toFixed(2)} mi</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Est. Time</span>
                  <span className="font-semibold">{route.estimatedTime} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Elevation Gain</span>
                  <span className="font-semibold">{route.elevationGain} ft</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Elevation Loss</span>
                  <span className="font-semibold">{route.elevationLoss} ft</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
