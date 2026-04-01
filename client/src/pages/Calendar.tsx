import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock } from "lucide-react";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 31)); // March 2026
  const [showDialog, setShowDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);

  const { data: appointmentsData, isLoading } = trpc.appointments.list.useQuery();
  const createMutation = trpc.appointments.create.useMutation();

  useEffect(() => {
    if (appointmentsData) {
      setAppointments(appointmentsData);
    }
  }, [appointmentsData]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getAppointmentsForDate = (day: number) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return (
        aptDate.getFullYear() === currentDate.getFullYear() &&
        aptDate.getMonth() === currentDate.getMonth() &&
        aptDate.getDate() === day
      );
    });
  };

  const handleCreateAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    const startTime = new Date(selectedDate);
    const startHour = parseInt(formData.get("startHour") as string) || 9;
    const startMinute = parseInt(formData.get("startMinute") as string) || 0;
    startTime.setHours(startHour, startMinute, 0);

    const endTime = new Date(startTime);
    const durationHours = parseInt(formData.get("durationHours") as string) || 1;
    endTime.setHours(endTime.getHours() + durationHours);

    try {
      await createMutation.mutateAsync({
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        type: formData.get("type") as any,
        startTime,
        endTime,
        location: formData.get("location") as string,
        notes: formData.get("notes") as string,
      });

      toast.success("Appointment created successfully");
      setShowDialog(false);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast.error("Failed to create appointment");
    }
  };

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  if (isLoading) {
    return <div className="p-8">Loading calendar...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendar & Scheduling</h1>
        <Button onClick={() => { setSelectedDate(new Date()); setShowDialog(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          New Appointment
        </Button>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle>{monthName}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-2 text-center font-semibold text-sm text-muted-foreground">
                {day}
              </div>
            ))}

            {/* Empty days */}
            {emptyDays.map((i) => (
              <div key={`empty-${i}`} className="p-2 bg-muted/30 rounded" />
            ))}

            {/* Calendar days */}
            {days.map((day) => {
              const dayAppointments = getAppointmentsForDate(day);
              const isToday =
                new Date().toDateString() ===
                new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

              return (
                <div
                  key={day}
                  onClick={() => {
                    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                    setShowDialog(true);
                  }}
                  className={`p-2 rounded border cursor-pointer transition-colors ${
                    isToday
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="font-semibold text-sm mb-1">{day}</div>
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        className="text-xs bg-blue-500/20 text-blue-700 dark:text-blue-300 px-1 py-0.5 rounded truncate"
                      >
                        {apt.title}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayAppointments.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming appointments */}
      <Card className="border-border/50 bg-background/50 backdrop-blur">
        <CardHeader className="border-b border-border/50">
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>Next 7 days</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {appointments.length === 0 ? (
            <p className="text-muted-foreground">No appointments scheduled</p>
          ) : (
            <div className="space-y-4">
              {appointments
                .filter((apt) => {
                  const aptDate = new Date(apt.startTime);
                  const today = new Date();
                  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                  return aptDate >= today && aptDate <= sevenDaysFromNow;
                })
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((apt) => (
                  <div key={apt.id} className="flex items-start gap-4 p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-semibold">{apt.title}</h3>
                      <p className="text-sm text-muted-foreground">{apt.description}</p>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(apt.startTime).toLocaleString()}
                        </div>
                        {apt.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {apt.location}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        apt.type === "estimate" ? "bg-blue-500/20 text-blue-700 dark:text-blue-300" :
                        apt.type === "inspection" ? "bg-green-500/20 text-green-700 dark:text-green-300" :
                        apt.type === "job_start" ? "bg-orange-500/20 text-orange-700 dark:text-orange-300" :
                        "bg-gray-500/20 text-gray-700 dark:text-gray-300"
                      }`}>
                        {apt.type}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create appointment dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Appointment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAppointment} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="e.g., Roof Inspection" required />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue="estimate">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estimate">Estimate</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="job_start">Job Start</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Add details..." />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="Address or job site" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startHour">Start Time (Hour)</Label>
                <Select name="startHour" defaultValue="9">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString().padStart(2, "0")}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="durationHours">Duration (Hours)</Label>
                <Select name="durationHours" defaultValue="1">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0.5, 1, 1.5, 2, 3, 4, 8].map((hours) => (
                      <SelectItem key={hours} value={hours.toString()}>
                        {hours} hour{hours !== 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Additional notes..." />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Create Appointment
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
