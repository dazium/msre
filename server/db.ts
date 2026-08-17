import { and, asc, eq, like, gte, inArray, lte, desc, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, customers, InsertCustomer, projects, InsertProject, estimates, InsertEstimate, appointments, InsertAppointment, photos, InsertPhoto, damages, InsertDamage, damagePhotos, InsertDamagePhoto, materials, InsertMaterial, estimateLineItems, InsertEstimateLineItem, crews, InsertCrew, Crew, invoices, InsertInvoice, Invoice, invoiceLineItems, InsertInvoiceLineItem, InvoiceLineItem, invoiceTemplates, InsertInvoiceTemplate, InvoiceTemplate, payments, InsertPayment, Payment, crewSkills, InsertCrewSkill, CrewSkill, skillCategories, InsertSkillCategory, SkillCategory, predefinedSkills, InsertPredefinedSkill, PredefinedSkill, crewMembers, InsertCrewMember, CrewMember, crewMemberSkills, InsertCrewMemberSkill, CrewMemberSkill, customerNotes, InsertCustomerNote, CustomerNote, inspections, InsertInspection, inspectionItems, InsertInspectionItem, companies, InsertCompany, Company, companyContacts, InsertCompanyContact, CompanyContact, companyNotes, InsertCompanyNote, CompanyNote, jobSites, InsertJobSite, JobSite, activityLog, InsertActivityLog, workOrders, InsertWorkOrder, WorkOrder, workOrderScopes, InsertWorkOrderScope, WorkOrderScope, workOrderAssignments, InsertWorkOrderAssignment, WorkOrderAssignment, workOrderCompletions, InsertWorkOrderCompletion, WorkOrderCompletion, changeOrders, InsertChangeOrder, ChangeOrder, documents, InsertDocument, Document, workOrderStatusHistory, InsertWorkOrderStatusHistory, WorkOrderStatusHistory } from "../drizzle/schema";
import { ENV } from './_core/env';
import { WORK_ORDER_NORMAL_TRANSITIONS, type WorkOrderStatus } from "../shared/subcontractor";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Customer queries
export async function getCustomersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customers).where(eq(customers.userId, userId));
}

export async function getCustomerById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(
    and(eq(customers.id, id), eq(customers.userId, userId))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCustomer(data: InsertCustomer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(customers).values(data);
}

export async function updateCustomer(id: number, userId: number, data: Partial<InsertCustomer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(customers).set(data).where(
    and(eq(customers.id, id), eq(customers.userId, userId))
  );
}

// Project queries
export async function getProjectsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.userId, userId));
}

export async function getProjectById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(
    and(eq(projects.id, id), eq(projects.userId, userId))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(data);
  // Return the inserted project by fetching it
  const inserted = await db.select().from(projects)
    .where(and(eq(projects.userId, data.userId), eq(projects.title, data.title)))
    .orderBy(desc(projects.id))
    .limit(1);
  return inserted[0];
}

export async function updateProject(id: number, userId: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(projects).set(data).where(
    and(eq(projects.id, id), eq(projects.userId, userId))
  );
}

// Estimate queries
export async function getEstimatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(estimates).where(eq(estimates.userId, userId));
}

export async function getEstimateById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(estimates).where(
    and(eq(estimates.id, id), eq(estimates.userId, userId))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function generateEstimateNumber() {
  const db = await getDb();
  if (!db) return "EST-001";

  const existing = await db.select({ estimateNumber: estimates.estimateNumber }).from(estimates);
  const highestNumber = existing.reduce((highest, estimate) => {
    const match = estimate.estimateNumber?.trim().match(/^EST-(\\d+)$/i);
    if (!match) return highest;

    const parsed = Number.parseInt(match[1], 10);
    return Number.isFinite(parsed) ? Math.max(highest, parsed) : highest;
  }, 0);

  return `EST-${String(highestNumber + 1).padStart(3, "0")}`;
}

export async function estimateNumberExists(estimateNumber: string) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: estimates.id }).from(estimates)
    .where(eq(estimates.estimateNumber, estimateNumber))
    .limit(1);
  return result.length > 0;
}

export async function createEstimate(data: InsertEstimate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(estimates).values(data);
}

export async function listEstimates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(estimates).orderBy(desc(estimates.createdAt));
}

// Appointment queries

export async function deleteEstimate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete line items first
  await db.delete(estimateLineItems).where(eq(estimateLineItems.estimateId, id));
  
  // Then delete the estimate
  return db.delete(estimates).where(eq(estimates.id, id));
}

export async function updateEstimateStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .update(estimates)
    .set({ status: status as any })
    .where(eq(estimates.id, id));
}

export async function getAppointmentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appointments).where(eq(appointments.userId, userId));
}

export async function getAppointmentById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appointments).where(
    and(eq(appointments.id, id), eq(appointments.userId, userId))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAppointment(data: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(appointments).values(data);
}

export async function getAppointmentsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appointments).where(eq(appointments.projectId, projectId));
}

export async function updateAppointment(id: number, data: Partial<InsertAppointment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(appointments).set(data).where(eq(appointments.id, id));
}

export async function deleteAppointment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(appointments).where(eq(appointments.id, id));
}

// Photo queries
export async function getProjectsByCustomerId(customerId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(
    and(eq(projects.customerId, customerId), eq(projects.userId, userId))
  );
}

export async function getPhotosByProjectId(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(photos).where(
    and(eq(photos.projectId, projectId), eq(photos.userId, userId))
  );
}

export async function createPhoto(data: InsertPhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(photos).values(data);
  const insertId = (result as any)[0]?.insertId || 1;
  const rows = await db.select().from(photos).where(eq(photos.id, insertId));
  return rows[0] || { id: insertId, ...data };
}

export async function updatePhoto(id: number, userId: number, data: Partial<InsertPhoto>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(photos).set(data).where(
    and(eq(photos.id, id), eq(photos.userId, userId))
  );
}

export async function deletePhoto(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(photos).where(
    and(eq(photos.id, id), eq(photos.userId, userId))
  );
}

// Damage queries
export async function getDamagesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(damages).where(eq(damages.userId, userId));
}

export async function getDamagesByProjectId(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(damages).where(
    and(eq(damages.projectId, projectId), eq(damages.userId, userId))
  );
}

export async function getDamageById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(damages).where(
    and(eq(damages.id, id), eq(damages.userId, userId))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createDamage(data: InsertDamage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(damages).values(data);
}

export async function updateDamage(id: number, userId: number, data: Partial<InsertDamage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(damages).set(data).where(
    and(eq(damages.id, id), eq(damages.userId, userId))
  );
}

export async function deleteDamage(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(damages).where(
    and(eq(damages.id, id), eq(damages.userId, userId))
  );
}

// Damage photo queries
export async function getDamagePhotos(damageId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(damagePhotos).where(eq(damagePhotos.damageId, damageId));
}

export async function createDamagePhoto(data: InsertDamagePhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(damagePhotos).values(data);
}

export async function deleteDamagePhoto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(damagePhotos).where(eq(damagePhotos.id, id));
}

// Inspection queries
export async function getInspectionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inspections).where(eq(inspections.userId, userId)).orderBy(desc(inspections.createdAt));
}

export async function getInspectionById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inspections).where(
    and(eq(inspections.id, id), eq(inspections.userId, userId))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createInspection(data: InsertInspection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(inspections).values(data);
  const inspectionId = Number(result[0]?.insertId);
  if (!inspectionId) throw new Error("Failed to create inspection");
  return getInspectionById(inspectionId, data.userId);
}

export async function updateInspection(id: number, userId: number, data: Partial<InsertInspection>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(inspections).set(data).where(
    and(eq(inspections.id, id), eq(inspections.userId, userId))
  );
}

export async function getInspectionItems(inspectionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inspectionItems).where(eq(inspectionItems.inspectionId, inspectionId)).orderBy(inspectionItems.id);
}

export async function createInspectionItem(data: InsertInspectionItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(inspectionItems).values(data);
  return Number(result[0]?.insertId);
}

export async function updateInspectionItem(id: number, inspectionId: number, data: Partial<InsertInspectionItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(inspectionItems).set(data).where(
    and(eq(inspectionItems.id, id), eq(inspectionItems.inspectionId, inspectionId))
  );
}

export async function deleteInspectionItem(id: number, inspectionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(inspectionItems).where(
    and(eq(inspectionItems.id, id), eq(inspectionItems.inspectionId, inspectionId))
  );
}

// Materials functions
export async function getMaterialsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(materials).where(eq(materials.userId, userId));
}

export async function createMaterial(data: InsertMaterial) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(materials).values(data);
  return result;
}

export async function updateMaterial(id: number, data: Partial<InsertMaterial>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(materials).set(data).where(eq(materials.id, id));
}

export async function deleteMaterial(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(materials).where(eq(materials.id, id));
}

// Estimate Line Items
export async function createEstimateLineItem(data: InsertEstimateLineItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(estimateLineItems).values(data);
  return result;
}

export async function getEstimateLineItems(estimateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(estimateLineItems).where(eq(estimateLineItems.estimateId, estimateId));
}

export async function deleteEstimateLineItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(estimateLineItems).where(eq(estimateLineItems.id, id));
}

export async function updateEstimateLineItem(id: number, data: Partial<InsertEstimateLineItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(estimateLineItems).set(data).where(eq(estimateLineItems.id, id));
}

export async function updateEstimate(id: number, data: Partial<InsertEstimate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(estimates).set(data).where(eq(estimates.id, id));
}

// Crew queries
export async function getCrewsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crews).where(eq(crews.userId, userId));
}

export async function getCrewById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(crews).where(
    and(eq(crews.id, id), eq(crews.userId, userId))
  );
  return result.length > 0 ? result[0] : undefined;
}

export type CrewProductivity = {
  id: number;
  name: string;
  status: "active" | "inactive";
  memberCount: number;
  totalJobs: number;
  eligibleJobs: number;
  completedJobs: number;
  activeJobs: number;
  scheduledJobs: number;
  completionRate: number;
  completedValue: number;
  averageCompletedValue: number;
  pipelineValue: number;
  jobsPerMember: number;
};

/**
 * Aggregates the operational workload and completed-job output for every crew
 * owned by a user. Completion is based on non-cancelled assigned projects.
 */
