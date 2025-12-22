import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface FormField {
  id: string;
  label: string;
  type: "text" | "number" | "boolean" | "choice";
  required?: boolean;
}

interface EntityTemplate {
  id: string;
  title: string;
  description?: string | null;
  definition?: { fields: FormField[] };
}

interface FormVersion {
  id: string;
  title?: string | null;
  versionNumber: number;
  entities: EntityTemplate[];
}

interface SubmissionEntity {
  id: string;
  entityTemplateId: string;
  assetId?: string | null;
  location?: string | null;
  answers: Record<string, unknown>;
}

interface Submission {
  id: string;
  status: string;
  entities: SubmissionEntity[];
  readings: SubmissionReading[];
}

interface JobAsset {
  id: string;
  label: string;
  location?: string | null;
}

interface CalibrationInfo {
  id: string;
  calibratedAt?: string;
  expiresAt?: string;
  certificateUrl?: string | null;
}

interface MeterInfo {
  id: string;
  name: string;
  serialNumber?: string | null;
  model?: string | null;
  activeCalibration?: CalibrationInfo | null;
}

interface SubmissionReading {
  id: string;
  entityInstanceId: string;
  meterId: string;
  calibrationId: string;
  reading: Record<string, unknown>;
  calibration?: CalibrationInfo | null;
}

