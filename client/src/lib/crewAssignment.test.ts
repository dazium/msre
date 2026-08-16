import { describe, expect, it } from "vitest";
import { canConfirmCrewAssignment } from "./crewAssignment";

describe("crew assignment confirmation", () => {
  it("requires a selected crew before enabling confirmation", () => {
    expect(canConfirmCrewAssignment(undefined, false)).toBe(false);
    expect(canConfirmCrewAssignment(null, false)).toBe(false);
    expect(canConfirmCrewAssignment(0, false)).toBe(false);
  });

  it("enables confirmation for a selected crew when idle", () => {
    expect(canConfirmCrewAssignment(12, false)).toBe(true);
  });

  it("disables confirmation while the assignment is being submitted", () => {
    expect(canConfirmCrewAssignment(12, true)).toBe(false);
  });
});
