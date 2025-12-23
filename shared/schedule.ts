import { z } from "zod";

const isoString = z.string();

export type ScheduleEngineer = {
  id: string;
  name: string;
  email?: string | null;
  staffId?: string | null;
};

export type ScheduleJob = {
  id: string;
  title: string;
  site?: string | null;
};

export type ScheduleEngineerProfile = {
  engineerUserId: string;
  dailyCapacityMinutes: number;
  workdayStart: string;
  workdayEnd: string;
  travelBufferMinutes: number;
  notes?: string | null;
};

export type ScheduleAvailabilitySlot = {
  id: string;
  staffId: string;
  dayOfWeek?: number | null;
  specificDate?: string | null;
  startTime: string;
  endTime: string;
  availabilityType: string;
  isRecurring: boolean;
  notes?: string | null;
};

export type ScheduleJobTimeWindow = {
  jobId: string;
  preferredDate?: string | null;
  preferredTimeStart?: string | null;
  preferredTimeEnd?: string | null;
  alternateDate?: string | null;
  alternateTimeStart?: string | null;
  alternateTimeEnd?: string | null;
  accessRestrictions?: string | null;
  confirmationStatus?: string | null;
};

export const ScheduleJobSlotSchema = z.object({
  id: z.string(),
  title: z.string(),
  startAt: isoString,
  endAt: isoString,
  assignedEngineerIds: z.array(z.string()).default([]),
  site: z.string().optional().nullable(),
});

export type ScheduleJobSlot = z.infer<typeof ScheduleJobSlotSchema>;

export type ScheduleRangeResponse = {
  jobs: ScheduleJobSlot[];
  assignments: ScheduleAssignment[];
  engineers?: ScheduleEngineer[];
  profiles?: ScheduleEngineerProfile[];
  availability?: ScheduleAvailabilitySlot[];
  timeWindows?: ScheduleJobTimeWindow[];
  conflicts?: ScheduleConflictDetail[];
  warnings?: any[];
};

export const ScheduleAssignmentSchema = z.object({
  id: z.string(),
  organizationId: z.string().uuid().optional(),
  jobId: z.string(),
  jobTitle: z.string().optional(),
  engineerUserId: z.string().optional(),
  engineerId: z.string().optional(),
  engineerName: z.string().optional(),
  startsAt: isoString,
  endsAt: isoString,
  start: isoString,
  end: isoString,
  requiredEngineers: z.number().int().min(1).default(1),
  status: z.string().optional(),
  createdAt: isoString.optional(),
  updatedAt: isoString.optional(),
});

export type ScheduleAssignment = z.infer<typeof ScheduleAssignmentSchema>;

export const CreateScheduleAssignmentSchema = ScheduleAssignmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateScheduleAssignmentSchema = z.object({
  id: z.string(),
  engineerUserId: z.string().optional(),
  engineerId: z.string().optional(),
  startsAt: isoString.optional(),
  endsAt: isoString.optional(),
  start: isoString.optional(),
  end: isoString.optional(),
  requiredEngineers: z.number().int().min(1).optional(),
  status: z.string().optional(),
});

export const ScheduleConflictDetailSchema = z.object({
  engineerId: z.string(),
  itemId: z.string(),
  itemJobId: z.string(),
  overlapsWithId: z.string(),
  overlapsWithJobId: z.string(),
  overlapRange: z.object({ start: isoString, end: isoString }),
});

export type ScheduleConflictDetail = z.infer<typeof ScheduleConflictDetailSchema>;

export const ScheduleConflictsResponseSchema = z.object({
  conflicts: z.array(ScheduleConflictDetailSchema),
});

export type ScheduleConflictsResponse = z.infer<typeof ScheduleConflictsResponseSchema>;

export type ScheduleState = {
  engineers: ScheduleEngineer[];
  jobs: ScheduleJob[];
  assignments: ScheduleAssignment[];
};

export function assignmentTimes(assignment: ScheduleAssignment): { start?: string; end?: string } {
  return {
    start: assignment.startsAt ?? assignment.start,
    end: assignment.endsAt ?? assignment.end,
  };
}

