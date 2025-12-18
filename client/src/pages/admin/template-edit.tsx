import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ROUTES } from "@/lib/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";

type Template = { id: string; name: string; description?: string | null; isActive: boolean };

type SystemType = { id: string; code: string; name: string };

type EntityLibraryItem = { id: string; title: string; description?: string | null };

type TemplateEntity = {
  entityId: string;
  sortOrder: number;
  required: boolean;
  repeatPerAsset: boolean;
  evidenceRequired: boolean;
  title: string;
  description?: string | null;
};

export default function AdminTemplateEditPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/templates/:id");
  const templateId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [template, setTemplate] = useState<Template | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [systemTypes, setSystemTypes] = useState<SystemType[]>([]);
  const [selectedSystemTypeIds, setSelectedSystemTypeIds] = useState<string[]>([]);

  const [entityLibrary, setEntityLibrary] = useState<EntityLibraryItem[]>([]);
  const [templateEntities, setTemplateEntities] = useState<TemplateEntity[]>([]);
  const [addEntityId, setAddEntityId] = useState("");

  const orderedEntities = useMemo(
    () => [...templateEntities].sort((a, b) => a.sortOrder - b.sortOrder),
    [templateEntities]
  );

  async function loadAll() {
    if (!templateId) return;
    setLoading(true);
    setError("");

    try {
      const tplRes = await fetch("/api/admin/templates", { credentials: "include" });
      if (!tplRes.ok) throw new Error(`Load templates failed (${tplRes.status})`);
      const tplData = await tplRes.json();
      const found: Template | undefined = (tplData.templates ?? []).find((t: Template) => t.id === templateId);
      if (!found) throw new Error("Template not found");
      setTemplate(found);
      setName(found.name ?? "");
      setDescription(found.description ?? "");
      setIsActive(!!found.isActive);

      const stRes = await fetch("/api/admin/system-types", { credentials: "include" });
      if (!stRes.ok) throw new Error(`Load system types failed (${stRes.status})`);
      const stData = await stRes.json();
      setSystemTypes(Array.isArray(stData.systemTypes) ? stData.systemTypes : []);

      const selRes = await fetch(`/api/admin/templates/${encodeURIComponent(templateId)}/system-types`, { credentials: "include" });
      if (!selRes.ok) throw new Error(`Load template system types failed (${selRes.status})`);
      const selData = await selRes.json();
      setSelectedSystemTypeIds(Array.isArray(selData.systemTypeIds) ? selData.systemTypeIds : []);

      const entRes = await fetch("/api/admin/entities", { credentials: "include" });
      if (!entRes.ok) throw new Error(`Load entities failed (${entRes.status})`);
      const entData = await entRes.json();
      setEntityLibrary(Array.isArray(entData.entities) ? entData.entities : []);

      const teRes = await fetch(`/api/admin/templates/${encodeURIComponent(templateId)}/entities`, { credentials: "include" });
      if (!teRes.ok) throw new Error(`Load template entities failed (${teRes.status})`);
      const teData = await teRes.json();
      setTemplateEntities(Array.isArray(teData.entities) ? teData.entities : []);
    } catch (e: any) {
      setError(e?.message ?? "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [templateId]);

  async function saveTemplate() {
    if (!templateId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/templates/${encodeURIComponent(templateId)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, isActive }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleSystemType(id: string) {
    const next = selectedSystemTypeIds.includes(id)
      ? selectedSystemTypeIds.filter((x) => x !== id)
      : [...selectedSystemTypeIds, id];

    setSelectedSystemTypeIds(next);
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/templates/${encodeURIComponent(templateId!)}/system-types`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemTypeIds: next }),
      });
      if (!res.ok) throw new Error(`Save system types failed (${res.status})`);
    } catch (e: any) {
      setError(e?.message ?? "Save system types failed");
    } finally {
      setSaving(false);
    }
  }

  async function addEntity() {
    if (!templateId || !addEntityId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/templates/${encodeURIComponent(templateId)}/entities`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId: addEntityId }),
      });
      if (!res.ok) throw new Error(`Add entity failed (${res.status})`);
      setAddEntityId("");
      await loadAll();
    } catch (e: any) {
      setError(e?.message ?? "Add entity failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeEntity(entityId: string) {
    if (!templateId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/templates/${encodeURIComponent(templateId)}/entities/${encodeURIComponent(entityId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Remove failed (${res.status})`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message ?? "Remove failed");
    } finally {
      setSaving(false);
    }
  }

  async function setFlags(entityId: string, patch: Partial<Pick<TemplateEntity, "required" | "repeatPerAsset" | "evidenceRequired">>) {
    if (!templateId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/templates/${encodeURIComponent(templateId)}/entities/${encodeURIComponent(entityId)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`Update flags failed (${res.status})`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message ?? "Update flags failed");
    } finally {
      setSaving(false);
    }
  }

  async function moveEntity(entityId: string, direction: -1 | 1) {
    const idx = orderedEntities.findIndex((e) => e.entityId === entityId);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= orderedEntities.length) return;

    const next = [...orderedEntities];
    const tmp = next[idx];
    next[idx] = next[swapIdx];
    next[swapIdx] = tmp;

    const orderedEntityIds = next.map((e) => e.entityId);

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/templates/${encodeURIComponent(templateId!)}/entities/reorder`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedEntityIds }),
      });
      if (!res.ok) throw new Error(`Reorder failed (${res.status})`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message ?? "Reorder failed");
    } finally {
      setSaving(false);
    }
  }

  async function archiveTemplate() {
    if (!templateId) return;
    if (!confirm("Archive this template? Historical inspections will still reference this data.")) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/templates/${encodeURIComponent(templateId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Archive failed (${res.status})`);
      setLocation(ROUTES.ADMIN_TEMPLATES);
    } catch (e: any) {
      setError(e?.message ?? "Archive failed");
    } finally {
      setSaving(false);
    }
  }

  if (!templateId) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-muted-foreground">Missing template id.</div>
        <Button onClick={() => setLocation(ROUTES.ADMIN_TEMPLATES)} data-testid="button-back">Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setLocation(ROUTES.ADMIN_TEMPLATES)} data-testid="button-back">
            Back
          </Button>
          <h1 className="text-xl font-semibold">Edit template</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadAll} disabled={loading || saving} data-testid="button-refresh">
            Refresh
          </Button>
          <Button variant="destructive" onClick={archiveTemplate} disabled={saving} data-testid="button-archive-template">
            Archive
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-destructive" data-testid="text-error">{error}</div>}
      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle>Template details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-template-name" />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} data-testid="input-template-description" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isActive}
                  onCheckedChange={(v: any) => setIsActive(!!v)}
                  data-testid="checkbox-template-active"
                />
                <Label>Active</Label>
              </div>
              <Button onClick={saveTemplate} disabled={saving} data-testid="button-save-template">
                {saving ? "Saving…" : "Save"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>System types</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {systemTypes.length === 0 ? (
                <div className="text-muted-foreground">No system types.</div>
              ) : (
                systemTypes.map((st) => (
                  <div key={st.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedSystemTypeIds.includes(st.id)}
                      onCheckedChange={() => toggleSystemType(st.id)}
                      data-testid={`checkbox-system-type-${st.id}`}
                    />
                    <div className="text-sm">
                      {st.name} <span className="text-xs text-muted-foreground">({st.code})</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Add entity</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={addEntityId} onValueChange={setAddEntityId}>
                <SelectTrigger className="w-full md:w-[520px]" data-testid="select-add-entity">
                  <SelectValue placeholder="Choose entity…" />
                </SelectTrigger>
                <SelectContent>
                  {entityLibrary.map((e) => (
                    <SelectItem key={e.id} value={e.id} data-testid={`select-item-entity-${e.id}`}>
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addEntity} disabled={saving || !addEntityId} data-testid="button-add-entity">
                Add to template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Entities on template</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {orderedEntities.length === 0 ? (
                <div className="text-muted-foreground">No entities assigned.</div>
              ) : (
                <div className="space-y-2">
                  {orderedEntities.map((te, idx) => (
                    <div
                      key={te.entityId}
                      className="flex flex-wrap items-start justify-between gap-3 border rounded-md p-3"
                      data-testid={`card-template-entity-${te.entityId}`}
                    >
                      <div className="flex-1 min-w-[200px]">
                        <div className="font-medium">{te.title}</div>
                        {te.description && <div className="text-sm text-muted-foreground">{te.description}</div>}
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                          <label className="flex items-center gap-1.5 text-sm">
                            <Checkbox
                              checked={te.required}
                              onCheckedChange={(v: any) => setFlags(te.entityId, { required: !!v })}
                              data-testid={`checkbox-required-${te.entityId}`}
                            />
                            Required
                          </label>
                          <label className="flex items-center gap-1.5 text-sm">
                            <Checkbox
                              checked={te.repeatPerAsset}
                              onCheckedChange={(v: any) => setFlags(te.entityId, { repeatPerAsset: !!v })}
                              data-testid={`checkbox-repeat-${te.entityId}`}
                            />
                            Repeat per asset
                          </label>
                          <label className="flex items-center gap-1.5 text-sm">
                            <Checkbox
                              checked={te.evidenceRequired}
                              onCheckedChange={(v: any) => setFlags(te.entityId, { evidenceRequired: !!v })}
                              data-testid={`checkbox-evidence-${te.entityId}`}
                            />
                            Evidence required
                          </label>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => moveEntity(te.entityId, -1)}
                          disabled={idx === 0 || saving}
                          data-testid={`button-move-up-${te.entityId}`}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => moveEntity(te.entityId, 1)}
                          disabled={idx === orderedEntities.length - 1 || saving}
                          data-testid={`button-move-down-${te.entityId}`}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeEntity(te.entityId)}
                          disabled={saving}
                          data-testid={`button-remove-entity-${te.entityId}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