export async function getCrewProductivity(userId: number): Promise<CrewProductivity[]> {
  const db = await getDb();
  if (!db) return [];

  const crewRows = await db.select().from(crews).where(eq(crews.userId, userId));
  if (crewRows.length === 0) return [];

  const crewIds = crewRows.map((crew) => crew.id);
  const [projectRows, memberRows] = await Promise.all([
    db
      .select()
      .from(projects)
      .where(and(eq(projects.userId, userId), inArray(projects.crewId, crewIds))),
    db.select().from(crewMembers).where(inArray(crewMembers.crewId, crewIds)),
  ]);

  const memberCounts = new Map<number, number>();
  for (const member of memberRows) {
    memberCounts.set(member.crewId, (memberCounts.get(member.crewId) ?? 0) + 1);
  }

  return crewRows
    .map((crew) => {
      const crewProjects = projectRows.filter((project) => project.crewId === crew.id);
      const completedProjects = crewProjects.filter((project) => project.status === "completed");
      const scheduledJobs = crewProjects.filter((project) => project.status === "scheduled").length;
      const activeJobs = crewProjects.filter((project) =>
        ["scheduled", "in_progress", "on_hold"].includes(project.status),
      ).length;
      const eligibleJobs = crewProjects.filter((project) => project.status !== "cancelled").length;
      const completedValue = completedProjects.reduce(
        (total, project) => total + Number(project.actualValue ?? project.estimatedValue ?? 0),
        0,
      );
      const pipelineValue = crewProjects
        .filter((project) => project.status !== "completed" && project.status !== "cancelled")
        .reduce((total, project) => total + Number(project.estimatedValue ?? 0), 0);
      const memberCount = memberCounts.get(crew.id) ?? 0;
      const completedJobs = completedProjects.length;

      return {
        id: crew.id,
        name: crew.name,
        status: crew.status,
        memberCount,
        totalJobs: crewProjects.length,
        eligibleJobs,
        completedJobs,
        activeJobs,
        scheduledJobs,
        completionRate: eligibleJobs > 0 ? Math.round((completedJobs / eligibleJobs) * 100) : 0,
        completedValue,
        averageCompletedValue: completedJobs > 0 ? completedValue / completedJobs : 0,
        pipelineValue,
        jobsPerMember: memberCount > 0 ? completedJobs / memberCount : 0,
      };
    })
    .sort((left, right) => right.completedJobs - left.completedJobs || right.completedValue - left.completedValue);
}

export async function createCrew(data: InsertCrew) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(crews).values(data);
  const crewId = result[0]?.insertId;
  if (!crewId) throw new Error("Failed to create crew");
  const created = await getCrewById(crewId, data.userId);
  if (!created) throw new Error("Failed to retrieve created crew");
  return created;
}

export async function updateCrew(id: number, userId: number, data: Partial<InsertCrew>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(crews).set(data).where(
    and(eq(crews.id, id), eq(crews.userId, userId))
  );
}

export async function deleteCrew(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(crews).where(
    and(eq(crews.id, id), eq(crews.userId, userId))
  );
}

// Invoice queries
export async function getInvoicesByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invoices).where(eq(invoices.projectId, projectId));
}

export async function getInvoicesByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invoices).where(eq(invoices.customerId, customerId));
}

export async function getInvoiceById(invoiceId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  return result[0] || null;
}

export async function createInvoice(data: InsertInvoice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(invoices).values(data);
}

export async function updateInvoice(invoiceId: number, data: Partial<InsertInvoice>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(invoices).set(data).where(eq(invoices.id, invoiceId));
}

export async function deleteInvoice(invoiceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(invoices).where(eq(invoices.id, invoiceId));
}

export async function generateInvoiceNumber(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const count = await db
    .select({ count: sql`COUNT(*)` })
    .from(invoices)
    .where(and(eq(invoices.userId, userId), sql`YEAR(createdAt) = ${year}`));
  const invoiceCount = (count[0]?.count as number) + 1;
  return `INV-${year}${month}-${String(invoiceCount).padStart(4, "0")}`;
}


// Invoice Template helpers
export async function getInvoiceTemplates(userId: number): Promise<InvoiceTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invoiceTemplates).where(eq(invoiceTemplates.userId, userId));
}

export async function getInvoiceTemplateById(id: number): Promise<InvoiceTemplate | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(invoiceTemplates).where(eq(invoiceTemplates.id, id));
  return result[0] || null;
}

export async function getDefaultInvoiceTemplate(userId: number): Promise<InvoiceTemplate | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(invoiceTemplates)
    .where(and(eq(invoiceTemplates.userId, userId), eq(invoiceTemplates.isDefault, true)));
  return result[0] || null;
}

export async function createInvoiceTemplate(data: InsertInvoiceTemplate): Promise<InvoiceTemplate> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // If this is being set as default, unset other defaults
  if (data.isDefault) {
    await db
      .update(invoiceTemplates)
      .set({ isDefault: false })
      .where(eq(invoiceTemplates.userId, data.userId));
  }
  
  const result = await db.insert(invoiceTemplates).values(data);
  const templateId = result[0]?.insertId;
  if (!templateId) throw new Error("Failed to create invoice template");
  
  const created = await getInvoiceTemplateById(templateId);
  if (!created) throw new Error("Failed to retrieve created template");
  return created;
}

export async function updateInvoiceTemplate(id: number, data: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // If setting as default, unset other defaults for this user
  if (data.isDefault) {
    const template = await getInvoiceTemplateById(id);
    if (template) {
      await db
        .update(invoiceTemplates)
        .set({ isDefault: false })
        .where(and(eq(invoiceTemplates.userId, template.userId), eq(invoiceTemplates.isDefault, true)));
    }
  }
  
  await db.update(invoiceTemplates).set(data).where(eq(invoiceTemplates.id, id));
  
  const updated = await getInvoiceTemplateById(id);
  if (!updated) throw new Error("Failed to retrieve updated template");
  return updated;
}

export async function deleteInvoiceTemplate(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(invoiceTemplates).where(eq(invoiceTemplates.id, id));
}


// Payment helpers
export async function getPaymentsByInvoice(invoiceId: number): Promise<Payment[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
}

export async function getPaymentsByUser(userId: number): Promise<Payment[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).where(eq(payments.userId, userId));
}

export async function getPaymentById(id: number): Promise<Payment | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(payments).where(eq(payments.id, id));
  return result[0] || null;
}

export async function getPaymentByStripeId(stripePaymentIntentId: string): Promise<Payment | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(payments).where(eq(payments.stripePaymentIntentId, stripePaymentIntentId));
  return result[0] || null;
}

export async function createPayment(data: InsertPayment): Promise<Payment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(payments).values(data);
  const paymentId = result[0]?.insertId;
  if (!paymentId) throw new Error("Failed to create payment");
  
  const created = await getPaymentById(paymentId);
  if (!created) throw new Error("Failed to retrieve created payment");
  return created;
}

export async function updatePayment(id: number, data: Partial<InsertPayment>): Promise<Payment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(payments).set(data).where(eq(payments.id, id));
  
  const updated = await getPaymentById(id);
  if (!updated) throw new Error("Failed to retrieve updated payment");
  return updated;
}

export async function getInvoicePaymentTotal(invoiceId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db
    .select({ total: sql`SUM(amount)` })
    .from(payments)
    .where(and(eq(payments.invoiceId, invoiceId), eq(payments.status, "succeeded")));
  
  return parseFloat(result[0]?.total as string) || 0;
}


// Financial Reporting helpers
export async function getTotalRevenue(userId: number, startDate?: Date, endDate?: Date): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ total: sql`SUM(amount)` })
    .from(payments)
    .where(
      and(
        eq(payments.userId, userId),
        eq(payments.status, "succeeded"),
        startDate ? sql`createdAt >= ${startDate}` : undefined,
        endDate ? sql`createdAt <= ${endDate}` : undefined
      )
    );

  return parseFloat(result[0]?.total as string) || 0;
}

export async function getRevenueByMonth(userId: number, year: number): Promise<Array<{ month: number; revenue: number }>> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      month: sql`MONTH(createdAt)`,
      revenue: sql`SUM(amount)`,
    })
    .from(payments)
    .where(and(eq(payments.userId, userId), eq(payments.status, "succeeded"), sql`YEAR(createdAt) = ${year}`))
    .groupBy(sql`MONTH(createdAt)`);

  return result.map((r: any) => ({
    month: r.month,
    revenue: parseFloat(r.revenue) || 0,
  }));
}

export async function getInvoiceStats(userId: number): Promise<{
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalInvoices: 0,
      paidInvoices: 0,
      unpaidInvoices: 0,
      overdueInvoices: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
    };
  }

  const invoiceData = await db
    .select({
      status: invoices.status,
      count: sql`COUNT(*)`,
      totalAmount: sql`SUM(total)`,
    })
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .groupBy(invoices.status);

  let totalInvoices = 0;
  let paidInvoices = 0;
  let unpaidInvoices = 0;
  let overdueInvoices = 0;
  let totalAmount = 0;
  let paidAmount = 0;
  let unpaidAmount = 0;

  for (const row of invoiceData) {
    const count = (row.count as number) || 0;
    const amount = parseFloat(row.totalAmount as string) || 0;

    totalInvoices += count;
    totalAmount += amount;

    if (row.status === "paid") {
      paidInvoices += count;
      paidAmount += amount;
    } else if (row.status === "overdue") {
      overdueInvoices += count;
      unpaidAmount += amount;
    } else {
      unpaidInvoices += count;
      unpaidAmount += amount;
    }
  }

  return {
    totalInvoices,
    paidInvoices,
    unpaidInvoices,
    overdueInvoices,
    totalAmount,
    paidAmount,
    unpaidAmount,
  };
}

