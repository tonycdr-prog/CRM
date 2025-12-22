import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ScheduleJobConflict, ScheduleJobSlot } from "@shared/schedule";
import { useScheduleRange } from "@/modules/scheduling";

const SNAP_MINUTES = 30;
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 20;

function roundToSnap(date: Date) {
  const ms = date.getTime();
  const snap = SNAP_MINUTES * 60 * 1000;
  return new Date(Math.round(ms / snap) * snap);
}

function minutesBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 60000);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function dayColumnMinutes() {
  return (DAY_END_HOUR - DAY_START_HOUR) * 60;
}

function minutesToY(min: number, columnHeightPx: number) {
  const totalMin = dayColumnMinutes();
  return (min / totalMin) * columnHeightPx;
}

function yToMinutes(y: number, columnHeightPx: number) {
  const totalMin = dayColumnMinutes();
  const ratio = clamp(y / columnHeightPx, 0, 1);
  return Math.round(ratio * totalMin);
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(DAY_START_HOUR, 0, 0, 0);
  return x;
}

function addMinutes(d: Date, min: number) {
  return new Date(d.getTime() + min * 60000);
}

type Engineer = { id: string; name: string };

export default function SchedulePage() {
  const { toast } = useToast();

  const [day, setDay] = React.useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [activeJobId, setActiveJobId] = React.useState<string | null>(null);
  const [shiftDown, setShiftDown] = React.useState(false);
  const [view, setView] = React.useState<"calendar" | "gantt">("calendar");

  const fromISO = new Date(day);
  const toISO = new Date(day);
  toISO.setDate(toISO.getDate() + 1);

  const schedule = useScheduleRange(day);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftDown(true);
      if (e.key === "Escape") {
        setActiveJobId(null);
        schedule.refetch();
        toast({ title: "Cancelled", description: "Drag cancelled." });
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftDown(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [day, schedule, toast]);

  const jobs = schedule.jobs;
  const conflicts = schedule.conflicts ?? [];

  const conflictMap = React.useMemo(() => {
    const map = new Map<string, ScheduleJobConflict>();
    conflicts.forEach((c) => {
      map.set(`${c.jobId}:${c.engineerId}`, c);
    });
    return map;
  }, [conflicts]);

  const engineers: Engineer[] = React.useMemo(() => {
    const seen = new Map<string, Engineer>();
    jobs.forEach((job) => {
      if (!job.assignedEngineerIds.length) {
        seen.set("unassigned", { id: "unassigned", name: "Unassigned" });
      }
      job.assignedEngineerIds.forEach((id) => {
        if (!seen.has(id)) seen.set(id, { id, name: id });
      });
    });
    if (seen.size === 0) seen.set("unassigned", { id: "unassigned", name: "Unassigned" });
    return Array.from(seen.values());
  }, [jobs]);

  const placements = React.useMemo(() => {
    return jobs.flatMap((job) => {
      const ids = job.assignedEngineerIds.length ? job.assignedEngineerIds : ["unassigned"];
      return ids.map((engineerId) => ({ job, engineerId }));
    });
  }, [jobs]);

  const columnHeight = 720;

  const performMove = async (jobId: string, newStart: Date, shiftHeld: boolean) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    const durationMs = new Date(job.endAt).getTime() - new Date(job.startAt).getTime();
    const payload = {
      jobId,
      startAt: newStart.toISOString(),
      endAt: new Date(newStart.getTime() + durationMs).toISOString(),
    };
    try {
      const result = shiftHeld
        ? await schedule.duplicateJob(payload)
        : await schedule.moveJob(payload);
      if (result.warnings && result.warnings.length) {
        toast({ title: "Scheduling warning", description: "Engineer already has an overlapping job." });
      }
    } catch (err: any) {
      toast({ title: "Schedule update failed", description: err?.message ?? "Unknown error", variant: "destructive" });
    }
  };

  const handleDrop = async (jobId: string, minutesFromTop: number) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    const jobStart = new Date(job.startAt);
    const jobEnd = new Date(job.endAt);
    const durMin = minutesBetween(jobStart, jobEnd);

    const nextStartBase = addMinutes(startOfDay(day), minutesFromTop);
    const snappedStart = roundToSnap(nextStartBase);
    const clampedStart = addMinutes(
      startOfDay(day),
      clamp(minutesBetween(startOfDay(day), snappedStart), 0, dayColumnMinutes() - durMin),
    );
    await performMove(jobId, clampedStart, shiftDown);
  };

  const nextDay = () =>
    setDay((d) => {
      const x = new Date(d);
      x.setDate(x.getDate() + 1);
      return x;
    });
  const prevDay = () =>
    setDay((d) => {
      const x = new Date(d);
      x.setDate(x.getDate() - 1);
      return x;
    });

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={prevDay} size="sm">
          Prev
        </Button>
        <Button variant="outline" onClick={nextDay} size="sm">
          Next
        </Button>
        <div className="ml-2 text-sm opacity-80">{day.toDateString()}</div>
        <div className="ml-auto flex items-center gap-2 text-xs opacity-80">
          <Button
            size="sm"
            variant={view === "calendar" ? "default" : "outline"}
            onClick={() => setView("calendar")}
          >
            Calendar
          </Button>
          <Button size="sm" variant={view === "gantt" ? "default" : "outline"} onClick={() => setView("gantt")}>
            Gantt
          </Button>
          <span className="hidden sm:inline">Drag to move • Shift+drag duplicates • Esc cancels</span>
        </div>
      </div>

      {view === "calendar" ? (
        <TooltipProvider>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.max(engineers.length, 1)}, minmax(220px, 1fr))` }}>
            {engineers.map((eng) => (
              <EngineerColumn
                key={eng.id}
                engineer={eng}
                placements={placements.filter((p) => p.engineerId === eng.id)}
                day={day}
                columnHeight={columnHeight}
                activeJobId={activeJobId}
                conflicts={conflictMap}
                onDrop={(minutes, jobId) => handleDrop(jobId, minutes)}
                onDragStart={(id) => setActiveJobId(id)}
                onDragEnd={() => setActiveJobId(null)}
              />
            ))}
          </div>
        </TooltipProvider>
      ) : (
        <GanttView jobs={jobs} conflicts={conflictMap} />
      )}

      {conflicts.length > 0 && (
        <Card className="p-3">
          <div className="font-medium mb-2">Conflicts detected</div>
          <div className="space-y-1 text-sm text-amber-700">
            {conflicts.map((c, idx) => (
              <div key={`${c.jobId}-${idx}`}>
                Engineer {c.engineerId} overlaps with jobs {c.overlappingJobIds.join(", ")}
              </div>
            ))}
          </div>
        </Card>
      )}

      {jobsQuery.isLoading && <div className="text-sm text-muted-foreground">Loading schedule…</div>}
    </div>
  );
}

type Placement = { job: ScheduleJobSlot; engineerId: string };

type EngineerColumnProps = {
  engineer: Engineer;
  placements: Placement[];
  day: Date;
  columnHeight: number;
  activeJobId: string | null;
  conflicts: Map<string, ScheduleJobConflict>;
  onDrop: (minutes: number, jobId: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
};

function EngineerColumn({ engineer, placements, day, columnHeight, activeJobId, conflicts, onDrop, onDragEnd, onDragStart }: EngineerColumnProps) {
  const dayStart = startOfDay(day);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{engineer.name?.charAt(0)?.toUpperCase() ?? "E"}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{engineer.name}</div>
            <div className="text-xs text-muted-foreground">{engineer.id}</div>
          </div>
        </div>
        <Badge variant="outline">{placements.length} jobs</Badge>
      </div>
      <div
        ref={containerRef}
        className="relative rounded-md border bg-background"
        style={{ height: columnHeight }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const id = e.dataTransfer.getData("text/plain");
          if (!id) return;
          const rect = containerRef.current?.getBoundingClientRect();
          const y = rect ? e.clientY - rect.top : 0;
          const minutes = yToMinutes(y, columnHeight);
          onDrop(minutes, id);
          onDragEnd();
        }}
      >
        {placements.map((placement) => {
          const s = new Date(placement.job.startAt);
          const e = new Date(placement.job.endAt);
          if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;

          const topMin = minutesBetween(dayStart, s);
          const durMin = minutesBetween(s, e);
          const top = minutesToY(topMin, columnHeight);
          const height = minutesToY(durMin, columnHeight);
          const conflictKey = `${placement.job.id}:${placement.engineerId}`;
          const hasConflict = conflicts.has(conflictKey);

          return (
            <DraggableJob
              key={`${placement.job.id}-${placement.engineerId}`}
              job={placement.job}
              top={top}
              height={Math.max(32, height)}
              isActive={activeJobId === placement.job.id}
              hasConflict={hasConflict}
              onDragStart={() => onDragStart(placement.job.id)}
              onDragEnd={onDragEnd}
            />
          );
        })}
      </div>
    </Card>
  );
}

type DraggableJobProps = {
  job: ScheduleJobSlot;
  top: number;
  height: number;
  isActive: boolean;
  hasConflict: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
};

function DraggableJob({ job, top, height, isActive, hasConflict, onDragStart, onDragEnd }: DraggableJobProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", job.id);
              onDragStart();
            }}
            onDragEnd={onDragEnd}
            className={cn(
              "absolute left-2 right-2 rounded-md border bg-muted p-2 text-xs cursor-grab active:cursor-grabbing",
              isActive && "ring-2 ring-primary/60",
              hasConflict && "border-amber-500",
            )}
            style={{ top, height }}
            title={job.title ? `Job ${job.title}` : "Job"}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium truncate">{job.title || "Job"}</div>
              {hasConflict && <Badge variant="destructive">Conflict</Badge>}
            </div>
            <div className="opacity-70">
              {new Date(job.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –
              {new Date(job.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <div className="font-semibold">{job.title || "Job"}</div>
            <div>Engineers: {job.assignedEngineerIds.join(", ") || "Unassigned"}</div>
            <div>
              {new Date(job.startAt).toLocaleString()} – {new Date(job.endAt).toLocaleString()}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

type GanttProps = {
  jobs: ScheduleJobSlot[];
  conflicts: Map<string, ScheduleJobConflict>;
};

function GanttView({ jobs, conflicts }: GanttProps) {
  if (!jobs.length) {
    return <div className="text-sm text-muted-foreground">No scheduled jobs.</div>;
  }

  const minStart = Math.min(...jobs.map((j) => new Date(j.startAt).getTime()));
  const maxEnd = Math.max(...jobs.map((j) => new Date(j.endAt).getTime()));
  const totalMs = Math.max(maxEnd - minStart, 1);

  return (
    <Card className="p-4 space-y-3">
      <div className="font-medium">Gantt view</div>
      <div className="space-y-2">
        {jobs.map((job) => {
          const startMs = new Date(job.startAt).getTime() - minStart;
          const endMs = new Date(job.endAt).getTime() - minStart;
          const leftPct = (startMs / totalMs) * 100;
          const widthPct = Math.max(((endMs - startMs) / totalMs) * 100, 2);
          const hasConflict = job.assignedEngineerIds.some((eng) => conflicts.has(`${job.id}:${eng}`));
          return (
            <div key={job.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium truncate">{job.title}</div>
                {hasConflict && <Badge variant="destructive">Conflict</Badge>}
              </div>
              <div className="relative h-8 rounded-md bg-muted/50">
                <div
                  className={cn("absolute h-8 rounded-md bg-primary/70 text-[10px] text-white px-2 flex items-center", hasConflict && "bg-amber-500")}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                >
                  {job.assignedEngineerIds.join(", ") || "Unassigned"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
