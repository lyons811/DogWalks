const METERS_PER_MILE = 1609.344;
const METERS_TO_FEET = 3.28084;

const feetFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function formatDistanceMeters(distanceMeters: number): string {
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    return "0.00 mi";
  }

  const miles = distanceMeters / METERS_PER_MILE;
  const precision = miles >= 10 ? 1 : 2;
  return `${miles.toFixed(precision)} mi`;
}

export function formatDurationMinutes(minutes: number): string {
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

export function formatElevationMeters(elevationMeters?: number | null): string {
  if (!Number.isFinite(elevationMeters ?? NaN) || (elevationMeters ?? 0) <= 0) {
    return "0 ft";
  }

  const feet = (elevationMeters ?? 0) * METERS_TO_FEET;
  return `${feetFormatter.format(feet)} ft`;
}
