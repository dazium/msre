import { describe, expect, it } from "vitest";
import { getCrewAvailability, getCrewDailyAssignments } from "./crewDispatch";

const now = new Date("2026-08-22T10:00:00");

describe("crew dispatch helpers", () => {
  it("distinguishes on-job, assigned-today, and available crews", () => {
    const appointments = [
      { crewId: 1, startTime: "2026-08-22T09:00:00", endTime: "2026-08-22T15:00:00", status: "scheduled" },
      { crewId: 2, startTime: "2026-08-22T15:30:00", endTime: "2026-08-22T17:00:00", status: "scheduled" },
    ];

    expect(getCrewAvailability(1, appointments, now)).toBe("on_job");
    expect(getCrewAvailability(2, appointments, now)).toBe("assigned_today");
    expect(getCrewAvailability(3, appointments, now)).toBe("available");
  });

  it("returns only non-cancelled assignments scheduled for the selected crew today", () => {
    const assignments = getCrewDailyAssignments(1, [
      { crewId: 1, startTime: "2026-08-22T13:00:00", endTime: "2026-08-22T14:00:00", status: "scheduled" },
      { crewId: 1, startTime: "2026-08-22T08:00:00", endTime: "2026-08-22T09:00:00", status: "scheduled" },
      { crewId: 1, startTime: "2026-08-22T10:00:00", endTime: "2026-08-22T11:00:00", status: "cancelled" },
      { crewId: 2, startTime: "2026-08-22T10:00:00", endTime: "2026-08-22T11:00:00", status: "scheduled" },
    ], now);

    expect(assignments).toHaveLength(2);
    expect(assignments.map((assignment) => assignment.startTime)).toEqual([
      "2026-08-22T08:00:00",
      "2026-08-22T13:00:00",
    ]);
  });
});
