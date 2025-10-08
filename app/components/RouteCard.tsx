import { Link } from "react-router";
import type { RouteListItem } from "~/types/routes";
import { formatDistanceMeters, formatDurationMinutes, formatElevationMeters } from "~/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

type RouteCardProps = {
  route: RouteListItem;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function RouteCard({ route }: RouteCardProps) {
  const createdDate = dateFormatter.format(new Date(route.createdAt));
  const distance = formatDistanceMeters(route.distance);
  const duration = formatDurationMinutes(route.estimatedTime);
  const elevationGain = formatElevationMeters(route.elevationGain);

  return (
    <Link
      to={`/route/${route.id}`}
      className="no-underline transition-transform duration-150 hover:-translate-y-1"
    >
      <Card className="h-full border-border/80 hover:border-primary/60 hover:bg-accent/30">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{route.name}</CardTitle>
          <CardDescription className="text-xs uppercase tracking-wide">
            Created {createdDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{distance}</span>
            <span className="mx-2 text-muted-foreground" aria-hidden="true">
              |
            </span>
            <span>{duration}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="uppercase tracking-wide">Elevation Gain</span>
            <span className="font-medium text-foreground">{elevationGain}</span>
          </div>

          {route.notes && (
            <p className="line-clamp-3 text-sm text-muted-foreground">{route.notes}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