export async function getProjectStats(userId: number): Promise<{
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalProjectValue: number;
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      totalProjectValue: 0,
    };
  }

  const projectData = await db
    .select({
      status: projects.status,
      count: sql`COUNT(*)`,
    })
    .from(projects)
    .where(eq(projects.userId, userId))
    .groupBy(projects.status);

  let totalProjects = 0;
  let activeProjects = 0;
  let completedProjects = 0;

  for (const row of projectData) {
    const count = (row.count as number) || 0;
    totalProjects += count;

    if (row.status === "in_progress") {
      activeProjects += count;
    } else if (row.status === "completed") {
      completedProjects += count;
    }
  }

  // Get total project value from estimates
  const estimateData = await db
    .select({ totalValue: sql`SUM(total)` })
    .from(estimates)
    .where(eq(estimates.userId, userId));

  const totalProjectValue = parseFloat(estimateData[0]?.totalValue as string) || 0;

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    totalProjectValue,
  };
}


// Crew Skills helpers
export async function getCrewSkills(crewId: number): Promise<CrewSkill[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crewSkills).where(eq(crewSkills.crewId, crewId));
}

export async function getCrewSkillById(id: number): Promise<CrewSkill | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(crewSkills).where(eq(crewSkills.id, id));
  return result[0] || null;
}

export async function createCrewSkill(data: InsertCrewSkill): Promise<CrewSkill> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(crewSkills).values(data);
  const skillId = result[0]?.insertId;
  if (!skillId) throw new Error("Failed to create crew skill");
  
  const created = await getCrewSkillById(skillId);
  if (!created) throw new Error("Failed to retrieve created crew skill");
  return created;
}

export async function updateCrewSkill(id: number, data: Partial<InsertCrewSkill>): Promise<CrewSkill> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(crewSkills).set(data).where(eq(crewSkills.id, id));
  
  const updated = await getCrewSkillById(id);
  if (!updated) throw new Error("Failed to retrieve updated crew skill");
  return updated;
}

export async function deleteCrewSkill(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(crewSkills).where(eq(crewSkills.id, id));
}

export async function getExpiredCertifications(userId: number): Promise<CrewSkill[]> {
  const db = await getDb();
  if (!db) return [];
  
  const today = new Date();
  return db.select().from(crewSkills)
    .where(and(
      eq(crewSkills.userId, userId),
      sql`expirationDate < ${today}`
    ));
}

export async function getExpiringCertifications(userId: number, daysUntilExpiry: number = 30): Promise<CrewSkill[]> {
  const db = await getDb();
  if (!db) return [];
  
  const today = new Date();
  const futureDate = new Date(today.getTime() + daysUntilExpiry * 24 * 60 * 60 * 1000);
  
  return db.select().from(crewSkills)
    .where(and(
      eq(crewSkills.userId, userId),
      sql`expirationDate BETWEEN ${today} AND ${futureDate}`
    ));
}

// Skill Categories helpers
export async function getSkillCategories(userId: number): Promise<SkillCategory[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(skillCategories).where(eq(skillCategories.userId, userId));
}

export async function createSkillCategory(data: InsertSkillCategory): Promise<SkillCategory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(skillCategories).values(data);
  const categoryId = result[0]?.insertId;
  if (!categoryId) throw new Error("Failed to create skill category");
  
  const created = await db.select().from(skillCategories).where(eq(skillCategories.id, categoryId));
  return created[0];
}

// Predefined Skills helpers
export async function getPredefinedSkills(userId: number): Promise<PredefinedSkill[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(predefinedSkills).where(eq(predefinedSkills.userId, userId));
}

export async function getRequiredSkills(userId: number): Promise<PredefinedSkill[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(predefinedSkills)
    .where(and(eq(predefinedSkills.userId, userId), eq(predefinedSkills.isRequired, true)));
}

export async function createPredefinedSkill(data: InsertPredefinedSkill): Promise<PredefinedSkill> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(predefinedSkills).values(data);
  const skillId = result[0]?.insertId;
  if (!skillId) throw new Error("Failed to create predefined skill");
  
  const created = await db.select().from(predefinedSkills).where(eq(predefinedSkills.id, skillId));
  return created[0];
}


// Crew Members helpers
export async function getCrewMembers(crewId: number): Promise<CrewMember[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crewMembers).where(eq(crewMembers.crewId, crewId));
}

export async function addCrewMember(data: InsertCrewMember): Promise<CrewMember> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(crewMembers).values(data);
  const memberId = result[0]?.insertId;
  if (!memberId) throw new Error("Failed to create crew member");
  
  const created = await db.select().from(crewMembers).where(eq(crewMembers.id, memberId));
  return created[0];
}

export async function updateCrewMember(id: number, data: Partial<InsertCrewMember>): Promise<CrewMember> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(crewMembers).set(data).where(eq(crewMembers.id, id));
  const updated = await db.select().from(crewMembers).where(eq(crewMembers.id, id));
  return updated[0];
}

export async function deleteCrewMember(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(crewMembers).where(eq(crewMembers.id, id));
}


// Crew Member Skills
export async function getCrewMemberSkills(crewMemberId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crewMemberSkills).where(eq(crewMemberSkills.crewMemberId, crewMemberId));
}

export async function addCrewMemberSkill(data: {
  crewMemberId: number;
  skillName: string;
  certificationNumber?: string;
  expirationDate?: Date;
  isActive: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(crewMemberSkills).values({
    crewMemberId: data.crewMemberId,
    skillName: data.skillName,
    certificationNumber: data.certificationNumber || null,
    expirationDate: data.expirationDate || null,
    isActive: data.isActive,
  });
  
  const skillId = result[0]?.insertId;
  if (!skillId) throw new Error("Failed to create crew member skill");
  
  const created = await db.select().from(crewMemberSkills).where(eq(crewMemberSkills.id, skillId));
  return created[0];
}

export async function deleteCrewMemberSkill(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(crewMemberSkills).where(eq(crewMemberSkills.id, id));
}

// Customer Notes helpers
export async function getCustomerNotes(customerId: number, userId: number): Promise<CustomerNote[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customerNotes)
    .where(and(eq(customerNotes.customerId, customerId), eq(customerNotes.userId, userId)))
    .orderBy(desc(customerNotes.createdAt));
}

export async function getCustomerNoteById(id: number, userId: number): Promise<CustomerNote | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(customerNotes)
    .where(and(eq(customerNotes.id, id), eq(customerNotes.userId, userId)));
  return result[0] || null;
}

export async function createCustomerNote(data: InsertCustomerNote): Promise<CustomerNote> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(customerNotes).values(data);
  const noteId = result[0]?.insertId;
  if (!noteId) throw new Error("Failed to create customer note");
  
  const created = await db.select().from(customerNotes).where(eq(customerNotes.id, noteId));
  return created[0];
}

export async function updateCustomerNote(id: number, userId: number, data: Partial<InsertCustomerNote>): Promise<CustomerNote> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(customerNotes).set(data).where(
    and(eq(customerNotes.id, id), eq(customerNotes.userId, userId))
  );
  
  const updated = await getCustomerNoteById(id, userId);
  if (!updated) throw new Error("Failed to retrieve updated customer note");
  return updated;
}

export async function deleteCustomerNote(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(customerNotes).where(
    and(eq(customerNotes.id, id), eq(customerNotes.userId, userId))
  );
}

// Get customer lifetime value (total project value)
export async function getCustomerLifetimeValue(customerId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db
    .select({ totalValue: sql`SUM(CAST(${estimates.subtotal} AS DECIMAL(10,2)))` })
    .from(estimates)
    .where(eq(estimates.customerId, customerId));
  
  return parseFloat(result[0]?.totalValue as string) || 0;
}

// Get customer project summary
export async function getCustomerProjectSummary(customerId: number): Promise<{
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalValue: number;
}> {
  const db = await getDb();
  if (!db) return { totalProjects: 0, activeProjects: 0, completedProjects: 0, totalValue: 0 };
  
  // Get project counts by status
  const projectData = await db
    .select({
      status: projects.status,
      count: sql`COUNT(*)`,
    })
    .from(projects)
    .where(eq(projects.customerId, customerId))
    .groupBy(projects.status);
  
  let totalProjects = 0;
  let activeProjects = 0;
  let completedProjects = 0;
  
  for (const row of projectData) {
    const count = (row.count as number) || 0;
    totalProjects += count;
    
    if (row.status === "in_progress" || row.status === "scheduled") {
      activeProjects += count;
    } else if (row.status === "completed") {
      completedProjects += count;
    }
  }
  
  // Get total value from estimates
  const totalValue = await getCustomerLifetimeValue(customerId);
  
  return { totalProjects, activeProjects, completedProjects, totalValue };
}


export async function assignCrewToProject(projectId: number, crewId: number, userId: number): Promise<any> {
  const db = await getDb() as any;
  if (!db) throw new Error("Database not available");

  // Verify project belongs to the current user using the same query API as the rest of this module.
  const projectRows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (projectRows.length === 0) {
    throw new Error("Project not found or unauthorized");
  }

  // Verify the crew exists before changing the project.
  const crewRows = await db
    .select({ id: crews.id })
    .from(crews)
    .where(eq(crews.id, crewId))
    .limit(1);

  if (crewRows.length === 0) {
    throw new Error("Crew not found");
  }

  // Update only the authorized project with the selected crew.
  await db
    .update(projects)
    .set({ crewId })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

  return { success: true, projectId, crewId };
}

export async function removeCrewFromProject(projectId: number, userId: number): Promise<any> {
  const db = await getDb() as any;
  if (!db) throw new Error("Database not available");

  // Verify project belongs to the current user using the same query API as the rest of this module.
  const projectRows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (projectRows.length === 0) {
    throw new Error("Project not found or unauthorized");
  }

  // Remove the crew only from the authorized project.
  await db
    .update(projects)
    .set({ crewId: null })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

  return { success: true, projectId };
}


export async function getProjectsByCrew(crewId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects)
    .where(and(eq(projects.crewId, crewId), eq(projects.userId, userId)))
    .orderBy(desc(projects.createdAt));
}


export async function getInvoicesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.createdAt));
}

// -----------------------------------------------------------------------------
// Subcontractor-centric company account foundation
// -----------------------------------------------------------------------------

type CompanyFilters = {
  accountType?: "partner" | "direct_customer";
  status?: "active" | "inactive" | "on_hold";
  search?: string;
};

export async function recordActivity(data: InsertActivityLog): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(activityLog).values(data);
}

export async function getCompanyById(id: number, userId: number): Promise<Company | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, id), eq(companies.userId, userId)))
    .limit(1);
  return result[0];
}

