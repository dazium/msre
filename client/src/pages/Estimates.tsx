import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Download } from "lucide-react";
import { FormError } from "@/components/FormError";
import { FormField } from "@/components/FormField";
import { validateField, validators, errorsToMap, type ValidationError } from "@/lib/validation";

import { generateEstimatePDF } from "@/lib/pdf-export";
import RoofSpecifications from "@/components/RoofSpecifications";
import { RoofMeasurementTool } from "@/components/RoofMeasurementTool";
import type { RoofSpecs, RoofCalculations } from "@/lib/roof-calculator";

export default function Estimates() {
  const [, setLocation] = useLocation();
  const [estimates, setEstimates] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [showRoofSpecs, setShowRoofSpecs] = useState(false);
  const [roofSpecs, setRoofSpecs] = useState<RoofSpecs | null>(null);
  const [roofCalcs, setRoofCalcs] = useState<RoofCalculations | null>(null);
  const [showMeasurementTool, setShowMeasurementTool] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimateNumber, setEstimateNumber] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: estimatesData, isLoading } = trpc.estimates.list.useQuery();
  const { data: projectsData } = trpc.projects.list.useQuery();
  const { data: materialsData } = trpc.materials.list.useQuery();
  const createMutation = trpc.estimates.create.useMutation();
  const createLineItemMutation = trpc.estimateLineItems.create.useMutation();

  useEffect(() => {
    if (estimatesData) {
      setEstimates(estimatesData);
    }
  }, [estimatesData]);

  useEffect(() => {
    if (materialsData) {
      setMaterials(materialsData);
    }
  }, [materialsData]);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { materialId: null, quantity: 1, unitPrice: 0, description: "" }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const updated = [...lineItems];

    if (field === "materialId") {
      const material = materials.find(m => m.id === parseInt(value));
      if (material) {
        updated[index] = {
          ...updated[index],
          materialId: parseInt(value),
          description: material.name,
          unitPrice: parseFloat(material.unitPrice),
        };
      }
    } else if (field === "quantity") {
      updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    } else if (field === "unitPrice") {
      updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

    setLineItems(updated);
  };

  const calculateLineItemTotal = (item: any) => {
    return (item.quantity * item.unitPrice).toFixed(2);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2);
  };

  const calculateTotal = () => {
    const subtotal = parseFloat(calculateSubtotal());
    const tax = subtotal * 0.13; // 13% HST
    return (subtotal + tax).toFixed(2);
  };

  // Memoize callbacks to prevent infinite loops
  const handleRoofCalculate = useCallback((specs: RoofSpecs, calcs: RoofCalculations) => {
    setRoofSpecs(specs);
    setRoofCalcs(calcs);
  }, []);

  const handleApplyMaterials = useCallback((items: any[]) => {
    setLineItems(items);
    setShowRoofSpecs(false);
    toast.success(`Added ${items.length} materials to estimate`);
  }, []);

  const handleMeasurementComplete = useCallback((totalArea: number, totalSquares: number, sections: any[]) => {
    const firstSection = sections[0];
    setRoofSpecs({
      roofArea: totalArea,
      roofPitch: firstSection?.pitch || '6/12',
      numberOfValleys: 0,
      numberOfDormers: 0,
      numberOfChimneys: 0,
      numberOfSkyLights: 0,
      hasRidgeVent: false,
      tearOffRequired: false,
      roofType: 'asphalt_shingles',
      wastePercentage: 10,
    });
    setShowMeasurementTool(false);
    setShowRoofSpecs(true);
    toast.success(`Roof measured: ${totalSquares} squares (${totalArea.toLocaleString()} sq ft)`);
  }, []);

  const handleCreateEstimate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});

    const errors: ValidationError[] = [];

    if (!selectedProject) {
      errors.push({ field: "project", message: "Please select a project" });
    }

    const estimateNumberError = validateField(estimateNumber, [
      validators.required("Estimate Number"),
    ]);
    if (estimateNumberError) {
      errors.push({ field: "estimateNumber", message: estimateNumberError });
    }

    const titleError = validateField(title, [
      validators.required("Title"),
      validators.minLength("Title", 3),
    ]);
    if (titleError) {
      errors.push({ field: "title", message: titleError });
    }

    if (lineItems.length === 0) {
      errors.push({ field: "lineItems", message: "Please add at least one line item" });
    }

    if (errors.length > 0) {
      setFormErrors(errorsToMap(errors));
      toast.error(`Please fix ${errors.length} validation error(s)`);
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedProjectData = projectsData?.find(p => p.id === selectedProject);
      const subtotal = calculateSubtotal();
      const total = calculateTotal();

      const estimate = await createMutation.mutateAsync({
        projectId: selectedProject as number,
        customerId: selectedProjectData?.customerId || 0,
        estimateNumber: estimateNumber,
        title: title || "Estimate",
        description: description,
        subtotal: subtotal,
        total: total,
        status: "draft",
      });

      toast.success("Estimate created successfully");
      setShowDialog(false);
      setLineItems([]);
      setSelectedProject(null);
      setFormErrors({});
      setEstimateNumber("");
      setTitle("");
      setDescription("");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create estimate");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading estimates...</div>;
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Estimates</h1>
          <Button onClick={() => setShowDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Estimate
          </Button>
        </div>

        {/* Estimates list */}
        <Card className="border-border/50 bg-background/50 backdrop-blur">
          <CardHeader className="border-b border-border/50">
            <CardTitle>All Estimates</CardTitle>
            <CardDescription>View and manage project estimates</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {estimates.length === 0 ? (
              <p className="text-muted-foreground">No estimates yet. Create one to get started.</p>
            ) : (
              <div className="space-y-4">
                {estimates.map((estimate) => (
                  <div key={estimate.id} className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">Estimate #{estimate.estimateNumber}</h3>
                        <p className="text-sm text-muted-foreground">{estimate.title}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${parseFloat(estimate.total).toFixed(2)}</div>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          estimate.status === "draft" ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300" :
                          estimate.status === "sent" ? "bg-blue-500/20 text-blue-700 dark:text-blue-300" :
                          estimate.status === "accepted" ? "bg-green-500/20 text-green-700 dark:text-green-300" :
                          "bg-red-500/20 text-red-700 dark:text-red-300"
                        }`}>
                          {estimate.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateEstimatePDF(estimate)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Estimate Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-full sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto">
            <DialogHeader>
              <DialogTitle>Create New Estimate</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateEstimate} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FormField
                    label="Estimate Number"
                    name="estimateNumber"
                    placeholder="EST-001"
                    value={estimateNumber}
                    onChange={(v) => setEstimateNumber(v.toString())}
                    error={formErrors.estimateNumber}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="project">Project *</Label>
                  <Select value={selectedProject?.toString() || ""} onValueChange={(v) => setSelectedProject(parseInt(v))}>
                    <SelectTrigger className={formErrors.project ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectsData?.map(project => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.project && <FormError message={formErrors.project} />}
                </div>
              </div>

              <div>
                <FormField
                  label="Estimate Title"
                  name="title"
                  placeholder="e.g., Roof Replacement - Main Street"
                  value={title}
                  onChange={(v) => setTitle(v.toString())}
                  error={formErrors.title}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Add any additional details about this estimate"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Roof Measurement Tool */}
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900"
                  onClick={() => setShowMeasurementTool(true)}
                >
                  📏 Measure Roof On-Site
                </Button>
                <p className="text-xs text-muted-foreground text-center">Input dimensions as you measure them</p>
              </div>

              {/* Roof Specifications */}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowRoofSpecs(true)}
                >
                  📐 Add Roof Specifications
                </Button>
                {roofCalcs && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                      Roof: {roofCalcs.estimatedSquares} squares | Labor: {roofCalcs.estimatedLaborHours} hours
                    </p>
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Line Items</Label>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddLineItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {lineItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No line items added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {lineItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-2 md:flex md:gap-3 md:items-end gap-3 p-3 border border-border/50 rounded-lg">
                        <div className="col-span-1 sm:col-span-2 md:flex-1">
                          <Label className="text-xs">Material</Label>
                          <Select
                            value={item.materialId?.toString() || ""}
                            onValueChange={(v) => handleLineItemChange(index, "materialId", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map(material => (
                                <SelectItem key={material.id} value={material.id.toString()}>
                                  {material.name} (${parseFloat(material.unitPrice).toFixed(2)}/{material.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="md:w-20">
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(index, "quantity", e.target.value)}
                            placeholder="1"
                          />
                        </div>

                        <div className="md:w-24">
                          <Label className="text-xs">Unit Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleLineItemChange(index, "unitPrice", e.target.value)}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="md:w-24">
                          <Label className="text-xs">Total</Label>
                          <div className="p-2 bg-muted rounded text-sm font-semibold">
                            ${calculateLineItemTotal(item)}
                          </div>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveLineItem(index)}
                          className="md:self-end"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              {lineItems.length > 0 && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">${calculateSubtotal()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (13%):</span>
                    <span className="font-semibold">${(parseFloat(calculateSubtotal()) * 0.13).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg border-t border-border/50 pt-2">
                    <span>Total:</span>
                    <span className="font-bold">${calculateTotal()}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={lineItems.length === 0}>
                  Create Estimate
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Roof Measurement Tool Modal */}
        <Dialog open={showMeasurementTool} onOpenChange={setShowMeasurementTool}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>On-Site Roof Measurement</DialogTitle>
            </DialogHeader>
            <RoofMeasurementTool onComplete={handleMeasurementComplete} />
          </DialogContent>
        </Dialog>

        {/* Roof Specifications Modal */}
        <Dialog open={showRoofSpecs} onOpenChange={setShowRoofSpecs}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Roof Specifications</DialogTitle>
            </DialogHeader>
            <RoofSpecifications
              onCalculate={handleRoofCalculate}
              onApplyMaterials={handleApplyMaterials}
              initialSpecs={roofSpecs || undefined}
              materials={materials}
            />
            <div className="flex gap-2 justify-end mt-6">
              <Button type="button" variant="outline" onClick={() => setShowRoofSpecs(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}
