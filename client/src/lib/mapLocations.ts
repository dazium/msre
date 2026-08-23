export type MappableRecord = {
  id: number;
  latitude?: string | number | null;
  longitude?: string | number | null;
  title?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  status?: string | null;
};

export type AppointmentLocationRecord = {
  id: number;
  projectId?: number | null;
  title: string;
  type: string;
};

export type LocationMarker = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  type: "project" | "customer" | "appointment";
  color: string;
};

const projectStatusColors: Record<string, string> = {
  completed: "#10b981",
  in_progress: "#f59e0b",
  scheduled: "#3b82f6",
  on_hold: "#ef4444",
};

export const getProjectStatusColor = (status?: string | null) => projectStatusColors[status ?? ""] ?? "#64748b";

const hasCoordinate = (value: string | number | null | undefined) =>
  value !== null && value !== undefined && String(value).trim().length > 0;

const coordinatesFor = (record: MappableRecord) => {
  if (!hasCoordinate(record.latitude) || !hasCoordinate(record.longitude)) return null;
  const lat = Number(record.latitude);
  const lng = Number(record.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

const customerName = (customer: MappableRecord) =>
  [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Customer location";

export function getProjectStatusOptions(projects: MappableRecord[]) {
  return Array.from(new Set(projects.map((project) => project.status).filter((status): status is string => Boolean(status)))).sort();
}

export function buildLocationMarkers({
  projects,
  customers,
  appointments,
  statusFilter,
}: {
  projects: MappableRecord[];
  customers: MappableRecord[];
  appointments: AppointmentLocationRecord[];
  statusFilter: string;
}): LocationMarker[] {
  const visibleProjects = projects.filter((project) => statusFilter === "all" || project.status === statusFilter);
  const projectMarkers = visibleProjects.flatMap((project) => {
    const coordinates = coordinatesFor(project);
    if (!coordinates) return [];
    return [{
      id: `project-${project.id}`,
      ...coordinates,
      title: project.title || "Project",
      description: `Project · ${(project.status || "unscheduled").replaceAll("_", " ")}`,
      type: "project" as const,
      color: getProjectStatusColor(project.status),
    }];
  });

  const customerMarkers = customers.flatMap((customer) => {
    const coordinates = coordinatesFor(customer);
    if (!coordinates) return [];
    const location = [customer.address, customer.city, customer.state].filter(Boolean).join(", ");
    return [{
      id: `customer-${customer.id}`,
      ...coordinates,
      title: customerName(customer),
      description: location ? `Customer · ${location}` : "Customer location",
      type: "customer" as const,
      color: "#8b5cf6",
    }];
  });

  const visibleProjectIds = new Set(visibleProjects.map((project) => project.id));
  const projectsById = new Map(visibleProjects.map((project) => [project.id, project]));
  const appointmentMarkers = appointments.flatMap((appointment) => {
    if (!appointment.projectId || !visibleProjectIds.has(appointment.projectId)) return [];
    const project = projectsById.get(appointment.projectId);
    if (!project) return [];
    const coordinates = coordinatesFor(project);
    if (!coordinates) return [];
    return [{
      id: `appointment-${appointment.id}`,
      ...coordinates,
      title: appointment.title,
      description: `Appointment · ${appointment.type}`,
      type: "appointment" as const,
      color: "#06b6d4",
    }];
  });

  return [...projectMarkers, ...customerMarkers, ...appointmentMarkers];
}
