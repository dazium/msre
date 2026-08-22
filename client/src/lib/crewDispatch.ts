export type CrewScheduleItem = {
  crewId?: number | null;
  startTime: Date | string;
  endTime: Date | string;
  status?: string | null;
  title?: string | null;
  location?: string | null;
};

export type CrewAvailability = "available" | "assigned_today" | "on_job";

const inactiveAppointmentStatuses = new Set(["cancelled"]);

export function getDayWindow(reference = new Date()) {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  const end = new Date(reference);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getCrewDailyAssignments(
  crewId: number,
  appointments: CrewScheduleItem[],
  reference = new Date(),
) {
  const { start, end } = getDayWindow(reference);
  return appointments
    .filter((appointment) => {
      if (appointment.crewId !== crewId || inactiveAppointmentStatuses.has(appointment.status ?? "")) return false;
      const appointmentStart = new Date(appointment.startTime);
      const appointmentEnd = new Date(appointment.endTime);
      return appointmentStart <= end && appointmentEnd >= start;
    })
    .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime());
}

export function getCrewAvailability(
  crewId: number,
  appointments: CrewScheduleItem[],
  reference = new Date(),
): CrewAvailability {
  const dailyAssignments = getCrewDailyAssignments(crewId, appointments, reference);
  if (dailyAssignments.some((assignment) => {
    const start = new Date(assignment.startTime).getTime();
    const end = new Date(assignment.endTime).getTime();
    const now = reference.getTime();
    return start <= now && now <= end;
  })) return "on_job";
  return dailyAssignments.length > 0 ? "assigned_today" : "available";
}

export function toLocalDateTimeInput(value: Date) {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}
