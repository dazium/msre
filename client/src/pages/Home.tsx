import { Card } from "@/components/ui/card";
import { ArrowRight, BarChart3, Calendar, ClipboardList, FileText, Plus, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CustomerDetailModal } from "@/components/CustomerDetailModal";
import { ContactLink } from "@/components/ContactLink";
import { AddressMapModal } from "@/components/AddressMapModal";
import { getActiveProjects, getPendingEstimates } from "@/lib/dashboardSummary";
import { getDashboardCreatePath } from "@/lib/dashboardQuickActions";

export default function Home() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: estimates } = trpc.estimates.list.useQuery();
  const { data: appointments } = trpc.appointments.list.useQuery();
  const activeProjects = getActiveProjects(projects);
  const pendingEstimates = getPendingEstimates(estimates);

  const handleAddressClick = (address: string) => {
    setSelectedAddress(address);
    setMapOpen(true);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="blueprint-section">
          <div className="blueprint-header">
            <h1 className="text-3xl font-bold">Welcome to MUNRO and Sons Roofing Experts</h1>
            <p className="text-sm text-secondary-foreground/80 mt-2">Professional project management for your roofing business</p>
          </div>
          <div className="p-6">
            <p className="text-foreground/80">
              Manage your customers, track projects, generate professional estimates, and optimize your roofing operations with MUNRO and Sons CRM.
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="blueprint-grid-3">
          <div className="blueprint-stat">
            <div className="flex items-center justify-between">
              <div>
                <p className="blueprint-label">Total Customers</p>
                <p className="blueprint-value">{customers?.length || 0}</p>
              </div>
              <Users className="w-12 h-12 text-primary/20" />
            </div>
          </div>

          <div className="blueprint-stat">
            <div className="flex items-center justify-between">
              <div>
                <p className="blueprint-label">Active Projects</p>
                <p className="blueprint-value">{activeProjects.length}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-primary/20" />
            </div>
          </div>

          <div className="blueprint-stat">
            <div className="flex items-center justify-between">
              <div>
                <p className="blueprint-label">Pending Estimates</p>
                <p className="blueprint-value">{pendingEstimates.length}</p>
              </div>
              <FileText className="w-12 h-12 text-primary/20" />
            </div>
          </div>
        </div>

        {/* Quick Summary Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="blueprint-section" aria-labelledby="active-projects-summary-title">
            <div className="blueprint-header flex items-center justify-between gap-3">
              <h2 id="active-projects-summary-title" className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Active Projects
              </h2>
              <a href="/projects" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline">
                View all <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="p-6">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="blueprint-label">Current workload</p>
                  <p className="text-4xl font-bold text-primary">{activeProjects.length}</p>
                </div>
                <BarChart3 className="h-12 w-12 text-primary/20" aria-hidden="true" />
              </div>
              {activeProjects.length > 0 ? (
                <div className="space-y-2">
                  {activeProjects.slice(0, 3).map((project) => (
                    <a key={project.id} href={`/projects/${project.id}`} className="flex min-h-11 items-center justify-between gap-3 rounded border border-border bg-background/50 p-3 transition-colors hover:border-primary">
                      <span className="min-w-0 truncate font-semibold text-foreground">{project.title}</span>
                      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-foreground/60">{project.status.replace("_", " ")}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="rounded border border-dashed border-border p-4 text-sm text-foreground/60">No active projects right now. Create a project to start tracking work.</p>
              )}
            </div>
          </section>

          <section className="blueprint-section" aria-labelledby="pending-estimates-summary-title">
            <div className="blueprint-header flex items-center justify-between gap-3">
              <h2 id="pending-estimates-summary-title" className="text-xl font-bold flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Pending Estimates
              </h2>
              <a href="/estimates" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline">
                View all <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="p-6">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="blueprint-label">Awaiting action</p>
                  <p className="text-4xl font-bold text-primary">{pendingEstimates.length}</p>
                </div>
                <FileText className="h-12 w-12 text-primary/20" aria-hidden="true" />
              </div>
              {pendingEstimates.length > 0 ? (
                <div className="space-y-2">
                  {pendingEstimates.slice(0, 3).map((estimate) => (
                    <a key={estimate.id} href={`/estimates/${estimate.id}`} className="flex min-h-11 items-center justify-between gap-3 rounded border border-border bg-background/50 p-3 transition-colors hover:border-primary">
                      <span className="min-w-0 truncate font-semibold text-foreground">{estimate.title}</span>
                      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-foreground/60">Draft</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="rounded border border-dashed border-border p-4 text-sm text-foreground/60">No pending estimates. New drafts will appear here for follow-up.</p>
              )}
            </div>
          </section>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Customers */}
          <div className="blueprint-section">
            <div className="blueprint-header">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Recent Customers
              </h2>
            </div>
            <div className="p-6">
              {customers && customers.length > 0 ? (
                <div className="space-y-2">
                  {customers.slice(0, 5).map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 bg-background/50 rounded border border-border hover:border-primary cursor-pointer transition-all"
                      onClick={() => setSelectedCustomerId(customer.id)}
                    >
                      <p className="font-semibold text-foreground">{customer.firstName} {customer.lastName}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-foreground/60">
                        <ContactLink type="phone" value={customer.phone} />
                        {customer.address && (
                          <ContactLink
                            type="address"
                            value={customer.address}
                            label={customer.city || customer.address}
                            onAddressClick={handleAddressClick}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-foreground/60 text-center py-8">
                  No customers yet. Start by adding your first customer.
                </p>
              )}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="blueprint-section">
            <div className="blueprint-header">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Appointments
              </h2>
            </div>
            <div className="p-6">
              {appointments && appointments.length > 0 ? (
                <div className="space-y-2">
                  {appointments.slice(0, 5).map((apt) => (
                    <div key={apt.id} className="p-3 bg-background/50 rounded border border-border">
                      <p className="font-semibold text-foreground">{apt.title}</p>
                      <p className="text-xs text-foreground/60 mt-1">{new Date(apt.startTime).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-foreground/60 text-center py-8">
                  No appointments scheduled. Check your calendar to add one.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Active Projects Section */}
        <div className="blueprint-section">
          <div className="blueprint-header">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Active Projects
            </h2>
          </div>
          <div className="p-6">
            {activeProjects.length > 0 ? (
              <div className="space-y-2">
                {activeProjects.slice(0, 5).map((proj) => (
                  <div key={proj.id} className="p-3 bg-background/50 rounded border border-border">
                    <p className="font-semibold text-foreground">{proj.title}</p>
                    <p className="text-xs text-foreground/60 mt-1">Status: {proj.status}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-foreground/60 text-center py-8">
                No active projects. Create a new project to get started.
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="blueprint-section">
          <div className="blueprint-header">
            <h2 className="text-xl font-bold">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <a
                href={getDashboardCreatePath("project")}
                aria-label="Create a new project"
                className="blueprint-card flex min-h-14 items-center gap-3 border-primary/50 bg-primary/10 p-4 text-left transition-all hover:blueprint-glow"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-semibold text-foreground">Create New Project</span>
                  <span className="block text-xs text-foreground/60">Start a job and assign a customer</span>
                </span>
              </a>
              <a
                href={getDashboardCreatePath("estimate")}
                aria-label="Create a new estimate"
                className="blueprint-card flex min-h-14 items-center gap-3 border-primary/50 bg-primary/10 p-4 text-left transition-all hover:blueprint-glow"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-semibold text-foreground">Create New Estimate</span>
                  <span className="block text-xs text-foreground/60">Prepare pricing for a project</span>
                </span>
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <a 
                href="/customers" 
                className="blueprint-card hover:blueprint-glow transition-all cursor-pointer text-center py-6"
              >
                <Users className="w-8 h-8 mx-auto mb-3 text-primary" />
                <p className="font-semibold text-foreground">Manage Customers</p>
                <p className="text-xs text-foreground/60 mt-1">Add and track leads</p>
              </a>

              <a 
                href="/projects" 
                className="blueprint-card hover:blueprint-glow transition-all cursor-pointer text-center py-6"
              >
                <BarChart3 className="w-8 h-8 mx-auto mb-3 text-primary" />
                <p className="font-semibold text-foreground">Track Projects</p>
                <p className="text-xs text-foreground/60 mt-1">Manage job timelines</p>
              </a>

              <a 
                href="/damages" 
                className="blueprint-card hover:blueprint-glow transition-all cursor-pointer text-center py-6"
              >
                <FileText className="w-8 h-8 mx-auto mb-3 text-primary" />
                <p className="font-semibold text-foreground">Record Damages</p>
                <p className="text-xs text-foreground/60 mt-1">Document roof issues</p>
              </a>

              <a 
                href="/calendar" 
                className="blueprint-card hover:blueprint-glow transition-all cursor-pointer text-center py-6"
              >
                <Calendar className="w-8 h-8 mx-auto mb-3 text-primary" />
                <p className="font-semibold text-foreground">Schedule Jobs</p>
                <p className="text-xs text-foreground/60 mt-1">Manage appointments</p>
              </a>
            </div>
          </div>
        </div>
      </div>
      <CustomerDetailModal
        customerId={selectedCustomerId}
        isOpen={selectedCustomerId !== null}
        onClose={() => setSelectedCustomerId(null)}
      />
      <AddressMapModal
        address={selectedAddress}
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
      />
    </>
  );
}
