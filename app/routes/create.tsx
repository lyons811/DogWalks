import { Link } from "react-router";
import type { Route } from "./+types/create";
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
  // TODO: Implement map and route drawing in Phase 3
  // TODO: Implement route saving in Phase 4

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Link to="/">
            <Button variant="outline" size="sm">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section - 2/3 width on large screens */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Draw Your Route</CardTitle>
                <CardDescription>Click on the map to add points to your route</CardDescription>
              </CardHeader>
              <CardContent>
                {/* TODO: Map component will go here in Phase 3 */}
                <div className="h-[500px] bg-muted rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Map will be loaded here</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Section - 1/3 width on large screens */}
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
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this route..."
                    rows={4}
                  />
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold mb-3">Route Metrics</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distance:</span>
                      <span className="font-medium">0.00 mi</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Est. Time:</span>
                      <span className="font-medium">0 min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Elevation Gain:</span>
                      <span className="font-medium">0 ft</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <Button className="w-full" disabled>
                    Save Route
                  </Button>
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
