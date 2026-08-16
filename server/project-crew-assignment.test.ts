import { describe, expect, it } from "vitest";
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

describe("Project crew assignment", () => {
  it("assigns the selected crew to the project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const suffix = Date.now().toString();

    const project = await caller.projects.create({
      customerId: 1,
      title: `Crew assignment regression ${suffix}`,
    });
    const crew = await caller.crews.create({
      name: `Regression crew ${suffix}`,
    });

    const result = await caller.projects.assignCrew({
      projectId: project.id,
      crewId: crew.id,
    });

    expect(result).toEqual({ success: true, projectId: project.id, crewId: crew.id });
    const updatedProject = await caller.projects.getById({ id: project.id });
    expect(updatedProject?.crewId).toBe(crew.id);
  });
});
