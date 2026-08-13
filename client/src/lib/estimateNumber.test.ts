import { describe, expect, it } from "vitest";
import { getNextEstimateNumber, isEstimateNumber } from "./estimateNumber";

describe("estimate number helpers", () => {
  it("starts at EST-001 when no estimates exist", () => {
    expect(getNextEstimateNumber([])).toBe("EST-001");
  });

  it("increments the highest existing EST number", () => {
    expect(
      getNextEstimateNumber([
        { estimateNumber: "EST-002" },
        { estimateNumber: "EST-017" },
        { estimateNumber: "EST-004" },
      ]),
    ).toBe("EST-018");
  });

  it("ignores non-sequential legacy identifiers", () => {
    expect(
      getNextEstimateNumber([
        { estimateNumber: "quote-42" },
        { estimateNumber: "EST-009" },
        { estimateNumber: null },
      ]),
    ).toBe("EST-010");
  });

  it("accepts the generated format case-insensitively", () => {
    expect(isEstimateNumber(" est-12 ")).toBe(true);
    expect(isEstimateNumber("estimate-12")).toBe(false);
  });
});
