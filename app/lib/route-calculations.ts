import type { RoutePoint } from "~/types/routes";
import { totalDistanceMeters } from "./distance";

const METERS_PER_MILE = 1609.344;
const MINUTES_PER_HOUR = 60;
const DEFAULT_WALKING_SPEED_MPH = 3;

export type RouteMetrics = {
  distanceMeters: number;
  estimatedMinutes: number;
  elevationGainMeters?: number | null;
  elevationLossMeters?: number | null;
};

type CalculateMetricsOptions = {
  walkingSpeedMph?: number;
  elevationGainMeters?: number | null;
  elevationLossMeters?: number | null;
};

export function calculateRouteMetrics(
  points: RoutePoint[],
  options: CalculateMetricsOptions = {},
): RouteMetrics {
  const distanceMeters = totalDistanceMeters(points);
  const walkingSpeedMph = options.walkingSpeedMph ?? DEFAULT_WALKING_SPEED_MPH;

  const distanceMiles = distanceMeters / METERS_PER_MILE;
  const estimatedMinutes = distanceMiles <= 0 || walkingSpeedMph <= 0
    ? 0
    : (distanceMiles / walkingSpeedMph) * MINUTES_PER_HOUR;

  return {
    distanceMeters,
    estimatedMinutes,
    elevationGainMeters: options.elevationGainMeters ?? null,
    elevationLossMeters: options.elevationLossMeters ?? null,
  };
}

export function combineMetrics(
  base: RouteMetrics,
  overrides: Partial<RouteMetrics>,
): RouteMetrics {
  return {
    distanceMeters: overrides.distanceMeters ?? base.distanceMeters,
    estimatedMinutes: overrides.estimatedMinutes ?? base.estimatedMinutes,
    elevationGainMeters: overrides.elevationGainMeters ?? base.elevationGainMeters ?? null,
    elevationLossMeters: overrides.elevationLossMeters ?? base.elevationLossMeters ?? null,
  };
}
