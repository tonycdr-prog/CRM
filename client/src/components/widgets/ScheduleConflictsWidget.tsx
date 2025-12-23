import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import type { ScheduleConflictDetail } from "@shared/schedule";

export function ScheduleConflictsWidget({ days = 7 }: { days?: number }) {
  const now = React.useMemo(() => new Date(), []);
  const to = React.useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  }, [now, days]);

  const query = useQuery({
    queryKey: ["schedule-conflicts", days],
    queryFn: async (): Promise<ScheduleConflictDetail[]> => {
      const res = await apiRequest(
        "GET",
        `/api/schedule/conflicts?from=${encodeURIComponent(now.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
      );
      if (!res.ok) throw new Error(await res.text());
      const body = (await res.json()) as { conflicts?: ScheduleConflictDetail[] };
      return body.conflicts ?? [];
    },
  });

  const conflicts = query.data ?? [];

  if (query.isLoading) return <div className="text-sm text-muted-foreground">Loading conflicts...</div>;

  return (
    <div className="space-y-2 text-sm">
      {conflicts.length === 0 ? (
        <div className="text-muted-foreground">No upcoming conflicts.</div>
      ) : (
        <ul className="space-y-1">
          {conflicts.slice(0, 6).map((c) => (
            <li key={`${c.itemId}-${c.overlapsWithId}`} className="flex flex-col rounded border p-2">
              <div className="font-medium">Engineer {c.engineerId}</div>
              <div className="text-xs text-muted-foreground">
                {c.itemJobId} overlaps {c.overlapsWithJobId} - {new Date(c.overlapRange.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(c.overlapRange.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="pt-1">
        <Button variant="outline" size="sm" onClick={() => (window.location.href = "/schedule")}>View schedule</Button>
      </div>
    </div>
  );
}


