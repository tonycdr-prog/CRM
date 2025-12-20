import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Plus, ShieldCheck } from "lucide-react";

interface RemedialRecord {
  id: string;
  status: string;
  notes?: string | null;
}

interface DefectRecord {
  id: string;
  defectNumber: string;
  jobId: string | null;
  description: string;
  severity: string | null;
  status: string | null;
  assetId?: string | null;
  entityInstanceId?: string | null;
  remedials?: RemedialRecord[];
}

export default function DefectsPage() {
  const { toast } = useToast();
  const authToastShown = useRef(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [filterJobId, setFilterJobId] = useState("");
  const [formData, setFormData] = useState({
    jobId: "",
    title: "",
    description: "",
    severity: "medium",
    status: "open",
    assetId: "",
    entityInstanceId: "",
  });
  const [remedialNotes, setRemedialNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/csrf-token", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCsrfToken(data?.csrfToken ?? null))
      .catch(() => setCsrfToken(null));
  }, []);

  const { data: defects = [], refetch, isFetching } = useQuery<DefectRecord[]>({
    queryKey: ["/api/defects", filterJobId],
    queryFn: async () => {
      const query = filterJobId ? `/api/defects?jobId=${encodeURIComponent(filterJobId)}` : "/api/defects";
      const res = await fetch(query, { credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        if (!authToastShown.current) {
          authToastShown.current = true;
          toast({
            title: "Not authorised",
            description: "Auth/CSRF missing — refresh page.",
            variant: "destructive",
          });
        }
        throw new Error("Unauthorized");
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as { defects: DefectRecord[] };
      return data.defects ?? [];
    },
  });

  const groupedDefects = useMemo(() => {
    const groups: Array<{ jobId: string; items: DefectRecord[] }> = [];
    const byJob = new Map<string, DefectRecord[]>();

    for (const defect of defects) {
      const key = defect.jobId || "unassigned";
      const arr = byJob.get(key) ?? [];
      arr.push(defect);
      byJob.set(key, arr);
    }

    byJob.forEach((items, jobId) => {
      const sorted = [...items].sort((a, b) => (a.status ?? "open").localeCompare(b.status ?? "open"));
      groups.push({ jobId, items: sorted });
    });

    return groups.sort((a, b) => a.jobId.localeCompare(b.jobId));
  }, [defects]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/defects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          jobId: formData.jobId,
          description: formData.description,
          severity: formData.severity,
          status: formData.status,
          assetId: formData.assetId || undefined,
          entityInstanceId: formData.entityInstanceId || undefined,
          title: formData.title || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create defect");
    },
    onSuccess: () => {
      toast({ title: "Defect logged" });
      setFormData({ jobId: "", title: "", description: "", severity: "medium", status: "open", assetId: "", entityInstanceId: "" });
      refetch();
    },
    onError: () => toast({ title: "Failed to create defect", variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/defects/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update defect");
    },
    onSuccess: () => {
      toast({ title: "Defect updated" });
      refetch();
    },
    onError: () => toast({ title: "Failed to update defect", variant: "destructive" }),
  });

  const addRemedial = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const res = await fetch(`/api/defects/${encodeURIComponent(id)}/remedials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed to add remedial");
    },
    onSuccess: (_data, variables) => {
      toast({ title: "Remedial logged" });
      setRemedialNotes((prev) => ({ ...prev, [variables.id]: "" }));
      refetch();
    },
    onError: () => toast({ title: "Failed to add remedial", variant: "destructive" }),
  });

  const severityColor = (severity: string | null) => {
    const map: Record<string, string> = {
      critical: "bg-red-500/10 text-red-500",
      high: "bg-orange-500/10 text-orange-500",
      medium: "bg-yellow-500/10 text-yellow-500",
      low: "bg-green-500/10 text-green-500",
    };
    return map[severity || "medium"] ?? "bg-muted text-muted-foreground";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Defects & Remedials</h1>
            <p className="text-muted-foreground">Track defects linked to assets and form instances.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter by job ID"
            value={filterJobId}
            onChange={(e) => setFilterJobId(e.target.value)}
            className="w-48"
          />
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log a defect</CardTitle>
          <CardDescription>Link the defect to a job, asset, or entity instance for traceability.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Job ID</Label>
            <Input value={formData.jobId} onChange={(e) => setFormData({ ...formData, jobId: e.target.value })} placeholder="job-123" />
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Fan fault" />
          </div>
          <div className="space-y-2">
            <Label>Severity</Label>
            <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3 space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the defect and impact" />
          </div>
          <div className="space-y-2">
            <Label>Asset ID</Label>
            <Input value={formData.assetId} onChange={(e) => setFormData({ ...formData, assetId: e.target.value })} placeholder="job-site-asset" />
          </div>
          <div className="space-y-2">
            <Label>Entity instance ID</Label>
            <Input value={formData.entityInstanceId} onChange={(e) => setFormData({ ...formData, entityInstanceId: e.target.value })} placeholder="entity-instance" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="w-full" data-testid="button-add-defect">
              <Plus className="h-4 w-4 mr-2" /> Log defect
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {groupedDefects.map((group) => (
          <div key={group.jobId} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{group.jobId === "unassigned" ? "Unassigned defects" : `Job ${group.jobId}`}</h3>
              <Badge variant="outline">{group.items.length} issues</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {group.items.map((defect) => (
                <Card key={defect.id}>
                  <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{defect.defectNumber}</CardTitle>
                      <Badge className={severityColor(defect.severity)}>{defect.severity ?? "medium"}</Badge>
                    </div>
                    <CardDescription>{defect.description || "No description"}</CardDescription>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {defect.assetId ? <Badge variant="outline">Asset {defect.assetId}</Badge> : null}
                      {defect.entityInstanceId ? <Badge variant="outline">Entity {defect.entityInstanceId}</Badge> : null}
                      <Badge variant="secondary">Status: {defect.status ?? "open"}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Select
                        value={defect.status ?? "open"}
                        onValueChange={(value) => updateStatus.mutate({ id: defect.id, status: value })}
                      >
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus.mutate({ id: defect.id, status: "resolved" })}
                        disabled={updateStatus.isPending}
                      >
                        Resolve
                      </Button>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <ShieldCheck className="h-4 w-4 text-primary" /> Remedials
                      </div>
                      {defect.remedials?.length ? (
                        <div className="space-y-2 text-sm">
                          {defect.remedials.map((remedial) => (
                            <div key={remedial.id} className="rounded-md border p-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{remedial.status}</span>
                              </div>
                              <div className="text-muted-foreground">{remedial.notes || "No notes"}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No remedials logged.</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Add remedial note"
                          value={remedialNotes[defect.id] ?? ""}
                          onChange={(e) => setRemedialNotes((prev) => ({ ...prev, [defect.id]: e.target.value }))}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => addRemedial.mutate({ id: defect.id, notes: remedialNotes[defect.id] ?? "" })}
                          disabled={addRemedial.isPending}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
