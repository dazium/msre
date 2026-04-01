import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Customers Router - Full CRUD", () => {
  it("should list customers (empty initially)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.customers.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a customer with all fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const customerData = {
      firstName: "John",
      lastName: "Doe",
      phone: "555-1234",
      email: "john@example.com",
      status: "lead" as const,
      notes: "New lead from referral",
    };

    const result = await caller.customers.create(customerData);
    expect(result).toBeDefined();
  });

  it("should create multiple customers", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const customers = [
      {
        firstName: "Alice",
        lastName: "Smith",
        phone: "555-0001",
        email: "alice@example.com",
        status: "lead" as const,
      },
      {
        firstName: "Bob",
        lastName: "Johnson",
        phone: "555-0002",
        email: "bob@example.com",
        status: "contacted" as const,
      },
    ];

    for (const customer of customers) {
      const result = await caller.customers.create(customer);
      expect(result).toBeDefined();
    }

    const list = await caller.customers.list();
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  it("should update customer status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a customer
    await caller.customers.create({
      firstName: "Charlie",
      lastName: "Brown",
      phone: "555-0003",
      email: "charlie@example.com",
      status: "lead",
    });

    // Update status
    const result = await caller.customers.update({
      id: 1,
      status: "qualified",
    });

    expect(result).toBeDefined();
  });

  it("should handle customer with minimal required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.customers.create({
      firstName: "David",
      lastName: "Lee",
      phone: "555-0004",
      status: "lead",
    });

    expect(result).toBeDefined();
  });
});

describe("Projects Router - Full CRUD", () => {
  it("should list projects (empty initially)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a project with all fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const projectData = {
      customerId: 1,
      title: "Roof Replacement - North Side",
      description: "Complete roof replacement with new shingles",
      status: "lead" as const,
      startDate: new Date(2026, 3, 1),
      endDate: new Date(2026, 3, 15),
      estimatedValue: "8500.00",
    };

    const result = await caller.projects.create(projectData);
    expect(result).toBeDefined();
  });

  it("should create multiple projects for same customer", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const projects = [
      {
        customerId: 1,
        title: "Roof Inspection",
        description: "Initial roof inspection",
        status: "scheduled" as const,
        estimatedValue: "500.00",
      },
      {
        customerId: 1,
        title: "Gutter Installation",
        description: "Install new gutters",
        status: "lead" as const,
        estimatedValue: "2000.00",
      },
    ];

    for (const project of projects) {
      const result = await caller.projects.create(project);
      expect(result).toBeDefined();
    }

    const list = await caller.projects.list();
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  it("should update project status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a project
    await caller.projects.create({
      customerId: 1,
      title: "Test Project",
      description: "Test",
      status: "lead",
    });

    // Update status
    const result = await caller.projects.update({
      id: 1,
      status: "in_progress",
    });

    expect(result).toBeDefined();
  });

  it("should support all project statuses", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const statuses = ["lead", "scheduled", "in_progress", "completed", "on_hold", "cancelled"] as const;

    for (const status of statuses) {
      const result = await caller.projects.create({
        customerId: 1,
        title: `Project - ${status}`,
        status,
      });
      expect(result).toBeDefined();
    }
  });
});

