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

export type ScheduleAssignment = {
  id: string;
  jobId: string;
  jobTitle: string;
  engineerId: string;
  engineerName: string;
  start: string; // ISO
  end: string; // ISO
  status?: string;
};

export type ScheduleState = {
  engineers: ScheduleEngineer[];
  jobs: ScheduleJob[];
  assignments: ScheduleAssignment[];
};

export function assignmentsOverlap(a: ScheduleAssignment, b: ScheduleAssignment): boolean {
  if (a.engineerId !== b.engineerId) return false;
  const startA = new Date(a.start).getTime();
  const endA = new Date(a.end).getTime();
  const startB = new Date(b.start).getTime();
  const endB = new Date(b.end).getTime();
  return startA < endB && startB < endA;
}
