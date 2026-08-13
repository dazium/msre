import { describe, expect, it } from "vitest";
import { getActiveProjects, getPendingEstimates } from "./dashboardSummary";

describe("Home dashboard summary helpers", () => {
  it("returns only projects that are not completed", () => {
    const projects = [
      { id: 1, status: "lead" },
      { id: 2, status: "in_progress" },
      { id: 3, status: "completed" },
    ];

    expect(getActiveProjects(projects).map((project) => project.id)).toEqual([1, 2]);
    expect(getActiveProjects(undefined)).toEqual([]);
  });

  it("returns only draft estimates awaiting action", () => {
    const estimates = [
      { id: 1, status: "draft" },
      { id: 2, status: "sent" },
      { id: 3, status: "accepted" },
    ];

    expect(getPendingEstimates(estimates).map((estimate) => estimate.id)).toEqual([1]);
    expect(getPendingEstimates(undefined)).toEqual([]);
  });
});
