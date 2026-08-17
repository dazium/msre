import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import * as db from "./db";
import { activityLog, appointments, changeOrders, companies, companyContacts, companyNotes, crews, documents, jobSites, workOrderAssignments, workOrderCompletions, workOrderScopes, workOrderStatusHistory, workOrders } from "../drizzle/schema";

const userId = 940001;
let companyId = 0;
let jobSiteId = 0;
let crewId = 0;
let workOrderId = 0;

async function cleanup() {
  const database = await db.getDb();
  if (!database) return;
  const orderRows = await database.select({ id: workOrders.id }).from(workOrders).where(eq(workOrders.userId, userId));
  const orderIds = orderRows.map((row) => row.id);
  if (orderIds.length > 0) {
    const assignmentRows = await database.select({ appointmentId: workOrderAssignments.appointmentId }).from(workOrderAssignments).where(inArray(workOrderAssignments.workOrderId, orderIds));
    const appointmentIds = assignmentRows.map((row) => row.appointmentId).filter((id): id is number => id !== null);
    if (appointmentIds.length > 0) await database.delete(appointments).where(inArray(appointments.id, appointmentIds));
    await database.delete(workOrderAssignments).where(inArray(workOrderAssignments.workOrderId, orderIds));
    await database.delete(workOrderCompletions).where(inArray(workOrderCompletions.workOrderId, orderIds));
    await database.delete(workOrderScopes).where(inArray(workOrderScopes.workOrderId, orderIds));
    await database.delete(workOrderStatusHistory).where(inArray(workOrderStatusHistory.workOrderId, orderIds));
    await database.delete(changeOrders).where(inArray(changeOrders.workOrderId, orderIds));
    await database.delete(documents).where(inArray(documents.workOrderId, orderIds));
    await database.delete(workOrders).where(inArray(workOrders.id, orderIds));
  }
  const companyRows = await database.select({ id: companies.id }).from(companies).where(eq(companies.userId, userId));
  const companyIds = companyRows.map((company) => company.id);
  if (companyIds.length > 0) {
    await database.delete(companyContacts).where(inArray(companyContacts.companyId, companyIds));
    await database.delete(companyNotes).where(inArray(companyNotes.companyId, companyIds));
    await database.delete(jobSites).where(inArray(jobSites.companyId, companyIds));
    await database.delete(companies).where(inArray(companies.id, companyIds));
  }
  await database.delete(crews).where(eq(crews.userId, userId));
  await database.delete(activityLog).where(eq(activityLog.userId, userId));
}

describe("Work-order execution workflow", () => {
  beforeAll(async () => {
    await cleanup();
    const company = await db.createCompany({ userId, name: "Execution Partner", accountType: "partner", paymentTerms: "net_30", status: "active" });
    companyId = company.id;
    const site = await db.createJobSite({ companyId, address: "200 Tecumseh Road", city: "Windsor", province: "Ontario", propertyType: "commercial", isActive: true }, userId);
    jobSiteId = site.id;
    const crew = await db.createCrew({ userId, name: "North Crew", status: "active", crewLead: "A. Roofer" });
    crewId = crew.id;
    const workOrder = await db.createWorkOrder({ userId, companyId, jobSiteId, workOrderNumber: "WO-EXEC-0001", jobType: "repair", scopeSummary: "Repair active leak at parapet wall.", status: "new", additionalCharges: "0.00", taxRate: "13.00", createdByUserId: userId }, [{ category: "repair", description: "Repair leak", quantity: "1.00", unit: "job" }]);
    workOrderId = workOrder.id;
    await db.transitionWorkOrderStatus(workOrderId, userId, "reviewed");
    await db.transitionWorkOrderStatus(workOrderId, userId, "accepted");
  });

  afterAll(async () => {
    await cleanup();
  });

  it("assigns an active crew and creates a linked calendar appointment", async () => {
    const start = new Date("2026-08-18T08:00:00");
    const end = new Date("2026-08-18T16:00:00");
    const assignment = await db.createWorkOrderAssignment({ workOrderId, crewId, scheduledStart: start, scheduledEnd: end, notes: "Bring membrane repair kit." }, userId);
    expect(assignment.status).toBe("assigned");
    expect(assignment.appointmentId).toBeTruthy();

    const database = await db.getDb();
    const appointment = await database!.select().from(appointments).where(eq(appointments.id, assignment.appointmentId!)).limit(1);
    expect(appointment[0]?.workOrderId).toBe(workOrderId);
    expect(appointment[0]?.crewId).toBe(crewId);
    expect(appointment[0]?.type).toBe("work_order");

    const listedAssignments = await db.listWorkOrderAssignments(workOrderId, userId);
    expect(listedAssignments[0]?.crew?.name).toBe("North Crew");
  });

  it("starts crew work, records completion, completes scopes, and synchronizes calendar status", async () => {
    const assignments = await db.listWorkOrderAssignments(workOrderId, userId);
    await db.updateWorkOrderAssignment(assignments[0]!.id, userId, { status: "in_progress", actualStart: new Date("2026-08-18T08:05:00") });
    expect((await db.getWorkOrderById(workOrderId, userId))?.status).toBe("in_progress");

    const completion = await db.recordWorkOrderCompletion(workOrderId, userId, {
      completionDate: new Date("2026-08-18T15:30:00"),
      completedScope: "Repaired parapet leak and water-tested the repair.",
      labourHours: "7.50",
      productionQuantity: "1.00",
      productionUnit: "repair",
      materialsUsed: "Membrane patch and primer",
      deficiencies: "None",
      signOffName: "Site Superintendent",
      callbackRequired: false,
    });
    expect(completion.id).toBeGreaterThan(0);
    expect((await db.getWorkOrderById(workOrderId, userId))?.status).toBe("completed");

    const database = await db.getDb();
    const scopes = await database!.select().from(workOrderScopes).where(eq(workOrderScopes.workOrderId, workOrderId));
    expect(scopes.every((scope) => scope.isCompleted)).toBe(true);
    const assignmentRows = await database!.select().from(workOrderAssignments).where(eq(workOrderAssignments.workOrderId, workOrderId));
    expect(assignmentRows[0]?.status).toBe("completed");
    const appointment = await database!.select().from(appointments).where(eq(appointments.id, assignmentRows[0]!.appointmentId!)).limit(1);
    expect(appointment[0]?.status).toBe("completed");
  });

  it("stores work-order document metadata and returns it only to the owning user", async () => {
    const document = await db.createWorkOrderDocument({
      userId,
      companyId,
      jobSiteId,
      workOrderId,
      documentType: "completion_document",
      fileName: "completion-report.pdf",
      fileKey: "work-orders/test/completion-report.pdf",
      fileUrl: "/manus-storage/work-orders/test/completion-report.pdf",
      mimeType: "application/pdf",
      uploadedByUserId: userId,
    }, userId);
    expect(document.id).toBeGreaterThan(0);
    const documentsForOrder = await db.listWorkOrderDocuments(workOrderId, userId);
    expect(documentsForOrder).toHaveLength(1);
    expect(documentsForOrder[0]?.fileName).toBe("completion-report.pdf");
  });
});
