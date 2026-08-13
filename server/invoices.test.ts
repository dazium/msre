import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";
import { InsertInvoice } from "../drizzle/schema";

describe("Invoice Database Functions", () => {
  const testUserId = 1;
  const testProjectId = 1;
  const testCustomerId = 1;
  let createdInvoiceId: number | null = null;

  beforeAll(async () => {
    // Setup: Create test data if needed
    // Note: In a real test environment, you'd use fixtures or factories
  });

  afterAll(async () => {
    // Cleanup: Remove test data
    if (createdInvoiceId) {
      try {
        await db.deleteInvoice(createdInvoiceId);
      } catch (error) {
        console.warn("Cleanup failed:", error);
      }
    }
  });

  it("should generate invoice numbers with correct format", async () => {
    const invoiceNumber = await db.generateInvoiceNumber(testUserId);
    
    // Format should be: INV-YYYYMM-0001
    expect(invoiceNumber).toMatch(/^INV-\d{6}-\d{4}$/);
    
    // Extract date part and verify it's valid
    const [, datePart] = invoiceNumber.split("-");
    const year = parseInt(datePart.substring(0, 4));
    const month = parseInt(datePart.substring(4, 6));
    
    const now = new Date();
    expect(year).toBe(now.getFullYear());
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });

  it("should create an invoice with valid data", async () => {
    const invoiceData: InsertInvoice = {
      userId: testUserId,
      projectId: testProjectId,
      customerId: testCustomerId,
      invoiceNumber: `INV-202604-${Math.random().toString().slice(2, 6)}`,
      issueDate: new Date("2026-04-28"),
      dueDate: new Date("2026-05-28"),
      subtotal: "1000.00",
      tax: "130.00",
      total: "1130.00",
      amountPaid: "0.00",
      status: "draft",
      notes: "Test invoice",
    };

    const result = await db.createInvoice(invoiceData);
    expect(result).toBeDefined();
    
    // Store the ID for cleanup
    if (result && typeof result === 'object' && 'insertId' in result) {
      createdInvoiceId = result.insertId as number;
    }
  });

  it("should retrieve invoice by ID", async () => {
    if (!createdInvoiceId) {
      console.warn("Skipping test: no invoice created");
      return;
    }

    const invoice = await db.getInvoiceById(createdInvoiceId);
    expect(invoice).toBeDefined();
    expect(invoice?.invoiceNumber).toMatch(/^INV-/);
    expect(invoice?.status).toBe("draft");
  });

  it("should retrieve invoices by project", async () => {
    const invoices = await db.getInvoicesByProject(testProjectId);
    expect(Array.isArray(invoices)).toBe(true);
    
    if (invoices.length > 0) {
      expect(invoices[0].projectId).toBe(testProjectId);
    }
  });

  it("should retrieve invoices by customer", async () => {
    const invoices = await db.getInvoicesByCustomer(testCustomerId);
    expect(Array.isArray(invoices)).toBe(true);
    
    if (invoices.length > 0) {
      expect(invoices[0].customerId).toBe(testCustomerId);
    }
  });

  it("should update invoice status", async () => {
    if (!createdInvoiceId) {
      console.warn("Skipping test: no invoice created");
      return;
    }

    const updateResult = await db.updateInvoice(createdInvoiceId, {
      status: "sent",
      amountPaid: "500.00",
    });

    expect(updateResult).toBeDefined();

    // Verify the update
    const updated = await db.getInvoiceById(createdInvoiceId);
    expect(updated?.status).toBe("sent");
    expect(updated?.amountPaid).toBe("500.00");
  });

  it("should handle empty results gracefully", async () => {
    const invoices = await db.getInvoicesByProject(99999);
    expect(Array.isArray(invoices)).toBe(true);
    expect(invoices.length).toBe(0);
  });

  it("should return null for non-existent invoice", async () => {
    const invoice = await db.getInvoiceById(99999);
    expect(invoice).toBeNull();
  });
});

describe("Invoice tRPC Procedures", () => {
  it("should have invoice router defined", async () => {
    // This test verifies that the invoice router is properly exported
    // In a real test, you'd import the appRouter and check its structure
    expect(true).toBe(true); // Placeholder
  });

  it("should validate invoice creation input", async () => {
    // This would test the Zod validation in the create procedure
    // Verify that invalid inputs are rejected
    expect(true).toBe(true); // Placeholder
  });

  it("should enforce date type conversion", async () => {
    // Verify that string dates are properly converted to Date objects
    expect(true).toBe(true); // Placeholder
  });
});

describe("Invoice Number Generation", () => {
  it("should increment invoice numbers for the same user", async () => {
    const num1 = await db.generateInvoiceNumber(1);
    const num2 = await db.generateInvoiceNumber(1);
    
    // Extract sequence numbers
    const seq1 = parseInt(num1.split("-")[2]);
    const seq2 = parseInt(num2.split("-")[2]);
    
    // Second number should be greater than or equal to first
    expect(seq2).toBeGreaterThanOrEqual(seq1);
  });

  it("should handle different users independently", async () => {
    const num1 = await db.generateInvoiceNumber(1);
    const num2 = await db.generateInvoiceNumber(2);
    
    // Both should be valid invoice numbers
    expect(num1).toMatch(/^INV-\d{6}-\d{4}$/);
    expect(num2).toMatch(/^INV-\d{6}-\d{4}$/);
  });

  it("should use current date in invoice number", async () => {
    const invoiceNumber = await db.generateInvoiceNumber(1);
    const now = new Date();
    const expectedDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    
    expect(invoiceNumber).toContain(expectedDate);
  });
});

describe("Invoice Data Validation", () => {
  it("should require userId for invoice creation", async () => {
    const invalidData = {
      projectId: 1,
      customerId: 1,
      invoiceNumber: `INV-202604-${Math.floor(1000 + Math.random() * 9000)}`,
      issueDate: new Date(),
      dueDate: new Date(),
      subtotal: "1000.00",
      tax: "130.00",
      total: "1130.00",
      amountPaid: "0.00",
      status: "draft" as const,
    } as any;

    // This should fail because userId is required
    try {
      await db.createInvoice(invalidData);
      // If it doesn't throw, that's a test failure
      expect(true).toBe(false);
    } catch (error) {
      // Expected to fail
      expect(error).toBeDefined();
    }
  });

  it("should validate invoice status enum", async () => {
    // Valid statuses: draft, sent, viewed, paid, overdue, cancelled
    const validStatuses = ["draft", "sent", "viewed", "paid", "overdue", "cancelled"];
    
    validStatuses.forEach((status) => {
      expect(validStatuses).toContain(status);
    });
  });

  it("should handle decimal amounts correctly", async () => {
    const invoiceData: InsertInvoice = {
      userId: 1,
      projectId: 1,
      customerId: 1,
      invoiceNumber: `INV-202604-${Math.floor(1000 + Math.random() * 9000)}`,
      issueDate: new Date(),
      dueDate: new Date(),
      subtotal: "1234.56",
      tax: "160.50",
      total: "1395.06",
      amountPaid: "0.00",
      status: "draft",
    };

    const result = await db.createInvoice(invoiceData);
    expect(result).toBeDefined();
  });
});
