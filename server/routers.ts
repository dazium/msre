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
        latitude: input.latitude,
        longitude: input.longitude,
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
    listByCustomer: protectedProcedure.input(z.object({ customerId: z.number() })).query(({ ctx, input }) =>
      db.getProjectsByCustomerId(input.customerId, ctx.user.id)
    ),
    create: protectedProcedure.input(z.object({
      customerId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      status: z.enum(["lead", "scheduled", "in_progress", "completed", "on_hold", "cancelled"]).default("lead"),
      estimatedValue: z.string().optional(),
      actualValue: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    })).mutation(({ ctx, input }) =>
      db.createProject({
        userId: ctx.user.id,
        customerId: input.customerId,
        title: input.title,
        description: input.description,
        status: input.status,
        estimatedValue: input.estimatedValue,
        actualValue: input.actualValue,
        startDate: input.startDate,
        endDate: input.endDate,
      })
    ),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["lead", "scheduled", "in_progress", "completed", "on_hold", "cancelled"]).optional(),
      estimatedValue: z.string().optional(),
      actualValue: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    })).mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateProject(id, ctx.user.id, data);
    }),
  }),

  damages: router({
    list: protectedProcedure.query(({ ctx }) => {
      // Return all damages for this user across all projects
      return db.getDamagesByUserId(ctx.user.id);
    }),
    listByProject: protectedProcedure.input(z.object({ projectId: z.number() })).query(({ ctx, input }) =>
      db.getDamagesByProjectId(input.projectId, ctx.user.id)
    ),
    create: protectedProcedure.input(z.object({
      projectId: z.number(),
      customerId: z.number(),
      category: z.enum(["missing_shingles", "flashing_damage", "leaks", "sagging", "rot", "moss_algae", "hail_damage", "wind_damage", "other"]),
      description: z.string().min(1),
      severity: z.enum(["minor", "moderate", "severe"]).default("moderate"),
      location: z.string().optional(),
      estimatedCost: z.string().optional(),
    })).mutation(({ ctx, input }) =>
      db.createDamage({
        userId: ctx.user.id,
        projectId: input.projectId,
        customerId: input.customerId,
        category: input.category,
        description: input.description,
        severity: input.severity,
        location: input.location,
        estimatedCost: input.estimatedCost,
      })
    ),
  }),

  photos: router({
    listByProject: protectedProcedure.input(z.object({ projectId: z.number() })).query(({ ctx, input }) =>
      db.getPhotosByProjectId(input.projectId, ctx.user.id)
    ),
    create: protectedProcedure.input(z.object({
      projectId: z.number(),
      fileName: z.string().min(1),
      fileUrl: z.string().url(),
      fileKey: z.string().min(1),
      mimeType: z.string().optional(),
      caption: z.string().optional(),
    })).mutation(({ ctx, input }) =>
      db.createPhoto({
        userId: ctx.user.id,
        projectId: input.projectId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileKey: input.fileKey,
        mimeType: input.mimeType,
        caption: input.caption,
      })
    ),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      caption: z.string().optional(),
    })).mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updatePhoto(id, ctx.user.id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) =>
      db.deletePhoto(input.id, ctx.user.id)
    ),
    linkToDamage: protectedProcedure.input(z.object({
      photoId: z.number(),
      damageId: z.number(),
    })).mutation(({ ctx, input }) =>
      db.createDamagePhoto({
        photoId: input.photoId,
        damageId: input.damageId,
      })
    ),
    unlinkFromDamage: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) =>
      db.deleteDamagePhoto(input.id)
    ),
    getDamagePhotos: protectedProcedure.input(z.object({ damageId: z.number() })).query(({ input }) =>
      db.getDamagePhotos(input.damageId)
    ),
  }),

  appointments: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getAppointmentsByUserId(ctx.user.id)
    ),
    listByProject: protectedProcedure.input(z.object({ projectId: z.number() })).query(({ input }) =>
      db.getAppointmentsByProject(input.projectId)
    ),
    create: protectedProcedure.input(z.object({
      projectId: z.number().optional(),
      customerId: z.number().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      type: z.enum(["estimate", "inspection", "consultation", "job_start", "follow_up", "other"]).default("other"),
      startTime: z.date(),
      endTime: z.date(),
      status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).default("scheduled"),
      location: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(({ ctx, input }) =>
      db.createAppointment({
        userId: ctx.user.id,
        projectId: input.projectId || 0,
        customerId: input.customerId || 0,
        title: input.title,
        description: input.description,
        type: input.type,
        startTime: input.startTime,
        endTime: input.endTime,
        status: input.status,
        location: input.location,
        notes: input.notes,
      })
    ),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional(),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
      location: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateAppointment(id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) =>
      db.deleteAppointment(input.id)
    ),
  }),
  estimates: router({
    list: protectedProcedure.query(({ ctx }) => db.listEstimates()),
    create: protectedProcedure.input(z.object({
      projectId: z.number(),
      customerId: z.number(),
      estimateNumber: z.string(),
      title: z.string(),
      description: z.string().optional(),
      subtotal: z.string(),
      total: z.string(),
      status: z.enum(["draft", "sent", "accepted", "rejected"]).default("draft"),
    })).mutation(({ ctx, input }) => {
      return db.createEstimate({
        projectId: input.projectId,
        customerId: input.customerId,
        userId: ctx.user.id,
        estimateNumber: input.estimateNumber,
        title: input.title,
        description: input.description,
        subtotal: input.subtotal,
        total: input.total,
        status: input.status,
      });
    }),
  }),

  estimateLineItems: router({
    list: protectedProcedure.input(z.object({ estimateId: z.number() })).query(({ input }) =>
      db.getEstimateLineItems(input.estimateId)
    ),
    create: protectedProcedure.input(z.object({
      estimateId: z.number(),
      materialId: z.number().optional(),
      description: z.string().min(1),
      quantity: z.string(),
      unitPrice: z.string(),
      total: z.string(),
    })).mutation(({ input }) =>
      db.createEstimateLineItem({
        estimateId: input.estimateId,
        materialId: input.materialId,
        description: input.description,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        total: input.total,
      })
    ),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) =>
      db.deleteEstimateLineItem(input.id)
    ),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      quantity: z.string().optional(),
      unitPrice: z.string().optional(),
      total: z.string().optional(),
    })).mutation(({ input }) => {
      const { id, ...data } = input;
      return db.updateEstimateLineItem(id, data);
    }),
  }),

  materials: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getMaterialsByUserId(ctx.user.id)
    ),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      category: z.enum(["shingles", "underlayment", "ice_water_shield", "plywood", "flashing", "pipe_flange", "ridge_caps", "gutters", "fascia_soffit", "other"]),
      unit: z.string().default("piece"),
      unitPrice: z.number().min(0),
      description: z.string().optional(),
    })).mutation(({ ctx, input }) =>
      db.createMaterial({
        userId: ctx.user.id,
        name: input.name,
        category: input.category,
        unit: input.unit,
        unitPrice: input.unitPrice.toString(),
        description: input.description,
      })
    ),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      category: z.enum(["shingles", "underlayment", "ice_water_shield", "plywood", "flashing", "pipe_flange", "ridge_caps", "gutters", "fascia_soffit", "other"]).optional(),
      unit: z.string().optional(),
      unitPrice: z.number().min(0).optional(),
      description: z.string().optional(),
    })).mutation(({ ctx, input }) => {
      const { id, unitPrice, ...data } = input;
      const updateData: any = { ...data };
      if (unitPrice !== undefined) {
        updateData.unitPrice = unitPrice.toString();
      }
      return db.updateMaterial(id, updateData);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) =>
      db.deleteMaterial(input.id)
    ),
  }),

  crews: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getCrewsByUserId(ctx.user.id)
    ),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      db.getCrewById(input.id, ctx.user.id)
    ),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      crewLead: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
    })).mutation(({ ctx, input }) =>
      db.createCrew({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        crewLead: input.crewLead,
        phone: input.phone,
        email: input.email,
        status: "active",
      })
    ),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      crewLead: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      status: z.enum(["active", "inactive"]).optional(),
    })).mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateCrew(id, ctx.user.id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) =>
      db.deleteCrew(input.id, ctx.user.id)
    ),
  }),
});

export type AppRouter = typeof appRouter;