export default function FormsRunnerPage() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [versions, setVersions] = useState<FormVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("");
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [answers, setAnswers] = useState<Record<string, Record<string, unknown>>>({});
  const [saving, setSaving] = useState(false);
  const [assets, setAssets] = useState<JobAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [submitWarnings, setSubmitWarnings] = useState<string[]>([]);
  const [meters, setMeters] = useState<MeterInfo[]>([]);
  const [readingInputs, setReadingInputs] = useState<
    Record<string, { meterId?: string; calibrationId?: string; value?: string }>
  >({});
  const [readingWarnings, setReadingWarnings] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetch("/api/csrf-token", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCsrfToken(data?.csrfToken ?? null))
      .catch(() => setCsrfToken(null));
  }, []);

  const loadVersions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/forms/versions", { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load versions (${res.status})`);
      const data = await res.json();
      setVersions(Array.isArray(data.versions) ? data.versions : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load versions");
    } finally {
      setLoading(false);
    }
  };

  const loadMeters = async () => {
    try {
      const res = await fetch("/api/meters/active", { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load meters (${res.status})`);
      const data = await res.json();
      setMeters(Array.isArray(data.meters) ? data.meters : []);
    } catch (e: any) {
      setError((prev) => prev || e?.message || "Failed to load meters");
    }
  };

  useEffect(() => {
    loadVersions();
    loadMeters();
  }, []);

  const syncAnswersFromSubmission = (incoming: Submission) => {
    const next: Record<string, Record<string, unknown>> = {};
    for (const entity of incoming.entities ?? []) {
      next[entity.id] = entity.answers ?? {};
    }
    setAnswers(next);
  };

  const syncReadingsFromSubmission = (incoming: Submission) => {
    const next: Record<string, { meterId?: string; calibrationId?: string; value?: string }> = {};
    for (const reading of incoming.readings ?? []) {
      next[reading.entityInstanceId] = {
        meterId: reading.meterId,
        calibrationId: reading.calibrationId,
        value: typeof reading.reading?.value === "number" ? String(reading.reading.value) : undefined,
      };
    }
    setReadingInputs(next);
  };


  const versionEntities = useMemo(() => {
    const version = versions.find((v) => v.id === selectedVersion);
    return version?.entities ?? [];
  }, [versions, selectedVersion]);

  const repeatableEntities = useMemo(
    () => versionEntities.filter((entity) => (entity.definition as any)?.repeatPerAsset),
    [versionEntities],
  );

  const generalEntities = useMemo(
    () => versionEntities.filter((entity) => !(entity.definition as any)?.repeatPerAsset),
    [versionEntities],
  );

  async function instantiateInstances(submissionId: string) {
    if (!submissionId) return;
    try {
      const res = await fetch(`/api/forms/submissions/${encodeURIComponent(submissionId)}/instantiate`, {
        method: "POST",
        credentials: "include",
        headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
      });
      if (!res.ok) throw new Error(`Failed to instantiate (${res.status})`);
      const data = await res.json();
      if (data.submission) {
        setSubmission(data.submission);
        syncAnswersFromSubmission(data.submission);
        syncReadingsFromSubmission(data.submission);
      }
      setAssets(Array.isArray(data.assets) ? data.assets : []);
      setSelectedAssetId((prev) => prev ?? data.assets?.[0]?.id ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to instantiate assets");
    }
  }

  async function startSubmission() {
    setError("");
    setSubmitWarnings([]);
    setReadingWarnings({});
    setReadingInputs({});
    if (!jobId.trim() || !selectedVersion) {
      return setError("Job ID and version are required");
    }
    try {
      const res = await fetch("/api/forms/submissions", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        body: JSON.stringify({ jobId, formVersionId: selectedVersion }),
      });
      if (!res.ok) throw new Error(`Failed to start submission (${res.status})`);
      const data = await res.json();
      setSubmission(data.submission);
      syncAnswersFromSubmission(data.submission);
      syncReadingsFromSubmission(data.submission);
      await instantiateInstances(data.submission.id);
    } catch (e: any) {
      setError(e?.message ?? "Failed to start submission");
    }
  }

  async function saveEntity(entityInstanceId: string) {
    if (!submission) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `/api/forms/submissions/${encodeURIComponent(submission.id)}/entities/${encodeURIComponent(entityInstanceId)}/answers`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
          },
          body: JSON.stringify({ answers: answers[entityInstanceId] ?? {} }),
        },
      );
      if (!res.ok) throw new Error(`Failed to save answers (${res.status})`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save answers");
    } finally {
      setSaving(false);
    }
  }

  async function saveReading(entityInstanceId: string) {
    if (!submission) return;
    const current = readingInputs[entityInstanceId] ?? {};
    if (!current.meterId || !current.calibrationId) {
      setError("Meter and calibration are required for readings");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const readingPayload: Record<string, unknown> = {};
      if (current.value !== undefined && current.value !== "") {
        const numericValue = Number(current.value);
        readingPayload.value = Number.isNaN(numericValue) ? current.value : numericValue;
      }
      const res = await fetch(`/api/forms/entity-instances/${encodeURIComponent(entityInstanceId)}/readings`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        body: JSON.stringify({
          meterId: current.meterId,
          calibrationId: current.calibrationId,
          reading: readingPayload,
        }),
      });
      if (!res.ok) throw new Error(`Failed to record reading (${res.status})`);
      const data = await res.json();
      setReadingWarnings((prev) => ({ ...prev, [entityInstanceId]: data.warnings ?? [] }));
      if (data.reading) {
        const reading: SubmissionReading = data.reading;
        setSubmission((prev) => {
          if (!prev) return prev;
          const others = prev.readings.filter((r) => r.id !== reading.id);
          return { ...prev, readings: [...others, reading] };
        });
        setReadingInputs((prev) => ({
          ...prev,
          [entityInstanceId]: {
            meterId: reading.meterId,
            calibrationId: reading.calibrationId,
            value:
              typeof reading.reading?.value === "number" || typeof reading.reading?.value === "string"
                ? String(reading.reading.value)
                : prev[entityInstanceId]?.value,
          },
        }));
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to record reading");
    } finally {
      setSaving(false);
    }
  }

  async function submitForm() {
    if (!submission) return;
    setSaving(true);
    setError("");
    setSubmitWarnings([]);
    try {
      const res = await fetch(`/api/forms/submissions/${encodeURIComponent(submission.id)}/submit`, {
        method: "POST",
        credentials: "include",
        headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
      });
      if (!res.ok) throw new Error(`Failed to submit (${res.status})`);
      const data = await res.json();
      setSubmission(data.submission);
      syncAnswersFromSubmission(data.submission);
      syncReadingsFromSubmission(data.submission);
      setSubmitWarnings(Array.isArray(data.warnings) ? data.warnings : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit");
    } finally {
      setSaving(false);
    }
  }

  function renderField(entityId: string, field: FormField) {
    const current = (answers[entityId] ?? {})[field.id];
    const commonProps = {
      className: "w-full",
      value: typeof current === "string" || typeof current === "number" ? current : "",
      onChange: (e: any) =>
        setAnswers((prev) => ({
          ...prev,
          [entityId]: { ...prev[entityId], [field.id]: field.type === "number" ? Number(e.target.value) : e.target.value },
        })),
    };

    switch (field.type) {
      case "text":
        return <Input {...commonProps} placeholder={field.label} />;
      case "number":
        return <Input type="number" {...commonProps} placeholder={field.label} />;
      case "boolean":
        return (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(current)}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  [entityId]: { ...prev[entityId], [field.id]: e.target.checked },
                }))
              }
            />
            <span>{field.label}</span>
          </label>
        );
      case "choice":
        return (
          <Textarea
            {...commonProps}
            placeholder={`${field.label} (enter choice)`}
            className="min-h-[60px]"
          />
        );
      default:
        return <div className="text-sm text-muted-foreground">Unsupported field</div>;
    }
  }

  function renderEntityCard(entity: EntityTemplate, instance?: SubmissionEntity) {
    const instanceId = instance?.id ?? entity.id;
    const readingRecord = submission?.readings.find((r) => r.entityInstanceId === instanceId);
    const readingState = readingInputs[instanceId] ?? {};
    const meterSelection = readingState.meterId ?? readingRecord?.meterId;
    const selectedMeter = meters.find((m) => m.id === meterSelection);
    const calibration = readingRecord?.calibration ?? selectedMeter?.activeCalibration ?? null;
    const calibrationExpired = calibration?.expiresAt ? new Date(calibration.expiresAt).getTime() < Date.now() : false;
    const readingValue =
      readingState.value ??
      (readingRecord?.reading?.value !== undefined && readingRecord.reading.value !== null
        ? String(readingRecord.reading.value)
        : "");
    const warningsForInstance = readingWarnings[instanceId] ?? [];
    return (
      <div
        key={`${entity.id}-${instance?.assetId ?? "general"}`}
        className="border rounded-md p-3 space-y-3 bg-white"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium">{entity.title}</div>
          {instance?.assetId && <Badge variant="outline">Asset</Badge>}
        </div>
        {entity.definition?.fields?.length ? (
          <div className="space-y-3">
            {entity.definition.fields.map((field) => (
              <div key={field.id} className="space-y-1">
                <div className="text-sm font-medium">{field.label}</div>
                {renderField(instanceId, field)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">No fields defined.</div>
        )}
        <Button
          variant="outline"
          onClick={() => saveEntity(instance?.id ?? "")}
          disabled={saving || !instance?.id}
          data-testid={`button-save-${instance?.id ?? entity.id}`}
        >
          Save
        </Button>
        <div className="space-y-2 border-t pt-3">
          <div className="text-sm font-medium">Reading</div>
          <Select
            value={meterSelection ?? ""}
            onValueChange={(value) =>
              setReadingInputs((prev) => {
                const meter = meters.find((m) => m.id === value);
                return {
                  ...prev,
                  [instanceId]: {
                    ...prev[instanceId],
                    meterId: value,
                    calibrationId: meter?.activeCalibration?.id ?? prev[instanceId]?.calibrationId,
                  },
                };
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select meter" />
            </SelectTrigger>
            <SelectContent>
              {meters.map((meter) => (
                <SelectItem key={meter.id} value={meter.id}>
                  {meter.name}
                  {meter.serialNumber ? ` (${meter.serialNumber})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {calibration ? (
            <div className={`text-xs ${calibrationExpired ? "text-amber-600" : "text-muted-foreground"}`}>
              Calibration expires {new Date(calibration.expiresAt ?? "").toLocaleDateString()}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No calibration selected.</div>
          )}
          <Input
            type="number"
            value={readingValue}
            onChange={(e) =>
              setReadingInputs((prev) => ({
                ...prev,
                [instanceId]: { ...prev[instanceId], value: e.target.value },
              }))
            }
            placeholder="Reading value"
          />
          {warningsForInstance.length > 0 && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
              {warningsForInstance.map((warning) => (
                <div key={warning}>{warning}</div>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => saveReading(instance?.id ?? "")}
            disabled={saving || !instance?.id}
            data-testid={`button-save-reading-${instance?.id ?? entity.id}`}
          >
            Record reading
          </Button>
        </div>
      </div>
    );
  }

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) ?? assets[0] ?? null;

  const untestedAssets = useMemo(() => {
    if (!submission || !repeatableEntities.length || !assets.length) return [] as JobAsset[];
    return assets.filter((asset) =>
      repeatableEntities.some((entity) => {
        const instance = submission.entities.find(
          (e) => e.entityTemplateId === entity.id && e.assetId === asset.id,
        );
        return !instance || !instance.answers || Object.keys(instance.answers).length === 0;
      }),
    );
  }, [assets, repeatableEntities, submission]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Form runner</h1>
        <Button variant="outline" onClick={loadVersions} disabled={loading} data-testid="button-refresh-versions">
          Refresh
        </Button>
      </div>

      {error && <div className="text-sm text-destructive" data-testid="text-error">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Start submission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Job ID</div>
              <Input value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="job-123" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="text-sm text-muted-foreground">Form version</div>
              <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.title || `Version ${v.versionNumber}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={startSubmission} disabled={!jobId || !selectedVersion} data-testid="button-start-submission">
            Start
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!submission ? (
            <div className="text-muted-foreground">No submission started yet.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={submission.status === "submitted" ? "default" : "outline"}>{submission.status}</Badge>
                <div className="text-sm text-muted-foreground">ID: {submission.id}</div>
              </div>
              {submitWarnings.length > 0 && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  {submitWarnings.map((warning) => (
                    <div key={warning}>{warning}</div>
                  ))}
                </div>
              )}
              {untestedAssets.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                  Untested assets remaining: {untestedAssets.map((a) => a.label).join(", ")}
                </div>
              )}
              {versionEntities.length === 0 ? (
                <div className="text-muted-foreground">This form has no entities configured.</div>
              ) : (
                <div className="space-y-4">
                  {assets.length > 0 && repeatableEntities.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Assets</div>
                      <div className="flex flex-wrap gap-2">
                        {assets.map((asset) => (
                          <Button
                            key={asset.id}
                            variant={asset.id === selectedAsset?.id ? "default" : "outline"}
                            onClick={() => setSelectedAssetId(asset.id)}
                            size="sm"
                          >
                            {asset.label}
                            {asset.location ? <span className="text-xs text-muted-foreground ml-1">({asset.location})</span> : null}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {repeatableEntities.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                          Asset-specific entities {selectedAsset ? `for ${selectedAsset.label}` : "(no asset selected)"}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => submission && instantiateInstances(submission.id)}>
                          Refresh assets
                        </Button>
                      </div>
                      {!selectedAsset ? (
                        <div className="text-muted-foreground text-sm">Select an asset to begin testing.</div>
                      ) : (
                        <div className="space-y-3">
                          {repeatableEntities.map((entity) => {
                            const instance = submission.entities.find(
                              (e) => e.entityTemplateId === entity.id && e.assetId === selectedAsset.id,
                            );
                            if (!instance)
                              return (
                                <div key={entity.id} className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                                  No instance created for this asset yet.
                                </div>
                              );
                            return renderEntityCard(entity, instance);
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="text-sm font-medium">General entities</div>
                    {generalEntities.length === 0 ? (
                      <div className="text-muted-foreground text-sm">No general entities configured.</div>
                    ) : (
                      <div className="space-y-3">
                        {generalEntities.map((entity) => {
                          const instance = submission.entities.find(
                            (e) => e.entityTemplateId === entity.id && !e.assetId,
                          );
                          return renderEntityCard(entity, instance ?? undefined);
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <Button onClick={submitForm} disabled={saving || submission.status === "submitted"} data-testid="button-submit-form">
                Submit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
