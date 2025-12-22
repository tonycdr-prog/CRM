import { apiRequest } from "@/lib/queryClient";
import type { ScheduleJobConflict, ScheduleJobSlot } from "@shared/schedule";

export type ScheduleResponse = { jobs: ScheduleJobSlot[]; conflicts?: ScheduleJobConflict[]; warnings?: any[] };

export async function fetchScheduleRange(from: string, to: string): Promise<ScheduleResponse> {
  const res = await apiRequest("GET", `/api/schedule?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Failed to load schedule");
  }
  return res.json();
}

export async function moveJob(jobId: string, startAt: string, endAt: string): Promise<ScheduleResponse> {
  const res = await apiRequest("POST", "/api/schedule/move-job", { jobId, startAt, endAt });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Failed to move job");
  }
  return res.json();
}

export async function duplicateJob(jobId: string, startAt: string, endAt: string): Promise<ScheduleResponse> {
  const res = await apiRequest("POST", "/api/schedule/duplicate-job", { jobId, startAt, endAt });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Failed to duplicate job");
  }
  return res.json();
}

