export type StatusRecord = {
  status: string;
};

export function getActiveProjects<T extends StatusRecord>(projects: T[] | undefined): T[] {
  return (projects ?? []).filter((project) => project.status !== "completed");
}

export function getPendingEstimates<T extends StatusRecord>(estimates: T[] | undefined): T[] {
  return (estimates ?? []).filter((estimate) => estimate.status === "draft");
}
