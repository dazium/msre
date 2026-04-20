import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  calculateRoofEstimates,
  formatLaborHours,
  getComplexityDescription,
  type RoofSpecs,
  type RoofCalculations,
} from "@/lib/roof-calculator";

interface RoofSpecificationsProps {
  onCalculate?: (specs: RoofSpecs, calculations: RoofCalculations) => void;
  initialSpecs?: RoofSpecs;
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

export function RoofSpecifications({ onCalculate, initialSpecs }: RoofSpecificationsProps) {
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

  if (!calculations) return null;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="dimensions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        {/* Dimensions Tab */}
        <TabsContent value="dimensions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roof Dimensions</CardTitle>
              <CardDescription>Enter the basic roof measurements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Roof Area */}
              <div>
                <Label htmlFor="roofArea">Total Roof Area (sq ft)</Label>
                <Input
                  id="roofArea"
                  type="number"
                  value={specs.roofArea}
                  onChange={(e) => handleChange("roofArea", parseFloat(e.target.value) || 0)}
                  placeholder="2000"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Measured roof area in square feet (length × width accounting for pitch)
                </p>
              </div>

              {/* Roof Pitch */}
              <div>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Rise over run (e.g., 6/12 means 6 inches rise per 12 inches run)
                </p>
              </div>

              {/* Roof Type */}
              <div>
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
              <CardTitle>Roof Features</CardTitle>
              <CardDescription>Select features that affect complexity and materials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Valleys */}
              <div>
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

              {/* Dormers */}
              <div>
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

              {/* Chimneys */}
              <div>
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

              {/* Skylights */}
              <div>
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

              {/* Ridge Vent */}
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

              {/* Tear Off */}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RoofSpecifications;
