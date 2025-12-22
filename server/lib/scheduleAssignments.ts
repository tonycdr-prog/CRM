import { nanoid } from "nanoid";
import { assignmentsOverlap, ScheduleAssignment, ScheduleEngineer, ScheduleJob, ScheduleState } from "@shared/schedule";

const demoEngineers: ScheduleEngineer[] = [
  { id: "eng-1", name: "Alex Engineer", email: "alex@example.com" },
  { id: "eng-2", name: "Bailey Tech", email: "bailey@example.com" },
];

const demoJobs: ScheduleJob[] = [
  { id: "job-1", title: "Smoke Extract Fan Test", site: "Mall West" },
  { id: "job-2", title: "Atrium Smoke Control", site: "City HQ" },
];

const now = new Date();
const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0).toISOString();
const overlapStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30, 0, 0).toISOString();
const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0, 0).toISOString();
const afternoonStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0, 0).toISOString();
const afternoonEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 30, 0, 0).toISOString();

let scheduleState: ScheduleState = {
  engineers: demoEngineers,
  jobs: demoJobs,
  assignments: [
    {
      id: "assign-1",
      jobId: "job-1",
      jobTitle: "Smoke Extract Fan Test",
      engineerId: "eng-1",
      engineerUserId: "eng-1",
      engineerName: "Alex Engineer",
      start: todayStart,
      end: overlapStart,
      startsAt: todayStart,
      endsAt: overlapStart,
      requiredEngineers: 1,
      status: "scheduled",
    },
    {
      id: "assign-2",
      jobId: "job-1",
      jobTitle: "Smoke Extract Fan Test",
      engineerId: "eng-1",
      engineerUserId: "eng-1",
      engineerName: "Alex Engineer",
      start: overlapStart,
      end: afternoonEnd,
      startsAt: overlapStart,
      endsAt: afternoonEnd,
      requiredEngineers: 1,
      status: "scheduled",
    },
    {
      id: "assign-3",
      jobId: "job-1",
      jobTitle: "Smoke Extract Fan Test",
      engineerId: "eng-2",
      engineerUserId: "eng-2",
      engineerName: "Bailey Tech",
      start: afternoonStart,
      end: afternoonEnd,
      startsAt: afternoonStart,
      endsAt: afternoonEnd,
      requiredEngineers: 1,
      status: "scheduled",
    },
    {
      id: "assign-4",
      jobId: "job-2",
      jobTitle: "Atrium Smoke Control",
      engineerId: "eng-2",
      engineerUserId: "eng-2",
      engineerName: "Bailey Tech",
      start: todayEnd,
      end: afternoonStart,
      startsAt: todayEnd,
      endsAt: afternoonStart,
      requiredEngineers: 1,
      status: "scheduled",
    },
  ],
};

export function getScheduleState(): ScheduleState {
  return scheduleState;
}

export function resetScheduleState(): void {
  scheduleState = { ...scheduleState, assignments: [...scheduleState.assignments] };
}

export function updateScheduleState(next: ScheduleState): void {
  scheduleState = next;
}

export function createAssignment(payload: Omit<ScheduleAssignment, "id">): ScheduleAssignment {
  const assignment: ScheduleAssignment = {
    ...payload,
    start: payload.startsAt ?? payload.start,
    end: payload.endsAt ?? payload.end,
    startsAt: payload.startsAt ?? payload.start!,
    endsAt: payload.endsAt ?? payload.end!,
    engineerId: payload.engineerId ?? payload.engineerUserId,
    engineerUserId: payload.engineerUserId ?? payload.engineerId,
    requiredEngineers: payload.requiredEngineers ?? 1,
    id: nanoid(),
  };
  scheduleState = {
    ...scheduleState,
    assignments: [...scheduleState.assignments, assignment],
  };
  return assignment;
}

export function updateAssignment(id: string, updates: Partial<ScheduleAssignment>): ScheduleAssignment | undefined {
  const existing = scheduleState.assignments.find((a) => a.id === id);
  if (!existing) return undefined;
  const next: ScheduleAssignment = {
    ...existing,
    ...updates,
    start: updates.startsAt ?? updates.start ?? existing.start ?? existing.startsAt,
    end: updates.endsAt ?? updates.end ?? existing.end ?? existing.endsAt,
    startsAt: updates.startsAt ?? updates.start ?? existing.startsAt ?? existing.start!,
    endsAt: updates.endsAt ?? updates.end ?? existing.endsAt ?? existing.end!,
    engineerId: updates.engineerId ?? updates.engineerUserId ?? existing.engineerId ?? existing.engineerUserId,
    engineerUserId: updates.engineerUserId ?? updates.engineerId ?? existing.engineerUserId ?? existing.engineerId,
    requiredEngineers: updates.requiredEngineers ?? existing.requiredEngineers ?? 1,
    id: existing.id,
  };
  scheduleState = {
    ...scheduleState,
    assignments: scheduleState.assignments.map((a) => (a.id === id ? next : a)),
  };
  return next;
}

export function duplicateAssignment(sourceId: string, overrides?: Partial<ScheduleAssignment>): ScheduleAssignment | undefined {
  const existing = scheduleState.assignments.find((a) => a.id === sourceId);
  if (!existing) return undefined;
  const duplicate: ScheduleAssignment = {
    ...existing,
    ...overrides,
    start: overrides?.startsAt ?? overrides?.start ?? existing.start ?? existing.startsAt,
    end: overrides?.endsAt ?? overrides?.end ?? existing.end ?? existing.endsAt,
    startsAt: overrides?.startsAt ?? overrides?.start ?? existing.startsAt ?? existing.start!,
    endsAt: overrides?.endsAt ?? overrides?.end ?? existing.endsAt ?? existing.end!,
    engineerId: overrides?.engineerId ?? overrides?.engineerUserId ?? existing.engineerId ?? existing.engineerUserId,
    engineerUserId: overrides?.engineerUserId ?? overrides?.engineerId ?? existing.engineerUserId ?? existing.engineerId,
    requiredEngineers: overrides?.requiredEngineers ?? existing.requiredEngineers ?? 1,
    id: nanoid(),
  };
  scheduleState = {
    ...scheduleState,
    assignments: [...scheduleState.assignments, duplicate],
  };
  return duplicate;
}

export function findConflicts(assignments: ScheduleAssignment[]): ScheduleAssignment[] {
  const conflicts: ScheduleAssignment[] = [];
  for (let i = 0; i < assignments.length; i++) {
    for (let j = i + 1; j < assignments.length; j++) {
      if (assignmentsOverlap(assignments[i], assignments[j])) {
        conflicts.push(assignments[i], assignments[j]);
      }
    }
  }
  return Array.from(new Map(conflicts.map((c) => [c.id, c])).values());
}
