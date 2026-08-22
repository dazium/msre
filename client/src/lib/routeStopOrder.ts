export type OrderableRouteStop = { id: string };

export function reorderRouteStops<T extends OrderableRouteStop>(stops: T[], activeId: string, overId: string) {
  const fromIndex = stops.findIndex((stop) => stop.id === activeId);
  const toIndex = stops.findIndex((stop) => stop.id === overId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return stops;
  const next = [...stops];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}
