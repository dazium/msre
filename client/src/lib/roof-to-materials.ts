/**
 * Roof to Materials Mapper
 * Converts roof calculations into material line items for estimates
 */

import type { RoofCalculations } from "./roof-calculator";
// Material type definition for line items
export interface Material {
  id: number;
  name: string;
  category: string;
  unit: string;
  unitPrice: string | number;
}

export interface MaterialLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  materialId?: number;
}

/**
 * Map roof calculations to material line items
 * Matches calculated quantities with available materials
 */
export function mapRoofToMaterials(
  calculations: RoofCalculations,
  availableMaterials: Material[]
): MaterialLineItem[] {
  const lineItems: MaterialLineItem[] = [];

  // Helper to find material by category and add as line item
  const addMaterial = (category: string, quantity: number, fallbackDescription: string) => {
    const material = availableMaterials.find(m => m.category.toLowerCase() === category.toLowerCase());
    if (material) {
      lineItems.push({
        materialId: material.id,
        description: material.name,
        quantity,
        unitPrice: typeof material.unitPrice === 'string' ? parseFloat(material.unitPrice) : material.unitPrice,
      });
    } else {
      // Fallback if material not found in database
      lineItems.push({
        description: fallbackDescription,
        quantity,
        unitPrice: 0, // User will need to enter price
      });
    }
  };

  // Add shingles (bundles)
  if (calculations.estimatedShingles > 0) {
    addMaterial("shingles", calculations.estimatedShingles, `Asphalt Shingles (${calculations.estimatedShingles} bundles)`);
  }

  // Add underlayment (rolls)
  if (calculations.estimatedUnderlayment > 0) {
    addMaterial("underlayment", calculations.estimatedUnderlayment, `Underlayment (${calculations.estimatedUnderlayment} rolls)`);
  }

  // Add ice and water shield (rolls)
  if (calculations.estimatedIceWater > 0) {
    addMaterial("ice_water_shield", calculations.estimatedIceWater, `Ice and Water Shield (${calculations.estimatedIceWater} rolls)`);
  }

  // Add plywood (sheets) - only if tear-off required
  if (calculations.estimatedPlywood > 0) {
    addMaterial("plywood", calculations.estimatedPlywood, `Plywood Sheathing (${calculations.estimatedPlywood} sheets)`);
  }

  // Add flashing (linear feet)
  if (calculations.estimatedFlashing > 0) {
    addMaterial("flashing", calculations.estimatedFlashing, `Roof Flashing (${calculations.estimatedFlashing} linear feet)`);
  }

  // Add ridge caps (linear feet)
  if (calculations.estimatedRidgeCaps > 0) {
    addMaterial("ridge_caps", calculations.estimatedRidgeCaps, `Ridge Cap Shingles (${calculations.estimatedRidgeCaps} linear feet)`);
  }

  return lineItems;
}

/**
 * Calculate labor cost based on hours and hourly rate
 */
export function calculateLaborCost(laborHours: number, hourlyRate: number = 50): number {
  return laborHours * hourlyRate;
}

/**
 * Create a labor line item
 */
export function createLaborLineItem(laborHours: number, hourlyRate: number = 50): MaterialLineItem {
  return {
    description: `Labor (${laborHours} hours @ $${hourlyRate}/hr)`,
    quantity: laborHours,
    unitPrice: hourlyRate,
  };
}

/**
 * Get material category display name
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    shingles: "Roofing Shingles",
    underlayment: "Underlayment",
    ice_water_shield: "Ice & Water Shield",
    plywood: "Plywood Sheathing",
    flashing: "Roof Flashing",
    pipe_flange: "Pipe Flange",
    ridge_caps: "Ridge Caps",
    gutters: "Gutters",
    fascia_soffit: "Fascia/Soffit",
    other: "Other Materials",
  };
  return labels[category] || category;
}
