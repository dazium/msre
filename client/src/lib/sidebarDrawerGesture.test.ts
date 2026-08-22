import { describe, expect, it } from "vitest";
import { shouldOpenMobileDrawerFromSwipe } from "./sidebarDrawerGesture";

describe("mobile sidebar drawer gesture", () => {
  it("opens the drawer for a deliberate rightward swipe starting at the left edge", () => {
    expect(shouldOpenMobileDrawerFromSwipe({ x: 20, y: 300 }, { x: 110, y: 308 })).toBe(true);
  });

  it("ignores swipes that do not begin on the left edge or are primarily vertical", () => {
    expect(shouldOpenMobileDrawerFromSwipe({ x: 80, y: 300 }, { x: 180, y: 300 })).toBe(false);
    expect(shouldOpenMobileDrawerFromSwipe({ x: 12, y: 300 }, { x: 84, y: 410 })).toBe(false);
  });
});
