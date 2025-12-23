import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { ScheduleJobSlot } from "@shared/schedule";

type ScheduleUpcomingWidgetProps = {
  days?: number;
  limit?: number;
  title?: string;
};

export function ScheduleUpcomingWidget({ days = 7, limit = 6, title }: ScheduleUpcomingWidgetProps) {
  const { toast } = useToast();
  const now = useMemo(() => new Date(), []);
  const to = useMemo(() => {
    const next = new Date(now);
    next.setDate(next.getDate() + days);
    return next;
  }, [days, now]);

  const query = useQuery<{ jobs: ScheduleJobSlot[] }>({
    queryKey: ["schedule-upcoming", days],
    queryFn: async () => {
      const res = await fetch(
        `/api/schedule/jobs?from=${encodeURIComponent(now.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
        { credentials: "include" },
      );
      if (res.status === 401 || res.status === 403) {
        toast({
          title: "Not authorised",
          description: "Auth/CSRF missing — refresh page",
          variant: "destructive",
        });
        throw new Error("Auth/CSRF missing");
      }
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to load schedule");
      }
      return res.json();
    },
  });

  const items = query.data?.jobs ?? [];

  const heading = title ?? `Next ${days} day${days === 1 ? "" : "s"}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{heading}</span>
        {query.isFetching ? <span className="text-xs">Refreshing…</span> : null}
      </div>

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading schedule…</p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">Unable to load upcoming schedule.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No scheduled assignments.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {items.slice(0, limit).map((job) => {
            const displayStart = job.startAt;
            return (
              <li key={job.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{job.title || `Job ${String(job.id).slice(0, 8)}`}</span>
                <span className="whitespace-nowrap text-muted-foreground">
                  {displayStart
                    ? new Date(displayStart).toLocaleString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        month: "short",
                        day: "numeric",
                      })
                    : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            window.location.href = "/schedule";
          }}
        >
          Open schedule
        </Button>
      </div>
    </div>
  );
}
