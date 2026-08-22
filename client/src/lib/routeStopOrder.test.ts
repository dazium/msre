import { describe, expect, it } from "vitest";
import { reorderRouteStops } from "./routeStopOrder";

describe("route stop ordering", () => {
  it("moves the dragged stop to its dropped position while retaining the other stop order", () => {
    const result = reorderRouteStops([
      { id: "home-depot" },
      { id: "job-a" },
      { id: "job-b" },
    ], "job-b", "home-depot");

    expect(result.map((stop) => stop.id)).toEqual(["job-b", "home-depot", "job-a"]);
  });

  it("leaves the list unchanged when no actual reorder occurs", () => {
    const stops = [{ id: "first" }, { id: "second" }];
    expect(reorderRouteStops(stops, "first", "first")).toBe(stops);
  });
});
