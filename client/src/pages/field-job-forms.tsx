import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CompanionShell from "@/features/field-companion/companion-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROUTES, buildPath } from "@/lib/routes";
import {
  enqueueResponses,
  enqueueAttachment,
  flushQueue,
  getPendingCount,
  getPendingAttachmentCountForRow,
} from "@/lib/offlineQueue";
import { loadRunnerProgress, saveRunnerProgress } from "@/features/field-companion/runner-progress";
import { mapAuthErrorToToast } from "@/features/field-companion/errors";
import DynamicFormRenderer, {
  FormTemplateDTO,
  ResponseDraft,
  SystemTypeDTO,
  TemplateListItemDTO,
  RowAttachmentDTO,
} from "@/components/DynamicFormRenderer";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type JobFormsDTO = {
  systemTypes: SystemTypeDTO[];
  templates: TemplateListItemDTO[];
};

type InspectionDTO = {
  id: string;
  template: FormTemplateDTO;
  completedAt: string | null;
  responses: ResponseDraft[];
};

const instrumentOptions = [
  {
    id: "mano-a12",
    name: "Manometer A12",
    calibration: "Valid until Jan 2025",
    status: "ok",
  },
  {
    id: "anemo-x5",
    name: "Anemometer X5",
    calibration: "Expires in 12 days",
    status: "warning",
  },
  {
    id: "vibe-m3",
    name: "Vibration analyser M3",
    calibration: "Expired — request swap",
    status: "expired",
  },
];

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (
    <CompanionShell
      title="Forms & tests"
      subtitle="Evidence-first runner with calibration and offline guardrails"
      status={<Badge variant="outline">{isOffline ? "Offline" : "Online"}</Badge>}
      topAction={
        <Button variant="ghost" size="sm" onClick={() => setLocation(buildPath(ROUTES.FIELD_COMPANION_JOB, { id: jobId ?? "" }))}>
          Back to job
        </Button>
      }
    >
      <div className="space-y-4 py-4">
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <p className="text-xs uppercase text-muted-foreground">Run state</p>
            <CardTitle className="text-lg">{templatesForSystem.length ? "Pick a template" : "Waiting for template"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Progress</p>
              <Progress value={progressValue} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{progressValue}% captured</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending uploads</p>
              <p className="text-sm font-medium">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Queued until connection returns</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-medium">{error ? "Attention" : isOffline ? "Offline" : "Ready"}</p>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <p className="text-xs uppercase text-muted-foreground">Instrumentation</p>
            <CardTitle className="text-lg">Select calibrated meter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              {instrumentOptions.map((instrument) => (
                <button
                  key={instrument.id}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left transition",
                    instrumentId === instrument.id
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  )}
                  onClick={() => setInstrumentId(instrument.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{instrument.name}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        instrument.status === "expired" && "text-destructive border-destructive",
                        instrument.status === "warning" && "text-amber-600 border-amber-500"
                      )}
                    >
                      {instrument.status === "ok" && "OK"}
                      {instrument.status === "warning" && "Expiring"}
                      {instrument.status === "expired" && "Expired"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{instrument.calibration}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Calibration metadata is stored with each submission.</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle>System selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <div className="text-muted-foreground">Loading forms...</div>}
            {!loading && jobForms && (
              <Select value={systemCode} onValueChange={setSystemCode}>
                <SelectTrigger className="w-full md:w-[420px]">
                  <SelectValue placeholder="Choose a system" />
                </SelectTrigger>
                <SelectContent>
                  {jobForms.systemTypes.map((s) => (
                    <SelectItem key={s.id} value={s.code}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {!loading && jobForms && (
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {templatesForSystem.length === 0 ? (
                <div className="text-muted-foreground">No templates for this system.</div>
              ) : (
                templatesForSystem.map((t) => (
                  <Button
                    key={t.id}
                    variant={templateId === t.id ? "default" : "outline"}
                    onClick={() => openTemplate(t.id)}
                    className="mr-2 mb-2"
                  >
                    {t.name}
                  </Button>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {inspection && (
          <Card>
            <CardHeader className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Runner</p>
                <CardTitle>{inspection.template.name}</CardTitle>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Pending uploads: {pendingCount}</p>
                <p>Attachments waiting: {Object.values(pendingUploadsByRowId).reduce((a, b) => a + b, 0)}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <DynamicFormRenderer
                template={inspection.template}
                responses={inspection.responses}
                readOnly={!!inspection.completedAt}
                attachmentsByRowId={attachmentsByRowId}
                pendingUploadsByRowId={pendingUploadsByRowId}
                onUpload={uploadEvidence}
                onChange={onChangeResponses}
              />

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={completeForm}
                  disabled={saving || !!inspection.completedAt}
                  data-testid="button-complete-form"
                >
                  {inspection.completedAt ? "Completed" : "Complete Form"}
                </Button>
                {inspection.completedAt && (
                  <span className="text-sm text-muted-foreground">Locked (completed)</span>
                )}
                {inspection.completedAt && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(`/api/inspections/${encodeURIComponent(inspection.id)}/pdf`, "_blank");
                    }}
                    data-testid="button-download-pdf"
                  >
                    Download PDF
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CompanionShell>
  );
}
