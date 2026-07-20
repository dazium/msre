import { and, eq, sql, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, customers, InsertCustomer, projects, InsertProject, estimates, InsertEstimate, appointments, InsertAppointment, photos, InsertPhoto, damages, InsertDamage, damagePhotos, InsertDamagePhoto, materials, InsertMaterial, estimateLineItems, InsertEstimateLineItem, crews, InsertCrew, Crew, invoices, InsertInvoice, Invoice, invoiceTemplates, InsertInvoiceTemplate, InvoiceTemplate, payments, InsertPayment, Payment, crewSkills, InsertCrewSkill, CrewSkill, skillCategories, InsertSkillCategory, SkillCategory, predefinedSkills, InsertPredefinedSkill, PredefinedSkill, crewMembers, InsertCrewMember, CrewMember, crewMemberSkills, InsertCrewMemberSkill, CrewMemberSkill, customerNotes, InsertCustomerNote, CustomerNote } from "../drizzle/schema";
import { ENV } from './_core/env';

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
  return db.insert(projects).values(data);
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

export async function updateEstimate(id: number, data: Partial<InsertEstimate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .update(estimates)
    .set(data)
    .where(eq(estimates.id, id));
  
  return result;
}

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
  return db.insert(photos).values(data);
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

  // Verify project belongs to user
  const project = await db.query.projects.findFirst({
    where: (p: any, { eq: eqFn, and: andFn }: any) => andFn(eqFn(p.id, projectId), eqFn(p.userId, userId)),
  });

  if (!project) {
    throw new Error("Project not found or unauthorized");
  }

  // Verify crew exists
  const crew = await db.query.crews.findFirst({
    where: (c: any, { eq: eqFn }: any) => eqFn(c.id, crewId),
  });

  if (!crew) {
    throw new Error("Crew not found");
  }

  // Update project with crew
  await db
    .update(projects)
    .set({ crewId })
    .where(eq(projects.id, projectId));

  return { success: true, projectId, crewId };
}

export async function removeCrewFromProject(projectId: number, userId: number): Promise<any> {
  const db = await getDb() as any;
  if (!db) throw new Error("Database not available");

  // Verify project belongs to user
  const project = await db.query.projects.findFirst({
    where: (p: any, { eq: eqFn, and: andFn }: any) => andFn(eqFn(p.id, projectId), eqFn(p.userId, userId)),
  });

  if (!project) {
    throw new Error("Project not found or unauthorized");
  }

  // Update project to remove crew
  await db
    .update(projects)
    .set({ crewId: null })
    .where(eq(projects.id, projectId));

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
