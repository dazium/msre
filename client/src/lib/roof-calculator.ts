/**
 * Roof Calculation Engine
 * Calculates material quantities and labor hours based on roof specifications
 */

export interface RoofSpecs {
  roofArea: number; // Square feet
  roofPitch: string; // e.g., "6/12", "8/12", "12/12"
  numberOfValleys: number;
  numberOfDormers: number;
  numberOfChimneys: number;
  numberOfSkyLights: number;
  hasRidgeVent: boolean;
  tearOffRequired: boolean;
  roofType: "asphalt_shingles" | "metal" | "tile" | "slate" | "wood" | "flat" | "other";
  wastePercentage: number; // Material waste factor (e.g., 10 for 10%)
}

export interface RoofCalculations {
  estimatedSquares: number; // Roofing squares (100 sq ft = 1 square)
  estimatedShingles: number; // Number of shingle bundles
  estimatedUnderlayment: number; // Rolls of underlayment
  estimatedIceWater: number; // Rolls of ice and water shield
  estimatedPlywood: number; // Sheets of plywood
  estimatedFlashing: number; // Linear feet
  estimatedRidgeCaps: number; // Linear feet
  estimatedLaborHours: number; // Total labor hours
  complexityFactor: number; // 1.0 = simple, 1.5+ = complex
  wastePercentage: number; // Material waste factor applied
}

/**
 * Parse roof pitch string (e.g., "6/12" -> 6/12 = 0.5)
 */
export function parsePitch(pitchStr: string): number {
  const [rise, run] = pitchStr.split("/").map(Number);
  return rise / run;
}

/**
 * Calculate complexity factor based on roof features
 * Simple roof = 1.0, complex roof with many features = 1.5+
 */
export function calculateComplexityFactor(specs: RoofSpecs): number {
  let factor = 1.0;

  // Pitch complexity (steeper = harder to work on)
  const pitch = parsePitch(specs.roofPitch);
  if (pitch > 0.5) factor += 0.1; // 6/12 or steeper
  if (pitch > 0.75) factor += 0.1; // 9/12 or steeper
  if (pitch > 1.0) factor += 0.1; // 12/12 or steeper

  // Feature complexity
  factor += specs.numberOfValleys * 0.1;
  factor += specs.numberOfDormers * 0.15;
  factor += specs.numberOfChimneys * 0.1;
  factor += specs.numberOfSkyLights * 0.08;
  if (specs.hasRidgeVent) factor += 0.05;
  if (specs.tearOffRequired) factor += 0.2; // Tear-off adds significant time

  return Math.max(1.0, factor);
}

/**
 * Calculate roofing squares (1 square = 100 sq ft)
 */
export function calculateSquares(roofArea: number): number {
  return roofArea / 100;
}

/**
 * Calculate shingle bundles needed
 * Typically 3 bundles per square for asphalt shingles
 */
export function calculateShingles(squares: number): number {
  return Math.ceil(squares * 3);
}

/**
 * Calculate underlayment rolls needed
 * Typically 1 roll per 400-500 sq ft (use 400 for safety)
 */
export function calculateUnderlayment(roofArea: number): number {
  return Math.ceil(roofArea / 400);
}

/**
 * Calculate ice and water shield rolls
 * Used on edges, valleys, and penetrations
 * Typically 1 roll per 2-3 squares
 */
export function calculateIceWater(squares: number, valleys: number): number {
  let rolls = Math.ceil(squares / 2.5);
  // Add extra for valleys (each valley needs ~1 roll)
  rolls += valleys;
  return rolls;
}

/**
 * Calculate plywood sheets needed for tear-off
 * Typically 1 sheet per 32 sq ft
 */
export function calculatePlywood(roofArea: number): number {
  return Math.ceil(roofArea / 32);
}

/**
 * Calculate flashing linear feet
 * Estimate based on roof perimeter and features
 */
export function calculateFlashing(roofArea: number, valleys: number, chimneys: number, skylights: number): number {
  // Rough estimate: perimeter + valley + penetration flashing
  const estimatedPerimeter = Math.sqrt(roofArea) * 4;
  let flashing = estimatedPerimeter;
  flashing += valleys * 50; // Each valley ~50 ft
  flashing += chimneys * 30; // Each chimney ~30 ft
  flashing += skylights * 20; // Each skylight ~20 ft
  return Math.ceil(flashing);
}

/**
 * Calculate ridge cap linear feet
 * Typically the ridge length of the roof
 */
export function calculateRidgeCaps(roofArea: number): number {
  // Rough estimate: ridge length is roughly sqrt(roofArea)
  const ridgeLength = Math.sqrt(roofArea);
  return Math.ceil(ridgeLength);
}

/**
 * Calculate labor hours based on roof complexity
 * Base rate: ~2-3 hours per square for asphalt shingles
 * Adjusted by complexity factor
 */
export function calculateLaborHours(squares: number, complexityFactor: number): number {
  const baseHoursPerSquare = 2.5;
  return Math.ceil(squares * baseHoursPerSquare * complexityFactor);
}

/**
 * Main calculation function - returns all estimates
 */
export function calculateRoofEstimates(specs: RoofSpecs): RoofCalculations {
  const squares = calculateSquares(specs.roofArea);
  const complexityFactor = calculateComplexityFactor(specs);
  const wasteMultiplier = 1 + (specs.wastePercentage / 100);

  return {
    estimatedSquares: Math.round(squares * 100) / 100,
    estimatedShingles: Math.ceil(calculateShingles(squares) * wasteMultiplier),
    estimatedUnderlayment: Math.ceil(calculateUnderlayment(specs.roofArea) * wasteMultiplier),
    estimatedIceWater: Math.ceil(calculateIceWater(squares, specs.numberOfValleys) * wasteMultiplier),
    estimatedPlywood: specs.tearOffRequired ? Math.ceil(calculatePlywood(specs.roofArea) * wasteMultiplier) : 0,
    estimatedFlashing: Math.ceil(calculateFlashing(specs.roofArea, specs.numberOfValleys, specs.numberOfChimneys, specs.numberOfSkyLights) * wasteMultiplier),
    estimatedRidgeCaps: Math.ceil(calculateRidgeCaps(specs.roofArea) * wasteMultiplier),
    estimatedLaborHours: calculateLaborHours(squares, complexityFactor),
    complexityFactor: Math.round(complexityFactor * 100) / 100,
    wastePercentage: specs.wastePercentage,
  };
}

/**
 * Format labor hours as human-readable string
 * e.g., 24 hours -> "3 days (24 hours)"
 */
export function formatLaborHours(hours: number): string {
  const days = Math.ceil(hours / 8);
  return `${days} days (${hours} hours)`;
}

/**
 * Get complexity description
 */
export function getComplexityDescription(factor: number): string {
  if (factor <= 1.1) return "Simple";
  if (factor <= 1.3) return "Moderate";
  if (factor <= 1.6) return "Complex";
  return "Very Complex";
}
