import { Link } from "react-router";
import type { Route } from "./+types/_index";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dog Walks - Dashboard" },
    { name: "description", content: "Plan and track your dog walking routes" },
  ];
}

export default function Dashboard() {
  // TODO: Fetch routes from Convex in Phase 2
  const routes: any[] = [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Dog Walks</h1>
            <p className="text-muted-foreground mt-2">
              Plan and track your walking routes in Honolulu
            </p>
          </div>
          <Link to="/create">
            <Button size="lg">Create Route</Button>
          </Link>
        </div>

        {routes.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-2">No routes yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Get started by creating your first dog walking route. Draw your path on the map and
                save it for future reference.
              </p>
              <Link to="/create">
                <Button>Create Your First Route</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map((route) => (
              <Card key={route.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle>{route.name}</CardTitle>
                  <CardDescription>
                    {route.distance} mi · {route.estimatedTime} min
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(route.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
