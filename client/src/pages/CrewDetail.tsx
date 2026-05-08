import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit2, Trash2, Plus, Phone, Mail, User } from "lucide-react";

export default function CrewDetail() {
  const [, params] = useRoute("/crews/:id");
  const crewId = params?.id ? parseInt(params.id) : null;

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "crew_member",
  });

  const { data: crew, isLoading: crewLoading } = trpc.crews.getById.useQuery(
    { id: crewId! },
    { enabled: !!crewId }
  );

  const { data: members, refetch: refetchMembers } = trpc.crews.getMembers.useQuery(
    { crewId: crewId! },
    { enabled: !!crewId }
  );

  const addMemberMutation = trpc.crews.addMember.useMutation();
  const updateMemberMutation = trpc.crews.updateMember.useMutation();
  const deleteMemberMutation = trpc.crews.deleteMember.useMutation();

  const handleAddMember = async () => {
    if (!crewId || !formData.firstName.trim() || !formData.lastName.trim()) {
      alert("Please fill in first and last name");
      return;
    }

    try {
      await addMemberMutation.mutateAsync({
        crewId,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        role: formData.role,
      });
      setFormData({ firstName: "", lastName: "", email: "", phone: "", role: "crew_member" });
      setIsAddingMember(false);
      refetchMembers();
    } catch (error) {
      console.error("Error adding member:", error);
    }
  };

  const handleUpdateMember = async () => {
    if (!editingMemberId || !formData.firstName.trim() || !formData.lastName.trim()) {
      alert("Please fill in first and last name");
      return;
    }

    try {
      await updateMemberMutation.mutateAsync({
        id: editingMemberId,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        role: formData.role,
      });
      setFormData({ firstName: "", lastName: "", email: "", phone: "", role: "crew_member" });
      setIsEditingMember(false);
      setEditingMemberId(null);
      refetchMembers();
    } catch (error) {
      console.error("Error updating member:", error);
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMemberId) return;

    try {
      await deleteMemberMutation.mutateAsync({ id: deletingMemberId });
      setDeletingMemberId(null);
      refetchMembers();
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  const startEditMember = (member: any) => {
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email || "",
      phone: member.phone || "",
      role: member.role,
    });
    setEditingMemberId(member.id);
    setIsEditingMember(true);
  };

  if (crewLoading) {
    return <div className="p-8">Loading crew details...</div>;
  }

  if (!crew) {
    return <div className="p-8">Crew not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{crew.name}</h1>
          <p className="text-gray-600 mt-1">{crew.description || "No description"}</p>
        </div>
      </div>

      {/* Crew Members */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Crew Members</CardTitle>
            <CardDescription>{members?.length || 0} member(s)</CardDescription>
          </div>
          <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Crew Member</DialogTitle>
                <DialogDescription>Add a new member to this crew</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="555-1234"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="crew_member">Crew Member</option>
                    <option value="crew_lead">Crew Lead</option>
                    <option value="supervisor">Supervisor</option>
                  </select>
                </div>
                <Button onClick={handleAddMember} className="w-full">
                  Add Member
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {members && members.length > 0 ? (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <div className="flex gap-3 text-sm text-gray-600">
                          {member.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {member.email}
                            </div>
                          )}
                          {member.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {member.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{member.role.replace(/_/g, " ")}</Badge>
                    <Dialog open={isEditingMember && editingMemberId === member.id} onOpenChange={setIsEditingMember}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditMember(member)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Crew Member</DialogTitle>
                          <DialogDescription>Update member information</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>First Name</Label>
                              <Input
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Last Name</Label>
                              <Input
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <Input
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Role</Label>
                            <select
                              value={formData.role}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                              className="w-full px-3 py-2 border rounded-md"
                            >
                              <option value="crew_member">Crew Member</option>
                              <option value="crew_lead">Crew Lead</option>
                              <option value="supervisor">Supervisor</option>
                            </select>
                          </div>
                          <Button onClick={handleUpdateMember} className="w-full">
                            Save Changes
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog open={deletingMemberId === member.id} onOpenChange={(open) => !open && setDeletingMemberId(null)}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingMemberId(member.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Member</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {member.name} from this crew? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-2">
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteMember} className="bg-red-600 hover:bg-red-700">
                            Delete
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No crew members yet. Add one to get started.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
