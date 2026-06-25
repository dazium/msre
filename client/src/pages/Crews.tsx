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
import { Trash2, Edit2, Plus, Users, ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "wouter";

function CrewCard({ crew, onEdit, onDelete }: { crew: any; onEdit: (crew: any) => void; onDelete: (id: number) => void }) {
  const { data: members, refetch: refetchMembers } = trpc.crews.getMembers.useQuery({ crewId: crew.id });
  const utils = trpc.useUtils();
  const setCrewLeadMutation = trpc.crews.setCrewLead.useMutation();
  const [showMembers, setShowMembers] = useState(false);

  const crewLead = members?.find(m => m.id === crew.crewLeadId);
  const teamMembers = members?.filter((m: any) => m.id !== crew.crewLeadId) || [];

  const handleSetCrewLead = async (memberId: number) => {
    try {
      await setCrewLeadMutation.mutateAsync({ crewId: crew.id, crewLeadId: memberId });
      // Invalidate crew list to refresh crew lead data
      await utils.crews.list.invalidate();
      await refetchMembers();
    } catch (error) {
      console.error("Error setting crew lead:", error);
    }
  };

  const handleClearCrewLead = async () => {
    try {
      await setCrewLeadMutation.mutateAsync({ crewId: crew.id, crewLeadId: null });
      // Invalidate crew list to refresh crew lead data
      await utils.crews.list.invalidate();
      await refetchMembers();
    } catch (error) {
      console.error("Error clearing crew lead:", error);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle>{crew.name}</CardTitle>
            {crewLead && (
              <CardDescription className="flex items-center gap-2 mt-1">
                <span className="font-semibold text-foreground">👤 {crewLead.name}</span>
                <Badge variant="default" className="text-xs">Crew Lead</Badge>
              </CardDescription>
            )}
            {crew.description && <p className="text-sm text-foreground/60 mt-2">{crew.description}</p>}
          </div>
          <Badge variant={crew.status === "active" ? "default" : "secondary"}>
            {crew.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4 text-sm text-foreground/60">
            {crew.phone && <span>📱 {crew.phone}</span>}
            {crew.email && <span>📧 {crew.email}</span>}
          </div>

          {/* Members Section */}
          {members && members.length > 0 && (
            <div className="border-t pt-4">
              <button
                onClick={() => setShowMembers(!showMembers)}
                className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors"
              >
                {showMembers ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <Users className="w-4 h-4" />
                {members.length} Team Member{members.length !== 1 ? 's' : ''}
              </button>

              {showMembers && (
                <div className="mt-3 space-y-2">
                  {/* Crew Lead - Highlighted */}
                  {crewLead && (
                    <div className="ml-6 p-3 bg-primary/10 rounded-lg border-2 border-primary/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-foreground">👨‍💼 {crewLead.name}</p>
                          <p className="text-xs text-foreground/60 mt-1">{crewLead.role}</p>
                          {crewLead.phone && <p className="text-xs text-foreground/60">📱 {crewLead.phone}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Badge className="text-xs bg-primary">Lead</Badge>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={handleClearCrewLead}
                            className="text-xs"
                            title="Remove crew lead"
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Team Members */}
                  {teamMembers.length > 0 && (
                    <div className="ml-6 space-y-2">
                      {teamMembers.map((member: any) => (
                        <div key={member.id} className="p-2 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm">👤 {member.name}</p>
                              <p className="text-xs text-foreground/60">{member.role}</p>
                              {member.phone && <p className="text-xs text-foreground/60">📱 {member.phone}</p>}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetCrewLead(member.id)}
                              className="text-xs"
                              disabled={setCrewLeadMutation.isPending}
                            >
                              {setCrewLeadMutation.isPending ? "Setting..." : "Make Lead"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <Link href={`/crews/${crew.id}`} asChild>
              <Button size="sm" variant="outline" className="flex-1">
                <Users className="w-4 h-4 mr-2" />
                Manage Members
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(crew)}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(crew.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
          <p className="text-foreground/60">Manage your roofing crews and team members</p>
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
                  placeholder="e.g., North Side Team"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Crew description"
                />
              </div>
              <div>
                <Label htmlFor="crewLead">Crew Lead Name</Label>
                <Input
                  id="crewLead"
                  value={formData.crewLead}
                  onChange={(e) => setFormData({ ...formData, crewLead: e.target.value })}
                  placeholder="Crew lead name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email address"
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
            <CrewCard key={crew.id} crew={crew} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-foreground/60">No crews yet. Create one to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
