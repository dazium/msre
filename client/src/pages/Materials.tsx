import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Edit2 } from "lucide-react";

const MATERIAL_CATEGORIES = [
  { value: "shingles", label: "Shingles" },
  { value: "underlayment", label: "Underlayment" },
  { value: "ice_water_shield", label: "Ice & Water Shield" },
  { value: "plywood", label: "Plywood" },
  { value: "flashing", label: "Flashing" },
  { value: "pipe_flange", label: "Pipe Flange" },
  { value: "ridge_caps", label: "Ridge Caps" },
  { value: "gutters", label: "Gutters" },
  { value: "fascia_soffit", label: "Fascia & Soffit" },
  { value: "other", label: "Other" },
];

// Home Depot Canada pricing data
const DEFAULT_MATERIALS = [
  // Shingles
  { name: "GAF Timberline HDZ", category: "shingles", unit: "bundle", unitPrice: 39.97, description: "33.3 sq.ft. per bundle" },
  { name: "Owens Corning TruDefinition", category: "shingles", unit: "bundle", unitPrice: 47.20, description: "32.8 sq.ft. per bundle" },
  { name: "GAF Timberline UHDZ", category: "shingles", unit: "bundle", unitPrice: 62.46, description: "Premium shingles" },
  
  // Ice & Water Shield
  { name: "Henry Eaveguard", category: "ice_water_shield", unit: "roll", unitPrice: 110.00, description: "36\" x 65' roll" },
  { name: "GAF StormGuard", category: "ice_water_shield", unit: "roll", unitPrice: 110.00, description: "200 sq.ft. roll" },
  { name: "Henry Blueskin", category: "ice_water_shield", unit: "roll", unitPrice: 188.00, description: "36\" x 65' roll" },
  { name: "Owens Corning WeatherLock", category: "ice_water_shield", unit: "roll", unitPrice: 118.00, description: "200 sq.ft. roll" },
  
  // Underlayment
  { name: "GAF FeltBuster", category: "underlayment", unit: "roll", unitPrice: 164.00, description: "1000 sq.ft. roll" },
  { name: "Owens Corning ProArmor", category: "underlayment", unit: "roll", unitPrice: 105.00, description: "1000 sq.ft. roll" },
  { name: "Owens Corning RhinoRoof U20", category: "underlayment", unit: "roll", unitPrice: 39.64, description: "500 sq.ft. roll" },
  
  // Plywood
  { name: "3/8\" Spruce Plywood", category: "plywood", unit: "sheet", unitPrice: 53.88, description: "4'x8' sheet" },
  { name: "1/2\" Spruce Plywood", category: "plywood", unit: "sheet", unitPrice: 69.56, description: "4'x8' sheet" },
  { name: "5/8\" Spruce Plywood", category: "plywood", unit: "sheet", unitPrice: 86.22, description: "4'x8' sheet" },
  { name: "3/4\" Spruce Plywood", category: "plywood", unit: "sheet", unitPrice: 103.00, description: "4'x8' sheet" },
  
  // Pipe Flange
  { name: "Pipe Flange Boot", category: "pipe_flange", unit: "piece", unitPrice: 51.45, description: "1.5\" galvanized" },
  { name: "Pipe Flange Boot", category: "pipe_flange", unit: "piece", unitPrice: 52.93, description: "2\" galvanized" },
];

export default function Materials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "other" as any,
    unit: "piece",
    unitPrice: 0,
    description: "",
  });

  const { data: materialsData } = trpc.materials.list.useQuery();
  const createMutation = trpc.materials.create.useMutation();
  const updateMutation = trpc.materials.update.useMutation();
  const deleteMutation = trpc.materials.delete.useMutation();

  useEffect(() => {
    if (materialsData) {
      setMaterials(materialsData);
    }
  }, [materialsData]);

  const handleAddDefaults = async () => {
    try {
      for (const material of DEFAULT_MATERIALS) {
        await createMutation.mutateAsync({
          name: material.name,
          category: material.category as any,
          unit: material.unit,
          unitPrice: material.unitPrice,
          description: material.description,
        });
      }
      toast.success("Default materials added successfully!");
    } catch (error) {
      toast.error("Failed to add materials");
    }
  };

  const handleOpenDialog = (material?: any) => {
    if (material) {
      setEditingId(material.id);
      setFormData({
        name: material.name,
        category: material.category,
        unit: material.unit,
        unitPrice: parseFloat(material.unitPrice),
        description: material.description || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        category: "other",
        unit: "piece",
        unitPrice: 0,
        description: "",
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name || formData.unitPrice <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...formData,
        });
        toast.success("Material updated successfully!");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Material added successfully!");
      }
      setShowDialog(false);
    } catch (error) {
      toast.error("Failed to save material");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Material deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete material");
    }
  };

  const getCategoryLabel = (category: string) => {
    return MATERIAL_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Materials Pricing</h1>
            <p className="text-muted-foreground">Manage roofing materials and pricing from Home Depot Canada</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddDefaults} variant="outline">
              Load Defaults
            </Button>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </div>
        </div>

        {materials.length === 0 ? (
          <Card className="border-border/50 bg-background/50 backdrop-blur">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No materials yet. Click "Load Defaults" to add Home Depot Canada pricing.</p>
              <Button onClick={handleAddDefaults}>Load Default Materials</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {MATERIAL_CATEGORIES.map(category => {
              const categoryMaterials = materials.filter(m => m.category === category.value);
              if (categoryMaterials.length === 0) return null;

              return (
                <Card key={category.value} className="border-border/50 bg-background/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg">{category.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categoryMaterials.map(material => (
                        <div
                          key={material.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold">{material.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {material.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold text-lg">
                                ${parseFloat(material.unitPrice).toFixed(2)}
                              </p>
                              <p className="text-sm text-muted-foreground">per {material.unit}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenDialog(material)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(material.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Material" : "Add Material"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Material Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., GAF Timberline HDZ"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g., bundle, roll, sheet"
                  />
                </div>
                <div>
                  <Label htmlFor="unitPrice">Unit Price (CAD)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., 33.3 sq.ft. per bundle"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingId ? "Update" : "Add"} Material
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
