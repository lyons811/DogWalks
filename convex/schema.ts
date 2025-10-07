import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  routes: defineTable({
    name: v.string(),
    notes: v.optional(v.string()),
    points: v.array(
      v.object({
        lat: v.float64(),
        lng: v.float64(),
        elevation: v.optional(v.float64()),
      }),
    ),
    distance: v.float64(),
    estimatedTime: v.float64(),
    elevationGain: v.optional(v.float64()),
    elevationLoss: v.optional(v.float64()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }).index("by_createdAt", ["createdAt"]),
});
