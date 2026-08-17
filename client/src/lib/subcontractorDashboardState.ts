export type SubcontractorDashboardError = {
  code?: string | null;
  message?: string | null;
};

export function getSubcontractorDashboardErrorState(error: SubcontractorDashboardError) {
  const requiresOfficeAccess = error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN";

  return {
    title: requiresOfficeAccess ? "Office access is required" : "Unable to load subcontractor operations",
    message: requiresOfficeAccess
      ? "Sign in with an authorized office, project-management, or administrator account to view operational metrics."
      : error.message || "Please try again.",
  };
}
