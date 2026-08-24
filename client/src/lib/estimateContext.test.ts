import { describe, expect, it } from "vitest";
import { buildCustomerEstimatePrefill } from "./estimateContext";

describe("buildCustomerEstimatePrefill", () => {
  it("creates an editable job summary and a clean contact snapshot", () => {
    const prefill = buildCustomerEstimatePrefill({
      customerName: "John Mitchell",
      phone: "519-555-0100",
      email: "john@example.com",
      address: "142 Riverside Drive",
      city: "Windsor",
      state: "ON",
      zipCode: "N9A 7H2",
      jobTitle: "Roof Replacement",
      jobDescription: "Hail damage at the rear slope.",
      jobStatus: "in_progress",
      roofType: "Asphalt Shingles",
    });

    expect(prefill.title).toBe("Roof Replacement — John Mitchell");
    expect(prefill.description).toContain("Phone: 519-555-0100");
    expect(prefill.description).toContain("Status: in progress");
    expect(prefill.description).toContain("Recent job notes:");
    expect(prefill.contact).toContainEqual({ label: "Address", value: "142 Riverside Drive, Windsor, ON, N9A 7H2" });
  });

  it("does not render null or empty address segments", () => {
    const prefill = buildCustomerEstimatePrefill({
      customerName: "Customer",
      address: "",
      city: null,
      state: undefined,
      zipCode: "",
      jobTitle: "Inspection",
    });

    expect(prefill.description).toContain("Address: Not provided");
    expect(prefill.contact).not.toContainEqual(expect.objectContaining({ label: "Address" }));
  });
});
