import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";

type AuditEvent = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  actorUserId?: string;
  inspectionId?: string | null;
};

type AuditTimelineProps = {
  jobId?: string | null;
  inspectionId?: string | null;
  title?: string;
  compact?: boolean;
};

function formatTimestamp(value: string) {
  try {
    return format(parseISO(value), "PP p");
  } catch {
    return value;
  }
}

function buildAuditUrl(jobId?: string | null, inspectionId?: string | null) {
  if (jobId) return `/api/jobs/${encodeURIComponent(jobId)}/audit`;
  if (inspectionId) return `/api/inspections/${encodeURIComponent(inspectionId)}/audit`;
  return "/api/audit-logs";
}

export function AuditTimeline({ jobId, inspectionId, title = "Evidence timeline", compact }: AuditTimelineProps) {
  const url = buildAuditUrl(jobId, inspectionId);
  const { data: events = [], isLoading, isError } = useQuery<
    AuditEvent[] | { events: AuditEvent[] },
    Error,
    AuditEvent[]
  >({
    queryKey: [url],
    select: (data) => (Array.isArray(data) ? data : data.events ?? []),
  });

  return (
    <Card className="border-border/70 bg-card/70 shadow-sm">
      <CardHeader className={compact ? "pb-2" : undefined}>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <Badge variant="outline" className="text-[10px] uppercase tracking-[0.2em]">
            Audit
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-muted-foreground">
        {isLoading ? <div>Loading timeline...</div> : null}
        {isError ? <div>Unable to load audit timeline.</div> : null}
        {!isLoading && !isError && events.length === 0 ? (
          <div>No evidence events recorded yet.</div>
        ) : null}
        {events.map((event, index) => (
          <div key={event.id} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-foreground">{event.action}</div>
              <span>{formatTimestamp(event.createdAt)}</span>
            </div>
            <div>
              {event.entityType} - {event.entityId}
            </div>
            {index < events.length - 1 ? <Separator className="opacity-50" /> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
