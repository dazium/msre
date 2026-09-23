import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import EstimateForm from "@/pages/EstimateForm";
import { PhotoUpload } from "@/components/PhotoUpload";
import { toast } from "sonner";
import {
  Edit2,
  Phone,
  Mail,
  MapPin,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  BriefcaseBusiness,
  Camera,
} from "lucide-react";


const noteTypeColors: Record<string, string> = {
  call: "bg-blue-100 text-blue-800",
  email: "bg-purple-100 text-purple-800",
  meeting: "bg-green-100 text-green-800",
  follow_up: "bg-yellow-100 text-yellow-800",
  general: "bg-gray-100 text-gray-800",
  quote_sent: "bg-orange-100 text-orange-800",
  contract_signed: "bg-emerald-100 text-emerald-800",
};

const statusColors: Record<string, string> = {
  lead: "bg-blue-100 text-blue-800",
  contacted: "bg-purple-100 text-purple-800",
  qualified: "bg-green-100 text-green-800",
  proposal_sent: "bg-yellow-100 text-yellow-800",
  won: "bg-emerald-100 text-emerald-800",
  lost: "bg-red-100 text-red-800",
};

const projectStatusColors: Record<string, string> = {
  lead: "bg-slate-100 text-slate-800",
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  on_hold: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function CustomerDetail() {
  const [, params] = useRoute("/customers/:id");
  const [, navigate] = useLocation();
  const customerId = params?.id ? parseInt(params.id) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isEstimatePickerOpen, setIsEstimatePickerOpen] = useState(false);
  const [isEstimateFormOpen, setIsEstimateFormOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [selectedEstimateProjectId, setSelectedEstimateProjectId] = useState("");
  const [selectedPhotoProjectId, setSelectedPhotoProjectId] = useState("");
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    companyName: string;
    preferredContactMethod: "phone" | "email" | "text" | "in_person";
    roofType: string;
    status: "lead" | "contacted" | "qualified" | "proposal_sent" | "won" | "lost";
  }>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    companyName: "",
    preferredContactMethod: "phone",
    roofType: "",
    status: "lead",
  });

  const [noteData, setNoteData] = useState({
    title: "",
    content: "",
    noteType: "general" as const,
  });

  // Queries
  const { data: customer, isLoading, refetch } = trpc.customers.getById.useQuery(
    { id: customerId! },
    { enabled: !!customerId }
  );

  const { data: projects } = trpc.projects.listByCustomer.useQuery(
    { customerId: customerId! },
    { enabled: !!customerId }
  );

  const { data: notes, refetch: refetchNotes } = trpc.customerNotes.list.useQuery(
    { customerId: customerId! },
    { enabled: !!customerId }
  );

  const { data: lifetimeValue } = trpc.customers.getLifetimeValue.useQuery(
    { customerId: customerId! },
    { enabled: !!customerId }
  );

  const { data: projectSummary } = trpc.customers.getProjectSummary.useQuery(
    { customerId: customerId! },
    { enabled: !!customerId }
  );

  // Mutations
  const updateMutation = trpc.customers.update.useMutation();
  const deleteMutation = trpc.customers.delete.useMutation();
  const createNoteMutation = trpc.customerNotes.create.useMutation();
  const deleteNoteMutation = trpc.customerNotes.delete.useMutation();

  const handleEdit = () => {
    if (customer) {
      setFormData({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        zipCode: customer.zipCode || "",
        companyName: customer.companyName || "",
        preferredContactMethod: (customer.preferredContactMethod as any) || "phone",
        roofType: customer.roofType || "",
        status: customer.status,
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!customerId) return;
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim()) {
      toast.error("First name, last name, and phone are required.");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: customerId,
        ...formData,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        zipCode: formData.zipCode.trim() || null,
        companyName: formData.companyName.trim() || null,
        roofType: formData.roofType.trim() || null,
      });
      setIsEditing(false);
      await refetch();
      toast.success("Customer updated");
    } catch {
      toast.error("Customer could not be updated");
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerId || !customer) return;
    if (!window.confirm(`Delete ${customer.firstName} ${customer.lastName} and all linked jobs and records? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync({ id: customerId });
      toast.success("Customer deleted");
      navigate("/customers");
    } catch {
      toast.error("Customer could not be deleted");
    }
  };

  const handleAddNote = async () => {
    if (!noteData.title.trim() || !noteData.content.trim() || !customerId) return;
    try {
      await createNoteMutation.mutateAsync({
        customerId,
        title: noteData.title,
        content: noteData.content,
        noteType: noteData.noteType,
      });
      setNoteData({ title: "", content: "", noteType: "general" });
      setIsAddingNote(false);
      refetchNotes();
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await deleteNoteMutation.mutateAsync({ id: noteId });
      refetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  // Sort projects by date (newest first)
  const sortedProjects = useMemo(() => {
    if (!projects) return [];
    return [...projects].sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [projects]);

  const openNewJob = () => {
    if (!customerId) return;
    navigate(`/projects?new=1&customerId=${customerId}`);
  };

  const openNewEstimate = () => {
    if (sortedProjects.length === 0) {
      toast.error("Create a job before starting an estimate for this customer.");
      return;
    }

    if (sortedProjects.length === 1) {
      setSelectedEstimateProjectId(sortedProjects[0].id.toString());
      setIsEstimateFormOpen(true);
      return;
    }

    setIsEstimatePickerOpen(true);
  };

  const openPhotoAttachment = () => {
    if (sortedProjects.length === 0) {
      toast.error("Create a job before attaching photos to this customer timeline.");
      return;
    }
    setSelectedPhotoProjectId((current) => current || sortedProjects[0].id.toString());
    setIsPhotoDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading customer details...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-center">Customer not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{customer.firstName} {customer.lastName}</h1>
          <p className="text-gray-600 text-sm mt-1">
            {customer.companyName && `${customer.companyName} • `}
            Customer since {new Date(customer.createdAt).toLocaleDateString()}
          </p>
          <Badge className={`mt-2 ${statusColors[customer.status]}`}>{customer.status}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button onClick={openNewJob} className="min-h-11 gap-2">
            <BriefcaseBusiness className="h-4 w-4" />
            New Job
          </Button>
          <Button onClick={openNewEstimate} variant="outline" className="min-h-11 gap-2">
            <FileText className="h-4 w-4" />
            New Estimate
          </Button>
          <Button onClick={() => setIsAddingNote(true)} variant="outline" className="min-h-11 gap-2">
            <Plus className="h-4 w-4" />
            Quick Note
          </Button>
          <Button onClick={openPhotoAttachment} variant="outline" className="min-h-11 gap-2">
            <Camera className="h-4 w-4" />
            Add Photo
          </Button>
          <Button onClick={handleEdit} variant="outline" className="col-span-2 min-h-11 gap-2 sm:col-span-1">
            <Edit2 className="h-4 w-4" />
            Edit Customer
          </Button>
          <Button onClick={handleDeleteCustomer} variant="destructive" className="col-span-2 min-h-11 gap-2 sm:col-span-1" disabled={deleteMutation.isPending}>
            <Trash2 className="h-4 w-4" />
            {deleteMutation.isPending ? "Deleting..." : "Delete Customer"}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Lifetime Value</p>
              <p className="text-2xl font-bold">${lifetimeValue?.toFixed(2) || "0.00"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold">{projectSummary?.totalProjects || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold">{projectSummary?.activeProjects || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold">{projectSummary?.completedProjects || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEstimatePickerOpen} onOpenChange={setIsEstimatePickerOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Choose a Job for the Estimate</DialogTitle>
            <DialogDescription>Estimates are linked to a specific customer job.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="estimate-project">Job *</Label>
              <Select value={selectedEstimateProjectId} onValueChange={setSelectedEstimateProjectId}>
                <SelectTrigger id="estimate-project"><SelectValue placeholder="Select a job" /></SelectTrigger>
                <SelectContent>
                  {sortedProjects.map((project) => <SelectItem key={project.id} value={project.id.toString()}>{project.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="min-h-11 w-full" onClick={() => {
              if (!selectedEstimateProjectId) return toast.error("Select a job for this estimate.");
              setIsEstimatePickerOpen(false);
              setIsEstimateFormOpen(true);
            }}>Continue to Estimate</Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedEstimateProjectId && customerId && (
        <EstimateForm
          projectId={Number(selectedEstimateProjectId)}
          customerId={customerId}
          open={isEstimateFormOpen}
          onOpenChange={setIsEstimateFormOpen}
          hideTrigger
          customerContext={(() => {
            const selectedProject = sortedProjects.find((project) => project.id.toString() === selectedEstimateProjectId);
            return selectedProject ? {
              customerName: `${customer.firstName} ${customer.lastName}`.trim(),
              phone: customer.phone,
              email: customer.email,
              address: customer.address,
              city: customer.city,
              state: customer.state,
              zipCode: customer.zipCode,
              jobTitle: selectedProject.title,
              jobDescription: selectedProject.description,
              jobStatus: selectedProject.status,
              roofType: selectedProject.roofType,
            } : undefined;
          })()}
        />
      )}

      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Timeline Photos</DialogTitle>
            <DialogDescription>Select the customer job that should own these photos. Files are stored on that project timeline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="photo-project">Job *</Label>
              <Select value={selectedPhotoProjectId} onValueChange={setSelectedPhotoProjectId}>
                <SelectTrigger id="photo-project"><SelectValue placeholder="Select a job" /></SelectTrigger>
                <SelectContent>
                  {sortedProjects.map((project) => <SelectItem key={project.id} value={project.id.toString()}>{project.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedPhotoProjectId ? (
              <PhotoUpload projectId={Number(selectedPhotoProjectId)} maxFiles={10} />
            ) : (
              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Choose a job to attach its timeline photos.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{customer.phone || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{customer.email || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 md:col-span-2">
              <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium">
                  {customer.address && `${customer.address}, ${customer.city}, ${customer.state} ${customer.zipCode}`}
                  {!customer.address && "Not provided"}
                </p>
              </div>
            </div>

            {customer.roofType && (
              <div>
                <p className="text-sm text-gray-600">Roof Type</p>
                <p className="font-medium">{customer.roofType}</p>
              </div>
            )}

            {customer.preferredContactMethod && (
              <div>
                <p className="text-sm text-gray-600">Preferred Contact</p>
                <p className="font-medium capitalize">{customer.preferredContactMethod.replace("_", " ")}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
          <CardDescription>{sortedProjects.length} project(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedProjects.length > 0 ? (
            <div className="space-y-4">
              {sortedProjects.map((project, index) => (
                <div key={project.id} className="relative pb-4">
                  {/* Timeline line */}
                  {index < sortedProjects.length - 1 && (
                    <div className="absolute left-5 top-12 w-0.5 h-12 bg-gray-200"></div>
                  )}

                  {/* Timeline dot */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 border-2 border-blue-500">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>

                    {/* Project card */}
                    <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{project.title}</h3>
                          <p className="text-sm text-gray-600">{project.description}</p>
                        </div>
                        <Badge className={projectStatusColors[project.status]}>
                          {project.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                        {project.startDate && (
                          <div>
                            <p className="text-gray-600">Start Date</p>
                            <p className="font-medium">{new Date(project.startDate).toLocaleDateString()}</p>
                          </div>
                        )}
                        {project.endDate && (
                          <div>
                            <p className="text-gray-600">End Date</p>
                            <p className="font-medium">{new Date(project.endDate).toLocaleDateString()}</p>
                          </div>
                        )}
                        {project.estimatedValue && (
                          <div>
                            <p className="text-gray-600">Estimated Value</p>
                            <p className="font-medium">${parseFloat(project.estimatedValue as any).toFixed(2)}</p>
                          </div>
                        )}
                        {project.actualValue && (
                          <div>
                            <p className="text-gray-600">Actual Value</p>
                            <p className="font-medium">${parseFloat(project.actualValue as any).toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No projects yet</p>
          )}
        </CardContent>
      </Card>

      {/* Contact History & Notes */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Contact History</CardTitle>
            <CardDescription>{notes?.length || 0} note(s)</CardDescription>
          </div>
          <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Contact Note</DialogTitle>
                <DialogDescription>Record an interaction or note about this customer</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="note-type">Interaction Type</Label>
                  <Select
                    value={noteData.noteType}
                    onValueChange={(value: any) =>
                      setNoteData({ ...noteData, noteType: value })
                    }
                  >
                    <SelectTrigger id="note-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">In-Person Meeting</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                      <SelectItem value="quote_sent">Quote Sent</SelectItem>
                      <SelectItem value="contract_signed">Contract Signed</SelectItem>
                      <SelectItem value="general">General Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="note-title">Title</Label>
                  <Input
                    id="note-title"
                    value={noteData.title}
                    onChange={(e) => setNoteData({ ...noteData, title: e.target.value })}
                    placeholder="e.g., Discussed roof replacement options"
                  />
                </div>

                <div>
                  <Label htmlFor="note-content">Details</Label>
                  <Textarea
                    id="note-content"
                    value={noteData.content}
                    onChange={(e) => setNoteData({ ...noteData, content: e.target.value })}
                    placeholder="Enter details about this interaction..."
                    rows={4}
                  />
                </div>

                <Button onClick={handleAddNote} className="w-full" disabled={createNoteMutation.isPending}>
                  {createNoteMutation.isPending ? "Saving..." : "Save Note"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {notes && notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={noteTypeColors[note.noteType]}>
                          {note.noteType.replace("_", " ")}
                        </Badge>
                        <p className="text-xs text-gray-500">
                          {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <h4 className="font-semibold">{note.title}</h4>
                      <p className="text-sm text-gray-700 mt-1">{note.content}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-gray-400 hover:text-red-600 transition"
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No contact history yet. Add your first note!</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
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
                <Label>Company Name</Label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
              <div>
                <Label>Roof Type</Label>
                <Input
                  value={formData.roofType}
                  onChange={(e) => setFormData({ ...formData, roofType: e.target.value })}
                  placeholder="e.g., Asphalt Shingles"
                />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div>
                <Label>Zip Code</Label>
                <Input
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                />
              </div>
              <div>
                <Label>Preferred Contact Method</Label>
                <Select
                  value={formData.preferredContactMethod}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, preferredContactMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="in_person">In Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleSave}
              className="w-full"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
