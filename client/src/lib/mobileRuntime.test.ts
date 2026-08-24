import { describe, expect, it } from "vitest";
import { DEPLOYED_CRM_ORIGIN, resolveApiOrigin } from "./mobileRuntime";

describe("resolveApiOrigin", () => {
  it("uses an explicit configured API origin for any build target", () => {
    expect(resolveApiOrigin({
      configuredOrigin: "https://crm.example.ca/",
      isNativePlatform: true,
      browserOrigin: "https://localhost",
    })).toBe("https://crm.example.ca");
  });

  it("uses the deployed CRM endpoint in a packaged native app", () => {
    expect(resolveApiOrigin({ isNativePlatform: true })).toBe(DEPLOYED_CRM_ORIGIN);
  });

  it("preserves same-origin API requests for the browser CRM", () => {
    expect(resolveApiOrigin({
      isNativePlatform: false,
      browserOrigin: "https://roofcrm-lzqinayu.manus.space",
    })).toBe("https://roofcrm-lzqinayu.manus.space");
  });
});
