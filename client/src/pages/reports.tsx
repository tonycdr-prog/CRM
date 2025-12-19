import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileText, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ReportPayload {
  reportType: string;
  submissionId: string;
  jobId: string;
  organizationId?: string;
  status: string;
  perAsset: Array<{
    assetId: string | null;
    label: string;
    location?: string | null;
    instances: Array<{
      id: string;
      entityTemplateId: string;
      title?: string | null;
      status: string;
      answers: Record<string, unknown>;
      readings: Array<{
        meterId?: string;
        calibrationId?: string;
        reading: Record<string, unknown>;
        calibration?: { expiresAt?: string | Date | null; calibratedAt?: string | Date | null } | null;
        meter?: { name?: string | null; serialNumber?: string | null } | null;
      }>;
    }>;
  }>;
  systemSummary: {
    systemTypeCode?: string | null;
    requiredEntities: string[];
    missingEntities: string[];
  };
  siteSummary: {
    totalEntities: number;
    submittedEntities: number;
  };
  warnings: string[];
}

interface ReportResponse {
  id: string;
  reportType: string;
  status: string;
  payloadJson: ReportPayload;
  createdAt?: string;
  signatures?: Array<{ id: string; role: string; signedBy: string; signedAt?: string }>;
}

export default function ReportsPage() {
  const { toast } = useToast();
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState("");
  const [reportType, setReportType] = useState("internal");
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [viewVariant, setViewVariant] = useState<"client" | "internal">("internal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingRole, setSigningRole] = useState("engineer");

  useEffect(() => {
    fetch("/api/csrf-token", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCsrfToken(data?.csrfToken ?? null))
      .catch(() => setCsrfToken(null));
  }, []);

  const payload = useMemo(() => report?.payloadJson, [report]);
  const signatures = useMemo(() => report?.signatures ?? [], [report]);

  const runWithToast = async (action: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await action();
    } catch (e: any) {
      const message = e?.message ?? "Request failed";
      setError(message);
      toast({ title: "Request failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!submissionId.trim()) {
      setError("Submission ID is required");
      return;
    }
    await runWithToast(async () => {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ submissionId, reportType }),
      });
      if (!res.ok) throw new Error(`Failed to generate report (${res.status})`);
      const body = await res.json();
      setReport(body.report as ReportResponse);
      setViewVariant(reportType === "client" ? "client" : "internal");
      toast({ title: "Report generated", description: `Report ${body.report?.id ?? ""} saved` });
    });
  };

  const reloadReport = async (id: string) => {
    await runWithToast(async () => {
      const res = await fetch(`/api/reports/${encodeURIComponent(id)}`, { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load report (${res.status})`);
      const body = await res.json();
      setReport(body.report as ReportResponse);
    });
  };

  const signReport = async () => {
    if (!report?.id) return;
    await runWithToast(async () => {
      const res = await fetch(`/api/reports/${encodeURIComponent(report.id)}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ role: signingRole }),
      });
      if (!res.ok) throw new Error(`Failed to sign report (${res.status})`);
      await reloadReport(report.id);
      toast({ title: "Report signed", description: `Signed as ${signingRole}` });
    });
  };

  const renderAnswers = (answers: Record<string, unknown>) => {
    const entries = Object.entries(answers ?? {});
    if (!entries.length) return <p className="text-sm text-muted-foreground">No answers captured.</p>;
    return (
      <ul className="space-y-1 text-sm">
        {entries.map(([key, value]) => (
          <li key={key} className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{key}</span>
            <span className="font-medium">{String(value)}</span>
          </li>
        ))}
      </ul>
    );
  };

  const renderReadings = (
    readings: ReportPayload["perAsset"][number]["instances"][number]["readings"],
    variant: "client" | "internal",
  ) => {
    if (!readings?.length) return <p className="text-sm text-muted-foreground">No readings recorded.</p>;
    return (
      <ul className="space-y-1 text-sm">
        {readings.map((reading) => (
          <li key={`${reading.meterId}-${reading.calibrationId}-${reading.reading?.value ?? "reading"}`} className="flex flex-col gap-1 p-2 rounded-md border">
            <div className="font-medium">Value: {String((reading.reading as any)?.value ?? reading.reading)}</div>
            {variant === "internal" && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Meter: {reading.meter?.name ?? reading.meterId ?? "Unknown"}</div>
                <div>Calibration expires: {reading.calibration?.expiresAt ? String(reading.calibration.expiresAt) : "n/a"}</div>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  const hasMissing = (payload?.systemSummary.missingEntities?.length ?? 0) > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Reporting & Sign-off</h1>
            <p className="text-muted-foreground">Generate operational reports from form submissions.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={viewVariant} onValueChange={(val: "client" | "internal") => setViewVariant(val)}>
            <SelectTrigger className="w-40" data-testid="select-view-variant">
              <SelectValue placeholder="View variant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client">Client view</SelectItem>
              <SelectItem value="internal">Internal view</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => report?.id && reloadReport(report.id)} variant="outline" disabled={!report?.id || loading}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create report</CardTitle>
          <CardDescription>Provide a submission ID and report type to generate a report payload.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="submissionId">Submission ID</Label>
            <Input
              id="submissionId"
              placeholder="submission-id"
              value={submissionId}
              onChange={(e) => setSubmissionId(e.target.value)}
              data-testid="input-submission-id"
            />
          </div>
          <div className="space-y-2">
            <Label>Report type</Label>
            <Select value={reportType} onValueChange={(val) => setReportType(val)}>
              <SelectTrigger data-testid="select-report-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={generateReport} disabled={loading} data-testid="button-generate-report" className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Generate report
            </Button>
          </div>
          {error && (
            <div className="md:col-span-3">
              <Alert variant="destructive">
                <AlertTitle>Request failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report preview</CardTitle>
          <CardDescription>Rendered from the persisted payload with per-asset and system summaries.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!payload && (
            <div className="text-sm text-muted-foreground">Generate a report to see details.</div>
          )}
          {payload && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant={viewVariant === "client" ? "secondary" : "default"}>{viewVariant} view</Badge>
                <Badge variant="outline">Job {payload.jobId}</Badge>
                <Badge variant="outline">Submission {payload.submissionId}</Badge>
                {payload.systemSummary.systemTypeCode ? (
                  <Badge variant="outline">System: {payload.systemSummary.systemTypeCode}</Badge>
                ) : null}
                {hasMissing && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Missing required
                  </Badge>
                )}
              </div>

              {payload.warnings.length ? (
                <Alert variant="destructive" data-testid="alert-report-warnings">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warnings</AlertTitle>
                  <AlertDescription className="space-y-1">
                    {payload.warnings.map((msg) => (
                      <div key={msg}>{msg}</div>
                    ))}
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                {payload.perAsset.map((asset) => (
                  <Card key={`${asset.assetId ?? "general"}-${asset.label}`} className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" /> {asset.label || "General"}
                      </CardTitle>
                      <CardDescription>{asset.location || "Unspecified location"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {asset.instances.length === 0 && (
                        <p className="text-sm text-muted-foreground">No entity instances recorded for this asset.</p>
                      )}
                      {asset.instances.map((instance) => (
                        <div key={instance.id} className="rounded-md border p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium">{instance.title || "Entity"}</div>
                            <Badge variant={instance.status === "submitted" ? "default" : "outline"}>{instance.status}</Badge>
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Answers</p>
                            {renderAnswers(instance.answers)}
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Instrumentation</p>
                            {renderReadings(instance.readings, viewVariant)}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2 p-3 rounded-md border">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 text-green-600" /> Submission status
                  </div>
                  <div className="text-sm">{payload.status}</div>
                  <div className="text-xs text-muted-foreground">
                    Submitted entities: {payload.siteSummary.submittedEntities} / {payload.siteSummary.totalEntities}
                  </div>
                </div>
                <div className="space-y-2 p-3 rounded-md border">
                  <div className="text-sm font-medium">Required entities</div>
                  <div className="text-sm text-muted-foreground">
                    {payload.systemSummary.requiredEntities.length ? payload.systemSummary.requiredEntities.join(", ") : "None"}
                  </div>
                </div>
                <div className="space-y-2 p-3 rounded-md border">
                  <div className="text-sm font-medium">Missing entities</div>
                  <div className="text-sm text-muted-foreground">
                    {payload.systemSummary.missingEntities.length
                      ? payload.systemSummary.missingEntities.join(", ")
                      : "No gaps detected"}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign-off</CardTitle>
          <CardDescription>Store a signature and payload hash for the current report.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="signingRole">Signing role</Label>
            <Input
              id="signingRole"
              value={signingRole}
              onChange={(e) => setSigningRole(e.target.value)}
              placeholder="engineer / client"
              data-testid="input-signing-role"
            />
          </div>
          <div className="flex items-end gap-3">
            <Button onClick={signReport} disabled={!report?.id || loading} className="w-full" data-testid="button-sign-report">
              Sign report
            </Button>
          </div>
          <div className="md:col-span-3 space-y-2">
            <Label>Signatures</Label>
            {signatures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No signatures recorded yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {signatures.map((sig) => (
                  <Badge key={sig.id} variant="outline" className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> {sig.role} • {sig.signedBy}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
