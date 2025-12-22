import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, startOfWeek, endOfWeek, setHours, setMinutes, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { assignmentsOverlap, ScheduleAssignment, ScheduleEngineer } from "@shared/schedule";
import { cn } from "@/lib/utils";
import { Loader2, Move, Copy, AlertTriangle, Undo2, Users } from "lucide-react";

const SNAP_MINUTES = 15;

function snapToMinutes(date: Date, minutes: number) {
  const ms = minutes * 60 * 1000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}

function useScheduleData() {
  return useQuery({
    queryKey: ["schedule"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/schedule/assignments");
      return res.json();
    },
  });
}

export default function SchedulePage() {
  const { data, refetch, isLoading } = useScheduleData();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pendingEngineerFor, setPendingEngineerFor] = useState<ScheduleAssignment | null>(null);
  const [activeView, setActiveView] = useState<"calendar" | "gantt">("calendar");

  const assignments: ScheduleAssignment[] = data?.assignments || [];
  const engineers: ScheduleEngineer[] = data?.engineers || [];
  const conflicts = useMemo(() => assignments.filter((a, idx) => assignments.some((b, jdx) => jdx !== idx && assignmentsOverlap(a, b))), [assignments]);

  useEffect(() => {
    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === "Escape") {
        refetch();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [refetch]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ScheduleAssignment> }) => {
      const res = await apiRequest("PUT", `/api/schedule/assignments/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      toast({ title: "Schedule updated" });
    },
    onError: () => {
      toast({ title: "Update failed", description: "Auth/CSRF missing — refresh page", variant: "destructive" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async ({ id, overrides }: { id: string; overrides?: Partial<ScheduleAssignment> }) => {
      const res = await apiRequest("POST", `/api/schedule/assignments/${id}/duplicate`, overrides || {});
      return res.json();
    },
    onSuccess: (data) => {
      setPendingEngineerFor(data.assignment);
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      toast({ title: "Duplicated assignment" });
    },
    onError: () => {
      toast({ title: "Duplicate failed", description: "Auth/CSRF missing — refresh page", variant: "destructive" });
    },
  });

  const handleDropOnDay = (day: Date, assignment: ScheduleAssignment, shift: boolean) => {
    const start = snapToMinutes(setMinutes(setHours(day, new Date(assignment.start).getHours()), new Date(assignment.start).getMinutes()), SNAP_MINUTES);
    const durationMs = new Date(assignment.end).getTime() - new Date(assignment.start).getTime();
    const end = new Date(start.getTime() + durationMs);
    if (shift) {
      duplicateMutation.mutate({ id: assignment.id, overrides: { start: start.toISOString(), end: end.toISOString() } });
    } else {
      updateMutation.mutate({ id: assignment.id, updates: { start: start.toISOString(), end: end.toISOString() } });
    }
  };

  const handleEngineerChange = (engId: string) => {
    if (!pendingEngineerFor) return;
    const engineer = engineers.find((e) => e.id === engId) || engineers[0];
    if (engineer) {
      updateMutation.mutate({
        id: pendingEngineerFor.id,
        updates: { engineerId: engineer.id, engineerName: engineer.name },
      });
    }
    setPendingEngineerFor(null);
  };

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, idx) => addDays(weekStart, idx));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Schedule</h1>
          <p className="text-sm text-muted-foreground">Drag to move; Shift+Drag duplicates; conflicts warn but allow override.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="gantt">Gantt</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar">
          <CalendarView
            days={days}
            assignments={assignments}
            conflicts={conflicts}
            onDrop={handleDropOnDay}
          />
        </TabsContent>
        <TabsContent value="gantt">
          <GanttView
            assignments={assignments}
            engineers={engineers}
            conflicts={conflicts}
            onMove={(assignment, start) => {
              const duration = new Date(assignment.end).getTime() - new Date(assignment.start).getTime();
              updateMutation.mutate({ id: assignment.id, updates: { start: start.toISOString(), end: new Date(start.getTime() + duration).toISOString() } });
            }}
            onResize={(assignment, end) => updateMutation.mutate({ id: assignment.id, updates: { end: end.toISOString() } })}
            onDuplicate={(assignment) => duplicateMutation.mutate({ id: assignment.id })}
          />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Conflicts</CardTitle>
          <CardDescription>Warnings when engineers are double-booked.</CardDescription>
        </CardHeader>
        <CardContent>
          {conflicts.length === 0 && <p className="text-sm text-muted-foreground">No conflicts detected.</p>}
          <div className="space-y-2">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  {conflict.engineerName} overlaps on {conflict.jobTitle} starting {format(parseISO(conflict.start), "PPpp")}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!pendingEngineerFor} onOpenChange={(open) => !open && setPendingEngineerFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select engineer for duplicate</DialogTitle>
          </DialogHeader>
          <Select onValueChange={(val) => handleEngineerChange(val)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose engineer" />
            </SelectTrigger>
            <SelectContent>
              {engineers.map((eng) => (
                <SelectItem key={eng.id} value={eng.id}>
                  {eng.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingEngineerFor(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading schedule...
        </div>
      )}
    </div>
  );
}

function CalendarView({
  days,
  assignments,
  conflicts,
  onDrop,
}: {
  days: Date[];
  assignments: ScheduleAssignment[];
  conflicts: ScheduleAssignment[];
  onDrop: (day: Date, assignment: ScheduleAssignment, shift: boolean) => void;
}) {
  const conflictIds = new Set(conflicts.map((c) => c.id));

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-7">
      {days.map((day) => {
        const dayAssignments = assignments.filter((a) => format(parseISO(a.start), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));
        return (
          <div
            key={day.toISOString()}
            className="rounded-lg border border-dashed p-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/plain");
              const shift = e.shiftKey;
              const assignment = assignments.find((a) => a.id === id);
              if (assignment) onDrop(day, assignment, shift);
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-muted-foreground">{format(day, "EEEE")}</p>
                <p className="font-semibold">{format(day, "MMM d")}</p>
              </div>
              <Badge variant="outline">{dayAssignments.length} jobs</Badge>
            </div>
            <div className="space-y-2 min-h-[120px]">
              {dayAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", assignment.id);
                  }}
                  className={cn(
                    "rounded-md border bg-white p-2 shadow-sm cursor-move",
                    conflictIds.has(assignment.id) && "border-amber-400 bg-amber-50",
                  )}
                >
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{assignment.jobTitle}</span>
                    <Move className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    {assignment.engineerName}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(assignment.start), "HH:mm")} – {format(parseISO(assignment.end), "HH:mm")}
                  </p>
                  {conflictIds.has(assignment.id) && (
                    <div className="mt-1 flex items-center gap-1 text-amber-700 text-xs">
                      <AlertTriangle className="h-3 w-3" /> Conflict detected
                    </div>
                  )}
                </div>
              ))}
              {dayAssignments.length === 0 && (
                <p className="text-xs text-muted-foreground">Drop a job here to schedule.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GanttView({
  assignments,
  engineers,
  conflicts,
  onMove,
  onResize,
  onDuplicate,
}: {
  assignments: ScheduleAssignment[];
  engineers: ScheduleEngineer[];
  conflicts: ScheduleAssignment[];
  onMove: (assignment: ScheduleAssignment, newStart: Date) => void;
  onResize: (assignment: ScheduleAssignment, newEnd: Date) => void;
  onDuplicate: (assignment: ScheduleAssignment) => void;
}) {
  const [resizingId, setResizingId] = useState<string | null>(null);

  const conflictIds = new Set(conflicts.map((c) => c.id));

  const startDay = startOfWeek(new Date(), { weekStartsOn: 1 });
  const endDay = endOfWeek(new Date(), { weekStartsOn: 1 });

  const durationDays = (endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24) + 1;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2">
        {engineers.map((eng) => {
          const engAssignments = assignments.filter((a) => a.engineerId === eng.id);
          return (
            <Card key={eng.id} className="overflow-hidden">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">{eng.name}</CardTitle>
                <CardDescription>Drag to shift; drag handle to resize.</CardDescription>
              </CardHeader>
              <CardContent className="relative h-[200px] bg-muted/40">
                <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${durationDays}, minmax(0, 1fr))` }}>
                  {Array.from({ length: durationDays }).map((_, idx) => (
                    <div key={idx} className="border-r border-muted" />
                  ))}
                </div>
                {engAssignments.map((assignment) => {
                  const start = parseISO(assignment.start);
                  const end = parseISO(assignment.end);
                  const offsetDays = Math.max(0, Math.floor((start.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)));
                  const spanDays = Math.max(1 / durationDays, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div
                      key={assignment.id}
                      className={cn(
                        "absolute top-6 rounded-md bg-primary/80 text-white shadow cursor-move",
                        conflictIds.has(assignment.id) && "bg-amber-500",
                      )}
                      style={{
                        left: `${(offsetDays / durationDays) * 100}%`,
                        width: `${(spanDays / durationDays) * 100}%`,
                        minWidth: "8%",
                        height: 64,
                      }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", assignment.id);
                        setResizingId(null);
                      }}
                      onDragEnd={(e) => {
                        e.preventDefault();
                        const deltaDays = Math.round((e.clientX / (e.currentTarget.parentElement?.clientWidth || 1)) * durationDays) - offsetDays;
                        if (Number.isNaN(deltaDays)) return;
                        const newStart = addDays(start, deltaDays);
                        onMove(assignment, newStart);
                      }}
                    >
                      <div className="flex items-center justify-between px-3 py-2 text-sm">
                        <span>{assignment.jobTitle}</span>
                        <div className="flex items-center gap-2 text-xs">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDuplicate(assignment)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onMove(assignment, start)}>
                            <Undo2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div
                        className="absolute bottom-0 right-0 h-full w-2 cursor-ew-resize bg-black/10"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizingId(assignment.id);
                        }}
                        onMouseMove={(e) => {
                          if (resizingId !== assignment.id) return;
                          const parentWidth = e.currentTarget.parentElement?.parentElement?.clientWidth || 1;
                          const deltaPx = e.movementX;
                          const pxPerDay = parentWidth / durationDays;
                          const deltaDays = deltaPx / pxPerDay;
                          const newEnd = addDays(end, deltaDays);
                          const snapped = snapToMinutes(newEnd, SNAP_MINUTES);
                          onResize(assignment, snapped);
                        }}
                        onMouseUp={() => setResizingId(null)}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
