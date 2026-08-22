import { describe, expect, it } from "vitest";
import type { User } from "../drizzle/schema";
import { resolvePublicCrmUser } from "./_core/trpc";

const publicOwner: User = {
  id: 1,
  openId: "public-crm-owner",
  name: "MUNRO and Sons Roofing Experts",
  email: "office@example.com",
  loginMethod: "public",
  role: "admin",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
};

describe("public CRM access", () => {
  it("uses the public CRM owner when a visitor has no session", () => {
    expect(resolvePublicCrmUser(null, publicOwner)).toBe(publicOwner);
  });

  it("preserves a valid authenticated identity when one is present", () => {
    const signedInUser = { ...publicOwner, id: 2, openId: "signed-in-user", role: "user" as const };
    expect(resolvePublicCrmUser(signedInUser, publicOwner)).toBe(signedInUser);
  });
});
