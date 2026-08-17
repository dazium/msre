import { describe, expect, it } from "vitest";
import { SUBCONTRACTOR_DASHBOARD_PATHS } from "./subcontractorRoutes";

describe("subcontractor dashboard routes", () => {
  it("supports the sidebar path and intuitive subcontractors alias", () => {
    expect(SUBCONTRACTOR_DASHBOARD_PATHS).toContain("/subcontractor-dashboard");
    expect(SUBCONTRACTOR_DASHBOARD_PATHS).toContain("/subcontractors");
  });
});
