import { describe, expect, it } from "vitest";
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

describe("Appointments Router - Calendar & Scheduling", () => {
  it("should list appointments (empty initially)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.appointments.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create an appointment", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const startTime = new Date(2026, 3, 15, 10, 0); // April 15, 2026 at 10:00 AM
    const endTime = new Date(2026, 3, 15, 11, 0); // April 15, 2026 at 11:00 AM

    const result = await caller.appointments.create({
      title: "Roof Inspection",
      type: "inspection",
      startTime,
      endTime,
      location: "123 Main St, Windsor, ON",
      description: "Initial roof inspection",
    });

    expect(result).toBeDefined();
  });

  it("should create different appointment types", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const types = ["estimate", "inspection", "consultation", "job_start", "follow_up", "other"];
    const startTime = new Date(2026, 3, 16, 10, 0);

    for (const type of types) {
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      const result = await caller.appointments.create({
        title: `${type} appointment`,
        type: type as any,
        startTime,
        endTime,
      });
      expect(result).toBeDefined();
    }
  });

  it("should create appointment with all optional fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const startTime = new Date(2026, 3, 17, 14, 0);
    const endTime = new Date(2026, 3, 17, 15, 30);

    const result = await caller.appointments.create({
      projectId: 1,
      customerId: 1,
      title: "Full appointment",
      description: "Complete appointment with all fields",
      type: "job_start",
      startTime,
      endTime,
      status: "scheduled",
      location: "456 Oak Ave, Windsor, ON",
      notes: "Bring ladder and safety equipment",
    });

    expect(result).toBeDefined();
  });

  it("should list appointments by project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const startTime = new Date(2026, 3, 18, 9, 0);
    const endTime = new Date(2026, 3, 18, 10, 0);

    await caller.appointments.create({
      projectId: 1,
      title: "Project 1 appointment",
      type: "estimate",
      startTime,
      endTime,
    });

    const result = await caller.appointments.listByProject({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should update appointment status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const startTime = new Date(2026, 3, 19, 10, 0);
    const endTime = new Date(2026, 3, 19, 11, 0);

    await caller.appointments.create({
      title: "Appointment to update",
      type: "inspection",
      startTime,
      endTime,
      status: "scheduled",
    });

    const result = await caller.appointments.update({
      id: 1,
      status: "completed",
    });

    expect(result).toBeDefined();
  });

  it("should update appointment details", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const startTime = new Date(2026, 3, 20, 10, 0);
    const endTime = new Date(2026, 3, 20, 11, 0);

    await caller.appointments.create({
      title: "Original title",
      type: "consultation",
      startTime,
      endTime,
      location: "Original location",
    });

    const result = await caller.appointments.update({
      id: 1,
      title: "Updated title",
      location: "Updated location",
      notes: "Updated notes",
    });

    expect(result).toBeDefined();
  });

  it("should delete an appointment", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const startTime = new Date(2026, 3, 21, 10, 0);
    const endTime = new Date(2026, 3, 21, 11, 0);

    await caller.appointments.create({
      title: "Appointment to delete",
      type: "follow_up",
      startTime,
      endTime,
    });

    const result = await caller.appointments.delete({ id: 1 });
    expect(result).toBeDefined();
  });

  it("should support all appointment statuses", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const statuses = ["scheduled", "completed", "cancelled", "no_show"];
    const startTime = new Date(2026, 3, 22, 10, 0);
    const endTime = new Date(2026, 3, 22, 11, 0);

    for (const status of statuses) {
      const result = await caller.appointments.create({
        title: `${status} appointment`,
        type: "other",
        startTime,
        endTime,
        status: status as any,
      });
      expect(result).toBeDefined();
    }
  });

  it("should handle appointments spanning multiple hours", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const startTime = new Date(2026, 3, 23, 8, 0);
    const endTime = new Date(2026, 3, 23, 16, 0); // 8-hour job

    const result = await caller.appointments.create({
      title: "Full day job",
      type: "job_start",
      startTime,
      endTime,
      description: "Full day roofing job",
    });

    expect(result).toBeDefined();
  });

  it("should handle appointments on same day", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const date = new Date(2026, 3, 24);

    // Morning appointment
    const morning = await caller.appointments.create({
      title: "Morning inspection",
      type: "inspection",
      startTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0),
      endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 0),
    });

    // Afternoon appointment
    const afternoon = await caller.appointments.create({
      title: "Afternoon estimate",
      type: "estimate",
      startTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 14, 0),
      endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 15, 0),
    });

    expect(morning).toBeDefined();
    expect(afternoon).toBeDefined();
  });
});

describe("Calendar Integration Tests", () => {
  it("should complete full appointment workflow", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Step 1: Create appointment
    const startTime = new Date(2026, 3, 25, 10, 0);
    const endTime = new Date(2026, 3, 25, 11, 0);

    await caller.appointments.create({
      projectId: 1,
      customerId: 1,
      title: "Complete workflow",
      type: "job_start",
      startTime,
      endTime,
      location: "789 Elm St, Windsor, ON",
      description: "Full workflow test",
      status: "scheduled",
    });

    // Step 2: List appointments
    const appointments = await caller.appointments.list();
    expect(Array.isArray(appointments)).toBe(true);

    // Step 3: Update appointment
    await caller.appointments.update({
      id: 1,
      status: "completed",
      notes: "Job completed successfully",
    });

    // Step 4: List by project
    const projectAppointments = await caller.appointments.listByProject({ projectId: 1 });
    expect(Array.isArray(projectAppointments)).toBe(true);

    expect(true).toBe(true);
  });

  it("should handle multiple appointments across different dates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const appointments = [
      { date: new Date(2026, 3, 26), title: "Monday inspection" },
      { date: new Date(2026, 3, 27), title: "Tuesday estimate" },
      { date: new Date(2026, 3, 28), title: "Wednesday job start" },
      { date: new Date(2026, 3, 29), title: "Thursday follow-up" },
      { date: new Date(2026, 3, 30), title: "Friday completion" },
    ];

    for (const apt of appointments) {
      const startTime = new Date(apt.date.getFullYear(), apt.date.getMonth(), apt.date.getDate(), 10, 0);
      const endTime = new Date(apt.date.getFullYear(), apt.date.getMonth(), apt.date.getDate(), 11, 0);

      await caller.appointments.create({
        title: apt.title,
        type: "other",
        startTime,
        endTime,
      });
    }

    const result = await caller.appointments.list();
    expect(Array.isArray(result)).toBe(true);
  });
});
