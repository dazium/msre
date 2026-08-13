export const ROOF_TYPES = ["asphalt_shingle", "metal", "flat", "tile", "cedar"] as const;

export type RoofType = (typeof ROOF_TYPES)[number];
export type InspectionTemplateItem = readonly [category: string, label: string];

export const ROOF_TYPE_LABELS: Record<RoofType, string> = {
  asphalt_shingle: "Asphalt Shingle",
  metal: "Metal",
  flat: "Flat / Low-Slope",
  tile: "Tile",
  cedar: "Cedar Shake",
};

const commonItems: InspectionTemplateItem[] = [
  ["Safety", "Ladders, access, and fall hazards"],
  ["Safety", "Roof access and walkway condition"],
  ["Attic", "Ventilation and insulation"],
  ["Attic", "Signs of moisture, mold, or daylight"],
  ["Drainage", "Gutters, downspouts, and discharge points"],
  ["Measurements", "Roof dimensions, pitch, and access notes"],
];

export const ROOF_TYPE_TEMPLATES: Record<RoofType, InspectionTemplateItem[]> = {
  asphalt_shingle: [
    ["Roof Surface", "Shingle granule loss, blistering, or curling"],
    ["Roof Surface", "Missing, lifted, or damaged shingles"],
    ["Roof Surface", "Nail pops, exposed fasteners, and seal strips"],
    ["Roof Surface", "Ridge cap and hip shingle condition"],
    ["Flashing", "Step flashing, wall flashing, and kick-out flashing"],
    ["Flashing", "Valley lining and penetration flashing"],
    ["Ventilation", "Ridge, soffit, gable, and roof vent performance"],
    ["Exterior", "Fascia, soffit, eavestroughs, and drip edge"],
    ...commonItems,
  ],
  metal: [
    ["Roof Surface", "Panel alignment, seams, and exposed fasteners"],
    ["Roof Surface", "Corrosion, oxidation, coating failure, or punctures"],
    ["Roof Surface", "Oil-canning, dents, and storm impact marks"],
    ["Roof Surface", "Ridge caps, closures, and panel laps"],
    ["Flashing", "Sidewall, headwall, valley, and penetration flashing"],
    ["Fasteners", "Loose, missing, backed-out, or over-driven fasteners"],
    ["Drainage", "Metal edge details, gutters, and snow retention"],
    ["Thermal Movement", "Evidence of restricted expansion or panel movement"],
    ...commonItems,
  ],
  flat: [
    ["Membrane", "Ponding water, splits, blisters, or open seams"],
    ["Membrane", "Membrane adhesion and surface wear"],
    ["Membrane", "Patches, penetrations, and previous repairs"],
    ["Drainage", "Roof drains, scuppers, strainers, and overflow paths"],
    ["Drainage", "Tapered insulation and slope toward drainage"],
    ["Flashing", "Parapet caps, wall flashings, and curb details"],
    ["Equipment", "Rooftop units, pipe boots, and service penetrations"],
    ["Edges", "Perimeter terminations, coping, and edge securement"],
    ...commonItems,
  ],
  tile: [
    ["Roof Surface", "Cracked, slipped, loose, or missing tiles"],
    ["Roof Surface", "Tile underlayment exposure and deterioration"],
    ["Roof Surface", "Ridge, hip, and rake tile securement"],
    ["Roof Surface", "Tile uniformity and brittle or displaced sections"],
    ["Flashing", "Valley, wall, chimney, and penetration flashing"],
    ["Flashing", "Mortar, sealant, and counter-flashing condition"],
    ["Structure", "Visible deck deflection or truss movement"],
    ["Drainage", "Tile edge, eaves, gutters, and splash control"],
    ...commonItems,
  ],
  cedar: [
    ["Roof Surface", "Split, curled, cupped, or missing shakes"],
    ["Roof Surface", "Shake thickness, spacing, and exposed fasteners"],
    ["Roof Surface", "Moss, algae, rot, and insect damage"],
    ["Roof Surface", "Ridge, hip, rake, and valley shake condition"],
    ["Flashing", "Step, valley, chimney, and penetration flashing"],
    ["Ventilation", "Soffit, ridge, and intake ventilation"],
    ["Woodwork", "Fascia, soffit, trim, and roof-to-wall interfaces"],
    ["Fire / Treatment", "Fire-retardant treatment and clearance concerns"],
    ...commonItems,
  ],
};

export function getInspectionTemplate(roofType: RoofType | null | undefined): InspectionTemplateItem[] {
  return ROOF_TYPE_TEMPLATES[roofType ?? "asphalt_shingle"];
}

export function getRoofTypeLabel(roofType: RoofType | null | undefined): string {
  return ROOF_TYPE_LABELS[roofType ?? "asphalt_shingle"];
}
