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
  sortOrder?: number;
  definition?: { fields: FormField[] };
}

interface FormVersion {
  id: string;
  versionNumber: number;
  status: string;
  title?: string | null;
  notes?: string | null;
  entities?: EntityTemplate[];
}

interface FormTemplate {
  id: string;
  name: string;
  description?: string | null;
  versions?: FormVersion[];
}

export default function FormsBuilderPage() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");

  const [versionTitle, setVersionTitle] = useState("");
  const [versionNotes, setVersionNotes] = useState("");

  const [entityTitle, setEntityTitle] = useState("");
  const [entityDescription, setEntityDescription] = useState("");
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState<FormField["type"]>("text");
  const [fieldRequired, setFieldRequired] = useState(false);

  useEffect(() => {
    fetch("/api/csrf-token", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCsrfToken(data?.csrfToken ?? null))
      .catch(() => setCsrfToken(null));
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/forms/templates", { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load templates (${res.status})`);
      const data = await res.json();
      setTemplates(Array.isArray(data.templates) ? data.templates : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const selectedTemplateVersions = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplate)?.versions ?? [];
  }, [templates, selectedTemplate]);

  async function handleCreateTemplate() {
    setError("");
    const name = newTemplateName.trim();
    if (!name) return setError("Template name is required");
    try {
      const res = await fetch("/api/forms/templates", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        body: JSON.stringify({ name, description: newTemplateDescription || undefined }),
      });
      if (!res.ok) throw new Error(`Failed to create template (${res.status})`);
      setNewTemplateName("");
      setNewTemplateDescription("");
      await loadTemplates();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create template");
    }
  }

  async function handleCreateVersion() {
    setError("");
    if (!selectedTemplate) return setError("Select a template first");
    try {
      const res = await fetch(`/api/forms/templates/${encodeURIComponent(selectedTemplate)}/versions`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        body: JSON.stringify({
          title: versionTitle || undefined,
          notes: versionNotes || undefined,
          entities: fieldLabel
            ? [
                {
                  title: entityTitle || "New entity",
                  description: entityDescription || undefined,
                  sortOrder: 0,
                  fields: [
                    {
                      id: fieldLabel.toLowerCase().replace(/\s+/g, "-") || "field",
                      label: fieldLabel,
                      type: fieldType,
                      required: fieldRequired,
                    },
                  ],
                },
              ]
            : [],
        }),
      });
      if (!res.ok) throw new Error(`Failed to create version (${res.status})`);
      setVersionTitle("");
      setVersionNotes("");
      setEntityTitle("");
      setEntityDescription("");
      setFieldLabel("");
      setFieldType("text");
      setFieldRequired(false);
      await loadTemplates();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create version");
    }
  }

  async function handleAddEntity(versionId: string) {
    setError("");
    if (!entityTitle.trim() || !fieldLabel.trim()) {
      return setError("Entity title and field label are required");
    }
    try {
      const res = await fetch(`/api/forms/versions/${encodeURIComponent(versionId)}/entities`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        body: JSON.stringify({
          title: entityTitle,
          description: entityDescription || undefined,
          sortOrder: 0,
          definition: {
            title: entityTitle,
            description: entityDescription || undefined,
            sortOrder: 0,
            fields: [
              {
                id: fieldLabel.toLowerCase().replace(/\s+/g, "-") || "field",
                label: fieldLabel,
                type: fieldType,
                required: fieldRequired,
              },
            ],
          },
        }),
      });
      if (!res.ok) throw new Error(`Failed to add entity (${res.status})`);
      await loadTemplates();
    } catch (e: any) {
      setError(e?.message ?? "Failed to add entity");
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Forms builder</h1>
        <Button variant="outline" onClick={loadTemplates} disabled={loading} data-testid="button-refresh-forms">
          Refresh
        </Button>
      </div>

      {error && <div className="text-sm text-destructive" data-testid="text-error">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Create template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Template name"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              data-testid="input-template-name"
            />
            <Textarea
              placeholder="Description"
              value={newTemplateDescription}
              onChange={(e) => setNewTemplateDescription(e.target.value)}
              data-testid="input-template-description"
            />
            <Button onClick={handleCreateTemplate} data-testid="button-create-template">Create</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-muted-foreground">Loading…</div>
            ) : templates.length === 0 ? (
              <div className="text-muted-foreground">No templates yet.</div>
            ) : (
              <div className="space-y-2">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className={`border rounded-md p-3 cursor-pointer ${selectedTemplate === t.id ? "border-primary" : ""}`}
                    onClick={() => setSelectedTemplate(t.id)}
                    data-testid={`card-template-${t.id}`}
                  >
                    <div className="font-medium flex items-center gap-2">
                      {t.name}
                      {t.description && <Badge variant="outline">{t.description}</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">{t.versions?.length ?? 0} versions</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create version + entity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Template</div>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem value={t.id} key={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Version title</div>
              <Input value={versionTitle} onChange={(e) => setVersionTitle(e.target.value)} placeholder="v1" />
            </div>
          </div>

          <Textarea
            placeholder="Notes"
            value={versionNotes}
            onChange={(e) => setVersionNotes(e.target.value)}
            data-testid="input-version-notes"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Entity title</div>
              <Input value={entityTitle} onChange={(e) => setEntityTitle(e.target.value)} placeholder="Entity" />
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Entity description</div>
              <Input
                value={entityDescription}
                onChange={(e) => setEntityDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Field label</div>
              <Input value={fieldLabel} onChange={(e) => setFieldLabel(e.target.value)} placeholder="e.g. Result" />
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Field type</div>
              <Select value={fieldType} onValueChange={(v) => setFieldType(v as FormField["type"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="choice">Choice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end space-x-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={fieldRequired}
                  onChange={(e) => setFieldRequired(e.target.checked)}
                  data-testid="checkbox-field-required"
                />
                <span>Required</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleCreateVersion} disabled={!selectedTemplate} data-testid="button-create-version">
              Create version
            </Button>
            {selectedTemplateVersions.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddEntity(selectedTemplateVersions[0].id)}
                data-testid="button-add-entity"
              >
                Add entity to latest version
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Versions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {selectedTemplate ? (
            selectedTemplateVersions.length === 0 ? (
              <div className="text-muted-foreground">No versions yet.</div>
            ) : (
              <div className="space-y-2">
                {selectedTemplateVersions.map((v) => (
                  <div key={v.id} className="border rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Version {v.versionNumber}</div>
                      <Badge variant={v.status === "published" ? "default" : "outline"}>{v.status}</Badge>
                    </div>
                    {v.notes && <div className="text-sm text-muted-foreground">{v.notes}</div>}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-muted-foreground">Select a template to view versions.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
