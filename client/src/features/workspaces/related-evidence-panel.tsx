import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface EvidenceStep {
  label: string;
  description: string;
  status?: "complete" | "current" | "pending";
}

interface RelatedEvidencePanelProps {
  steps?: EvidenceStep[];
  title?: string;
  subtle?: boolean;
}

const defaultSteps: EvidenceStep[] = [
  { label: "Job", description: "Scope agreed", status: "complete" },
  { label: "Form", description: "Evidence captured", status: "complete" },
  { label: "Instrument", description: "Readings + calibration", status: "complete" },
  { label: "Report", description: "Snapshot ready", status: "current" },
  { label: "Defect", description: "Exceptions raised", status: "pending" },
  { label: "Quote", description: "Remedials costed", status: "pending" },
  { label: "Remedial Job", description: "Action scheduled", status: "pending" },
];

const statusTone: Record<EvidenceStep["status"] | undefined, string> = {
  complete: "bg-emerald-100 text-emerald-700 border-emerald-200",
  current: "bg-primary/10 text-primary border-primary/30",
  pending: "bg-muted text-muted-foreground border-muted",
  undefined: "bg-muted text-muted-foreground border-muted",
};

/**
 * Golden Thread helper shown in the secondary rail to keep evidence lineage visible without
 * forcing interaction. The subtle tone avoids distracting from the primary workspace.
 */
export function RelatedEvidencePanel({ steps = defaultSteps, title = "Related evidence", subtle }: RelatedEvidencePanelProps) {
  return (
    <Card className={cn(subtle ? "bg-muted/40" : "bg-card/70", "border shadow-sm")}> 
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step, idx) => (
          <div key={`${step.label}-${idx}`} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium leading-tight">{step.label}</div>
              <Badge variant="outline" className={cn("text-[11px]", statusTone[step.status])}>
                {step.status === "complete"
                  ? "Logged"
                  : step.status === "current"
                    ? "In focus"
                    : "Pending"}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground leading-snug">{step.description}</div>
            {idx < steps.length - 1 ? <Separator className="opacity-50" /> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
