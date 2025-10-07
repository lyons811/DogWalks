import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("create", "routes/create.tsx"),
  route("route/:id", "routes/route.$id.tsx"),
] satisfies RouteConfig;
