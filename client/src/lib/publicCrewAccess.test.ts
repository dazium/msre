import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("public crew access", () => {
  it("does not reintroduce the obsolete client-side login gate", () => {
    const crewsPage = readFileSync(
      fileURLToPath(new URL("../pages/Crews.tsx", import.meta.url)),
      "utf8",
    );

    expect(crewsPage).not.toContain("useAuth");
    expect(crewsPage).not.toContain("Please log in to view crews.");
  });
});
