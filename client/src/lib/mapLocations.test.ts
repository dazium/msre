import { describe, expect, it } from "vitest";
import { buildLocationMarkers, getProjectStatusOptions } from "./mapLocations";

const projects = [
  { id: 1, title: "Oak Street Roof", status: "scheduled", latitude: "42.3149", longitude: "-83.0364" },
  { id: 2, title: "Maple Avenue Roof", status: "completed", latitude: "42.3159", longitude: "-83.0464" },
];

describe("map locations", () => {
  it("creates customer and selected-status project markers", () => {
    const markers = buildLocationMarkers({
      projects,
      customers: [{ id: 7, firstName: "John", lastName: "Mitchell", latitude: "42.32", longitude: "-83.04", address: "10 Main St" }],
      appointments: [{ id: 4, projectId: 1, title: "Roof inspection", type: "inspection" }],
      statusFilter: "scheduled",
    });

    expect(markers.map((marker) => marker.id)).toEqual(["project-1", "customer-7", "appointment-4"]);
    expect(markers.find((marker) => marker.id === "customer-7")?.color).toBe("#8b5cf6");
  });

  it("provides a stable status filter list", () => {
    expect(getProjectStatusOptions(projects)).toEqual(["completed", "scheduled"]);
  });

  it("does not turn blank coordinate fields into false locations", () => {
    const markers = buildLocationMarkers({
      projects: [{ id: 9, title: "Unmapped roof", status: "scheduled", latitude: "", longitude: "" }],
      customers: [{ id: 8, firstName: "Unmapped", lastName: "Customer", latitude: null, longitude: null }],
      appointments: [],
      statusFilter: "all",
    });

    expect(markers).toEqual([]);
  });
});
