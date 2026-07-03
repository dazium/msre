import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, DollarSign, MapPin, FileText, Users } from "lucide-react";
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
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
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-foreground/60">Loading project details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-foreground/60">Project not found</p>
          <Button onClick={() => setLocation("/projects")}>Back to Projects</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
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
          <div className="blueprint-header p-6 flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(project.status)}`}>
                {project.status.replace("_", " ").toUpperCase()}
              </span>
            </div>
          </div>
        </div>

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
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Start Date</p>
                    <p className="text-foreground font-semibold">
                      {project.startDate ? formatDate(project.startDate) : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">End Date</p>
                    <p className="text-foreground font-semibold">
                      {project.endDate ? formatDate(project.endDate) : "Not set"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Crew */}
            {crew && (
              <Card className="blueprint-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Assigned Crew
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                  <p className="text-foreground/60">No crew assigned to this project</p>
                </CardContent>
              </Card>
            )}

            {/* Damages */}
            {damages && damages.length > 0 && (
              <Card className="blueprint-card border-border/50">
                <CardHeader>
                  <CardTitle>Damages ({damages.length})</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}

            {/* Estimates */}
            {projectEstimates && projectEstimates.length > 0 && (
              <Card className="blueprint-card border-border/50">
                <CardHeader>
                  <CardTitle>Estimates ({projectEstimates.length})</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}
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
    </DashboardLayout>
  );
}
