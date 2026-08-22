export type RoutePoint = {
  latitude: number;
  longitude: number;
};

export function canCreateRoute(origin: RoutePoint | null, stops: RoutePoint[]): boolean {
  return Boolean(origin && stops.length > 0);
}

export function splitRoutePoints(origin: RoutePoint, stops: RoutePoint[]) {
  return {
    origin,
    destination: stops[stops.length - 1],
    waypoints: stops.slice(0, -1),
  };
}
