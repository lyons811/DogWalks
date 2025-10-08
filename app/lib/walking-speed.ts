import { useEffect, useState } from "react";

const STORAGE_KEY = "dogwalks_walking_speed_mph";
export const DEFAULT_WALKING_SPEED_MPH = 3.0;
export const MIN_WALKING_SPEED_MPH = 0.5;
export const MAX_WALKING_SPEED_MPH = 6.0;

/**
 * Get the current walking speed from localStorage.
 * Falls back to the default if not set or invalid.
 */
export function getWalkingSpeedMph(): number {
  if (typeof window === "undefined") {
    return DEFAULT_WALKING_SPEED_MPH;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      return DEFAULT_WALKING_SPEED_MPH;
    }

    const parsed = Number.parseFloat(stored);
    if (!Number.isFinite(parsed) || parsed < MIN_WALKING_SPEED_MPH || parsed > MAX_WALKING_SPEED_MPH) {
      return DEFAULT_WALKING_SPEED_MPH;
    }

    return parsed;
  } catch {
    return DEFAULT_WALKING_SPEED_MPH;
  }
}

/**
 * Save the walking speed to localStorage.
 */
export function setWalkingSpeedMph(speedMph: number): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const clamped = Math.max(MIN_WALKING_SPEED_MPH, Math.min(MAX_WALKING_SPEED_MPH, speedMph));
    window.localStorage.setItem(STORAGE_KEY, clamped.toString());
  } catch (error) {
    console.error("Failed to save walking speed to localStorage", error);
  }
}

/**
 * React hook to get and set walking speed with localStorage sync.
 */
export function useWalkingSpeed(): [number, (speed: number) => void] {
  const [speed, setSpeed] = useState<number>(getWalkingSpeedMph);

  useEffect(() => {
    // Re-sync on mount in case localStorage changed in another tab
    const current = getWalkingSpeedMph();
    if (current !== speed) {
      setSpeed(current);
    }
  }, [speed]);

  const updateSpeed = (newSpeed: number) => {
    setWalkingSpeedMph(newSpeed);
    setSpeed(newSpeed);
  };

  return [speed, updateSpeed];
}
