import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import * as db from "./db";
import { activityLog, companies, companyContacts, companyNotes, documents, jobSites, workOrders } from "../drizzle/schema";

const ownerId = 920001;
const otherUserId = 920002;
let companyId = 0;
let siteId = 0;

async function cleanup() {
  const database = await db.getDb();
  if (!database) return;
  const ownedCompanies = await database.select({ id: companies.id }).from(companies).where(inArray(companies.userId, [ownerId, otherUserId]));
  const companyIds = ownedCompanies.map((company) => company.id);
  if (companyIds.length > 0) {
    const ownedSites = await database.select({ id: jobSites.id }).from(jobSites).where(inArray(jobSites.companyId, companyIds));
    const siteIds = ownedSites.map((site) => site.id);
    await database.delete(companyNotes).where(inArray(companyNotes.companyId, companyIds));
    await database.delete(companyContacts).where(inArray(companyContacts.companyId, companyIds));
    await database.delete(documents).where(inArray(documents.companyId, companyIds));
    if (siteIds.length > 0) await database.delete(documents).where(inArray(documents.jobSiteId, siteIds));
    await database.delete(jobSites).where(inArray(jobSites.companyId, companyIds));
    await database.delete(workOrders).where(inArray(workOrders.companyId, companyIds));
    await database.delete(companies).where(inArray(companies.id, companyIds));
  }
  await database.delete(activityLog).where(inArray(activityLog.userId, [ownerId, otherUserId]));
}

describe("Company accounts and reusable job sites", () => {
  beforeAll(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  it("creates a partner account and supports account-type and text filters", async () => {
    const company = await db.createCompany({
      userId: ownerId,
      name: "Northline Restoration Group",
      accountType: "partner",
      email: "dispatch@northline.example",
      phone: "519-555-0100",
      paymentTerms: "net_30",
      status: "active",
    });
    companyId = company.id;

    const results = await db.listCompanies(ownerId, { accountType: "partner", status: "active", search: "northline" });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe(company.id);

    const otherUserResults = await db.listCompanies(otherUserId, { search: "northline" });
    expect(otherUserResults).toHaveLength(0);
  });

  it("maintains exactly one primary contact for an account", async () => {
    const first = await db.createCompanyContact({
      companyId,
      firstName: "Nora",
      lastName: "Northline",
      role: "dispatcher",
      isPrimary: true,
      status: "active",
      preferredContactMethod: "email",
    }, ownerId);
    expect(first.isPrimary).toBe(true);

    const second = await db.createCompanyContact({
      companyId,
      firstName: "Sam",
      lastName: "Supervisor",
      role: "site_supervisor",
      isPrimary: true,
      status: "active",
      preferredContactMethod: "phone",
    }, ownerId);
    expect(second.isPrimary).toBe(true);

    const contacts = await db.listCompanyContacts(companyId, ownerId);
    expect(contacts).toHaveLength(2);
    expect(contacts.filter((contact) => contact.isPrimary)).toHaveLength(1);
    expect(contacts.find((contact) => contact.id === second.id)?.isPrimary).toBe(true);
  });

  it("creates a reusable job site with operating instructions", async () => {
    const site = await db.createJobSite({
      companyId,
      name: "Riverside Apartments",
      address: "101 Riverside Drive",
      city: "Windsor",
      province: "Ontario",
      postalCode: "N9A 1A1",
      propertyType: "multi_residential",
      accessInstructions: "Check in at the south office before accessing the roof.",
      safetyHazards: "Live loading zone at rear entrance.",
      isActive: true,
    }, ownerId);
    siteId = site.id;

    const sites = await db.listJobSites(companyId, ownerId);
    expect(sites).toHaveLength(1);
    expect(sites[0]?.accessInstructions).toContain("south office");

    const denied = await db.getJobSiteById(siteId, otherUserId);
    expect(denied).toBeUndefined();
  });

  it("records account notes and composes account history", async () => {
    const note = await db.createCompanyNote({
      companyId,
      userId: ownerId,
      noteType: "operations",
      content: "Dispatch requests photo confirmation before invoice submission.",
    });
    expect(note.id).toBeGreaterThan(0);

    const history = await db.getAccountHistory(companyId, ownerId);
    expect(history.some((entry) => entry.type === "note" && entry.id === note.id)).toBe(true);
  });

  it("rejects contact creation for an account owned by a different user", async () => {
    await expect(db.createCompanyContact({
      companyId,
      firstName: "Unauthorized",
      lastName: "Contact",
      role: "other",
      status: "active",
      preferredContactMethod: "email",
    }, otherUserId)).rejects.toThrow("Company account not found");
  });
});
