import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROUTES, buildPath } from "@/lib/routes";
import DynamicFormRenderer, {
  FormTemplateDTO,
  ResponseDraft,
  SystemTypeDTO,
  TemplateListItemDTO,
} from "@/components/DynamicFormRenderer";

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

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export default function FieldJobForms() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/field-companion/:id/forms");
  const jobId = params?.id;

  const [loading, setLoading] = useState(true);
  const [jobForms, setJobForms] = useState<JobFormsDTO | null>(null);

  const [systemCode, setSystemCode] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("");
  const [inspection, setInspection] = useState<InspectionDTO | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const storageKey = useMemo(() => {
    if (!jobId) return "";
    return `fieldFormsDraft:${jobId}:${systemCode}:${templateId}`;
  }, [jobId, systemCode, templateId]);

  useEffect(() => {
    if (!jobId) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/forms`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Failed to load forms (${res.status})`);
        const data: JobFormsDTO = await res.json();
        setJobForms(data);

        if (data.systemTypes.length && !systemCode) {
          setSystemCode(data.systemTypes[0].code);
        }
      } catch (e: any) {
        setError(e?.message ?? "Failed to load forms");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const templatesForSystem = useMemo(() => {
    if (!jobForms) return [];
    return jobForms.templates.filter((t) => t.systemTypeCode === systemCode);
  }, [jobForms, systemCode]);

  useEffect(() => {
    setTemplateId("");
    setInspection(null);
  }, [systemCode]);

  async function openTemplate(nextTemplateId: string) {
    if (!jobId) return;
    setError("");
    setTemplateId(nextTemplateId);

    const createRes = await fetch(`/api/inspections`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        systemTypeCode: systemCode,
        templateId: nextTemplateId,
      }),
    });

    if (!createRes.ok) {
      setError(`Failed to start form (${createRes.status})`);
      return;
    }

    const { inspectionId } = await createRes.json();

    const getRes = await fetch(
      `/api/inspections/${encodeURIComponent(inspectionId)}`,
      { credentials: "include" }
    );

    if (!getRes.ok) {
      setError(`Failed to load inspection (${getRes.status})`);
      return;
    }

    const data: InspectionDTO = await getRes.json();
    setInspection(data);

    // localStorage fallback draft merge (only if not completed)
    try {
      const raw = localStorage.getItem(storageKey);
      if (!data.completedAt && raw) {
        const drafts = JSON.parse(raw) as ResponseDraft[];
        if (Array.isArray(drafts)) {
          setInspection((prev) =>
            prev ? { ...prev, responses: drafts } : prev
          );
        }
      }
    } catch {
      // ignore
    }
  }

  const debouncedSave = useRef(
    debounce(async (inspectionId: string, drafts: ResponseDraft[]) => {
      setSaving(true);
      setError("");
      try {
        const res = await fetch(
          `/api/inspections/${encodeURIComponent(inspectionId)}/responses`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ responses: drafts }),
          }
        );
        if (!res.ok) throw new Error(`Save failed (${res.status})`);
        if (storageKey) localStorage.removeItem(storageKey);
      } catch (e: any) {
        try {
          if (storageKey) localStorage.setItem(storageKey, JSON.stringify(drafts));
        } catch {}
        setError(e?.message ?? "Save failed");
      } finally {
        setSaving(false);
      }
    }, 800)
  ).current;

  function onChangeResponses(drafts: ResponseDraft[]) {
    if (!inspection) return;
    if (inspection.completedAt) return;
    setInspection({ ...inspection, responses: drafts });
    debouncedSave(inspection.id, drafts);
  }

  async function completeForm() {
    if (!inspection) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `/api/inspections/${encodeURIComponent(inspection.id)}/complete`,
        { method: "POST", credentials: "include" }
      );
      if (!res.ok) throw new Error(`Complete failed (${res.status})`);
      const data: { completedAt: string } = await res.json();
      setInspection({ ...inspection, completedAt: data.completedAt });
    } catch (e: any) {
      setError(e?.message ?? "Complete failed");
    } finally {
      setSaving(false);
    }
  }

  if (!jobId) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-muted-foreground">Missing job id.</p>
        <Button onClick={() => setLocation(ROUTES.FIELD_COMPANION_HOME)}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col">
      {/* Header stays fixed */}
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() =>
              setLocation(buildPath(ROUTES.FIELD_COMPANION_JOB, { id: jobId }))
            }
          >
            Back
          </Button>
          <h1 className="text-xl font-semibold">Forms</h1>
          {saving && <span className="text-sm text-muted-foreground">Saving…</span>}
          {error && <span className="text-sm text-destructive">{error}</span>}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="container mx-auto p-4 md:p-6 space-y-4 pb-24">
          <Card>
            <CardHeader>
              <CardTitle>Select system</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && <div className="text-muted-foreground">Loading…</div>}

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
                  <div className="text-muted-foreground">
                    No templates for this system.
                  </div>
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
              <CardHeader>
                <CardTitle>{inspection.template.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DynamicFormRenderer
                  template={inspection.template}
                  responses={inspection.responses}
                  readOnly={!!inspection.completedAt}
                  onChange={onChangeResponses}
                />

                <div className="flex items-center gap-3">
                  <Button
                    onClick={completeForm}
                    disabled={saving || !!inspection.completedAt}
                  >
                    {inspection.completedAt ? "Completed" : "Complete Form"}
                  </Button>
                  {inspection.completedAt && (
                    <span className="text-sm text-muted-foreground">
                      Locked (completed)
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
