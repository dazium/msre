import { describe, expect, it } from "vitest";
import { fieldLocationLabel } from "./nativeFieldDevices";

describe("native field-device helpers", () => {
  it("labels a native GPS result clearly in the route workflow", () => {
    expect(fieldLocationLabel("native")).toBe("Android GPS location");
  });

  it("labels the browser fallback distinctly", () => {
    expect(fieldLocationLabel("browser")).toBe("Browser GPS location");
  });
});
