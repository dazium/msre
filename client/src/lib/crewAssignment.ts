export function canConfirmCrewAssignment(selectedCrewId: number | null | undefined, isPending: boolean): boolean {
  return typeof selectedCrewId === "number" && Number.isInteger(selectedCrewId) && selectedCrewId > 0 && !isPending;
}
