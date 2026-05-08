import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Calendar } from "lucide-react";

interface CrewMemberSkillsProps {
  crewMemberId: number;
}

export default function CrewMemberSkills({ crewMemberId }: CrewMemberSkillsProps) {
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    skillName: "",
    certificationNumber: "",
    expirationDate: "",
    isActive: true,
  });

  const { data: skills, refetch: refetchSkills } = trpc.crews.getSkills.useQuery({
    crewMemberId,
  });

  const addSkillMutation = trpc.crews.addSkill.useMutation();
  const deleteSkillMutation = trpc.crews.deleteSkill.useMutation();

  const handleAddSkill = async () => {
    if (!formData.skillName.trim()) {
      alert("Please enter a skill name");
      return;
    }

    try {
      await addSkillMutation.mutateAsync({
        crewMemberId,
        skillName: formData.skillName,
        certificationNumber: formData.certificationNumber || undefined,
        expirationDate: formData.expirationDate ? new Date(formData.expirationDate) : undefined,
        isActive: formData.isActive,
      });
      setFormData({
        skillName: "",
        certificationNumber: "",
        expirationDate: "",
        isActive: true,
      });
      setIsAddingSkill(false);
      refetchSkills();
    } catch (error) {
      console.error("Error adding skill:", error);
    }
  };

  const handleDeleteSkill = async () => {
    if (!deletingSkillId) return;

    try {
      await deleteSkillMutation.mutateAsync({ id: deletingSkillId });
      setDeletingSkillId(null);
      refetchSkills();
    } catch (error) {
      console.error("Error deleting skill:", error);
    }
  };

  const isExpiringSoon = (expirationDate: Date | null) => {
    if (!expirationDate) return false;
    const daysUntilExpiration = Math.floor((new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 30 && daysUntilExpiration > 0;
  };

  const isExpired = (expirationDate: Date | null) => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>Skills & Certifications</CardTitle>
          <CardDescription>{skills?.length || 0} skill(s)</CardDescription>
        </div>
        <Dialog open={isAddingSkill} onOpenChange={setIsAddingSkill}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Skill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Skill/Certification</DialogTitle>
              <DialogDescription>Add a new skill or certification for this crew member</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Skill Name *</Label>
                <Input
                  value={formData.skillName}
                  onChange={(e) => setFormData({ ...formData, skillName: e.target.value })}
                  placeholder="e.g., Asphalt Roofing, Metal Roofing, Safety Harness"
                />
              </div>
              <div>
                <Label>Certification Number</Label>
                <Input
                  value={formData.certificationNumber}
                  onChange={(e) => setFormData({ ...formData, certificationNumber: e.target.value })}
                  placeholder="e.g., CERT-12345"
                />
              </div>
              <div>
                <Label>Expiration Date</Label>
                <Input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                />
                <Label>Active</Label>
              </div>
              <Button onClick={handleAddSkill} className="w-full">
                Add Skill
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {skills && skills.length > 0 ? (
          <div className="space-y-3">
            {skills.map((skill: any) => (
              <div key={skill.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{skill.skillName}</p>
                    {!skill.isActive && <Badge variant="secondary">Inactive</Badge>}
                    {isExpired(skill.expirationDate) && <Badge variant="destructive">Expired</Badge>}
                    {isExpiringSoon(skill.expirationDate) && <Badge variant="outline" className="bg-yellow-50">Expiring Soon</Badge>}
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600 mt-1">
                    {skill.certificationNumber && (
                      <span>Cert: {skill.certificationNumber}</span>
                    )}
                    {skill.expirationDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(skill.expirationDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <AlertDialog open={deletingSkillId === skill.id} onOpenChange={(open) => !open && setDeletingSkillId(null)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingSkillId(skill.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Skill</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove "{skill.skillName}" from this crew member's skills? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-2">
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteSkill} className="bg-red-600 hover:bg-red-700">
                        Delete
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No skills added yet. Add one to get started.</p>
        )}
      </CardContent>
    </Card>
  );
}
