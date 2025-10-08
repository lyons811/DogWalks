import { cn } from "~/lib/utils";
import type { RouteMetrics as RouteMetricsData } from "~/lib/route-calculations";
import { formatDistanceMeters, formatDurationMinutes, formatElevationMeters } from "~/lib/format";

type RouteMetricsProps = {
  metrics: RouteMetricsData;
  pointCount?: number;
  showPointCount?: boolean;
  className?: string;
};

export function RouteMetrics({
  metrics,
  pointCount,
  showPointCount = false,
  className,
}: RouteMetricsProps) {
  const items = [
    {
      label: "Distance",
      value: formatDistanceMeters(metrics.distanceMeters),
    },
    {
      label: "Est. Time",
      value: formatDurationMinutes(metrics.estimatedMinutes),
    },
  ];

  if (metrics.elevationGainMeters !== undefined) {
    items.push({
      label: "Elevation Gain",
      value: formatElevationMeters(metrics.elevationGainMeters),
    });
  }

  if (metrics.elevationLossMeters !== undefined) {
    items.push({
      label: "Elevation Loss",
      value: formatElevationMeters(metrics.elevationLossMeters),
    });
  }

  if (showPointCount) {
    items.push({
      label: "Route Points",
      value: String(pointCount ?? 0),
    });
  }

  return (
    <dl className={cn("space-y-2 text-sm", className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between">
          <dt className="text-muted-foreground">{item.label}:</dt>
          <dd className="font-medium text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default RouteMetrics;
