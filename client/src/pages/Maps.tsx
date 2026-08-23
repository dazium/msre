import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Users } from "lucide-react";
import { MapView } from "@/components/Map";
import { buildLocationMarkers, getProjectStatusColor, getProjectStatusOptions } from "@/lib/mapLocations";

const mapCenterFallback = { lat: 42.3149, lng: -83.0364 };

export default function Maps() {
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: appointments = [] } = trpc.appointments.list.useQuery();
  const [statusFilter, setStatusFilter] = useState("all");
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markerRefs = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const statusOptions = useMemo(() => getProjectStatusOptions(projects), [projects]);
  const markers = useMemo(
    () => buildLocationMarkers({ projects, customers, appointments, statusFilter }),
    [projects, customers, appointments, statusFilter],
  );

  useEffect(() => {
    if (!map || !window.google?.maps?.marker) return;
    markerRefs.current.forEach((marker) => {
      marker.map = null;
    });
    markerRefs.current = [];

    const bounds = new google.maps.LatLngBounds();
    markers.forEach((location) => {
      const markerElement = document.createElement("div");
      markerElement.className = "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-lg";
      markerElement.style.backgroundColor = location.color;
      markerElement.textContent = location.type === "customer" ? "C" : location.type === "appointment" ? "A" : "J";

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: location.lat, lng: location.lng },
        title: location.title,
        content: markerElement,
      });
      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="color:#0f172a;padding:8px;font-family:sans-serif"><strong>${location.title}</strong><br/><small>${location.description}</small></div>`,
      });
      marker.addListener("click", () => infoWindow.open({ map, anchor: marker }));
      markerRefs.current.push(marker);
      bounds.extend({ lat: location.lat, lng: location.lng });
    });

    if (markers.length === 1) {
      map.setCenter({ lat: markers[0].lat, lng: markers[0].lng });
      map.setZoom(14);
    } else if (markers.length > 1) {
      map.fitBounds(bounds, 48);
    }

    return () => {
      markerRefs.current.forEach((marker) => {
        marker.map = null;
      });
    };
  }, [map, markers]);

  const visibleProjects = projects.filter((project) => statusFilter === "all" || project.status === statusFilter);
  const handleGetDirections = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-5">
      <Card className="blueprint-section">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl"><MapPin className="h-6 w-6 text-primary" /> Job & Customer Map</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Filter jobs by status, inspect customer locations, and open driving directions.</p>
          </div>
          <div className="w-full sm:w-52">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger aria-label="Filter map by project status"><SelectValue placeholder="All project statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All project statuses</SelectItem>
                {statusOptions.map((status) => <SelectItem key={status} value={status}>{status.replaceAll("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-amber-500/15 px-2 py-1 text-amber-700">J Project job</span>
            <span className="rounded-full bg-violet-500/15 px-2 py-1 text-violet-700">C Customer address</span>
            <span className="rounded-full bg-cyan-500/15 px-2 py-1 text-cyan-700">A Appointment</span>
            <span className="ml-auto">{markers.length} mapped location{markers.length === 1 ? "" : "s"}</span>
          </div>
          <div className="overflow-hidden rounded-lg border border-primary/30 bg-muted/30">
            <MapView initialCenter={mapCenterFallback} initialZoom={11} className="h-[420px] sm:h-[520px]" onMapReady={setMap} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="blueprint-section">
          <CardHeader><CardTitle>Visible job locations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {visibleProjects.filter((project) => project.latitude && project.longitude).length ? visibleProjects.filter((project) => project.latitude && project.longitude).map((project) => (
              <div key={project.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="font-semibold">{project.title}</p>
                  <span className="mt-1 inline-block rounded px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: `${getProjectStatusColor(project.status)}22`, color: getProjectStatusColor(project.status) }}>{project.status.replaceAll("_", " ")}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleGetDirections(Number(project.latitude), Number(project.longitude))}><Navigation className="mr-1 h-4 w-4" />Directions</Button>
              </div>
            )) : <p className="py-6 text-center text-sm text-muted-foreground">No filtered projects have saved coordinates yet.</p>}
          </CardContent>
        </Card>

        <Card className="blueprint-section">
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Customer locations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {customers.filter((customer) => customer.latitude && customer.longitude).length ? customers.filter((customer) => customer.latitude && customer.longitude).map((customer) => (
              <div key={customer.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0"><p className="font-semibold">{customer.firstName} {customer.lastName}</p><p className="truncate text-sm text-muted-foreground">{customer.address || "Address mapped"}</p></div>
                <Button size="sm" variant="outline" onClick={() => handleGetDirections(Number(customer.latitude), Number(customer.longitude))}><Navigation className="mr-1 h-4 w-4" />Directions</Button>
              </div>
            )) : <p className="py-6 text-center text-sm text-muted-foreground">Customer locations appear here once an address is selected through the validated Google address search.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
