import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Edit3,
  FileText,
  MapPin,
  MessageSquarePlus,
  Phone,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

const paymentTermLabels: Record<string, string> = {
  due_on_receipt: "Due on receipt",
  net_7: "Net 7",
  net_15: "Net 15",
  net_30: "Net 30",
  net_45: "Net 45",
  net_60: "Net 60",
  custom: "Custom",
};

const contactRoleLabels = {
  owner: "Owner",
  project_manager: "Project manager",
  site_supervisor: "Site supervisor",
  dispatcher: "Dispatcher",
  estimator: "Estimator",
  accounts_payable: "Accounts payable",
  accounts_receivable: "Accounts receivable",
  safety_coordinator: "Safety coordinator",
  other: "Other",
} as const;

type ContactRole = keyof typeof contactRoleLabels;

const emptyContact = {
  firstName: "",
  lastName: "",
  role: "other" as ContactRole,
  position: "",
  phone: "",
  mobile: "",
  email: "",
  preferredContactMethod: "email" as "phone" | "email" | "text" | "in_person",
  notes: "",
  isPrimary: false,
  status: "active" as "active" | "inactive",
};

const emptySite = {
  name: "",
  address: "",
  city: "",
  province: "Ontario",
  postalCode: "",
  propertyType: "residential" as "residential" | "commercial" | "industrial" | "multi_residential" | "institutional" | "other",
  siteContactName: "",
  siteContactPhone: "",
  accessInstructions: "",
  parkingInformation: "",
  roofInformation: "",
  safetyHazards: "",
  requiredEquipment: "",
  notes: "",
  isActive: true,
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function AgingRow({ label, amount }: { label: string; amount: number }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-foreground/65">{label}</span><span className={amount > 0 ? "font-semibold text-amber-300" : "text-foreground/50"}>${amount.toFixed(2)}</span></div>;
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/80">{value}</p>
    </div>
  );
}

