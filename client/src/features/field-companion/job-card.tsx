import { useMemo } from "react";
import type { KeyboardEvent } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Navigation, Clock } from "lucide-react";
import { SMOKE_CONTROL_SYSTEM_TYPES } from "@shared/schema";
import type { DbJob } from "@shared/schema";

interface SiteInfo {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postcode: string | null;
  systemType: string | null;
  accessNotes: string | null;
  parkingInfo: string | null;
  siteContactName: string | null;
  siteContactPhone: string | null;
}

export interface JobWithSite extends DbJob {
  site: SiteInfo | null;
  assetCount: number;
  completedAssetCount: number;
}

interface JobCardProps {
  job: JobWithSite;
  onOpen: (id: string) => void;
}

export function JobCard({ job, onOpen }: JobCardProps) {
  const systemLabel = useMemo(() => {
    if (!job.site?.systemType) return null;
    const system = SMOKE_CONTROL_SYSTEM_TYPES.find((s) => s.value === job.site?.systemType);
    return system?.label ?? job.site.systemType;
  }, [job.site?.systemType]);

  const percent = job.assetCount
    ? Math.round((job.completedAssetCount / job.assetCount) * 100)
    : job.status === "completed"
      ? 100
      : 0;

  const statusLabel = job.status?.replace(/_/g, " ") || "scheduled";
  const handleOpen = () => onOpen(job.id);
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(job.id);
    }
  };

  return (
    <Card
      className="hover-elevate border-border/70 bg-card/70 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">{job.jobNumber}</p>
            <CardTitle className="text-lg leading-snug">{job.title}</CardTitle>
          </div>
          <Badge variant="outline" className="capitalize">
            {statusLabel}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="truncate">
            {job.site?.name || job.siteAddress}
            {job.site?.city ? `, ${job.site.city}` : ""}
          </span>
        </div>
        {systemLabel && <p className="text-xs text-muted-foreground">System: {systemLabel}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {job.scheduledDate ? format(parseISO(job.scheduledDate), "EEE dd MMM") : "Unscheduled"}
          </div>
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            <span>{job.site?.postcode || "Route"}</span>
          </div>
        </div>
        <div>
          <Progress value={percent} className="h-2" />
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Evidence {percent}%</span>
            <span>
              Assets {job.completedAssetCount}/{job.assetCount || 0}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
