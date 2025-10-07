import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import type { RouteListItem } from "~/types/routes";

type RouteCardProps = {
  route: RouteListItem;
};

const distanceFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDistance(distanceMeters: number) {
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    return "0.00 mi";
  }
  const miles = distanceMeters / 1609.344;
  const formatted = miles >= 10 ? miles.toFixed(1) : miles.toFixed(2);
  return `${formatted} mi`;
}

function formatDuration(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "0 min";
  }

  const totalMinutes = Math.round(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours === 0) {
    return `${totalMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} hr${hours > 1 ? "s" : ""}`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

function formatElevation(elevationMeters?: number | null) {
  if (!Number.isFinite(elevationMeters ?? NaN) || (elevationMeters ?? 0) <= 0) {
    return "0 ft";
  }
  const feet = (elevationMeters ?? 0) * 3.28084;
  return `${distanceFormatter.format(feet)} ft`;
}

export function RouteCard({ route }: RouteCardProps) {
  const createdDate = dateFormatter.format(new Date(route.createdAt));
  const distance = formatDistance(route.distance);
  const duration = formatDuration(route.estimatedTime);
  const elevationGain = formatElevation(route.elevationGain);

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
