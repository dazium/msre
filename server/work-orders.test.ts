import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import * as db from "./db";
import { activityLog, changeOrders, companies, companyContacts, companyNotes, documents, jobSites, workOrderAssignments, workOrderCompletions, workOrderScopes, workOrderStatusHistory, workOrders } from "../drizzle/schema";

const ownerId = 930001;
const otherUserId = 930002;
let companyId = 0;
let jobSiteId = 0;
let workOrderId = 0;

async function cleanup() {
  const database = await db.getDb();
  if (!database) return;
  const ownedRows = await database.select({ id: workOrders.id }).from(workOrders).where(inArray(workOrders.userId, [ownerId, otherUserId]));
  const workOrderIds = ownedRows.map((row) => row.id);
  if (workOrderIds.length > 0) {
    await database.delete(workOrderAssignments).where(inArray(workOrderAssignments.workOrderId, workOrderIds));
    await database.delete(workOrderCompletions).where(inArray(workOrderCompletions.workOrderId, workOrderIds));
    await database.delete(workOrderScopes).where(inArray(workOrderScopes.workOrderId, workOrderIds));
    await database.delete(workOrderStatusHistory).where(inArray(workOrderStatusHistory.workOrderId, workOrderIds));
    await database.delete(changeOrders).where(inArray(changeOrders.workOrderId, workOrderIds));
    await database.delete(documents).where(inArray(documents.workOrderId, workOrderIds));
    await database.delete(workOrders).where(inArray(workOrders.id, workOrderIds));
  }
  const ownedCompanies = await database.select({ id: companies.id }).from(companies).where(inArray(companies.userId, [ownerId, otherUserId]));
  const companyIds = ownedCompanies.map((company) => company.id);
  if (companyIds.length > 0) {
    await database.delete(companyContacts).where(inArray(companyContacts.companyId, companyIds));
    await database.delete(companyNotes).where(inArray(companyNotes.companyId, companyIds));
    await database.delete(jobSites).where(inArray(jobSites.companyId, companyIds));
    await database.delete(companies).where(inArray(companies.id, companyIds));
  }
  await database.delete(activityLog).where(inArray(activityLog.userId, [ownerId, otherUserId]));
}

describe("Subcontract work-order lifecycle", () => {
  beforeAll(async () => {
    await cleanup();
    const company = await db.createCompany({ userId: ownerId, name: "Northline Roofing", accountType: "partner", paymentTerms: "net_30", status: "active" });
    companyId = company.id;
    const site = await db.createJobSite({ companyId, address: "101 Riverside Drive", city: "Windsor", province: "Ontario", propertyType: "commercial", isActive: true }, ownerId);
    jobSiteId = site.id;
  });

  afterAll(async () => {
    await cleanup();
  });

  it("creates a work order with structured scope, number, history, and account ownership", async () => {
    const workOrder = await db.createWorkOrder({
      userId: ownerId,
      companyId,
      jobSiteId,
      workOrderNumber: "WO-TEST-0001",
      jobType: "repair",
      scopeSummary: "Repair membrane damage around the north roof drain.",
      agreedPrice: "1800.00",
      additionalCharges: "0.00",
      taxRate: "13.00",
      status: "new",
      createdByUserId: ownerId,
    }, [{ category: "repair", description: "Repair membrane and reseal drain flashing", quantity: "1.00", unit: "job" }]);
    workOrderId = workOrder.id;
    expect(workOrder.status).toBe("new");

    const detail = await db.getWorkOrderDetail(workOrderId, ownerId);
    expect(detail?.company?.name).toBe("Northline Roofing");
    expect(detail?.jobSite?.address).toBe("101 Riverside Drive");
    expect(detail?.scopes).toHaveLength(1);
    expect(detail?.statusHistory).toHaveLength(1);
    expect(detail?.statusHistory[0]?.toStatus).toBe("new");
  });

  it("returns enriched company and job-site context in search results", async () => {
    const results = await db.listWorkOrders(ownerId, { search: "membrane" });
    expect(results).toHaveLength(1);
    expect(results[0]?.companyName).toBe("Northline Roofing");
    expect(results[0]?.jobSiteAddress).toBe("101 Riverside Drive");
  });

  it("enforces valid status transitions and exception reasons", async () => {
    await expect(db.transitionWorkOrderStatus(workOrderId, ownerId, "paid")).rejects.toThrow("Cannot move work order");
    await expect(db.transitionWorkOrderStatus(workOrderId, ownerId, "on_hold")).rejects.toThrow("A reason is required");

    const reviewed = await db.transitionWorkOrderStatus(workOrderId, ownerId, "reviewed");
    expect(reviewed.status).toBe("reviewed");
    const accepted = await db.transitionWorkOrderStatus(workOrderId, ownerId, "accepted");
    expect(accepted.status).toBe("accepted");
    const held = await db.transitionWorkOrderStatus(workOrderId, ownerId, "on_hold", "Waiting for signed PO");
    expect(held.status).toBe("on_hold");
    expect(held.statusReason).toBe("Waiting for signed PO");
  });

  it("replaces structured scope while retaining the parent work order", async () => {
    const updatedScopes = await db.replaceWorkOrderScopes(workOrderId, ownerId, [
      { category: "repair", description: "Replace damaged drain flashing", quantity: "1.00", unit: "each" },
      { category: "underlayment", description: "Install peel-and-stick membrane patch", quantity: "12.00", unit: "sq ft" },
    ]);
    expect(updatedScopes).toHaveLength(2);
    expect(updatedScopes[1]?.category).toBe("underlayment");
  });

  it("does not expose or mutate work orders across users", async () => {
    expect(await db.getWorkOrderById(workOrderId, otherUserId)).toBeUndefined();
    await expect(db.replaceWorkOrderScopes(workOrderId, otherUserId, [])).rejects.toThrow("Work order not found");
    const database = await db.getDb();
    expect(database).toBeTruthy();
    const persisted = await database!.select().from(workOrders).where(eq(workOrders.id, workOrderId)).limit(1);
    expect(persisted[0]?.userId).toBe(ownerId);
  });
});
