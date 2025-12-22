import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { ScheduleAssignment, ScheduleConflict } from "@shared/schedule";

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

type AssignmentsResponse =
  | ScheduleAssignment[]
  | {
      assignments: ScheduleAssignment[];
      engineers?: Engineer[];
      conflicts?: ScheduleConflict[];
    };

export default function SchedulePage() {
  const qc = useQueryClient();
  const { toast: showToast } = useToast();

  const [day, setDay] = React.useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [shiftDown, setShiftDown] = React.useState(false);
  const [overColumn, setOverColumn] = React.useState<string | null>(null);

  const fromISO = new Date(day);
  const toISO = new Date(day);
  toISO.setDate(toISO.getDate() + 1);

  const assignmentsQuery = useQuery({
    queryKey: ["schedule-assignments", day.toISOString()],
    queryFn: async (): Promise<{ assignments: ScheduleAssignment[]; engineers: Engineer[]; conflicts?: ScheduleConflict[] }> => {
      const res = await apiRequest(
        "GET",
        `/api/schedule/assignments?from=${encodeURIComponent(fromISO.toISOString())}&to=${encodeURIComponent(toISO.toISOString())}`,
      );
      if (res.status === 401 || res.status === 403) {
        showToast({
          title: "Not authorised",
          description: "Auth/CSRF missing — refresh page",
          variant: "destructive",
        });
        throw new Error("Unauthorised");
      }
      const data = (await res.json()) as AssignmentsResponse;
      if (Array.isArray(data)) {
        return { assignments: data, engineers: [], conflicts: [] };
      }
      return {
        assignments: data.assignments ?? [],
        engineers: data.engineers ?? [],
        conflicts: data.conflicts ?? [],
      };
    },
  });

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftDown(true);
      if (e.key === "Escape") {
        setActiveId(null);
        showToast({ title: "Cancelled", description: "Drag cancelled." });
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
  }, [showToast]);

  const engineersFromAssignments = React.useMemo(() => {
    const seen = new Map<string, Engineer>();
    (assignmentsQuery.data?.assignments ?? []).forEach((a) => {
      const id = a.engineerUserId || a.engineerId;
      if (id && !seen.has(id)) {
        seen.set(id, { id, name: a.engineerName || id });
      }
    });
    return Array.from(seen.values());
  }, [assignmentsQuery.data]);

  const engineers = (assignmentsQuery.data?.engineers?.length ?? 0) > 0
    ? assignmentsQuery.data?.engineers ?? []
    : engineersFromAssignments.length > 0
      ? engineersFromAssignments
      : [{ id: "unassigned", name: "Unassigned" }];

  const assignments = assignmentsQuery.data?.assignments ?? [];
  const conflicts = assignmentsQuery.data?.conflicts ?? [];

  const columnHeight = 720; // px

  const showOverrideToast = React.useCallback(
    (
      message: string,
      endpoint: string,
      method: "POST" | "PATCH",
      payload: Record<string, unknown>
    ) => {
      let dismissToast: (() => void) | undefined;
      const action = (
        <ToastAction
          altText="Override & place anyway"
          onClick={async () => {
            try {
              const res = await apiRequest(
                method,
                `${endpoint}${endpoint.includes("?") ? "&" : "?"}allowConflict=true`,
                payload
              );
              if (!res.ok) {
                throw new Error(await res.text());
              }
              dismissToast?.();
              await qc.invalidateQueries({ queryKey: ["schedule-assignments", day.toISOString()] });
              showToast({ title: "Placed with override", description: "Saved despite conflict." });
            } catch (err: any) {
              showToast({
                title: "Override failed",
                description: err?.message ?? "Unknown error",
                variant: "destructive",
              });
            }
          }}
        >
          Override & place anyway
        </ToastAction>
      );

      const toastHandle = showToast({
        title: message,
        description: "Engineer already has an overlapping job.",
        action,
      });
      dismissToast = toastHandle.dismiss;
    },
    [day, qc, showToast]
  );

  const handleDrop = async (engineerId: string, minutesFromTop: number, assignmentId: string, shiftHeld: boolean) => {
    const current = assignments.find((a) => a.id === assignmentId);
    if (!current) return;

    const currentStart = new Date(current.startsAt ?? current.start ?? "");
    const currentEnd = new Date(current.endsAt ?? current.end ?? "");
    if (Number.isNaN(currentStart.getTime()) || Number.isNaN(currentEnd.getTime())) return;

    const durMin = minutesBetween(currentStart, currentEnd);
    const nextStartBase = addMinutes(startOfDay(day), minutesFromTop);
    const snappedStart = roundToSnap(nextStartBase);
    const clampedStart = addMinutes(startOfDay(day), clamp(minutesBetween(startOfDay(day), snappedStart), 0, dayColumnMinutes() - durMin));
    const nextEnd = addMinutes(clampedStart, durMin);

    try {
      if (shiftHeld || shiftDown) {
        const createRes = await apiRequest("POST", `/api/schedule/assignments`, {
          jobId: current.jobId,
          engineerUserId: engineerId,
          startsAt: clampedStart.toISOString(),
          endsAt: nextEnd.toISOString(),
          requiredEngineers: current.requiredEngineers ?? 1,
        });
        if (createRes.status === 409) {
          showOverrideToast(
            "Conflict detected",
            `/api/schedule/assignments`,
            "POST",
            {
              jobId: current.jobId,
              engineerUserId: engineerId,
              startsAt: clampedStart.toISOString(),
              endsAt: nextEnd.toISOString(),
              requiredEngineers: current.requiredEngineers ?? 1,
            }
          );
          return;
        }
        if (createRes.status === 401 || createRes.status === 403) {
          showToast({
            title: "Not authorised",
            description: "Auth/CSRF missing — refresh page",
            variant: "destructive",
          });
          return;
        }
        if (!createRes.ok) throw new Error(await createRes.text());
      } else {
        const patchRes = await apiRequest("PATCH", `/api/schedule/assignments/${assignmentId}`, {
          engineerUserId: engineerId,
          startsAt: clampedStart.toISOString(),
          endsAt: nextEnd.toISOString(),
        });
        if (patchRes.status === 409) {
          showOverrideToast(
            "Conflict detected",
            `/api/schedule/assignments/${assignmentId}`,
            "PATCH",
            {
              engineerUserId: engineerId,
              startsAt: clampedStart.toISOString(),
              endsAt: nextEnd.toISOString(),
            }
          );
          return;
        }
        if (patchRes.status === 401 || patchRes.status === 403) {
          showToast({
            title: "Not authorised",
            description: "Auth/CSRF missing — refresh page",
            variant: "destructive",
          });
          return;
        }
        if (!patchRes.ok) throw new Error(await patchRes.text());
      }

      await qc.invalidateQueries({ queryKey: ["schedule-assignments", day.toISOString()] });
    } catch (err: any) {
      showToast({ title: "Failed to reschedule", description: err?.message ?? "Unknown error" });
    }
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
        <div className="ml-auto text-xs opacity-70">Drag to move • <b>Shift</b>+drag duplicates • <b>Esc</b> cancels</div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.max(engineers.length, 1)}, minmax(220px, 1fr))` }}>
        {engineers.map((eng) => (
          <EngineerColumn
            key={eng.id}
            engineer={eng}
            assignments={assignments.filter((a) => (a.engineerUserId || a.engineerId || "unassigned") === eng.id)}
            day={day}
            columnHeight={columnHeight}
            activeId={activeId}
            overColumn={overColumn === eng.id}
            setOverColumn={setOverColumn}
            onDrop={(minutes, assignmentId, shiftHeld) => handleDrop(eng.id, minutes, assignmentId, shiftHeld)}
            onDragStart={(id) => setActiveId(id)}
            onDragEnd={() => setActiveId(null)}
          />
        ))}
      </div>

      {conflicts.length > 0 && (
        <Card className="p-3">
          <div className="font-medium mb-2">Conflicts detected</div>
          <div className="space-y-1 text-sm text-amber-700">
            {conflicts.map((c, idx) => (
              <div key={`${c.engineerUserId}-${idx}`}>
                Engineer {c.engineerUserId} overlaps between {new Date(c.startsAt).toLocaleTimeString()} and {new Date(c.endsAt).toLocaleTimeString()}
              </div>
            ))}
          </div>
        </Card>
      )}

      {assignmentsQuery.isLoading && <div className="text-sm text-muted-foreground">Loading schedule…</div>}
    </div>
  );
}

function EngineerColumn(props: {
  engineer: Engineer;
  assignments: ScheduleAssignment[];
  day: Date;
  columnHeight: number;
  activeId: string | null;
  overColumn: boolean;
  setOverColumn: (id: string | null) => void;
  onDrop: (minutes: number, assignmentId: string, shiftHeld: boolean) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}) {
  const { engineer, assignments, day, columnHeight, activeId, overColumn, setOverColumn, onDrop, onDragEnd, onDragStart } = props;
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
        <Badge variant="outline">{assignments.length} jobs</Badge>
      </div>
      <div
        ref={containerRef}
        className={cn("relative rounded-md border bg-background", overColumn && "ring-2 ring-primary/50")}
        style={{ height: columnHeight }}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setOverColumn(engineer.id)}
        onDragLeave={() => setOverColumn(null)}
        onDrop={(e) => {
          e.preventDefault();
          setOverColumn(null);
          const id = e.dataTransfer.getData("text/plain");
          if (!id) return;
          const rect = containerRef.current?.getBoundingClientRect();
          const y = rect ? e.clientY - rect.top : 0;
          const minutes = yToMinutes(y, columnHeight);
          onDrop(minutes, id, e.shiftKey);
          onDragEnd();
        }}
      >
        {assignments.map((a) => {
          const s = new Date(a.startsAt ?? a.start ?? "");
          const e = new Date(a.endsAt ?? a.end ?? "");
          if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;

          const topMin = minutesBetween(dayStart, s);
          const durMin = minutesBetween(s, e);

          const top = minutesToY(topMin, columnHeight);
          const height = minutesToY(durMin, columnHeight);

          return (
            <DraggableAssignment
              key={a.id}
              assignment={a}
              top={top}
              height={Math.max(28, height)}
              isActive={activeId === a.id}
              onDragStart={() => onDragStart(a.id)}
              onDragEnd={() => onDragEnd()}
            />
          );
        })}
      </div>
    </Card>
  );
}

function DraggableAssignment(props: {
  assignment: ScheduleAssignment;
  top: number;
  height: number;
  isActive: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const { assignment, top, height, isActive, onDragStart, onDragEnd } = props;

  const startLabel = assignment.startsAt ?? assignment.start;
  const endLabel = assignment.endsAt ?? assignment.end;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", assignment.id);
              onDragStart();
            }}
            onDragEnd={onDragEnd}
            className={cn(
              "absolute left-2 right-2 rounded-md border bg-muted p-2 text-xs cursor-grab active:cursor-grabbing",
              isActive && "ring-2 ring-primary/60",
            )}
            style={{ top, height }}
            title={assignment.jobTitle ? `Job ${assignment.jobTitle}` : "Job"}
          >
            <div className="font-medium">{assignment.jobTitle || "Job"}</div>
            <div className="opacity-70">
              {startLabel && new Date(startLabel).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –
              {endLabel && new Date(endLabel).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <div className="font-semibold">{assignment.jobTitle || "Job"}</div>
            <div>Engineer: {assignment.engineerName || assignment.engineerUserId || "Unassigned"}</div>
            <div>
              {startLabel ? new Date(startLabel).toLocaleString() : ""} – {endLabel ? new Date(endLabel).toLocaleString() : ""}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
