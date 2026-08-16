import { describe, expect, it } from "vitest";
import { filterInvoices } from "./invoiceFilters";

const invoices = [
  { invoiceNumber: "INV-001", status: "draft" },
  { invoiceNumber: "INV-002", status: "paid" },
  { invoiceNumber: "Roof-003", status: "sent" },
];

describe("invoice filters", () => {
  it("returns all invoices when no search or status filter is selected", () => {
    expect(filterInvoices(invoices, "", null)).toHaveLength(3);
  });

  it("filters by invoice number case-insensitively", () => {
    expect(filterInvoices(invoices, "roof", null).map((invoice) => invoice.invoiceNumber)).toEqual(["Roof-003"]);
  });

  it("filters by status while preserving search behavior", () => {
    expect(filterInvoices(invoices, "INV", "paid").map((invoice) => invoice.invoiceNumber)).toEqual(["INV-002"]);
  });
});
