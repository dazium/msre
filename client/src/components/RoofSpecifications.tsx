import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Zap, Home } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  calculateRoofEstimates,
  formatLaborHours,
  getComplexityDescription,
  type RoofSpecs,
  type RoofCalculations,
} from "@/lib/roof-calculator";
import { mapRoofToMaterials, createLaborLineItem } from "@/lib/roof-to-materials";

interface RoofSpecificationsProps {
  onCalculate?: (specs: RoofSpecs, calculations: RoofCalculations) => void;
  onApplyMaterials?: (lineItems: any[]) => void;
  initialSpecs?: RoofSpecs;
  materials?: any[];
}

const PITCH_OPTIONS = [
  "3/12",
  "4/12",
  "5/12",
  "6/12",
  "7/12",
  "8/12",
  "9/12",
  "10/12",
  "11/12",
  "12/12",
  "14/12",
  "16/12",
];

const ROOF_TYPES = [
  { value: "asphalt_shingles", label: "Asphalt Shingles" },
  { value: "metal", label: "Metal" },
  { value: "tile", label: "Tile" },
  { value: "slate", label: "Slate" },
  { value: "wood", label: "Wood" },
  { value: "flat", label: "Flat" },
  { value: "other", label: "Other" },
];

// Common roof type templates
const COMMON_ROOF_TYPES = [
  {
    id: "residential_single_story",
    name: "Single Story Home",
    description: "Typical single-family home with simple pitched roof",
    specs: {
      roofArea: 1200,
      roofPitch: "6/12",
      numberOfValleys: 0,
      numberOfDormers: 0,
      numberOfChimneys: 1,
      numberOfSkyLights: 0,
      hasRidgeVent: false,
      tearOffRequired: true,
      roofType: "asphalt_shingles",
    },
  },
  {
    id: "residential_two_story",
    name: "Two Story Home",
    description: "Two-story home with moderate complexity",
    specs: {
      roofArea: 2100,
      roofPitch: "6/12",
      numberOfValleys: 2,
      numberOfDormers: 0,
      numberOfChimneys: 1,
      numberOfSkyLights: 0,
      hasRidgeVent: false,
      tearOffRequired: true,
      roofType: "asphalt_shingles",
    },
  },
  {
    id: "ranch_style",
    name: "Ranch Style",
    description: "Single-story ranch with low to moderate pitch",
    specs: {
      roofArea: 1500,
      roofPitch: "4/12",
      numberOfValleys: 0,
      numberOfDormers: 0,
      numberOfChimneys: 1,
      numberOfSkyLights: 0,
      hasRidgeVent: false,
      tearOffRequired: true,
      roofType: "asphalt_shingles",
    },
  },
  {
    id: "cape_cod",
    name: "Cape Cod Style",
    description: "Cape Cod home with steep pitched roof",
    specs: {
      roofArea: 1800,
      roofPitch: "10/12",
      numberOfValleys: 0,
      numberOfDormers: 2,
      numberOfChimneys: 1,
      numberOfSkyLights: 0,
      hasRidgeVent: false,
      tearOffRequired: true,
      roofType: "asphalt_shingles",
    },
  },
  {
    id: "colonial",
    name: "Colonial Home",
    description: "Colonial-style with complex roofline",
    specs: {
      roofArea: 2400,
      roofPitch: "8/12",
      numberOfValleys: 3,
      numberOfDormers: 2,
      numberOfChimneys: 2,
      numberOfSkyLights: 1,
      hasRidgeVent: false,
      tearOffRequired: true,
      roofType: "asphalt_shingles",
    },
  },
  {
    id: "modern_flat",
    name: "Modern Flat Roof",
    description: "Contemporary home with flat or low-slope roof",
    specs: {
      roofArea: 1200,
      roofPitch: "1/12",
      numberOfValleys: 0,
      numberOfDormers: 0,
      numberOfChimneys: 0,
      numberOfSkyLights: 2,
      hasRidgeVent: false,
      tearOffRequired: false,
      roofType: "flat",
    },
  },
  {
    id: "garage_addition",
    name: "Garage or Addition",
    description: "Garage or home addition",
    specs: {
      roofArea: 600,
      roofPitch: "4/12",
      numberOfValleys: 0,
      numberOfDormers: 0,
      numberOfChimneys: 0,
      numberOfSkyLights: 0,
      hasRidgeVent: false,
      tearOffRequired: true,
      roofType: "asphalt_shingles",
    },
  },
];

