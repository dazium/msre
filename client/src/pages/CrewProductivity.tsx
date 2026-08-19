import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Award,
  BriefcaseBusiness,
  CircleDollarSign,
  ClipboardCheck,
  HardHat,
  TrendingUp,
  Users,
} from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

type CrewMetric = {
  id: number;
  name: string;
  status: "active" | "inactive";
  memberCount: number;
  totalJobs: number;
  eligibleJobs: number;
  completedJobs: number;
  activeJobs: number;
  scheduledJobs: number;
  completionRate: number;
  completedValue: number;
  averageCompletedValue: number;
  pipelineValue: number;
  jobsPerMember: number;
};

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Users;
  accent: string;
}) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/55">{label}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-foreground/55">{detail}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompletionBar({ value }: { value: number }) {
  const normalizedValue = Math.max(0, Math.min(100, value));
  const color = normalizedValue >= 75 ? "bg-emerald-400" : normalizedValue >= 40 ? "bg-amber-400" : "bg-slate-400";

  return (
    <div className="flex min-w-[140px] items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${normalizedValue}%` }} />
      </div>
      <span className="w-9 text-right text-xs font-semibold text-foreground">{normalizedValue}%</span>
    </div>
  );
}

export default function CrewProductivity() {
  const [, setLocation] = useLocation();
  const [crewFilter, setCrewFilter] = useState("all");
  const { data, isLoading, isError } = trpc.crews.productivity.useQuery();

  const crews = (data ?? []) as CrewMetric[];
  const reportCrews = useMemo(
    () => (crewFilter === "all" ? crews : crews.filter((crew) => crew.id.toString() === crewFilter)),
    [crewFilter, crews],
  );

  const totals = useMemo(() => {
    const completedJobs = reportCrews.reduce((sum, crew) => sum + crew.completedJobs, 0);
    const totalJobs = reportCrews.reduce((sum, crew) => sum + crew.totalJobs, 0);
    const activeJobs = reportCrews.reduce((sum, crew) => sum + crew.activeJobs, 0);
    const completedValue = reportCrews.reduce((sum, crew) => sum + crew.completedValue, 0);
    const members = reportCrews.reduce((sum, crew) => sum + crew.memberCount, 0);
    const eligibleJobs = reportCrews.reduce((sum, crew) => sum + crew.eligibleJobs, 0);

    return {
      completedJobs,
      totalJobs,
      activeJobs,
      completedValue,
      members,
      averageCompletedValue: completedJobs > 0 ? completedValue / completedJobs : 0,
      completionRate: eligibleJobs > 0 ? Math.round((completedJobs / eligibleJobs) * 100) : 0,
      eligibleJobs,
    };
  }, [reportCrews]);

  const chartData = reportCrews.map((crew) => ({
    name: crew.name.length > 16 ? `${crew.name.slice(0, 16)}…` : crew.name,
    completed: crew.completedJobs,
    active: crew.activeJobs,
    scheduled: crew.scheduledJobs,
  }));

  const bestPerformingCrew = reportCrews[0];

  return (
    <div className="space-y-6">
      <section className="blueprint-section">
        <div className="blueprint-header flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Operations intelligence</p>
            <h1 className="mt-1 text-3xl font-bold">Crew Productivity</h1>
            <p className="mt-1 max-w-2xl text-sm text-foreground/65">
              Compare assigned workload, completed jobs, and completed-job value across your crews.
            </p>
          </div>
          <div className="w-full lg:w-64">
            <label htmlFor="crew-productivity-filter" className="mb-1.5 block text-xs font-semibold text-foreground/65">
              Report scope
            </label>
            <Select value={crewFilter} onValueChange={setCrewFilter}>
              <SelectTrigger id="crew-productivity-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All crews</SelectItem>
                {crews.map((crew) => (
                  <SelectItem key={crew.id} value={crew.id.toString()}>
                    {crew.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <div className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground/75">
        <strong className="text-foreground">Metric definition:</strong> completion rate is completed assigned projects divided by non-cancelled assigned projects. Completed-job value uses actual project value when entered, otherwise the estimated value.
      </div>

      {isLoading ? (
        <div className="blueprint-section py-16 text-center text-foreground/60">Loading crew productivity data...</div>
      ) : isError ? (
        <div className="blueprint-section py-16 text-center">
          <p className="font-medium text-foreground">Crew productivity data could not be loaded.</p>
          <p className="mt-1 text-sm text-foreground/60">Refresh the page and try again.</p>
        </div>
      ) : reportCrews.length === 0 ? (
        <div className="blueprint-section py-16 text-center">
          <HardHat className="mx-auto h-10 w-10 text-primary/70" />
          <p className="mt-4 font-medium text-foreground">No crew activity to report yet.</p>
          <p className="mt-1 text-sm text-foreground/60">Create a crew and assign it to a project to populate this report.</p>
          <Button className="mt-5" onClick={() => setLocation("/crews")}>
            Manage Crews
          </Button>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard
              label="Completed jobs"
              value={totals.completedJobs}
              detail={`${totals.totalJobs} assigned projects`}
              icon={ClipboardCheck}
              accent="bg-emerald-400/15 text-emerald-300"
            />
            <MetricCard
              label="Completion rate"
              value={`${totals.completionRate}%`}
              detail={`${totals.eligibleJobs} non-cancelled jobs`}
              icon={TrendingUp}
              accent="bg-teal-400/15 text-teal-300"
            />
            <MetricCard
              label="Active workload"
              value={totals.activeJobs}
              detail="Scheduled, in progress, or on hold"
              icon={BriefcaseBusiness}
              accent="bg-amber-400/15 text-amber-300"
            />
            <MetricCard
              label="Completed value"
              value={currencyFormatter.format(totals.completedValue)}
              detail="Actual value, with estimate fallback"
              icon={CircleDollarSign}
              accent="bg-primary/15 text-primary"
            />
            <MetricCard
              label="Average per job"
              value={currencyFormatter.format(totals.averageCompletedValue)}
              detail="Across completed assigned jobs"
              icon={Award}
              accent="bg-violet-400/15 text-violet-300"
            />
            <MetricCard
              label="Crew capacity"
              value={totals.members}
              detail="Active and inactive crew members"
              icon={Users}
              accent="bg-sky-400/15 text-sky-300"
            />
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
            <Card className="border-border/60 bg-card/60 xl:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Completed Jobs vs. Active Workload</CardTitle>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
                    />
                    <Legend />
                    <Bar dataKey="completed" name="Completed" fill="#34d399" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="active" name="Active workload" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60 xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {reportCrews.map((crew) => (
                  <div key={crew.id}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-foreground">{crew.name}</span>
                      <span className="shrink-0 text-xs text-foreground/55">
                        {crew.completedJobs}/{crew.totalJobs} jobs
                      </span>
                    </div>
                    <CompletionBar value={crew.completionRate} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          {bestPerformingCrew && (
            <section className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 px-5 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300">Current leader</p>
                  <p className="mt-1 font-semibold text-foreground">{bestPerformingCrew.name}</p>
                </div>
                <p className="text-sm text-foreground/70">
                  {bestPerformingCrew.completedJobs} completed job{bestPerformingCrew.completedJobs === 1 ? "" : "s"} · {currencyFormatter.format(bestPerformingCrew.completedValue)} completed value
                </p>
              </div>
            </section>
          )}

          <section className="blueprint-section">
            <div className="blueprint-header">
              <h2 className="text-lg font-semibold">Crew Performance Detail</h2>
            </div>
            <div className="space-y-3 p-4 sm:hidden">
              {reportCrews.map((crew) => (
                <article key={crew.id} className="mobile-data-card">
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" onClick={() => setLocation(`/crews/${crew.id}`)} className="text-left font-semibold text-foreground hover:text-primary">{crew.name}</button>
                    <Badge variant={crew.status === "active" ? "default" : "secondary"} className="shrink-0 text-[10px] capitalize">{crew.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-foreground/65">{crew.memberCount} member{crew.memberCount === 1 ? "" : "s"} · {crew.activeJobs} active · {crew.scheduledJobs} scheduled</p>
                  <div className="mt-4"><p className="mobile-data-label">Completion</p><p className="mt-1 text-sm font-medium">{crew.completedJobs} / {crew.totalJobs} jobs</p><div className="mt-2"><CompletionBar value={crew.completionRate} /></div></div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="mobile-data-label">Completed value</p><p className="mt-1 font-semibold text-emerald-300">{currencyFormatter.format(crew.completedValue)}</p></div><div><p className="mobile-data-label">Open pipeline</p><p className="mt-1 font-semibold text-primary">{currencyFormatter.format(crew.pipelineValue)}</p></div><div className="col-span-2"><p className="mobile-data-label">Average completed job</p><p className="mt-1 text-foreground/75">{currencyFormatter.format(crew.averageCompletedValue)}</p></div></div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-[1080px] w-full text-sm">
                <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-foreground/55">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Crew</th>
                    <th className="px-5 py-3 font-semibold">Team</th>
                    <th className="px-5 py-3 font-semibold">Completed</th>
                    <th className="px-5 py-3 font-semibold">Completion Rate</th>
                    <th className="px-5 py-3 font-semibold">Active Load</th>
                    <th className="px-5 py-3 font-semibold">Completed Value</th>
                    <th className="px-5 py-3 font-semibold">Avg. / Completed Job</th>
                    <th className="px-5 py-3 font-semibold">Open Pipeline</th>
                  </tr>
                </thead>
                <tbody>
                  {reportCrews.map((crew) => (
                    <tr key={crew.id} className="border-b border-border/70 last:border-0 hover:bg-muted/25">
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setLocation(`/crews/${crew.id}`)}
                          className="font-semibold text-foreground transition-colors hover:text-primary"
                        >
                          {crew.name}
                        </button>
                        <div className="mt-1">
                          <Badge variant={crew.status === "active" ? "default" : "secondary"} className="text-[10px] capitalize">
                            {crew.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-foreground/75">
                        {crew.memberCount} member{crew.memberCount === 1 ? "" : "s"}
                      </td>
                      <td className="px-5 py-4 font-medium text-foreground">
                        {crew.completedJobs} <span className="font-normal text-foreground/50">/ {crew.totalJobs}</span>
                      </td>
                      <td className="px-5 py-4"><CompletionBar value={crew.completionRate} /></td>
                      <td className="px-5 py-4 text-foreground/75">
                        {crew.activeJobs} active <span className="text-foreground/45">· {crew.scheduledJobs} scheduled</span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-emerald-300">{currencyFormatter.format(crew.completedValue)}</td>
                      <td className="px-5 py-4 text-foreground/75">{currencyFormatter.format(crew.averageCompletedValue)}</td>
                      <td className="px-5 py-4 text-primary">{currencyFormatter.format(crew.pipelineValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
