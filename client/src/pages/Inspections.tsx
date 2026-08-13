import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ClipboardCheck, Plus, Trash2, CheckCircle2, AlertTriangle, Circle, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getInspectionTemplate, getRoofTypeLabel, type RoofType } from "@/lib/inspectionTemplates";

type ItemStatus = "pending" | "pass" | "attention" | "fail" | "not_applicable";

type Project = { id: number; title: string; customerId: number; roofType?: RoofType | null };
type Customer = { id: number; firstName: string; lastName: string };

const statusLabels: Record<ItemStatus, string> = {
  pending: "Pending",
  pass: "Pass",
  attention: "Attention",
  fail: "Fail",
  not_applicable: "N/A",
};

function itemStatusClass(status: ItemStatus) {
  if (status === "pass") return "border-emerald-500/40 bg-emerald-500/10";
  if (status === "attention") return "border-amber-500/40 bg-amber-500/10";
  if (status === "fail") return "border-red-500/40 bg-red-500/10";
  return "border-border bg-card";
}

function inspectionStatusVariant(status: "draft" | "in_progress" | "completed") {
  if (status === "completed") return "default" as const;
  if (status === "in_progress") return "secondary" as const;
  return "outline" as const;
}

export default function Inspections() {
  const utils = trpc.useUtils();
  const inspectionsQuery = trpc.inspections.list.useQuery();
  const projectsQuery = trpc.projects.list.useQuery();
  const customersQuery = trpc.customers.list.useQuery();
  const inspections = inspectionsQuery.data ?? [];
  const projects = (projectsQuery.data ?? []) as Project[];
  const customers = (customersQuery.data ?? []) as Customer[];
  const [selectedInspectionId, setSelectedInspectionId] = useState<number | null>(null);
  const [projectId, setProjectId] = useState("");
  const [inspectorName, setInspectorName] = useState("");
  const [notes, setNotes] = useState("");
  const [newCategory, setNewCategory] = useState("Roof Surface");
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    if (selectedInspectionId === null && inspections.length > 0) {
      setSelectedInspectionId(inspections[0].id);
    }
  }, [inspections, selectedInspectionId]);

  const selected = selectedInspectionId === null
    ? undefined
    : inspections.find((inspection) => inspection.id === selectedInspectionId);
  const detailQuery = trpc.inspections.getById.useQuery(
    { id: selectedInspectionId ?? 0 },
    { enabled: selectedInspectionId !== null },
  );
  const selectedDetails = detailQuery.data;

  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const customerById = useMemo(() => new Map(customers.map((customer) => [customer.id, customer])), [customers]);
  const newInspectionProject = projectById.get(Number(projectId));
  const newInspectionRoofType = newInspectionProject?.roofType ?? "asphalt_shingle";

  const createInspection = trpc.inspections.create.useMutation({
    onSuccess: (result) => {
      setSelectedInspectionId(result.inspection?.id ?? null);
      setProjectId("");
      setInspectorName("");
      setNotes("");
      void utils.inspections.list.invalidate();
      toast.success("Inspection created", { description: "The checklist is ready for review." });
    },
    onError: (error) => toast.error("Could not create inspection", { description: error.message }),
  });

  const updateInspection = trpc.inspections.update.useMutation({
    onSuccess: () => {
      void utils.inspections.list.invalidate();
      void utils.inspections.getById.invalidate();
    },
    onError: (error) => toast.error("Could not update inspection", { description: error.message }),
  });

  const createItem = trpc.inspections.createItem.useMutation({
    onSuccess: () => {
      setNewLabel("");
      void utils.inspections.getById.invalidate({ id: selectedInspectionId ?? 0 });
      toast.success("Custom inspection point added", { description: "The new checkpoint was appended to this checklist." });
    },
    onError: (error) => toast.error("Could not add checklist item", { description: error.message }),
  });

  const updateItem = trpc.inspections.updateItem.useMutation({
    onSuccess: () => void utils.inspections.getById.invalidate({ id: selectedInspectionId ?? 0 }),
    onError: (error) => toast.error("Could not update checklist item", { description: error.message }),
  });

  const deleteItem = trpc.inspections.deleteItem.useMutation({
    onSuccess: () => void utils.inspections.getById.invalidate({ id: selectedInspectionId ?? 0 }),
    onError: (error) => toast.error("Could not delete checklist item", { description: error.message }),
  });

  const selectedProject = selected ? projectById.get(selected.projectId) : undefined;
  const selectedCustomer = selected ? customerById.get(selected.customerId) : undefined;
  const completedCount = selectedDetails?.items.filter((item) => item.status === "pass" || item.status === "not_applicable").length ?? 0;
  const totalCount = selectedDetails?.items.length ?? 0;

  const handleCreate = () => {
    const project = projectById.get(Number(projectId));
    if (!project) {
      toast.error("Select a project", { description: "An inspection must be linked to a project." });
      return;
    }
    createInspection.mutate({
      projectId: project.id,
      customerId: project.customerId,
      inspectorName: inspectorName.trim() || undefined,
      roofType: newInspectionRoofType,
      notes: notes.trim() || undefined,
      items: getInspectionTemplate(newInspectionRoofType).map(([category, label]) => ({ category, label })),
    });
  };

  const handleAddItem = () => {
    const category = newCategory.trim();
    const label = newLabel.trim();
    if (!selectedInspectionId) return;
    if (!category) {
      toast.error("Enter a category", { description: "Custom inspection points need a category." });
      return;
    }
    if (!label) {
      toast.error("Enter an inspection point", { description: "Add a short description of what should be checked." });
      return;
    }
    createItem.mutate({ inspectionId: selectedInspectionId, category, label });
  };

  if (inspectionsQuery.isLoading || projectsQuery.isLoading || customersQuery.isLoading) {
    return <div className="container py-6"><Card><CardContent className="p-6 text-muted-foreground">Loading inspections...</CardContent></Card></div>;
  }

  return (
    <div className="container space-y-6 py-4 sm:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary"><ClipboardCheck className="h-4 w-4" /> Field operations</div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Inspections</h1>
          <p className="mt-1 text-sm text-muted-foreground">Run consistent roof inspections, record findings, and close the loop with the project team.</p>
        </div>
        <Button asChild variant="outline" className="min-h-11 self-start"><Link href="/projects"><ArrowLeft className="mr-2 h-4 w-4" />Projects</Link></Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.6fr)]">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader><CardTitle className="text-lg">Start an inspection</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {projects.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Create a project first, then start its inspection checklist.</div>
            ) : (
              <>
                <label className="space-y-2 text-sm font-medium">Project
                  <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select a project</option>
                    {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                  </select>
                </label>
                {projectId && <div className="rounded-lg border border-primary/20 bg-background/70 p-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="font-semibold">Standard template</span><Badge>{getRoofTypeLabel(newInspectionRoofType)}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{getInspectionTemplate(newInspectionRoofType).length} roof-specific checkpoints will be added.</p></div>}
                <label className="space-y-2 text-sm font-medium">Inspector name <Input value={inspectorName} onChange={(event) => setInspectorName(event.target.value)} placeholder="Optional" /></label>
                <label className="space-y-2 text-sm font-medium">Initial notes <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Weather, access notes, customer concerns..." rows={3} /></label>
                <Button onClick={handleCreate} disabled={createInspection.isPending || !projectId} className="min-h-11 w-full"><Plus className="mr-2 h-4 w-4" />{createInspection.isPending ? "Creating..." : "Create inspection"}</Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Inspection history</CardTitle></CardHeader>
          <CardContent>
            {inspections.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"><ClipboardCheck className="mx-auto mb-3 h-8 w-8 opacity-60" /><p>No inspections yet.</p><p className="mt-1">Create one from the panel to begin a documented roof review.</p></div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {inspections.map((inspection) => {
                  const project = projectById.get(inspection.projectId);
                  const customer = customerById.get(inspection.customerId);
                  return <button key={inspection.id} type="button" onClick={() => setSelectedInspectionId(inspection.id)} className={`min-h-24 rounded-lg border p-4 text-left transition-colors hover:border-primary ${selectedInspectionId === inspection.id ? "border-primary bg-primary/10" : "bg-card"}`}>
                    <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-semibold">{project?.title ?? `Project #${inspection.projectId}`}</p><p className="truncate text-sm text-muted-foreground">{customer ? `${customer.firstName} ${customer.lastName}` : `Customer #${inspection.customerId}`}</p></div><Badge variant={inspectionStatusVariant(inspection.status)}>{inspection.status.replace("_", " ")}</Badge></div>
                    <p className="mt-3 text-xs text-muted-foreground">{getRoofTypeLabel(inspection.roofType)} · {inspection.inspectedAt ? `Inspected ${new Date(inspection.inspectedAt).toLocaleDateString()}` : "Not completed"}</p>
                  </button>;
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selected && selectedDetails && (
        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div><CardTitle>{selectedProject?.title ?? `Inspection #${selected.id}`}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : "Customer details unavailable"} · {getRoofTypeLabel(selected.roofType ?? selectedProject?.roofType)} · {completedCount}/{totalCount} checklist items cleared</p></div>
            <div className="flex flex-col gap-2 sm:flex-row"><select value={selected.status} onChange={(event) => updateInspection.mutate({ id: selected.id, status: event.target.value as "draft" | "in_progress" | "completed" })} className="min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="draft">Draft</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select><Button asChild variant="outline" className="min-h-11"><Link href={`/projects/${selected.projectId}`}>View project</Link></Button></div>
          </CardHeader>
          <CardContent className="space-y-5">
            {selected.notes && <div className="rounded-lg border bg-muted/30 p-4 text-sm"><span className="font-semibold">Inspection notes:</span> {selected.notes}</div>}
            <div className="space-y-3">
              {selectedDetails.items.map((item) => <div key={item.id} className={`rounded-lg border p-3 ${itemStatusClass(item.status as ItemStatus)}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.category}</p><p className="font-medium">{item.label}</p></div><div className="flex items-center gap-2"><select value={item.status} onChange={(event) => updateItem.mutate({ id: item.id, inspectionId: selected.id, status: event.target.value as ItemStatus })} className="min-h-11 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm sm:flex-none">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><Button variant="ghost" size="icon" onClick={() => deleteItem.mutate({ id: item.id, inspectionId: selected.id })} aria-label={`Delete ${item.label}`} className="min-h-11 min-w-11"><Trash2 className="h-4 w-4" /></Button></div></div>
                {item.status === "fail" && <p className="mt-2 flex items-center gap-2 text-sm text-red-600"><AlertTriangle className="h-4 w-4" />Requires corrective action before closeout.</p>}
                {item.status === "pass" && <p className="mt-2 flex items-center gap-2 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" />Passed inspection point.</p>}
              </div>)}
            </div>
            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4"><p className="text-sm font-semibold">Add custom inspection point</p><p className="mb-3 mt-1 text-xs text-muted-foreground">Append a project-specific checkpoint without changing the standardized roof-type template.</p><div className="grid gap-3 sm:grid-cols-[0.8fr_1.5fr_auto]"><Input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} maxLength={100} placeholder="Category, e.g. Customer concern" aria-label="Custom inspection point category" /><Input value={newLabel} onChange={(event) => setNewLabel(event.target.value)} maxLength={255} placeholder="Inspection point" aria-label="Custom inspection point label" /><Button onClick={handleAddItem} disabled={createItem.isPending || !newCategory.trim() || !newLabel.trim()} className="min-h-11"><Plus className="mr-2 h-4 w-4" />{createItem.isPending ? "Adding..." : "Add point"}</Button></div></div>
            {selected.status !== "completed" && <Button onClick={() => updateInspection.mutate({ id: selected.id, status: "completed" })} disabled={updateInspection.isPending} className="min-h-11"><CheckCircle2 className="mr-2 h-4 w-4" />Mark inspection complete</Button>}
            {selected.status === "completed" && <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700"><Circle className="h-4 w-4 fill-current" />Inspection completed and timestamped.</div>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
