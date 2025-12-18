import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ROUTES, buildPath } from "@/lib/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Archive, CheckCircle, Paperclip, FileText, Circle } from "lucide-react";

type AuditEvent = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: any;
  createdAt: string;
  actorUserId: string;
  inspectionId?: string | null;
};

const NOISY_PREFIXES = ["inspection.responses.saved"];

function prettyAction(a: string) {
  return a.replace(/\./g, " ");
}

function iconFor(action: string) {
  if (action.includes("created")) return <Plus className="w-4 h-4 text-green-600" />;
  if (action.includes("updated")) return <Pencil className="w-4 h-4 text-blue-600" />;
  if (action.includes("deleted") || action.includes("archived")) return <Archive className="w-4 h-4 text-orange-600" />;
  if (action.includes("completed")) return <CheckCircle className="w-4 h-4 text-green-600" />;
  if (action.includes("attachment")) return <Paperclip className="w-4 h-4 text-purple-600" />;
  if (action.includes("responses")) return <FileText className="w-4 h-4 text-blue-600" />;
  return <Circle className="w-3 h-3 text-muted-foreground" />;
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
}

function formatDay(key: string) {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function JobActivityPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/jobs/:jobId/activity");
  const jobId = params?.jobId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [showNoisy, setShowNoisy] = useState(false);

  async function load() {
    if (!jobId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/audit`, { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json();
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [jobId]);

  if (!jobId) return <div className="p-6 text-muted-foreground">Missing job id.</div>;

  const filtered = showNoisy ? events : events.filter(e => !NOISY_PREFIXES.some(p => e.action.startsWith(p)));
  const grouped: Record<string, AuditEvent[]> = {};
  for (const e of filtered) {
    const k = dayKey(e.createdAt);
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(e);
  }
  const sortedDays = Object.keys(grouped).sort().reverse();

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setLocation(buildPath(ROUTES.JOB_DETAIL, { id: jobId }))} data-testid="button-back">
            Back
          </Button>
          <h1 className="text-xl font-semibold">Activity</h1>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} data-testid="button-refresh">Refresh</Button>
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="flex items-center gap-2">
        <Switch
          id="show-noisy"
          checked={showNoisy}
          onCheckedChange={setShowNoisy}
          data-testid="switch-show-autosave"
        />
        <Label htmlFor="show-noisy" className="text-sm cursor-pointer">Show autosave events</Label>
      </div>

      <Card>
        <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : sortedDays.length === 0 ? (
            <div className="text-muted-foreground">No events yet.</div>
          ) : (
            sortedDays.map((day) => (
              <div key={day} className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground border-b pb-1">{formatDay(day)}</div>
                {grouped[day].map((e) => (
                  <div key={e.id} className="border rounded-md p-3 flex gap-3" data-testid={`event-${e.id}`}>
                    <div className="mt-0.5">{iconFor(e.action)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{prettyAction(e.action)}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(e.createdAt).toLocaleTimeString()} &bull; {e.entityType}
                      </div>
                      {e.metadata && Object.keys(e.metadata).length > 0 && (
                        <div className="text-sm mt-2">
                          <pre className="text-xs whitespace-pre-wrap bg-muted p-2 rounded">{JSON.stringify(e.metadata, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
