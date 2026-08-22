export function getCustomerDetailPath(customerId: number): string {
  return `/customers/${customerId}`;
}

export function getCustomerProjectPath(projectId: number): string {
  return `/projects/${projectId}`;
}

export function isNestedInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("a, button, input, textarea, select, [role='combobox']"));
}
