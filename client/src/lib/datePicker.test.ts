import { describe, expect, it } from "vitest";
import { dateFromInput, dateToInput, formatDateForPicker } from "./datePicker";

describe("CRM date picker helpers", () => {
  it("round-trips a local calendar date without UTC date drift", () => {
    const selectedDate = dateFromInput("2026-03-31");
    expect(selectedDate).toBeDefined();
    expect(dateToInput(selectedDate!)).toBe("2026-03-31");
  });

  it("formats a selected date and gives a useful empty state", () => {
    expect(formatDateForPicker("2026-03-31")).toContain("2026");
    expect(formatDateForPicker("")).toBe("Select date");
  });
});
