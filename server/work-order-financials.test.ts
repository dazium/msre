import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import * as db from "./db";
import { activityLog, companies, companyContacts, companyNotes, invoices, invoiceLineItems, jobSites, payments, workOrderCompletions, workOrderScopes, workOrderStatusHistory, workOrders } from "../drizzle/schema";

const userId = 950001;
let companyId = 0;
let siteId = 0;
let workOrderId = 0;
let invoiceId = 0;

async function cleanup() {
  const database = await db.getDb();
  if (!database) return;
  const invoiceRows = await database.select({ id: invoices.id }).from(invoices).where(eq(invoices.userId, userId));
  const invoiceIds = invoiceRows.map((invoice) => invoice.id);
  if (invoiceIds.length > 0) {
    await database.delete(payments).where(inArray(payments.invoiceId, invoiceIds));
    await database.delete(invoiceLineItems).where(inArray(invoiceLineItems.invoiceId, invoiceIds));
    await database.delete(invoices).where(inArray(invoices.id, invoiceIds));
  }
  const workOrderRows = await database.select({ id: workOrders.id }).from(workOrders).where(eq(workOrders.userId, userId));
  const workOrderIds = workOrderRows.map((order) => order.id);
  if (workOrderIds.length > 0) {
    await database.delete(workOrderCompletions).where(inArray(workOrderCompletions.workOrderId, workOrderIds));
    await database.delete(workOrderScopes).where(inArray(workOrderScopes.workOrderId, workOrderIds));
    await database.delete(workOrderStatusHistory).where(inArray(workOrderStatusHistory.workOrderId, workOrderIds));
    await database.delete(workOrders).where(inArray(workOrders.id, workOrderIds));
  }
  const companyRows = await database.select({ id: companies.id }).from(companies).where(eq(companies.userId, userId));
  const companyIds = companyRows.map((company) => company.id);
  if (companyIds.length > 0) {
    await database.delete(companyContacts).where(inArray(companyContacts.companyId, companyIds));
    await database.delete(companyNotes).where(inArray(companyNotes.companyId, companyIds));
    await database.delete(jobSites).where(inArray(jobSites.companyId, companyIds));
    await database.delete(companies).where(inArray(companies.id, companyIds));
  }
  await database.delete(activityLog).where(eq(activityLog.userId, userId));
}

describe("Work-order financial workflow", () => {
  beforeAll(async () => {
    await cleanup();
    const company = await db.createCompany({ userId, name: "Payment Partner", accountType: "partner", paymentTerms: "net_30", status: "active" });
    companyId = company.id;
    const site = await db.createJobSite({ companyId, address: "300 Ouellette Avenue", city: "Windsor", province: "Ontario", propertyType: "commercial", isActive: true }, userId);
    siteId = site.id;
    const workOrder = await db.createWorkOrder({ userId, companyId, jobSiteId: siteId, workOrderNumber: "WO-FIN-0001", jobType: "repair", scopeSummary: "Repair roof curb flashing.", agreedPrice: "1000.00", additionalCharges: "0.00", taxRate: "13.00", status: "new", createdByUserId: userId }, [{ category: "repair", description: "Repair curb flashing", quantity: "1.00", unit: "job" }]);
    workOrderId = workOrder.id;
    await db.transitionWorkOrderStatus(workOrderId, userId, "reviewed");
    await db.transitionWorkOrderStatus(workOrderId, userId, "accepted");
    await db.transitionWorkOrderStatus(workOrderId, userId, "assigned");
    await db.recordWorkOrderCompletion(workOrderId, userId, { completionDate: new Date("2026-08-18T14:00:00"), completedScope: "Repaired and sealed roof curb flashing.", callbackRequired: false });
  });

  afterAll(async () => { await cleanup(); });

  it("creates an itemized invoice from completed work and advances the job to invoiced", async () => {
    const invoice = await db.createInvoiceFromWorkOrder(workOrderId, userId, new Date("2026-09-17T12:00:00"), [{ description: "Roof curb flashing repair", quantity: "1.00", unit: "job", unitPrice: "1000.00" }], "Net 30");
    invoiceId = invoice.id;
    expect(invoice.status).toBe("sent");
    expect(invoice.companyId).toBe(companyId);
    expect(Number(invoice.total)).toBeCloseTo(1130, 2);
    expect((await db.getWorkOrderById(workOrderId, userId))?.status).toBe("invoiced");
    const lines = await db.getInvoiceLineItems(invoice.id, userId);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.description).toContain("curb flashing");
  });

  it("records partial then final payment, accurately reconciles balances, and advances job status", async () => {
    const partial = await db.recordInvoicePayment(invoiceId, userId, { amount: "500.00", paymentDate: new Date("2026-08-20T12:00:00"), paymentMethod: "bank_transfer", referenceNumber: "EFT-123" });
    expect(partial.status).toBe("succeeded");
    expect((await db.getInvoiceByIdForUser(invoiceId, userId))?.status).toBe("partially_paid");
    expect((await db.getWorkOrderById(workOrderId, userId))?.status).toBe("partially_paid");

    const financials = await db.getCompanyFinancials(companyId, userId);
    expect(financials?.summary.totalBilled).toBeCloseTo(1130, 2);
    expect(financials?.summary.totalPaid).toBeCloseTo(500, 2);
    expect(financials?.summary.outstandingBalance).toBeCloseTo(630, 2);
    expect(financials?.invoices[0]?.outstandingAmount).toBeCloseTo(630, 2);

    await db.recordInvoicePayment(invoiceId, userId, { amount: "630.00", paymentDate: new Date("2026-08-28T12:00:00"), paymentMethod: "cheque", referenceNumber: "CHQ-332" });
    const paidInvoice = await db.getInvoiceByIdForUser(invoiceId, userId);
    expect(paidInvoice?.status).toBe("paid");
    expect((await db.getWorkOrderById(workOrderId, userId))?.status).toBe("paid");
    const paidFinancials = await db.getCompanyFinancials(companyId, userId);
    expect(paidFinancials?.summary.outstandingBalance).toBeCloseTo(0, 2);
    expect(paidFinancials?.summary.totalPaid).toBeCloseTo(1130, 2);
    const expectedPaymentDays = Math.max(0, Math.floor((new Date("2026-08-28T12:00:00").getTime() - paidInvoice!.issueDate.getTime()) / 86_400_000));
    expect(paidFinancials?.summary.averagePaymentDays).toBeCloseTo(expectedPaymentDays, 0);
  });

  it("rejects payments that exceed the remaining invoice balance", async () => {
    await expect(db.recordInvoicePayment(invoiceId, userId, { amount: "1.00", paymentDate: new Date(), paymentMethod: "cash" })).rejects.toThrow("Payments can only be recorded");
  });
});
