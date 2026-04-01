import { useEffect, useState } from "react";
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
import DashboardLayout from "@/components/DashboardLayout";
import { generateEstimatePDF } from "@/lib/pdf-export";

// Materials list matching MaterialsChecklist
const MATERIALS = [
  { id: "drip-edge", name: "Drip Edge", unitPrice: 15.00 },
  { id: "vents", name: "Vents", unitPrice: 45.00 },
  { id: "ice-water", name: "Ice and Water", unitPrice: 35.00 },
  { id: "synthetic-underlay", name: "Synthetic Underlay", unitPrice: 50.00 },
  { id: "starter-shingle", name: "Starter Shingle", unitPrice: 25.00 },
  { id: "ridge-cap", name: "Ridge Cap", unitPrice: 30.00 },
  { id: "flashing-kit", name: "Flashing Kit", unitPrice: 65.00 },
  { id: "roof-cement", name: "Roof Cement", unitPrice: 20.00 },
  { id: "nails", name: "Roofing Nails", unitPrice: 8.00 },
  { id: "nails-box", name: "Nails by the Box", unitPrice: 40.00 },
  { id: "underlayment", name: "Underlayment", unitPrice: 55.00 },
];

export default function Estimates() {
  const [, setLocation] = useLocation();
  const [estimates, setEstimates] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [damages, setDamages] = useState<any[]>([]);

  const { data: estimatesData, isLoading } = trpc.estimates.list.useQuery();
  const { data: projectsData } = trpc.projects.list.useQuery();
  const { data: damagesData } = trpc.damages.list.useQuery();
  const createMutation = trpc.estimates.create.useMutation();

  useEffect(() => {
    if (estimatesData) {
      setEstimates(estimatesData);
    }
  }, [estimatesData]);

  useEffect(() => {
    if (damagesData) {
      setDamages(damagesData);
    }
  }, [damagesData]);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { materialId: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    
    if (field === "materialId") {
      const material = MATERIALS.find(m => m.id === value);
      updated[index] = { 
        ...updated[index], 
        materialId: value,
        unitPrice: material?.unitPrice || 0
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    setLineItems(updated);
  };

  const handleAutoPopulateFromDamages = (projectId: number) => {
    const projectDamages = damages.filter((d) => d.projectId === projectId);
    const items = projectDamages.map((damage) => ({
      materialId: "drip-edge",
      quantity: 1,
      unitPrice: 15.00,
      description: `${damage.category}: ${damage.description}`,
    }));
    setLineItems(items);
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2);
  };

  const handleCreateEstimate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedProject || lineItems.length === 0) {
      toast.error("Please select a project and add line items");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const total = calculateTotal();

    try {
      await createMutation.mutateAsync({
        projectId: selectedProject,
        estimateNumber: formData.get("estimateNumber") as string,
        description: formData.get("description") as string,
        totalAmount: total,
        lineItems: JSON.stringify(lineItems),
        status: "draft",
      });

      toast.success("Estimate created successfully");
      setShowDialog(false);
      setLineItems([]);
      setSelectedProject(null);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast.error("Failed to create estimate");
    }
  };

  const handleExportPDF = (estimate: any) => {
    const lineItemsData = JSON.parse(estimate.lineItems || "[]");
    const content = `
ESTIMATE

Estimate #: ${estimate.estimateNumber}
Date: ${new Date(estimate.createdAt).toLocaleDateString()}
Status: ${estimate.status}

Description:
${estimate.description}

LINE ITEMS:
${lineItemsData.map((item: any, i: number) => {
  const material = MATERIALS.find(m => m.id === item.materialId);
  return `${i + 1}. ${material?.name || item.materialId} - Qty: ${item.quantity} x $${item.unitPrice.toFixed(2)} = $${(item.quantity * item.unitPrice).toFixed(2)}`;
}).join("\n")}

TOTAL: $${estimate.totalAmount}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estimate-${estimate.estimateNumber}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <DashboardLayout><div className="p-8">Loading estimates...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
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
                {estimates.map((estimate) => {
                  const lineItemsData = JSON.parse(estimate.lineItems || "[]");
                  return (
                    <div key={estimate.id} className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">Estimate #{estimate.estimateNumber}</h3>
                          <p className="text-sm text-muted-foreground">{estimate.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">${estimate.totalAmount}</div>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            estimate.status === "draft" ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300" :
                            estimate.status === "sent" ? "bg-blue-500/20 text-blue-700 dark:text-blue-300" :
                            "bg-green-500/20 text-green-700 dark:text-green-300"
                          }`}>
                            {estimate.status}
                          </span>
                        </div>
                      </div>

                      {/* Line items preview */}
                      <div className="mt-3 space-y-1 text-sm">
                        {lineItemsData.slice(0, 3).map((item: any, i: number) => {
                          const material = MATERIALS.find(m => m.id === item.materialId);
                          return (
                            <div key={i} className="flex justify-between text-muted-foreground">
                              <span>{material?.name || item.materialId} x {item.quantity}</span>
                              <span>${(item.quantity * item.unitPrice).toFixed(2)}</span>
                            </div>
                          );
                        })}
                        {lineItemsData.length > 3 && (
                          <div className="text-muted-foreground">+{lineItemsData.length - 3} more items</div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" onClick={() => handleExportPDF(estimate)} className="gap-2">
                          <Download className="h-4 w-4" />
                          Export
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create estimate dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Estimate</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEstimate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project">Project</Label>
                  <Select value={selectedProject?.toString() || ""} onValueChange={(v) => {
                    const projectId = parseInt(v);
                    setSelectedProject(projectId);
                    handleAutoPopulateFromDamages(projectId);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectsData?.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="estimateNumber">Estimate #</Label>
                  <Input id="estimateNumber" name="estimateNumber" placeholder="EST-001" required />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Estimate details..." />
              </div>

              {/* Line items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Line Items</Label>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddLineItem} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>

                {lineItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No line items. Click "Add Item" or auto-populate from damages.</p>
                ) : (
                  <div className="space-y-2">
                    {lineItems.map((item, index) => {
                      const material = MATERIALS.find(m => m.id === item.materialId);
                      return (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Label className="text-xs">Material</Label>
                            <Select value={item.materialId} onValueChange={(v) => handleLineItemChange(index, "materialId", v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select material" />
                              </SelectTrigger>
                              <SelectContent>
                                {MATERIALS.map((mat) => (
                                  <SelectItem key={mat.id} value={mat.id}>
                                    {mat.name} (${mat.unitPrice.toFixed(2)})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-20">
                            <Label className="text-xs">Qty</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleLineItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="w-24">
                            <Label className="text-xs">Unit Price</Label>
                            <div className="p-2 rounded border border-border/50 text-right font-semibold text-sm">
                              ${item.unitPrice.toFixed(2)}
                            </div>
                          </div>
                          <div className="w-24">
                            <Label className="text-xs">Total</Label>
                            <div className="p-2 rounded border border-border/50 text-right font-semibold">
                              ${(item.quantity * item.unitPrice).toFixed(2)}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveLineItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${calculateTotal()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${calculateTotal()}</span>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Estimate"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
