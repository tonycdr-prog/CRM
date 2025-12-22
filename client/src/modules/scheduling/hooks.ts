import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ScheduleJobConflict, ScheduleJobSlot } from "@shared/schedule";
import { duplicateJob, fetchScheduleRange, moveJob, type ScheduleResponse } from "./api";

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

  const query = useQuery<ScheduleResponse>({
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
    mutationFn: ({ jobId, startAt, endAt }: { jobId: string; startAt: string; endAt: string }) =>
      moveJob(jobId, startAt, endAt),
    onSuccess: (data) => {
      if (data.warnings?.length) {
        toast({
          title: "Scheduling warning",
          description: "Engineer already has an overlapping job.",
        });
      }
      qc.invalidateQueries({ queryKey: ["schedule-range"] });
    },
    onError: (err: any) => {
      toast({
        title: "Schedule update failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ jobId, startAt, endAt }: { jobId: string; startAt: string; endAt: string }) =>
      duplicateJob(jobId, startAt, endAt),
    onSuccess: (data) => {
      if (data.warnings?.length) {
        toast({
          title: "Scheduling warning",
          description: "Engineer already has an overlapping job.",
        });
      }
      qc.invalidateQueries({ queryKey: ["schedule-range"] });
    },
    onError: (err: any) => {
      toast({
        title: "Schedule duplication failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });

  return {
    jobs: query.data?.jobs ?? [],
    conflicts: query.data?.conflicts ?? ([] as ScheduleJobConflict[]),
    isLoading: query.isLoading,
    refetch: () => qc.invalidateQueries({ queryKey: ["schedule-range"] }),
    moveJob: moveMutation.mutateAsync,
    duplicateJob: duplicateMutation.mutateAsync,
  };
}

export type ScheduleData = {
  jobs: ScheduleJobSlot[];
  conflicts: ScheduleJobConflict[];
};

