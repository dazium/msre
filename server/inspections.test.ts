import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(): { ctx: TrpcContext } {
  return {
    ctx: {
      user: {
        id: 1,
        openId: "test-user",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: () => {} } as any,
    },
  };
}

describe("Inspections Custom Points", () => {
  let inspectionId: number;

  beforeAll(async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const customerResult = await caller.customers.create({
      firstName: "Inspection",
      lastName: "Test Customer",
      phone: "555-0199",
    });
    const customerId = Number((customerResult as any)[0]?.insertId);

    const project = await caller.projects.create({
      customerId,
      title: "Test Project for Inspection",
      roofType: "asphalt_shingle",
    });

    const result = await caller.inspections.create({
      projectId: project.id,
      customerId,
      roofType: "asphalt_shingle",
      items: [{ category: "Roof Surface", label: "Initial Check" }],
    });
    
    inspectionId = result.inspection.id;
  });

  it("should append a custom inspection point with valid category and label", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const customItem = await caller.inspections.createItem({
      inspectionId,
      category: "  Customer Concern  ",
      label: "  Check for soft spots near chimney  ",
    });

    expect(customItem.category).toBe("Customer Concern");
    expect(customItem.label).toBe("Check for soft spots near chimney");
    expect(customItem.status).toBe("pending");

    const { items } = await caller.inspections.getById({ id: inspectionId });
    const appended = items.find(i => i.id === customItem.id);
    expect(appended).toBeDefined();
    expect(appended?.category).toBe("Customer Concern");
  });

  it("should fail to append a custom point with empty category or label", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.inspections.createItem({
      inspectionId,
      category: "   ",
      label: "Valid label",
    })).rejects.toThrow();

    await expect(caller.inspections.createItem({
      inspectionId,
      category: "Valid category",
      label: "",
    })).rejects.toThrow();
  });
});
