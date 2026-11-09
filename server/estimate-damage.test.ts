import { afterAll, describe, expect, it } from "vitest";
import * as db from "./db";

const userId = 940002;
let customerId = 0;
let projectId = 0;

describe("Damage-to-estimate workflow", () => {
  afterAll(async () => {
    if (customerId) await db.deleteCustomer(customerId, userId);
  });

  it("creates a draft estimate with one line item per damage assessment", async () => {
    const customerResult = await db.createCustomer({ userId, firstName: "Damage", lastName: "Estimate", phone: "519-555-0002", email: "damage-estimate@example.com" });
    customerId = Number(customerResult[0]?.insertId);
    const project = await db.createProject({ userId, customerId, title: "Damage estimate workflow", status: "lead", roofType: "asphalt_shingle" });
    projectId = project.id;
    await db.createDamage({ userId, projectId, customerId, category: "missing_shingles", description: "Replace shingles on north slope", severity: "moderate", location: "North slope", estimatedCost: "1250.00" });
    await db.createDamage({ userId, projectId, customerId, category: "flashing_damage", description: "Repair chimney flashing", severity: "severe", estimatedCost: "750.00" });

    const result = await db.createEstimateFromDamages(projectId, userId);
    const lineItems = await db.getEstimateLineItems(result.estimate.id);

    expect(result.estimate.status).toBe("draft");
    expect(result.damageCount).toBe(2);
    expect(result.estimate.subtotal).toBe("2000.00");
    expect(result.estimate.total).toBe("2000.00");
    expect(lineItems).toHaveLength(2);
    expect(lineItems.map((item) => item.total)).toEqual(expect.arrayContaining(["1250.00", "750.00"]));
  });
});
