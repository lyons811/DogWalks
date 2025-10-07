import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

export const listRoutes = query({
  args: {},
  handler: async (ctx) => {
    const routes = await ctx.db.query("routes").collect();

    return routes
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((route) => ({
        id: route._id,
        name: route.name,
        notes: route.notes,
        distance: route.distance,
        estimatedTime: route.estimatedTime,
        elevationGain: route.elevationGain,
        elevationLoss: route.elevationLoss,
        createdAt: route.createdAt,
        updatedAt: route.updatedAt,
        points: route.points,
      }));
  },
});

const exampleRoutes: Omit<Doc<"routes">, "_id" | "_creationTime">[] = [
  {
    name: "Ala Moana Sunrise Loop",
    notes: "Leisurely walk around Magic Island and Ala Moana Beach Park. Best just after sunrise.",
    points: [
      { lat: 21.288813, lng: -157.847722, elevation: 3 },
      { lat: 21.286739, lng: -157.846375, elevation: 2 },
      { lat: 21.285209, lng: -157.848706, elevation: 2 },
      { lat: 21.288012, lng: -157.85037, elevation: 3 },
      { lat: 21.289167, lng: -157.848566, elevation: 3 },
    ],
    distance: 3250, // meters (~2.0 mi)
    estimatedTime: 42, // minutes at brisk pace
    elevationGain: 18,
    elevationLoss: 18,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    name: "Manoa Valley Stroll",
    notes: "Shaded neighborhood walk with gentle climb up to the foothills before looping back.",
    points: [
      { lat: 21.313241, lng: -157.812708, elevation: 24 },
      { lat: 21.317074, lng: -157.808843, elevation: 62 },
      { lat: 21.320426, lng: -157.813168, elevation: 78 },
      { lat: 21.316291, lng: -157.816081, elevation: 38 },
    ],
    distance: 4100, // meters (~2.5 mi)
    estimatedTime: 58,
    elevationGain: 95,
    elevationLoss: 95,
    createdAt: 0,
    updatedAt: 0,
  },
];

export const seedExampleRoutes = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("routes").collect();

    if (existing.length > 0) {
      return { created: 0, skipped: true };
    }

    const now = Date.now();
    const inserted: string[] = [];

    for (const [index, route] of exampleRoutes.entries()) {
      const timestamp = now + index;
      const doc = {
        ...route,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const id = await ctx.db.insert("routes", doc);
      inserted.push(id.toString());
    }

    return { created: inserted.length, ids: inserted, skipped: false };
  },
});
