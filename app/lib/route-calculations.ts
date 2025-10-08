import type { RoutePoint } from "~/types/routes";
import { haversineDistanceMeters, totalDistanceMeters } from "./distance";

const METERS_PER_MILE = 1609.344;
const MINUTES_PER_HOUR = 60;
const DEFAULT_WALKING_SPEED_MPH = 3;
const MIN_ELEVATION_SEGMENT_DELTA_METERS = 0.5;

export type RouteMetrics = {
  distanceMeters: number;
  estimatedMinutes: number;
  elevationGainMeters?: number;
  elevationLossMeters?: number;
};

type CalculateMetricsOptions = {
  walkingSpeedMph?: number;
  elevationGainMeters?: number;
  elevationLossMeters?: number;
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

  const elevation = options.elevationGainMeters !== undefined || options.elevationLossMeters !== undefined
    ? {
        gain: options.elevationGainMeters,
        loss: options.elevationLossMeters,
      }
    : calculateElevationChange(points);

  return {
    distanceMeters,
    estimatedMinutes,
    elevationGainMeters: elevation.gain,
    elevationLossMeters: elevation.loss,
  };
}

export function combineMetrics(
  base: RouteMetrics,
  overrides: Partial<RouteMetrics>,
): RouteMetrics {
  return {
    distanceMeters: overrides.distanceMeters ?? base.distanceMeters,
    estimatedMinutes: overrides.estimatedMinutes ?? base.estimatedMinutes,
    elevationGainMeters: overrides.elevationGainMeters ?? base.elevationGainMeters,
    elevationLossMeters: overrides.elevationLossMeters ?? base.elevationLossMeters,
  };
}

function normalizeElevation(value: RoutePoint["elevation"]): number | undefined {
  if (value == null || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
}

type ElevationTotals = { gain?: number; loss?: number };

function calculateElevationChange(points: RoutePoint[]): ElevationTotals {
  if (points.length < 2) {
    return {};
  }

  let gain = 0;
  let loss = 0;
  let hasValidSegment = false;

  for (let index = 1; index < points.length; index += 1) {
    const previousElevation = normalizeElevation(points[index - 1]?.elevation);
    const currentElevation = normalizeElevation(points[index]?.elevation);

    if (previousElevation === undefined || currentElevation === undefined) {
      continue;
    }

    const delta = currentElevation - previousElevation;

    if (Math.abs(delta) < MIN_ELEVATION_SEGMENT_DELTA_METERS) {
      hasValidSegment = true;
      continue;
    }

    if (delta > 0) {
      gain += delta;
    } else if (delta < 0) {
      loss += Math.abs(delta);
    }
    hasValidSegment = true;
  }

  if (!hasValidSegment) {
    return {};
  }

  return {
    gain,
    loss,
  };
}

export type ElevationProfilePoint = {
  distanceMeters: number;
  elevationMeters: number;
};

export function buildElevationProfile(points: RoutePoint[]): ElevationProfilePoint[] {
  if (points.length === 0) {
    return [];
  }

  const profile: ElevationProfilePoint[] = [];
  let cumulativeDistance = 0;
  let previousWithElevation: RoutePoint | null = null;

  for (const point of points) {
    const elevation = normalizeElevation(point.elevation);

    if (elevation === undefined) {
      continue;
    }

    if (previousWithElevation) {
      cumulativeDistance += haversineDistanceMeters(previousWithElevation, point);
    }

    profile.push({
      distanceMeters: cumulativeDistance,
      elevationMeters: elevation,
    });

    previousWithElevation = point;
  }

  return profile;
}
