import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type OperationsRole = "user" | "admin" | "office_manager" | "project_manager" | "crew_leader" | "worker" | "accounting";

function callerFor(role: OperationsRole) {
  const ctx: TrpcContext = {
    user: {
      id: 970001,
      openId: `role-${role}`,
      email: `${role}@example.com`,
      name: role,
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

describe("Subcontractor role authorization", () => {
  it("blocks field roles from financial account data and invoice creation", async () => {
    const worker = callerFor("worker");
    await expect(worker.companies.financials({ companyId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(worker.workOrders.billing.createInvoice({
      workOrderId: 1,
      dueDate: new Date(),
      lineItems: [{ description: "Test", quantity: "1.00", unitPrice: "1.00" }],
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks accounting-only staff from changing work-order scope and status", async () => {
    const accounting = callerFor("accounting");
    await expect(accounting.workOrders.replaceScopes({ workOrderId: 1, scopes: [] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(accounting.workOrders.transitionStatus({ id: 1, status: "reviewed" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
