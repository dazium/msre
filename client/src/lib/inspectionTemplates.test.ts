import { describe, expect, it } from "vitest";
import {
  getInspectionTemplate,
  getRoofTypeLabel,
  ROOF_TYPES,
  ROOF_TYPE_LABELS,
} from "./inspectionTemplates";

describe("roof-type inspection templates", () => {
  it.each(ROOF_TYPES)("provides a non-empty standardized template for %s roofs", (roofType) => {
    const template = getInspectionTemplate(roofType);

    expect(template.length).toBeGreaterThanOrEqual(12);
    expect(template.every(([category, label]) => category.length > 0 && label.length > 0)).toBe(true);
    expect(new Set(template.map(([category]) => category)).size).toBeGreaterThanOrEqual(4);
  });

  it("keeps the five supported roof types and human-readable labels aligned", () => {
    expect(Object.keys(ROOF_TYPE_LABELS).sort()).toEqual([...ROOF_TYPES].sort());
    expect(getRoofTypeLabel("asphalt_shingle")).toBe("Asphalt Shingle");
    expect(getRoofTypeLabel(undefined)).toBe("Asphalt Shingle");
  });

  it("includes material-specific checkpoints instead of only generic items", () => {
    expect(getInspectionTemplate("metal").some(([, label]) => label.includes("panel"))).toBe(true);
    expect(getInspectionTemplate("flat").some(([, label]) => label.includes("Ponding"))).toBe(true);
    expect(getInspectionTemplate("tile").some(([, label]) => label.includes("tile"))).toBe(true);
    expect(getInspectionTemplate("cedar").some(([, label]) => label.includes("shakes"))).toBe(true);
  });
});
