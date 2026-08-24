import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("public CRM demo access", () => {
  it("does not redirect unauthenticated API errors into Manus OAuth", () => {
    const source = readSource("client/src/main.tsx");
    expect(source).not.toContain("getLoginUrl");
    expect(source).not.toContain("window.location.href");
  });

  it("uses a public CRM identity for protected procedures and omits a sign-in control from the shell", () => {
    expect(readSource("server/_core/trpc.ts")).toContain("resolvePublicCrmUser");
    const layout = readSource("client/src/components/DashboardLayout.tsx");
    expect(layout).toContain("Public CRM demo");
    expect(layout).not.toContain("Sign in to continue");
  });

  it("keeps the temporary private-build fallback usable when production omits the owner identity", () => {
    const trpc = readSource("server/_core/trpc.ts");
    expect(trpc).toContain("getFirstAdminUser");
    expect(trpc).toContain("OWNER_OPEN_ID is not configured");
    const db = readSource("server/db.ts");
    expect(db).toContain('where(eq(users.role, "admin"))');
  });
});
