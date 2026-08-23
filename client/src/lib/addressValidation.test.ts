import { describe, expect, it } from "vitest";
import { canSaveAddress, hasValidMapCoordinates } from "./addressValidation";

describe("hasValidMapCoordinates", () => {
  it("accepts a geocoded latitude and longitude", () => {
    expect(hasValidMapCoordinates("42.3149", "-83.0364")).toBe(true);
  });

  it("rejects blank, non-numeric, and out-of-range coordinate values", () => {
    expect(hasValidMapCoordinates("", "")).toBe(false);
    expect(hasValidMapCoordinates("not-a-number", "-83.0364")).toBe(false);
    expect(hasValidMapCoordinates("91", "-83.0364")).toBe(false);
  });

  it("requires an entered address to come from a validated Google result", () => {
    expect(canSaveAddress("", false)).toBe(true);
    expect(canSaveAddress("123 Main Street", false)).toBe(false);
    expect(canSaveAddress("123 Main Street", true)).toBe(true);
  });
});
