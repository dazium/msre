import { useCallback, useMemo, useRef, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapView } from "@/components/Map";
import { canCreateRoute, splitRoutePoints, type RoutePoint } from "@/lib/routePlanner";
import { getCrewDailyAssignments } from "@/lib/crewDispatch";
import { reorderRouteStops } from "@/lib/routeStopOrder";
import { Crosshair, GripVertical, LocateFixed, MapPin, Navigation, Route, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

type RouteStop = RoutePoint & {
  id: string;
  label: string;
  address: string;
};

type CurrentLocation = RoutePoint & {
  label: string;
};

const fallbackCenter = { lat: 42.3149, lng: -83.0364 };

function routePointToLatLng(point: RoutePoint): google.maps.LatLngLiteral {
  return { lat: point.latitude, lng: point.longitude };
}

function SortableRouteStop({ stop, index, onRemove }: { stop: RouteStop; index: number; onRemove: (stopId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return <div ref={setNodeRef} style={style} className={`flex items-start gap-2 rounded-lg border border-border bg-background/50 p-3 ${isDragging ? "z-10 opacity-70 shadow-lg ring-1 ring-primary/50" : ""}`}>
    <button type="button" className="mt-0.5 flex h-9 w-8 shrink-0 touch-none items-center justify-center rounded-md text-foreground/55 hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`Drag ${stop.label} to reorder`} {...attributes} {...listeners}><GripVertical className="h-4 w-4" /></button>
    <span className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{index + 1}</span>
    <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{stop.label}</p><p className="mt-0.5 line-clamp-2 text-xs text-foreground/60">{stop.address}</p></div>
    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => onRemove(stop.id)} aria-label={`Remove ${stop.label}`}><Trash2 className="h-4 w-4" /></Button>
  </div>;
}

export default function RouteOptimization() {
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState("Use your current location to begin.");
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [routeResult, setRouteResult] = useState<google.maps.DirectionsResult | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [isAddingStop, setIsAddingStop] = useState(false);
  const [selectedCrewId, setSelectedCrewId] = useState("none");
  const [isLoadingCrewRoute, setIsLoadingCrewRoute] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: crews = [] } = trpc.crews.list.useQuery();
  const { data: appointments = [] } = trpc.appointments.list.useQuery();
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const selectedCrew = crews.find((crew) => crew.id.toString() === selectedCrewId) ?? null;
  const selectedCrewAssignments = useMemo(
    () => selectedCrew ? getCrewDailyAssignments(selectedCrew.id, appointments) : [],
    [appointments, selectedCrew],
  );

  const requestCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("This browser does not support GPS location.");
      toast.error("GPS location is not supported by this browser.");
      return;
    }

    setIsLocating(true);
    setLocationStatus("Requesting current GPS location…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: "Current location",
        };
        setCurrentLocation(nextLocation);
        setRouteResult(null);
        setLocationStatus("Current GPS location ready.");
        setMapKey((key) => key + 1);
        setIsLocating(false);
        toast.success("Current location set as route start.");
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? "Location permission was denied. Allow location access, then try again."
          : "Current location could not be determined. Try again outdoors or use a stronger connection.";
        setLocationStatus(message);
        setIsLocating(false);
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  }, []);

  const getAddressForPoint = useCallback(async (point: google.maps.LatLngLiteral) => {
    if (!window.google?.maps?.Geocoder) return "Pinned map stop";

    return new Promise<string>((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: point }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results?.[0]?.formatted_address) {
          resolve(results[0].formatted_address);
          return;
        }
        resolve("Pinned map stop");
      });
    });
  }, []);

  const addMapStop = useCallback(async (position: google.maps.LatLngLiteral) => {
    setIsAddingStop(true);
    const address = await getAddressForPoint(position);
    const stop: RouteStop = {
      id: `map-stop-${Date.now()}`,
      latitude: position.lat,
      longitude: position.lng,
      label: `Stop ${stops.length + 1}`,
      address,
    };
    setStops((current) => [...current, stop]);
    setRouteResult(null);
    setMapKey((key) => key + 1);
    setIsAddingStop(false);
    toast.success(`${stop.label} added to route.`);
  }, [getAddressForPoint, stops.length]);

  const removeStop = (stopId: string) => {
    setStops((current) => current.filter((stop) => stop.id !== stopId));
    setRouteResult(null);
    setMapKey((key) => key + 1);
  };

  const handleStopDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setStops((current) => reorderRouteStops(current, String(active.id), String(over.id)));
    setRouteResult(null);
    setMapKey((key) => key + 1);
  };

  const loadSelectedCrewRoute = async () => {
    if (!selectedCrew) return toast.error("Select a crew first.");
    if (selectedCrewAssignments.length === 0) return toast.error(`${selectedCrew.name} has no assigned jobs today.`);
    if (!window.google?.maps?.Geocoder) return toast.error("The mapping service is still loading. Try again in a moment.");
    setIsLoadingCrewRoute(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const resolvedStops = await Promise.all(selectedCrewAssignments.map(async (assignment, index) => {
        const address = assignment.location?.trim();
        if (!address) return null;
        const result = await new Promise<google.maps.GeocoderResult | null>((resolve) => {
          geocoder.geocode({ address }, (results, status) => resolve(status === google.maps.GeocoderStatus.OK && results?.[0] ? results[0] : null));
        });
        const location = result?.geometry.location;
        if (!location) return null;
        return { id: `crew-${selectedCrew.id}-${index}`, latitude: location.lat(), longitude: location.lng(), label: assignment.title || `Crew stop ${index + 1}`, address: result?.formatted_address || address } satisfies RouteStop;
      }));
      const crewStops = resolvedStops.filter((stop): stop is RouteStop => Boolean(stop));
      if (crewStops.length === 0) return toast.error("The crew's job addresses could not be placed on the map.");
      setStops(crewStops);
      setRouteResult(null);
      setMapKey((key) => key + 1);
      toast.success(`${selectedCrew.name}'s ${crewStops.length} assigned stop${crewStops.length === 1 ? "" : "s"} loaded for today.`);
    } finally {
      setIsLoadingCrewRoute(false);
    }
  };

  const planRoute = async () => {
    if (!canCreateRoute(currentLocation, stops)) {
      toast.error("Set your current location and long-press the map to add at least one stop.");
      return;
    }
    if (!window.google?.maps?.DirectionsService) {
      toast.error("The mapping service is still loading. Try again in a moment.");
      return;
    }

    const { origin, destination, waypoints } = splitRoutePoints(currentLocation!, stops);
    setIsRouting(true);
    try {
      const service = new google.maps.DirectionsService();
      const result = await service.route({
        origin: routePointToLatLng(origin),
        destination: routePointToLatLng(destination),
        waypoints: waypoints.map((stop) => ({ location: routePointToLatLng(stop), stopover: true })),
        optimizeWaypoints: false,
        travelMode: google.maps.TravelMode.DRIVING,
      });
      setRouteResult(result);
      setMapKey((key) => key + 1);
      toast.success("Route created in your selected stop order.");
    } catch (error) {
      console.error("Route creation error", error);
      toast.error("Route could not be created. Check the selected stops and try again.");
    } finally {
      setIsRouting(false);
    }
  };

  const initializeMap = (map: google.maps.Map) => {
    if (routeResult) {
      directionsRenderer.current = new google.maps.DirectionsRenderer({ map, suppressMarkers: false });
      directionsRenderer.current.setDirections(routeResult);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    if (currentLocation) {
      const position = routePointToLatLng(currentLocation);
      new google.maps.Marker({ map, position, title: "Current location", label: "A" });
      bounds.extend(position);
    }
    stops.forEach((stop, index) => {
      const position = routePointToLatLng(stop);
      new google.maps.Marker({ map, position, title: stop.address, label: String(index + 1) });
      bounds.extend(position);
    });
    if (!bounds.isEmpty()) map.fitBounds(bounds, 48);
  };

  const initialCenter = currentLocation ? routePointToLatLng(currentLocation) : fallbackCenter;

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="blueprint-section">
        <div className="blueprint-header">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">GPS route planning</p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Route Optimization</h1>
              <p className="mt-1 text-sm text-foreground/65">Start at your phone’s current location, then long-press the map to add stops such as Home Depot.</p>
            </div>
            <Badge variant="outline" className="w-fit border-primary/40 text-primary">Public access</Badge>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr] xl:gap-6">
        <Card className="h-fit">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2"><Route className="h-5 w-5 text-primary" /> Route controls</CardTitle>
            <CardDescription>GPS start plus one or more map stops creates a driving route.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="rounded-lg border border-border bg-muted/25 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Route start</p>
                  <p className="mt-1 text-sm text-foreground/65">{locationStatus}</p>
                </div>
                <Crosshair className="h-5 w-5 shrink-0 text-primary" />
              </div>
              <Button type="button" className="mt-3 w-full" onClick={requestCurrentLocation} disabled={isLocating}>
                <LocateFixed className="mr-2 h-4 w-4" />
                {isLocating ? "Locating…" : currentLocation ? "Refresh current location" : "Use my current location"}
              </Button>
            </div>

            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4 text-primary" /> Add stops from the map</p>
              <p className="mt-1 text-sm text-foreground/65">Long-press directly on the map to add a stop. On desktop, right-click also adds one.</p>
              {isAddingStop && <p className="mt-2 text-xs text-primary">Naming selected stop…</p>}
            </div>

            <div className="rounded-lg border border-border bg-muted/25 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-primary" /> Crew route for today</p>
              <p className="mt-1 text-sm text-foreground/65">Load a crew’s scheduled work-order stops into the route map. Your GPS location remains the optional route start.</p>
              <div className="mt-3 space-y-2"><Label htmlFor="crew-route">Crew</Label><Select value={selectedCrewId} onValueChange={setSelectedCrewId}><SelectTrigger id="crew-route"><SelectValue placeholder="Select a crew" /></SelectTrigger><SelectContent><SelectItem value="none">No crew selected</SelectItem>{crews.filter((crew) => crew.status === "active").map((crew) => <SelectItem key={crew.id} value={crew.id.toString()}>{crew.name}</SelectItem>)}</SelectContent></Select></div>
              {selectedCrew && <p className="mt-2 text-xs text-foreground/60">{selectedCrewAssignments.length} assigned job{selectedCrewAssignments.length === 1 ? "" : "s"} today.</p>}
              <Button type="button" variant="outline" className="mt-3 w-full" onClick={loadSelectedCrewRoute} disabled={!selectedCrew || isLoadingCrewRoute}><Route className="mr-2 h-4 w-4" />{isLoadingCrewRoute ? "Loading crew route…" : "Load crew route"}</Button>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Stops ({stops.length})</p>
                {customers.length > 0 && <span className="text-xs text-foreground/55">Map stops are independent of customer data.</span>}
              </div>
              {stops.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-3 text-sm text-foreground/60">No stops yet. Long-press a destination on the map.</p>
              ) : (
                <div><p className="mb-2 text-xs text-foreground/60">Drag the handle to reorder stops. The route follows this exact schedule order.</p><DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleStopDragEnd}><SortableContext items={stops.map((stop) => stop.id)} strategy={verticalListSortingStrategy}><div className="space-y-2">{stops.map((stop, index) => <SortableRouteStop key={stop.id} stop={stop} index={index} onRemove={removeStop} />)}</div></SortableContext></DndContext></div>
              )}
            </div>

            <Button type="button" className="w-full" onClick={planRoute} disabled={!canCreateRoute(currentLocation, stops) || isRouting}>
              <Navigation className="mr-2 h-4 w-4" />
              {isRouting ? "Creating route…" : "Create driving route"}
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Interactive route map</CardTitle>
            <CardDescription>Long-press the map to place each destination. Your current location remains the route start.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <MapView
              key={mapKey}
              className="h-[52vh] min-h-[380px] sm:h-[560px]"
              initialCenter={initialCenter}
              initialZoom={currentLocation ? 13 : 11}
              onMapReady={initializeMap}
              onMapLongPress={addMapStop}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
