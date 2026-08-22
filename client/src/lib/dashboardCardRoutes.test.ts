import { describe, expect, it } from "vitest";
import { DASHBOARD_METRIC_ROUTES, getProjectDetailPath } from "./dashboardCardRoutes";

describe("dashboard card routes", () => {
  it("maps each dashboard metric to its matching CRM page", () => {
    expect(DASHBOARD_METRIC_ROUTES).toEqual({
      customers: "/customers",
      activeProjects: "/projects",
      pendingEstimates: "/estimates",
      appointments: "/calendar",
    });
  });

  it("builds project detail links from a dashboard project card", () => {
    expect(getProjectDetailPath(42)).toBe("/projects/42");
  });
});
