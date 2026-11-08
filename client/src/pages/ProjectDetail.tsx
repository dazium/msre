import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, CheckCircle2, Circle, Clock3, DollarSign, MapPin, FileText, Users, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { canConfirmCrewAssignment } from "@/lib/crewAssignment";
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const [editingCrew, setEditingCrew] = useState(false);
  const [pendingCrewId, setPendingCrewId] = useState<number | null>(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    status: "lead",
    startDate: "",
    endDate: "",
    estimatedValue: "",
    actualValue: "",
    roofType: "asphalt_shingle",
  });
  const projectId = parseInt(params.id);

  const { data: project, isLoading: projectLoading } = trpc.projects.getById.useQuery(
    { id: projectId },
    { enabled: !!projectId }
  );

  const { data: customer, isLoading: customerLoading } = trpc.customers.getById.useQuery(
    { id: project?.customerId ?? 0 },
    { enabled: !!project?.customerId }
  );

  const { data: damages } = trpc.damages.listByProject.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const { data: estimates } = trpc.estimates.list.useQuery();
  const projectEstimates = estimates?.filter(e => e.projectId === projectId);

  const { data: crew } = trpc.crews.getById.useQuery(
    { id: project?.crewId ?? 0 },
    { enabled: !!project?.crewId }
  );

  const { data: crews } = trpc.crews.list.useQuery();
  const utils = trpc.useUtils();
  const updateProjectMutation = trpc.projects.update.useMutation();
  const deleteProjectMutation = trpc.projects.delete.useMutation();

  const assignCrewMutation = trpc.projects.assignCrew.useMutation({
    onSuccess: () => {
      void utils.projects.getById.invalidate({ id: projectId });
      void utils.crews.getById.invalidate();
      setEditingCrew(false);
      setPendingCrewId(null);
    },
  });

  const removeCrewMutation = trpc.projects.removeCrew.useMutation({
    onSuccess: () => {
      void utils.projects.getById.invalidate({ id: projectId });
      void utils.crews.getById.invalidate();
    },
  });

  const openProjectEditor = () => {
    if (!project) return;
    setProjectForm({
      title: project.title,
      description: project.description ?? "",
      status: project.status,
      startDate: project.startDate ? String(project.startDate).slice(0, 10) : "",
      endDate: project.endDate ? String(project.endDate).slice(0, 10) : "",
      estimatedValue: project.estimatedValue ?? "",
      actualValue: project.actualValue ?? "",
      roofType: project.roofType,
    });
    setIsEditingProject(true);
  };

  const saveProject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectForm.title.trim()) return;
    try {
      await updateProjectMutation.mutateAsync({
        id: projectId,
        title: projectForm.title.trim(),
        description: projectForm.description.trim() || null,
        status: projectForm.status as any,
        startDate: projectForm.startDate ? new Date(`${projectForm.startDate}T00:00:00`) : null,
        endDate: projectForm.endDate ? new Date(`${projectForm.endDate}T00:00:00`) : null,
        estimatedValue: projectForm.estimatedValue || null,
        actualValue: projectForm.actualValue || null,
        roofType: projectForm.roofType as any,
      });
      await utils.projects.getById.invalidate({ id: projectId });
      setIsEditingProject(false);
      toast.success("Project updated");
    } catch {
      toast.error("The project could not be saved. Please check the fields and try again.");
    }
  };

  const deleteProject = async () => {
    if (!project) return;
    if (!window.confirm(`Delete “${project.title}” and its linked estimates, inspections, damages, photos, and appointments? This cannot be undone.`)) return;
    try {
      await deleteProjectMutation.mutateAsync({ id: projectId });
      setLocation("/projects");
    } catch {
      toast.error("The project could not be deleted.");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      lead: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
      scheduled: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
      in_progress: "bg-orange-500/10 text-orange-400 border border-orange-500/30",
      completed: "bg-green-500/10 text-green-400 border border-green-500/30",
      on_hold: "bg-red-500/10 text-red-400 border border-red-500/30",
      cancelled: "bg-gray-500/10 text-gray-400 border border-gray-500/30",
    };
    return colors[status] || "bg-foreground/5 text-foreground";
  };

  const CrewSelector = ({ selectedCrewId, onSelect }: { selectedCrewId?: number | null; onSelect: (crewId: number) => void }) => (
    <div className="space-y-3">
      <Select value={selectedCrewId?.toString() || ""} onValueChange={(value) => onSelect(parseInt(value, 10))}>
        <SelectTrigger className="min-h-11 w-full">
          <SelectValue placeholder="Select a crew..." />
        </SelectTrigger>
        <SelectContent>
          {crews?.map((c) => (
            <SelectItem key={c.id} value={c.id.toString()}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        className="min-h-11 w-full"
        onClick={() => selectedCrewId && assignCrewMutation.mutate({ projectId, crewId: selectedCrewId })}
        disabled={!canConfirmCrewAssignment(selectedCrewId, assignCrewMutation.isPending)}
      >
        {assignCrewMutation.isPending ? "Assigning..." : "Confirm Assignment"}
      </Button>
    </div>
  );

  const getCrewWithMembers = () => {
    if (!crew) return null;
    return crew;
  };

  const getDamageColor = (severity: string) => {
    const colors: Record<string, string> = {
      minor: "bg-green-500/10 text-green-400",
      moderate: "bg-yellow-500/10 text-yellow-400",
      severe: "bg-red-500/10 text-red-400",
    };
    return colors[severity] || "bg-foreground/5 text-foreground";
  };

  if (projectLoading || customerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-foreground/60">Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-foreground/60">Project not found</p>
        <Button onClick={() => setLocation("/projects")}>Back to Projects</Button>
      </div>
    );
  }

  const statusRank: Record<string, number> = { lead: 0, scheduled: 1, in_progress: 2, completed: 3 };
  const projectMilestones = [
    { label: "Project created", date: project.createdAt, completed: true, detail: "Customer record and project workspace created" },
    { label: "Estimate activity", date: projectEstimates?.[0]?.createdAt, completed: Boolean(projectEstimates?.length), detail: projectEstimates?.length ? `${projectEstimates.length} estimate${projectEstimates.length === 1 ? "" : "s"} linked` : "Create an estimate to price the work" },
    { label: "Work scheduled", date: project.startDate, completed: (statusRank[project.status] ?? 0) >= 1 && Boolean(project.startDate), detail: project.startDate ? `Starts ${formatDate(project.startDate)}` : "Set a project start date" },
    { label: "Target completion", date: project.endDate, completed: project.status === "completed", detail: project.endDate ? `Target ${formatDate(project.endDate)}` : "Set a target end date" },
  ];

  return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/projects")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Button>
        </div>

        {/* Project Title and Status */}
        <div className="blueprint-section">
          <div className="blueprint-header p-6 flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">{project.title}</h1>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(project.status)}`}>
                {project.status.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex">
              <Button type="button" variant="outline" className="min-h-11 gap-2" onClick={openProjectEditor}>
                <Edit2 className="h-4 w-4" />
                Edit Project
              </Button>
              <Button type="button" variant="destructive" className="min-h-11 gap-2" onClick={deleteProject} disabled={deleteProjectMutation.isPending}>
                <Trash2 className="h-4 w-4" />
                {deleteProjectMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={isEditingProject} onOpenChange={setIsEditingProject}>
          <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto">
            <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
            <form onSubmit={saveProject} className="space-y-4">
              <div>
                <Label htmlFor="edit-project-title">Project Title *</Label>
                <Input id="edit-project-title" value={projectForm.title} onChange={(event) => setProjectForm((current) => ({ ...current, title: event.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-project-description">Description</Label>
                <textarea id="edit-project-description" value={projectForm.description} onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground" rows={4} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-project-status">Status</Label>
                  <Select value={projectForm.status} onValueChange={(value) => setProjectForm((current) => ({ ...current, status: value }))}>
                    <SelectTrigger id="edit-project-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['lead', 'scheduled', 'in_progress', 'completed', 'on_hold', 'cancelled'].map((status) => <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-project-roof-type">Roof Type</Label>
                  <Select value={projectForm.roofType} onValueChange={(value) => setProjectForm((current) => ({ ...current, roofType: value }))}>
                    <SelectTrigger id="edit-project-roof-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['asphalt_shingle', 'metal', 'flat', 'tile', 'cedar'].map((roofType) => <SelectItem key={roofType} value={roofType}>{roofType.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><Label htmlFor="edit-project-start">Start Date</Label><Input id="edit-project-start" type="date" value={projectForm.startDate} onChange={(event) => setProjectForm((current) => ({ ...current, startDate: event.target.value }))} /></div>
                <div><Label htmlFor="edit-project-end">Target End Date</Label><Input id="edit-project-end" type="date" value={projectForm.endDate} onChange={(event) => setProjectForm((current) => ({ ...current, endDate: event.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><Label htmlFor="edit-project-estimated">Estimated Value (CAD)</Label><Input id="edit-project-estimated" type="number" min="0" step="0.01" value={projectForm.estimatedValue} onChange={(event) => setProjectForm((current) => ({ ...current, estimatedValue: event.target.value }))} /></div>
                <div><Label htmlFor="edit-project-actual">Actual Value (CAD)</Label><Input id="edit-project-actual" type="number" min="0" step="0.01" value={projectForm.actualValue} onChange={(event) => setProjectForm((current) => ({ ...current, actualValue: event.target.value }))} /></div>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setIsEditingProject(false)}>Cancel</Button>
                <Button type="submit" disabled={updateProjectMutation.isPending}>{updateProjectMutation.isPending ? "Saving..." : "Save Changes"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Project details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {project.description && (
              <Card className="blueprint-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80 whitespace-pre-wrap">{project.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Project Timeline */}
            <Card className="blueprint-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-5 before:absolute before:bottom-5 before:left-[11px] before:top-5 before:w-px before:bg-border">
                  {projectMilestones.map((milestone) => (
                    <div key={milestone.label} className="relative flex gap-3">
                      <div className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-card">
                        {milestone.completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-foreground/30" />}
                      </div>
                      <div className="min-w-0 flex-1 pb-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <p className={`font-semibold ${milestone.completed ? "text-foreground" : "text-foreground/60"}`}>{milestone.label}</p>
                          {milestone.date && <time className="text-xs text-foreground/60">{formatDate(milestone.date)}</time>}
                        </div>
                        <p className="mt-1 text-sm text-foreground/60">{milestone.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-2 rounded border border-dashed border-border p-3 text-xs text-foreground/60"><Clock3 className="h-4 w-4 shrink-0" />Timeline updates as estimates, dates, and project status change.</div>
              </CardContent>
            </Card>

            {/* Assigned Crew */}
            {crew && (
              <Card className="blueprint-card border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Assigned Crew
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setPendingCrewId(project.crewId ?? null); setEditingCrew(!editingCrew); }}
                    >
                      {editingCrew ? "Cancel" : "Change"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeCrewMutation.mutate({ projectId })}
                      disabled={removeCrewMutation.isPending}
                    >
                      {removeCrewMutation.isPending ? "Removing..." : "Remove"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!editingCrew ? (
                    <>
                      <div>
                        <p className="text-sm text-foreground/60 mb-2">Crew Name</p>
                        <p className="text-foreground font-semibold text-lg">{crew.name}</p>
                      </div>
                      {crew.description && (
                        <div>
                          <p className="text-sm text-foreground/60 mb-2">Description</p>
                          <p className="text-foreground/80">{crew.description}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <CrewSelector
                      selectedCrewId={pendingCrewId ?? project.crewId}
                      onSelect={(crewId) => setPendingCrewId(crewId)}
                    />
                  )}
                </CardContent>
              </Card>
            )}
            {!crew && project.crewId && (
              <Card className="blueprint-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Assigned Crew
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/60">Crew information loading...</p>
                </CardContent>
              </Card>
            )}
            {!project.crewId && (
              <Card className="blueprint-card border-border/50 border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Assigned Crew
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!editingCrew ? (
                    <div className="flex items-center justify-between">
                      <p className="text-foreground/60">No crew assigned to this project</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setPendingCrewId(null); setEditingCrew(true); }}
                      >
                        Assign Crew
                      </Button>
                    </div>
                  ) : (
                    <CrewSelector
                      selectedCrewId={pendingCrewId ?? undefined}
                      onSelect={(crewId) => setPendingCrewId(crewId)}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Damages */}
            <Card className="blueprint-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Damages & Inspections ({damages?.length || 0})</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setLocation("/damages")}>
                  Manage Damages
                </Button>
              </CardHeader>
              <CardContent>
                {(!damages || damages.length === 0) ? (
                  <p className="text-sm text-foreground/60 py-2">
                    No damages or inspection records for this project yet. Visit the Damages section to add assessments.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {damages.map((damage) => (
                      <div key={damage.id} className="p-3 rounded-lg bg-foreground/5 border border-border/30">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-foreground">{damage.category.replace("_", " ")}</p>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${getDamageColor(damage.severity)}`}>
                            {damage.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/70">{damage.description}</p>
                        {damage.location && (
                          <p className="text-xs text-foreground/60 mt-2">Location: {damage.location}</p>
                        )}
                        {damage.estimatedCost && (
                          <p className="text-sm text-primary font-semibold mt-2">
                            Est. Cost: ${parseFloat(damage.estimatedCost as any).toFixed(2)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estimates */}
            <Card className="blueprint-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Estimates ({projectEstimates?.length || 0})</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setLocation("/estimates")}>
                  Manage Estimates
                </Button>
              </CardHeader>
              <CardContent>
                {(!projectEstimates || projectEstimates.length === 0) ? (
                  <p className="text-sm text-foreground/60 py-2">
                    No estimates created for this project yet. Visit Estimates to create one.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {projectEstimates.map((estimate) => (
                      <div key={estimate.id} className="p-3 rounded-lg bg-foreground/5 border border-border/30">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-foreground">{estimate.title}</p>
                            <p className="text-xs text-foreground/60">#{estimate.estimateNumber}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(estimate.status)}`}>
                            {estimate.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-primary font-semibold">
                          Total: ${parseFloat(estimate.total as any).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column - Customer info and financials */}
          <div className="space-y-6">
            {/* Customer Card */}
            {customer && (
              <Card className="blueprint-card border-border/50">
                <CardHeader>
                  <CardTitle>Customer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Name</p>
                    <p className="text-foreground font-semibold">
                      {customer.firstName} {customer.lastName}
                    </p>
                  </div>
                  {customer.email && (
                    <div>
                      <p className="text-sm text-foreground/60 mb-1">Email</p>
                      <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                        {customer.email}
                      </a>
                    </div>
                  )}
                  {customer.phone && (
                    <div>
                      <p className="text-sm text-foreground/60 mb-1">Phone</p>
                      <a href={`tel:${customer.phone}`} className="text-primary hover:underline">
                        {customer.phone}
                      </a>
                    </div>
                  )}
                  {customer.address && (
                    <div>
                      <p className="text-sm text-foreground/60 mb-1">Address</p>
                      <p className="text-foreground text-sm">
                        {customer.address}
                        {customer.city && `, ${customer.city}`}
                        {customer.state && ` ${customer.state}`}
                        {customer.zipCode && ` ${customer.zipCode}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Financial Summary */}
            <Card className="blueprint-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-foreground/60 mb-1">Estimated Value</p>
                  <p className="text-2xl font-bold text-primary">
                    {project.estimatedValue ? `$${parseFloat(project.estimatedValue as any).toFixed(2)}` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60 mb-1">Actual Value</p>
                  <p className="text-2xl font-bold text-foreground">
                    {project.actualValue ? `$${parseFloat(project.actualValue as any).toFixed(2)}` : "Not set"}
                  </p>
                </div>
                {projectEstimates && projectEstimates.length > 0 && (
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Total Estimates</p>
                    <p className="text-lg font-semibold text-foreground">
                      ${projectEstimates.reduce((sum, e) => sum + parseFloat(e.total as any), 0).toFixed(2)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
}
