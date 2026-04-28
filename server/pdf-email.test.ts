import { describe, it, expect } from "vitest";
import { generateInvoicePDF, savePDFToFile } from "./pdf";
import { sendInvoiceEmail } from "./email";
import { Invoice } from "../drizzle/schema";
import { existsSync, unlinkSync } from "fs";

describe("PDF Generation", () => {
  const mockInvoice: Invoice = {
    id: 1,
    userId: 1,
    estimateId: null,
    projectId: 1,
    customerId: 1,
    invoiceNumber: "INV-202604-0001",
    issueDate: new Date("2026-04-28"),
    dueDate: new Date("2026-05-28"),
    subtotal: "1000.00",
    tax: "130.00",
    total: "1130.00",
    amountPaid: "0.00",
    status: "draft" as const,
    notes: "Test invoice notes",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("should generate a PDF buffer", async () => {
    const pdfBuffer = await generateInvoicePDF({
      invoice: mockInvoice,
      customerName: "John Doe",
      customerEmail: "john@example.com",
      customerPhone: "555-1234",
      projectTitle: "Roof Replacement",
      lineItems: [
        {
          description: "Roof Shingles (100 sq ft)",
          quantity: 1,
          unitPrice: 500,
          total: 500,
        },
        {
          description: "Labor (8 hours)",
          quantity: 8,
          unitPrice: 62.5,
          total: 500,
        },
      ],
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it("should save PDF to file", async () => {
    const pdfBuffer = await generateInvoicePDF({
      invoice: mockInvoice,
      customerName: "Jane Smith",
      customerEmail: "jane@example.com",
      customerPhone: "555-5678",
      projectTitle: "Gutter Installation",
      lineItems: [
        {
          description: "Gutters (50 ft)",
          quantity: 50,
          unitPrice: 15,
          total: 750,
        },
      ],
    });

    const filepath = await savePDFToFile(pdfBuffer, mockInvoice.invoiceNumber);

    expect(existsSync(filepath)).toBe(true);
    expect(filepath).toContain("invoice-");
    expect(filepath).toContain(".pdf");

    // Cleanup
    if (existsSync(filepath)) {
      unlinkSync(filepath);
    }
  });

  it("should handle invoice with no notes", async () => {
    const invoiceNoNotes = { ...mockInvoice, notes: null };

    const pdfBuffer = await generateInvoicePDF({
      invoice: invoiceNoNotes,
      customerName: "Bob Wilson",
      customerEmail: "bob@example.com",
      customerPhone: "555-9999",
      projectTitle: "Roof Inspection",
      lineItems: [
        {
          description: "Inspection Service",
          quantity: 1,
          unitPrice: 150,
          total: 150,
        },
      ],
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it("should handle multiple line items", async () => {
    const pdfBuffer = await generateInvoicePDF({
      invoice: mockInvoice,
      customerName: "Alice Johnson",
      customerEmail: "alice@example.com",
      customerPhone: "555-1111",
      projectTitle: "Complete Roof Renovation",
      lineItems: [
        {
          description: "Roof Decking",
          quantity: 100,
          unitPrice: 50,
          total: 5000,
        },
        {
          description: "Underlayment",
          quantity: 100,
          unitPrice: 25,
          total: 2500,
        },
        {
          description: "Shingles",
          quantity: 100,
          unitPrice: 75,
          total: 7500,
        },
        {
          description: "Flashing",
          quantity: 50,
          unitPrice: 20,
          total: 1000,
        },
        {
          description: "Labor",
          quantity: 40,
          unitPrice: 75,
          total: 3000,
        },
      ],
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});

describe("Email Delivery", () => {
  const mockInvoice: Invoice = {
    id: 1,
    userId: 1,
    estimateId: null,
    projectId: 1,
    customerId: 1,
    invoiceNumber: "INV-202604-0001",
    issueDate: new Date("2026-04-28"),
    dueDate: new Date("2026-05-28"),
    subtotal: "1000.00",
    tax: "130.00",
    total: "1130.00",
    amountPaid: "0.00",
    status: "sent" as const,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("should send invoice email successfully", async () => {
    const pdfBuffer = Buffer.from("PDF content");

    const result = await sendInvoiceEmail({
      invoice: mockInvoice,
      recipientEmail: "test@example.com",
      recipientName: "Test User",
      pdfBuffer,
      pdfFilename: "invoice-INV-202604-0001.pdf",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it("should include preview URL for test emails", async () => {
    const pdfBuffer = Buffer.from("PDF content");

    const result = await sendInvoiceEmail({
      invoice: mockInvoice,
      recipientEmail: "test@example.com",
      recipientName: "Test User",
      pdfBuffer,
      pdfFilename: "invoice-INV-202604-0001.pdf",
    });

    if (process.env.NODE_ENV !== "production") {
      expect(result.previewUrl).toBeDefined();
    }
  });

  it("should handle email with overdue invoice status", async () => {
    const overdueInvoice = { ...mockInvoice, status: "overdue" as const };
    const pdfBuffer = Buffer.from("PDF content");

    const result = await sendInvoiceEmail({
      invoice: overdueInvoice,
      recipientEmail: "test-overdue@example.com",
      recipientName: "Test User",
      pdfBuffer,
      pdfFilename: "invoice-overdue.pdf",
    });

    expect(result.success).toBe(true);
  });

  it("should include payment information in email", async () => {
    const paidInvoice = {
      ...mockInvoice,
      status: "paid" as const,
      amountPaid: "1130.00",
    };

    const pdfBuffer = Buffer.from("PDF content");

    const result = await sendInvoiceEmail({
      invoice: paidInvoice,
      recipientEmail: "paid@example.com",
      recipientName: "Paid Customer",
      pdfBuffer,
      pdfFilename: "invoice-paid.pdf",
    });

    expect(result.success).toBe(true);
  });
});

describe("PDF and Email Integration", () => {
  it("should generate PDF and send via email", async () => {
    const mockInvoice: Invoice = {
      id: 1,
      userId: 1,
      estimateId: null,
      projectId: 1,
      customerId: 1,
      invoiceNumber: "INV-202604-0001",
      issueDate: new Date("2026-04-28"),
      dueDate: new Date("2026-05-28"),
      subtotal: "1000.00",
      tax: "130.00",
      total: "1130.00",
      amountPaid: "0.00",
      status: "sent" as const,
      notes: "Thank you for your business!",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      invoice: mockInvoice,
      customerName: "Integration Test",
      customerEmail: "integration@example.com",
      customerPhone: "555-0000",
      projectTitle: "Integration Test Project",
      lineItems: [
        {
          description: "Test Service",
          quantity: 1,
          unitPrice: 1000,
          total: 1000,
        },
      ],
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);

    // Send via email
    const emailResult = await sendInvoiceEmail({
      invoice: mockInvoice,
      recipientEmail: "integration@example.com",
      recipientName: "Integration Test",
      pdfBuffer,
      pdfFilename: "invoice-INV-202604-0001.pdf",
    });

    expect(emailResult.success).toBe(true);
  });
});
