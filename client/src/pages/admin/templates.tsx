import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ROUTES, buildPath } from "@/lib/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

type Template = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  archivedAt?: string | null;
};

export default function AdminTemplatesPage() {
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);

  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => t.name.toLowerCase().includes(q));
  }, [templates, search]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const url = `/api/admin/templates${showArchived ? "?includeArchived=true" : ""}`;
      const res = await apiRequest("GET", url);
      const data = await res.json();
      setTemplates(Array.isArray(data.templates) ? data.templates : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [showArchived]);

  async function createTemplate() {
    setError("");
    try {
      const name = newName.trim();
      if (!name) return setError("Name is required");

      const res = await apiRequest("POST", "/api/admin/templates", {
        name,
        description: newDesc,
      });
      const data = await res.json();
      if (data?.template?.id) {
        setNewName(""); setNewDesc("");
        await load();
        setLocation(buildPath(ROUTES.ADMIN_TEMPLATE_EDIT, { id: data.template.id }));
      }
    } catch (e: any) {
      setError(e?.message ?? "Create failed");
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Templates</h1>
        <Button variant="outline" onClick={load} disabled={loading} data-testid="button-refresh-templates">
          Refresh
        </Button>
      </div>

      {error && <div className="text-sm text-destructive" data-testid="text-error">{error}</div>}

      <Card>
        <CardHeader><CardTitle>Create template</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Name</div>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Weekly MSHEV Inspection"
              data-testid="input-template-name"
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Description (optional)</div>
            <Input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              data-testid="input-template-description"
            />
          </div>
          <Button onClick={createTemplate} data-testid="button-create-template">Create</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Templates</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="flex-1"
              data-testid="input-search-templates"
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
            <div className="text-muted-foreground">No templates found.</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-2 border rounded-md p-3"
                  data-testid={`card-template-${t.id}`}
                >
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {t.name}
                      {!t.isActive && <Badge variant="outline">Inactive</Badge>}
                      {t.archivedAt && <Badge variant="outline">Archived</Badge>}
                    </div>
                    {t.description && <div className="text-sm text-muted-foreground">{t.description}</div>}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setLocation(buildPath(ROUTES.ADMIN_TEMPLATE_EDIT, { id: t.id }))}
                    data-testid={`button-edit-template-${t.id}`}
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
