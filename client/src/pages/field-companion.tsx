import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { isToday, isPast, isTomorrow, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import CompanionShell from "@/features/field-companion/companion-shell";
import { JobCard, type JobWithSite } from "@/features/field-companion/job-card";
import { ROUTES, buildPath } from "@/lib/routes";
import { useSyncQueue } from "@/hooks/useSyncQueue";
import { useAuth } from "@/hooks/useAuth";
import { Wifi, AlertCircle, PlayCircle, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  companyName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

function StatusPill({ pending, syncing }: { pending: number; syncing: boolean }) {
  const Icon = syncing ? RotateCw : pending > 0 ? AlertCircle : Wifi;
  const label = syncing ? "Syncing" : pending > 0 ? `${pending} pending` : "Synced";
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium">
      <Icon className={cn("h-4 w-4", syncing && "animate-spin")} />
      {label}
    </div>
  );
}

export default function FieldCompanion() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { pending, syncing } = useSyncQueue();

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<JobWithSite[]>({
    queryKey: ["/api/jobs-with-sites"],
    enabled: !!user?.id,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: !!user?.id,
  });

  const todaysJobs = jobs.filter((j) => j.scheduledDate && isToday(parseISO(j.scheduledDate)) && j.status !== "completed");
  const activeJob = jobs.find((j) => j.status === "in_progress") ?? todaysJobs[0];
  const completedToday = jobs.filter((j) => j.scheduledDate && isToday(parseISO(j.scheduledDate)) && j.status === "completed");
  const upcoming = jobs.filter((j) => j.scheduledDate && (isTomorrow(parseISO(j.scheduledDate)) || (!isPast(parseISO(j.scheduledDate)) && !isToday(parseISO(j.scheduledDate)))));

  const nextJobLabel = useMemo(() => {
    if (!activeJob) return "No job scheduled";
    const client = clients.find((c) => c.id === activeJob.clientId);
    return [client?.companyName, activeJob.site?.name].filter(Boolean).join(" - ");
  }, [activeJob, clients]);

  return (
    <CompanionShell
      title={activeJob ? "Today" : "No jobs assigned"}
      subtitle={activeJob ? nextJobLabel || "Ready when you are" : "Awaiting dispatch"}
      status={<StatusPill pending={pending} syncing={syncing} />}
    >
      <section className="pt-4 space-y-3">
        <Card className="border-border/70 bg-card/70 shadow-sm">
          <CardHeader className="pb-2">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Readiness</p>
            <CardTitle className="text-base">Today at a glance</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-lg border border-border/70 bg-muted/40 px-2 py-3">
              <p className="text-xs uppercase text-muted-foreground">Active</p>
              <p className="text-lg font-semibold">{todaysJobs.length}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/40 px-2 py-3">
              <p className="text-xs uppercase text-muted-foreground">Upcoming</p>
              <p className="text-lg font-semibold">{upcoming.length}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/40 px-2 py-3">
              <p className="text-xs uppercase text-muted-foreground">Completed</p>
              <p className="text-lg font-semibold">{completedToday.length}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Next job</h2>
          {activeJob && (
            <Button
              size="sm"
              variant="secondary"
              className="gap-2"
              onClick={() => setLocation(buildPath(ROUTES.FIELD_COMPANION_JOB, { id: activeJob.id }))}
            >
              <PlayCircle className="h-4 w-4" />
              Resume
            </Button>
          )}
        </div>
        {jobsLoading && <p className="text-sm text-muted-foreground">Loading jobs...</p>}
        {!jobsLoading && activeJob && (
          <JobCard job={activeJob} onOpen={(id) => setLocation(buildPath(ROUTES.FIELD_COMPANION_JOB, { id }))} />
        )}
        {!jobsLoading && !activeJob && (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">No work scheduled today.</CardContent>
          </Card>
        )}
      </section>

      <section className="py-2 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Timeline</h3>
          <Badge variant="outline">Today</Badge>
        </div>
        <ScrollArea className="h-52 rounded-md border border-border/70 bg-card/60">
          <div className="p-3 space-y-2">
            {todaysJobs.map((job) => (
              <div
                key={job.id}
                className={cn(
                  "rounded-lg border px-3 py-2 flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  job.id === activeJob?.id && "border-primary/60 bg-primary/5"
                )}
                role="button"
                tabIndex={0}
                onClick={() => setLocation(buildPath(ROUTES.FIELD_COMPANION_JOB, { id: job.id }))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setLocation(buildPath(ROUTES.FIELD_COMPANION_JOB, { id: job.id }));
                  }
                }}
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.site?.name || job.siteAddress}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{job.jobNumber}</p>
                  <p className="text-xs capitalize text-muted-foreground">{job.status}</p>
                </div>
              </div>
            ))}
            {!todaysJobs.length && (
              <p className="text-xs text-muted-foreground">No jobs scheduled today.</p>
            )}
          </div>
        </ScrollArea>
      </section>

      <section className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Upcoming</h3>
          <Badge variant="outline">+{upcoming.length}</Badge>
        </div>
        <div className="grid gap-3">
          {upcoming.slice(0, 3).map((job) => (
            <JobCard key={job.id} job={job} onOpen={(id) => setLocation(buildPath(ROUTES.FIELD_COMPANION_JOB, { id }))} />
          ))}
          {!upcoming.length && <p className="text-xs text-muted-foreground">No future visits planned.</p>}
        </div>
      </section>

      <section className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Completed today</h3>
          <Badge variant="outline">{completedToday.length}</Badge>
        </div>
        <div className="grid gap-3">
          {completedToday.map((job) => (
            <Card key={job.id} className="border-border/70 bg-muted/60 shadow-sm">
              <CardHeader className="pb-2">
                <p className="text-xs text-muted-foreground">{job.jobNumber}</p>
                <CardTitle className="text-base">{job.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>{job.site?.name || job.siteAddress}</p>
                <p>Evidence captured: {job.completedAssetCount}/{job.assetCount}</p>
              </CardContent>
            </Card>
          ))}
          {!completedToday.length && <p className="text-xs text-muted-foreground">No completions yet.</p>}
        </div>
      </section>
    </CompanionShell>
  );
}
