import { useEffect, useMemo, useState } from "react";
import type { ElevationProfilePoint } from "~/lib/route-calculations";
import { cn } from "~/lib/utils";
import { formatDistanceMeters, formatElevationMeters } from "~/lib/format";

const METERS_PER_MILE = 1609.344;
const METERS_TO_FEET = 3.28084;

type RechartsModule = typeof import("recharts");

type LoadedRecharts = {
  ResponsiveContainer: RechartsModule["ResponsiveContainer"];
  AreaChart: RechartsModule["AreaChart"];
  Area: RechartsModule["Area"];
  Tooltip: RechartsModule["Tooltip"];
  XAxis: RechartsModule["XAxis"];
  YAxis: RechartsModule["YAxis"];
  CartesianGrid: RechartsModule["CartesianGrid"];
};

type ElevationChartProps = {
  profile: ElevationProfilePoint[];
  className?: string;
};

type ChartPoint = {
  distanceMiles: number;
  elevationFeet: number;
};

export function ElevationChart({ profile, className }: ElevationChartProps) {
  const [recharts, setRecharts] = useState<LoadedRecharts | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRecharts() {
      try {
        const module = await import("recharts");
        if (cancelled) {
          return;
        }
        setRecharts({
          ResponsiveContainer: module.ResponsiveContainer,
          AreaChart: module.AreaChart,
          Area: module.Area,
          Tooltip: module.Tooltip,
          XAxis: module.XAxis,
          YAxis: module.YAxis,
          CartesianGrid: module.CartesianGrid,
        });
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error : new Error("Failed to load chart module"));
        }
      }
    }

    loadRecharts();

    return () => {
      cancelled = true;
    };
  }, []);

  const chartPoints = useMemo<ChartPoint[]>(() => {
    if (profile.length === 0) {
      return [];
    }

    return profile.map((point) => ({
      distanceMiles: point.distanceMeters / METERS_PER_MILE,
      elevationFeet: point.elevationMeters * METERS_TO_FEET,
    }));
  }, [profile]);

  const hasRenderableProfile = chartPoints.length >= 2;

  if (!hasRenderableProfile) {
    return (
      <ChartPlaceholder className={className}>
        {loadError
          ? "Elevation data is unavailable for this route."
          : "Elevation data will appear once the route includes measured points."}
      </ChartPlaceholder>
    );
  }

  if (!recharts) {
    return (
      <ChartPlaceholder className={className}>
        {loadError ? "Unable to load chart visualization." : "Loading elevation profile..."}
      </ChartPlaceholder>
    );
  }

  if (loadError) {
    return (
      <ChartPlaceholder className={className}>
        Unable to load chart visualization.
      </ChartPlaceholder>
    );
  }

  const { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid } = recharts;

  return (
    <div className={cn("h-[240px] w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartPoints} margin={{ top: 12, right: 16, bottom: 12, left: 0 }}>
          <defs>
            <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.75} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.25)" />
          <XAxis
            dataKey="distanceMiles"
            stroke="rgba(148, 163, 184, 0.7)"
            tick={{ fill: "rgba(148, 163, 184, 0.85)", fontSize: 12 }}
            tickFormatter={(value: number) => formatDistanceMeters(value * METERS_PER_MILE)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="rgba(148, 163, 184, 0.7)"
            tick={{ fill: "rgba(148, 163, 184, 0.85)", fontSize: 12 }}
            tickFormatter={(value: number) => formatElevationMeters(value / METERS_TO_FEET)}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            cursor={{ stroke: "rgba(94, 234, 212, 0.4)", strokeWidth: 1 }}
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              borderColor: "rgba(148, 163, 184, 0.35)",
              borderRadius: 8,
              color: "#f8fafc",
            }}
            labelFormatter={(value: number) => `Distance: ${formatDistanceMeters(value * METERS_PER_MILE)}`}
            formatter={(value: number) => [`${formatElevationMeters(value / METERS_TO_FEET)}`, "Elevation"]}
          />
          <Area
            type="monotone"
            dataKey="elevationFeet"
            stroke="#38bdf8"
            strokeWidth={2}
            fill="url(#elevationGradient)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

type ChartPlaceholderProps = {
  className?: string;
  children: string;
};

function ChartPlaceholder({ className, children }: ChartPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex h-[240px] w-full items-center justify-center rounded-md border border-dashed border-border/70 bg-muted/20 px-4 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default ElevationChart;
