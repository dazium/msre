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
import { ContactLink } from "@/components/ContactLink";
import { AddressMapModal } from "@/components/AddressMapModal";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 31)); // March 2026
  const [showDialog, setShowDialog] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", startTime: "", endTime: "", status: "scheduled", location: "", notes: "" });
  const [dayDetail, setDayDetail] = useState<{ label: string; appointments: any[] } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const { data: appointmentsData, isLoading } = trpc.appointments.list.useQuery();
  const createMutation = trpc.appointments.create.useMutation();
  const updateMutation = trpc.appointments.update.useMutation();
  const deleteMutation = trpc.appointments.delete.useMutation();
  const utils = trpc.useUtils();

  const toDateTimeLocal = (value: Date | string) => {
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
  };

  const openAppointmentEditor = (appointment: any) => {
    setEditingAppointment(appointment);
    setEditForm({
      title: appointment.title || "",
      description: appointment.description || "",
      startTime: toDateTimeLocal(appointment.startTime),
      endTime: toDateTimeLocal(appointment.endTime),
      status: appointment.status || "scheduled",
      location: appointment.location || "",
      notes: appointment.notes || "",
    });
  };

  const openDayDetail = (day: number, dayAppointments: any[]) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (dayAppointments.length === 0) {
      setSelectedDate(date);
      setShowDialog(true);
      return;
    }
    setDayDetail({
      label: date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
      appointments: dayAppointments,
    });
  };

  useEffect(() => {
    if (appointmentsData) {
      setAppointments(appointmentsData);
    }
  }, [appointmentsData]);

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesType = typeFilter === "all" || appointment.type === typeFilter;
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const clearFilters = () => {
    setTypeFilter("all");
    setStatusFilter("all");
  };

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
    return filteredAppointments.filter((apt) => {
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
      await utils.appointments.list.invalidate();
      setShowDialog(false);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast.error("Failed to create appointment");
    }
  };

  const handleUpdateAppointment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingAppointment || !editForm.title.trim()) return;
    const startTime = new Date(editForm.startTime);
    const endTime = new Date(editForm.endTime);
    if (endTime <= startTime) {
      toast.error("End time must be after the start time");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: editingAppointment.id,
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        startTime,
        endTime,
        status: editForm.status as "scheduled" | "completed" | "cancelled" | "no_show",
        location: editForm.location.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
      });
      await utils.appointments.list.invalidate();
      toast.success("Appointment updated");
      setEditingAppointment(null);
    } catch {
      toast.error("Could not update appointment");
    }
  };

  const handleDeleteAppointment = async () => {
    if (!editingAppointment || !window.confirm(`Delete appointment “${editingAppointment.title}”?`)) return;
    try {
      await deleteMutation.mutateAsync({ id: editingAppointment.id });
      await utils.appointments.list.invalidate();
      toast.success("Appointment deleted");
      setEditingAppointment(null);
    } catch {
      toast.error("Could not delete appointment");
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Calendar & Scheduling</h1>
        <Button onClick={() => { setSelectedDate(new Date()); setShowDialog(true); }} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          New Appointment
        </Button>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:items-end">
            <div>
              <Label htmlFor="calendar-type-filter">Appointment type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="calendar-type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="estimate">Estimate</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="job_start">Job start</SelectItem>
                  <SelectItem value="follow_up">Follow up</SelectItem>
                  <SelectItem value="work_order">Work order</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="calendar-status-filter">Appointment status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="calendar-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-3 md:col-span-2 md:justify-end lg:col-span-1">
              <p className="text-sm text-muted-foreground">
                Showing {filteredAppointments.length} of {appointments.length}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearFilters}
                disabled={typeFilter === "all" && statusFilter === "all"}
              >
                Clear filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-background/50 backdrop-blur">
        <CardHeader className="border-b border-border/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <CardTitle className="text-lg sm:text-xl">{monthName}</CardTitle>
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
        <CardContent className="p-3 sm:p-6">
          <div>
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-1 text-center text-[10px] font-semibold text-muted-foreground sm:p-2 sm:text-sm">
                  {day}
                </div>
              ))}

              {/* Empty days */}
              {emptyDays.map((i) => (
                <div key={`empty-${i}`} className="min-h-12 rounded bg-muted/30 sm:min-h-20" />
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
                    onClick={() => openDayDetail(day, dayAppointments)}
                    className={`min-h-12 min-w-0 rounded border p-1 cursor-pointer transition-colors sm:min-h-20 sm:p-2 ${
                      isToday
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="mb-1 text-xs font-semibold sm:text-sm">{day}</div>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 2).map((apt) => (
                        <button
                          key={apt.id}
                          type="button"
                          onClick={(event) => { event.stopPropagation(); openAppointmentEditor(apt); }}
                          className="truncate rounded bg-blue-500/20 px-1 py-0.5 text-[10px] text-blue-700 dark:text-blue-300 sm:text-xs"
                        >
                          {apt.title}
                        </button>
                      ))}
                      {dayAppointments.length > 2 && (
                        <button type="button" onClick={(event) => { event.stopPropagation(); openDayDetail(day, dayAppointments); }} className="text-left text-xs text-primary hover:underline">
                          +{dayAppointments.length - 2} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
          {filteredAppointments.length === 0 ? (
            <p className="text-muted-foreground">
              {appointments.length === 0 ? "No appointments scheduled" : "No appointments match the selected filters"}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredAppointments
                .filter((apt) => {
                  const aptDate = new Date(apt.startTime);
                  const today = new Date();
                  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                  return aptDate >= today && aptDate <= sevenDaysFromNow;
                })
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((apt) => (
                  <div key={apt.id} role="button" tabIndex={0} onClick={() => openAppointmentEditor(apt)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openAppointmentEditor(apt); }} className="flex w-full cursor-pointer items-start gap-4 rounded-lg border border-border/50 p-4 text-left transition-colors hover:bg-muted/50">
                    <div className="flex-1">
                      <h3 className="font-semibold">{apt.title}</h3>
                      <p className="text-sm text-muted-foreground">{apt.description}</p>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(apt.startTime).toLocaleString()}
                        </div>
                        {apt.location && <div onClick={(event) => event.stopPropagation()}><ContactLink type="address" value={apt.location} label={apt.location} onAddressClick={(addr) => { setSelectedAddress(addr); setMapOpen(true); }} /></div>}
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
        <DialogContent className="max-w-full sm:max-w-md w-[95vw] sm:w-auto max-h-[90vh] overflow-y-auto">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:flex-1">
                Create Appointment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Appointment</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateAppointment} className="space-y-4">
            <div><Label htmlFor="edit-appointment-title">Title</Label><Input id="edit-appointment-title" value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} required /></div>
            <div><Label htmlFor="edit-appointment-description">Description</Label><Textarea id="edit-appointment-description" value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="edit-appointment-start">Start</Label><Input id="edit-appointment-start" type="datetime-local" value={editForm.startTime} onChange={(event) => setEditForm({ ...editForm, startTime: event.target.value })} required /></div><div><Label htmlFor="edit-appointment-end">End</Label><Input id="edit-appointment-end" type="datetime-local" value={editForm.endTime} onChange={(event) => setEditForm({ ...editForm, endTime: event.target.value })} required /></div></div>
            <div><Label htmlFor="edit-appointment-status">Status</Label><Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}><SelectTrigger id="edit-appointment-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem><SelectItem value="no_show">No show</SelectItem></SelectContent></Select></div>
            <div><Label htmlFor="edit-appointment-location">Location</Label><Input id="edit-appointment-location" value={editForm.location} onChange={(event) => setEditForm({ ...editForm, location: event.target.value })} /></div>
            <div><Label htmlFor="edit-appointment-notes">Notes</Label><Textarea id="edit-appointment-notes" value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} /></div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><Button type="button" variant="destructive" onClick={handleDeleteAppointment} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Deleting..." : "Delete"}</Button><div className="flex flex-col-reverse gap-2 sm:flex-row"><Button type="button" variant="outline" onClick={() => setEditingAppointment(null)}>Cancel</Button><Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save changes"}</Button></div></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!dayDetail} onOpenChange={(open) => !open && setDayDetail(null)}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto">
          <DialogHeader><DialogTitle>{dayDetail?.label}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {dayDetail?.appointments.map((appointment) => (
              <button key={appointment.id} type="button" onClick={() => { setDayDetail(null); openAppointmentEditor(appointment); }} className="flex min-h-16 w-full items-center justify-between gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary hover:bg-muted/40">
                <div className="min-w-0"><p className="truncate font-semibold">{appointment.title}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(appointment.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}–{new Date(appointment.endTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p></div>
                <span className="shrink-0 text-xs font-semibold capitalize text-primary">{appointment.status.replace("_", " ")}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
