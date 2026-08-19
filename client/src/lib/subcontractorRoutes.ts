export const SUBCONTRACTOR_DASHBOARD_PATHS = [
  "/subcontractor-dashboard",
  "/subcontractors",
] as const;

export function getSubcontractorProfilePath(companyId: number | string) {
  return `/subcontractors/${companyId}`;
}
