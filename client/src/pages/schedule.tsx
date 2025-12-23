import React from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ScheduleAssignment, ScheduleConflictDetail, ScheduleJobSlot } from "@shared/schedule";
import { useScheduleRange } from "@/modules/scheduling";

const SNAP_MINUTES = 15;
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
  const [activeAssignmentId, setActiveAssignmentId] = React.useState<string | null>(null);
  const [shiftDown, setShiftDown] = React.useState(false);
  const [view, setView] = React.useState<"calendar" | "gantt">("calendar");
  const snapshotRef = React.useRef<ScheduleAssignment[] | null>(null);
  const [draftAssignments, setDraftAssignments] = React.useState<ScheduleAssignment[] | null>(null);
  const [showConflicts, setShowConflicts] = React.useState(false);

  const fromISO = new Date(day);
  const toISO = new Date(day);
  toISO.setDate(toISO.getDate() + 1);

  const schedule = useScheduleRange(day);

  React.useEffect(() => {
    setDraftAssignments(null);
  }, [schedule.assignments]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftDown(true);
      if (e.key === "Escape") {
        setActiveAssignmentId(null);
        if (snapshotRef.current) {
          setDraftAssignments(snapshotRef.current);
          snapshotRef.current = null;
        } else {
          schedule.refetch();
        }
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
  const assignments = draftAssignments ?? schedule.assignments;
  const conflicts = schedule.conflicts ?? [];

  React.useEffect(() => {
    if (conflicts.length > 0) setShowConflicts(true);
  }, [conflicts]);

  const conflictIds = React.useMemo(() => new Set(conflicts.map((c) => c.itemId)), [conflicts]);

  const engineers: Engineer[] = React.useMemo(() => {
    const seen = new Map<string, Engineer>();
    assignments.forEach((a: ScheduleAssignment) => {
      const eng = a.engineerUserId ?? a.engineerId ?? "unassigned";
      if (!seen.has(eng)) seen.set(eng, { id: eng, name: eng });
    });
    if (seen.size === 0) seen.set("unassigned", { id: "unassigned", name: "Unassigned" });
    return Array.from(seen.values());
  }, [assignments]);

  const placements: Placement[] = React.useMemo(() => {
    return assignments.map((assignment: ScheduleAssignment) => ({
      assignment,
      engineerId: assignment.engineerUserId ?? assignment.engineerId ?? "unassigned",
      job: jobs.find((j: ScheduleJobSlot) => j.id === assignment.jobId),
    }));
  }, [assignments, jobs]);

  const columnHeight = 720;

  const performMove = async (
    assignment: ScheduleAssignment,
    targetEngineerId: string,
    newStart: Date,
    shiftHeld: boolean,
  ) => {
    const job = jobs.find((j: ScheduleJobSlot) => j.id === assignment.jobId);
    const startValue = assignment.startsAt ?? assignment.start ?? newStart.toISOString();
    const endValue = assignment.endsAt ?? assignment.end ?? new Date(newStart.getTime() + 60 * 60 * 1000).toISOString();
    const durationMs = new Date(endValue).getTime() - new Date(startValue).getTime();
    const startAt = newStart.toISOString();
    const endAt = new Date(newStart.getTime() + durationMs).toISOString();

    const applyOptimistic = (updater: (prev: ScheduleAssignment[]) => ScheduleAssignment[]) => {
      setDraftAssignments((prev) => {
        const base = prev ?? schedule.assignments;
        const next = updater(base);
        return next;
      });
    };

    snapshotRef.current = schedule.assignments;
    if (shiftHeld) {
      const newJobId = `${assignment.jobId}-dup-${nanoid(6)}`;
      applyOptimistic((prev) => [
        ...prev,
        {
          ...assignment,
          id: `draft-${nanoid(4)}`,
          jobId: newJobId,
          startsAt: startAt,
          endsAt: endAt,
          start: startAt,
          end: endAt,
          engineerUserId: targetEngineerId,
          engineerId: targetEngineerId,
        },
      ]);
      try {
        await schedule.duplicateJob({
          jobId: newJobId,
          startAt,
          endAt,
          engineerIds: [targetEngineerId],
          title: job?.title,
        });
      } catch (err: any) {
        if (snapshotRef.current) setDraftAssignments(snapshotRef.current);
        toast({ title: "Schedule duplication failed", description: err?.message ?? "Unknown error", variant: "destructive" });
      }
      return;
    }

    applyOptimistic((prev) =>
      prev.map((a) =>
        a.id === assignment.id
          ? {
              ...a,
              startsAt: startAt,
              endsAt: endAt,
              start: startAt,
              end: endAt,
              engineerUserId: targetEngineerId,
              engineerId: targetEngineerId,
            }
          : a,
      ),
    );
    try {
      await schedule.moveAssignment({
        assignmentId: assignment.id,
        startAt,
        endAt,
        engineerId: targetEngineerId,
      });
    } catch (err: any) {
      if (snapshotRef.current) setDraftAssignments(snapshotRef.current);
      toast({ title: "Schedule update failed", description: err?.message ?? "Unknown error", variant: "destructive" });
    }
  };

  const handleDrop = async (placement: Placement, minutesFromTop: number, targetEngineerId: string) => {
    const nextStartBase = addMinutes(startOfDay(day), minutesFromTop);
    const startValue = placement.assignment.startsAt ?? placement.assignment.start;
    const endValue = placement.assignment.endsAt ?? placement.assignment.end;
    const fallbackEnd = new Date(nextStartBase.getTime() + 60 * 60 * 1000);
    const durMin = startValue && endValue
      ? minutesBetween(new Date(startValue), new Date(endValue))
      : minutesBetween(nextStartBase, fallbackEnd);
    const snappedStart = roundToSnap(nextStartBase);
    const clampedStart = addMinutes(
      startOfDay(day),
      clamp(minutesBetween(startOfDay(day), snappedStart), 0, dayColumnMinutes() - durMin),
    );
    await performMove(placement.assignment, targetEngineerId, clampedStart, shiftDown);
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
          {conflicts.length > 0 ? (
            <Button size="sm" variant="destructive" onClick={() => setShowConflicts((v) => !v)}>
              Conflicts ({conflicts.length})
            </Button>
          ) : null}
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
                activeJobId={activeAssignmentId}
                conflictIds={conflictIds}
                onDrop={(minutes, placement) => handleDrop(placement, minutes, eng.id)}
                onDragStart={(id) => setActiveAssignmentId(id)}
                onDragEnd={() => setActiveAssignmentId(null)}
              />
            ))}
          </div>
        </TooltipProvider>
      ) : (
        <GanttView jobs={jobs} assignments={placements} onMove={performMove} day={day} />
      )}

      {showConflicts && conflicts.length > 0 && (
        <Card className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-medium">Conflicts detected</div>
            <Button size="sm" variant="ghost" onClick={() => setShowConflicts(false)}>
              Dismiss
            </Button>
          </div>
          <div className="space-y-2 text-sm text-amber-700">
            {conflicts.map((c: ScheduleConflictDetail, idx: number) => (
              <div key={`${c.itemId}-${idx}`} className="flex flex-col gap-1">
                <div>
                  Engineer {c.engineerId} conflict between jobs {c.itemJobId} and {c.overlapsWithJobId}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(c.overlapRange.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –
                  {new Date(c.overlapRange.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {schedule.isLoading && <div className="text-sm text-muted-foreground">Loading schedule…</div>}
    </div>
  );
}

type Placement = { assignment: ScheduleAssignment; job?: ScheduleJobSlot; engineerId: string };

type EngineerColumnProps = {
  engineer: Engineer;
  placements: Placement[];
  day: Date;
  columnHeight: number;
  activeJobId: string | null;
  conflictIds: Set<string>;
  onDrop: (minutes: number, placement: Placement) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
};

function EngineerColumn({ engineer, placements, day, columnHeight, activeJobId, conflictIds, onDrop, onDragEnd, onDragStart }: EngineerColumnProps) {
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
          const placement = placements.find((p) => p.assignment.id === id);
          if (!placement) return;
          onDrop(minutes, placement);
          onDragEnd();
        }}
      >
        {placements.map((placement) => {
          const startAt = placement.assignment.startsAt ?? placement.assignment.start;
          const endAt = placement.assignment.endsAt ?? placement.assignment.end;
          if (!startAt || !endAt) return null;
          const s = new Date(startAt);
          const e = new Date(endAt);
          if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;

          const topMin = minutesBetween(dayStart, s);
          const durMin = minutesBetween(s, e);
          const top = minutesToY(topMin, columnHeight);
          const height = minutesToY(durMin, columnHeight);
          const hasConflict = conflictIds.has(placement.assignment.id);

          return (
            <DraggableAssignment
              key={`${placement.assignment.id}-${placement.engineerId}`}
              placement={placement}
              top={top}
              height={Math.max(32, height)}
              isActive={activeJobId === placement.assignment.id}
              hasConflict={hasConflict}
              onDragStart={() => onDragStart(placement.assignment.id)}
              onDragEnd={onDragEnd}
            />
          );
        })}
      </div>
    </Card>
  );
}

type DraggableJobProps = {
  placement: Placement;
  top: number;
  height: number;
  isActive: boolean;
  hasConflict: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
};

function DraggableAssignment({ placement, top, height, isActive, hasConflict, onDragStart, onDragEnd }: DraggableJobProps) {
  const job = placement.job;
  const title = job?.title ?? placement.assignment.jobTitle ?? `Job ${placement.assignment.jobId.slice(0, 6)}`;
  const start = placement.assignment.startsAt ?? placement.assignment.start;
  const end = placement.assignment.endsAt ?? placement.assignment.end;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", placement.assignment.id);
              onDragStart();
            }}
            onDragEnd={onDragEnd}
            className={cn(
              "absolute left-2 right-2 rounded-md border bg-muted p-2 text-xs cursor-grab active:cursor-grabbing",
              isActive && "ring-2 ring-primary/60",
              hasConflict && "border-amber-500",
            )}
            style={{ top, height }}
            title={title}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium truncate">{title}</div>
              {hasConflict && <Badge variant="destructive">Conflict</Badge>}
            </div>
            <div className="opacity-70">
              {start ? new Date(start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null} –
              {end ? new Date(end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {placement.assignment.engineerUserId ? (
                <Badge variant="outline" className="text-[10px]">
                  {placement.assignment.engineerUserId}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  Unassigned
                </Badge>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <div className="font-semibold">{title}</div>
            <div>Engineers: {job?.assignedEngineerIds.join(", ") || placement.assignment.engineerUserId || "Unassigned"}</div>
            <div>
              {start ? new Date(start).toLocaleString() : ""} – {end ? new Date(end).toLocaleString() : ""}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

type GanttProps = {
  jobs: ScheduleJobSlot[];
  assignments: Placement[];
  day: Date;
  onMove: (assignment: ScheduleAssignment, engineerId: string, start: Date, duplicate: boolean) => Promise<void>;
};

function GanttView({ jobs, assignments, day, onMove }: GanttProps) {
  if (!jobs.length) {
    return <div className="text-sm text-muted-foreground">No scheduled jobs.</div>;
  }

  const minStart = Math.min(...jobs.map((j) => new Date(j.startAt).getTime()));
  const maxEnd = Math.max(...jobs.map((j) => new Date(j.endAt).getTime()));
  const totalMs = Math.max(maxEnd - minStart, 1);
  const trackRef = React.useRef<HTMLDivElement | null>(null);

  const handleDragEnd = async (event: React.DragEvent<HTMLDivElement>, placement: Placement) => {
    event.preventDefault();
    const rect = trackRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 1;
    const deltaX = event.clientX - (rect?.left ?? 0);
    const ratio = Math.max(0, Math.min(deltaX / width, 1));
    const nextStart = new Date(minStart + ratio * totalMs);
    const snapped = roundToSnap(nextStart);
    const clampedStart = addMinutes(
      startOfDay(day),
      clamp(minutesBetween(startOfDay(day), snapped), 0, dayColumnMinutes()),
    );
    await onMove(placement.assignment, placement.engineerId, clampedStart, event.shiftKey);
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="font-medium">Gantt view</div>
      <div className="space-y-2" ref={trackRef}>
        {assignments.map((placement) => {
          const job = placement.job ?? jobs.find((j) => j.id === placement.assignment.jobId);
          if (!job) return null;
          const startMs = new Date(job.startAt).getTime() - minStart;
          const endMs = new Date(job.endAt).getTime() - minStart;
          const leftPct = (startMs / totalMs) * 100;
          const widthPct = Math.max(((endMs - startMs) / totalMs) * 100, 2);
          const engineerLabel = placement.assignment.engineerUserId ?? placement.engineerId ?? "Unassigned";
          return (
            <div key={`${placement.assignment.id}-${placement.engineerId}`} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium truncate">{job.title}</div>
                <Badge variant="outline">{engineerLabel}</Badge>
              </div>
              <div className="relative h-8 rounded-md bg-muted/50">
                <div
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", placement.assignment.id)}
                  onDragEnd={(e) => handleDragEnd(e, placement)}
                  className="absolute h-8 rounded-md bg-primary/70 text-[10px] text-white px-2 flex items-center cursor-grab active:cursor-grabbing"
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                >
                  {engineerLabel}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
