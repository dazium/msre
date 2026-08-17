import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Building2, ChevronRight, FileText, MapPin, Plus, Search, Users } from "lucide-react";
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

const initialForm = {
  name: "",
  accountType: "partner" as "partner" | "direct_customer",
  email: "",
  phone: "",
  address: "",
  city: "",
  province: "Ontario",
  postalCode: "",
  paymentTerms: "net_30" as "due_on_receipt" | "net_7" | "net_15" | "net_30" | "net_45" | "net_60" | "custom",
};

export default function Companies() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [accountType, setAccountType] = useState<"all" | "partner" | "direct_customer">("partner");
  const [status, setStatus] = useState<"all" | "active" | "inactive" | "on_hold">("active");
  const [form, setForm] = useState(initialForm);

  const { data: companies, isLoading } = trpc.companies.list.useQuery({
    accountType: accountType === "all" ? undefined : accountType,
    status: status === "all" ? undefined : status,
    search: search.trim() || undefined,
  });
  const createCompany = trpc.companies.create.useMutation({
    onSuccess: async (company) => {
      await utils.companies.list.invalidate();
      toast.success("Company account created.");
      setForm(initialForm);
      setIsCreateOpen(false);
      setLocation(`/companies/${company.id}`);
    },
    onError: (error) => toast.error(error.message || "Company account could not be created."),
  });

  const visibleCompanies = useMemo(() => companies ?? [], [companies]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Company name is required.");
      return;
    }
    createCompany.mutate({
      name: form.name.trim(),
      accountType: form.accountType,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      province: form.province.trim() || undefined,
      postalCode: form.postalCode.trim() || undefined,
      paymentTerms: form.paymentTerms,
    });
  };

  return (
    <div className="space-y-6">
      <section className="blueprint-section">
        <div className="blueprint-header flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Primary operations</p>
            <h1 className="mt-1 text-3xl font-bold">Companies & Accounts</h1>
            <p className="mt-1 max-w-2xl text-sm text-foreground/65">
              Partner companies are the centre of the subcontract workflow. Open an account to manage contacts, job sites, work orders, documentation, billing, and account history.
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Company Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Company Account</DialogTitle>
                <DialogDescription>
                  Capture the minimum information required to receive a new subcontract work order. The complete account profile is available immediately after creation.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="company-name">Company Name *</Label>
                    <Input id="company-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="ABC Roofing Ltd." autoFocus />
                  </div>
                  <div>
                    <Label htmlFor="account-type">Account Type</Label>
                    <Select value={form.accountType} onValueChange={(value) => setForm((current) => ({ ...current, accountType: value as typeof form.accountType }))}>
                      <SelectTrigger id="account-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="partner">Subcontractor / Partner</SelectItem>
                        <SelectItem value="direct_customer">Direct Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment-terms">Standard Payment Terms</Label>
                    <Select value={form.paymentTerms} onValueChange={(value) => setForm((current) => ({ ...current, paymentTerms: value as typeof form.paymentTerms }))}>
                      <SelectTrigger id="payment-terms"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(paymentTermLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="company-email">Email</Label>
                    <Input id="company-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="dispatch@abcroofing.ca" />
                  </div>
                  <div>
                    <Label htmlFor="company-phone">Phone</Label>
                    <Input id="company-phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="519-555-0100" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="company-address">Business Address</Label>
                    <Input id="company-address" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="123 Example Street" />
                  </div>
                  <div>
                    <Label htmlFor="company-city">City</Label>
                    <Input id="company-city" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} placeholder="Windsor" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="company-province">Province</Label>
                      <Input id="company-province" value={form.province} onChange={(event) => setForm((current) => ({ ...current, province: event.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="company-postal">Postal Code</Label>
                      <Input id="company-postal" value={form.postalCode} onChange={(event) => setForm((current) => ({ ...current, postalCode: event.target.value }))} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createCompany.isPending}>{createCompany.isPending ? "Creating..." : "Create Account"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section className="blueprint-section">
        <div className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_190px_190px]">
            <div>
              <Label htmlFor="company-search">Search accounts</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/45" />
                <Input id="company-search" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Company, legal name, email, or phone..." />
              </div>
            </div>
            <div>
              <Label htmlFor="company-type-filter">Account type</Label>
              <Select value={accountType} onValueChange={(value) => setAccountType(value as typeof accountType)}>
                <SelectTrigger id="company-type-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All account types</SelectItem>
                  <SelectItem value="partner">Partners</SelectItem>
                  <SelectItem value="direct_customer">Direct customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="company-status-filter">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                <SelectTrigger id="company-status-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On hold</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      <section className="blueprint-section">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold">{visibleCompanies.length} account{visibleCompanies.length === 1 ? "" : "s"}</h2>
          <span className="text-xs text-foreground/55">Partner accounts are prioritized by default</span>
        </div>
        {isLoading ? (
          <div className="py-14 text-center text-foreground/60">Loading company accounts...</div>
        ) : visibleCompanies.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="mx-auto h-10 w-10 text-primary/70" />
            <p className="mt-4 font-medium">No company accounts match this view.</p>
            <p className="mt-1 text-sm text-foreground/60">Create a partner account to begin receiving and managing subcontract work orders.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {visibleCompanies.map((company) => (
              <button key={company.id} type="button" onClick={() => setLocation(`/companies/${company.id}`)} className="group flex w-full items-start gap-4 px-5 py-5 text-left transition-colors hover:bg-muted/30">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{company.name}</span>
                    <Badge variant={company.accountType === "partner" ? "default" : "secondary"}>{company.accountType === "partner" ? "Partner" : "Direct customer"}</Badge>
                    {company.status !== "active" && <Badge variant="outline" className="capitalize">{company.status.replace("_", " ")}</Badge>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground/60">
                    {company.email && <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{company.email}</span>}
                    {company.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{company.city}{company.province ? `, ${company.province}` : ""}</span>}
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{paymentTermLabels[company.paymentTerms]}</span>
                  </div>
                </div>
                <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
