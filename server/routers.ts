import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  customers: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getCustomersByUserId(ctx.user.id)
    ),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      db.getCustomerById(input.id, ctx.user.id)
    ),
    create: protectedProcedure.input(z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().min(1),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(({ ctx, input }) =>
      db.createCustomer({
        userId: ctx.user.id,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        address: input.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        latitude: input.latitude ? parseFloat(input.latitude) : undefined as any,
        longitude: input.longitude ? parseFloat(input.longitude) : undefined as any,
        notes: input.notes,
      })
    ),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      status: z.enum(["lead", "contacted", "qualified", "proposal_sent", "won", "lost"]).optional(),
      notes: z.string().optional(),
    })).mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateCustomer(id, ctx.user.id, data);
    }),
  }),

  projects: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getProjectsByUserId(ctx.user.id)
    ),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      db.getProjectById(input.id, ctx.user.id)
    ),
    create: protectedProcedure.input(z.object({
      customerId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      estimatedValue: z.string().optional(),
    })).mutation(({ ctx, input }) =>
      db.createProject({
        userId: ctx.user.id,
        customerId: input.customerId,
        title: input.title,
        description: input.description,
        address: input.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        latitude: input.latitude ? parseFloat(input.latitude) : undefined as any,
        longitude: input.longitude ? parseFloat(input.longitude) : undefined as any,
        estimatedValue: input.estimatedValue ? parseFloat(input.estimatedValue) : undefined as any,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      })
    ),
  }),

  estimates: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getEstimatesByUserId(ctx.user.id)
    ),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      db.getEstimateById(input.id, ctx.user.id)
    ),
    create: protectedProcedure.input(z.object({
      projectId: z.number(),
      customerId: z.number(),
      estimateNumber: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional(),
      subtotal: z.string(),
      tax: z.string().optional(),
      total: z.string(),
      validUntil: z.string().optional(),
    })).mutation(({ ctx, input }) =>
      db.createEstimate({
        userId: ctx.user.id,
        projectId: input.projectId,
        customerId: input.customerId,
        estimateNumber: input.estimateNumber,
        title: input.title,
        description: input.description,
        subtotal: parseFloat(input.subtotal) as any,
        tax: input.tax ? parseFloat(input.tax) : 0 as any,
        total: parseFloat(input.total) as any,
        validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
      })
    ),
  }),

  damages: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const projects = await db.getProjectsByUserId(ctx.user.id);
      const allDamages = [];
      for (const project of projects) {
        const damages = await db.getDamagesByProjectId(project.id, ctx.user.id);
        allDamages.push(...damages);
      }
      return allDamages;
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      db.getDamageById(input.id, ctx.user.id)
    ),
    create: protectedProcedure.input(z.object({
      projectId: z.number(),
      category: z.enum(["missing_shingles", "flashing_damage", "leaks", "sagging", "rot", "moss_algae", "hail_damage", "wind_damage", "other"]),
      description: z.string().min(1),
      severity: z.enum(["minor", "moderate", "severe"]).optional(),
      location: z.string().optional(),
      estimatedCost: z.string().optional(),
    })).mutation(({ ctx, input }) => {
      return db.createDamage({
        userId: ctx.user.id,
        projectId: input.projectId,
        customerId: 0, // Will be fetched from project
        category: input.category,
        description: input.description,
        severity: input.severity || "moderate",
        location: input.location,
        estimatedCost: input.estimatedCost ? parseFloat(input.estimatedCost) : undefined as any,
      });
    }),
  }),

  appointments: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getAppointmentsByUserId(ctx.user.id)
    ),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      db.getAppointmentById(input.id, ctx.user.id)
    ),
    create: protectedProcedure.input(z.object({
      customerId: z.number().optional(),
      projectId: z.number().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      startTime: z.string(),
      endTime: z.string(),
      location: z.string().optional(),
      type: z.enum(["estimate", "inspection", "consultation", "job_start", "follow_up", "other"]).optional(),
      notes: z.string().optional(),
    })).mutation(({ ctx, input }) =>
      db.createAppointment({
        userId: ctx.user.id,
        customerId: input.customerId,
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
        location: input.location,
        type: input.type || "other",
        notes: input.notes,
      })
    ),
  }),
});

export type AppRouter = typeof appRouter;
