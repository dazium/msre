import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation } from "lucide-react";
import { MapView } from "@/components/Map";

export default function Maps() {
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: appointments } = trpc.appointments.list.useQuery();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 43.65, lng: -79.38 }); // Default to Toronto
  const [markers, setMarkers] = useState<any[]>([]);

  // Update markers when projects change
  useEffect(() => {
    if (projects && projects.length > 0) {
      const projectMarkers = projects
        .filter(p => p.latitude && p.longitude)
        .map(p => ({
          id: `project-${p.id}`,
          lat: parseFloat(p.latitude as any),
          lng: parseFloat(p.longitude as any),
          title: p.title,
          description: `Project: ${p.title} - ${p.status}`,
          type: "project",
          color: getStatusColor(p.status),
        }));

      const appointmentMarkers = appointments
        ?.filter(a => {
          const project = projects.find(p => p.id === a.projectId);
          return project && project.latitude && project.longitude;
        })
        .map(a => {
          const project = projects.find(p => p.id === a.projectId);
          return {
            id: `appointment-${a.id}`,
            lat: parseFloat(project?.latitude as any),
            lng: parseFloat(project?.longitude as any),
            title: a.title,
            description: `${a.type}: ${a.title}`,
            type: "appointment",
            color: "#3b82f6",
          };
        }) || [];

      setMarkers([...projectMarkers, ...appointmentMarkers]);

      // Set map center to first project
      if (projectMarkers.length > 0) {
        setMapCenter({
          lat: projectMarkers[0].lat,
          lng: projectMarkers[0].lng,
        });
      }
    }
  }, [projects, appointments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10b981";
      case "in_progress":
        return "#f59e0b";
      case "scheduled":
        return "#3b82f6";
      case "on_hold":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const handleGetDirections = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Job Locations</h1>
        </div>

        {/* Map Container */}
        <div className="blueprint-section">
          <div className="p-6">
            <div className="rounded-lg overflow-hidden border-2 border-primary/30 bg-slate-900">
              <MapView
                initialCenter={mapCenter}
                initialZoom={12}
                onMapReady={(map) => {
                  // Add markers to map
                  markers.forEach(m => {
                    const marker = new google.maps.marker.AdvancedMarkerElement({
                      map,
                      position: { lat: m.lat, lng: m.lng },
                      title: m.title,
                    });
                    
                    const infoWindow = new google.maps.InfoWindow({
                      content: `
                        <div style="color: #000; padding: 8px; font-family: sans-serif;">
                          <strong>${m.title}</strong><br/>
                          <small>${m.description}</small><br/>
                          <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}', '_blank')" 
                            style="margin-top: 8px; padding: 4px 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            Get Directions
                          </button>
                        </div>
                      `,
                    });
                    
                    marker.addListener('click', () => {
                      infoWindow.open(map, marker);
                    });
                  });
                }}
              />
            </div>
          </div>
        </div>

        {/* Projects List with Directions */}
        <div className="blueprint-section">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Active Job Locations
            </h2>

            {projects && projects.length > 0 ? (
              <div className="space-y-3">
                {projects
                  .filter(p => p.latitude && p.longitude)
                  .map(project => (
                    <div key={project.id} className="blueprint-card p-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{project.title}</h3>
                        <p className="text-sm text-foreground/70 mt-1">
                          Lat: {parseFloat(project.latitude as any).toFixed(4)}, Lng: {parseFloat(project.longitude as any).toFixed(4)}
                        </p>
                        <span className={`text-xs font-semibold mt-2 inline-block px-2 py-1 rounded`}
                          style={{ backgroundColor: getStatusColor(project.status) + "20", color: getStatusColor(project.status) }}>
                          {project.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <Button
                        onClick={() => handleGetDirections(parseFloat(project.latitude as any), parseFloat(project.longitude as any))}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        Directions
                      </Button>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center py-8 text-foreground/60">
                No projects with locations yet. Add latitude/longitude to projects to see them on the map.
              </p>
            )}
          </div>
        </div>

        {/* Appointments on Map */}
        {appointments && appointments.length > 0 && (
          <div className="blueprint-section">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
              <div className="space-y-2">
                {appointments.slice(0, 5).map(apt => (
                    <div key={apt.id} className="text-sm text-foreground/70 p-2 bg-primary/10 rounded">
                    <strong>{apt.title}</strong> - {apt.type} ({new Date(apt.startTime).toLocaleDateString()})
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
