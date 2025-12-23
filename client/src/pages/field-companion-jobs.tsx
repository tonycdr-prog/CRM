import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import CompanionShell from "@/features/field-companion/companion-shell";
import { JobCard, type JobWithSite } from "@/features/field-companion/job-card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES, buildPath } from "@/lib/routes";
import { useAuth } from "@/hooks/useAuth";
import { Search } from "lucide-react";

export default function FieldCompanionJobs() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("today");

  const { data: jobs = [], isLoading } = useQuery<JobWithSite[]>({
    queryKey: ["/api/jobs-with-sites"],
    enabled: !!user?.id,
  });

  const filtered = useMemo(() => {
    const lower = query.toLowerCase();
    return jobs.filter((job) =>
      !query
        ? true
        : job.title?.toLowerCase().includes(lower) ||
          job.jobNumber?.toLowerCase().includes(lower) ||
          job.siteAddress?.toLowerCase().includes(lower)
    );
  }, [jobs, query]);

  const grouped = useMemo(() => {
    const today: JobWithSite[] = [];
    const backlog: JobWithSite[] = [];
    const completed: JobWithSite[] = [];
    filtered.forEach((job) => {
      if (job.status === "completed") {
        completed.push(job);
      } else if (job.status === "in_progress" || job.status === "scheduled") {
        today.push(job);
      } else {
        backlog.push(job);
      }
    });
    return { today, backlog, completed };
  }, [filtered]);

  const list = tab === "today" ? grouped.today : tab === "backlog" ? grouped.backlog : grouped.completed;

  return (
    <CompanionShell title="Jobs" subtitle="Predictable routes, calm states">
      <div className="py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search job, site, postcode"
            className="pl-9"
          />
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="today">Active</TabsTrigger>
            <TabsTrigger value="backlog">Queued</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading jobs…</p>}
          {!isLoading &&
            list.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onOpen={(id) => setLocation(buildPath(ROUTES.FIELD_COMPANION_JOB, { id }))}
              />
            ))}
          {!isLoading && !list.length && <p className="text-sm text-muted-foreground">No jobs found.</p>}
        </div>
      </div>
    </CompanionShell>
  );
}
