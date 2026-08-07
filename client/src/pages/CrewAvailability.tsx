import DragDropScheduler from "@/components/DragDropScheduler";

export default function CrewAvailability() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Job Scheduling</h1>
      </div>

      <DragDropScheduler />
    </div>
  );
}
