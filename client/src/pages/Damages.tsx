import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, Upload, Trash2, AlertCircle } from "lucide-react";
import MaterialsChecklist, { SelectedMaterial } from "@/components/MaterialsChecklist";

const DAMAGE_CATEGORIES = [
  { value: "missing_shingles", label: "Missing Shingles" },
  { value: "flashing_damage", label: "Flashing Damage" },
  { value: "leaks", label: "Leaks" },
  { value: "sagging", label: "Sagging Roof" },
  { value: "rot", label: "Rot/Decay" },
  { value: "moss_algae", label: "Moss/Algae Growth" },
  { value: "hail_damage", label: "Hail Damage" },
  { value: "wind_damage", label: "Wind Damage" },
  { value: "other", label: "Other" },
];

export default function Damages() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ url: string; file: File }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    severity: "moderate",
    location: "",
    estimatedCost: "",
  });
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);

  const { data: projects } = trpc.projects.list.useQuery();
  const { data: damages, isLoading, refetch } = trpc.damages.list.useQuery();
  const createMutation = trpc.damages.create.useMutation();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const preview = URL.createObjectURL(file);
      setUploadedPhotos((prev) => [...prev, { url: preview, file }]);
    }
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !formData.category || !formData.description) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      // Create damage record
      await createMutation.mutateAsync({
        projectId: parseInt(selectedProject),
        customerId: 0,
        category: formData.category as any,
        description: formData.description,
        severity: formData.severity as any,
        location: formData.location,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost).toString() : undefined,
      });

      toast.success(`Damage recorded with ${selectedMaterials.length} materials!`);
      setFormData({
        category: "",
        description: "",
        severity: "moderate",
        location: "",
        estimatedCost: "",
      });
      setSelectedMaterials([]);
      setUploadedPhotos([]);
      setSelectedProject("");
      setIsOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to record damage");
    }
  };

  const selectedProjectData = projects?.find((p) => p.id === parseInt(selectedProject));

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="blueprint-section">
          <div className="blueprint-header flex items-center justify-between">
            <h1 className="text-3xl font-bold">Roof Damage Assessment</h1>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Record Damage
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-full sm:max-w-2xl w-[95vw] sm:w-auto max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Record Roof Damage</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="project">Project *</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger id="project">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects?.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProjectData && (
                    <div className="blueprint-card p-3">
                      <p className="text-sm text-foreground/70">
                        <strong>Location:</strong> {selectedProjectData.address}, {selectedProjectData.city}, {selectedProjectData.state}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="category">Damage Type *</Label>
                    <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select damage type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAMAGE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Damage Description *</Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the damage in detail (e.g., 'Missing shingles on north side of roof, approximately 4x6 feet area')"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="severity">Severity *</Label>
                      <Select value={formData.severity} onValueChange={(val) => setFormData({ ...formData, severity: val })}>
                        <SelectTrigger id="severity">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minor">Minor</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="severe">Severe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="location">Location on Roof</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., North side, East corner"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="estimatedCost">Estimated Repair Cost ($)</Label>
                    <Input
                      id="estimatedCost"
                      type="number"
                      step="0.01"
                      value={formData.estimatedCost}
                      onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                      placeholder="1500.00"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <MaterialsChecklist onMaterialsChange={setSelectedMaterials} initialMaterials={selectedMaterials} />
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <Label>Damage Photos</Label>
                    <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary/60 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-primary/60" />
                      <p className="text-sm text-foreground/70">Click to upload or drag and drop</p>
                      <p className="text-xs text-foreground/50">PNG, JPG, GIF up to 10MB</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>

                    {uploadedPhotos.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {uploadedPhotos.map((photo, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={photo.url}
                              alt={`Preview ${idx}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Recording..." : "Record Damage"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Info Box */}
        <div className="blueprint-section bg-blue-950/30 border border-blue-400/30">
          <div className="p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground">
                <strong>Pro Tip:</strong> Take clear photos of all damage areas from multiple angles. Include photos showing the extent of damage and any surrounding context. These photos will help generate accurate estimates.
              </p>
            </div>
          </div>
        </div>

        {/* Damages List */}
        <div className="blueprint-section">
          <div className="p-6">
            {isLoading ? (
              <p className="text-center py-8 text-foreground/60">Loading damages...</p>
            ) : !damages || damages.length === 0 ? (
              <p className="text-center py-8 text-foreground/60">
                No damages recorded yet. Start by recording your first damage assessment.
              </p>
            ) : (
              <div className="space-y-3">
                {damages?.map((damage: any) => (
                  <div key={damage.id} className="blueprint-card p-4 hover:blueprint-glow transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {DAMAGE_CATEGORIES.find((c) => c.value === damage.category as string)?.label}
                          </h3>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            damage.severity === "severe" ? "bg-red-500/20 text-red-400" :
                            damage.severity === "moderate" ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-green-500/20 text-green-400"
                          }`}>
                            {damage.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/70 mt-1">{damage.description}</p>
                        <p className="text-xs text-foreground/50 mt-2">
                          Location: {damage.location || "Not specified"}
                        </p>
                        {damage.estimatedCost && (
                          <p className="text-sm font-semibold text-primary mt-1">
                            Est. Cost: ${parseFloat(damage.estimatedCost).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
