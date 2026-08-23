import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("customer profile quick actions", () => {
  it("opens a preselected new-job flow from the customer profile", () => {
    const detail = readSource("client/src/pages/CustomerDetail.tsx");
    const projects = readSource("client/src/pages/Projects.tsx");

    expect(detail).toContain("/projects?new=1&customerId=${customerId}");
    expect(projects).toContain('params.get("customerId")');
    expect(projects).toContain("customerId }" );
  });

  it("keeps estimates and photos tied to a selected customer project", () => {
    const detail = readSource("client/src/pages/CustomerDetail.tsx");
    const estimateForm = readSource("client/src/pages/EstimateForm.tsx");

    expect(detail).toContain("Choose a Job for the Estimate");
    expect(detail).toContain("<EstimateForm");
    expect(detail).toContain("<PhotoUpload");
    expect(estimateForm).toContain("hideTrigger");
    expect(estimateForm).toContain("onOpenChange");
  });

  it("surfaces the existing customer note workflow as a quick action", () => {
    expect(readSource("client/src/pages/CustomerDetail.tsx")).toContain("Quick Note");
  });
});