export default function CompanyDetail({ params }: { params: { id: string } }) {
  const companyId = Number(params.id);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isSiteOpen, setIsSiteOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [accountDraft, setAccountDraft] = useState<Record<string, string>>({});
  const [contactDraft, setContactDraft] = useState(emptyContact);
  const [siteDraft, setSiteDraft] = useState(emptySite);
  const [noteDraft, setNoteDraft] = useState({ noteType: "general" as "general" | "communication" | "financial" | "operations" | "safety" | "dispute", content: "" });

  const { data: company, isLoading: companyLoading } = trpc.companies.getById.useQuery({ id: companyId }, { enabled: Number.isInteger(companyId) && companyId > 0 });
  const { data: contacts = [] } = trpc.companies.contacts.list.useQuery({ companyId }, { enabled: !!company });
  const { data: jobSites = [] } = trpc.companies.jobSites.list.useQuery({ companyId, includeInactive: true }, { enabled: !!company });
  const { data: notes = [] } = trpc.companies.notes.list.useQuery({ companyId }, { enabled: !!company });
  const { data: history = [] } = trpc.companies.history.useQuery({ companyId }, { enabled: !!company });
  const { data: financials } = trpc.companies.financials.useQuery({ companyId }, { enabled: !!company });

  const refreshAccount = async () => {
    await Promise.all([
      utils.companies.getById.invalidate({ id: companyId }),
      utils.companies.list.invalidate(),
      utils.companies.contacts.list.invalidate({ companyId }),
      utils.companies.jobSites.list.invalidate({ companyId, includeInactive: true }),
      utils.companies.notes.list.invalidate({ companyId }),
      utils.companies.history.invalidate({ companyId }),
      utils.companies.financials.invalidate({ companyId }),
    ]);
  };

  const updateCompany = trpc.companies.update.useMutation({
    onSuccess: async () => {
      await refreshAccount();
      setIsEditingAccount(false);
      toast.success("Company account updated.");
    },
    onError: (error) => toast.error(error.message || "Company account could not be updated."),
  });
  const createContact = trpc.companies.contacts.create.useMutation({
    onSuccess: async () => {
      await refreshAccount();
      setContactDraft(emptyContact);
      setIsContactOpen(false);
      toast.success("Company contact added.");
    },
    onError: (error) => toast.error(error.message || "Contact could not be added."),
  });
  const createSite = trpc.companies.jobSites.create.useMutation({
    onSuccess: async () => {
      await refreshAccount();
      setSiteDraft(emptySite);
      setIsSiteOpen(false);
      toast.success("Job site added.");
    },
    onError: (error) => toast.error(error.message || "Job site could not be added."),
  });
  const createNote = trpc.companies.notes.create.useMutation({
    onSuccess: async () => {
      await refreshAccount();
      setNoteDraft({ noteType: "general", content: "" });
      setIsNoteOpen(false);
      toast.success("Account note added.");
    },
    onError: (error) => toast.error(error.message || "Account note could not be added."),
  });

  const openAccountEditor = () => {
    if (!company) return;
    setAccountDraft({
      name: company.name,
      legalName: company.legalName ?? "",
      accountType: company.accountType,
      classification: company.classification ?? "",
      email: company.email ?? "",
      phone: company.phone ?? "",
      website: company.website ?? "",
      address: company.address ?? "",
      city: company.city ?? "",
      province: company.province ?? "",
      postalCode: company.postalCode ?? "",
      preferredContactMethod: company.preferredContactMethod,
      paymentTerms: company.paymentTerms,
      standardLabourRate: company.standardLabourRate ?? "",
      areasServed: company.areasServed ?? "",
      typicalWorkRequested: company.typicalWorkRequested ?? "",
      contractInformation: company.contractInformation ?? "",
      insuranceRequirements: company.insuranceRequirements ?? "",
      wsibRequirements: company.wsibRequirements ?? "",
      safetyRequirements: company.safetyRequirements ?? "",
      requiredDocumentation: company.requiredDocumentation ?? "",
      specialInstructions: company.specialInstructions ?? "",
      notes: company.notes ?? "",
      status: company.status,
    });
    setIsEditingAccount(true);
  };

  if (companyLoading) return <div className="py-20 text-center text-foreground/60">Loading company account...</div>;
  if (!company) {
    return (
      <div className="py-20 text-center">
        <p className="font-medium">Company account not found.</p>
        <Button className="mt-4" onClick={() => setLocation("/companies")}>Back to Companies</Button>
      </div>
    );
  }

  const primaryContact = contacts.find((contact) => contact.isPrimary) ?? contacts[0];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => setLocation("/companies")}>
        <ArrowLeft className="h-4 w-4" /> Back to Companies
      </Button>

      <section className="blueprint-section">
        <div className="blueprint-header flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={company.accountType === "partner" ? "default" : "secondary"}>{company.accountType === "partner" ? "Subcontractor / Partner" : "Direct customer"}</Badge>
              <Badge variant={company.status === "active" ? "outline" : "secondary"} className="capitalize">{company.status.replace("_", " ")}</Badge>
            </div>
            <h1 className="mt-3 break-words text-3xl font-bold">{company.name}</h1>
            {company.legalName && company.legalName !== company.name && <p className="mt-1 text-sm text-foreground/60">Legal name: {company.legalName}</p>}
            <p className="mt-2 text-sm text-foreground/65">{paymentTermLabels[company.paymentTerms]} · {company.classification || "Partner account"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={openAccountEditor}><Edit3 className="h-4 w-4" /> Edit Account</Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5 text-primary" /> Contacts</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setIsContactOpen(true)}><Plus className="mr-1 h-4 w-4" /> Add Contact</Button>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-foreground/60">No contacts yet. Add the dispatcher, project manager, or accounts-payable contact before the first work order arrives.</div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="rounded-lg border border-border/70 bg-background/30 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">{contact.firstName} {contact.lastName}</p>
                          <p className="mt-0.5 text-xs text-foreground/60">{contact.position || contactRoleLabels[contact.role]}</p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          {contact.isPrimary && <Badge className="text-[10px]">Primary</Badge>}
                          {contact.status === "inactive" && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                        </div>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-foreground/65">
                        {contact.email && <a className="block hover:text-primary hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a>}
                        {(contact.mobile || contact.phone) && <a className="block hover:text-primary hover:underline" href={`tel:${contact.mobile || contact.phone}`}>{contact.mobile || contact.phone}</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-lg"><MapPin className="h-5 w-5 text-primary" /> Job Sites</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setIsSiteOpen(true)}><Plus className="mr-1 h-4 w-4" /> Add Job Site</Button>
            </CardHeader>
            <CardContent>
              {jobSites.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-foreground/60">No job sites yet. Reusable job sites keep repeat work organized under the same company account.</div>
              ) : (
                <div className="space-y-3">
                  {jobSites.map((site) => (
                    <div key={site.id} className="rounded-lg border border-border/70 bg-background/30 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold">{site.name || site.address}</p>
                          {site.name && <p className="mt-1 text-sm text-foreground/65">{site.address}</p>}
                          <p className="mt-1 text-xs text-foreground/55">{[site.city, site.province, site.postalCode].filter(Boolean).join(", ")} · {site.propertyType.replace("_", " ")}</p>
                        </div>
                        {!site.isActive && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      {(site.siteContactName || site.accessInstructions || site.safetyHazards) && (
                        <div className="mt-3 grid gap-3 border-t border-border/60 pt-3 text-sm sm:grid-cols-3">
                          {site.siteContactName && <DetailField label="Site contact" value={`${site.siteContactName}${site.siteContactPhone ? ` · ${site.siteContactPhone}` : ""}`} />}
                          <DetailField label="Access" value={site.accessInstructions} />
                          <DetailField label="Safety hazards" value={site.safetyHazards} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-lg"><MessageSquarePlus className="h-5 w-5 text-primary" /> Account Notes</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setIsNoteOpen(true)}><Plus className="mr-1 h-4 w-4" /> Add Note</Button>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? <p className="py-4 text-sm text-foreground/60">No account notes yet.</p> : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-lg border border-border/70 bg-background/30 p-4">
                      <div className="flex items-center justify-between gap-3"><Badge variant="outline" className="capitalize">{note.noteType}</Badge><span className="text-xs text-foreground/50">{formatDate(note.createdAt)}</span></div>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/80">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/60 bg-card/60">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Building2 className="h-5 w-5 text-primary" /> Account Profile</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <DetailField label="Primary contact" value={primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : undefined} />
              <DetailField label="Email" value={company.email} />
              <DetailField label="Phone" value={company.phone} />
              <DetailField label="Website" value={company.website} />
              <DetailField label="Address" value={[company.address, company.city, company.province, company.postalCode].filter(Boolean).join(", ")} />
              <DetailField label="Areas served" value={company.areasServed} />
              <DetailField label="Typical work requested" value={company.typicalWorkRequested} />
              {company.standardLabourRate && <DetailField label="Standard labour rate" value={`$${Number(company.standardLabourRate).toFixed(2)}`} />}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5 text-primary" /> Operating Requirements</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <DetailField label="Contract information" value={company.contractInformation} />
              <DetailField label="Insurance requirements" value={company.insuranceRequirements} />
              <DetailField label="WSIB / WCB requirements" value={company.wsibRequirements} />
              <DetailField label="Safety requirements" value={company.safetyRequirements} />
              <DetailField label="Required documentation" value={company.requiredDocumentation} />
              <DetailField label="Special instructions" value={company.specialInstructions} />
              {!company.contractInformation && !company.insuranceRequirements && !company.wsibRequirements && !company.safetyRequirements && !company.requiredDocumentation && !company.specialInstructions && <p className="text-sm text-foreground/60">No operating requirements recorded.</p>}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5 text-primary" /> Account Financials</CardTitle></CardHeader>
            <CardContent>{financials ? <div className="space-y-4"><div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg border border-border/70 bg-background/30 p-3"><p className="text-xs text-foreground/55">Outstanding</p><p className="mt-1 text-lg font-bold text-amber-300">${financials.summary.outstandingBalance.toFixed(2)}</p></div><div className="rounded-lg border border-border/70 bg-background/30 p-3"><p className="text-xs text-foreground/55">Overdue</p><p className="mt-1 text-lg font-bold text-rose-300">${financials.summary.overdueBalance.toFixed(2)}</p></div><div className="rounded-lg border border-border/70 bg-background/30 p-3"><p className="text-xs text-foreground/55">Billed</p><p className="mt-1 font-semibold">${financials.summary.totalBilled.toFixed(2)}</p></div><div className="rounded-lg border border-border/70 bg-background/30 p-3"><p className="text-xs text-foreground/55">Collected</p><p className="mt-1 font-semibold text-emerald-400">${financials.summary.totalPaid.toFixed(2)}</p></div><div className="col-span-2 rounded-lg border border-border/70 bg-background/30 p-3"><p className="text-xs text-foreground/55">Average Payment Time</p><p className="mt-1 font-semibold">{financials.summary.averagePaymentDays === null ? "No paid invoices yet" : `${financials.summary.averagePaymentDays.toFixed(1)} days`}</p></div></div><div className="border-t border-border/70 pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">Aging</p><div className="mt-3 space-y-2 text-sm"><AgingRow label="Current" amount={financials.aging.current} /><AgingRow label="1–30 days" amount={financials.aging.days1to30} /><AgingRow label="31–60 days" amount={financials.aging.days31to60} /><AgingRow label="61–90 days" amount={financials.aging.days61to90} /><AgingRow label="90+ days" amount={financials.aging.days90plus} /></div></div>{financials.invoices.length > 0 && <div className="border-t border-border/70 pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">Invoice & Payment History</p><div className="mt-3 space-y-3">{financials.invoices.map((invoice) => <div key={invoice.id} className="rounded-lg border border-border/70 bg-background/30 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{invoice.invoiceNumber}</p><p className="mt-1 text-xs text-foreground/55">{invoice.workOrderNumber ?? "Account invoice"} · Due {formatDate(invoice.dueDate)}</p></div><Badge variant="outline" className="capitalize text-[10px]">{invoice.status.replaceAll("_", " ")}</Badge></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><span>Total: ${Number(invoice.total).toFixed(2)}</span><span className="text-right text-amber-300">Open: ${invoice.outstandingAmount.toFixed(2)}</span></div>{invoice.payments.length > 0 && <p className="mt-2 text-xs text-emerald-400">{invoice.payments.filter((payment) => payment.status === "succeeded").length} payment{invoice.payments.filter((payment) => payment.status === "succeeded").length === 1 ? "" : "s"} received</p>}</div>)}</div></div>}</div> : <p className="text-sm text-foreground/60">Loading account financials...</p>}</CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><CalendarClock className="h-5 w-5 text-primary" /> Account History</CardTitle></CardHeader>
            <CardContent>
              {history.length === 0 ? <p className="text-sm text-foreground/60">History will populate as job sites, work orders, documents, and notes are added.</p> : (
                <div className="space-y-4">
                  {history.slice(0, 12).map((entry) => (
                    <div key={`${entry.type}-${entry.id}`} className="flex gap-3">
                      <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">{entry.type === "work_order" ? <ClipboardList className="h-3.5 w-3.5" /> : entry.type === "document" || entry.type === "invoice" ? <FileText className="h-3.5 w-3.5" /> : entry.type === "payment" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <MessageSquarePlus className="h-3.5 w-3.5" />}</div>
                      <div className="min-w-0"><p className="truncate text-sm font-medium">{entry.title}</p><p className="line-clamp-2 text-xs text-foreground/60">{entry.detail}</p><p className="mt-1 text-xs text-foreground/45">{formatDate(entry.occurredAt)}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Dialog open={isEditingAccount} onOpenChange={setIsEditingAccount}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Company Account</DialogTitle><DialogDescription>Update operating, billing, and compliance requirements for this account.</DialogDescription></DialogHeader>
          <form onSubmit={(event) => {
            event.preventDefault();
            if (!accountDraft.name?.trim()) return toast.error("Company name is required.");
            updateCompany.mutate({
              id: companyId,
              name: accountDraft.name.trim(), legalName: accountDraft.legalName?.trim() || undefined, accountType: accountDraft.accountType as "partner" | "direct_customer",
              classification: accountDraft.classification?.trim() || undefined, email: accountDraft.email?.trim() || undefined, phone: accountDraft.phone?.trim() || undefined,
              website: accountDraft.website?.trim() || undefined, address: accountDraft.address?.trim() || undefined, city: accountDraft.city?.trim() || undefined,
              province: accountDraft.province?.trim() || undefined, postalCode: accountDraft.postalCode?.trim() || undefined,
              preferredContactMethod: accountDraft.preferredContactMethod as "phone" | "email" | "text" | "in_person", paymentTerms: accountDraft.paymentTerms as "due_on_receipt" | "net_7" | "net_15" | "net_30" | "net_45" | "net_60" | "custom",
              standardLabourRate: accountDraft.standardLabourRate?.trim() || undefined, areasServed: accountDraft.areasServed?.trim() || undefined, typicalWorkRequested: accountDraft.typicalWorkRequested?.trim() || undefined,
              contractInformation: accountDraft.contractInformation?.trim() || undefined, insuranceRequirements: accountDraft.insuranceRequirements?.trim() || undefined,
              wsibRequirements: accountDraft.wsibRequirements?.trim() || undefined, safetyRequirements: accountDraft.safetyRequirements?.trim() || undefined,
              requiredDocumentation: accountDraft.requiredDocumentation?.trim() || undefined, specialInstructions: accountDraft.specialInstructions?.trim() || undefined,
              notes: accountDraft.notes?.trim() || undefined, status: accountDraft.status as "active" | "inactive" | "on_hold",
            });
          }} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {([ ["name", "Company Name"], ["legalName", "Legal Name"], ["classification", "Classification"], ["email", "Email"], ["phone", "Phone"], ["website", "Website"], ["address", "Business Address"], ["city", "City"], ["province", "Province"], ["postalCode", "Postal Code"], ["standardLabourRate", "Standard Labour Rate"], ["areasServed", "Areas Served"] ] as const).map(([field, label]) => (
                <div key={field} className={field === "address" ? "sm:col-span-2" : ""}><Label htmlFor={`account-${field}`}>{label}{field === "name" ? " *" : ""}</Label><Input id={`account-${field}`} type={field === "email" ? "email" : field === "website" ? "url" : "text"} value={accountDraft[field] ?? ""} onChange={(event) => setAccountDraft((current) => ({ ...current, [field]: event.target.value }))} /></div>
              ))}
              <div><Label>Account Type</Label><Select value={accountDraft.accountType} onValueChange={(value) => setAccountDraft((current) => ({ ...current, accountType: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="partner">Subcontractor / Partner</SelectItem><SelectItem value="direct_customer">Direct Customer</SelectItem></SelectContent></Select></div>
              <div><Label>Payment Terms</Label><Select value={accountDraft.paymentTerms} onValueChange={(value) => setAccountDraft((current) => ({ ...current, paymentTerms: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(paymentTermLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Preferred Contact Method</Label><Select value={accountDraft.preferredContactMethod} onValueChange={(value) => setAccountDraft((current) => ({ ...current, preferredContactMethod: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="email">Email</SelectItem><SelectItem value="phone">Phone</SelectItem><SelectItem value="text">Text</SelectItem><SelectItem value="in_person">In person</SelectItem></SelectContent></Select></div>
              <div><Label>Status</Label><Select value={accountDraft.status} onValueChange={(value) => setAccountDraft((current) => ({ ...current, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="on_hold">On hold</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
            </div>
            {([ ["typicalWorkRequested", "Typical Work Requested"], ["contractInformation", "Contract Information"], ["insuranceRequirements", "Insurance Requirements"], ["wsibRequirements", "WSIB / WCB Requirements"], ["safetyRequirements", "Safety Requirements"], ["requiredDocumentation", "Required Documentation"], ["specialInstructions", "Special Instructions"], ["notes", "Internal Notes"] ] as const).map(([field, label]) => <div key={field}><Label htmlFor={`account-${field}`}>{label}</Label><Textarea id={`account-${field}`} value={accountDraft[field] ?? ""} onChange={(event) => setAccountDraft((current) => ({ ...current, [field]: event.target.value }))} rows={3} /></div>)}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setIsEditingAccount(false)}>Cancel</Button><Button type="submit" disabled={updateCompany.isPending}>{updateCompany.isPending ? "Saving..." : "Save Account"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Add Company Contact</DialogTitle><DialogDescription>Contacts can be selected directly on a work order.</DialogDescription></DialogHeader>
          <form onSubmit={(event) => { event.preventDefault(); if (!contactDraft.firstName.trim() || !contactDraft.lastName.trim()) return toast.error("First and last name are required."); createContact.mutate({ companyId, firstName: contactDraft.firstName.trim(), lastName: contactDraft.lastName.trim(), role: contactDraft.role, position: contactDraft.position.trim() || undefined, phone: contactDraft.phone.trim() || undefined, mobile: contactDraft.mobile.trim() || undefined, email: contactDraft.email.trim() || undefined, preferredContactMethod: contactDraft.preferredContactMethod, notes: contactDraft.notes.trim() || undefined, isPrimary: contactDraft.isPrimary, status: contactDraft.status }); }} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{([ ["firstName", "First Name"], ["lastName", "Last Name"], ["position", "Position"], ["phone", "Phone"], ["mobile", "Mobile"], ["email", "Email"] ] as const).map(([field, label]) => <div key={field}><Label htmlFor={`contact-${field}`}>{label}{field === "firstName" || field === "lastName" ? " *" : ""}</Label><Input id={`contact-${field}`} type={field === "email" ? "email" : "text"} value={contactDraft[field]} onChange={(event) => setContactDraft((current) => ({ ...current, [field]: event.target.value }))} /></div>)}</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><Label>Role</Label><Select value={contactDraft.role} onValueChange={(value) => setContactDraft((current) => ({ ...current, role: value as typeof current.role }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(contactRoleLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div><Label>Preferred Contact</Label><Select value={contactDraft.preferredContactMethod} onValueChange={(value) => setContactDraft((current) => ({ ...current, preferredContactMethod: value as typeof current.preferredContactMethod }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="email">Email</SelectItem><SelectItem value="phone">Phone</SelectItem><SelectItem value="text">Text</SelectItem><SelectItem value="in_person">In person</SelectItem></SelectContent></Select></div></div>
            <div><Label htmlFor="contact-notes">Notes</Label><Textarea id="contact-notes" value={contactDraft.notes} onChange={(event) => setContactDraft((current) => ({ ...current, notes: event.target.value }))} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={contactDraft.isPrimary} onChange={(event) => setContactDraft((current) => ({ ...current, isPrimary: event.target.checked }))} /> Primary account contact</label>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setIsContactOpen(false)}>Cancel</Button><Button type="submit" disabled={createContact.isPending}>{createContact.isPending ? "Adding..." : "Add Contact"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSiteOpen} onOpenChange={setIsSiteOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>Add Job Site</DialogTitle><DialogDescription>Sites are reusable and retain their work-order history under this company account.</DialogDescription></DialogHeader>
          <form onSubmit={(event) => { event.preventDefault(); if (!siteDraft.address.trim()) return toast.error("Job-site address is required."); createSite.mutate({ companyId, name: siteDraft.name.trim() || undefined, address: siteDraft.address.trim(), city: siteDraft.city.trim() || undefined, province: siteDraft.province.trim() || undefined, postalCode: siteDraft.postalCode.trim() || undefined, propertyType: siteDraft.propertyType, siteContactName: siteDraft.siteContactName.trim() || undefined, siteContactPhone: siteDraft.siteContactPhone.trim() || undefined, accessInstructions: siteDraft.accessInstructions.trim() || undefined, parkingInformation: siteDraft.parkingInformation.trim() || undefined, roofInformation: siteDraft.roofInformation.trim() || undefined, safetyHazards: siteDraft.safetyHazards.trim() || undefined, requiredEquipment: siteDraft.requiredEquipment.trim() || undefined, notes: siteDraft.notes.trim() || undefined, isActive: siteDraft.isActive }); }} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><Label htmlFor="site-name">Site Name</Label><Input id="site-name" value={siteDraft.name} onChange={(event) => setSiteDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Riverside Apartment Complex" /></div><div><Label>Property Type</Label><Select value={siteDraft.propertyType} onValueChange={(value) => setSiteDraft((current) => ({ ...current, propertyType: value as typeof current.propertyType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="residential">Residential</SelectItem><SelectItem value="commercial">Commercial</SelectItem><SelectItem value="industrial">Industrial</SelectItem><SelectItem value="multi_residential">Multi-residential</SelectItem><SelectItem value="institutional">Institutional</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div><div className="sm:col-span-2"><Label htmlFor="site-address">Address *</Label><Input id="site-address" value={siteDraft.address} onChange={(event) => setSiteDraft((current) => ({ ...current, address: event.target.value }))} /></div><div><Label htmlFor="site-city">City</Label><Input id="site-city" value={siteDraft.city} onChange={(event) => setSiteDraft((current) => ({ ...current, city: event.target.value }))} /></div><div className="grid grid-cols-2 gap-3"><div><Label htmlFor="site-province">Province</Label><Input id="site-province" value={siteDraft.province} onChange={(event) => setSiteDraft((current) => ({ ...current, province: event.target.value }))} /></div><div><Label htmlFor="site-postal">Postal Code</Label><Input id="site-postal" value={siteDraft.postalCode} onChange={(event) => setSiteDraft((current) => ({ ...current, postalCode: event.target.value }))} /></div></div><div><Label htmlFor="site-contact">Site Contact</Label><Input id="site-contact" value={siteDraft.siteContactName} onChange={(event) => setSiteDraft((current) => ({ ...current, siteContactName: event.target.value }))} /></div><div><Label htmlFor="site-phone">Site Contact Phone</Label><Input id="site-phone" value={siteDraft.siteContactPhone} onChange={(event) => setSiteDraft((current) => ({ ...current, siteContactPhone: event.target.value }))} /></div></div>
            {([ ["accessInstructions", "Access Instructions"], ["parkingInformation", "Parking Information"], ["roofInformation", "Roof Information"], ["safetyHazards", "Safety Hazards"], ["requiredEquipment", "Required Equipment"], ["notes", "Site Notes"] ] as const).map(([field, label]) => <div key={field}><Label htmlFor={`site-${field}`}>{label}</Label><Textarea id={`site-${field}`} value={siteDraft[field]} onChange={(event) => setSiteDraft((current) => ({ ...current, [field]: event.target.value }))} rows={2} /></div>)}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setIsSiteOpen(false)}>Cancel</Button><Button type="submit" disabled={createSite.isPending}>{createSite.isPending ? "Adding..." : "Add Job Site"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
        <DialogContent className="w-[95vw] max-w-xl"><DialogHeader><DialogTitle>Add Account Note</DialogTitle></DialogHeader><form onSubmit={(event) => { event.preventDefault(); if (!noteDraft.content.trim()) return toast.error("Note content is required."); createNote.mutate({ companyId, noteType: noteDraft.noteType, content: noteDraft.content.trim() }); }} className="space-y-4"><div><Label>Note Type</Label><Select value={noteDraft.noteType} onValueChange={(value) => setNoteDraft((current) => ({ ...current, noteType: value as typeof current.noteType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="general">General</SelectItem><SelectItem value="communication">Communication</SelectItem><SelectItem value="operations">Operations</SelectItem><SelectItem value="financial">Financial</SelectItem><SelectItem value="safety">Safety</SelectItem><SelectItem value="dispute">Dispute</SelectItem></SelectContent></Select></div><div><Label htmlFor="account-note">Note *</Label><Textarea id="account-note" rows={6} value={noteDraft.content} onChange={(event) => setNoteDraft((current) => ({ ...current, content: event.target.value }))} /></div><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setIsNoteOpen(false)}>Cancel</Button><Button type="submit" disabled={createNote.isPending}>{createNote.isPending ? "Adding..." : "Add Note"}</Button></div></form></DialogContent>
      </Dialog>
    </div>
  );
}
