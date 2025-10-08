import { Fragment, useCallback, useMemo } from "react";
import type { LatLngBoundsExpression, LatLngExpression, LeafletEventHandlerFnMap } from "leaflet";
import type { RoutePoint } from "~/types/routes";
import { createRoutePointIcon } from "~/lib/leaflet-icons";
import { RouteMap, type RouteMapRenderProps } from "./RouteMap";

type RouteDrawingMapProps = {
  points: RoutePoint[];
  onAddPoint: (point: RoutePoint) => void;
  onUpdatePoint: (index: number, point: RoutePoint) => void;
  onRemovePoint: (index: number) => void;
  className?: string;
  center?: LatLngExpression;
  initialZoom?: number;
};

export function RouteDrawingMap({
  points,
  onAddPoint,
  onUpdatePoint,
  onRemovePoint,
  className,
  center,
  initialZoom,
}: RouteDrawingMapProps) {
  const renderOverlays = useCallback(
    (props: RouteMapRenderProps) => (
      <RouteDrawingOverlays
        {...props}
        points={points}
        onAddPoint={onAddPoint}
        onUpdatePoint={onUpdatePoint}
        onRemovePoint={onRemovePoint}
      />
    ),
    [onAddPoint, onRemovePoint, onUpdatePoint, points],
  );

  const { mapCenter, mapBounds } = useMemo(() => {
    if (points.length === 0) {
      return { mapCenter: center, mapBounds: undefined as LatLngBoundsExpression | undefined };
    }

    if (points.length === 1) {
      const onlyPoint = points[0];
      return {
        mapCenter: [onlyPoint.lat, onlyPoint.lng] as LatLngExpression,
        mapBounds: undefined as LatLngBoundsExpression | undefined,
      };
    }

    const boundsPoints = points.map(
      (point) => [point.lat, point.lng] as [number, number],
    ) as LatLngBoundsExpression;

    return { mapCenter: center, mapBounds: boundsPoints };
  }, [center, points]);

  const mapProps = {
    ...(mapCenter ? { center: mapCenter } : {}),
    ...(mapBounds ? { bounds: mapBounds } : {}),
    ...(initialZoom ? { zoom: initialZoom } : {}),
  };

  return (
    <div className="relative h-full">
      <RouteMap
        className={className}
        {...mapProps}
        renderOverlays={renderOverlays}
      />
      <div className="pointer-events-none absolute left-3 top-3 z-[400] rounded-md bg-background/85 px-3 py-2 text-xs font-medium shadow-lg shadow-background/30 backdrop-blur">
        <p className="text-muted-foreground">
          Click map to add points. Drag markers to adjust. Right-click or shift-click a marker to
          delete.
        </p>
      </div>
    </div>
  );
}

type RouteDrawingOverlaysProps = RouteMapRenderProps &
  Pick<
    RouteDrawingMapProps,
    "points" | "onAddPoint" | "onUpdatePoint" | "onRemovePoint"
  >;

function RouteDrawingOverlays({
  components,
  leaflet,
  points,
  onAddPoint,
  onUpdatePoint,
  onRemovePoint,
}: RouteDrawingOverlaysProps) {
  const { Polyline, Marker, Tooltip, Pane, useMapEvents } = components;
  useMapEvents({
    click: (event) => {
      const { lat, lng } = event.latlng;
      onAddPoint({ lat, lng });
    },
  });

  const markerIcons = useMemo(() => {
    return points.map((_, index) => createRoutePointIcon(leaflet, index, points.length));
  }, [leaflet, points]);

  const polylinePositions: LatLngExpression[] = useMemo(
    () => points.map((point) => [point.lat, point.lng] satisfies LatLngExpression),
    [points],
  );

  return (
    <Fragment>
      {points.length > 0 && (
        <Pane name="route-path" style={{ zIndex: 360 }}>
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: "#60a5fa",
              weight: 4,
              opacity: 0.85,
              dashArray: "6 8",
            }}
          />
        </Pane>
      )}
      <Pane name="route-points" style={{ zIndex: 380 }}>
        {points.map((point, index) => {
          const position: LatLngExpression = [point.lat, point.lng];
          const handlers: LeafletEventHandlerFnMap = {
            dragend: (event) => {
              const { lat, lng } = event.target.getLatLng();
              onUpdatePoint(index, { ...point, lat, lng });
            },
            contextmenu: (event) => {
              event.originalEvent.preventDefault();
              onRemovePoint(index);
            },
            click: (event) => {
              if (
                event.originalEvent.shiftKey ||
                event.originalEvent.metaKey ||
                event.originalEvent.ctrlKey
              ) {
                onRemovePoint(index);
              }
            },
          };

          const isStart = index === 0;
          const isEnd = index === points.length - 1 && points.length > 1;

          return (
            <Marker
              key={`${point.lat}-${point.lng}-${index}`}
              position={position}
              draggable
              icon={markerIcons[index]}
              eventHandlers={handlers}
              title={
                isStart
                  ? "Start point"
                  : isEnd
                    ? "End point"
                    : `Route point ${index + 1}`
              }
            >
              <Tooltip offset={[0, 24]} direction="top">
                {isStart
                  ? "Route start"
                  : isEnd
                    ? "Route end"
                    : `Point ${index + 1}`}
              </Tooltip>
            </Marker>
          );
        })}
      </Pane>
    </Fragment>
  );
}

export default RouteDrawingMap;
