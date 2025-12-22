import { apiRequest } from "@/lib/queryClient";
import type { ScheduleRangeResponse } from "@shared/schedule";

export async function fetchScheduleRange(from: string, to: string): Promise<ScheduleRangeResponse> {
  const res = await apiRequest("GET", `/api/schedule?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Failed to load schedule");
  }
  return res.json();
}

export async function updateAssignment(
  assignmentId: string,
  payload: { startAt: string; endAt: string; engineerId?: string },
): Promise<ScheduleRangeResponse> {
  const res = await apiRequest("PATCH", `/api/schedule/${assignmentId}`, payload);
  if (!res.ok) {
    if (res.status === 409) {
      const body = await res.json();
      const err: any = new Error(body?.message || "Scheduling conflict");
      err.conflicts = body?.conflicts;
      throw err;
    }
    const message = await res.text();
    throw new Error(message || "Failed to move job");
  }
  return res.json();
}

export async function createScheduledJob(payload: {
  jobId: string;
  startAt: string;
  endAt: string;
  engineerIds: string[];
  title?: string;
}): Promise<ScheduleRangeResponse> {
  const res = await apiRequest("POST", "/api/schedule", payload);
  if (!res.ok) {
    if (res.status === 409) {
      const body = await res.json();
      const err: any = new Error(body?.message || "Scheduling conflict");
      err.conflicts = body?.conflicts;
      throw err;
    }
    const message = await res.text();
    throw new Error(message || "Failed to duplicate job");
  }
  return res.json();
}

