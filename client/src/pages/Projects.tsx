import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Calendar,
  ChevronRight,
  CircleDollarSign,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  Users,
} from "lucide-react";
import { ROOF_TYPES, ROOF_TYPE_LABELS, type RoofType } from "@/lib/inspectionTemplates";

const PROJECT_STATUSES = [
  { value: "lead", label: "Lead", accent: "border-blue-400", badge: "bg-blue-400/15 text-blue-300" },
  { value: "scheduled", label: "Scheduled", accent: "border-amber-400", badge: "bg-amber-400/15 text-amber-300" },
  { value: "in_progress", label: "In Progress", accent: "border-orange-400", badge: "bg-orange-400/15 text-orange-300" },
  { value: "on_hold", label: "On Hold", accent: "border-red-400", badge: "bg-red-400/15 text-red-300" },
  { value: "completed", label: "Completed", accent: "border-emerald-400", badge: "bg-emerald-400/15 text-emerald-300" },
  { value: "cancelled", label: "Cancelled", accent: "border-slate-400", badge: "bg-slate-400/15 text-slate-300" },
] as const;

type ProjectStatus = (typeof PROJECT_STATUSES)[number]["value"];
type ViewMode = "board" | "list";

const currencyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

function getStatusConfig(status: string) {
  return PROJECT_STATUSES.find((item) => item.value === status) ?? PROJECT_STATUSES[0];
}

function getCrewName(
  crewId: number | null | undefined,
  crews: Array<{ id: number; name: string }> | undefined,
) {
  if (!crewId) return "Unassigned";
  return crews?.find((crew) => crew.id === crewId)?.name ?? "Unknown crew";
}

