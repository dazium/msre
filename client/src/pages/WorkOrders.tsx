import { type ComponentType, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/DatePicker";
import { dateFromInput } from "@/lib/datePicker";
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
import { CalendarClock, ClipboardPlus, Clock3, FileCheck2, Filter, MapPin, Plus, Search, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { WORK_ORDER_JOB_TYPES, WORK_ORDER_JOB_TYPE_LABELS, WORK_ORDER_STATUSES, WORK_ORDER_STATUS_LABELS, type WorkOrderJobType, type WorkOrderStatus } from "@shared/subcontractor";

const statusAccent: Record<WorkOrderStatus, string> = {
  new: "bg-sky-400/15 text-sky-300 border-sky-400/25",
  reviewed: "bg-blue-400/15 text-blue-300 border-blue-400/25",
  accepted: "bg-cyan-400/15 text-cyan-300 border-cyan-400/25",
  scheduled: "bg-violet-400/15 text-violet-300 border-violet-400/25",
  assigned: "bg-indigo-400/15 text-indigo-300 border-indigo-400/25",
  in_progress: "bg-amber-400/15 text-amber-300 border-amber-400/25",
  waiting: "bg-orange-400/15 text-orange-300 border-orange-400/25",
  completed: "bg-emerald-400/15 text-emerald-300 border-emerald-400/25",
  ready_for_invoice: "bg-teal-400/15 text-teal-300 border-teal-400/25",
  invoiced: "bg-primary/15 text-primary border-primary/25",
  partially_paid: "bg-lime-400/15 text-lime-300 border-lime-400/25",
  paid: "bg-green-400/15 text-green-300 border-green-400/25",
  closed: "bg-slate-400/15 text-slate-300 border-slate-400/25",
  cancelled: "bg-slate-400/15 text-slate-300 border-slate-400/25",
  on_hold: "bg-orange-400/15 text-orange-300 border-orange-400/25",
  disputed: "bg-red-400/15 text-red-300 border-red-400/25",
  callback_required: "bg-rose-400/15 text-rose-300 border-rose-400/25",
};

type ScopeDraft = { category: WorkOrderJobType; description: string; quantity: string; unit: string };

const emptyScope = (): ScopeDraft => ({ category: "other", description: "", quantity: "", unit: "" });

const todayInput = () => new Date().toISOString().slice(0, 10);

function MetricCard({ label, value, Icon, accent }: { label: string; value: number; Icon: ComponentType<{ className?: string }>; accent: string }) {
  return (
    <div className="blueprint-card p-4">
      <div className="flex items-start justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-foreground/55">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>
        <div className={`rounded-lg p-2 ${accent}`}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}

export default function WorkOrders() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | WorkOrderStatus>("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [form, setForm] = useState({
    companyId: "",
    jobSiteId: "",
    contactId: "none",
    workOrderNumber: "",
    purchaseOrderNumber: "",
    receivedAt: todayInput(),
    requestedStartDate: "",
    deadline: "",
    jobType: "other" as WorkOrderJobType,
    scopeSummary: "",
    materialsSummary: "",
    labourRequirements: "",
    crewRequirements: "",
    specialInstructions: "",
    estimatedValue: "",
    agreedPrice: "",
    additionalCharges: "0.00",
    taxRate: "13.00",
  });
  const [scopes, setScopes] = useState<ScopeDraft[]>([]);

  const { data: companies = [] } = trpc.companies.list.useQuery();
  const selectedCompanyId = Number(form.companyId);
  const { data: jobSites = [] } = trpc.companies.jobSites.list.useQuery(
    { companyId: selectedCompanyId, includeInactive: false },
    { enabled: selectedCompanyId > 0 },
  );
  const { data: contacts = [] } = trpc.companies.contacts.list.useQuery(
    { companyId: selectedCompanyId },
    { enabled: selectedCompanyId > 0 },
  );
  const { data: workOrders = [], isLoading } = trpc.workOrders.list.useQuery({
    companyId: companyFilter === "all" ? undefined : Number(companyFilter),
    status: statusFilter === "all" ? undefined : statusFilter,
    search: search.trim() || undefined,
  });

  const createWorkOrder = trpc.workOrders.create.useMutation({
    onSuccess: async (workOrder) => {
      await utils.workOrders.list.invalidate();
      toast.success("Work order created.");
      setIsCreateOpen(false);
      setForm({ companyId: "", jobSiteId: "", contactId: "none", workOrderNumber: "", purchaseOrderNumber: "", receivedAt: todayInput(), requestedStartDate: "", deadline: "", jobType: "other", scopeSummary: "", materialsSummary: "", labourRequirements: "", crewRequirements: "", specialInstructions: "", estimatedValue: "", agreedPrice: "", additionalCharges: "0.00", taxRate: "13.00" });
      setScopes([]);
      setLocation(`/work-orders/${workOrder.id}`);
    },
    onError: (error) => toast.error(error.message || "Work order could not be created."),
  });

  const metrics = useMemo(() => ({
    newOrders: workOrders.filter((order) => order.status === "new").length,
    active: workOrders.filter((order) => ["scheduled", "assigned", "in_progress"].includes(order.status)).length,
    waiting: workOrders.filter((order) => order.status === "waiting").length,
    readyForInvoice: workOrders.filter((order) => order.status === "ready_for_invoice").length,
    overdue: workOrders.filter((order) => order.deadline && new Date(order.deadline).getTime() < new Date().setHours(0, 0, 0, 0) && !["paid", "closed", "cancelled"].includes(order.status)).length,
  }), [workOrders]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCompanyId || !Number(form.jobSiteId) || !form.scopeSummary.trim()) {
      toast.error("Company, job site, and scope summary are required.");
      return;
    }
    const validScopes = scopes.filter((scope) => scope.description.trim());
    if (validScopes.length !== scopes.length) {
      toast.error("Complete or remove empty structured scope rows.");
      return;
    }
    createWorkOrder.mutate({
      companyId: selectedCompanyId,
      jobSiteId: Number(form.jobSiteId),
      contactId: form.contactId === "none" ? undefined : Number(form.contactId),
      workOrderNumber: form.workOrderNumber.trim() || undefined,
      purchaseOrderNumber: form.purchaseOrderNumber.trim() || undefined,
      receivedAt: dateFromInput(form.receivedAt),
      requestedStartDate: dateFromInput(form.requestedStartDate),
      deadline: dateFromInput(form.deadline),
      jobType: form.jobType,
      scopeSummary: form.scopeSummary.trim(),
      materialsSummary: form.materialsSummary.trim() || undefined,
      labourRequirements: form.labourRequirements.trim() || undefined,
      crewRequirements: form.crewRequirements.trim() || undefined,
      specialInstructions: form.specialInstructions.trim() || undefined,
      estimatedValue: form.estimatedValue || undefined,
      agreedPrice: form.agreedPrice || undefined,
      additionalCharges: form.additionalCharges || "0.00",
      taxRate: form.taxRate || "13.00",
      scopes: validScopes.map((scope) => ({ category: scope.category, description: scope.description.trim(), quantity: scope.quantity || undefined, unit: scope.unit.trim() || undefined })),
    });
  };

  return (
    <div className="space-y-6">
      <section className="blueprint-section">
        <div className="blueprint-header flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Primary operations queue</p>
            <h1 className="mt-1 text-3xl font-bold">Work Orders</h1>
            <p className="mt-1 text-sm text-foreground/65">Receive, organize, assign, complete, bill, and collect subcontract work without duplicating job information.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild><Button className="gap-2"><ClipboardPlus className="h-4 w-4" /> New Work Order</Button></DialogTrigger>
            <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto">
              <DialogHeader><DialogTitle>New Work Order</DialogTitle><DialogDescription>Create the job from the partner company and reusable job site. Required operational data stays in one place for dispatch, completion, and invoicing.</DialogDescription></DialogHeader>
              {companies.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center"><p className="font-medium">Create a company account before receiving a work order.</p><Button className="mt-4" onClick={() => setLocation("/companies")}>Open Companies & Accounts</Button></div>
              ) : (
                <form onSubmit={submit} className="space-y-5">
                  <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 text-sm text-foreground/70"><strong className="text-foreground">Fast intake:</strong> company, job site, job type, and scope summary are enough to create a tracked work order. Add the remaining field details now or later before dispatch.</div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div><Label>Company *</Label><Select value={form.companyId} onValueChange={(value) => setForm((current) => ({ ...current, companyId: value, jobSiteId: "", contactId: "none" }))}><SelectTrigger><SelectValue placeholder="Select partner company" /></SelectTrigger><SelectContent>{companies.map((company) => <SelectItem key={company.id} value={company.id.toString()}>{company.name}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Job Site *</Label><Select value={form.jobSiteId} onValueChange={(value) => setForm((current) => ({ ...current, jobSiteId: value }))} disabled={!selectedCompanyId || jobSites.length === 0}><SelectTrigger><SelectValue placeholder={selectedCompanyId ? "Select job site" : "Select company first"} /></SelectTrigger><SelectContent>{jobSites.map((site) => <SelectItem key={site.id} value={site.id.toString()}>{site.name || site.address}{site.name ? ` — ${site.address}` : ""}</SelectItem>)}</SelectContent></Select>{selectedCompanyId > 0 && jobSites.length === 0 && <p className="mt-1 text-xs text-amber-300">This company has no active job sites yet. Add one from its account workspace.</p>}</div>
                    <div><Label>Company Contact</Label><Select value={form.contactId} onValueChange={(value) => setForm((current) => ({ ...current, contactId: value }))} disabled={!selectedCompanyId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No specific contact</SelectItem>{contacts.filter((contact) => contact.status === "active").map((contact) => <SelectItem key={contact.id} value={contact.id.toString()}>{contact.firstName} {contact.lastName}{contact.isPrimary ? " · Primary" : ""}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Job Type *</Label><Select value={form.jobType} onValueChange={(value) => setForm((current) => ({ ...current, jobType: value as WorkOrderJobType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{WORK_ORDER_JOB_TYPES.map((type) => <SelectItem key={type} value={type}>{WORK_ORDER_JOB_TYPE_LABELS[type]}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label htmlFor="wo-number">Work Order Number</Label><Input id="wo-number" value={form.workOrderNumber} onChange={(event) => setForm((current) => ({ ...current, workOrderNumber: event.target.value }))} placeholder="Auto-generated if blank" /></div>
                    <div><Label htmlFor="po-number">PO Number</Label><Input id="po-number" value={form.purchaseOrderNumber} onChange={(event) => setForm((current) => ({ ...current, purchaseOrderNumber: event.target.value }))} /></div>
                    <div><Label htmlFor="received-at">Date Received</Label><DatePicker id="received-at" value={form.receivedAt} onChange={(value) => setForm((current) => ({ ...current, receivedAt: value }))} placeholder="Select date received" /></div>
                    <div><Label htmlFor="deadline">Deadline</Label><DatePicker id="deadline" value={form.deadline} onChange={(value) => setForm((current) => ({ ...current, deadline: value }))} placeholder="Select deadline" /></div>
                    <div><Label htmlFor="requested-start">Requested Start</Label><DatePicker id="requested-start" value={form.requestedStartDate} onChange={(value) => setForm((current) => ({ ...current, requestedStartDate: value }))} placeholder="Select requested start" /></div>
                    <div><Label htmlFor="estimated-value">Estimated Value (CAD)</Label><Input id="estimated-value" type="number" min="0" step="0.01" value={form.estimatedValue} onChange={(event) => setForm((current) => ({ ...current, estimatedValue: event.target.value }))} /></div>
                    <div><Label htmlFor="agreed-price">Agreed Price (CAD)</Label><Input id="agreed-price" type="number" min="0" step="0.01" value={form.agreedPrice} onChange={(event) => setForm((current) => ({ ...current, agreedPrice: event.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="additional-charges">Additional Charges</Label><Input id="additional-charges" type="number" min="0" step="0.01" value={form.additionalCharges} onChange={(event) => setForm((current) => ({ ...current, additionalCharges: event.target.value }))} /></div><div><Label htmlFor="tax-rate">Tax Rate %</Label><Input id="tax-rate" type="number" min="0" step="0.01" value={form.taxRate} onChange={(event) => setForm((current) => ({ ...current, taxRate: event.target.value }))} /></div></div>
                  </div>
                  <div><Label htmlFor="scope-summary">Scope Summary *</Label><Textarea id="scope-summary" rows={5} value={form.scopeSummary} onChange={(event) => setForm((current) => ({ ...current, scopeSummary: event.target.value }))} placeholder="Describe the requested work, expected result, and site-specific scope." /></div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{([ ["materialsSummary", "Materials"], ["labourRequirements", "Labour Requirements"], ["crewRequirements", "Crew Requirements"] ] as const).map(([field, label]) => <div key={field}><Label htmlFor={`wo-${field}`}>{label}</Label><Textarea id={`wo-${field}`} rows={3} value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} /></div>)}</div>
                  <div><Label htmlFor="special-instructions">Special Instructions</Label><Textarea id="special-instructions" rows={3} value={form.specialInstructions} onChange={(event) => setForm((current) => ({ ...current, specialInstructions: event.target.value }))} /></div>
                  <div className="rounded-lg border border-border/70 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">Structured Scope</p><p className="text-xs text-foreground/60">Optional line items that become visible to crews and carry through completion.</p></div><Button type="button" size="sm" variant="outline" onClick={() => setScopes((current) => [...current, emptyScope()])}><Plus className="mr-1 h-4 w-4" /> Add Scope Item</Button></div>{scopes.length > 0 && <div className="mt-4 space-y-3">{scopes.map((scope, index) => <div key={index} className="grid grid-cols-1 gap-3 rounded-md bg-muted/30 p-3 sm:grid-cols-[170px_1fr_100px_100px_auto]"><Select value={scope.category} onValueChange={(value) => setScopes((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, category: value as WorkOrderJobType } : item))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{WORK_ORDER_JOB_TYPES.map((type) => <SelectItem key={type} value={type}>{WORK_ORDER_JOB_TYPE_LABELS[type]}</SelectItem>)}</SelectContent></Select><Input value={scope.description} onChange={(event) => setScopes((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))} placeholder="Scope item description" /><Input type="number" min="0" step="0.01" value={scope.quantity} onChange={(event) => setScopes((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: event.target.value } : item))} placeholder="Qty" /><Input value={scope.unit} onChange={(event) => setScopes((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, unit: event.target.value } : item))} placeholder="Unit" /><Button type="button" size="icon" variant="ghost" onClick={() => setScopes((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove scope item"><X className="h-4 w-4" /></Button></div>)}</div>}</div>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button><Button type="submit" disabled={createWorkOrder.isPending}>{createWorkOrder.isPending ? "Creating..." : "Create Work Order"}</Button></div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="New" value={metrics.newOrders} Icon={ClipboardPlus} accent="text-sky-300 bg-sky-400/15" />
        <MetricCard label="Active" value={metrics.active} Icon={Clock3} accent="text-amber-300 bg-amber-400/15" />
        <MetricCard label="Waiting" value={metrics.waiting} Icon={ShieldAlert} accent="text-orange-300 bg-orange-400/15" />
        <MetricCard label="Ready to Invoice" value={metrics.readyForInvoice} Icon={FileCheck2} accent="text-teal-300 bg-teal-400/15" />
        <MetricCard label="Overdue" value={metrics.overdue} Icon={CalendarClock} accent="text-red-300 bg-red-400/15" />
      </section>

      <section className="blueprint-section"><div className="p-5"><div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px_220px]"><div><Label htmlFor="work-order-search">Search work orders</Label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/45" /><Input id="work-order-search" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Work order, PO number, or scope..." /></div></div><div><Label>Status</Label><Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{WORK_ORDER_STATUSES.map((status) => <SelectItem key={status} value={status}>{WORK_ORDER_STATUS_LABELS[status]}</SelectItem>)}</SelectContent></Select></div><div><Label>Company</Label><Select value={companyFilter} onValueChange={setCompanyFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All companies</SelectItem>{companies.map((company) => <SelectItem key={company.id} value={company.id.toString()}>{company.name}</SelectItem>)}</SelectContent></Select></div></div></div></section>

      <section className="blueprint-section"><div className="flex items-center justify-between border-b border-border px-5 py-4"><h2 className="font-semibold">Operations Queue</h2><span className="text-xs text-foreground/55">{workOrders.length} result{workOrders.length === 1 ? "" : "s"}</span></div>{isLoading ? <div className="py-16 text-center text-foreground/60">Loading work orders...</div> : workOrders.length === 0 ? <div className="py-16 text-center"><ClipboardPlus className="mx-auto h-10 w-10 text-primary/70" /><p className="mt-4 font-medium">No work orders in this view.</p><p className="mt-1 text-sm text-foreground/60">Receive a new subcontract work order to start the operating workflow.</p></div> : <div className="divide-y divide-border">{workOrders.map((order) => { const deadlineIsOverdue = order.deadline && new Date(order.deadline).getTime() < new Date().setHours(0, 0, 0, 0) && !["paid", "closed", "cancelled"].includes(order.status); return <button key={order.id} type="button" onClick={() => setLocation(`/work-orders/${order.id}`)} className="group flex w-full items-start gap-4 px-5 py-5 text-left transition-colors hover:bg-muted/30"><div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary"><ClipboardPlus className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{order.workOrderNumber}</span><Badge variant="outline" className={statusAccent[order.status]}>{WORK_ORDER_STATUS_LABELS[order.status]}</Badge>{deadlineIsOverdue && <Badge variant="destructive">Deadline overdue</Badge>}</div><p className="mt-2 truncate text-sm font-medium text-foreground/85">{order.companyName} · {order.jobSiteName || order.jobSiteAddress}</p><p className="mt-1 line-clamp-2 text-sm text-foreground/60">{order.scopeSummary}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/55"><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{order.jobSiteAddress}{order.jobSiteCity ? `, ${order.jobSiteCity}` : ""}</span>{order.deadline && <span>Deadline: {new Date(order.deadline).toLocaleDateString("en-CA")}</span>}{order.agreedPrice && <span className="font-semibold text-primary">${Number(order.agreedPrice).toFixed(2)}</span>}</div></div><Filter className="mt-2 h-4 w-4 shrink-0 text-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" /></button>})}</div>}</section>
    </div>
  );
}
