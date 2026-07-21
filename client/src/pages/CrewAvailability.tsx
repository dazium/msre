import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock, AlertCircle, Plus } from "lucide-react";
import { toast } from "sonner";

export default function CrewAvailability() {
  const [selectedCrew, setSelectedCrew] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);

  const { data: crews } = trpc.crews.list.useQuery();
  const { data: appointments } = trpc.appointments.list.useQuery();
  const { data: crewMembers } = selectedCrew 
    ? trpc.crews.getMembers.useQuery({ crewId: selectedCrew })
    : { data: undefined };

  // Check for scheduling conflicts
  useEffect(() => {
    if (!appointments || !selectedCrew) return;

    const selectedDateAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.startTime).toISOString().split('T')[0];
      return aptDate === selectedDate;
    });

    // Find overlapping appointments
    const foundConflicts = [];
    for (let i = 0; i < selectedDateAppointments.length; i++) {
      for (let j = i + 1; j < selectedDateAppointments.length; j++) {
        const apt1 = selectedDateAppointments[i];
        const apt2 = selectedDateAppointments[j];
        const start1 = new Date(apt1.startTime).getTime();
        const end1 = new Date(apt1.endTime || apt1.startTime).getTime();
        const start2 = new Date(apt2.startTime).getTime();
        const end2 = new Date(apt2.endTime || apt2.startTime).getTime();

        if ((start1 < end2 && end1 > start2)) {
          foundConflicts.push({ apt1, apt2 });
        }
      }
    }

    setConflicts(foundConflicts);
  }, [appointments, selectedCrew, selectedDate]);

  // Get appointments for selected date
  const dayAppointments = appointments?.filter(apt => {
    const aptDate = new Date(apt.startTime).toISOString().split('T')[0];
    return aptDate === selectedDate;
  }) || [];

  // Sort appointments by time
  const sortedAppointments = [...dayAppointments].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Crew Availability</h1>
        <Button onClick={() => setShowScheduleDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Schedule Job
        </Button>
      </div>

      {/* Crew Selection */}
      <Card className="border-border/50 bg-background/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Select Crew</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCrew?.toString() || ""} onValueChange={(v) => setSelectedCrew(parseInt(v))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a crew..." />
            </SelectTrigger>
            <SelectContent>
              {crews?.map(crew => (
                <SelectItem key={crew.id} value={crew.id.toString()}>
                  {crew.name} ({crew.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCrew && (
        <>
          {/* Date Selection */}
          <Card className="border-border/50 bg-background/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              />
            </CardContent>
          </Card>

          {/* Conflict Alerts */}
          {conflicts.length > 0 && (
            <Card className="border-red-500/50 bg-red-950/20 backdrop-blur">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-red-500">Schedule Conflicts</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {conflicts.map((conflict, idx) => (
                    <div key={idx} className="p-3 bg-background/50 rounded border border-red-500/30">
                      <p className="text-sm font-semibold text-foreground">
                        {conflict.apt1.title} overlaps with {conflict.apt2.title}
                      </p>
                      <p className="text-xs text-foreground/60 mt-1">
                        {new Date(conflict.apt1.startTime).toLocaleTimeString()} - {new Date(conflict.apt2.endTime).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Crew Members */}
          {crewMembers && crewMembers.length > 0 && (
            <Card className="border-border/50 bg-background/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {crewMembers.map(member => (
                    <div key={member.id} className="p-4 rounded border border-border/50 bg-background/30">
                      <p className="font-semibold text-foreground">{member.name}</p>
                      <p className="text-xs text-foreground/60 mt-1">{member.email}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Schedule */}
          <Card className="border-border/50 bg-background/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule for {new Date(selectedDate).toLocaleDateString()}
              </CardTitle>
              <CardDescription>
                {sortedAppointments.length} appointment{sortedAppointments.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sortedAppointments.length > 0 ? (
                <div className="space-y-3">
                  {sortedAppointments.map(apt => (
                    <div key={apt.id} className="p-4 rounded border border-border/50 bg-background/30 hover:bg-background/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{apt.title}</p>
                          <div className="flex items-center gap-2 mt-2 text-sm text-foreground/60">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {apt.endTime ? ` - ${new Date(apt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                            </span>
                          </div>
                        </div>
                        <Badge variant={apt.status === 'completed' ? 'secondary' : 'default'}>
                          {apt.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-foreground/60 text-center py-8">
                  No appointments scheduled for this crew on this date.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-foreground/60">
              Use the Calendar page to create and schedule jobs for crews.
            </p>
            <Button 
              onClick={() => {
                setShowScheduleDialog(false);
                window.location.href = '/calendar';
              }}
              className="w-full"
            >
              Go to Calendar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
