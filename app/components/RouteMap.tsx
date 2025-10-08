import { useEffect, useMemo, useState } from "react";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

import "leaflet/dist/leaflet.css";

type ReactLeafletModule = typeof import("react-leaflet");
type LeafletLib = typeof import("leaflet");

export type RouteMapOverlayComponents = {
  MapContainer: ReactLeafletModule["MapContainer"];
  TileLayer: ReactLeafletModule["TileLayer"];
  Polyline: ReactLeafletModule["Polyline"];
  Marker: ReactLeafletModule["Marker"];
  Tooltip: ReactLeafletModule["Tooltip"];
  Pane: ReactLeafletModule["Pane"];
  useMap: ReactLeafletModule["useMap"];
  useMapEvents: ReactLeafletModule["useMapEvents"];
};

export type RouteMapRenderProps = {
  components: RouteMapOverlayComponents;
  leaflet: LeafletLib;
};

export type RouteMapProps = {
  center?: LatLngExpression;
  bounds?: LatLngBoundsExpression;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
  scrollWheelZoom?: boolean;
  doubleClickZoom?: boolean;
  renderOverlays?: (props: RouteMapRenderProps) => ReactNode;
};

const DEFAULT_CENTER: LatLngExpression = [21.3099, -157.8581];
const DEFAULT_ZOOM = 13;

type LoadedModules = {
  components: RouteMapOverlayComponents;
  leaflet: LeafletLib;
};

export function RouteMap({
  center = DEFAULT_CENTER,
  bounds,
  zoom = DEFAULT_ZOOM,
  minZoom = 3,
  maxZoom = 19,
  className,
  scrollWheelZoom = true,
  doubleClickZoom = false,
  renderOverlays,
}: RouteMapProps) {
  const [loaded, setLoaded] = useState<LoadedModules | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaflet() {
      const [{ MapContainer, TileLayer, Polyline, Marker, Tooltip, Pane, useMap, useMapEvents }, leaflet] =
        await Promise.all([import("react-leaflet"), import("leaflet")]);

      // Configure default Leaflet marker icons to avoid broken image URLs.
      const iconRetinaUrl = new URL(
        "leaflet/dist/images/marker-icon-2x.png",
        import.meta.url,
      ).toString();
      const iconUrl = new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString();
      const shadowUrl = new URL(
        "leaflet/dist/images/marker-shadow.png",
        import.meta.url,
      ).toString();

      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl,
        iconUrl,
        shadowUrl,
      });

      if (!cancelled) {
        setLoaded({
          components: {
            MapContainer,
            TileLayer,
            Polyline,
            Marker,
            Tooltip,
            Pane,
            useMap,
            useMapEvents,
          },
          leaflet,
        });
      }
    }

    loadLeaflet().catch((error) => {
      console.error("Failed to load Leaflet", error);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const fallback = useMemo(
    () => (
      <div
        className={cn(
          "relative h-full min-h-[300px] w-full overflow-hidden rounded-md border border-border/50 bg-muted/20",
          "flex items-center justify-center text-sm text-muted-foreground/70",
          className,
        )}
      >
        Loading map...
      </div>
    ),
    [className],
  );

  if (!loaded) {
    return fallback;
  }

  const { components, leaflet } = loaded;
  const { MapContainer, TileLayer } = components;

  return (
    <div
      className={cn(
        "relative h-full min-h-[300px] w-full overflow-hidden rounded-md border border-border/50 bg-muted/20",
        className,
      )}
    >
      <MapContainer
        center={center}
        bounds={bounds}
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        scrollWheelZoom={scrollWheelZoom}
        doubleClickZoom={doubleClickZoom}
        className="h-full w-full leaflet-dark"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {renderOverlays?.({ components, leaflet })}
      </MapContainer>
    </div>
  );
}

export default RouteMap;