// Detailed complexity options
const COMPLEXITY_OPTIONS = [
  {
    value: "simple",
    label: "Simple",
    factor: 1.0,
    description: "Flat roof, no penetrations, easy access",
  },
  {
    value: "simple_plus",
    label: "Simple+",
    factor: 1.2,
    description: "Low slope, few penetrations",
  },
  {
    value: "moderate",
    label: "Moderate",
    factor: 1.5,
    description: "Standard pitch, some valleys, moderate penetrations",
  },
  {
    value: "complex",
    label: "Complex",
    factor: 2.0,
    description: "Steep pitch, multiple valleys, many penetrations, difficult access",
  },
  {
    value: "very_complex",
    label: "Very Complex",
    factor: 2.5,
    description: "Extreme pitch, extensive valleys, many penetrations, very difficult access",
  },
];

export function RoofSpecifications({ onCalculate, onApplyMaterials, initialSpecs, materials }: RoofSpecificationsProps) {
  const [specs, setSpecs] = useState<RoofSpecs>(
    initialSpecs || {
      roofArea: 2000,
      roofPitch: "6/12",
      numberOfValleys: 0,
      numberOfDormers: 0,
      numberOfChimneys: 0,
      numberOfSkyLights: 0,
      hasRidgeVent: false,
      tearOffRequired: true,
      roofType: "asphalt_shingles",
    }
  );

  const [calculations, setCalculations] = useState<RoofCalculations | null>(null);
  const [selectedRoofType, setSelectedRoofType] = useState<string>("");
  const [customComplexity, setCustomComplexity] = useState<string>("moderate");

  // Auto-calculate when specs change
  useEffect(() => {
    const calcs = calculateRoofEstimates(specs);
    setCalculations(calcs);
    onCalculate?.(specs, calcs);
  }, [specs, onCalculate]);

  const handleChange = (field: keyof RoofSpecs, value: any) => {
    setSpecs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyRoofType = (roofTypeId: string) => {
    const roofType = COMMON_ROOF_TYPES.find((rt) => rt.id === roofTypeId);
    if (roofType) {
      setSpecs(roofType.specs as RoofSpecs);
      setSelectedRoofType(roofTypeId);
    }
  };

  if (!calculations) return null;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="dimensions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Common Roof Types
              </CardTitle>
              <CardDescription>Select a template to quickly populate roof specifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {COMMON_ROOF_TYPES.map((roofType) => (
                  <button
                    key={roofType.id}
                    onClick={() => handleApplyRoofType(roofType.id)}
                    className={`p-3 text-left rounded-lg border-2 transition-all ${
                      selectedRoofType === roofType.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-border hover:border-blue-300 hover:bg-muted"
                    }`}
                  >
                    <p className="font-semibold">{roofType.name}</p>
                    <p className="text-sm text-muted-foreground">{roofType.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {roofType.specs.roofArea} sq ft • {roofType.specs.roofPitch} pitch
                    </p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground border-t pt-3">
                💡 Tip: Select a template to auto-populate all fields, then customize as needed in the Dimensions and
                Features tabs.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dimensions Tab */}
        <TabsContent value="dimensions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roof Dimensions</CardTitle>
              <CardDescription>Enter the basic roof measurements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Roof Area */}
              <div className="space-y-2">
                <Label htmlFor="roofArea">Total Roof Area (sq ft)</Label>
                <Input
                  id="roofArea"
                  type="number"
                  value={specs.roofArea}
                  onChange={(e) => handleChange("roofArea", parseFloat(e.target.value) || 0)}
                  placeholder="2000"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground">
                  Measured roof area in square feet (length × width accounting for pitch)
                </p>
              </div>

              {/* Roof Pitch */}
              <div className="space-y-2">
                <Label htmlFor="roofPitch">Roof Pitch</Label>
                <Select value={specs.roofPitch} onValueChange={(v) => handleChange("roofPitch", v)}>
                  <SelectTrigger id="roofPitch" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PITCH_OPTIONS.map((pitch) => (
                      <SelectItem key={pitch} value={pitch}>
                        {pitch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Rise over run (e.g., 6/12 means 6 inches rise per 12 inches run)
                </p>
              </div>

              {/* Roof Type */}
              <div className="space-y-2">
                <Label htmlFor="roofType">Roof Type</Label>
                <Select value={specs.roofType} onValueChange={(v) => handleChange("roofType", v as any)}>
                  <SelectTrigger id="roofType" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOF_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roof Features & Complexity</CardTitle>
              <CardDescription>Select features that affect complexity and materials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Complexity Level */}
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <Label className="text-base font-semibold">Overall Complexity Level</Label>
                <div className="grid grid-cols-1 gap-2">
                  {COMPLEXITY_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-start space-x-3 p-2 rounded-lg hover:bg-background cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="complexity"
                        value={option.value}
                        checked={customComplexity === option.value}
                        onChange={(e) => setCustomComplexity(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold text-sm">
                          {option.label} (×{option.factor.toFixed(1)})
                        </p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Penetrations */}
              <div className="space-y-4 border-t pt-4">
                <p className="font-semibold text-sm">Roof Penetrations & Features</p>

                <div className="space-y-2">
                  <Label htmlFor="valleys">Number of Valleys</Label>
                  <Input
                    id="valleys"
                    type="number"
                    min="0"
                    value={specs.numberOfValleys}
                    onChange={(e) => handleChange("numberOfValleys", parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dormers">Number of Dormers</Label>
                  <Input
                    id="dormers"
                    type="number"
                    min="0"
                    value={specs.numberOfDormers}
                    onChange={(e) => handleChange("numberOfDormers", parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chimneys">Number of Chimneys</Label>
                  <Input
                    id="chimneys"
                    type="number"
                    min="0"
                    value={specs.numberOfChimneys}
                    onChange={(e) => handleChange("numberOfChimneys", parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skylights">Number of Skylights</Label>
                  <Input
                    id="skylights"
                    type="number"
                    min="0"
                    value={specs.numberOfSkyLights}
                    onChange={(e) => handleChange("numberOfSkyLights", parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ridgeVent"
                    checked={specs.hasRidgeVent}
                    onCheckedChange={(v) => handleChange("hasRidgeVent", v)}
                  />
                  <Label htmlFor="ridgeVent" className="font-normal cursor-pointer">
                    Ridge Vent Installation
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tearOff"
                    checked={specs.tearOffRequired}
                    onCheckedChange={(v) => handleChange("tearOffRequired", v)}
                  />
                  <Label htmlFor="tearOff" className="font-normal cursor-pointer">
                    Tear Off Required
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Estimated Materials & Labor
              </CardTitle>
              <CardDescription>Auto-calculated based on roof specifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Complexity Alert */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Complexity:</strong> {getComplexityDescription(calculations.complexityFactor)} (Factor:{" "}
                  {calculations.complexityFactor.toFixed(2)}x)
                </AlertDescription>
              </Alert>

              {/* Material Estimates Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Roofing Squares</p>
                  <p className="text-2xl font-bold">{calculations.estimatedSquares}</p>
                  <p className="text-xs text-muted-foreground">100 sq ft each</p>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Shingle Bundles</p>
                  <p className="text-2xl font-bold">{calculations.estimatedShingles}</p>
                  <p className="text-xs text-muted-foreground">3 per square</p>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Underlayment Rolls</p>
                  <p className="text-2xl font-bold">{calculations.estimatedUnderlayment}</p>
                  <p className="text-xs text-muted-foreground">400 sq ft coverage</p>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Ice & Water Rolls</p>
                  <p className="text-2xl font-bold">{calculations.estimatedIceWater}</p>
                  <p className="text-xs text-muted-foreground">+ valleys</p>
                </div>

                {specs.tearOffRequired && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Plywood Sheets</p>
                    <p className="text-2xl font-bold">{calculations.estimatedPlywood}</p>
                    <p className="text-xs text-muted-foreground">4x8 sheets</p>
                  </div>
                )}

                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Ridge Caps</p>
                  <p className="text-2xl font-bold">{calculations.estimatedRidgeCaps}</p>
                  <p className="text-xs text-muted-foreground">Linear feet</p>
                </div>
              </div>

              {/* Labor Hours */}
              <div className="border-t pt-4">
                <p className="text-sm font-semibold mb-2">Estimated Labor</p>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {formatLaborHours(calculations.estimatedLaborHours)}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Based on complexity factor of {calculations.complexityFactor.toFixed(2)}x
                  </p>
                </div>
              </div>

              {/* Apply Materials Button */}
              {onApplyMaterials && materials && materials.length > 0 && (
                <div className="border-t pt-4">
                  <Button
                    onClick={() => {
                      const materialItems = mapRoofToMaterials(calculations, materials);
                      const laborItem = createLaborLineItem(calculations.estimatedLaborHours);
                      onApplyMaterials([...materialItems, laborItem]);
                    }}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    ✅ Apply Materials to Estimate
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RoofSpecifications;
