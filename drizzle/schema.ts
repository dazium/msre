import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, date } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Customers/Leads table
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  status: mysqlEnum("status", ["lead", "contacted", "qualified", "proposal_sent", "won", "lost"]).default("lead").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// Crews table - for managing work crews
export const crews = mysqlTable("crews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  crewLead: varchar("crewLead", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Crew = typeof crews.$inferSelect;
export type InsertCrew = typeof crews.$inferInsert;

// Projects table
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  customerId: int("customerId").notNull(),
  crewId: int("crewId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  status: mysqlEnum("status", ["lead", "scheduled", "in_progress", "completed", "on_hold", "cancelled"]).default("lead").notNull(),
  startDate: date("startDate"),
  endDate: date("endDate"),
  estimatedValue: decimal("estimatedValue", { precision: 10, scale: 2 }),
  actualValue: decimal("actualValue", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// Estimates table
export const estimates = mysqlTable("estimates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId").notNull(),
  customerId: int("customerId").notNull(),
  estimateNumber: varchar("estimateNumber", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["draft", "sent", "accepted", "rejected", "expired"]).default("draft").notNull(),
  validUntil: date("validUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Estimate = typeof estimates.$inferSelect;
export type InsertEstimate = typeof estimates.$inferInsert;

// Estimate line items
export const estimateLineItems = mysqlTable("estimateLineItems", {
  id: int("id").autoincrement().primaryKey(),
  estimateId: int("estimateId").notNull(),
  materialId: int("materialId"),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EstimateLineItem = typeof estimateLineItems.$inferSelect;
export type InsertEstimateLineItem = typeof estimateLineItems.$inferInsert;

// Relations
export const estimateLineItemsRelations = relations(estimateLineItems, ({ one }) => ({
  material: one(materials, {
    fields: [estimateLineItems.materialId],
    references: [materials.id],
  }),
}));

// Photos/Documents table
export const photos = mysqlTable("photos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  customerId: int("customerId"),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  caption: text("caption"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;

// Calendar events/appointments
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  customerId: int("customerId"),
  projectId: int("projectId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  location: text("location"),
  type: mysqlEnum("type", ["estimate", "inspection", "consultation", "job_start", "follow_up", "other"]).default("other").notNull(),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled", "no_show"]).default("scheduled").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

// Damages/Issues table for tracking roof damage
export const damages = mysqlTable("damages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId").notNull(),
  customerId: int("customerId").notNull(),
  category: mysqlEnum("category", ["missing_shingles", "flashing_damage", "leaks", "sagging", "rot", "moss_algae", "hail_damage", "wind_damage", "other"]).notNull(),
  description: text("description").notNull(),
  severity: mysqlEnum("severity", ["minor", "moderate", "severe"]).default("moderate").notNull(),
  location: varchar("location", { length: 255 }),
  estimatedCost: decimal("estimatedCost", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Damage = typeof damages.$inferSelect;
export type InsertDamage = typeof damages.$inferInsert;

// Damage photos linking photos to specific damage items
export const damagePhotos = mysqlTable("damagePhotos", {
  id: int("id").autoincrement().primaryKey(),
  damageId: int("damageId").notNull(),
  photoId: int("photoId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DamagePhoto = typeof damagePhotos.$inferSelect;
export type InsertDamagePhoto = typeof damagePhotos.$inferInsert;

// Activity log for tracking changes
export const activityLog = mysqlTable("activityLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId").notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;
// Materials table - predefined roofing materials with Canadian pricing
export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  category: mysqlEnum("category", ["shingles", "underlayment", "ice_water_shield", "plywood", "flashing", "pipe_flange", "ridge_caps", "gutters", "fascia_soffit", "other"]).default("other").notNull(),
  unit: varchar("unit", { length: 20 }).default("piece").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

export const materialsRelations = relations(materials, ({ many }) => ({
  lineItems: many(estimateLineItems),
}));

// Damage materials - materials needed for specific damages
export const damageMaterials = mysqlTable("damageMaterials", {
  id: int("id").autoincrement().primaryKey(),
  damageId: int("damageId").notNull(),
  materialId: int("materialId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DamageMaterial = typeof damageMaterials.$inferSelect;
export type InsertDamageMaterial = typeof damageMaterials.$inferInsert;

// Roof Specifications table - stores roof dimensions, pitch, valleys, etc. for estimates
export const roofSpecifications = mysqlTable("roofSpecifications", {
  id: int("id").autoincrement().primaryKey(),
  estimateId: int("estimateId").notNull(),
  userId: int("userId").notNull(),
  roofArea: decimal("roofArea", { precision: 10, scale: 2 }).notNull(),
  roofPitch: varchar("roofPitch", { length: 20 }).notNull(),
  numberOfValleys: int("numberOfValleys").default(0).notNull(),
  numberOfDormers: int("numberOfDormers").default(0).notNull(),
  numberOfChimneys: int("numberOfChimneys").default(0).notNull(),
  numberOfSkyLights: int("numberOfSkyLights").default(0).notNull(),
  hasRidgeVent: boolean("hasRidgeVent").default(false).notNull(),
  tearOffRequired: boolean("tearOffRequired").default(true).notNull(),
  roofType: mysqlEnum("roofType", ["asphalt_shingles", "metal", "tile", "slate", "wood", "flat", "other"]).default("asphalt_shingles").notNull(),
  estimatedSquares: decimal("estimatedSquares", { precision: 10, scale: 2 }).notNull(),
  estimatedLaborHours: decimal("estimatedLaborHours", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RoofSpecification = typeof roofSpecifications.$inferSelect;
export type InsertRoofSpecification = typeof roofSpecifications.$inferInsert;

// Invoices table - for billing and payment tracking
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  estimateId: int("estimateId"),
  projectId: int("projectId").notNull(),
  customerId: int("customerId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  issueDate: date("issueDate").notNull(),
  dueDate: date("dueDate").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amountPaid", { precision: 10, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("status", ["draft", "sent", "viewed", "paid", "overdue", "cancelled"]).default("draft").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// Invoice Templates table - for customizable invoice layouts
export const invoiceTemplates = mysqlTable("invoiceTemplates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isDefault: boolean("isDefault").default(false).notNull(),
  // Branding
  companyName: varchar("companyName", { length: 255 }).notNull(),
  companyLogo: text("companyLogo"),
  companyPhone: varchar("companyPhone", { length: 20 }),
  companyEmail: varchar("companyEmail", { length: 320 }),
  companyAddress: text("companyAddress"),
  // Colors
  primaryColor: varchar("primaryColor", { length: 7 }).default("#1a3a52").notNull(),
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#ffffff").notNull(),
  accentColor: varchar("accentColor", { length: 7 }).default("#4a90e2").notNull(),
  // Footer
  footerText: text("footerText"),
  paymentTerms: text("paymentTerms"),
  // Layout
  includeCompanyLogo: boolean("includeCompanyLogo").default(true).notNull(),
  includeCompanyInfo: boolean("includeCompanyInfo").default(true).notNull(),
  includePaymentTerms: boolean("includePaymentTerms").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InvoiceTemplate = typeof invoiceTemplates.$inferSelect;
export type InsertInvoiceTemplate = typeof invoiceTemplates.$inferInsert;
