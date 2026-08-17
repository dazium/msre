import { describe, expect, it } from "vitest";
import { getSubcontractorDashboardErrorState } from "./subcontractorDashboardState";

describe("subcontractor dashboard access state", () => {
  it("shows a clear office-access message for unauthorized requests", () => {
    expect(getSubcontractorDashboardErrorState({ code: "UNAUTHORIZED" })).toEqual({
      title: "Office access is required",
      message: "Sign in with an authorized office, project-management, or administrator account to view operational metrics.",
    });
  });

  it("preserves a recoverable message for operational load failures", () => {
    expect(getSubcontractorDashboardErrorState({ code: "INTERNAL_SERVER_ERROR", message: "Temporary service issue" })).toEqual({
      title: "Unable to load subcontractor operations",
      message: "Temporary service issue",
    });
  });
});
