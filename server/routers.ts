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
      companyName: z.string().optional(),
      preferredContactMethod: z.enum(["phone", "email", "text", "in_person"]).optional(),
      roofType: z.string().optional(),
    })).mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateCustomer(id, ctx.user.id, data);
    }),
    getLifetimeValue: protectedProcedure.input(z.object({ customerId: z.number() })).query(({ input }) =>
      db.getCustomerLifetimeValue(input.customerId)
    ),
    getProjectSummary: protectedProcedure.input(z.object({ customerId: z.number() })).query(({ input }) =>
      db.getCustomerProjectSummary(input.customerId)
    ),
  }),

  customerNotes: router({
    list: protectedProcedure.input(z.object({ customerId: z.number() })).query(({ ctx, input }) =>
      db.getCustomerNotes(input.customerId, ctx.user.id)
    ),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      db.getCustomerNoteById(input.id, ctx.user.id)
    ),
    create: protectedProcedure.input(z.object({
      customerId: z.number(),
      noteType: z.enum(["call", "email", "meeting", "follow_up", "general", "quote_sent", "contract_signed"]),
      title: z.string().min(1),
      content: z.string().min(1),
    })).mutation(({ ctx, input }) =>
      db.createCustomerNote({
        userId: ctx.user.id,
        customerId: input.customerId,
        noteType: input.noteType,
        title: input.title,
        content: input.content,
        createdBy: ctx.user.id,
      })
    ),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      content: z.string().optional(),
      noteType: z.enum(["call", "email", "meeting", "follow_up", "general", "quote_sent", "contract_signed"]).optional(),
    })).mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateCustomerNote(id, ctx.user.id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) =>
      db.deleteCustomerNote(input.id, ctx.user.id)
    ),
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
      crewId: z.number().optional(),
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
        crewId: input.crewId,
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
    assignCrew: protectedProcedure.input(z.object({
      projectId: z.number(),
      crewId: z.number(),
    })).mutation(({ ctx, input }) =>
      db.assignCrewToProject(input.projectId, input.crewId, ctx.user.id)
    ),
    removeCrew: protectedProcedure.input(z.object({
      projectId: z.number(),
    })).mutation(({ ctx, input }) =>
      db.removeCrewFromProject(input.projectId, ctx.user.id)
    ),
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
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      db.getEstimateById(input.id, ctx.user.id)
    ),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      subtotal: z.string().optional(),
      total: z.string().optional(),
    })).mutation(({ input }) => {
      const { id, ...data } = input;
      return db.updateEstimate(id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) =>
      db.deleteEstimate(input.id)
    ),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["draft", "sent", "accepted", "rejected"]),
    })).mutation(({ input }) =>
      db.updateEstimateStatus(input.id, input.status)
    ),
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
      description: z.string().optional(),
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
    productivity: protectedProcedure.query(({ ctx }) =>
      db.getCrewProductivity(ctx.user.id)
    ),
    getMembers: protectedProcedure.input(z.object({ crewId: z.number() })).query(({ input }) =>
      db.getCrewMembers(input.crewId)
    ),
    addMember: protectedProcedure.input(z.object({
      crewId: z.number(),
      name: z.string(),
      role: z.string(),
      phone: z.string().optional(),
      email: z.string().optional(),
    })).mutation(({ input }) =>
      db.addCrewMember({
        crewId: input.crewId,
        name: input.name,
        role: input.role,
        phone: input.phone,
        email: input.email,
      })
    ),
    updateMember: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      role: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
    })).mutation(({ input }) =>
      db.updateCrewMember(input.id, {
        name: input.name,
        role: input.role,
        phone: input.phone,
        email: input.email,
      })
    ),
    deleteMember: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteCrewMember(input.id);
      return { success: true };
    }),
    getSkills: protectedProcedure.input(z.object({ crewMemberId: z.number() })).query(({ input }) =>
      db.getCrewMemberSkills(input.crewMemberId)
    ),
    addSkill: protectedProcedure.input(z.object({
      crewMemberId: z.number(),
      skillName: z.string(),
      certificationNumber: z.string().optional(),
      expirationDate: z.date().optional(),
      isActive: z.boolean().default(true),
    })).mutation(({ input }) =>
      db.addCrewMemberSkill({
        crewMemberId: input.crewMemberId,
        skillName: input.skillName,
        certificationNumber: input.certificationNumber,
        expirationDate: input.expirationDate,
        isActive: input.isActive,
      })
    ),
    deleteSkill: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteCrewMemberSkill(input.id);
      return { success: true };
    }),
    setCrewLead: protectedProcedure.input(z.object({
      crewId: z.number(),
      crewLeadId: z.number().nullable(),
    })).mutation(({ ctx, input }) =>
      db.updateCrew(input.crewId, ctx.user.id, { crewLeadId: input.crewLeadId })
    ),
    getProjects: protectedProcedure.input(z.object({ crewId: z.number() })).query(({ ctx, input }) =>
      db.getProjectsByCrew(input.crewId, ctx.user.id)
    ),
    getCrewWithMembers: protectedProcedure.input(z.object({ crewId: z.number() })).query(async ({ ctx, input }) => {
      const crew = await db.getCrewById(input.crewId, ctx.user.id);
      if (!crew) return null;
      const members = await db.getCrewMembers(input.crewId);
      return { ...crew, members };
    }),
  }),

  invoices: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getInvoicesByUserId(ctx.user.id)
    ),
    listByProject: protectedProcedure.input(z.object({ projectId: z.number() })).query(({ input }) =>
      db.getInvoicesByProject(input.projectId)
    ),
    listByCustomer: protectedProcedure.input(z.object({ customerId: z.number() })).query(({ input }) =>
      db.getInvoicesByCustomer(input.customerId)
    ),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) =>
      db.getInvoiceById(input.id)
    ),
    generateNumber: protectedProcedure.query(({ ctx }) =>
      db.generateInvoiceNumber(ctx.user.id)
    ),
    create: protectedProcedure.input(z.object({
      estimateId: z.number().optional(),
      projectId: z.number(),
      customerId: z.number(),
      issueDate: z.string(),
      dueDate: z.string(),
      subtotal: z.string(),
      tax: z.string().optional(),
      total: z.string(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const invoiceNumber = await db.generateInvoiceNumber(ctx.user.id);
      return db.createInvoice({
        userId: ctx.user.id,
        estimateId: input.estimateId,
        projectId: input.projectId,
        customerId: input.customerId,
        invoiceNumber,
        issueDate: new Date(input.issueDate),
        dueDate: new Date(input.dueDate),
        subtotal: input.subtotal,
        tax: input.tax || "0",
        total: input.total,
        notes: input.notes,
      });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      estimateId: z.number().optional(),
      issueDate: z.string().optional(),
      dueDate: z.string().optional(),
      subtotal: z.string().optional(),
      tax: z.string().optional(),
      total: z.string().optional(),
      amountPaid: z.string().optional(),
      status: z.enum(["draft", "sent", "viewed", "paid", "overdue", "cancelled"]).optional(),
      notes: z.string().optional(),
    })).mutation(({ input }) => {
      const { id, issueDate, dueDate, ...data } = input;
      const updateData: any = data;
      if (issueDate) updateData.issueDate = new Date(issueDate);
      if (dueDate) updateData.dueDate = new Date(dueDate);
      return db.updateInvoice(id, updateData);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) =>
      db.deleteInvoice(input.id)
    ),
    exportPDF: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return { success: true, invoiceId: input.id };
    }),
    sendEmail: protectedProcedure.input(z.object({
      id: z.number(),
      recipientEmail: z.string().email(),
    })).mutation(async ({ input }) => {
      return { success: true, invoiceId: input.id, recipientEmail: input.recipientEmail };
    }),
  }),
  invoiceTemplates: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getInvoiceTemplates(ctx.user.id)
    ),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) =>
      db.getInvoiceTemplateById(input.id)
    ),
    getDefault: protectedProcedure.query(({ ctx }) =>
      db.getDefaultInvoiceTemplate(ctx.user.id)
    ),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      isDefault: z.boolean().default(false),
      companyName: z.string().min(1),
      companyLogo: z.string().optional(),
      companyPhone: z.string().optional(),
      companyEmail: z.string().email().optional(),
      companyAddress: z.string().optional(),
      primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).default("#1a3a52"),
      secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).default("#ffffff"),
      accentColor: z.string().regex(/^#[0-9A-F]{6}$/i).default("#4a90e2"),
      footerText: z.string().optional(),
      paymentTerms: z.string().optional(),
      includeCompanyLogo: z.boolean().default(true),
      includeCompanyInfo: z.boolean().default(true),
      includePaymentTerms: z.boolean().default(true),
    })).mutation(({ ctx, input }) =>
      db.createInvoiceTemplate({ ...input, userId: ctx.user.id })
    ),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      isDefault: z.boolean().optional(),
      companyName: z.string().min(1).optional(),
      companyLogo: z.string().optional(),
      companyPhone: z.string().optional(),
      companyEmail: z.string().email().optional(),
      companyAddress: z.string().optional(),
      primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      accentColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      footerText: z.string().optional(),
      paymentTerms: z.string().optional(),
      includeCompanyLogo: z.boolean().optional(),
      includeCompanyInfo: z.boolean().optional(),
      includePaymentTerms: z.boolean().optional(),
    })).mutation(({ input }) => {
      const { id, ...data } = input;
      return db.updateInvoiceTemplate(id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) =>
      db.deleteInvoiceTemplate(input.id)
    ),
  }),
  payments: router({
    getByInvoice: protectedProcedure.input(z.object({ invoiceId: z.number() })).query(({ input }) =>
      db.getPaymentsByInvoice(input.invoiceId)
    ),
    getByUser: protectedProcedure.query(({ ctx }) =>
      db.getPaymentsByUser(ctx.user.id)
    ),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) =>
      db.getPaymentById(input.id)
    ),
    getInvoiceTotal: protectedProcedure.input(z.object({ invoiceId: z.number() })).query(({ input }) =>
      db.getInvoicePaymentTotal(input.invoiceId)
    ),
    createCheckoutSession: protectedProcedure.input(z.object({
      invoiceId: z.number(),
      invoiceNumber: z.string(),
      amount: z.number().positive(),
      currency: z.string().default("USD"),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    })).mutation(async ({ ctx, input }) => {
      const { createCheckoutSession } = await import("./stripe");
      const session = await createCheckoutSession({
        invoiceId: input.invoiceId,
        invoiceNumber: input.invoiceNumber,
        amount: input.amount,
        currency: input.currency,
        customerEmail: ctx.user.email || "",
        customerName: ctx.user.name || "Customer",
        userId: ctx.user.id,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
      });
      return { sessionId: session.id, url: session.url };
    }),
  }),
  financialReporting: router({
    getTotalRevenue: protectedProcedure.query(({ ctx }) =>
      db.getTotalRevenue(ctx.user.id)
    ),
    getRevenueByMonth: protectedProcedure.input(z.object({ year: z.number() })).query(({ ctx, input }) =>
      db.getRevenueByMonth(ctx.user.id, input.year)
    ),
    getInvoiceStats: protectedProcedure.query(({ ctx }) =>
      db.getInvoiceStats(ctx.user.id)
    ),
    getProjectStats: protectedProcedure.query(({ ctx }) =>
      db.getProjectStats(ctx.user.id)
    ),
  }),
});

export type AppRouter = typeof appRouter;
