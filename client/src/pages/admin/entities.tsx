import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ROUTES, buildPath } from "@/lib/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

type Entity = {
  id: string;
  title: string;
  description?: string | null;
  archivedAt?: string | null;
};

export default function AdminEntitiesPage() {
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entities, setEntities] = useState<Entity[]>([]);

  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entities;
    return entities.filter((e) => e.title.toLowerCase().includes(q));
  }, [entities, search]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const url = `/api/admin/entities${showArchived ? "?includeArchived=true" : ""}`;
      const res = await apiRequest("GET", url);
      const data = await res.json();
      setEntities(Array.isArray(data.entities) ? data.entities : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [showArchived]);

  async function createEntity() {
    setError("");
    try {
      const title = newTitle.trim();
      if (!title) {
        setError("Title is required");
        return;
      }

      const res = await apiRequest("POST", "/api/admin/entities", {
        title,
        description: newDesc,
      });
      const data = await res.json();
      if (data?.entity?.id) {
        setNewTitle("");
        setNewDesc("");
        await load();
        setLocation(buildPath(ROUTES.ADMIN_ENTITY_EDIT, { id: data.entity.id }));
      }
    } catch (e: any) {
      setError(e?.message ?? "Create failed");
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Entities</h1>
        <Button variant="outline" onClick={load} disabled={loading} data-testid="button-refresh-entities">
          Refresh
        </Button>
      </div>

      {error && <div className="text-sm text-destructive" data-testid="text-error">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Create entity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Title</div>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. MSHEV Maintenance Activities"
              data-testid="input-entity-title"
            />
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Description (optional)</div>
            <Input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Shown under the entity heading"
              data-testid="input-entity-description"
            />
          </div>

          <Button onClick={createEntity} data-testid="button-create-entity">Create</Button>
          <div className="text-xs text-muted-foreground">
            Note: only organisation role owner/admin can access these endpoints.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entity library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entities…"
              className="flex-1"
              data-testid="input-search-entities"
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                data-testid="checkbox-show-archived"
              />
              <span>Show archived</span>
            </label>
          </div>
          {loading ? (
            <div className="text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-muted-foreground">No entities found.</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-2 border rounded-md p-3"
                  data-testid={`card-entity-${e.id}`}
                >
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {e.title}
                      {e.archivedAt && <Badge variant="outline">Archived</Badge>}
                    </div>
                    {e.description && (
                      <div className="text-sm text-muted-foreground">{e.description}</div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setLocation(buildPath(ROUTES.ADMIN_ENTITY_EDIT, { id: e.id }))}
                    data-testid={`button-edit-entity-${e.id}`}
                  >
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
