import { describe, expect, it } from "vitest";
import {
  normalizeEstimatePdfData,
  normalizeInvoicePdfData,
  normalizePdfLineItems,
} from "./pdf-export";

describe("PDF export data normalization", () => {
  it("normalizes database decimal strings and line-item fields for estimates", () => {
    const estimate = normalizeEstimatePdfData({
      estimateNumber: "EST-0042",
      title: "Roof replacement",
      subtotal: "1250.50",
      total: "1413.07",
      createdAt: "2026-08-16",
      lineItems: [{ description: "Shingles", quantity: "10", unitPrice: "100.05", total: "1000.50" }],
    });

    expect(estimate.subtotal).toBe(1250.5);
    expect(estimate.total).toBe(1413.07);
    expect(estimate.lineItems[0]).toEqual({
      material: "Shingles",
      quantity: 10,
      unitPrice: 100.05,
      total: 1000.5,
    });
    expect(estimate.createdDate).toBeInstanceOf(Date);
  });

  it("uses invoice issue date and safely handles missing line items", () => {
    const invoice = normalizeInvoicePdfData({
      invoiceNumber: "INV-0007",
      issueDate: "2026-08-16",
      dueDate: "2026-09-15",
      subtotal: "500",
      tax: "65",
      total: "565",
    });

    expect(invoice.createdDate).toBeInstanceOf(Date);
    expect(invoice.dueDate).toBeInstanceOf(Date);
    expect(invoice.lineItems).toEqual([]);
    expect(invoice.tax).toBe(65);
  });

  it("falls back safely for malformed or non-array line-item input", () => {
    expect(normalizePdfLineItems(null)).toEqual([]);
    expect(normalizePdfLineItems([{ name: "Vent", quantity: "bad", unitPrice: "25" }])).toEqual([{
      material: "Vent",
      quantity: 1,
      unitPrice: 25,
      total: 25,
    }]);
  });
});
