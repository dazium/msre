import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Plus } from "lucide-react";

export default function Crews() {
  const auth = useAuth();
  const user = auth?.user;
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    crewLead: "",
    phone: "",
    email: "",
    status: "active" as "active" | "inactive",
  });

  const { data: crews, isLoading, refetch } = trpc.crews.list.useQuery();
  const createMutation = trpc.crews.create.useMutation();
  const updateMutation = trpc.crews.update.useMutation();
  const deleteMutation = trpc.crews.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setFormData({ name: "", description: "", crewLead: "", phone: "", email: "", status: "active" });
      setEditingId(null);
      setIsOpen(false);
      refetch();
    } catch (error) {
      console.error("Error saving crew:", error);
    }
  };

  const handleEdit = (crew: any) => {
    setFormData({
      name: crew.name,
      description: crew.description || "",
      crewLead: crew.crewLead || "",
      phone: crew.phone || "",
      email: crew.email || "",
      status: crew.status || "active",
    });
    setEditingId(crew.id);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this crew?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        refetch();
      } catch (error) {
        console.error("Error deleting crew:", error);
      }
    }
  };

  if (!user) {
    return <div className="p-8">Please log in to view crews.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Crews</h1>
          <p className="text-gray-600">Manage your roofing crews</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setFormData({ name: "", description: "", crewLead: "", phone: "", email: "", status: "active" }); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Crew
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Crew" : "Add New Crew"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update crew information" : "Create a new crew"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Crew Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Bruce's Crew"
                  required
                />
              </div>
              <div>
                <Label htmlFor="crewLead">Crew Lead</Label>
                <Input
                  id="crewLead"
                  value={formData.crewLead}
                  onChange={(e) => setFormData({ ...formData, crewLead: e.target.value })}
                  placeholder="e.g., Bruce Johnson"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="crew@example.com"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Crew notes and details"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as "active" | "inactive" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingId ? "Update Crew" : "Create Crew"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading crews...</div>
      ) : crews && crews.length > 0 ? (
        <div className="grid gap-4">
          {crews.map((crew: any) => (
            <Card key={crew.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{crew.name}</CardTitle>
                    {crew.crewLead && <CardDescription>Lead: {crew.crewLead}</CardDescription>}
                  </div>
                  <Badge variant={crew.status === "active" ? "default" : "secondary"}>
                    {crew.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {crew.description && <p className="text-gray-600">{crew.description}</p>}
                  <div className="flex gap-4 text-gray-600">
                    {crew.phone && <span>📱 {crew.phone}</span>}
                    {crew.email && <span>📧 {crew.email}</span>}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(crew)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(crew.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">No crews yet. Create one to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
