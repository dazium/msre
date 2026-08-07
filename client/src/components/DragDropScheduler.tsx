import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ScheduleSlot {
  id: string;
  time: string;
}

export default function DragDropScheduler() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [draggedJob, setDraggedJob] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [newJob, setNewJob] = useState({ title: "", customerId: "", startTime: "" });
  const [conflicts, setConflicts] = useState<any[]>([]);

  const { data: appointments, refetch: refetchAppointments } = trpc.appointments.list.useQuery();
  const { data: customers } = trpc.customers.list.useQuery();
  const createAppointmentMutation = trpc.appointments.create.useMutation();
  const updateAppointmentMutation = trpc.appointments.update.useMutation();

  // Generate time slots for the day (8 AM to 6 PM, 1-hour slots)
  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Get appointments for selected date
  const dayAppointments = appointments?.filter(apt => {
    const aptDate = new Date(apt.startTime).toISOString().split('T')[0];
    return aptDate === selectedDate;
  }) || [];

  // Detect time overlaps
  useEffect(() => {
    const foundConflicts = [];
    for (let i = 0; i < dayAppointments.length; i++) {
      for (let j = i + 1; j < dayAppointments.length; j++) {
        const apt1 = dayAppointments[i];
        const apt2 = dayAppointments[j];
        const start1 = new Date(apt1.startTime).getTime();
        const end1 = new Date(apt1.endTime || apt1.startTime).getTime();
        const start2 = new Date(apt2.startTime).getTime();
        const end2 = new Date(apt2.endTime || apt2.startTime).getTime();

        // Check for overlap
        if (start1 < end2 && end1 > start2) {
          foundConflicts.push({ apt1, apt2 });
        }
      }
    }
    setConflicts(foundConflicts);
  }, [dayAppointments]);

  // Check if slot is occupied
  const isSlotOccupied = (time: string) => {
    return dayAppointments.some(apt => {
      const aptTime = new Date(apt.startTime).toISOString().split('T')[1].substring(0, 5);
      return aptTime === time;
    });
  };

  // Get appointment at time slot
  const getAppointmentAtSlot = (time: string) => {
    return dayAppointments.find(apt => {
      const aptTime = new Date(apt.startTime).toISOString().split('T')[1].substring(0, 5);
      return aptTime === time;
    });
  };

  const handleDragStart = (e: React.DragEvent, appointment: any) => {
    setDraggedJob(appointment);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, time: string) => {
    e.preventDefault();
    if (!draggedJob) return;

    // Check if slot is occupied by different appointment
    const slotAppointment = getAppointmentAtSlot(time);
    if (slotAppointment && slotAppointment.id !== draggedJob.id) {
      toast.error("Time slot is already occupied");
      return;
    }

    // Update appointment time
    const newStartTime = new Date(`${selectedDate}T${time}:00`);
    updateAppointmentMutation.mutate(
      {
        id: draggedJob.id,
        startTime: newStartTime,
      },
      {
        onSuccess: () => {
          toast.success("Job rescheduled successfully");
          setDraggedJob(null);
          refetchAppointments();
        },
        onError: () => {
          toast.error("Failed to reschedule job");
        },
      }
    );
  };

  const handleCreateJob = async () => {
    if (!newJob.title || !newJob.customerId || !selectedSlot) {
      toast.error("Please fill in all fields");
      return;
    }

    const startTime = new Date(`${selectedDate}T${selectedSlot.time}:00`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    createAppointmentMutation.mutate(
      {
        customerId: parseInt(newJob.customerId),
        title: newJob.title,
        startTime,
        endTime,
        type: "other",
        status: "scheduled",
      },
      {
        onSuccess: () => {
          toast.success("Job created and scheduled");
          setShowCreateDialog(false);
          setNewJob({ title: "", customerId: "", startTime: "" });
          setSelectedSlot(null);
          refetchAppointments();
        },
        onError: () => {
          toast.error("Failed to create job");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Drag-and-Drop Scheduler</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
        />
      </div>

      <div className="grid gap-4">
        {/* Unscheduled Jobs */}
        <Card className="border-border/50 bg-background/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Unscheduled Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {appointments
                ?.filter(apt => !apt.startTime)
                .map(apt => (
                  <div
                    key={apt.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, apt)}
                    className="p-3 bg-blue-950/30 border border-blue-500/50 rounded cursor-move hover:bg-blue-950/50 transition-colors"
                  >
                    <p className="font-semibold text-foreground">{apt.title}</p>
                    <p className="text-xs text-foreground/60">{apt.description}</p>
                  </div>
                ))}
              {!appointments?.some(apt => !apt.startTime) && (
                <p className="text-foreground/60 text-center py-4">No unscheduled jobs</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Time Slots Grid */}
        <Card className="border-border/50 bg-background/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Daily Schedule - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {timeSlots.map(time => {
                const appointment = getAppointmentAtSlot(time);
                const isOccupied = !!appointment;

                return (
                  <div
                    key={time}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, time)}
                    onClick={() => {
                      if (!isOccupied) {
                        setSelectedSlot({ id: time, time });
                        setShowCreateDialog(true);
                      }
                    }}
                    className={`p-4 rounded border-2 border-dashed transition-colors cursor-pointer min-h-24 flex flex-col justify-between ${
                      isOccupied
                        ? "bg-red-950/20 border-red-500/50"
                        : "bg-background/50 border-border/50 hover:border-primary/50 hover:bg-background/70"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-foreground/60" />
                      <span className="font-semibold text-foreground">{time}</span>
                    </div>

                    {isOccupied && appointment ? (
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, appointment)}
                        className="p-2 bg-blue-950/40 rounded border border-blue-500/50 cursor-move hover:bg-blue-950/60 transition-colors"
                      >
                        <p className="text-sm font-semibold text-foreground truncate">
                          {appointment.title}
                        </p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {appointment.status}
                        </Badge>
                      </div>
                    ) : (
                      <div className="text-xs text-foreground/40 text-center">
                        Drop job here or click to create
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Conflict Alerts */}
        {conflicts.length > 0 && (
          <Card className="border-red-500/50 bg-red-950/20 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-red-500">Scheduling Conflicts ({conflicts.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {conflicts.map((conflict, idx) => (
                  <div key={idx} className="text-sm text-foreground/80">
                    <strong>{conflict.apt1.title}</strong> overlaps with <strong>{conflict.apt2.title}</strong>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Job Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Job at {selectedSlot?.time}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Job Title</Label>
              <Input
                placeholder="e.g., Roof Inspection"
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
              />
            </div>

            <div>
              <Label>Customer</Label>
              <Select value={newJob.customerId} onValueChange={(v) => setNewJob({ ...newJob, customerId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map(customer => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.firstName} {customer.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateJob}>
                Schedule Job
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
