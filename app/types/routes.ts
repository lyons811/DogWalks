import type { Id } from "../../convex/_generated/dataModel";

export type RoutePoint = {
  lat: number;
  lng: number;
  elevation?: number | null;
};

export type RouteListItem = {
  id: Id<"routes">;
  name: string;
  notes?: string | null;
  distance: number;
  estimatedTime: number;
  elevationGain?: number | null;
  elevationLoss?: number | null;
  createdAt: number;
  updatedAt: number;
  points: RoutePoint[];
};

export type RouteDetail = RouteListItem;
