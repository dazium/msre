import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { accountingProcedure, fieldOperationsProcedure, projectOperationsProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { WORK_ORDER_JOB_TYPES, WORK_ORDER_STATUSES } from "../shared/subcontractor";
import { randomUUID } from "crypto";
import { storagePut } from "./storage";

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

  companies: router({
    list: protectedProcedure.input(z.object({
      accountType: z.enum(["partner", "direct_customer"]).optional(),
      status: z.enum(["active", "inactive", "on_hold"]).optional(),
      search: z.string().max(255).optional(),
    }).optional()).query(({ ctx, input }) => db.listCompanies(ctx.user.id, input ?? {})),
    getById: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) =>
      db.getCompanyById(input.id, ctx.user.id)
    ),
    create: protectedProcedure.input(z.object({
      name: z.string().trim().min(1).max(255),
      legalName: z.string().trim().max(255).optional(),
      accountType: z.enum(["partner", "direct_customer"]).default("partner"),
      classification: z.string().trim().max(120).optional(),
      email: z.string().trim().email().optional(),
      phone: z.string().trim().max(30).optional(),
      website: z.string().trim().url().max(500).optional(),
      address: z.string().trim().max(2000).optional(),
      city: z.string().trim().max(100).optional(),
      province: z.string().trim().max(100).optional(),
      postalCode: z.string().trim().max(20).optional(),
      preferredContactMethod: z.enum(["phone", "email", "text", "in_person"]).default("email"),
      paymentTerms: z.enum(["due_on_receipt", "net_7", "net_15", "net_30", "net_45", "net_60", "custom"]).default("net_30"),
      standardLabourRate: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
      areasServed: z.string().trim().max(2000).optional(),
      typicalWorkRequested: z.string().trim().max(5000).optional(),
      contractInformation: z.string().trim().max(5000).optional(),
      insuranceRequirements: z.string().trim().max(5000).optional(),
      wsibRequirements: z.string().trim().max(5000).optional(),
      safetyRequirements: z.string().trim().max(5000).optional(),
      requiredDocumentation: z.string().trim().max(5000).optional(),
      specialInstructions: z.string().trim().max(5000).optional(),
      notes: z.string().trim().max(10000).optional(),
      status: z.enum(["active", "inactive", "on_hold"]).default("active"),
    })).mutation(({ ctx, input }) => db.createCompany({ ...input, userId: ctx.user.id })),
    update: protectedProcedure.input(z.object({
      id: z.number().int().positive(),
      name: z.string().trim().min(1).max(255).optional(),
      legalName: z.string().trim().max(255).optional(),
      accountType: z.enum(["partner", "direct_customer"]).optional(),
      classification: z.string().trim().max(120).optional(),
      email: z.string().trim().email().optional(),
      phone: z.string().trim().max(30).optional(),
      website: z.string().trim().url().max(500).optional(),
      address: z.string().trim().max(2000).optional(),
      city: z.string().trim().max(100).optional(),
      province: z.string().trim().max(100).optional(),
      postalCode: z.string().trim().max(20).optional(),
      preferredContactMethod: z.enum(["phone", "email", "text", "in_person"]).optional(),
      paymentTerms: z.enum(["due_on_receipt", "net_7", "net_15", "net_30", "net_45", "net_60", "custom"]).optional(),
      standardLabourRate: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
      areasServed: z.string().trim().max(2000).optional(),
      typicalWorkRequested: z.string().trim().max(5000).optional(),
      contractInformation: z.string().trim().max(5000).optional(),
      insuranceRequirements: z.string().trim().max(5000).optional(),
      wsibRequirements: z.string().trim().max(5000).optional(),
      safetyRequirements: z.string().trim().max(5000).optional(),
      requiredDocumentation: z.string().trim().max(5000).optional(),
      specialInstructions: z.string().trim().max(5000).optional(),
      notes: z.string().trim().max(10000).optional(),
      status: z.enum(["active", "inactive", "on_hold"]).optional(),
    })).mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateCompany(id, ctx.user.id, data);
    }),
    contacts: router({
      list: protectedProcedure.input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) =>
        db.listCompanyContacts(input.companyId, ctx.user.id)
      ),
      create: protectedProcedure.input(z.object({
        companyId: z.number().int().positive(),
        firstName: z.string().trim().min(1).max(100),
        lastName: z.string().trim().min(1).max(100),
        role: z.enum(["owner", "project_manager", "site_supervisor", "dispatcher", "estimator", "accounts_payable", "accounts_receivable", "safety_coordinator", "other"]).default("other"),
        position: z.string().trim().max(120).optional(),
        phone: z.string().trim().max(30).optional(),
        mobile: z.string().trim().max(30).optional(),
        email: z.string().trim().email().optional(),
        preferredContactMethod: z.enum(["phone", "email", "text", "in_person"]).default("email"),
        notes: z.string().trim().max(5000).optional(),
        isPrimary: z.boolean().default(false),
        status: z.enum(["active", "inactive"]).default("active"),
      })).mutation(({ ctx, input }) => db.createCompanyContact(input, ctx.user.id)),
      update: protectedProcedure.input(z.object({
        id: z.number().int().positive(),
        firstName: z.string().trim().min(1).max(100).optional(),
        lastName: z.string().trim().min(1).max(100).optional(),
        role: z.enum(["owner", "project_manager", "site_supervisor", "dispatcher", "estimator", "accounts_payable", "accounts_receivable", "safety_coordinator", "other"]).optional(),
        position: z.string().trim().max(120).optional(),
        phone: z.string().trim().max(30).optional(),
        mobile: z.string().trim().max(30).optional(),
        email: z.string().trim().email().optional(),
        preferredContactMethod: z.enum(["phone", "email", "text", "in_person"]).optional(),
        notes: z.string().trim().max(5000).optional(),
        isPrimary: z.boolean().optional(),
        status: z.enum(["active", "inactive"]).optional(),
      })).mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateCompanyContact(id, ctx.user.id, data);
      }),
    }),
    notes: router({
      list: protectedProcedure.input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) =>
        db.listCompanyNotes(input.companyId, ctx.user.id)
      ),
      create: protectedProcedure.input(z.object({
        companyId: z.number().int().positive(),
        noteType: z.enum(["general", "communication", "financial", "operations", "safety", "dispute"]).default("general"),
        content: z.string().trim().min(1).max(10000),
      })).mutation(({ ctx, input }) => db.createCompanyNote({ ...input, userId: ctx.user.id })),
    }),
    jobSites: router({
      list: protectedProcedure.input(z.object({ companyId: z.number().int().positive(), includeInactive: z.boolean().default(false) })).query(({ ctx, input }) =>
        db.listJobSites(input.companyId, ctx.user.id, input.includeInactive)
      ),
      getById: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) =>
        db.getJobSiteById(input.id, ctx.user.id)
      ),
      create: protectedProcedure.input(z.object({
        companyId: z.number().int().positive(),
        name: z.string().trim().max(255).optional(),
        address: z.string().trim().min(1).max(2000),
        city: z.string().trim().max(100).optional(),
        province: z.string().trim().max(100).optional(),
        postalCode: z.string().trim().max(20).optional(),
        propertyType: z.enum(["residential", "commercial", "industrial", "multi_residential", "institutional", "other"]).default("residential"),
        siteContactName: z.string().trim().max(200).optional(),
        siteContactPhone: z.string().trim().max(30).optional(),
        accessInstructions: z.string().trim().max(5000).optional(),
        parkingInformation: z.string().trim().max(5000).optional(),
        roofInformation: z.string().trim().max(5000).optional(),
        safetyHazards: z.string().trim().max(5000).optional(),
        requiredEquipment: z.string().trim().max(5000).optional(),
        notes: z.string().trim().max(10000).optional(),
        isActive: z.boolean().default(true),
      })).mutation(({ ctx, input }) => db.createJobSite(input, ctx.user.id)),
      update: protectedProcedure.input(z.object({
        id: z.number().int().positive(),
        name: z.string().trim().max(255).optional(),
        address: z.string().trim().min(1).max(2000).optional(),
        city: z.string().trim().max(100).optional(),
        province: z.string().trim().max(100).optional(),
        postalCode: z.string().trim().max(20).optional(),
        propertyType: z.enum(["residential", "commercial", "industrial", "multi_residential", "institutional", "other"]).optional(),
        siteContactName: z.string().trim().max(200).optional(),
        siteContactPhone: z.string().trim().max(30).optional(),
        accessInstructions: z.string().trim().max(5000).optional(),
        parkingInformation: z.string().trim().max(5000).optional(),
        roofInformation: z.string().trim().max(5000).optional(),
        safetyHazards: z.string().trim().max(5000).optional(),
        requiredEquipment: z.string().trim().max(5000).optional(),
        notes: z.string().trim().max(10000).optional(),
        isActive: z.boolean().optional(),
      })).mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateJobSite(id, ctx.user.id, data);
      }),
    }),
    history: protectedProcedure.input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) =>
      db.getAccountHistory(input.companyId, ctx.user.id)
    ),
    financials: accountingProcedure.input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) =>
      db.getCompanyFinancials(input.companyId, ctx.user.id)
    ),
  }),

  workOrders: router({
    list: protectedProcedure.input(z.object({
      companyId: z.number().int().positive().optional(),
      jobSiteId: z.number().int().positive().optional(),
      status: z.enum(WORK_ORDER_STATUSES).optional(),
      search: z.string().max(255).optional(),
      deadlineFrom: z.date().optional(),
      deadlineTo: z.date().optional(),
    }).optional()).query(({ ctx, input }) => db.listWorkOrders(ctx.user.id, input ?? {})),
    getById: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) =>
      db.getWorkOrderDetail(input.id, ctx.user.id)
    ),
    generateNumber: protectedProcedure.query(({ ctx }) => db.generateWorkOrderNumber(ctx.user.id)),
    create: projectOperationsProcedure.input(z.object({
      companyId: z.number().int().positive(),
      jobSiteId: z.number().int().positive(),
      contactId: z.number().int().positive().optional(),
      projectId: z.number().int().positive().optional(),
      workOrderNumber: z.string().trim().min(1).max(64).optional(),
      purchaseOrderNumber: z.string().trim().max(100).optional(),
      receivedAt: z.date().optional(),
      requestedStartDate: z.date().optional(),
      deadline: z.date().optional(),
      scheduledStartDate: z.date().optional(),
      scheduledEndDate: z.date().optional(),
      jobType: z.enum(WORK_ORDER_JOB_TYPES),
      scopeSummary: z.string().trim().min(1).max(20000),
      materialsSummary: z.string().trim().max(10000).optional(),
      labourRequirements: z.string().trim().max(10000).optional(),
      crewRequirements: z.string().trim().max(10000).optional(),
      specialInstructions: z.string().trim().max(10000).optional(),
      estimatedValue: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
      agreedPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
      additionalCharges: z.string().regex(/^\d+(\.\d{1,2})?$/).default("0.00"),
      taxRate: z.string().regex(/^\d+(\.\d{1,2})?$/).default("13.00"),
      scopes: z.array(z.object({
        category: z.enum(WORK_ORDER_JOB_TYPES),
        description: z.string().trim().min(1).max(10000),
        quantity: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        unit: z.string().trim().max(40).optional(),
      })).default([]),
    })).mutation(async ({ ctx, input }) => {
      const { scopes, workOrderNumber, ...workOrderData } = input;
      const number = workOrderNumber || await db.generateWorkOrderNumber(ctx.user.id);
      return db.createWorkOrder({
        ...workOrderData,
        userId: ctx.user.id,
        createdByUserId: ctx.user.id,
        workOrderNumber: number,
      }, scopes);
    }),
    update: projectOperationsProcedure.input(z.object({
      id: z.number().int().positive(),
      companyId: z.number().int().positive().optional(),
      jobSiteId: z.number().int().positive().optional(),
      contactId: z.number().int().positive().nullable().optional(),
      projectId: z.number().int().positive().nullable().optional(),
      purchaseOrderNumber: z.string().trim().max(100).nullable().optional(),
      requestedStartDate: z.date().nullable().optional(),
      deadline: z.date().nullable().optional(),
      scheduledStartDate: z.date().nullable().optional(),
      scheduledEndDate: z.date().nullable().optional(),
      jobType: z.enum(WORK_ORDER_JOB_TYPES).optional(),
      scopeSummary: z.string().trim().min(1).max(20000).optional(),
      materialsSummary: z.string().trim().max(10000).nullable().optional(),
      labourRequirements: z.string().trim().max(10000).nullable().optional(),
      crewRequirements: z.string().trim().max(10000).nullable().optional(),
      specialInstructions: z.string().trim().max(10000).nullable().optional(),
      estimatedValue: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
      agreedPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
      additionalCharges: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
      taxRate: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
      statusReason: z.string().trim().max(10000).nullable().optional(),
    })).mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateWorkOrder(id, ctx.user.id, data);
    }),
    replaceScopes: projectOperationsProcedure.input(z.object({
      workOrderId: z.number().int().positive(),
      scopes: z.array(z.object({
        category: z.enum(WORK_ORDER_JOB_TYPES),
        description: z.string().trim().min(1).max(10000),
        quantity: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        unit: z.string().trim().max(40).optional(),
      })).max(100),
    })).mutation(({ ctx, input }) => db.replaceWorkOrderScopes(input.workOrderId, ctx.user.id, input.scopes)),
    transitionStatus: projectOperationsProcedure.input(z.object({
      id: z.number().int().positive(),
      status: z.enum(WORK_ORDER_STATUSES),
      reason: z.string().trim().min(1).max(10000).optional(),
    })).mutation(({ ctx, input }) => db.transitionWorkOrderStatus(input.id, ctx.user.id, input.status, input.reason)),
    assignments: router({
      list: protectedProcedure.input(z.object({ workOrderId: z.number().int().positive() })).query(({ ctx, input }) =>
        db.listWorkOrderAssignments(input.workOrderId, ctx.user.id)
      ),
      create: projectOperationsProcedure.input(z.object({
        workOrderId: z.number().int().positive(),
        crewId: z.number().int().positive(),
        scheduledStart: z.date(),
        scheduledEnd: z.date(),
        notes: z.string().trim().max(10000).optional(),
      })).mutation(({ ctx, input }) => db.createWorkOrderAssignment(input, ctx.user.id)),
      update: fieldOperationsProcedure.input(z.object({
        id: z.number().int().positive(),
        scheduledStart: z.date().optional(),
        scheduledEnd: z.date().optional(),
        status: z.enum(["assigned", "accepted", "in_progress", "completed", "cancelled"]).optional(),
        actualStart: z.date().nullable().optional(),
        actualCompletion: z.date().nullable().optional(),
        labourHours: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
        productionQuantity: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
        productionUnit: z.string().trim().max(40).nullable().optional(),
        notes: z.string().trim().max(10000).nullable().optional(),
      })).mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateWorkOrderAssignment(id, ctx.user.id, data);
      }),
    }),
    completion: router({
      record: fieldOperationsProcedure.input(z.object({
        workOrderId: z.number().int().positive(),
        completionDate: z.date(),
        completedScope: z.string().trim().min(1).max(20000),
        quantityCompleted: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        quantityUnit: z.string().trim().max(40).optional(),
        labourHours: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        productionQuantity: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        productionUnit: z.string().trim().max(40).optional(),
        materialsUsed: z.string().trim().max(10000).optional(),
        deficiencies: z.string().trim().max(10000).optional(),
        signOffName: z.string().trim().max(200).optional(),
        crewNotes: z.string().trim().max(10000).optional(),
        officeNotes: z.string().trim().max(10000).optional(),
        callbackRequired: z.boolean().default(false),
        callbackDetails: z.string().trim().max(10000).optional(),
      }).superRefine((value, issueContext) => {
        if (value.callbackRequired && !value.callbackDetails) {
          issueContext.addIssue({ code: z.ZodIssueCode.custom, path: ["callbackDetails"], message: "Callback details are required when a callback is requested" });
        }
      })).mutation(({ ctx, input }) => {
        const { workOrderId, ...completion } = input;
        return db.recordWorkOrderCompletion(workOrderId, ctx.user.id, completion);
      }),
    }),
    billing: router({
      draft: protectedProcedure.input(z.object({ workOrderId: z.number().int().positive() })).query(({ ctx, input }) =>
        db.getWorkOrderInvoiceDraft(input.workOrderId, ctx.user.id)
      ),
      createInvoice: accountingProcedure.input(z.object({
        workOrderId: z.number().int().positive(),
        dueDate: z.date(),
        notes: z.string().trim().max(10000).optional(),
        lineItems: z.array(z.object({
          workOrderScopeId: z.number().int().positive().optional(),
          description: z.string().trim().min(1).max(10000),
          quantity: z.string().regex(/^\d+(\.\d{1,2})?$/),
          unit: z.string().trim().max(40).optional(),
          unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
        })).min(1).max(100),
      })).mutation(({ ctx, input }) =>
        db.createInvoiceFromWorkOrder(input.workOrderId, ctx.user.id, input.dueDate, input.lineItems, input.notes)
      ),
      invoiceLineItems: protectedProcedure.input(z.object({ invoiceId: z.number().int().positive() })).query(({ ctx, input }) =>
        db.getInvoiceLineItems(input.invoiceId, ctx.user.id)
      ),
      recordPayment: accountingProcedure.input(z.object({
        invoiceId: z.number().int().positive(),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
        paymentDate: z.date(),
        paymentMethod: z.enum(["cheque", "bank_transfer", "cash", "credit_card", "debit_card", "e_transfer", "other"]),
        referenceNumber: z.string().trim().max(100).optional(),
        description: z.string().trim().max(10000).optional(),
      })).mutation(({ ctx, input }) => db.recordInvoicePayment(input.invoiceId, ctx.user.id, input)),
    }),
    documents: router({
      list: protectedProcedure.input(z.object({ workOrderId: z.number().int().positive() })).query(({ ctx, input }) =>
        db.listWorkOrderDocuments(input.workOrderId, ctx.user.id)
      ),
      upload: fieldOperationsProcedure.input(z.object({
        workOrderId: z.number().int().positive(),
        documentType: z.enum(["contract", "purchase_order", "drawing", "blueprint", "specification", "safety_document", "insurance_certificate", "wsib_wcb_certificate", "invoice", "receipt", "completion_document", "email_pdf", "photo", "other"]),
        fileName: z.string().trim().min(1).max(255),
        mimeType: z.string().trim().min(3).max(150),
        dataBase64: z.string().min(4).max(11_200_000),
        revisionNumber: z.string().trim().max(64).optional(),
        revisionNotes: z.string().trim().max(10000).optional(),
        notes: z.string().trim().max(10000).optional(),
      })).mutation(async ({ ctx, input }) => {
        const workOrder = await db.getWorkOrderById(input.workOrderId, ctx.user.id);
        if (!workOrder) throw new Error("Work order not found");
        const content = Buffer.from(input.dataBase64, "base64");
        if (content.length === 0 || content.length > 8 * 1024 * 1024) throw new Error("Document must be between 1 byte and 8 MB");
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const fileKey = `work-orders/${input.workOrderId}/documents/${randomUUID()}-${safeName}`;
        const stored = await storagePut(fileKey, content, input.mimeType);
        return db.createWorkOrderDocument({
          userId: ctx.user.id,
          companyId: workOrder.companyId,
          jobSiteId: workOrder.jobSiteId,
          workOrderId: workOrder.id,
          documentType: input.documentType,
          fileName: input.fileName,
          fileKey: stored.key,
          fileUrl: stored.url,
          mimeType: input.mimeType,
          revisionNumber: input.revisionNumber,
          revisionNotes: input.revisionNotes,
          notes: input.notes,
          uploadedByUserId: ctx.user.id,
        }, ctx.user.id);
      }),
    }),
  }),

  subcontractorDashboard: router({
    get: projectOperationsProcedure.input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }).refine((value) => value.endDate >= value.startDate, { message: "End date must be on or after start date" })).query(({ ctx, input }) =>
      db.getSubcontractorDashboard(ctx.user.id, input.startDate, input.endDate)
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
      roofType: z.enum(["asphalt_shingle", "metal", "flat", "tile", "cedar"]).optional(),
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
        roofType: input.roofType,
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
      roofType: z.enum(["asphalt_shingle", "metal", "flat", "tile", "cedar"]).optional(),
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

  inspections: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getInspectionsByUserId(ctx.user.id)
    ),
    listByProject: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ ctx, input }) => {
      const project = await db.getProjectById(input.projectId, ctx.user.id);
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      const rows = await db.getInspectionsByUserId(ctx.user.id);
      return rows.filter((inspection) => inspection.projectId === input.projectId);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const inspection = await db.getInspectionById(input.id, ctx.user.id);
      if (!inspection) throw new TRPCError({ code: "NOT_FOUND", message: "Inspection not found" });
      const items = await db.getInspectionItems(inspection.id);
      return { inspection, items };
    }),
    create: protectedProcedure.input(z.object({
      projectId: z.number(),
      customerId: z.number(),
      roofType: z.enum(["asphalt_shingle", "metal", "flat", "tile", "cedar"]).optional(),
      inspectorName: z.string().max(150).optional(),
      notes: z.string().optional(),
      items: z.array(z.object({
        category: z.string().min(1).max(100),
        label: z.string().min(1).max(255),
      })).default([]),
    })).mutation(async ({ ctx, input }) => {
      const [project, customer] = await Promise.all([
        db.getProjectById(input.projectId, ctx.user.id),
        db.getCustomerById(input.customerId, ctx.user.id),
      ]);
      if (!project || !customer) throw new TRPCError({ code: "NOT_FOUND", message: "Project or customer not found" });
      if (project.customerId !== input.customerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Customer does not match the selected project" });
      }
      const inspection = await db.createInspection({
        userId: ctx.user.id,
        projectId: input.projectId,
        customerId: input.customerId,
        roofType: input.roofType ?? project.roofType ?? "asphalt_shingle",
        inspectorName: input.inspectorName,
        notes: input.notes,
        status: "draft",
      });
      if (!inspection) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create inspection" });
      const createdItems = [];
      for (const item of input.items) {
        const id = await db.createInspectionItem({ inspectionId: inspection.id, category: item.category, label: item.label, status: "pending" });
        createdItems.push({ id, ...item, inspectionId: inspection.id, status: "pending" as const });
      }
      return { inspection, items: createdItems };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["draft", "in_progress", "completed"]).optional(),
      inspectorName: z.string().max(150).optional(),
      inspectedAt: z.date().nullable().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const inspection = await db.getInspectionById(id, ctx.user.id);
      if (!inspection) throw new TRPCError({ code: "NOT_FOUND", message: "Inspection not found" });
      const nextData = data.status === "completed" && data.inspectedAt === undefined
        ? { ...data, inspectedAt: new Date() }
        : data;
      await db.updateInspection(id, ctx.user.id, nextData);
      return db.getInspectionById(id, ctx.user.id);
    }),
    createItem: protectedProcedure.input(z.object({
      inspectionId: z.number(),
      category: z.string().trim().min(1).max(100),
      label: z.string().trim().min(1).max(255),
      status: z.enum(["pending", "pass", "attention", "fail", "not_applicable"]).default("pending"),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const inspection = await db.getInspectionById(input.inspectionId, ctx.user.id);
      if (!inspection) throw new TRPCError({ code: "NOT_FOUND", message: "Inspection not found" });
      const { inspectionId, ...data } = input;
      const id = await db.createInspectionItem({ inspectionId, ...data });
      return { id, inspectionId, ...data };
    }),
    updateItem: protectedProcedure.input(z.object({
      id: z.number(),
      inspectionId: z.number(),
      category: z.string().trim().min(1).max(100).optional(),
      label: z.string().trim().min(1).max(255).optional(),
      status: z.enum(["pending", "pass", "attention", "fail", "not_applicable"]).optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const inspection = await db.getInspectionById(input.inspectionId, ctx.user.id);
      if (!inspection) throw new TRPCError({ code: "NOT_FOUND", message: "Inspection not found" });
      const { id, inspectionId, ...data } = input;
      await db.updateInspectionItem(id, inspectionId, data);
      return { id, inspectionId, ...data };
    }),
    deleteItem: protectedProcedure.input(z.object({ id: z.number(), inspectionId: z.number() })).mutation(async ({ ctx, input }) => {
      const inspection = await db.getInspectionById(input.inspectionId, ctx.user.id);
      if (!inspection) throw new TRPCError({ code: "NOT_FOUND", message: "Inspection not found" });
      await db.deleteInspectionItem(input.id, input.inspectionId);
      return { success: true };
    }),
  }),

  photos: router({
    uploadFile: protectedProcedure.input(z.object({
      projectId: z.number(),
      fileName: z.string().min(1),
      fileKey: z.string().min(1),
      mimeType: z.string().optional(),
      fileData: z.string().min(1), // base64 string
    })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.fileData, "base64");
      const { key, url } = await storagePut(input.fileKey, buffer, input.mimeType || "image/jpeg");
      const photo = await db.createPhoto({
        userId: ctx.user.id,
        projectId: input.projectId,
        fileName: input.fileName,
        fileUrl: url,
        fileKey: key,
        mimeType: input.mimeType || "image/jpeg",
      });
      return { url, key, photo };
    }),
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
      estimateNumber: z.string().trim().optional(),
      title: z.string(),
      description: z.string().optional(),
      subtotal: z.string(),
      total: z.string(),
      status: z.enum(["draft", "sent", "accepted", "rejected"]).default("draft"),
    })).mutation(async ({ ctx, input }) => {
      let estimateNumber = input.estimateNumber?.trim() || await db.generateEstimateNumber();

      if (await db.estimateNumberExists(estimateNumber)) {
        if (input.estimateNumber) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Estimate number ${estimateNumber} already exists.`,
          });
        }

        estimateNumber = `EST-${Date.now()}`;
        if (await db.estimateNumberExists(estimateNumber)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Unable to generate a unique estimate number. Please try again.",
          });
        }
      }

      return db.createEstimate({
        projectId: input.projectId,
        customerId: input.customerId,
        userId: ctx.user.id,
        estimateNumber,
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
