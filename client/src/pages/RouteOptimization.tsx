import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Clock, Maximize2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { MapView } from "@/components/Map";

interface Stop {
  id: number;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  type: "appointment" | "customer";
  time?: string;
  duration?: number;
}

interface RouteInfo {
  totalDistance: string;
  totalDuration: string;
  waypoints: Stop[];
}

export default function RouteOptimization() {
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  const { data: appointments } = trpc.appointments.list.useQuery();
  const { data: customers } = trpc.customers.list.useQuery();

  // Filter appointments for selected date
  const appointmentsForDate = appointments?.filter((apt) => {
    const aptDate = new Date(apt.startTime).toISOString().split("T")[0];
    return aptDate === selectedDate && apt.location;
  }) || [];

  // Add appointment to route
  const handleAddAppointment = (appointment: any) => {
    if (stops.find((s) => s.id === appointment.id && s.type === "appointment")) {
      toast.error("This appointment is already in the route");
      return;
    }

    const stop: Stop = {
      id: appointment.id,
      title: appointment.title,
      address: appointment.location || "",
      latitude: 0,
      longitude: 0,
      type: "appointment",
      time: new Date(appointment.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      duration: Math.round((new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime()) / 60000),
    };

    // Geocode the address to get lat/lng
    if (window.google?.maps?.Geocoder) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: stop.address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
          stop.latitude = results[0].geometry.location.lat();
          stop.longitude = results[0].geometry.location.lng();
          setStops([...stops, stop]);
          toast.success(`${stop.title} added to route`);
        } else {
          toast.error("Could not geocode address");
        }
      });
    }
  };

  // Remove stop from route
  const handleRemoveStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  // Move stop up in order
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newStops = [...stops];
      [newStops[index], newStops[index - 1]] = [newStops[index - 1], newStops[index]];
      setStops(newStops);
    }
  };

  // Move stop down in order
  const handleMoveDown = (index: number) => {
    if (index < stops.length - 1) {
      const newStops = [...stops];
      [newStops[index], newStops[index + 1]] = [newStops[index + 1], newStops[index]];
      setStops(newStops);
    }
  };

  // Optimize route using Google Maps Directions API
  const handleOptimizeRoute = async () => {
    if (stops.length < 2) {
      toast.error("Add at least 2 stops to optimize route");
      return;
    }

    setIsOptimizing(true);

    try {
      if (!window.google?.maps?.DirectionsService) {
        toast.error("Google Maps not available");
        return;
      }

      const directionsService = new google.maps.DirectionsService();
      const waypoints = stops.slice(1, -1).map((stop) => ({
        location: new google.maps.LatLng(stop.latitude, stop.longitude),
        stopover: true,
      }));

      const result = await directionsService.route({
        origin: new google.maps.LatLng(stops[0].latitude, stops[0].longitude),
        destination: new google.maps.LatLng(stops[stops.length - 1].latitude, stops[stops.length - 1].longitude),
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
      });

      if (result.routes && result.routes.length > 0) {
        const route = result.routes[0];
        const legs = route.legs;

        let totalDistance = 0;
        let totalDuration = 0;

        legs.forEach((leg) => {
          totalDistance += leg.distance?.value || 0;
          totalDuration += leg.duration?.value || 0;
        });

        // Reorder stops based on optimization
        const optimizedOrder = (result as any).waypoint_order || [];
        const reorderedStops = [stops[0]];
        optimizedOrder.forEach((index: number) => {
          reorderedStops.push(stops[index + 1]);
        });
        reorderedStops.push(stops[stops.length - 1]);

        setStops(reorderedStops);
        setRouteInfo({
          totalDistance: (totalDistance / 1000).toFixed(1) + " km",
          totalDuration: Math.round(totalDuration / 60) + " min",
          waypoints: reorderedStops,
        });

        toast.success("Route optimized successfully");
        setMapKey((k) => k + 1); // Refresh map
      }
    } catch (error) {
      console.error("Route optimization error:", error);
      toast.error("Failed to optimize route");
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Route Optimization</h1>
          <Button onClick={() => setLocation("/calendar")} variant="outline">
            Back to Calendar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Route planning */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Route Planning</CardTitle>
                <CardDescription>Select date and add stops</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="date">Select Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                {/* Available appointments */}
                {appointmentsForDate.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Available Appointments</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {appointmentsForDate.map((apt) => (
                        <div key={apt.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{apt.title}</p>
                            <p className="text-xs text-gray-500">{apt.location}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(apt.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddAppointment(apt)}
                            className="flex-shrink-0"
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current route */}
                {stops.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Current Route ({stops.length} stops)</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {stops.map((stop, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {index + 1}. {stop.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{stop.address}</p>
                          </div>
                          <div className="flex gap-1">
                            {index > 0 && (
                              <Button size="sm" variant="ghost" onClick={() => handleMoveUp(index)}>
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                            )}
                            {index < stops.length - 1 && (
                              <Button size="sm" variant="ghost" onClick={() => handleMoveDown(index)}>
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleRemoveStop(index)}>
                              ✕
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Route info */}
                {routeInfo && (
                  <div className="bg-green-50 border border-green-200 rounded p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-900">Optimized Route</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-700">
                        <Maximize2 className="h-4 w-4 inline mr-2" />
                        Distance: {routeInfo.totalDistance}
                      </p>
                      <p className="text-gray-700">
                        <Clock className="h-4 w-4 inline mr-2" />
                        Duration: {routeInfo.totalDuration}
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleOptimizeRoute}
                  disabled={stops.length < 2 || isOptimizing}
                  className="w-full"
                >
                  {isOptimizing ? "Optimizing..." : "Optimize Route"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right panel: Map */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Route Map</CardTitle>
              </CardHeader>
              <CardContent className="h-96">
                {stops.length > 0 ? (
                  <MapView
                    key={mapKey}
                    onMapReady={(map: google.maps.Map) => {
                      // Draw route on map
                      const bounds = new google.maps.LatLngBounds();
                      stops.forEach((stop) => {
                        new google.maps.Marker({
                          map,
                          position: { lat: stop.latitude, lng: stop.longitude },
                          title: stop.title,
                        });
                        bounds.extend({ lat: stop.latitude, lng: stop.longitude });
                      });
                      map.fitBounds(bounds);
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50 rounded">
                    <p className="text-gray-500">Add stops to see route on map</p>
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
