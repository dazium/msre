import { describe, expect, it } from "vitest";
import { getDashboardCreatePath } from "./dashboardQuickActions";

describe("dashboard quick actions", () => {
  it("opens the new project form", () => {
    expect(getDashboardCreatePath("project")).toBe("/projects?new=1");
  });

  it("opens the new estimate form", () => {
    expect(getDashboardCreatePath("estimate")).toBe("/estimates?new=1");
  });
});
