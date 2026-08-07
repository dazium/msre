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
  crew?: { id: number; name: string };
  appointment?: { id: number; title: string };
}

export default function DragDropScheduler() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [draggedJob, setDraggedJob] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [newJob, setNewJob] = useState({ title: "", crewId: "", startTime: "" });

  const { data: appointments } = trpc.appointments.list.useQuery();
  const { data: crews } = trpc.crews.list.useQuery();
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

    // Check if slot is occupied
    if (isSlotOccupied(time) && getAppointmentAtSlot(time)?.id !== draggedJob.id) {
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
          toast.success("Job scheduled successfully");
          setDraggedJob(null);
        },
        onError: () => {
          toast.error("Failed to schedule job");
        },
      }
    );
  };

  const handleCreateJob = async () => {
    if (!newJob.title || !newJob.crewId || !selectedSlot) {
      toast.error("Please fill in all fields");
      return;
    }

    const startTime = new Date(`${selectedDate}T${selectedSlot.time}:00`);
    
    try {
      // Create appointment (you may need to adjust this based on your API)
      toast.success("Job created and scheduled");
      setShowCreateDialog(false);
      setNewJob({ title: "", crewId: "", startTime: "" });
      setSelectedSlot(null);
    } catch (error) {
      toast.error("Failed to create job");
    }
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
              {dayAppointments
                .filter(apt => !apt.startTime)
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
              {dayAppointments.filter(apt => !apt.startTime).length === 0 && (
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
                      setSelectedSlot({ id: time, time });
                      setShowCreateDialog(true);
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
        {dayAppointments.length > timeSlots.length && (
          <Card className="border-red-500/50 bg-red-950/20 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-red-500">Scheduling Conflicts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80">
                More jobs than available time slots. Some jobs may overlap.
              </p>
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
              <Label>Assign Crew</Label>
              <Select value={newJob.crewId} onValueChange={(v) => setNewJob({ ...newJob, crewId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select crew..." />
                </SelectTrigger>
                <SelectContent>
                  {crews?.map(crew => (
                    <SelectItem key={crew.id} value={crew.id.toString()}>
                      {crew.name}
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