export default function Projects() {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [crewFilter, setCrewFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [formData, setFormData] = useState({
    customerId: "",
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    estimatedValue: "",
    roofType: "asphalt_shingle" as RoofType,
    crewId: "unassigned",
  });

  const { data: customers } = trpc.customers.list.useQuery();
  const { data: crews } = trpc.crews.list.useQuery();
  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery();
  const createMutation = trpc.projects.create.useMutation();
  const updateMutation = trpc.projects.update.useMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") setIsOpen(true);
  }, []);

  const filteredProjects = useMemo(() => {
    return (projects ?? []).filter((project) => {
      const matchesSearch = [project.title, project.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      const matchesCrew =
        crewFilter === "all" ||
        (crewFilter === "unassigned" && !project.crewId) ||
        (crewFilter !== "unassigned" && project.crewId?.toString() === crewFilter);

      return matchesSearch && matchesStatus && matchesCrew;
    });
  }, [crewFilter, projects, searchTerm, statusFilter]);

  const boardColumns = useMemo(
    () =>
      PROJECT_STATUSES.map((status) => ({
        ...status,
        projects: filteredProjects.filter((project) => project.status === status.value),
      })),
    [filteredProjects],
  );

  const activeProjectCount = filteredProjects.filter((project) =>
    ["scheduled", "in_progress", "on_hold"].includes(project.status),
  ).length;
  const scheduledProjectCount = filteredProjects.filter((project) => project.status === "scheduled").length;
  const pipelineValue = filteredProjects
    .filter((project) => project.status !== "cancelled")
    .reduce((total, project) => total + Number(project.estimatedValue ?? 0), 0);

  const resetForm = () => {
    setFormData({
      customerId: "",
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      estimatedValue: "",
      roofType: "asphalt_shingle",
      crewId: "unassigned",
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.customerId || !formData.title.trim()) {
      toast.error("A customer and project title are required.");
      return;
    }

    try {
      const project = await createMutation.mutateAsync({
        customerId: Number(formData.customerId),
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        status: "lead",
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        estimatedValue: formData.estimatedValue || undefined,
        roofType: formData.roofType,
        crewId: formData.crewId === "unassigned" ? undefined : Number(formData.crewId),
      });

      toast.success("Project created. Opening its details now.");
      resetForm();
      setIsOpen(false);
      if (project?.id) {
        setLocation(`/projects/${project.id}`);
      } else {
        await refetch();
      }
    } catch {
      toast.error("The project could not be created. Please try again.");
    }
  };

  const handleStatusChange = async (projectId: number, status: ProjectStatus) => {
    try {
      await updateMutation.mutateAsync({ id: projectId, status });
      await refetch();
      toast.success(`Project moved to ${getStatusConfig(status).label}.`);
    } catch {
      toast.error("The project status could not be updated. Please try again.");
    }
  };

  const projectCard = (project: (typeof filteredProjects)[number]) => {
    const status = getStatusConfig(project.status);
    const projectValue = Number(project.estimatedValue ?? 0);

    return (
      <article
        key={project.id}
        onClick={() => setLocation(`/projects/${project.id}`)}
        className={`blueprint-card cursor-pointer border-l-4 ${status.accent} p-4 transition-all hover:blueprint-glow`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-foreground">{project.title}</h3>
            {project.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-foreground/65">{project.description}</p>
            ) : (
              <p className="mt-1 text-sm italic text-foreground/40">No project description</p>
            )}
          </div>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-foreground/45" aria-hidden="true" />
        </div>

        <div className="mt-4 space-y-2 text-xs text-foreground/65">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span className="truncate">{getCrewName(project.crewId, crews)}</span>
          </div>
          {project.startDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>Starts {new Date(project.startDate).toLocaleDateString("en-CA")}</span>
            </div>
          )}
          {project.estimatedValue && (
            <div className="flex items-center gap-2 font-semibold text-primary">
              <CircleDollarSign className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{currencyFormatter.format(projectValue)}</span>
            </div>
          )}
        </div>

        <div className="mt-4" onClick={(event) => event.stopPropagation()}>
          <Label htmlFor={`project-status-${project.id}`} className="sr-only">
            Project status
          </Label>
          <Select
            value={project.status}
            onValueChange={(nextStatus) => handleStatusChange(project.id, nextStatus as ProjectStatus)}
            disabled={updateMutation.isPending}
          >
            <SelectTrigger id={`project-status-${project.id}`} className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUSES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-6">
      <section className="blueprint-section">
        <div className="blueprint-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Operations board</p>
            <h1 className="mt-1 text-3xl font-bold">Projects</h1>
            <p className="mt-1 text-sm text-foreground/65">Track every job from incoming lead through completion.</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] w-[95vw] max-w-full overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="customerId">Customer *</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => setFormData((current) => ({ ...current, customerId: value }))}
                  >
                    <SelectTrigger id="customerId">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.firstName} {customer.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Roof replacement — north side"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Scope, site notes, and key work details..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(event) => setFormData((current) => ({ ...current, startDate: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Target End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(event) => setFormData((current) => ({ ...current, endDate: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="estimatedValue">Estimated Value (CAD)</Label>
                    <Input
                      id="estimatedValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.estimatedValue}
                      onChange={(event) => setFormData((current) => ({ ...current, estimatedValue: event.target.value }))}
                      placeholder="5000.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="roofType">Roof Type</Label>
                    <Select value={formData.roofType} onValueChange={(value) => setFormData((current) => ({ ...current, roofType: value as RoofType }))}>
                      <SelectTrigger id="roofType"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROOF_TYPES.map((roofType) => <SelectItem key={roofType} value={roofType}>{ROOF_TYPE_LABELS[roofType]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">Used to prefill standardized inspection checklists.</p>
                  </div>

                  <div>
                    <Label htmlFor="crewId">Assign Crew (Optional)</Label>
                    <Select
                      value={formData.crewId || "unassigned"}
                      onValueChange={(value) => setFormData((current) => ({ ...current, crewId: value }))}
                    >
                      <SelectTrigger id="crewId">
                        <SelectValue placeholder="Select a crew" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">No crew assigned</SelectItem>
                        {crews?.map((crew) => (
                          <SelectItem key={crew.id} value={crew.id.toString()}>
                            {crew.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Project"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="blueprint-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/55">Active jobs</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{activeProjectCount}</p>
          <p className="mt-1 text-xs text-foreground/55">Scheduled, in progress, or on hold</p>
        </div>
        <div className="blueprint-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/55">Ready to schedule</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{scheduledProjectCount}</p>
          <p className="mt-1 text-xs text-foreground/55">Jobs currently on the calendar</p>
        </div>
        <div className="blueprint-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/55">Visible pipeline value</p>
          <p className="mt-2 text-3xl font-bold text-primary">{currencyFormatter.format(pipelineValue)}</p>
          <p className="mt-1 text-xs text-foreground/55">Excludes cancelled projects</p>
        </div>
      </section>

      <section className="blueprint-section">
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search title or description..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {PROJECT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="crew">Assigned Crew</Label>
              <Select value={crewFilter} onValueChange={setCrewFilter}>
                <SelectTrigger id="crew">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All crews</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {crews?.map((crew) => (
                    <SelectItem key={crew.id} value={crew.id.toString()}>
                      {crew.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground/65">
              Showing <strong className="text-foreground">{filteredProjects.length}</strong> project{filteredProjects.length === 1 ? "" : "s"}
            </p>
            <div className="inline-flex w-full rounded-md border border-border p-1 sm:w-auto" aria-label="Project view">
              <Button
                type="button"
                size="sm"
                variant={viewMode === "board" ? "default" : "ghost"}
                className="flex-1 gap-2 sm:flex-none"
                onClick={() => setViewMode("board")}
              >
                <LayoutGrid className="h-4 w-4" />
                Board
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "list" ? "default" : "ghost"}
                className="flex-1 gap-2 sm:flex-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
                List
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="blueprint-section">
        <div className="p-6">
          {isLoading ? (
            <p className="py-12 text-center text-foreground/60">Loading projects...</p>
          ) : filteredProjects.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-medium text-foreground">No projects match the current view.</p>
              <p className="mt-1 text-sm text-foreground/60">
                {projects?.length === 0 ? "Create the first project to start your workflow." : "Change or clear the filters to see more projects."}
              </p>
            </div>
          ) : viewMode === "board" ? (
            <div className="-mx-2 overflow-x-auto px-2 pb-4">
              <div className="grid min-w-[1320px] grid-cols-6 gap-4">
                {boardColumns.map((column) => (
                  <div key={column.value} className="rounded-lg bg-background/35 p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${column.badge}`}>{column.label}</span>
                      <span className="text-xs font-medium text-foreground/55">{column.projects.length}</span>
                    </div>
                    <div className="space-y-3">
                      {column.projects.length > 0 ? (
                        column.projects.map(projectCard)
                      ) : (
                        <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-foreground/45">
                          No projects
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">{filteredProjects.map(projectCard)}</div>
          )}
        </div>
      </section>
    </div>
  );
}
