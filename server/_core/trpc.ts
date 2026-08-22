import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import superjson from "superjson";
import { users, type User } from "../../drizzle/schema";
import { getDb } from "../db";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const PUBLIC_CRM_OWNER_ID = 1;
let publicCrmOwner: User | null | undefined;

export function resolvePublicCrmUser(
  authenticatedUser: User | null,
  publicOwner: User | null,
): User | null {
  return authenticatedUser ?? publicOwner;
}

async function getPublicCrmOwner(): Promise<User | null> {
  if (publicCrmOwner !== undefined) return publicCrmOwner;

  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, PUBLIC_CRM_OWNER_ID))
    .limit(1);

  publicCrmOwner = result[0] ?? null;
  return publicCrmOwner;
}

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;
  const user = resolvePublicCrmUser(ctx.user, await getPublicCrmOwner());

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

type OperationsRole = "user" | "admin" | "office_manager" | "project_manager" | "crew_leader" | "worker" | "accounting";

function requireAnyRole(roles: readonly OperationsRole[]) {
  return t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || !roles.includes(ctx.user.role as OperationsRole)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Your role does not have permission for this operation." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

// Legacy `user` accounts retain office-level access while organizations migrate to dedicated roles.
export const projectOperationsProcedure = t.procedure.use(requireUser).use(requireAnyRole(["user", "admin", "office_manager", "project_manager"]));
export const fieldOperationsProcedure = t.procedure.use(requireUser).use(requireAnyRole(["user", "admin", "office_manager", "project_manager", "crew_leader", "worker"]));
export const accountingProcedure = t.procedure.use(requireUser).use(requireAnyRole(["user", "admin", "office_manager", "accounting"]));

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
