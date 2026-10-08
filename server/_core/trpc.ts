import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { getFirstAdminUser, getUserByOpenId } from "../db";
import type { TrpcContext } from "./context";
import { ENV } from "./env";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

let publicCrmUserPromise: Promise<NonNullable<TrpcContext["user"]> | null> | null = null;

async function resolvePublicCrmUser() {
  if (!publicCrmUserPromise) {
    publicCrmUserPromise = (ENV.ownerOpenId
      ? getUserByOpenId(ENV.ownerOpenId)
      : getFirstAdminUser()
    ).then(async (user) => {
      if (user) return user;
      if (ENV.ownerOpenId) {
        console.warn("[Public CRM] Configured owner identity was not found; falling back to the first admin user");
      } else {
        console.warn("[Public CRM] OWNER_OPEN_ID is not configured; falling back to the first admin user");
      }
      return (await getFirstAdminUser()) ?? null;
    }).catch((error) => {
      console.error("[Public CRM] Could not resolve a public owner identity", error);
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
