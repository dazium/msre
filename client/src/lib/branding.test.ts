import { describe, expect, it } from "vitest";

describe("MUNRO branding configuration", () => {
  it("uses the exact company title casing", () => {
    expect(import.meta.env.VITE_APP_TITLE).toBe("MUNRO and Sons Roofing Experts");
  });
});
