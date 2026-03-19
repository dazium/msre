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

describe("Customers Router", () => {
  it("should list customers (empty initially)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.customers.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a customer", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.customers.create({
      firstName: "John",
      lastName: "Doe",
      phone: "555-1234",
      email: "john@example.com",
      address: "123 Main St",
      city: "Winter",
      state: "ON",
      zipCode: "P0X 1X0",
      status: "lead",
    });

    expect(result).toBeDefined();
  });
});

describe("Projects Router", () => {
  it("should list projects (empty initially)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.create({
      customerId: 1,
      title: "Roof Replacement",
      description: "Full roof replacement",
      address: "123 Main St",
      city: "Winter",
      state: "ON",
      zipCode: "P0X 1X0",
      status: "lead",
    });

    expect(result).toBeDefined();
  });
});

describe("Damages Router", () => {
  it("should list damages (empty initially)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.damages.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a damage record", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.damages.create({
      projectId: 1,
      category: "missing_shingles",
      description: "Missing shingles on north side",
      severity: "moderate",
      location: "North side",
      estimatedCost: "1500",
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
  });
});
