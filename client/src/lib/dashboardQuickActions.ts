export type DashboardCreateAction = "project" | "estimate";

export function getDashboardCreatePath(action: DashboardCreateAction): string {
  return action === "project" ? "/projects?new=1" : "/estimates?new=1";
}
