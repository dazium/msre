import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { getUserByOpenId } from "../db";
import type { TrpcContext } from "./context";
import { ENV } from "./env";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

let publicCrmUserPromise: Promise<NonNullable<TrpcContext["user"]> | null> | null = null;

async function resolvePublicCrmUser() {
  if (!ENV.ownerOpenId) return null;
  if (!publicCrmUserPromise) {
    publicCrmUserPromise = getUserByOpenId(ENV.ownerOpenId).then((user) => user ?? null).catch((error) => {
      console.error("[Public CRM] Could not resolve the configured owner identity", error);
      return null;
    });
  }
  return publicCrmUserPromise;
}

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;
  const user = ctx.user ?? await resolvePublicCrmUser();

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
  requireUser).use(t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || (ctx.user.role !== 'admin' && ctx.user.openId !== ENV.ownerOpenId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }));