export async function listCompanies(userId: number, filters: CompanyFilters = {}): Promise<Company[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(companies.userId, userId)];
  if (filters.accountType) conditions.push(eq(companies.accountType, filters.accountType));
  if (filters.status) conditions.push(eq(companies.status, filters.status));
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(or(like(companies.name, term), like(companies.legalName, term), like(companies.email, term), like(companies.phone, term))!);
  }

  return db.select().from(companies).where(and(...conditions)).orderBy(asc(companies.name));
}

export async function createCompany(data: InsertCompany): Promise<Company> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(companies).values(data);
  const companyId = Number(result[0]?.insertId);
  const created = await getCompanyById(companyId, data.userId);
  if (!created) throw new Error("Failed to create company account");
  await recordActivity({
    userId: data.userId,
    entityType: "company",
    entityId: created.id,
    action: "created",
    details: `Created ${created.accountType} account: ${created.name}`,
  });
  return created;
}

export async function updateCompany(id: number, userId: number, data: Partial<InsertCompany>): Promise<Company> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const current = await getCompanyById(id, userId);
  if (!current) throw new Error("Company account not found");
  await db.update(companies).set(data).where(eq(companies.id, id));
  const updated = await getCompanyById(id, userId);
  if (!updated) throw new Error("Failed to update company account");
  await recordActivity({
    userId,
    entityType: "company",
    entityId: id,
    action: "updated",
    details: `Updated company account: ${updated.name}`,
  });
  return updated;
}

export async function getCompanyContactById(id: number, userId: number): Promise<CompanyContact | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const contact = await db.select().from(companyContacts).where(eq(companyContacts.id, id)).limit(1);
  if (!contact[0]) return undefined;
  const company = await getCompanyById(contact[0].companyId, userId);
  return company ? contact[0] : undefined;
}

export async function listCompanyContacts(companyId: number, userId: number): Promise<CompanyContact[]> {
  const db = await getDb();
  if (!db) return [];
  const company = await getCompanyById(companyId, userId);
  if (!company) return [];
  return db.select().from(companyContacts).where(eq(companyContacts.companyId, companyId)).orderBy(desc(companyContacts.isPrimary), asc(companyContacts.lastName), asc(companyContacts.firstName));
}

export async function createCompanyContact(data: InsertCompanyContact, userId: number): Promise<CompanyContact> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const company = await getCompanyById(data.companyId, userId);
  if (!company) throw new Error("Company account not found");

  if (data.isPrimary) {
    await db.update(companyContacts).set({ isPrimary: false }).where(eq(companyContacts.companyId, data.companyId));
  }

  const result = await db.insert(companyContacts).values(data);
  const contactId = Number(result[0]?.insertId);
  const created = await getCompanyContactById(contactId, userId);
  if (!created) throw new Error("Failed to create company contact");
  await recordActivity({
    userId,
    entityType: "company_contact",
    entityId: created.id,
    action: "created",
    details: `Added ${created.firstName} ${created.lastName} to ${company.name}`,
  });
  return created;
}

export async function updateCompanyContact(id: number, userId: number, data: Partial<InsertCompanyContact>): Promise<CompanyContact> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const current = await getCompanyContactById(id, userId);
  if (!current) throw new Error("Company contact not found");

  if (data.isPrimary) {
    await db.update(companyContacts).set({ isPrimary: false }).where(eq(companyContacts.companyId, current.companyId));
  }

  await db.update(companyContacts).set(data).where(eq(companyContacts.id, id));
  const updated = await getCompanyContactById(id, userId);
  if (!updated) throw new Error("Failed to update company contact");
  await recordActivity({
    userId,
    entityType: "company_contact",
    entityId: id,
    action: "updated",
    details: `Updated contact: ${updated.firstName} ${updated.lastName}`,
  });
  return updated;
}

export async function listCompanyNotes(companyId: number, userId: number): Promise<CompanyNote[]> {
  const db = await getDb();
  if (!db) return [];
  const company = await getCompanyById(companyId, userId);
  if (!company) return [];
  return db.select().from(companyNotes).where(eq(companyNotes.companyId, companyId)).orderBy(desc(companyNotes.createdAt));
}

export async function createCompanyNote(data: InsertCompanyNote): Promise<CompanyNote> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const company = await getCompanyById(data.companyId, data.userId);
  if (!company) throw new Error("Company account not found");
  const result = await db.insert(companyNotes).values(data);
  const noteId = Number(result[0]?.insertId);
  const note = await db.select().from(companyNotes).where(eq(companyNotes.id, noteId)).limit(1);
  if (!note[0]) throw new Error("Failed to create company note");
  await recordActivity({
    userId: data.userId,
    entityType: "company",
    entityId: data.companyId,
    action: "note_added",
    details: `Added ${data.noteType} account note`,
  });
  return note[0];
}

export async function getJobSiteById(id: number, userId: number): Promise<JobSite | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const site = await db.select().from(jobSites).where(eq(jobSites.id, id)).limit(1);
  if (!site[0]) return undefined;
  const company = await getCompanyById(site[0].companyId, userId);
  return company ? site[0] : undefined;
}

export async function listJobSites(companyId: number, userId: number, includeInactive = false): Promise<JobSite[]> {
  const db = await getDb();
  if (!db) return [];
  const company = await getCompanyById(companyId, userId);
  if (!company) return [];
  const whereClause = includeInactive
    ? eq(jobSites.companyId, companyId)
    : and(eq(jobSites.companyId, companyId), eq(jobSites.isActive, true));
  return db.select().from(jobSites).where(whereClause).orderBy(asc(jobSites.name), asc(jobSites.address));
}

export async function createJobSite(data: InsertJobSite, userId: number): Promise<JobSite> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const company = await getCompanyById(data.companyId, userId);
  if (!company) throw new Error("Company account not found");
  const result = await db.insert(jobSites).values(data);
  const siteId = Number(result[0]?.insertId);
  const created = await getJobSiteById(siteId, userId);
  if (!created) throw new Error("Failed to create job site");
  await recordActivity({
    userId,
    entityType: "job_site",
    entityId: created.id,
    action: "created",
    details: `Added job site for ${company.name}: ${created.address}`,
  });
  return created;
}

export async function updateJobSite(id: number, userId: number, data: Partial<InsertJobSite>): Promise<JobSite> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const current = await getJobSiteById(id, userId);
  if (!current) throw new Error("Job site not found");
  await db.update(jobSites).set(data).where(eq(jobSites.id, id));
  const updated = await getJobSiteById(id, userId);
  if (!updated) throw new Error("Failed to update job site");
  await recordActivity({
    userId,
    entityType: "job_site",
    entityId: id,
    action: "updated",
    details: `Updated job site: ${updated.address}`,
  });
  return updated;
}

export async function getAccountHistory(companyId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  const company = await getCompanyById(companyId, userId);
  if (!company) return [];
  const workOrderRows = await db.select().from(workOrders).where(eq(workOrders.companyId, companyId)).orderBy(desc(workOrders.updatedAt));
  const siteRows = await db.select().from(jobSites).where(eq(jobSites.companyId, companyId));
  const siteIds = siteRows.map((site) => site.id);
  const documentFilter = siteIds.length > 0
    ? or(eq(documents.companyId, companyId), inArray(documents.jobSiteId, siteIds))
    : eq(documents.companyId, companyId);
  const documentRows = await db
    .select()
    .from(documents)
    .where(documentFilter)
    .orderBy(desc(documents.createdAt));
  const [noteRows, financials] = await Promise.all([
    listCompanyNotes(companyId, userId),
    getCompanyFinancials(companyId, userId),
  ]);
  const financialEntries = financials?.invoices.flatMap((invoice) => [
    { type: "invoice" as const, id: invoice.id, title: invoice.invoiceNumber, detail: `${invoice.status} · $${Number(invoice.total).toFixed(2)}`, occurredAt: invoice.issueDate },
    ...invoice.payments.filter((payment) => payment.status === "succeeded").map((payment) => ({ type: "payment" as const, id: payment.id, title: `Payment ${invoice.invoiceNumber}`, detail: `$${Number(payment.amount).toFixed(2)} · ${payment.paymentMethod ?? "payment"}`, occurredAt: payment.paymentDate ?? payment.createdAt })),
  ]) ?? [];

  return [
    ...workOrderRows.map((workOrder) => ({ type: "work_order" as const, id: workOrder.id, title: workOrder.workOrderNumber, detail: workOrder.status, occurredAt: workOrder.updatedAt })),
    ...documentRows.map((document) => ({ type: "document" as const, id: document.id, title: document.fileName, detail: document.documentType, occurredAt: document.createdAt })),
    ...noteRows.map((note) => ({ type: "note" as const, id: note.id, title: note.noteType, detail: note.content, occurredAt: note.createdAt })),
    ...financialEntries,
  ].sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
}

// -----------------------------------------------------------------------------
// Work order intake, structured scope, search, and status lifecycle
// -----------------------------------------------------------------------------

export type WorkOrderListItem = WorkOrder & {
  companyName: string;
  jobSiteName: string | null;
  jobSiteAddress: string;
  jobSiteCity: string | null;
};

export type WorkOrderFilters = {
  companyId?: number;
  jobSiteId?: number;
  status?: WorkOrderStatus;
  search?: string;
  deadlineFrom?: Date;
  deadlineTo?: Date;
};

export type WorkOrderScopeInput = Pick<InsertWorkOrderScope, "category" | "description" | "quantity" | "unit">;

async function assertWorkOrderOwnership(data: Pick<InsertWorkOrder, "companyId" | "jobSiteId" | "contactId" | "projectId" | "userId">): Promise<void> {
  const company = await getCompanyById(data.companyId, data.userId);
  if (!company) throw new Error("Company account not found");

  const jobSite = await getJobSiteById(data.jobSiteId, data.userId);
  if (!jobSite || jobSite.companyId !== data.companyId) {
    throw new Error("Job site does not belong to the selected company account");
  }

  if (data.contactId) {
    const contact = await getCompanyContactById(data.contactId, data.userId);
    if (!contact || contact.companyId !== data.companyId) {
      throw new Error("Company contact does not belong to the selected company account");
    }
  }

  if (data.projectId) {
    const project = await getProjectById(data.projectId, data.userId);
    if (!project) throw new Error("Linked project not found");
  }
}

