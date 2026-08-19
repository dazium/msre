import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

describe("portrait-first CRM layout safeguards", () => {
  it("keeps the app shell and global styles from forcing horizontal phone overflow", () => {
    const styles = source("../index.css");
    const layout = source("../components/DashboardLayout.tsx");

    expect(styles).toContain("overflow-x: hidden");
    expect(styles).toContain(".mobile-data-card");
    expect(layout).toContain("overflow-x-hidden");
    expect(layout).toContain("p-3 sm:p-4 lg:p-8");
  });

  it("uses stacked mobile alternatives for formerly wide project and operational data views", () => {
    const projects = source("../pages/Projects.tsx");
    const subcontractorDashboard = source("../pages/SubcontractorDashboard.tsx");
    const crewProductivity = source("../pages/CrewProductivity.tsx");
    const calendar = source("../pages/Calendar.tsx");

    expect(projects).toContain("space-y-4 md:hidden");
    expect(subcontractorDashboard).toContain("space-y-3 sm:hidden");
    expect(crewProductivity).toContain("space-y-3 p-4 sm:hidden");
    expect(calendar).not.toContain("overflow-x-auto");
  });
});
