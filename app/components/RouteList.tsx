import { RouteCard } from "./RouteCard";
import type { RouteListItem } from "~/types/routes";

type RouteListProps = {
  routes: RouteListItem[];
};

export function RouteList({ routes }: RouteListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {routes.map((route) => (
        <RouteCard key={route.id} route={route} />
      ))}
    </div>
  );
}
