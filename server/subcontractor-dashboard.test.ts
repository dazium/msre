import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import * as db from "./db";
import { activityLog, appointments, companies, companyContacts, companyNotes, crews, invoices, invoiceLineItems, jobSites, payments, workOrderAssignments, workOrderCompletions, workOrderScopes, workOrderStatusHistory, workOrders } from "../drizzle/schema";

const userId = 960001;
let companyId = 0;
let siteId = 0;
let crewId = 0;
let completedOrderId = 0;

async function cleanup() {
  const database = await db.getDb();
  if (!database) return;
  const invoiceRows = await database.select({ id: invoices.id }).from(invoices).where(eq(invoices.userId, userId));
  const invoiceIds = invoiceRows.map((invoice) => invoice.id);
  if (invoiceIds.length) {
    await database.delete(payments).where(inArray(payments.invoiceId, invoiceIds));
    await database.delete(invoiceLineItems).where(inArray(invoiceLineItems.invoiceId, invoiceIds));
    await database.delete(invoices).where(inArray(invoices.id, invoiceIds));
  }
  const orderRows = await database.select({ id: workOrders.id }).from(workOrders).where(eq(workOrders.userId, userId));
  const orderIds = orderRows.map((order) => order.id);
  if (orderIds.length) {
    const assignmentRows = await database.select({ appointmentId: workOrderAssignments.appointmentId }).from(workOrderAssignments).where(inArray(workOrderAssignments.workOrderId, orderIds));
    const appointmentIds = assignmentRows.map((assignment) => assignment.appointmentId).filter((id): id is number => id !== null);
    if (appointmentIds.length) await database.delete(appointments).where(inArray(appointments.id, appointmentIds));
    await database.delete(workOrderAssignments).where(inArray(workOrderAssignments.workOrderId, orderIds));
    await database.delete(workOrderCompletions).where(inArray(workOrderCompletions.workOrderId, orderIds));
    await database.delete(workOrderScopes).where(inArray(workOrderScopes.workOrderId, orderIds));
    await database.delete(workOrderStatusHistory).where(inArray(workOrderStatusHistory.workOrderId, orderIds));
    await database.delete(workOrders).where(inArray(workOrders.id, orderIds));
  }
  const companyRows = await database.select({ id: companies.id }).from(companies).where(eq(companies.userId, userId));
  const companyIds = companyRows.map((company) => company.id);
  if (companyIds.length) {
    await database.delete(companyContacts).where(inArray(companyContacts.companyId, companyIds));
    await database.delete(companyNotes).where(inArray(companyNotes.companyId, companyIds));
    await database.delete(jobSites).where(inArray(jobSites.companyId, companyIds));
    await database.delete(companies).where(inArray(companies.id, companyIds));
  }
  await database.delete(crews).where(eq(crews.userId, userId));
  await database.delete(activityLog).where(eq(activityLog.userId, userId));
}

describe("Subcontractor operations dashboard", () => {
  beforeAll(async () => {
    await cleanup();
    const company = await db.createCompany({ userId, name: "Dashboard Partner", accountType: "partner", paymentTerms: "net_30", status: "active" });
    companyId = company.id;
    const site = await db.createJobSite({ companyId, address: "400 Walker Road", city: "Windsor", province: "Ontario", propertyType: "commercial", isActive: true }, userId);
    siteId = site.id;
    const crew = await db.createCrew({ userId, name: "Dashboard Crew", status: "active" });
    crewId = crew.id;
    const order = await db.createWorkOrder({ userId, companyId, jobSiteId: siteId, workOrderNumber: "WO-DASH-0001", jobType: "repair", scopeSummary: "Repair roof penetration.", agreedPrice: "900.00", additionalCharges: "0.00", taxRate: "13.00", status: "new", createdByUserId: userId, receivedAt: new Date("2026-08-10T09:00:00"), deadline: new Date("2026-08-12T12:00:00") }, [{ category: "repair", description: "Repair penetration", quantity: "1.00", unit: "job" }]);
    completedOrderId = order.id;
    await db.transitionWorkOrderStatus(order.id, userId, "reviewed");
    await db.transitionWorkOrderStatus(order.id, userId, "accepted");
    await db.createWorkOrderAssignment({ workOrderId: order.id, crewId, scheduledStart: new Date("2026-08-11T08:00:00"), scheduledEnd: new Date("2026-08-11T16:00:00") }, userId);
    await db.recordWorkOrderCompletion(order.id, userId, { completionDate: new Date("2026-08-11T15:30:00"), completedScope: "Repaired roof penetration.", labourHours: "7.50", productionQuantity: "1.00", productionUnit: "repair", callbackRequired: false });

    const overdue = await db.createWorkOrder({ userId, companyId, jobSiteId: siteId, workOrderNumber: "WO-DASH-0002", jobType: "repair", scopeSummary: "Overdue maintenance inspection.", status: "new", createdByUserId: userId, receivedAt: new Date("2026-08-12T09:00:00"), deadline: new Date("2026-08-13T12:00:00") });
    await db.transitionWorkOrderStatus(overdue.id, userId, "reviewed");
    await db.transitionWorkOrderStatus(overdue.id, userId, "accepted");
  });

  afterAll(async () => { await cleanup(); });

  it("returns completion, crew production, company performance, and ready-to-invoice metrics for a selected period", async () => {
    const dashboard = await db.getSubcontractorDashboard(userId, new Date("2026-08-01T00:00:00"), new Date("2026-08-17T23:59:59"));
    expect(dashboard?.summary.receivedWorkOrders).toBe(2);
    expect(dashboard?.summary.completedWorkOrders).toBe(1);
    expect(dashboard?.summary.readyToInvoice).toBe(1);
    expect(dashboard?.summary.overdueWorkOrders).toBe(1);
    expect(dashboard?.crewProduction[0]?.crew.id).toBe(crewId);
    expect(dashboard?.crewProduction[0]?.completedCount).toBe(1);
    expect(dashboard?.crewProduction[0]?.labourHours).toBeCloseTo(7.5, 2);
    expect(dashboard?.companyPerformance[0]?.company.id).toBe(companyId);
    expect(dashboard?.companyPerformance[0]?.workOrderCount).toBe(2);
    expect(dashboard?.exceptions.readyToInvoice[0]?.id).toBe(completedOrderId);
  });
});
