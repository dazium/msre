import { boolean, date, decimal, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
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
  role: mysqlEnum("role", ["user", "admin", "office_manager", "project_manager", "crew_leader", "worker", "accounting"]).default("user").notNull(),
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
  // Enhanced customer profile
  companyName: varchar("companyName", { length: 255 }),
  preferredContactMethod: mysqlEnum("preferredContactMethod", ["phone", "email", "text", "in_person"]).default("phone"),
  roofType: varchar("roofType", { length: 100 }), // e.g., "Asphalt Shingles", "Metal", "Flat"
  serviceHistory: text("serviceHistory"), // JSON array of past service types
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
  crewLeadId: int("crewLeadId"), // FK to crewMembers table
  crewLead: varchar("crewLead", { length: 100 }), // Legacy field, kept for backward compatibility
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
  roofType: mysqlEnum("roofType", ["asphalt_shingle", "metal", "flat", "tile", "cedar"]).default("asphalt_shingle").notNull(),
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
  workOrderId: int("workOrderId"),
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
  workOrderId: int("workOrderId"),
  crewId: int("crewId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  location: text("location"),
  type: mysqlEnum("type", ["estimate", "inspection", "consultation", "job_start", "follow_up", "work_order", "other"]).default("other").notNull(),
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

// Roof inspections and reusable checklist items
export const inspections = mysqlTable("inspections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId").notNull(),
  customerId: int("customerId").notNull(),
  roofType: mysqlEnum("roofType", ["asphalt_shingle", "metal", "flat", "tile", "cedar"]).default("asphalt_shingle").notNull(),
  status: mysqlEnum("status", ["draft", "in_progress", "completed"]).default("draft").notNull(),
  inspectorName: varchar("inspectorName", { length: 150 }),
  inspectedAt: timestamp("inspectedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;

export const inspectionItems = mysqlTable("inspectionItems", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspectionId").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "pass", "attention", "fail", "not_applicable"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InspectionItem = typeof inspectionItems.$inferSelect;
export type InsertInspectionItem = typeof inspectionItems.$inferInsert;

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
  projectId: int("projectId"),
  customerId: int("customerId"),
  companyId: int("companyId"),
  workOrderId: int("workOrderId"),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  issueDate: date("issueDate").notNull(),
  dueDate: date("dueDate").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amountPaid", { precision: 10, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("status", ["draft", "sent", "viewed", "partially_paid", "paid", "overdue", "disputed", "written_off", "cancelled"]).default("draft").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

export const invoiceLineItems = mysqlTable(
  "invoiceLineItems",
  {
    id: int("id").autoincrement().primaryKey(),
    invoiceId: int("invoiceId").notNull(),
    workOrderScopeId: int("workOrderScopeId"),
    description: text("description").notNull(),
    quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
    unit: varchar("unit", { length: 40 }),
    unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("invoice_line_items_invoice_idx").on(table.invoiceId)],
);

export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InsertInvoiceLineItem = typeof invoiceLineItems.$inferInsert;

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


// Roof Measurements table - stores measurements from Google Maps satellite imagery
export const roofMeasurements = mysqlTable("roofMeasurements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId").notNull(),
  damageId: int("damageId"),
  estimateId: int("estimateId"),
  // Location data
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  // Measurement data
  roofAreaSqFt: decimal("roofAreaSqFt", { precision: 10, scale: 2 }),
  roofAreaSqMeters: decimal("roofAreaSqMeters", { precision: 10, scale: 2 }),
  perimeterFt: decimal("perimeterFt", { precision: 10, scale: 2 }),
  estimatedPitch: varchar("estimatedPitch", { length: 20 }),
  // Polygon data (GeoJSON)
  boundaryPolygon: text("boundaryPolygon"), // JSON array of lat/lng points
  // Metadata
  zoomLevel: int("zoomLevel").default(18).notNull(),
  imageUrl: text("imageUrl"), // URL to saved satellite image
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RoofMeasurement = typeof roofMeasurements.$inferSelect;
export type InsertRoofMeasurement = typeof roofMeasurements.$inferInsert;


// Payments table - tracks Stripe payment transactions
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  invoiceId: int("invoiceId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("CAD").notNull(),
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "cancelled", "refunded"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }), // card, cheque, bank transfer, cash, or other
  paymentDate: date("paymentDate"),
  referenceNumber: varchar("referenceNumber", { length: 100 }),
  lastFourDigits: varchar("lastFourDigits", { length: 4 }),
  cardBrand: varchar("cardBrand", { length: 50 }), // visa, mastercard, etc
  description: text("description"),
  metadata: text("metadata"), // JSON for custom data
  failureReason: text("failureReason"),
  refundedAmount: decimal("refundedAmount", { precision: 10, scale: 2 }).default("0").notNull(),
  refundReason: text("refundReason"),
  receiptUrl: text("receiptUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;


// Crew Skills - track skills and certifications for each crew member
export const crewSkills = mysqlTable("crewSkills", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  crewId: int("crewId").notNull(),
  skillName: varchar("skillName", { length: 100 }).notNull(), // e.g., "Asphalt Shingles", "Metal Roofing", "Flat Roofs"
  skillLevel: mysqlEnum("skillLevel", ["beginner", "intermediate", "expert"]).default("intermediate").notNull(),
  certificationName: varchar("certificationName", { length: 100 }), // e.g., "OSHA 30", "CPR Certified"
  certificationNumber: varchar("certificationNumber", { length: 100 }),
  issuedDate: date("issuedDate"),
  expirationDate: date("expirationDate"),
  issuer: varchar("issuer", { length: 100 }), // e.g., "OSHA", "Red Cross"
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrewSkill = typeof crewSkills.$inferSelect;
export type InsertCrewSkill = typeof crewSkills.$inferInsert;

// Skill Categories - predefined skills for the roofing industry
export const skillCategories = mysqlTable("skillCategories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryName: varchar("categoryName", { length: 100 }).notNull(), // e.g., "Roofing Materials", "Safety", "Tools"
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SkillCategory = typeof skillCategories.$inferSelect;
export type InsertSkillCategory = typeof skillCategories.$inferInsert;

// Predefined Skills - list of available skills
export const predefinedSkills = mysqlTable("predefinedSkills", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  skillName: varchar("skillName", { length: 100 }).notNull(),
  categoryId: int("categoryId"),
  description: text("description"),
  isRequired: boolean("isRequired").default(false), // Mark critical skills
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PredefinedSkill = typeof predefinedSkills.$inferSelect;
export type InsertPredefinedSkill = typeof predefinedSkills.$inferInsert;


// Crew Members table - links individual crew members to crews
export const crewMembers = mysqlTable("crewMembers", {
  id: int("id").autoincrement().primaryKey(),
  crewId: int("crewId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(), // e.g., "Lead", "Helper", "Specialist"
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  joinDate: timestamp("joinDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrewMember = typeof crewMembers.$inferSelect;
export type InsertCrewMember = typeof crewMembers.$inferInsert;


// Crew Member Skills - tracks skills and certifications for each crew member
export const crewMemberSkills = mysqlTable("crewMemberSkills", {
  id: int("id").autoincrement().primaryKey(),
  crewMemberId: int("crewMemberId").notNull(),
  skillName: varchar("skillName", { length: 100 }).notNull(),
  certificationNumber: varchar("certificationNumber", { length: 100 }),
  expirationDate: timestamp("expirationDate"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrewMemberSkill = typeof crewMemberSkills.$inferSelect;
export type InsertCrewMemberSkill = typeof crewMemberSkills.$inferInsert;

// Customer Notes - tracks all interactions and notes for each customer
export const customerNotes = mysqlTable("customerNotes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  customerId: int("customerId").notNull(),
  noteType: mysqlEnum("noteType", ["call", "email", "meeting", "follow_up", "general", "quote_sent", "contract_signed"]).default("general").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdBy: int("createdBy").notNull(), // User ID who created the note
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomerNote = typeof customerNotes.$inferSelect;
export type InsertCustomerNote = typeof customerNotes.$inferInsert;

// -----------------------------------------------------------------------------
// Subcontractor-centric operations model
// -----------------------------------------------------------------------------

export const companies = mysqlTable(
  "companies",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    legalName: varchar("legalName", { length: 255 }),
    accountType: mysqlEnum("accountType", ["partner", "direct_customer"]).default("partner").notNull(),
    classification: varchar("classification", { length: 120 }),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 30 }),
    website: varchar("website", { length: 500 }),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    province: varchar("province", { length: 100 }),
    postalCode: varchar("postalCode", { length: 20 }),
    preferredContactMethod: mysqlEnum("preferredContactMethod", ["phone", "email", "text", "in_person"]).default("email").notNull(),
    paymentTerms: mysqlEnum("paymentTerms", ["due_on_receipt", "net_7", "net_15", "net_30", "net_45", "net_60", "custom"]).default("net_30").notNull(),
    standardLabourRate: decimal("standardLabourRate", { precision: 10, scale: 2 }),
    areasServed: text("areasServed"),
    typicalWorkRequested: text("typicalWorkRequested"),
    contractInformation: text("contractInformation"),
    insuranceRequirements: text("insuranceRequirements"),
    wsibRequirements: text("wsibRequirements"),
    safetyRequirements: text("safetyRequirements"),
    requiredDocumentation: text("requiredDocumentation"),
    specialInstructions: text("specialInstructions"),
    notes: text("notes"),
    status: mysqlEnum("status", ["active", "inactive", "on_hold"]).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("companies_user_idx").on(table.userId), index("companies_type_status_idx").on(table.userId, table.accountType, table.status)],
);

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

export const companyContacts = mysqlTable(
  "companyContacts",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    firstName: varchar("firstName", { length: 100 }).notNull(),
    lastName: varchar("lastName", { length: 100 }).notNull(),
    role: mysqlEnum("role", ["owner", "project_manager", "site_supervisor", "dispatcher", "estimator", "accounts_payable", "accounts_receivable", "safety_coordinator", "other"]).default("other").notNull(),
    position: varchar("position", { length: 120 }),
    phone: varchar("phone", { length: 30 }),
    mobile: varchar("mobile", { length: 30 }),
    email: varchar("email", { length: 320 }),
    preferredContactMethod: mysqlEnum("preferredContactMethod", ["phone", "email", "text", "in_person"]).default("email").notNull(),
    notes: text("notes"),
    isPrimary: boolean("isPrimary").default(false).notNull(),
    status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("company_contacts_company_idx").on(table.companyId), index("company_contacts_active_idx").on(table.companyId, table.status)],
);

export type CompanyContact = typeof companyContacts.$inferSelect;
export type InsertCompanyContact = typeof companyContacts.$inferInsert;

export const companyNotes = mysqlTable(
  "companyNotes",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    userId: int("userId").notNull(),
    noteType: mysqlEnum("noteType", ["general", "communication", "financial", "operations", "safety", "dispute"]).default("general").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("company_notes_company_idx").on(table.companyId, table.createdAt)],
);

export type CompanyNote = typeof companyNotes.$inferSelect;
export type InsertCompanyNote = typeof companyNotes.$inferInsert;

export const jobSites = mysqlTable(
  "jobSites",
  {
    id: int("id").autoincrement().primaryKey(),
    companyId: int("companyId").notNull(),
    name: varchar("name", { length: 255 }),
    address: text("address").notNull(),
    city: varchar("city", { length: 100 }),
    province: varchar("province", { length: 100 }),
    postalCode: varchar("postalCode", { length: 20 }),
    propertyType: mysqlEnum("propertyType", ["residential", "commercial", "industrial", "multi_residential", "institutional", "other"]).default("residential").notNull(),
    siteContactName: varchar("siteContactName", { length: 200 }),
    siteContactPhone: varchar("siteContactPhone", { length: 30 }),
    accessInstructions: text("accessInstructions"),
    parkingInformation: text("parkingInformation"),
    roofInformation: text("roofInformation"),
    safetyHazards: text("safetyHazards"),
    requiredEquipment: text("requiredEquipment"),
    notes: text("notes"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("job_sites_company_idx").on(table.companyId)],
);

export type JobSite = typeof jobSites.$inferSelect;
export type InsertJobSite = typeof jobSites.$inferInsert;

export const workOrders = mysqlTable(
  "workOrders",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    companyId: int("companyId").notNull(),
    jobSiteId: int("jobSiteId").notNull(),
    contactId: int("contactId"),
    projectId: int("projectId"),
    workOrderNumber: varchar("workOrderNumber", { length: 64 }).notNull(),
    purchaseOrderNumber: varchar("purchaseOrderNumber", { length: 100 }),
    receivedAt: timestamp("receivedAt").defaultNow().notNull(),
    requestedStartDate: date("requestedStartDate"),
    deadline: date("deadline"),
    scheduledStartDate: date("scheduledStartDate"),
    scheduledEndDate: date("scheduledEndDate"),
    jobType: mysqlEnum("jobType", ["tear_off", "shingle_installation", "flat_roofing", "repair", "flashing", "ventilation", "ice_water_protection", "underlayment", "metal_work", "skylight", "soffit_fascia", "eavestrough", "emergency_repair", "snow_work", "other"]).default("other").notNull(),
    scopeSummary: text("scopeSummary").notNull(),
    materialsSummary: text("materialsSummary"),
    labourRequirements: text("labourRequirements"),
    crewRequirements: text("crewRequirements"),
    specialInstructions: text("specialInstructions"),
    estimatedValue: decimal("estimatedValue", { precision: 12, scale: 2 }),
    agreedPrice: decimal("agreedPrice", { precision: 12, scale: 2 }),
    additionalCharges: decimal("additionalCharges", { precision: 12, scale: 2 }).default("0.00").notNull(),
    taxRate: decimal("taxRate", { precision: 5, scale: 2 }).default("13.00").notNull(),
    status: mysqlEnum("status", ["new", "reviewed", "accepted", "scheduled", "assigned", "in_progress", "waiting", "completed", "ready_for_invoice", "invoiced", "partially_paid", "paid", "closed", "cancelled", "on_hold", "disputed", "callback_required"]).default("new").notNull(),
    statusReason: text("statusReason"),
    createdByUserId: int("createdByUserId").notNull(),
    updatedByUserId: int("updatedByUserId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("work_orders_user_number_unique").on(table.userId, table.workOrderNumber),
    index("work_orders_company_idx").on(table.companyId, table.createdAt),
    index("work_orders_site_idx").on(table.jobSiteId),
    index("work_orders_status_deadline_idx").on(table.userId, table.status, table.deadline),
  ],
);

export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = typeof workOrders.$inferInsert;

export const workOrderScopes = mysqlTable(
  "workOrderScopes",
  {
    id: int("id").autoincrement().primaryKey(),
    workOrderId: int("workOrderId").notNull(),
    category: mysqlEnum("category", ["tear_off", "shingle_installation", "flat_roofing", "repair", "flashing", "ventilation", "ice_water_protection", "underlayment", "metal_work", "skylight", "soffit_fascia", "eavestrough", "emergency_repair", "snow_work", "other"]).default("other").notNull(),
    description: text("description").notNull(),
    quantity: decimal("quantity", { precision: 12, scale: 2 }),
    unit: varchar("unit", { length: 40 }),
    completedQuantity: decimal("completedQuantity", { precision: 12, scale: 2 }),
    isCompleted: boolean("isCompleted").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("work_order_scopes_order_idx").on(table.workOrderId)],
);

export type WorkOrderScope = typeof workOrderScopes.$inferSelect;
export type InsertWorkOrderScope = typeof workOrderScopes.$inferInsert;

export const workOrderAssignments = mysqlTable(
  "workOrderAssignments",
  {
    id: int("id").autoincrement().primaryKey(),
    workOrderId: int("workOrderId").notNull(),
    crewId: int("crewId").notNull(),
    assignedByUserId: int("assignedByUserId").notNull(),
    appointmentId: int("appointmentId"),
    status: mysqlEnum("status", ["assigned", "accepted", "in_progress", "completed", "cancelled"]).default("assigned").notNull(),
    scheduledStart: timestamp("scheduledStart"),
    scheduledEnd: timestamp("scheduledEnd"),
    actualStart: timestamp("actualStart"),
    actualCompletion: timestamp("actualCompletion"),
    labourHours: decimal("labourHours", { precision: 10, scale: 2 }),
    productionQuantity: decimal("productionQuantity", { precision: 12, scale: 2 }),
    productionUnit: varchar("productionUnit", { length: 40 }),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("work_order_assignments_unique").on(table.workOrderId, table.crewId), index("work_order_assignments_crew_status_idx").on(table.crewId, table.status)],
);

export type WorkOrderAssignment = typeof workOrderAssignments.$inferSelect;
export type InsertWorkOrderAssignment = typeof workOrderAssignments.$inferInsert;

export const workOrderCompletions = mysqlTable(
  "workOrderCompletions",
  {
    id: int("id").autoincrement().primaryKey(),
    workOrderId: int("workOrderId").notNull(),
    completedByUserId: int("completedByUserId").notNull(),
    completionDate: timestamp("completionDate").notNull(),
    completedScope: text("completedScope").notNull(),
    quantityCompleted: decimal("quantityCompleted", { precision: 12, scale: 2 }),
    quantityUnit: varchar("quantityUnit", { length: 40 }),
    labourHours: decimal("labourHours", { precision: 10, scale: 2 }),
    productionQuantity: decimal("productionQuantity", { precision: 12, scale: 2 }),
    productionUnit: varchar("productionUnit", { length: 40 }),
    materialsUsed: text("materialsUsed"),
    deficiencies: text("deficiencies"),
    signOffName: varchar("signOffName", { length: 200 }),
    crewNotes: text("crewNotes"),
    officeNotes: text("officeNotes"),
    callbackRequired: boolean("callbackRequired").default(false).notNull(),
    callbackDetails: text("callbackDetails"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("work_order_completions_order_unique").on(table.workOrderId)],
);

export type WorkOrderCompletion = typeof workOrderCompletions.$inferSelect;
export type InsertWorkOrderCompletion = typeof workOrderCompletions.$inferInsert;

export const changeOrders = mysqlTable(
  "changeOrders",
  {
    id: int("id").autoincrement().primaryKey(),
    workOrderId: int("workOrderId").notNull(),
    number: varchar("number", { length: 64 }).notNull(),
    description: text("description").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    status: mysqlEnum("status", ["draft", "submitted", "approved", "rejected", "invoiced"]).default("draft").notNull(),
    requestedAt: timestamp("requestedAt").defaultNow().notNull(),
    approvedAt: timestamp("approvedAt"),
    notes: text("notes"),
    createdByUserId: int("createdByUserId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("change_orders_work_order_number_unique").on(table.workOrderId, table.number), index("change_orders_work_order_idx").on(table.workOrderId, table.status)],
);

export type ChangeOrder = typeof changeOrders.$inferSelect;
export type InsertChangeOrder = typeof changeOrders.$inferInsert;

export const documents = mysqlTable(
  "documents",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    companyId: int("companyId"),
    jobSiteId: int("jobSiteId"),
    workOrderId: int("workOrderId"),
    documentType: mysqlEnum("documentType", ["contract", "purchase_order", "drawing", "blueprint", "specification", "safety_document", "insurance_certificate", "wsib_wcb_certificate", "invoice", "receipt", "completion_document", "email_pdf", "photo", "other"]).default("other").notNull(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    fileKey: varchar("fileKey", { length: 500 }).notNull(),
    fileUrl: text("fileUrl").notNull(),
    mimeType: varchar("mimeType", { length: 150 }).notNull(),
    revisionNumber: varchar("revisionNumber", { length: 64 }),
    revisionNotes: text("revisionNotes"),
    notes: text("notes"),
    uploadedByUserId: int("uploadedByUserId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("documents_company_idx").on(table.companyId), index("documents_site_idx").on(table.jobSiteId), index("documents_work_order_idx").on(table.workOrderId)],
);

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export const workOrderStatusHistory = mysqlTable(
  "workOrderStatusHistory",
  {
    id: int("id").autoincrement().primaryKey(),
    workOrderId: int("workOrderId").notNull(),
    changedByUserId: int("changedByUserId").notNull(),
    fromStatus: varchar("fromStatus", { length: 40 }),
    toStatus: varchar("toStatus", { length: 40 }).notNull(),
    reason: text("reason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("work_order_status_history_order_idx").on(table.workOrderId, table.createdAt)],
);

export type WorkOrderStatusHistory = typeof workOrderStatusHistory.$inferSelect;
export type InsertWorkOrderStatusHistory = typeof workOrderStatusHistory.$inferInsert;

export const companiesRelations = relations(companies, ({ many }) => ({
  contacts: many(companyContacts),
  notes: many(companyNotes),
  jobSites: many(jobSites),
  workOrders: many(workOrders),
  documents: many(documents),
}));

export const companyContactsRelations = relations(companyContacts, ({ one, many }) => ({
  company: one(companies, { fields: [companyContacts.companyId], references: [companies.id] }),
  workOrders: many(workOrders),
}));

export const jobSitesRelations = relations(jobSites, ({ one, many }) => ({
  company: one(companies, { fields: [jobSites.companyId], references: [companies.id] }),
  workOrders: many(workOrders),
  documents: many(documents),
}));

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  company: one(companies, { fields: [workOrders.companyId], references: [companies.id] }),
  jobSite: one(jobSites, { fields: [workOrders.jobSiteId], references: [jobSites.id] }),
  contact: one(companyContacts, { fields: [workOrders.contactId], references: [companyContacts.id] }),
  scopes: many(workOrderScopes),
  assignments: many(workOrderAssignments),
  documents: many(documents),
  completions: many(workOrderCompletions),
  changeOrders: many(changeOrders),
  statusHistory: many(workOrderStatusHistory),
}));

export const workOrderScopesRelations = relations(workOrderScopes, ({ one }) => ({
  workOrder: one(workOrders, { fields: [workOrderScopes.workOrderId], references: [workOrders.id] }),
}));

export const workOrderAssignmentsRelations = relations(workOrderAssignments, ({ one }) => ({
  workOrder: one(workOrders, { fields: [workOrderAssignments.workOrderId], references: [workOrders.id] }),
  crew: one(crews, { fields: [workOrderAssignments.crewId], references: [crews.id] }),
}));

export const workOrderCompletionsRelations = relations(workOrderCompletions, ({ one }) => ({
  workOrder: one(workOrders, { fields: [workOrderCompletions.workOrderId], references: [workOrders.id] }),
}));

export const changeOrdersRelations = relations(changeOrders, ({ one }) => ({
  workOrder: one(workOrders, { fields: [changeOrders.workOrderId], references: [workOrders.id] }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  company: one(companies, { fields: [documents.companyId], references: [companies.id] }),
  jobSite: one(jobSites, { fields: [documents.jobSiteId], references: [jobSites.id] }),
  workOrder: one(workOrders, { fields: [documents.workOrderId], references: [workOrders.id] }),
}));

export const workOrderStatusHistoryRelations = relations(workOrderStatusHistory, ({ one }) => ({
  workOrder: one(workOrders, { fields: [workOrderStatusHistory.workOrderId], references: [workOrders.id] }),
}));
