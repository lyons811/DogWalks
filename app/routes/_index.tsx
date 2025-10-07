import { ConvexHttpClient } from "convex/browser";
import { useQuery } from "convex/react";
import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/_index";
import { RouteList } from "~/components/RouteList";
import type { RouteListItem } from "~/types/routes";
import { api } from "../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dog Walks - Dashboard" },
    { name: "description", content: "Plan and track your dog walking routes" },
  ];
}

export async function loader() {
  const convexUrl = import.meta.env.VITE_CONVEX_URL;

  if (!convexUrl) {
    throw new Error("VITE_CONVEX_URL is not defined");
  }

  const client = new ConvexHttpClient(convexUrl);
  let routes = await client.query(api.routes.listRoutes, {});

  if (!routes || routes.length === 0) {
    await client.mutation(api.routes.seedExampleRoutes, {});
    routes = await client.query(api.routes.listRoutes, {});
  }

  return { routes };
}

export default function Dashboard() {
  const { routes: initialRoutes } = useLoaderData<typeof loader>();
  const skipQuery = typeof window === "undefined";
  const liveRoutes = useQuery(api.routes.listRoutes, skipQuery ? "skip" : undefined);
  const routes: RouteListItem[] = (liveRoutes ?? initialRoutes) ?? [];
  const hasRoutes = routes.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Dog Walks</h1>
            <p className="mt-2 text-muted-foreground">
              Plan and track your walking routes in Honolulu
            </p>
          </div>
          <Link to="/create">
            <Button size="lg">Create Route</Button>
          </Link>
        </div>

        {!hasRoutes ? (
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
              <h2 className="mb-2 text-2xl font-semibold">No routes yet</h2>
              <p className="mb-6 max-w-md text-muted-foreground">
                Get started by creating your first dog walking route. Draw your path on the map and
                save it for future reference.
              </p>
              <Link to="/create">
                <Button>Create Your First Route</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <RouteList routes={routes} />
        )}
      </div>
    </div>
  );
}
