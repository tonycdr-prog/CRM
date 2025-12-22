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
      engineerName: "Alex Engineer",
      start: todayStart,
      end: overlapStart,
      status: "scheduled",
    },
    {
      id: "assign-2",
      jobId: "job-1",
      jobTitle: "Smoke Extract Fan Test",
      engineerId: "eng-1",
      engineerName: "Alex Engineer",
      start: overlapStart,
      end: afternoonEnd,
      status: "scheduled",
    },
    {
      id: "assign-3",
      jobId: "job-1",
      jobTitle: "Smoke Extract Fan Test",
      engineerId: "eng-2",
      engineerName: "Bailey Tech",
      start: afternoonStart,
      end: afternoonEnd,
      status: "scheduled",
    },
    {
      id: "assign-4",
      jobId: "job-2",
      jobTitle: "Atrium Smoke Control",
      engineerId: "eng-2",
      engineerName: "Bailey Tech",
      start: todayEnd,
      end: afternoonStart,
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
  const assignment: ScheduleAssignment = { ...payload, id: nanoid() };
  scheduleState = {
    ...scheduleState,
    assignments: [...scheduleState.assignments, assignment],
  };
  return assignment;
}

export function updateAssignment(id: string, updates: Partial<ScheduleAssignment>): ScheduleAssignment | undefined {
  const existing = scheduleState.assignments.find((a) => a.id === id);
  if (!existing) return undefined;
  const next: ScheduleAssignment = { ...existing, ...updates, id: existing.id };
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
