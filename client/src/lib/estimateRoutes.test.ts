import { describe, expect, it } from "vitest";
import { getEstimateDetailPath } from "./estimateRoutes";

describe("estimate detail routes", () => {
  it("builds the detail route for a selected estimate", () => {
    expect(getEstimateDetailPath(123)).toBe("/estimates/123");
  });
});
