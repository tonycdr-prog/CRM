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

type Entity = { id: string; title: string; description?: string | null };

type Row = {
  id: string;
  entityId: string;
  sortOrder: number;
  component: string;
  activity: string;
  reference?: string | null;
  fieldType: "pass_fail" | "number" | "text" | "choice";
  units?: string | null;
  choices?: string[] | null;
  evidenceRequired: boolean;
};

export default function AdminEntityEditPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/entities/:id");
  const entityId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [entity, setEntity] = useState<Entity | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [rComponent, setRComponent] = useState("");
  const [rActivity, setRActivity] = useState("");
  const [rFieldType, setRFieldType] = useState<Row["fieldType"]>("pass_fail");
  const [rUnits, setRUnits] = useState("");
  const [rReference, setRReference] = useState("");
  const [rEvidence, setREvidence] = useState(false);
  const [rChoices, setRChoices] = useState("");

  const orderedRows = useMemo(() => [...rows].sort((a, b) => a.sortOrder - b.sortOrder), [rows]);

  async function load() {
    if (!entityId) return;
    setLoading(true);
    setError("");
    try {
      const listRes = await fetch("/api/admin/entities", { credentials: "include" });
      if (!listRes.ok) throw new Error(`Failed to load entities (${listRes.status})`);
      const listData = await listRes.json();
      const found: Entity | undefined = (listData.entities ?? []).find((e: Entity) => e.id === entityId);
      if (!found) throw new Error("Entity not found");
      setEntity(found);
      setTitle(found.title ?? "");
      setDescription(found.description ?? "");

      const rowsRes = await fetch(`/api/admin/entities/${encodeURIComponent(entityId)}/rows`, {
        credentials: "include",
      });
      if (!rowsRes.ok) throw new Error(`Failed to load rows (${rowsRes.status})`);
      const rowsData = await rowsRes.json();
      setRows(Array.isArray(rowsData.rows) ? rowsData.rows : []);
    } catch (e: any) {
      setError(e?.message ?? "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [entityId]);

  async function saveEntity() {
    if (!entityId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/entities/${encodeURIComponent(entityId)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function addRow() {
    if (!entityId) return;
    setSaving(true);
    setError("");
    try {
      const payload: any = {
        component: rComponent,
        activity: rActivity,
        fieldType: rFieldType,
        units: rUnits || null,
        reference: rReference || null,
        evidenceRequired: rEvidence,
      };
      if (rFieldType === "choice") {
        payload.choices = rChoices
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const res = await fetch(`/api/admin/entities/${encodeURIComponent(entityId)}/rows`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Add row failed (${res.status})`);
      setRComponent("");
      setRActivity("");
      setRUnits("");
      setRReference("");
      setREvidence(false);
      setRChoices("");
      setRFieldType("pass_fail");
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Add row failed");
    } finally {
      setSaving(false);
    }
  }

  async function archiveRow(rowId: string) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/entity-rows/${encodeURIComponent(rowId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Archive failed (${res.status})`);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Archive failed");
    } finally {
      setSaving(false);
    }
  }

  async function moveRow(rowId: string, direction: -1 | 1) {
    const idx = orderedRows.findIndex((r) => r.id === rowId);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= orderedRows.length) return;

    const next = [...orderedRows];
    const tmp = next[idx];
    next[idx] = next[swapIdx];
    next[swapIdx] = tmp;

    const orderedRowIds = next.map((r) => r.id);

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/entities/${encodeURIComponent(entityId!)}/rows/reorder`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedRowIds }),
      });
      if (!res.ok) throw new Error(`Reorder failed (${res.status})`);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Reorder failed");
    } finally {
      setSaving(false);
    }
  }

  async function archiveEntity() {
    if (!entityId) return;
    if (!confirm("Archive this entity and all its rows? Historical inspections will still reference this data.")) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/entities/${encodeURIComponent(entityId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Archive failed (${res.status})`);
      setLocation(ROUTES.ADMIN_ENTITIES);
    } catch (e: any) {
      setError(e?.message ?? "Archive failed");
    } finally {
      setSaving(false);
    }
  }

  if (!entityId) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-muted-foreground">Missing entity id.</div>
        <Button onClick={() => setLocation(ROUTES.ADMIN_ENTITIES)} data-testid="button-back">Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setLocation(ROUTES.ADMIN_ENTITIES)} data-testid="button-back">
            Back
          </Button>
          <h1 className="text-xl font-semibold">Edit entity</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading || saving} data-testid="button-refresh">
            Refresh
          </Button>
          <Button variant="destructive" onClick={archiveEntity} disabled={saving} data-testid="button-archive-entity">
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
            <CardHeader>
              <CardTitle>Entity details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} data-testid="input-entity-title" />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} data-testid="input-entity-description" />
              </div>
              <Button onClick={saveEntity} disabled={saving} data-testid="button-save-entity">
                {saving ? "Saving…" : "Save"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rows</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {orderedRows.length === 0 ? (
                <div className="text-muted-foreground">No rows yet.</div>
              ) : (
                <div className="space-y-2">
                  {orderedRows.map((r, i) => (
                    <div key={r.id} className="border rounded-md p-3" data-testid={`card-row-${r.id}`}>
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <div className="font-medium">
                            {r.component} — {r.activity}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {r.fieldType}
                            {r.units ? ` • ${r.units}` : ""}
                            {r.reference ? ` • Ref: ${r.reference}` : ""}
                            {r.evidenceRequired ? " • Evidence" : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => moveRow(r.id, -1)}
                            disabled={saving || i === 0}
                            data-testid={`button-move-up-${r.id}`}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => moveRow(r.id, 1)}
                            disabled={saving || i === orderedRows.length - 1}
                            data-testid={`button-move-down-${r.id}`}
                          >
                            ↓
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => archiveRow(r.id)}
                            disabled={saving}
                            data-testid={`button-archive-row-${r.id}`}
                          >
                            Archive
                          </Button>
                        </div>
                      </div>
                      {r.fieldType === "choice" && Array.isArray(r.choices) && r.choices.length > 0 && (
                        <div className="text-sm text-muted-foreground mt-2">
                          Choices: {r.choices.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add row</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Component</Label>
                  <Input value={rComponent} onChange={(e) => setRComponent(e.target.value)} data-testid="input-row-component" />
                </div>
                <div className="space-y-1">
                  <Label>Activity</Label>
                  <Input value={rActivity} onChange={(e) => setRActivity(e.target.value)} data-testid="input-row-activity" />
                </div>
                <div className="space-y-1">
                  <Label>Field type</Label>
                  <Select value={rFieldType} onValueChange={(v: any) => setRFieldType(v)}>
                    <SelectTrigger data-testid="select-row-fieldtype">
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pass_fail">pass_fail</SelectItem>
                      <SelectItem value="number">number</SelectItem>
                      <SelectItem value="text">text</SelectItem>
                      <SelectItem value="choice">choice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Units (optional)</Label>
                  <Input value={rUnits} onChange={(e) => setRUnits(e.target.value)} data-testid="input-row-units" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Reference (optional)</Label>
                  <Input value={rReference} onChange={(e) => setRReference(e.target.value)} data-testid="input-row-reference" />
                </div>

                {rFieldType === "choice" && (
                  <div className="space-y-1 md:col-span-2">
                    <Label>Choices (comma-separated)</Label>
                    <Input
                      value={rChoices}
                      onChange={(e) => setRChoices(e.target.value)}
                      placeholder="e.g. OK, Replace, N/A"
                      data-testid="input-row-choices"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 md:col-span-2">
                  <Checkbox checked={rEvidence} onCheckedChange={(v: any) => setREvidence(!!v)} data-testid="checkbox-row-evidence" />
                  <Label>Evidence required</Label>
                </div>
              </div>

              <Button onClick={addRow} disabled={saving} data-testid="button-add-row">
                {saving ? "Saving…" : "Add row"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
