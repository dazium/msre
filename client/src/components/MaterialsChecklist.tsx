import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SelectedMaterial {
  id: string;
  name: string;
  quantity: number;
}

interface MaterialsChecklistProps {
  onMaterialsChange: (materials: SelectedMaterial[]) => void;
  initialMaterials?: SelectedMaterial[];
}

const DEFAULT_MATERIALS = [
  { id: "drip-edge", name: "Drip Edge", category: "flashing" },
  { id: "vents", name: "Vents", category: "vents" },
  { id: "ice-water", name: "Ice and Water", category: "underlayment" },
  { id: "synthetic-underlay", name: "Synthetic Underlay", category: "underlayment" },
  { id: "starter-shingle", name: "Starter Shingle", category: "fasteners" },
  { id: "ridge-cap", name: "Ridge Cap", category: "fasteners" },
  { id: "flashing-kit", name: "Flashing Kit", category: "flashing" },
  { id: "roof-cement", name: "Roof Cement", category: "sealants" },
  { id: "nails", name: "Roofing Nails", category: "fasteners" },
  { id: "underlayment", name: "Underlayment", category: "underlayment" },
];

export default function MaterialsChecklist({ onMaterialsChange, initialMaterials = [] }: MaterialsChecklistProps) {
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>(initialMaterials);

  const handleToggleMaterial = (material: typeof DEFAULT_MATERIALS[0]) => {
    const existing = selectedMaterials.find((m) => m.id === material.id);
    let updated: SelectedMaterial[];

    if (existing) {
      updated = selectedMaterials.filter((m) => m.id !== material.id);
    } else {
      updated = [...selectedMaterials, { id: material.id, name: material.name, quantity: 1 }];
    }

    setSelectedMaterials(updated);
    onMaterialsChange(updated);
  };

  const handleQuantityChange = (materialId: string, quantity: number) => {
    const updated = selectedMaterials.map((m) =>
      m.id === materialId ? { ...m, quantity: Math.max(1, quantity) } : m
    );
    setSelectedMaterials(updated);
    onMaterialsChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Materials Needed</Label>
        <p className="text-sm text-foreground/60 mt-1">Select materials and enter quantities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-background/50 rounded-lg border border-border">
        {DEFAULT_MATERIALS.map((material) => {
          const selected = selectedMaterials.find((m) => m.id === material.id);

          return (
            <div key={material.id} className="flex items-center gap-3">
              <Checkbox
                id={material.id}
                checked={!!selected}
                onCheckedChange={() => handleToggleMaterial(material)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor={material.id} className="font-medium cursor-pointer">
                  {material.name}
                </Label>
              </div>
              {selected && (
                <Input
                  type="number"
                  min="1"
                  value={selected.quantity}
                  onChange={(e) => handleQuantityChange(material.id, parseInt(e.target.value) || 1)}
                  className="w-16 h-8 text-center"
                  placeholder="Qty"
                />
              )}
            </div>
          );
        })}
      </div>

      {selectedMaterials.length > 0 && (
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-foreground">Selected Materials:</p>
          <div className="mt-2 space-y-1">
            {selectedMaterials.map((m) => (
              <p key={m.id} className="text-sm text-foreground/80">
                • {m.name} - {m.quantity}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