describe("Damages Router - Full CRUD", () => {
  it("should list damages (empty initially)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.damages.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a damage record with all fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const damageData = {
      projectId: 1,
      customerId: 1,
      category: "missing_shingles" as const,
      description: "Missing shingles on north side of roof, approximately 4x6 feet",
      severity: "moderate" as const,
      location: "North side, near chimney",
      estimatedCost: "1500.00",
    };

    const result = await caller.damages.create(damageData);
    expect(result).toBeDefined();
  });

  it("should support all damage categories", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const categories = [
      "missing_shingles",
      "flashing_damage",
      "leaks",
      "sagging",
      "rot",
      "moss_algae",
      "hail_damage",
      "wind_damage",
      "other",
    ] as const;

    for (const category of categories) {
      const result = await caller.damages.create({
        customerId: 1,
      projectId: 1,
        category,
        description: `Test damage - ${category}`,
      });
      expect(result).toBeDefined();
    }
  });

  it("should support all severity levels", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const severities = ["minor", "moderate", "severe"] as const;

    for (const severity of severities) {
      const result = await caller.damages.create({
        customerId: 1,
      projectId: 1,
        category: "missing_shingles",
        description: `Test damage - ${severity}`,
        severity,
      });
      expect(result).toBeDefined();
    }
  });

  it("should create multiple damages for same project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const damages = [
      {
        projectId: 1,
        customerId: 1,
        category: "missing_shingles" as const,
        description: "Missing shingles on north side",
        severity: "moderate" as const,
        location: "North side",
        estimatedCost: "1500.00",
      },
      {
        projectId: 1,
        customerId: 1,
        category: "flashing_damage" as const,
        description: "Damaged flashing around chimney",
        severity: "severe" as const,
        location: "Chimney area",
        estimatedCost: "800.00",
      },
      {
        projectId: 1,
        customerId: 1,
        category: "moss_algae" as const,
        description: "Moss growth on shaded areas",
        severity: "minor" as const,
        location: "North and west sides",
        estimatedCost: "300.00",
      },
    ];

    for (const damage of damages) {
      const result = await caller.damages.create(damage);
      expect(result).toBeDefined();
    }

    const list = await caller.damages.list();
    expect(list.length).toBeGreaterThanOrEqual(3);
  });

  it("should handle damage with minimal required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.damages.create({
      customerId: 1,
      projectId: 1,
      category: "other",
      description: "Unspecified roof damage",
    });

    expect(result).toBeDefined();
  });
});

describe("Authentication", () => {
  it("should logout successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });

  it("should get current user info", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.email).toBe("test@example.com");
    expect(result?.name).toBe("Test User");
    expect(result?.role).toBe("user");
  });

  it("should have correct user properties", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("openId");
    expect(result).toHaveProperty("email");
    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("role");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("updatedAt");
  });
});

describe("Integration Tests - Full Workflow", () => {
  it("should complete a full customer to project to damage workflow", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Step 1: Create a customer
    const customerResult = await caller.customers.create({
      firstName: "Integration",
      lastName: "Test",
      phone: "555-9999",
      email: "integration@test.com",
      status: "lead",
      notes: "Integration test customer",
    });
    expect(customerResult).toBeDefined();

    // Step 2: Create a project for the customer
    const projectResult = await caller.projects.create({
      customerId: 1,
      title: "Integration Test Project",
      description: "Full workflow test",
      status: "scheduled",
      estimatedValue: "5000.00",
    });
    expect(projectResult).toBeDefined();

    // Step 3: Record damages for the project
    const damageResult = await caller.damages.create({
      customerId: 1,
      projectId: 1,
      category: "missing_shingles",
      description: "Integration test damage",
      severity: "moderate",
      location: "Test location",
      estimatedCost: "2000.00",
    });
    expect(damageResult).toBeDefined();

    // Step 4: Verify all data is retrievable
    const customers = await caller.customers.list();
    const projects = await caller.projects.list();
    const damages = await caller.damages.list();

    expect(customers.length).toBeGreaterThan(0);
    expect(projects.length).toBeGreaterThan(0);
    expect(damages.length).toBeGreaterThan(0);
  });

  it("should handle multiple concurrent operations", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create multiple customers concurrently
    const customerPromises = Array.from({ length: 5 }, (_, i) =>
      caller.customers.create({
        firstName: `Concurrent${i}`,
        lastName: `Test${i}`,
        phone: `555-${1000 + i}`,
        email: `concurrent${i}@test.com`,
        status: "lead",
      })
    );

    const results = await Promise.all(customerPromises);
    expect(results).toHaveLength(5);
    expect(results.every((r) => r !== undefined)).toBe(true);
  });

  it("should maintain data consistency across operations", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create initial data
    await caller.customers.create({
      firstName: "Consistency",
      lastName: "Test",
      phone: "555-8888",
      status: "lead",
    });

    // Retrieve and verify
    const customers1 = await caller.customers.list();
    const initialCount = customers1.length;

    // Create more data
    await caller.customers.create({
      firstName: "Consistency",
      lastName: "Test2",
      phone: "555-7777",
      status: "lead",
    });

    // Verify count increased
    const customers2 = await caller.customers.list();
    expect(customers2.length).toBe(initialCount + 1);
  });
});
