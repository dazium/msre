import { describe, expect, it } from "vitest";
import { getCustomerDetailPath, getCustomerProjectPath } from "./customerJobRoutes";

describe("customer job routes", () => {
  it("opens customer detail context from a customer card", () => {
    expect(getCustomerDetailPath(77)).toBe("/customers/77");
  });

  it("opens a selected customer project as a job detail", () => {
    expect(getCustomerProjectPath(630006)).toBe("/projects/630006");
  });
});
