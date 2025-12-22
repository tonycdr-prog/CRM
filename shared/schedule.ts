import { z } from "zod";

export type ScheduleEngineer = {
  id: string;
  name: string;
  email?: string | null;
};

export type ScheduleJob = {
  id: string;
  title: string;
  site?: string | null;
};

const isoString = z.string();

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

export const ScheduleConflictSchema = z.object({
  engineerUserId: z.string(),
  startsAt: isoString,
  endsAt: isoString,
  overlapping: z.array(
    z.object({
      id: z.string(),
      jobId: z.string(),
      startsAt: isoString,
      endsAt: isoString,
    }),
  ),
});

export type ScheduleConflict = z.infer<typeof ScheduleConflictSchema>;

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
