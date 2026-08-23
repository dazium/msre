import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("Google address validation form coverage", () => {
  it("requires the shared validated-address workflow in both customer and job-site creation", () => {
    const customers = readSource("client/src/pages/Customers.tsx");
    const companyDetail = readSource("client/src/pages/CompanyDetail.tsx");

    expect(customers).toContain("AddressAutocomplete");
    expect(customers).toContain("canSaveAddress");
    expect(companyDetail).toContain("AddressAutocomplete");
    expect(companyDetail).toContain("canSaveAddress");
  });
});