export function assignmentsOverlap(a: ScheduleAssignment, b: ScheduleAssignment): boolean {
  if (a.engineerId && b.engineerId && a.engineerId !== b.engineerId) return false;
  const { start: startA, end: endA } = assignmentTimes(a);
  const { start: startB, end: endB } = assignmentTimes(b);
  if (!startA || !startB || !endA || !endB) return false;
  return new Date(startA).getTime() < new Date(endB).getTime() && new Date(startB).getTime() < new Date(endA).getTime();
}

function toRange(assignment: ScheduleAssignment): { start?: string; end?: string } {
  const start = assignment.startsAt ?? assignment.start;
  const end = assignment.endsAt ?? assignment.end;
  return { start, end };
}

export function listScheduleConflicts(assignments: ScheduleAssignment[]): ScheduleConflictDetail[] {
  const conflicts: ScheduleConflictDetail[] = [];
  for (let i = 0; i < assignments.length; i++) {
    for (let j = i + 1; j < assignments.length; j++) {
      const a = assignments[i];
      const b = assignments[j];
      if (!a || !b) continue;
      const engineerA = a.engineerUserId ?? a.engineerId;
      const engineerB = b.engineerUserId ?? b.engineerId;
      if (!engineerA || !engineerB || engineerA !== engineerB) continue;
      const { start: startA, end: endA } = toRange(a);
      const { start: startB, end: endB } = toRange(b);
      if (!startA || !startB || !endA || !endB) continue;
      const overlapStart = new Date(Math.max(new Date(startA).getTime(), new Date(startB).getTime()));
      const overlapEnd = new Date(Math.min(new Date(endA).getTime(), new Date(endB).getTime()));
      if (overlapStart.getTime() >= overlapEnd.getTime()) continue;
      conflicts.push({
        engineerId: engineerA,
        itemId: a.id,
        itemJobId: a.jobId,
        overlapsWithId: b.id,
        overlapsWithJobId: b.jobId,
        overlapRange: { start: overlapStart.toISOString(), end: overlapEnd.toISOString() },
      });
      conflicts.push({
        engineerId: engineerB,
        itemId: b.id,
        itemJobId: b.jobId,
        overlapsWithId: a.id,
        overlapsWithJobId: a.jobId,
        overlapRange: { start: overlapStart.toISOString(), end: overlapEnd.toISOString() },
      });
    }
  }
  return conflicts;
}

export type ScheduleJobConflict = {
  jobId: string;
  engineerId: string;
  overlappingJobIds: string[];
};

export function detectJobConflicts(assignments: ScheduleAssignment[]): ScheduleJobConflict[] {
  const conflicts: Map<string, ScheduleJobConflict> = new Map();
  for (let i = 0; i < assignments.length; i++) {
    for (let j = i + 1; j < assignments.length; j++) {
      const a = assignments[i];
      const b = assignments[j];
      if (!a || !b) continue;
      const engineerA = a.engineerUserId ?? a.engineerId;
      const engineerB = b.engineerUserId ?? b.engineerId;
      if (!engineerA || !engineerB || engineerA !== engineerB) continue;
      if (!assignmentsOverlap(a, b)) continue;
      const keyA = `${a.jobId}:${engineerA}`;
      const keyB = `${b.jobId}:${engineerB}`;
      const currentA = conflicts.get(keyA) ?? { jobId: a.jobId, engineerId: engineerA, overlappingJobIds: [] };
      const currentB = conflicts.get(keyB) ?? { jobId: b.jobId, engineerId: engineerB, overlappingJobIds: [] };
      if (!currentA.overlappingJobIds.includes(b.jobId)) currentA.overlappingJobIds.push(b.jobId);
      if (!currentB.overlappingJobIds.includes(a.jobId)) currentB.overlappingJobIds.push(a.jobId);
      conflicts.set(keyA, currentA);
      conflicts.set(keyB, currentB);
    }
  }
  return Array.from(conflicts.values());
}
