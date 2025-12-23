import React from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Settings,
  ShieldAlert,
  User,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { updateEngineerProfile, useScheduleRange } from "@/modules/scheduling";
import type {
  ScheduleAssignment,
  ScheduleAvailabilitySlot,
  ScheduleEngineer,
  ScheduleEngineerProfile,
  ScheduleJobTimeWindow,
} from "@shared/schedule";

const HOURS_START = 6;
const HOURS_END = 20;
const HOUR_HEIGHT = 64;
const DEFAULT_PROFILE: ScheduleEngineerProfile = {
  engineerUserId: "",
  dailyCapacityMinutes: 480,
  workdayStart: "08:00",
  workdayEnd: "17:00",
  travelBufferMinutes: 30,
  notes: "",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const AVAILABILITY_TYPES: Record<string, string> = {
  available: "Available",
  unavailable: "Unavailable",
  holiday: "Holiday",
};

type ScheduleWarning = {
  type?: "conflict" | "availability" | "capacity" | "time_window";
  engineerId?: string;
  jobId?: string;
  message?: string;
  overlappingIds?: string[];
};

function getMinutesFromMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function parseTimeToMinutes(value?: string | null) {
  if (!value) return null;
  const [h, m] = value.split(":").map((part) => Number(part));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function formatMinutes(value: number) {
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function buildDayDate(day: Date, time: string) {
  const [h, m] = time.split(":").map((part) => Number(part));
  const next = new Date(day);
  next.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return next;
}

function getAssignmentStart(assignment: ScheduleAssignment) {
  return assignment.startsAt ?? assignment.start;
}

function getAssignmentEnd(assignment: ScheduleAssignment) {
  return assignment.endsAt ?? assignment.end;
}

function buildTimeWindowLabel(window: ScheduleJobTimeWindow | undefined) {
  if (!window) return null;
  if (window.preferredTimeStart && window.preferredTimeEnd) {
    return `Preferred ${window.preferredTimeStart}-${window.preferredTimeEnd}`;
  }
  if (window.preferredDate) {
    return `Preferred ${window.preferredDate}`;
  }
  return null;
}

function toDateKey(date: Date) {
  return date.toISOString().split("T")[0] ?? "";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildAvailabilitySummary(slots: ScheduleAvailabilitySlot[]) {
  if (!slots.length) return "No availability set";
  const recurring = slots.filter((slot) => slot.isRecurring).length;
  const specific = slots.filter((slot) => slot.specificDate).length;
  return `${recurring} recurring, ${specific} dated`;
}

function mapWarningsByKey(warnings: ScheduleWarning[]) {
  const map = new Map<string, ScheduleWarning[]>();
  warnings.forEach((warning) => {
    if (!warning.engineerId || !warning.jobId) return;
    const key = `${warning.engineerId}:${warning.jobId}`;
    const existing = map.get(key) ?? [];
    existing.push(warning);
    map.set(key, existing);
  });
  return map;
}

function buildConflictsSet(conflicts: Array<{ itemId: string }>) {
  const set = new Set<string>();
  conflicts.forEach((conflict) => set.add(conflict.itemId));
  return set;
}

function ScheduleTimeScale({ height }: { height: number }) {
  const hours = Array.from({ length: HOURS_END - HOURS_START }, (_, idx) => HOURS_START + idx);
  return (
    <div className="border-r bg-muted/30" style={{ height }}>
      {hours.map((hour) => (
        <div
          key={`hour-${hour}`}
          className="border-b px-3 text-xs text-muted-foreground"
          style={{ height: HOUR_HEIGHT }}
        >
          {String(hour).padStart(2, "0")}:00
        </div>
      ))}
    </div>
  );
}

function AvailabilityOverlay({
  profile,
  slots,
  day,
}: {
  profile: ScheduleEngineerProfile;
  slots: ScheduleAvailabilitySlot[];
  day: Date;
}) {
  const overlays: Array<{ top: number; height: number; className: string }> = [];
  const workdayStart = parseTimeToMinutes(profile.workdayStart) ?? HOURS_START * 60;
  const workdayEnd = parseTimeToMinutes(profile.workdayEnd) ?? HOURS_END * 60;
  const dayStart = HOURS_START * 60;
  const dayEnd = HOURS_END * 60;

  const before = clamp(workdayStart - dayStart, 0, dayEnd - dayStart);
  if (before > 0) {
    overlays.push({
      top: 0,
      height: (before / 60) * HOUR_HEIGHT,
      className: "bg-muted/40",
    });
  }

  const after = clamp(dayEnd - workdayEnd, 0, dayEnd - dayStart);
  if (after > 0) {
    overlays.push({
      top: ((workdayEnd - dayStart) / 60) * HOUR_HEIGHT,
      height: (after / 60) * HOUR_HEIGHT,
      className: "bg-muted/40",
    });
  }

  slots.forEach((slot) => {
    const isForDay =
      (slot.specificDate && slot.specificDate === toDateKey(day)) ||
      (slot.isRecurring && slot.dayOfWeek === day.getDay());
    if (!isForDay) return;
    if (slot.availabilityType === "available") return;

    const start = parseTimeToMinutes(slot.startTime) ?? dayStart;
    const end = parseTimeToMinutes(slot.endTime) ?? dayEnd;
    const clippedStart = clamp(start, dayStart, dayEnd);
    const clippedEnd = clamp(end, dayStart, dayEnd);
    if (clippedEnd <= clippedStart) return;

    overlays.push({
      top: ((clippedStart - dayStart) / 60) * HOUR_HEIGHT,
      height: ((clippedEnd - clippedStart) / 60) * HOUR_HEIGHT,
      className: slot.availabilityType === "holiday" ? "bg-rose-100/60" : "bg-amber-100/60",
    });
  });

  return (
    <>
      {overlays.map((overlay, idx) => (
        <div
          key={`overlay-${idx}`}
          className={cn("absolute left-0 right-0", overlay.className)}
          style={{ top: overlay.top, height: overlay.height }}
        />
      ))}
    </>
  );
}

function AssignmentCard({
  assignment,
  jobTitle,
  timeWindow,
  warnings,
  isConflict,
  onOpen,
}: {
  assignment: ScheduleAssignment;
  jobTitle: string;
  timeWindow?: ScheduleJobTimeWindow;
  warnings: ScheduleWarning[];
  isConflict: boolean;
  onOpen: () => void;
}) {
  const start = getAssignmentStart(assignment);
  const end = getAssignmentEnd(assignment);
  const timeLabel = start && end ? `${new Date(start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}-${new Date(end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Time TBD";
  const windowLabel = buildTimeWindowLabel(timeWindow);
  const hasAvailabilityWarning = warnings.some((warning) => warning.type === "availability");
  const hasTimeWindowWarning = warnings.some((warning) => warning.type === "time_window");

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group h-full rounded-lg border bg-card/95 p-2 text-left shadow-sm transition hover:shadow-md",
        isConflict && "border-rose-400 bg-rose-50/70",
        !isConflict && (hasAvailabilityWarning || hasTimeWindowWarning) && "border-amber-400 bg-amber-50/70",
      )}
      aria-label={`Open assignment ${jobTitle}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{jobTitle}</span>
        {isConflict ? (
          <Badge variant="destructive">Conflict</Badge>
        ) : hasAvailabilityWarning || hasTimeWindowWarning ? (
          <Badge variant="outline" className="border-amber-500 text-amber-700">Warning</Badge>
        ) : null}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{timeLabel}</div>
      {windowLabel ? (
        <div className="mt-1 text-xs text-muted-foreground">{windowLabel}</div>
      ) : null}
      {warnings.length ? (
        <div className="mt-1 text-xs text-muted-foreground">{warnings[0]?.message}</div>
      ) : null}
    </button>
  );
}

function EngineerProfileDialog({
  engineer,
  profile,
  onSave,
}: {
  engineer: ScheduleEngineer;
  profile: ScheduleEngineerProfile;
  onSave: (next: ScheduleEngineerProfile) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState(profile);

  React.useEffect(() => {
    if (open) {
      setForm(profile);
    }
  }, [open, profile]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Edit engineer profile">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Engineer profile</DialogTitle>
          <DialogDescription>Adjust default working hours and capacity for {engineer.name}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor={`capacity-${engineer.id}`}>Daily capacity (minutes)</Label>
            <Input
              id={`capacity-${engineer.id}`}
              type="number"
              value={form.dailyCapacityMinutes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, dailyCapacityMinutes: Number(event.target.value) || 0 }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor={`workday-start-${engineer.id}`}>Workday start</Label>
              <Input
                id={`workday-start-${engineer.id}`}
                type="time"
                value={form.workdayStart}
                onChange={(event) => setForm((prev) => ({ ...prev, workdayStart: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`workday-end-${engineer.id}`}>Workday end</Label>
              <Input
                id={`workday-end-${engineer.id}`}
                type="time"
                value={form.workdayEnd}
                onChange={(event) => setForm((prev) => ({ ...prev, workdayEnd: event.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`travel-${engineer.id}`}>Travel buffer (minutes)</Label>
            <Input
              id={`travel-${engineer.id}`}
              type="number"
              value={form.travelBufferMinutes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, travelBufferMinutes: Number(event.target.value) || 0 }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`notes-${engineer.id}`}>Notes</Label>
            <Input
              id={`notes-${engineer.id}`}
              value={form.notes ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              await onSave({ ...form, engineerUserId: engineer.id });
              setOpen(false);
            }}
          >
            Save profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AvailabilityDialog({
  engineer,
  day,
  onSave,
}: {
  engineer: ScheduleEngineer;
  day: Date;
  onSave: (payload: {
    staffId: string;
    dayOfWeek?: number | null;
    specificDate?: string | null;
    startTime: string;
    endTime: string;
    availabilityType: string;
    isRecurring: boolean;
    notes?: string | null;
  }) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [isRecurring, setIsRecurring] = React.useState(true);
  const [dayOfWeek, setDayOfWeek] = React.useState(day.getDay());
  const [specificDate, setSpecificDate] = React.useState(toDateKey(day));
  const [startTime, setStartTime] = React.useState("08:00");
  const [endTime, setEndTime] = React.useState("17:00");
  const [availabilityType, setAvailabilityType] = React.useState("available");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setDayOfWeek(day.getDay());
      setSpecificDate(toDateKey(day));
      setStartTime("08:00");
      setEndTime("17:00");
      setAvailabilityType("available");
      setNotes("");
      setIsRecurring(true);
    }
  }, [open, day]);

  if (!engineer.staffId) {
    return (
      <Button size="icon" variant="ghost" disabled aria-label="No staff record">
        <Calendar className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Add availability">
          <Calendar className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Availability block</DialogTitle>
          <DialogDescription>Capture recurring or one-off availability for {engineer.name}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`recurring-${engineer.id}`}
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked === true)}
            />
            <Label htmlFor={`recurring-${engineer.id}`}>Recurring weekly slot</Label>
          </div>
          {isRecurring ? (
            <div className="grid gap-2">
              <Label>Day of week</Label>
              <Select value={String(dayOfWeek)} onValueChange={(value) => setDayOfWeek(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_NAMES.map((name, idx) => (
                    <SelectItem key={name} value={String(idx)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor={`date-${engineer.id}`}>Date</Label>
              <Input
                id={`date-${engineer.id}`}
                type="date"
                value={specificDate}
                onChange={(event) => setSpecificDate(event.target.value)}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor={`slot-start-${engineer.id}`}>Start time</Label>
              <Input
                id={`slot-start-${engineer.id}`}
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`slot-end-${engineer.id}`}>End time</Label>
              <Input
                id={`slot-end-${engineer.id}`}
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Availability type</Label>
            <Select value={availabilityType} onValueChange={setAvailabilityType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AVAILABILITY_TYPES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`notes-${engineer.id}`}>Notes</Label>
            <Input
              id={`notes-${engineer.id}`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              await onSave({
                staffId: engineer.staffId ?? "",
                dayOfWeek: isRecurring ? dayOfWeek : null,
                specificDate: isRecurring ? null : specificDate,
                startTime,
                endTime,
                availabilityType,
                isRecurring,
                notes,
              });
              setOpen(false);
            }}
          >
            Save slot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignmentDialog({
  assignment,
  engineers,
  day,
  onSave,
  onClose,
}: {
  assignment: ScheduleAssignment | null;
  engineers: ScheduleEngineer[];
  day: Date;
  onSave: (payload: { startAt: string; endAt: string; engineerId?: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [startTime, setStartTime] = React.useState("08:00");
  const [endTime, setEndTime] = React.useState("09:00");
  const [engineerId, setEngineerId] = React.useState<string>("unassigned");

  React.useEffect(() => {
    if (!assignment) return;
    const start = getAssignmentStart(assignment);
    const end = getAssignmentEnd(assignment);
    if (start) setStartTime(formatMinutes(getMinutesFromMidnight(new Date(start))));
    if (end) setEndTime(formatMinutes(getMinutesFromMidnight(new Date(end))));
    setEngineerId(assignment.engineerUserId ?? assignment.engineerId ?? "unassigned");
  }, [assignment]);

  if (!assignment) return null;

  return (
    <Dialog open={Boolean(assignment)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update assignment</DialogTitle>
          <DialogDescription>Adjust timing or assign a different engineer.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Engineer</Label>
            <Select value={engineerId} onValueChange={setEngineerId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {engineers.map((engineer) => (
                  <SelectItem key={engineer.id} value={engineer.id}>
                    {engineer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="assignment-start">Start time</Label>
              <Input
                id="assignment-start"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assignment-end">End time</Label>
              <Input
                id="assignment-end"
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              const startAt = buildDayDate(day, startTime).toISOString();
              const endAt = buildDayDate(day, endTime).toISOString();
              await onSave({ startAt, endAt, engineerId });
              onClose();
            }}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SchedulePage() {
  const { toast } = useToast();
  const [day, setDay] = React.useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });
  const {
    assignments,
    conflicts,
    warnings,
    engineers,
    profiles,
    availability,
    timeWindows,
    isLoading,
    moveAssignment,
    refetch,
  } = useScheduleRange(day);

  const [selectedAssignment, setSelectedAssignment] = React.useState<ScheduleAssignment | null>(null);

  const profileByEngineer = React.useMemo(() => {
    const map = new Map<string, ScheduleEngineerProfile>();
    profiles.forEach((profile) => map.set(profile.engineerUserId, profile));
    return map;
  }, [profiles]);

  const availabilityByStaff = React.useMemo(() => {
    return availability.reduce((acc, slot) => {
      const existing = acc.get(slot.staffId) ?? [];
      existing.push(slot);
      acc.set(slot.staffId, existing);
      return acc;
    }, new Map<string, ScheduleAvailabilitySlot[]>());
  }, [availability]);

  const timeWindowByJob = React.useMemo(() => {
    const map = new Map<string, ScheduleJobTimeWindow>();
    timeWindows.forEach((window) => map.set(window.jobId, window));
    return map;
  }, [timeWindows]);

  const warningsByKey = React.useMemo(() => mapWarningsByKey(warnings as ScheduleWarning[]), [warnings]);
  const conflictAssignments = React.useMemo(() => buildConflictsSet(conflicts), [conflicts]);
  const capacityWarnings = (warnings as ScheduleWarning[]).filter((warning) => warning.type === "capacity");

  const profileMutation = useMutation({
    mutationFn: async (payload: ScheduleEngineerProfile) => updateEngineerProfile(payload.engineerUserId, payload),
    onSuccess: () => {
      toast({ title: "Profile saved", description: "Engineer defaults updated." });
      refetch();
    },
    onError: (err: any) => {
      toast({
        title: "Profile update failed",
        description: err?.message ?? "Unable to save profile",
        variant: "destructive",
      });
    },
  });

  const availabilityMutation = useMutation({
    mutationFn: async (payload: {
      staffId: string;
      dayOfWeek?: number | null;
      specificDate?: string | null;
      startTime: string;
      endTime: string;
      availabilityType: string;
      isRecurring: boolean;
      notes?: string | null;
    }) => {
      const res = await apiRequest("POST", "/api/staff-availability", payload);
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Unable to save availability");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Availability saved", description: "Slot added to the engineer profile." });
      refetch();
    },
    onError: (err: any) => {
      toast({
        title: "Availability update failed",
        description: err?.message ?? "Unable to save availability",
        variant: "destructive",
      });
    },
  });

  const timelineHeight = (HOURS_END - HOURS_START) * HOUR_HEIGHT;

  const engineersWithAssignments = React.useMemo(() => {
    const assignmentsByEngineer = new Map<string, ScheduleAssignment[]>();
    assignments.forEach((assignment) => {
      const engineerId = assignment.engineerUserId ?? assignment.engineerId ?? "unassigned";
      const existing = assignmentsByEngineer.get(engineerId) ?? [];
      existing.push(assignment);
      assignmentsByEngineer.set(engineerId, existing);
    });
    return assignmentsByEngineer;
  }, [assignments]);

  const unassignedAssignments = engineersWithAssignments.get("unassigned") ?? [];
  const columns: ScheduleEngineer[] = [
    ...engineers,
    ...(unassignedAssignments.length
      ? [{ id: "unassigned", name: "Unassigned", staffId: null }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Schedule</h1>
          <p className="text-sm text-muted-foreground">
            Evidence-first schedule view with capacity, availability, and customer time windows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setDay((prev) => new Date(prev.getTime() - 86400000))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setDay(() => {
            const next = new Date();
            next.setHours(0, 0, 0, 0);
            return next;
          })}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setDay((prev) => new Date(prev.getTime() + 86400000))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {format(day, "EEE dd MMM yyyy")}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">Across {columns.length} lanes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Conflicts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{conflicts.length}</div>
            <p className="text-xs text-muted-foreground">Overlapping assignments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{(warnings as ScheduleWarning[]).length}</div>
            <p className="text-xs text-muted-foreground">Availability or time window flags</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg">Daily timeline</CardTitle>
            <p className="text-sm text-muted-foreground">
              Working windows are shaded. Unavailable or holiday blocks are highlighted.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="border-amber-500 text-amber-700">Warning</Badge>
            <Badge variant="destructive">Conflict</Badge>
            <Badge variant="outline" className="border-rose-300 text-rose-600">Holiday</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div
              className="grid"
              style={{ gridTemplateColumns: `120px repeat(${columns.length || 1}, minmax(220px, 1fr))` }}
            >
              <div className="border-b bg-muted/30" />
              {columns.map((engineer) => {
                const profile = profileByEngineer.get(engineer.id) ?? { ...DEFAULT_PROFILE, engineerUserId: engineer.id };
                const slots = engineer.staffId ? availabilityByStaff.get(engineer.staffId) ?? [] : [];
                const availabilityLabel = buildAvailabilitySummary(slots);
                return (
                  <div key={`header-${engineer.id}`} className="border-b px-3 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {engineer.name}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {profile.workdayStart}-{profile.workdayEnd} | {profile.dailyCapacityMinutes} min capacity
                        </div>
                        <div className="text-xs text-muted-foreground">{availabilityLabel}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {engineer.id !== "unassigned" && (
                          <>
                            <AvailabilityDialog
                              engineer={engineer}
                              day={day}
                              onSave={(payload) => availabilityMutation.mutateAsync(payload)}
                            />
                            <EngineerProfileDialog
                              engineer={engineer}
                              profile={profile}
                              onSave={(payload) => profileMutation.mutateAsync(payload).then(() => undefined)}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              className="grid"
              style={{ gridTemplateColumns: `120px repeat(${columns.length || 1}, minmax(220px, 1fr))` }}
            >
              <ScheduleTimeScale height={timelineHeight} />
              {columns.map((engineer) => {
                const columnAssignments = engineersWithAssignments.get(engineer.id) ?? [];
                const profile = profileByEngineer.get(engineer.id) ?? { ...DEFAULT_PROFILE, engineerUserId: engineer.id };
                const slots = engineer.staffId ? availabilityByStaff.get(engineer.staffId) ?? [] : [];
                return (
                  <div key={`col-${engineer.id}`} className="relative border-l" style={{ height: timelineHeight }}>
                    <AvailabilityOverlay profile={profile} slots={slots} day={day} />
                    {columnAssignments.map((assignment) => {
                      const start = getAssignmentStart(assignment);
                      const end = getAssignmentEnd(assignment);
                      if (!start || !end) return null;
                      const startDate = new Date(start);
                      const endDate = new Date(end);
                      const dayStartMinutes = HOURS_START * 60;
                      const dayEndMinutes = HOURS_END * 60;
                      const topMinutes = clamp(getMinutesFromMidnight(startDate), dayStartMinutes, dayEndMinutes);
                      const endMinutes = clamp(getMinutesFromMidnight(endDate), dayStartMinutes, dayEndMinutes);
                      const durationMinutes = Math.max(30, endMinutes - topMinutes);
                      const top = ((topMinutes - dayStartMinutes) / 60) * HOUR_HEIGHT;
                      const height = (durationMinutes / 60) * HOUR_HEIGHT;
                      const assignmentWarnings = warningsByKey.get(`${engineer.id}:${assignment.jobId}`) ?? [];
                      const jobTitle = assignment.jobTitle ?? `Job ${assignment.jobId.slice(0, 6)}`;

                      return (
                        <div key={`card-${assignment.id}`} style={{ top, height }} className="absolute left-2 right-2">
                          <AssignmentCard
                            assignment={assignment}
                            jobTitle={jobTitle}
                            timeWindow={timeWindowByJob.get(assignment.jobId)}
                            warnings={assignmentWarnings}
                            isConflict={conflictAssignments.has(assignment.id)}
                            onOpen={() => setSelectedAssignment(assignment)}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          {isLoading ? <p className="mt-3 text-sm text-muted-foreground">Loading schedule...</p> : null}
        </CardContent>
      </Card>

      {(conflicts.length > 0 || (warnings as ScheduleWarning[]).length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conflict detail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {conflicts.length === 0 ? (
                <p className="text-muted-foreground">No conflicts detected.</p>
              ) : (
                conflicts.map((conflict) => (
                  <div key={`${conflict.itemId}-${conflict.overlapsWithId}`} className="rounded border p-2">
                    <div className="font-medium">Engineer {conflict.engineerId}</div>
                    <div className="text-xs text-muted-foreground">
                      Job {conflict.itemJobId} overlaps {conflict.overlapsWithJobId} between{" "}
                      {new Date(conflict.overlapRange.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} and{" "}
                      {new Date(conflict.overlapRange.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Warnings and capacity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(warnings as ScheduleWarning[]).length === 0 ? (
                <p className="text-muted-foreground">No warnings for the selected day.</p>
              ) : (
                (warnings as ScheduleWarning[]).map((warning, idx) => (
                  <div key={`warning-${idx}`} className="rounded border p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{warning.type ?? "Notice"}</span>
                      {warning.type === "capacity" ? <Badge variant="outline">Capacity</Badge> : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {warning.engineerId ? `Engineer ${warning.engineerId}` : "Engineer"}
                      {warning.jobId && warning.jobId !== "capacity" ? ` | Job ${warning.jobId}` : ""}
                    </div>
                    <div className="text-xs text-muted-foreground">{warning.message}</div>
                  </div>
                ))
              )}
              {capacityWarnings.length === 0 ? null : (
                <div className="text-xs text-muted-foreground">
                  Capacity warnings indicate scheduled work exceeds daily target minutes.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <AssignmentDialog
        assignment={selectedAssignment}
        engineers={columns.filter((engineer) => engineer.id !== "unassigned")}
        day={day}
        onClose={() => setSelectedAssignment(null)}
        onSave={async (payload) => {
          try {
            await moveAssignment({
              assignmentId: selectedAssignment?.id ?? "",
              startAt: payload.startAt,
              endAt: payload.endAt,
              engineerId: payload.engineerId,
            });
            toast({ title: "Assignment updated", description: "Schedule updated successfully." });
          } catch (err: any) {
            toast({
              title: "Schedule update failed",
              description: err?.message ?? "Unable to update assignment",
              variant: "destructive",
            });
          }
        }}
      />
    </div>
  );
}