export async function generateWorkOrderNumber(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const today = new Date();
  const period = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`;
  const count = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(workOrders)
    .where(and(eq(workOrders.userId, userId), sql`DATE_FORMAT(${workOrders.createdAt}, '%Y%m') = ${period}`));
  const nextSequence = Number(count[0]?.count ?? 0) + 1;
  return `WO-${period}-${String(nextSequence).padStart(4, "0")}`;
}

export async function getWorkOrderById(id: number, userId: number): Promise<WorkOrder | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(workOrders).where(and(eq(workOrders.id, id), eq(workOrders.userId, userId))).limit(1);
  return result[0];
}

export async function listWorkOrders(userId: number, filters: WorkOrderFilters = {}): Promise<WorkOrderListItem[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(workOrders.userId, userId)];
  if (filters.companyId) conditions.push(eq(workOrders.companyId, filters.companyId));
  if (filters.jobSiteId) conditions.push(eq(workOrders.jobSiteId, filters.jobSiteId));
  if (filters.status) conditions.push(eq(workOrders.status, filters.status));
  if (filters.deadlineFrom) conditions.push(gte(workOrders.deadline, filters.deadlineFrom));
  if (filters.deadlineTo) conditions.push(lte(workOrders.deadline, filters.deadlineTo));
  if (filters.search?.trim()) {
    const searchTerm = `%${filters.search.trim()}%`;
    conditions.push(or(
      like(workOrders.workOrderNumber, searchTerm),
      like(workOrders.purchaseOrderNumber, searchTerm),
      like(workOrders.scopeSummary, searchTerm),
    )!);
  }
  const rows = await db.select().from(workOrders).where(and(...conditions)).orderBy(desc(workOrders.updatedAt));
  if (rows.length === 0) return [];
  const companyIds = Array.from(new Set(rows.map((row) => row.companyId)));
  const jobSiteIds = Array.from(new Set(rows.map((row) => row.jobSiteId)));
  const [companyRows, siteRows] = await Promise.all([
    db.select({ id: companies.id, name: companies.name }).from(companies).where(inArray(companies.id, companyIds)),
    db.select({ id: jobSites.id, name: jobSites.name, address: jobSites.address, city: jobSites.city }).from(jobSites).where(inArray(jobSites.id, jobSiteIds)),
  ]);
  const companyById = new Map(companyRows.map((company) => [company.id, company]));
  const siteById = new Map(siteRows.map((site) => [site.id, site]));
  return rows.map((row) => ({
    ...row,
    companyName: companyById.get(row.companyId)?.name ?? "Unknown company",
    jobSiteName: siteById.get(row.jobSiteId)?.name ?? null,
    jobSiteAddress: siteById.get(row.jobSiteId)?.address ?? "Unknown job site",
    jobSiteCity: siteById.get(row.jobSiteId)?.city ?? null,
  }));
}

export async function getWorkOrderDetail(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const workOrder = await getWorkOrderById(id, userId);
  if (!workOrder) return undefined;
  const [company, jobSite, contact, scopes, assignments, completion, changeOrderRows, documentRows, statusHistory, invoiceRows] = await Promise.all([
    getCompanyById(workOrder.companyId, userId),
    getJobSiteById(workOrder.jobSiteId, userId),
    workOrder.contactId ? getCompanyContactById(workOrder.contactId, userId) : Promise.resolve(undefined),
    db.select().from(workOrderScopes).where(eq(workOrderScopes.workOrderId, id)).orderBy(asc(workOrderScopes.createdAt)),
    db.select().from(workOrderAssignments).where(eq(workOrderAssignments.workOrderId, id)).orderBy(desc(workOrderAssignments.createdAt)),
    db.select().from(workOrderCompletions).where(eq(workOrderCompletions.workOrderId, id)).limit(1),
    db.select().from(changeOrders).where(eq(changeOrders.workOrderId, id)).orderBy(desc(changeOrders.createdAt)),
    db.select().from(documents).where(eq(documents.workOrderId, id)).orderBy(desc(documents.createdAt)),
    db.select().from(workOrderStatusHistory).where(eq(workOrderStatusHistory.workOrderId, id)).orderBy(desc(workOrderStatusHistory.createdAt)),
    db.select().from(invoices).where(and(eq(invoices.workOrderId, id), eq(invoices.userId, userId))).orderBy(desc(invoices.createdAt)),
  ]);
  const invoiceIds = invoiceRows.map((invoice) => invoice.id);
  const [paymentRows, lineItemRows] = invoiceIds.length > 0
    ? await Promise.all([
      db.select().from(payments).where(inArray(payments.invoiceId, invoiceIds)).orderBy(desc(payments.paymentDate), desc(payments.createdAt)),
      db.select().from(invoiceLineItems).where(inArray(invoiceLineItems.invoiceId, invoiceIds)).orderBy(asc(invoiceLineItems.createdAt)),
    ])
    : [[], []] as [Payment[], InvoiceLineItem[]];
  const invoicesWithDetails = invoiceRows.map((invoice) => ({
    ...invoice,
    lineItems: lineItemRows.filter((line) => line.invoiceId === invoice.id),
    payments: paymentRows.filter((payment) => payment.invoiceId === invoice.id),
  }));
  return {
    workOrder,
    company,
    jobSite,
    contact,
    scopes,
    assignments,
    completion: completion[0],
    changeOrders: changeOrderRows,
    documents: documentRows,
    statusHistory,
    invoices: invoicesWithDetails,
  };
}

export async function createWorkOrder(data: InsertWorkOrder, scopes: WorkOrderScopeInput[] = []): Promise<WorkOrder> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await assertWorkOrderOwnership(data);

  const result = await db.insert(workOrders).values(data);
  const workOrderId = Number(result[0]?.insertId);
  const created = await getWorkOrderById(workOrderId, data.userId);
  if (!created) throw new Error("Failed to create work order");

  if (scopes.length > 0) {
    await db.insert(workOrderScopes).values(scopes.map((scope) => ({ ...scope, workOrderId })));
  }
  await db.insert(workOrderStatusHistory).values({
    workOrderId,
    changedByUserId: data.createdByUserId,
    fromStatus: null,
    toStatus: created.status,
    reason: "Work order created",
  });
  await recordActivity({
    userId: data.userId,
    entityType: "work_order",
    entityId: workOrderId,
    action: "created",
    details: `Created work order ${created.workOrderNumber}`,
  });
  return created;
}

export async function updateWorkOrder(id: number, userId: number, data: Partial<InsertWorkOrder>): Promise<WorkOrder> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const current = await getWorkOrderById(id, userId);
  if (!current) throw new Error("Work order not found");
  if (data.status && data.status !== current.status) {
    throw new Error("Use the status transition workflow to change a work order status");
  }

  const ownershipInput = {
    userId,
    companyId: data.companyId ?? current.companyId,
    jobSiteId: data.jobSiteId ?? current.jobSiteId,
    contactId: data.contactId === undefined ? current.contactId : data.contactId,
    projectId: data.projectId === undefined ? current.projectId : data.projectId,
  };
  await assertWorkOrderOwnership(ownershipInput);
  await db.update(workOrders).set({ ...data, updatedByUserId: userId }).where(eq(workOrders.id, id));
  const updated = await getWorkOrderById(id, userId);
  if (!updated) throw new Error("Failed to update work order");
  await recordActivity({
    userId,
    entityType: "work_order",
    entityId: id,
    action: "updated",
    details: `Updated work order ${updated.workOrderNumber}`,
  });
  return updated;
}

export async function replaceWorkOrderScopes(workOrderId: number, userId: number, scopes: WorkOrderScopeInput[]): Promise<WorkOrderScope[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const workOrder = await getWorkOrderById(workOrderId, userId);
  if (!workOrder) throw new Error("Work order not found");
  await db.delete(workOrderScopes).where(eq(workOrderScopes.workOrderId, workOrderId));
  if (scopes.length > 0) {
    await db.insert(workOrderScopes).values(scopes.map((scope) => ({ ...scope, workOrderId })));
  }
  const updatedScopes = await db.select().from(workOrderScopes).where(eq(workOrderScopes.workOrderId, workOrderId)).orderBy(asc(workOrderScopes.createdAt));
  await recordActivity({
    userId,
    entityType: "work_order",
    entityId: workOrderId,
    action: "scope_updated",
    details: `Updated structured scope for ${workOrder.workOrderNumber}`,
  });
  return updatedScopes;
}

export async function transitionWorkOrderStatus(id: number, userId: number, status: WorkOrderStatus, reason?: string): Promise<WorkOrder> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const current = await getWorkOrderById(id, userId);
  if (!current) throw new Error("Work order not found");
  if (current.status === status) return current;

  const allowedStatuses = WORK_ORDER_NORMAL_TRANSITIONS[current.status as WorkOrderStatus] ?? [];
  if (!allowedStatuses.includes(status)) {
    throw new Error(`Cannot move work order from ${current.status} to ${status}`);
  }
  const exceptionStatuses: WorkOrderStatus[] = ["cancelled", "on_hold", "disputed", "callback_required"];
  if (exceptionStatuses.includes(status) && !reason?.trim()) {
    throw new Error(`A reason is required when moving a work order to ${status}`);
  }

  await db.update(workOrders).set({ status, statusReason: reason?.trim() || null, updatedByUserId: userId }).where(eq(workOrders.id, id));
  await db.insert(workOrderStatusHistory).values({
    workOrderId: id,
    changedByUserId: userId,
    fromStatus: current.status,
    toStatus: status,
    reason: reason?.trim() || null,
  });
  const updated = await getWorkOrderById(id, userId);
  if (!updated) throw new Error("Failed to transition work order status");
  await recordActivity({
    userId,
    entityType: "work_order",
    entityId: id,
    action: "status_changed",
    details: `${current.workOrderNumber}: ${current.status} → ${status}${reason ? ` (${reason.trim()})` : ""}`,
  });
  return updated;
}

// -----------------------------------------------------------------------------
// Crew assignment, scheduling, and completion workflow
// -----------------------------------------------------------------------------

export async function getWorkOrderAssignmentById(id: number, userId: number): Promise<WorkOrderAssignment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(workOrderAssignments).where(eq(workOrderAssignments.id, id)).limit(1);
  if (!result[0]) return undefined;
  const workOrder = await getWorkOrderById(result[0].workOrderId, userId);
  return workOrder ? result[0] : undefined;
}

async function synchronizeAssignmentAppointment(
  assignment: Pick<WorkOrderAssignment, "id" | "appointmentId" | "workOrderId" | "crewId" | "scheduledStart" | "scheduledEnd" | "status">,
  userId: number,
): Promise<number | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!assignment.scheduledStart || !assignment.scheduledEnd) return assignment.appointmentId ?? null;

  const [workOrder, jobSite, crew] = await Promise.all([
    getWorkOrderById(assignment.workOrderId, userId),
    getWorkOrderById(assignment.workOrderId, userId).then((workOrder) => workOrder ? getJobSiteById(workOrder.jobSiteId, userId) : undefined),
    getCrewById(assignment.crewId, userId),
  ]);
  if (!workOrder || !jobSite || !crew) throw new Error("Unable to synchronize the crew schedule");

  const appointmentData: Partial<InsertAppointment> = {
    title: `${workOrder.workOrderNumber} — ${crew.name}`,
    description: workOrder.scopeSummary,
    startTime: assignment.scheduledStart,
    endTime: assignment.scheduledEnd,
    location: jobSite.address,
    type: "work_order",
    status: assignment.status === "completed" ? "completed" : assignment.status === "cancelled" ? "cancelled" : "scheduled",
    notes: workOrder.specialInstructions ?? undefined,
  };

  if (assignment.appointmentId) {
    await db.update(appointments).set(appointmentData).where(and(eq(appointments.id, assignment.appointmentId), eq(appointments.userId, userId)));
    return assignment.appointmentId;
  }

  const result = await db.insert(appointments).values({
    ...appointmentData,
    userId,
    projectId: workOrder.projectId ?? undefined,
    workOrderId: workOrder.id,
    crewId: crew.id,
    title: appointmentData.title!,
    startTime: appointmentData.startTime!,
    endTime: appointmentData.endTime!,
  });
  return Number(result[0]?.insertId) || null;
}

export async function listWorkOrderAssignments(workOrderId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  const workOrder = await getWorkOrderById(workOrderId, userId);
  if (!workOrder) return [];
  const assignments = await db.select().from(workOrderAssignments).where(eq(workOrderAssignments.workOrderId, workOrderId)).orderBy(desc(workOrderAssignments.updatedAt));
  if (assignments.length === 0) return [];
  const crewIds = Array.from(new Set(assignments.map((assignment) => assignment.crewId)));
  const crewRows = await db.select({ id: crews.id, name: crews.name, crewLead: crews.crewLead, phone: crews.phone, email: crews.email }).from(crews).where(inArray(crews.id, crewIds));
  const crewById = new Map(crewRows.map((crew) => [crew.id, crew]));
  return assignments.map((assignment) => ({ ...assignment, crew: crewById.get(assignment.crewId) ?? null }));
}

export async function createWorkOrderAssignment(
  data: Pick<InsertWorkOrderAssignment, "workOrderId" | "crewId" | "scheduledStart" | "scheduledEnd" | "notes">,
  userId: number,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!data.scheduledStart || !data.scheduledEnd || data.scheduledEnd <= data.scheduledStart) {
    throw new Error("Crew assignments require a valid scheduled start and end time");
  }
  const [workOrder, crew] = await Promise.all([getWorkOrderById(data.workOrderId, userId), getCrewById(data.crewId, userId)]);
  if (!workOrder) throw new Error("Work order not found");
  if (!crew || crew.status !== "active") throw new Error("Active crew not found");
  if (!["accepted", "scheduled", "assigned", "in_progress", "waiting"].includes(workOrder.status)) {
    throw new Error("Work order must be accepted or scheduled before a crew can be assigned");
  }

  const existing = await db.select().from(workOrderAssignments).where(and(eq(workOrderAssignments.workOrderId, data.workOrderId), eq(workOrderAssignments.crewId, data.crewId))).limit(1);
  let assignment: WorkOrderAssignment;
  if (existing[0]) {
    await db.update(workOrderAssignments).set({
      scheduledStart: data.scheduledStart,
      scheduledEnd: data.scheduledEnd,
      notes: data.notes ?? null,
      status: "assigned",
      actualStart: null,
      actualCompletion: null,
    }).where(eq(workOrderAssignments.id, existing[0].id));
    assignment = (await getWorkOrderAssignmentById(existing[0].id, userId))!;
  } else {
    const result = await db.insert(workOrderAssignments).values({
      ...data,
      assignedByUserId: userId,
      status: "assigned",
    });
    assignment = (await getWorkOrderAssignmentById(Number(result[0]?.insertId), userId))!;
  }

  const appointmentId = await synchronizeAssignmentAppointment(assignment, userId);
  if (appointmentId && assignment.appointmentId !== appointmentId) {
    await db.update(workOrderAssignments).set({ appointmentId }).where(eq(workOrderAssignments.id, assignment.id));
    assignment = (await getWorkOrderAssignmentById(assignment.id, userId))!;
  }
  if (["accepted", "scheduled"].includes(workOrder.status)) {
    await transitionWorkOrderStatus(workOrder.id, userId, "assigned");
  }
  await recordActivity({
    userId,
    entityType: "work_order",
    entityId: workOrder.id,
    action: "crew_assigned",
    details: `Assigned ${crew.name} to ${workOrder.workOrderNumber}`,
  });
  return assignment;
}

export async function updateWorkOrderAssignment(
  id: number,
  userId: number,
  data: Partial<Pick<InsertWorkOrderAssignment, "scheduledStart" | "scheduledEnd" | "status" | "actualStart" | "actualCompletion" | "labourHours" | "productionQuantity" | "productionUnit" | "notes">>,
): Promise<WorkOrderAssignment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const current = await getWorkOrderAssignmentById(id, userId);
  if (!current) throw new Error("Work order assignment not found");
  const workOrder = await getWorkOrderById(current.workOrderId, userId);
  if (!workOrder) throw new Error("Work order not found");
  const scheduledStart = data.scheduledStart === undefined ? current.scheduledStart : data.scheduledStart;
  const scheduledEnd = data.scheduledEnd === undefined ? current.scheduledEnd : data.scheduledEnd;
  if (!scheduledStart || !scheduledEnd || scheduledEnd <= scheduledStart) {
    throw new Error("Crew assignments require a valid scheduled start and end time");
  }

  await db.update(workOrderAssignments).set(data).where(eq(workOrderAssignments.id, id));
  let updated = (await getWorkOrderAssignmentById(id, userId))!;
  const appointmentId = await synchronizeAssignmentAppointment(updated, userId);
  if (appointmentId && updated.appointmentId !== appointmentId) {
    await db.update(workOrderAssignments).set({ appointmentId }).where(eq(workOrderAssignments.id, id));
    updated = (await getWorkOrderAssignmentById(id, userId))!;
  }

  if (data.status === "in_progress" && workOrder.status === "assigned") {
    await transitionWorkOrderStatus(workOrder.id, userId, "in_progress");
  }
  await recordActivity({
    userId,
    entityType: "work_order",
    entityId: workOrder.id,
    action: "crew_assignment_updated",
    details: `Updated crew assignment for ${workOrder.workOrderNumber}`,
  });
  return updated;
}

export async function recordWorkOrderCompletion(
  workOrderId: number,
  userId: number,
  data: Omit<InsertWorkOrderCompletion, "workOrderId" | "completedByUserId">,
): Promise<WorkOrderCompletion> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let workOrder = await getWorkOrderById(workOrderId, userId);
  if (!workOrder) throw new Error("Work order not found");
  if (!["assigned", "in_progress", "waiting", "completed", "callback_required"].includes(workOrder.status)) {
    throw new Error("Work order must be assigned or in progress before completion can be recorded");
  }

  if (workOrder.status === "assigned") {
    workOrder = await transitionWorkOrderStatus(workOrderId, userId, "in_progress");
  }
  const targetStatus: WorkOrderStatus = data.callbackRequired ? "callback_required" : "completed";
  if (workOrder.status !== targetStatus) {
    const allowedStatuses = WORK_ORDER_NORMAL_TRANSITIONS[workOrder.status as WorkOrderStatus] ?? [];
    if (!allowedStatuses.includes(targetStatus)) throw new Error("Work order cannot be moved to completion from its current status");
    workOrder = await transitionWorkOrderStatus(workOrderId, userId, targetStatus, data.callbackRequired ? data.callbackDetails ?? "Callback required" : undefined);
  }

  const existing = await db.select().from(workOrderCompletions).where(eq(workOrderCompletions.workOrderId, workOrderId)).limit(1);
  let completion: WorkOrderCompletion;
  if (existing[0]) {
    await db.update(workOrderCompletions).set(data).where(eq(workOrderCompletions.id, existing[0].id));
    completion = (await db.select().from(workOrderCompletions).where(eq(workOrderCompletions.id, existing[0].id)).limit(1))[0]!;
  } else {
    const result = await db.insert(workOrderCompletions).values({ ...data, workOrderId, completedByUserId: userId });
    completion = (await db.select().from(workOrderCompletions).where(eq(workOrderCompletions.id, Number(result[0]?.insertId))).limit(1))[0]!;
  }

  await db.update(workOrderScopes).set({ isCompleted: true, completedQuantity: sql`${workOrderScopes.quantity}` }).where(eq(workOrderScopes.workOrderId, workOrderId));
  await db.update(workOrderAssignments).set({ status: "completed", actualCompletion: data.completionDate }).where(eq(workOrderAssignments.workOrderId, workOrderId));
  const assignments = await db.select().from(workOrderAssignments).where(eq(workOrderAssignments.workOrderId, workOrderId));
  for (const assignment of assignments) {
    if (assignment.appointmentId) {
      await db.update(appointments).set({ status: "completed" }).where(and(eq(appointments.id, assignment.appointmentId), eq(appointments.userId, userId)));
    }
  }
  await recordActivity({
    userId,
    entityType: "work_order",
    entityId: workOrderId,
    action: "completion_recorded",
    details: `${workOrder.workOrderNumber} marked ${targetStatus}`,
  });
  return completion;
}

export async function listWorkOrderDocuments(workOrderId: number, userId: number): Promise<Document[]> {
  const db = await getDb();
  if (!db) return [];
  const workOrder = await getWorkOrderById(workOrderId, userId);
  if (!workOrder) return [];
  return db.select().from(documents).where(eq(documents.workOrderId, workOrderId)).orderBy(desc(documents.createdAt));
}

export async function createWorkOrderDocument(data: InsertDocument, userId: number): Promise<Document> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!data.workOrderId) throw new Error("Work order document requires a work order");
  const workOrder = await getWorkOrderById(data.workOrderId, userId);
  if (!workOrder || data.userId !== userId || data.companyId !== workOrder.companyId || data.jobSiteId !== workOrder.jobSiteId) {
    throw new Error("Document does not match an accessible work order");
  }
  const result = await db.insert(documents).values(data);
  const document = (await db.select().from(documents).where(eq(documents.id, Number(result[0]?.insertId))).limit(1))[0];
  if (!document) throw new Error("Failed to create work order document");
  await recordActivity({
    userId,
    entityType: "work_order",
    entityId: workOrder.id,
    action: "document_added",
    details: `Added ${document.documentType}: ${document.fileName}`,
  });
  return document;
}

// -----------------------------------------------------------------------------
// Work order billing, payment reconciliation, account balances, and aging
// -----------------------------------------------------------------------------

export type WorkOrderInvoiceLineInput = {
  workOrderScopeId?: number;
  description: string;
  quantity: string;
  unit?: string;
  unitPrice: string;
};

export async function getInvoiceByIdForUser(invoiceId: number, userId: number): Promise<Invoice | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoices).where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId))).limit(1);
  return result[0];
}

export async function getWorkOrderInvoiceDraft(workOrderId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const workOrder = await getWorkOrderById(workOrderId, userId);
  if (!workOrder) return undefined;
  const [company, scopes] = await Promise.all([
    getCompanyById(workOrder.companyId, userId),
    db.select().from(workOrderScopes).where(eq(workOrderScopes.workOrderId, workOrderId)).orderBy(asc(workOrderScopes.createdAt)),
  ]);
  if (!company) return undefined;
  const price = Number(workOrder.agreedPrice ?? workOrder.estimatedValue ?? 0) + Number(workOrder.additionalCharges ?? 0);
  const baseItems = scopes.length > 0 && price > 0
    ? scopes.map((scope, index) => ({
      workOrderScopeId: scope.id,
      description: scope.description,
      quantity: scope.quantity ?? "1.00",
      unit: scope.unit ?? undefined,
      unitPrice: index === 0 ? price.toFixed(2) : "0.00",
    }))
    : [{ description: workOrder.scopeSummary, quantity: "1.00", unit: "job", unitPrice: price.toFixed(2) }];
  return {
    workOrder,
    company,
    scopes,
    taxRate: workOrder.taxRate,
    suggestedItems: baseItems,
  };
}

export async function createInvoiceFromWorkOrder(
  workOrderId: number,
  userId: number,
  dueDate: Date,
  lineItems: WorkOrderInvoiceLineInput[],
  notes?: string,
): Promise<Invoice> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let workOrder = await getWorkOrderById(workOrderId, userId);
  if (!workOrder) throw new Error("Work order not found");
  if (!["completed", "ready_for_invoice"].includes(workOrder.status)) {
    throw new Error("Work order must be completed before it can be invoiced");
  }
  const company = await getCompanyById(workOrder.companyId, userId);
  if (!company) throw new Error("Company account not found");
  const existing = await db.select().from(invoices).where(and(eq(invoices.workOrderId, workOrderId), eq(invoices.userId, userId))).orderBy(desc(invoices.createdAt));
  if (existing.some((invoice) => invoice.status !== "cancelled")) {
    throw new Error("This work order already has an active invoice");
  }
  if (dueDate < new Date(new Date().setHours(0, 0, 0, 0))) {
    throw new Error("Invoice due date cannot be in the past");
  }

  const validatedItems = lineItems.map((line) => {
    const quantity = Number(line.quantity);
    const unitPrice = Number(line.unitPrice);
    if (!line.description.trim() || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error("Every invoice line requires a description, positive quantity, and non-negative unit price");
    }
    return { ...line, description: line.description.trim(), quantity: quantity.toFixed(2), unitPrice: unitPrice.toFixed(2), total: (quantity * unitPrice).toFixed(2) };
  });
  if (validatedItems.length === 0) throw new Error("At least one invoice line item is required");
  const subtotal = validatedItems.reduce((total, line) => total + Number(line.total), 0);
  const tax = subtotal * (Number(workOrder.taxRate ?? 0) / 100);
  const total = subtotal + tax;
  const invoiceNumber = await generateInvoiceNumber(userId);
  const result = await db.insert(invoices).values({
    userId,
    companyId: company.id,
    workOrderId,
    projectId: workOrder.projectId ?? undefined,
    invoiceNumber,
    issueDate: new Date(),
    dueDate,
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
    amountPaid: "0.00",
    status: "sent",
    notes,
  });
  const invoiceId = Number(result[0]?.insertId);
  const invoice = await getInvoiceByIdForUser(invoiceId, userId);
  if (!invoice) throw new Error("Failed to create work order invoice");
  await db.insert(invoiceLineItems).values(validatedItems.map((line) => ({
    invoiceId,
    workOrderScopeId: line.workOrderScopeId,
    description: line.description,
    quantity: line.quantity,
    unit: line.unit,
    unitPrice: line.unitPrice,
    total: line.total,
  })));

  if (workOrder.status === "completed") {
    workOrder = await transitionWorkOrderStatus(workOrderId, userId, "ready_for_invoice");
  }
  await transitionWorkOrderStatus(workOrderId, userId, "invoiced");
  await recordActivity({
    userId,
    entityType: "work_order",
    entityId: workOrderId,
    action: "invoiced",
    details: `Created invoice ${invoice.invoiceNumber} for $${invoice.total}`,
  });
  return invoice;
}

export async function getInvoiceLineItems(invoiceId: number, userId: number): Promise<InvoiceLineItem[]> {
  const db = await getDb();
  if (!db) return [];
  const invoice = await getInvoiceByIdForUser(invoiceId, userId);
  if (!invoice) return [];
  return db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, invoiceId)).orderBy(asc(invoiceLineItems.createdAt));
}

export async function recordInvoicePayment(
  invoiceId: number,
  userId: number,
  data: { amount: string; paymentDate: Date; paymentMethod: string; referenceNumber?: string; description?: string; },
): Promise<Payment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const invoice = await getInvoiceByIdForUser(invoiceId, userId);
  if (!invoice) throw new Error("Invoice not found");
  if (!["sent", "viewed", "overdue", "partially_paid", "disputed"].includes(invoice.status)) {
    throw new Error("Payments can only be recorded against an active issued invoice");
  }
  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Payment amount must be greater than zero");
  const existingPayments = await db.select().from(payments).where(and(eq(payments.invoiceId, invoiceId), eq(payments.status, "succeeded")));
  const alreadyPaid = existingPayments.reduce((total, payment) => total + Number(payment.amount), 0);
  const remaining = Number(invoice.total) - alreadyPaid;
  if (amount - remaining > 0.009) throw new Error("Payment cannot exceed the invoice balance");

  const result = await db.insert(payments).values({
    userId,
    invoiceId,
    amount: amount.toFixed(2),
    currency: "CAD",
    status: "succeeded",
    paymentMethod: data.paymentMethod,
    paymentDate: data.paymentDate,
    referenceNumber: data.referenceNumber,
    description: data.description,
  });
  const payment = await getPaymentById(Number(result[0]?.insertId));
  if (!payment) throw new Error("Failed to record payment");
  const newPaidAmount = alreadyPaid + amount;
  const isPaid = newPaidAmount >= Number(invoice.total) - 0.009;
  const invoiceStatus = isPaid ? "paid" : "partially_paid" as const;
  await db.update(invoices).set({ amountPaid: newPaidAmount.toFixed(2), status: invoiceStatus }).where(eq(invoices.id, invoiceId));

  if (invoice.workOrderId) {
    const workOrder = await getWorkOrderById(invoice.workOrderId, userId);
    if (workOrder) {
      const targetStatus: WorkOrderStatus = isPaid ? "paid" : "partially_paid";
      if (workOrder.status !== targetStatus) {
        await transitionWorkOrderStatus(workOrder.id, userId, targetStatus);
      }
      await recordActivity({
        userId,
        entityType: "work_order",
        entityId: workOrder.id,
        action: "payment_recorded",
        details: `Recorded $${amount.toFixed(2)} payment on ${invoice.invoiceNumber}`,
      });
    }
  }
  return payment;
}

export async function getCompanyFinancials(companyId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const company = await getCompanyById(companyId, userId);
  if (!company) return undefined;
  const invoiceRows = await db.select().from(invoices).where(and(eq(invoices.companyId, companyId), eq(invoices.userId, userId))).orderBy(desc(invoices.issueDate));
  const invoiceIds = invoiceRows.map((invoice) => invoice.id);
  const paymentRows = invoiceIds.length > 0
    ? await db.select().from(payments).where(inArray(payments.invoiceId, invoiceIds)).orderBy(desc(payments.paymentDate), desc(payments.createdAt))
    : [];
  const workOrderIds = Array.from(new Set(invoiceRows.map((invoice) => invoice.workOrderId).filter((id): id is number => id !== null)));
  const workOrderRows = workOrderIds.length > 0 ? await db.select({ id: workOrders.id, workOrderNumber: workOrders.workOrderNumber }).from(workOrders).where(inArray(workOrders.id, workOrderIds)) : [];
  const workOrderNumberById = new Map(workOrderRows.map((workOrder) => [workOrder.id, workOrder.workOrderNumber]));
  const succeededPaymentsByInvoice = new Map<number, number>();
  for (const payment of paymentRows.filter((payment) => payment.status === "succeeded")) {
    succeededPaymentsByInvoice.set(payment.invoiceId, (succeededPaymentsByInvoice.get(payment.invoiceId) ?? 0) + Number(payment.amount));
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const aging = { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0 };
  let totalBilled = 0;
  let totalPaid = 0;
  let outstandingBalance = 0;
  let overdueBalance = 0;
  let outstandingInvoiceCount = 0;
  let paidInvoiceDaysTotal = 0;
  let paidInvoiceCount = 0;
  for (const invoice of invoiceRows) {
    if (["cancelled", "written_off"].includes(invoice.status)) continue;
    const invoiceTotal = Number(invoice.total);
    const paid = succeededPaymentsByInvoice.get(invoice.id) ?? Number(invoice.amountPaid);
    const outstanding = Math.max(0, invoiceTotal - paid);
    totalBilled += invoiceTotal;
    totalPaid += paid;
    outstandingBalance += outstanding;
    if (outstanding <= 0 && invoiceTotal > 0) {
      const finalPaymentDate = paymentRows.filter((payment) => payment.invoiceId === invoice.id && payment.status === "succeeded").map((payment) => payment.paymentDate ?? payment.createdAt).sort((left, right) => right.getTime() - left.getTime())[0];
      if (finalPaymentDate) {
        paidInvoiceDaysTotal += Math.max(0, Math.floor((finalPaymentDate.getTime() - invoice.issueDate.getTime()) / 86_400_000));
        paidInvoiceCount += 1;
      }
    }
    if (outstanding > 0) {
      outstandingInvoiceCount += 1;
      const dueDate = new Date(invoice.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / 86_400_000);
      if (daysPastDue <= 0) aging.current += outstanding;
      else if (daysPastDue <= 30) { aging.days1to30 += outstanding; overdueBalance += outstanding; }
      else if (daysPastDue <= 60) { aging.days31to60 += outstanding; overdueBalance += outstanding; }
      else if (daysPastDue <= 90) { aging.days61to90 += outstanding; overdueBalance += outstanding; }
      else { aging.days90plus += outstanding; overdueBalance += outstanding; }
    }
  }
  const paymentDates = paymentRows.filter((payment) => payment.status === "succeeded").map((payment) => payment.paymentDate ?? payment.createdAt).sort((left, right) => right.getTime() - left.getTime());
  const invoiceWithDetails = invoiceRows.map((invoice) => ({
    ...invoice,
    paidAmount: succeededPaymentsByInvoice.get(invoice.id) ?? Number(invoice.amountPaid),
    outstandingAmount: Math.max(0, Number(invoice.total) - (succeededPaymentsByInvoice.get(invoice.id) ?? Number(invoice.amountPaid))),
    workOrderNumber: invoice.workOrderId ? workOrderNumberById.get(invoice.workOrderId) ?? null : null,
    payments: paymentRows.filter((payment) => payment.invoiceId === invoice.id),
  }));
  return {
    company,
    summary: {
      totalBilled,
      totalPaid,
      outstandingBalance,
      overdueBalance,
      outstandingInvoiceCount,
      lastInvoiceDate: invoiceRows[0]?.issueDate ?? null,
      lastPaymentDate: paymentDates[0] ?? null,
      averagePaymentDays: paidInvoiceCount > 0 ? paidInvoiceDaysTotal / paidInvoiceCount : null,
    },
    aging,
    invoices: invoiceWithDetails,
  };
}

// -----------------------------------------------------------------------------
// Subcontractor operations dashboard and performance reporting
// -----------------------------------------------------------------------------

export async function getSubcontractorDashboard(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return undefined;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [allOrders, userCompanies, userInvoices, allAssignments, completionRows] = await Promise.all([
    db.select().from(workOrders).where(eq(workOrders.userId, userId)).orderBy(desc(workOrders.updatedAt)),
    db.select().from(companies).where(eq(companies.userId, userId)),
    db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.issueDate)),
    db.select().from(workOrderAssignments).orderBy(desc(workOrderAssignments.updatedAt)),
    db.select().from(workOrderCompletions).orderBy(desc(workOrderCompletions.completionDate)),
  ]);
  const ownedOrderIds = new Set(allOrders.map((order) => order.id));
  const assignments = allAssignments.filter((assignment) => ownedOrderIds.has(assignment.workOrderId));
  const completions = completionRows.filter((completion) => ownedOrderIds.has(completion.workOrderId));
  const companyById = new Map(userCompanies.map((company) => [company.id, company]));
  const ordersInRange = allOrders.filter((order) => order.receivedAt >= start && order.receivedAt <= end);
  const activeStatuses = new Set<WorkOrderStatus>(["accepted", "scheduled", "assigned", "in_progress", "waiting", "callback_required"]);
  const terminalStatuses = new Set<WorkOrderStatus>(["completed", "ready_for_invoice", "invoiced", "partially_paid", "paid", "closed", "cancelled"]);
  const activeOrders = allOrders.filter((order) => activeStatuses.has(order.status));
  const overdueOrders = allOrders.filter((order) => order.deadline && order.deadline < today && !terminalStatuses.has(order.status));
  const readyToInvoice = allOrders.filter((order) => ["completed", "ready_for_invoice"].includes(order.status));
  const overdueInvoiceCount = userInvoices.filter((invoice) => invoice.dueDate < today && !["paid", "cancelled", "written_off"].includes(invoice.status)).length;
  const invoiceIds = userInvoices.map((invoice) => invoice.id);
  const paymentRows = invoiceIds.length > 0 ? await db.select().from(payments).where(inArray(payments.invoiceId, invoiceIds)) : [];
  const paidByInvoice = new Map<number, number>();
  paymentRows.filter((payment) => payment.status === "succeeded").forEach((payment) => paidByInvoice.set(payment.invoiceId, (paidByInvoice.get(payment.invoiceId) ?? 0) + Number(payment.amount)));
  const outstandingReceivables = userInvoices.filter((invoice) => !["paid", "cancelled", "written_off"].includes(invoice.status)).reduce((total, invoice) => total + Math.max(0, Number(invoice.total) - (paidByInvoice.get(invoice.id) ?? Number(invoice.amountPaid))), 0);

  const crewIds = Array.from(new Set(assignments.map((assignment) => assignment.crewId)));
  const crewRows = crewIds.length > 0 ? await db.select({ id: crews.id, name: crews.name, crewLead: crews.crewLead, status: crews.status }).from(crews).where(inArray(crews.id, crewIds)) : [];
  const completionByWorkOrderId = new Map(completions.map((completion) => [completion.workOrderId, completion]));
  const completedAssignmentCountByWorkOrderId = new Map<number, number>();
  assignments.filter((assignment) => assignment.status === "completed").forEach((assignment) => completedAssignmentCountByWorkOrderId.set(assignment.workOrderId, (completedAssignmentCountByWorkOrderId.get(assignment.workOrderId) ?? 0) + 1));
  const productionByCrew = crewRows.map((crew) => {
    const crewAssignments = assignments.filter((assignment) => assignment.crewId === crew.id);
    const completed = crewAssignments.filter((assignment) => assignment.actualCompletion && assignment.actualCompletion >= start && assignment.actualCompletion <= end);
    const scheduled = crewAssignments.filter((assignment) => assignment.scheduledStart && assignment.scheduledStart >= start && assignment.scheduledStart <= end);
    const labourHours = completed.reduce((total, assignment) => {
      const completion = completionByWorkOrderId.get(assignment.workOrderId);
      const completedCrewCount = completedAssignmentCountByWorkOrderId.get(assignment.workOrderId) ?? 1;
      return total + (assignment.labourHours !== null ? Number(assignment.labourHours) : Number(completion?.labourHours ?? 0) / completedCrewCount);
    }, 0);
    const productionQuantity = completed.reduce((total, assignment) => {
      const completion = completionByWorkOrderId.get(assignment.workOrderId);
      const completedCrewCount = completedAssignmentCountByWorkOrderId.get(assignment.workOrderId) ?? 1;
      return total + (assignment.productionQuantity !== null ? Number(assignment.productionQuantity) : Number(completion?.productionQuantity ?? 0) / completedCrewCount);
    }, 0);
    return { crew, scheduledCount: scheduled.length, completedCount: completed.length, inProgressCount: crewAssignments.filter((assignment) => assignment.status === "in_progress").length, labourHours, productionQuantity };
  }).sort((left, right) => right.completedCount - left.completedCount || right.productionQuantity - left.productionQuantity);

  const companyPerformance = userCompanies.map((company) => {
    const companyOrders = ordersInRange.filter((order) => order.companyId === company.id);
    const completed = companyOrders.filter((order) => ["completed", "ready_for_invoice", "invoiced", "partially_paid", "paid", "closed"].includes(order.status));
    const active = companyOrders.filter((order) => activeStatuses.has(order.status));
    const production = completions.filter((completion) => companyOrders.some((order) => order.id === completion.workOrderId));
    return {
      company,
      workOrderCount: companyOrders.length,
      completedCount: completed.length,
      activeCount: active.length,
      completionRate: companyOrders.length > 0 ? completed.length / companyOrders.length : 0,
      productionQuantity: production.reduce((total, completion) => total + Number(completion.productionQuantity ?? 0), 0),
      labourHours: production.reduce((total, completion) => total + Number(completion.labourHours ?? 0), 0),
    };
  }).filter((entry) => entry.workOrderCount > 0).sort((left, right) => right.workOrderCount - left.workOrderCount);

  return {
    period: { start, end },
    summary: {
      receivedWorkOrders: ordersInRange.length,
      activeWorkOrders: activeOrders.length,
      completedWorkOrders: ordersInRange.filter((order) => ["completed", "ready_for_invoice", "invoiced", "partially_paid", "paid", "closed"].includes(order.status)).length,
      overdueWorkOrders: overdueOrders.length,
      readyToInvoice: readyToInvoice.length,
      outstandingReceivables,
      overdueInvoiceCount,
    },
    exceptions: {
      overdueWorkOrders: overdueOrders.map((order) => ({ ...order, companyName: companyById.get(order.companyId)?.name ?? "Company" })),
      readyToInvoice: readyToInvoice.map((order) => ({ ...order, companyName: companyById.get(order.companyId)?.name ?? "Company" })),
    },
    recentWorkOrders: allOrders.slice(0, 10).map((order) => ({ ...order, companyName: companyById.get(order.companyId)?.name ?? "Company" })),
    crewProduction: productionByCrew,
    companyPerformance,
  };
}
