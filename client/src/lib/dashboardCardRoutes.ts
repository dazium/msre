export const DASHBOARD_METRIC_ROUTES = {
  customers: "/customers",
  activeProjects: "/projects",
  pendingEstimates: "/estimates",
  appointments: "/calendar",
} as const;

export function getProjectDetailPath(projectId: number): string {
  return `/projects/${projectId}`;
}
