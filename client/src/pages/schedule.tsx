import React from "react";
import { addDays, format, startOfWeek } from "date-fns";
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
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { fetchScheduleRange, saveJobTimeWindow, updateEngineerProfile, useScheduleRange } from "@/modules/scheduling";
import type {
  ScheduleAssignment,
  ScheduleAvailabilitySlot,
  ScheduleEngineer,
  ScheduleEngineerProfile,
  ScheduleJobTimeWindow,
  ScheduleWarning,
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

function formatMinutesToHours(value: number) {
  const hours = Math.round((value / 60) * 10) / 10;
  return `${hours}h`;
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
  const status = window.confirmationStatus ? ` (${window.confirmationStatus.replace(/_/g, " ")})` : "";
  if (window.preferredTimeStart && window.preferredTimeEnd) {
    return `Preferred ${window.preferredTimeStart}-${window.preferredTimeEnd}${status}`;
  }
  if (window.preferredDate) {
    return `Preferred ${window.preferredDate}${status}`;
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
  const hasWarning = warnings.length > 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group h-full rounded-lg border bg-card/95 p-2 text-left shadow-sm transition hover:shadow-md",
        isConflict && "border-rose-400 bg-rose-50/70",
        !isConflict && hasWarning && "border-amber-400 bg-amber-50/70",
      )}
      aria-label={`Open assignment ${jobTitle}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{jobTitle}</span>
        {isConflict ? (
          <Badge variant="destructive">Conflict</Badge>
        ) : hasWarning ? (
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
  timeWindow,
  onSave,
  onSaveTimeWindow,
  onClose,
}: {
  assignment: ScheduleAssignment | null;
  engineers: ScheduleEngineer[];
  day: Date;
  timeWindow?: ScheduleJobTimeWindow;
  onSave: (payload: { startAt: string; endAt: string; engineerId?: string }) => Promise<void>;
  onSaveTimeWindow: (payload: ScheduleJobTimeWindow) => Promise<void>;
  onClose: () => void;
}) {
  const [startTime, setStartTime] = React.useState("08:00");
  const [endTime, setEndTime] = React.useState("09:00");
  const [engineerId, setEngineerId] = React.useState<string>("unassigned");
  const [preferredDate, setPreferredDate] = React.useState("");
  const [preferredStart, setPreferredStart] = React.useState("");
  const [preferredEnd, setPreferredEnd] = React.useState("");
  const [alternateDate, setAlternateDate] = React.useState("");
  const [alternateStart, setAlternateStart] = React.useState("");
  const [alternateEnd, setAlternateEnd] = React.useState("");
  const [confirmationStatus, setConfirmationStatus] = React.useState("unconfirmed");
  const [accessRestrictions, setAccessRestrictions] = React.useState("");

  React.useEffect(() => {
    if (!assignment) return;
    const start = getAssignmentStart(assignment);
    const end = getAssignmentEnd(assignment);
    if (start) setStartTime(formatMinutes(getMinutesFromMidnight(new Date(start))));
    if (end) setEndTime(formatMinutes(getMinutesFromMidnight(new Date(end))));
    setEngineerId(assignment.engineerUserId ?? assignment.engineerId ?? "unassigned");
    setPreferredDate(timeWindow?.preferredDate ?? "");
    setPreferredStart(timeWindow?.preferredTimeStart ?? "");
    setPreferredEnd(timeWindow?.preferredTimeEnd ?? "");
    setAlternateDate(timeWindow?.alternateDate ?? "");
    setAlternateStart(timeWindow?.alternateTimeStart ?? "");
    setAlternateEnd(timeWindow?.alternateTimeEnd ?? "");
    setConfirmationStatus(timeWindow?.confirmationStatus ?? "unconfirmed");
    setAccessRestrictions(timeWindow?.accessRestrictions ?? "");
  }, [assignment, timeWindow]);

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
          <div className="rounded border border-dashed p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer time window</div>
            <div className="mt-3 grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="preferred-date">Preferred date</Label>
                <Input
                  id="preferred-date"
                  type="date"
                  value={preferredDate}
                  onChange={(event) => setPreferredDate(event.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="preferred-start">Preferred start</Label>
                  <Input
                    id="preferred-start"
                    type="time"
                    value={preferredStart}
                    onChange={(event) => setPreferredStart(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="preferred-end">Preferred end</Label>
                  <Input
                    id="preferred-end"
                    type="time"
                    value={preferredEnd}
                    onChange={(event) => setPreferredEnd(event.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="alternate-date">Alternate date</Label>
                <Input
                  id="alternate-date"
                  type="date"
                  value={alternateDate}
                  onChange={(event) => setAlternateDate(event.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="alternate-start">Alternate start</Label>
                  <Input
                    id="alternate-start"
                    type="time"
                    value={alternateStart}
                    onChange={(event) => setAlternateStart(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="alternate-end">Alternate end</Label>
                  <Input
                    id="alternate-end"
                    type="time"
                    value={alternateEnd}
                    onChange={(event) => setAlternateEnd(event.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Confirmation status</Label>
                <Select value={confirmationStatus} onValueChange={setConfirmationStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="client_requested">Client requested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="access-restrictions">Access restrictions</Label>
                <Input
                  id="access-restrictions"
                  value={accessRestrictions}
                  onChange={(event) => setAccessRestrictions(event.target.value)}
                />
              </div>
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
              if (
                timeWindow?.id ||
                preferredDate ||
                preferredStart ||
                preferredEnd ||
                alternateDate ||
                alternateStart ||
                alternateEnd ||
                accessRestrictions ||
                confirmationStatus !== "unconfirmed"
              ) {
                await onSaveTimeWindow({
                  id: timeWindow?.id,
                  jobId: assignment.jobId,
                  preferredDate: preferredDate || null,
                  preferredTimeStart: preferredStart || null,
                  preferredTimeEnd: preferredEnd || null,
                  alternateDate: alternateDate || null,
                  alternateTimeStart: alternateStart || null,
                  alternateTimeEnd: alternateEnd || null,
                  accessRestrictions: accessRestrictions || null,
                  confirmationStatus,
                });
              }
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
  const [viewMode, setViewMode] = React.useState<"day" | "week">("day");
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

  const weekStart = React.useMemo(() => startOfWeek(day, { weekStartsOn: 1 }), [day]);
  const weekEnd = React.useMemo(() => addDays(weekStart, 7), [weekStart]);
  const weekQuery = useQuery({
    queryKey: ["schedule-week", weekStart.toISOString()],
    enabled: viewMode === "week",
    queryFn: () => fetchScheduleRange(weekStart.toISOString(), weekEnd.toISOString()),
  });

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

  const warningsByKey = React.useMemo(() => mapWarningsByKey(warnings), [warnings]);
  const conflictAssignments = React.useMemo(() => buildConflictsSet(conflicts), [conflicts]);
  const capacityWarnings = warnings.filter((warning) => warning.type === "capacity");

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

  const timeWindowMutation = useMutation({
    mutationFn: async (payload: ScheduleJobTimeWindow) => saveJobTimeWindow(payload),
    onSuccess: () => {
      toast({ title: "Time window saved", description: "Customer timing captured." });
      refetch();
      weekQuery.refetch();
    },
    onError: (err: any) => {
      toast({
        title: "Time window update failed",
        description: err?.message ?? "Unable to save time window",
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

  const weekData = weekQuery.data;
  const weekAssignments = weekData?.assignments ?? [];
  const weekWarnings = weekData?.warnings ?? [];
  const weekConflicts = weekData?.conflicts ?? [];
  const weekEngineers = weekData?.engineers ?? engineers;
  const weekProfiles = weekData?.profiles ?? profiles;
  const weekDays = React.useMemo(
    () => Array.from({ length: 7 }, (_, idx) => addDays(weekStart, idx)),
    [weekStart],
  );

  const weekProfileByEngineer = React.useMemo(() => {
    const map = new Map<string, ScheduleEngineerProfile>();
    weekProfiles.forEach((profile) => map.set(profile.engineerUserId, profile));
    return map;
  }, [weekProfiles]);

  const weekAssignmentById = React.useMemo(() => {
    const map = new Map<string, ScheduleAssignment>();
    weekAssignments.forEach((assignment) => map.set(assignment.id, assignment));
    return map;
  }, [weekAssignments]);

  const weekMinutesByEngineerDay = React.useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    weekAssignments.forEach((assignment) => {
      const engineerId = assignment.engineerUserId ?? assignment.engineerId ?? "unassigned";
      const start = getAssignmentStart(assignment);
      const end = getAssignmentEnd(assignment);
      if (!start || !end) return;
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return;
      const dayKey = toDateKey(startDate);
      const minutes = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
      const engineerMap = map.get(engineerId) ?? new Map<string, number>();
      engineerMap.set(dayKey, (engineerMap.get(dayKey) ?? 0) + minutes);
      map.set(engineerId, engineerMap);
    });
    return map;
  }, [weekAssignments]);

  const weekWarningsByEngineerDay = React.useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    weekWarnings.forEach((warning) => {
      if (!warning.engineerId || !warning.jobId) return;
      const assignment = weekAssignments.find(
        (item) => item.jobId === warning.jobId && (item.engineerUserId ?? item.engineerId) === warning.engineerId,
      );
      if (!assignment) return;
      const start = getAssignmentStart(assignment);
      if (!start) return;
      const dayKey = toDateKey(new Date(start));
      const engineerMap = map.get(warning.engineerId) ?? new Map<string, number>();
      engineerMap.set(dayKey, (engineerMap.get(dayKey) ?? 0) + 1);
      map.set(warning.engineerId, engineerMap);
    });
    return map;
  }, [weekWarnings, weekAssignments]);

  const weekConflictsByEngineerDay = React.useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    weekConflicts.forEach((conflict) => {
      const assignment = weekAssignmentById.get(conflict.itemId);
      if (!assignment) return;
      const start = getAssignmentStart(assignment);
      if (!start) return;
      const dayKey = toDateKey(new Date(start));
      const engineerMap = map.get(conflict.engineerId) ?? new Map<string, number>();
      engineerMap.set(dayKey, (engineerMap.get(dayKey) ?? 0) + 1);
      map.set(conflict.engineerId, engineerMap);
    });
    return map;
  }, [weekConflicts, weekAssignmentById]);

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
          <div className="flex items-center gap-1 rounded-full border bg-background p-1">
            <Button
              size="sm"
              variant={viewMode === "day" ? "default" : "ghost"}
              onClick={() => setViewMode("day")}
            >
              Day
            </Button>
            <Button
              size="sm"
              variant={viewMode === "week" ? "default" : "ghost"}
              onClick={() => setViewMode("week")}
            >
              Week
            </Button>
          </div>
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
            {viewMode === "week"
              ? `${format(weekStart, "dd MMM")} - ${format(addDays(weekStart, 6), "dd MMM yyyy")}`
              : format(day, "EEE dd MMM yyyy")}
          </div>
        </div>
      </div>

      {viewMode === "day" && (
        <>
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
                <div className="text-2xl font-semibold">{warnings.length}</div>
                <p className="text-xs text-muted-foreground">Availability, skills, travel, or time window flags</p>
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
        </>
      )}

      {viewMode === "week" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly capacity overview</CardTitle>
            <p className="text-sm text-muted-foreground">Capacity, conflicts, and warnings by engineer.</p>
          </CardHeader>
          <CardContent>
            {weekQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading weekly schedule...</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <div
                  className="grid min-w-[880px] gap-px rounded border bg-border text-sm"
                  style={{ gridTemplateColumns: `160px repeat(7, minmax(120px, 1fr))` }}
                >
                  <div className="bg-muted px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Engineer
                  </div>
                  {weekDays.map((date) => (
                    <div
                      key={date.toISOString()}
                      className="bg-muted px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {format(date, "EEE dd")}
                    </div>
                  ))}
                  {(() => {
                    const hasUnassigned = weekAssignments.some(
                      (assignment) => (assignment.engineerUserId ?? assignment.engineerId) === "unassigned",
                    );
                    const rows = [
                      ...weekEngineers,
                      ...(hasUnassigned ? [{ id: "unassigned", name: "Unassigned", staffId: null }] : []),
                    ];
                    return rows.map((engineer) => {
                      const profile = weekProfileByEngineer.get(engineer.id) ?? {
                        ...DEFAULT_PROFILE,
                        engineerUserId: engineer.id,
                      };
                      return (
                        <React.Fragment key={`week-${engineer.id}`}>
                          <div className="bg-background px-3 py-3 text-sm font-medium">
                            {engineer.name}
                            <div className="text-xs text-muted-foreground">
                              {formatMinutesToHours(profile.dailyCapacityMinutes)} capacity
                            </div>
                          </div>
                          {weekDays.map((date) => {
                            const dayKey = toDateKey(date);
                            const minutes =
                              weekMinutesByEngineerDay.get(engineer.id)?.get(dayKey) ?? 0;
                            const warningsCount =
                              weekWarningsByEngineerDay.get(engineer.id)?.get(dayKey) ?? 0;
                            const conflictCount =
                              weekConflictsByEngineerDay.get(engineer.id)?.get(dayKey) ?? 0;
                            const overCapacity = minutes > profile.dailyCapacityMinutes;
                            return (
                              <div
                                key={`${engineer.id}-${dayKey}`}
                                className={cn(
                                  "bg-background px-3 py-3 text-xs text-muted-foreground",
                                  overCapacity && "bg-amber-50 text-amber-700",
                                )}
                              >
                                {minutes ? (
                                  <div className="space-y-1">
                                    <div className="text-sm font-medium text-foreground">
                                      {formatMinutesToHours(minutes)}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {overCapacity ? (
                                        <Badge variant="outline" className="border-amber-500 text-amber-700">
                                          Over
                                        </Badge>
                                      ) : null}
                                      {warningsCount ? (
                                        <Badge variant="outline" className="border-amber-500 text-amber-700">
                                          {warningsCount} warning{warningsCount > 1 ? "s" : ""}
                                        </Badge>
                                      ) : null}
                                      {conflictCount ? (
                                        <Badge variant="destructive">
                                          {conflictCount} conflict{conflictCount > 1 ? "s" : ""}
                                        </Badge>
                                      ) : null}
                                    </div>
                                  </div>
                                ) : (
                                  <span>--</span>
                                )}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === "day" && (conflicts.length > 0 || warnings.length > 0) && (
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
              {warnings.length === 0 ? (
                <p className="text-muted-foreground">No warnings for the selected day.</p>
              ) : (
                warnings.map((warning, idx) => (
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
        timeWindow={selectedAssignment ? timeWindowByJob.get(selectedAssignment.jobId) : undefined}
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
        onSaveTimeWindow={async (payload) => {
          await timeWindowMutation.mutateAsync(payload);
        }}
      />
    </div>
  );
}
