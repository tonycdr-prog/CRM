import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type {
  ScheduleAssignment,
  ScheduleJobConflict,
  ScheduleJobSlot,
  ScheduleRangeResponse,
} from "@shared/schedule";
import { createScheduledJob, fetchScheduleRange, updateAssignment } from "./api";

function deriveJobsFromAssignments(assignments: ScheduleAssignment[]): ScheduleJobSlot[] {
  const grouped = new Map<string, ScheduleJobSlot>();
  assignments.forEach((a) => {
    const start = a.startsAt ?? a.start;
    const end = a.endsAt ?? a.end;
    if (!start || !end) return;
    const existing = grouped.get(a.jobId);
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (!existing) {
      grouped.set(a.jobId, {
        id: a.jobId,
        title: a.jobTitle ?? `Job ${a.jobId.slice(0, 6)}`,
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        assignedEngineerIds: a.engineerUserId ? [a.engineerUserId] : [],
        site: undefined,
      });
      return;
    }
    const earliest = new Date(existing.startAt).getTime() < startDate.getTime() ? existing.startAt : startDate.toISOString();
    const latest = new Date(existing.endAt).getTime() > endDate.getTime() ? existing.endAt : endDate.toISOString();
    grouped.set(a.jobId, {
      ...existing,
      startAt: earliest,
      endAt: latest,
      assignedEngineerIds: Array.from(
        new Set([...existing.assignedEngineerIds, ...(a.engineerUserId ? [a.engineerUserId] : [])]),
      ),
    });
  });
  return Array.from(grouped.values());
}

export function useScheduleRange(day: Date) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const from = React.useMemo(() => {
    const d = new Date(day);
    return d.toISOString();
  }, [day]);

  const to = React.useMemo(() => {
    const d = new Date(day);
    d.setDate(d.getDate() + 1);
    return d.toISOString();
  }, [day]);

  const queryKey = ["schedule-range", from, to];

  const query = useQuery<ScheduleRangeResponse>({
    queryKey: ["schedule-range", from, to],
    queryFn: async () => {
      try {
        return await fetchScheduleRange(from, to);
      } catch (err: any) {
        if (String(err?.message || "").toLowerCase().includes("auth")) {
          toast({
            title: "Not authorised",
            description: "Auth/CSRF missing — refresh page",
            variant: "destructive",
          });
        }
        throw err;
      }
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({
      assignmentId,
      startAt,
      endAt,
      engineerId,
    }: {
      assignmentId: string;
      startAt: string;
      endAt: string;
      engineerId?: string;
    }) => updateAssignment(assignmentId, { startAt, endAt, engineerId }),
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<ScheduleRangeResponse>(queryKey);
      if (prev) {
        const nextAssignments = prev.assignments.map((a: ScheduleAssignment) =>
          a.id === variables.assignmentId
            ? {
                ...a,
                startsAt: variables.startAt,
                endsAt: variables.endAt,
                start: variables.startAt,
                end: variables.endAt,
                engineerId: variables.engineerId ?? a.engineerId ?? a.engineerUserId,
                engineerUserId: variables.engineerId ?? a.engineerUserId ?? a.engineerId,
              }
            : a,
        );
        qc.setQueryData<ScheduleRangeResponse>(queryKey, {
          ...prev,
          assignments: nextAssignments,
          jobs: deriveJobsFromAssignments(nextAssignments),
        });
      }
      return { prev };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
      toast({
        title: "Schedule update failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      if (data.warnings?.length) {
        toast({ title: "Scheduling warning", description: "Engineer already has an overlapping job." });
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  const duplicateMutation = useMutation({
    mutationFn: ({
      jobId,
      startAt,
      endAt,
      engineerIds,
      title,
    }: {
      jobId: string;
      startAt: string;
      endAt: string;
      engineerIds: string[];
      title?: string;
    }) => createScheduledJob({ jobId, startAt, endAt, engineerIds, title }),
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<ScheduleRangeResponse>(queryKey);
      if (prev) {
        const duration = new Date(variables.endAt).getTime() - new Date(variables.startAt).getTime();
        const draftAssignments: ScheduleAssignment[] = [
          ...prev.assignments,
          ...variables.engineerIds.map((id) => ({
            id: `optimistic-${variables.jobId}-${id}`,
            jobId: variables.jobId,
            engineerId: id,
            engineerUserId: id,
            startsAt: variables.startAt,
            endsAt: new Date(new Date(variables.startAt).getTime() + duration).toISOString(),
            start: variables.startAt,
            end: new Date(new Date(variables.startAt).getTime() + duration).toISOString(),
            requiredEngineers: 1,
            jobTitle: variables.title,
          } satisfies ScheduleAssignment)),
        ];
        qc.setQueryData<ScheduleRangeResponse>(queryKey, {
          ...prev,
          assignments: draftAssignments,
          jobs: deriveJobsFromAssignments(draftAssignments),
        });
      }
      return { prev };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
      toast({
        title: "Schedule duplication failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  return {
    jobs: query.data?.jobs ?? [],
    assignments: query.data?.assignments ?? [],
    conflicts: query.data?.conflicts ?? ([] as ScheduleJobConflict[]),
    isLoading: query.isLoading,
    refetch: () => qc.invalidateQueries({ queryKey }),
    moveAssignment: moveMutation.mutateAsync,
    duplicateJob: duplicateMutation.mutateAsync,
  };
}

export type ScheduleData = {
  jobs: ScheduleJobSlot[];
  conflicts: ScheduleJobConflict[];
};

