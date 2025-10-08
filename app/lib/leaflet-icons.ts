type LeafletLib = typeof import("leaflet");

export function createRoutePointIcon(
  leaflet: LeafletLib,
  index: number,
  total: number,
) {
  const isStart = index === 0;
  const isEnd = index === total - 1 && total > 1;
  const variant = isStart ? "start" : isEnd ? "end" : "mid";
  const label = index + 1;

  return leaflet.divIcon({
    className: `route-point-icon route-point-icon--${variant}`,
    html: `<span class="route-point-icon__badge">${label}</span><span class="route-point-icon__pulse"></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}
