import { describe, expect, it } from "vitest";
import { canCreateRoute, splitRoutePoints } from "./routePlanner";

describe("GPS route planner", () => {
  const origin = { latitude: 42.3149, longitude: -83.0364 };
  const firstStop = { latitude: 42.308, longitude: -83.03 };
  const lastStop = { latitude: 42.29, longitude: -83.01 };

  it("requires a GPS origin and at least one map stop", () => {
    expect(canCreateRoute(null, [firstStop])).toBe(false);
    expect(canCreateRoute(origin, [])).toBe(false);
    expect(canCreateRoute(origin, [firstStop])).toBe(true);
  });

  it("uses the last selected stop as the route destination", () => {
    expect(splitRoutePoints(origin, [firstStop, lastStop])).toEqual({
      origin,
      destination: lastStop,
      waypoints: [firstStop],
    });
  });
});
