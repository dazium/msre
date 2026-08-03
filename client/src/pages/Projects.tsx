
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Plus, MapPin, Calendar } from "lucide-react";

export default function Projects() {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [crewFilter, setCrewFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    customerId: "",
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    estimatedValue: "",
    crewId: "unassigned",
  });

  const { data: customers } = trpc.customers.list.useQuery();
  const { data: crews } = trpc.crews.list.useQuery();
  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery();
  const createMutation = trpc.projects.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.title) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const project = await createMutation.mutateAsync({
        customerId: parseInt(formData.customerId),
        title: formData.title,
        description: formData.description,
        status: "lead",
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        estimatedValue: formData.estimatedValue,
      });
      toast.success("Project created! Redirecting to details...");
      setFormData({
        customerId: "",
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        estimatedValue: "",
        crewId: "unassigned",
      });
      setIsOpen(false);
      // Redirect to project detail page
      if (project && 'id' in project) {
        setLocation(`/projects/${project.id}`);
      } else {
        refetch();
      }
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  const filteredProjects = projects?.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesCrew = crewFilter === "all" || 
      (crewFilter === "unassigned" && !p.crewId) || 
      (crewFilter !== "unassigned" && p.crewId?.toString() === crewFilter);
    return matchesSearch && matchesStatus && matchesCrew;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      lead: "text-blue-400",
      scheduled: "text-yellow-400",
      in_progress: "text-orange-400",
      completed: "text-green-400",
      on_hold: "text-red-400",
      cancelled: "text-gray-400",
    };
    return colors[status] || "text-foreground";
  };

  const getCrewName = (crewId?: number | null) => {
    if (!crewId) return "Unassigned";
    return crews?.find((c) => c.id === crewId)?.name || "Unknown Crew";
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="blueprint-section">
          <div className="blueprint-header flex items-center justify-between">
            <h1 className="text-3xl font-bold">Projects</h1>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-full sm:max-w-2xl w-[95vw] sm:w-auto max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="customerId">Customer *</Label>
                    <Select value={formData.customerId} onValueChange={(val) => setFormData({ ...formData, customerId: val })}>
                      <SelectTrigger id="customerId">
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.firstName} {c.lastName}
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
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Roof Replacement - North Side"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Project details..."
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      rows={3}
                    />
                  </div>



                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
                    <Input
                      id="estimatedValue"
                      type="number"
                      step="0.01"
                      value={formData.estimatedValue}
                      onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                      placeholder="5000.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="crewId">Assign Crew (Optional)</Label>
                    <Select value={formData.crewId || "unassigned"} onValueChange={(val) => setFormData({ ...formData, crewId: val })}>
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

                  <div className="flex gap-2 justify-end">
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
        </div>

        {/* Filters */}
        <div className="blueprint-section">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
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
                    <SelectItem value="all">All Crews</SelectItem>
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
          </div>
        </div>

        {/* Projects List */}
        <div className="blueprint-section">
          <div className="p-6">
            {isLoading ? (
              <p className="text-center py-8 text-foreground/60">Loading projects...</p>
            ) : filteredProjects?.length === 0 ? (
              <p className="text-center py-8 text-foreground/60">
                {projects?.length === 0 ? "No projects yet. Create one to get started!" : "No projects match your search."}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredProjects?.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => setLocation(`/projects/${project.id}`)}
                    className="blueprint-card p-4 hover:blueprint-glow transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{project.title}</h3>
                          <span className={`text-xs font-semibold ${getStatusColor(project.status)}`}>
                            {project.status.replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/70 mt-1">{project.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2 text-sm text-foreground/70">
                          <div className="flex items-center gap-1">
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                              {getCrewName(project.crewId)}
                            </span>
                          </div>
                          {project.startDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(project.startDate).toLocaleDateString()}
                            </div>
                          )}
                          {project.estimatedValue && (
                            <div className="font-semibold text-primary">
                              ${parseFloat(project.estimatedValue as any).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
