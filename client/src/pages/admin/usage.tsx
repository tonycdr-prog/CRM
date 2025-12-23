import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type UsageDTO = {
  plan: "free" | "pro" | "enterprise";
  limits: {
    jobsPerMonth: number;
    maxTemplates: number;
    maxEntities: number;
    maxStorageBytes: number;
    pdfEnabled: boolean;
  };
  usage: {
    jobsThisMonth: number;
    jobsMonthKey: string;
    totalTemplates: number;
    totalEntities: number;
    storageBytes: number;
    updatedAt: string;
  };
};

function fmtBytes(bytes: number) {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function pct(used: number, limit: number) {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((used / limit) * 100)));
}

export default function AdminUsagePage() {
  const [data, setData] = useState<UsageDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("GET", "/api/admin/usage");
      const json = (await res.json()) as UsageDTO;
      setData(json);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load usage");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-6 text-destructive">{error}</div>;
  if (!data) return <div className="p-6 text-muted-foreground">No data.</div>;

  const jobsP = pct(data.usage.jobsThisMonth, data.limits.jobsPerMonth);
  const tplP = pct(data.usage.totalTemplates, data.limits.maxTemplates);
  const entP = pct(data.usage.totalEntities, data.limits.maxEntities);
  const storP = pct(data.usage.storageBytes, data.limits.maxStorageBytes);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold">Usage</h1>
        <Button variant="outline" onClick={load} disabled={loading} data-testid="button-refresh">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 flex-wrap">
            Plan <Badge variant="secondary">{data.plan.toUpperCase()}</Badge>
            {data.limits.pdfEnabled ? (
              <Badge>PDF Enabled</Badge>
            ) : (
              <Badge variant="outline">PDF Disabled</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Month key: {data.usage.jobsMonthKey} &bull; Updated: {new Date(data.usage.updatedAt).toLocaleString()}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Jobs this month</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              {data.usage.jobsThisMonth} / {data.limits.jobsPerMonth} ({jobsP}%)
            </div>
            <div className="h-2 w-full rounded bg-muted overflow-hidden">
              <div className="h-2 bg-primary" style={{ width: `${jobsP}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Storage</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              {fmtBytes(data.usage.storageBytes)} / {fmtBytes(data.limits.maxStorageBytes)} ({storP}%)
            </div>
            <div className="h-2 w-full rounded bg-muted overflow-hidden">
              <div className="h-2 bg-primary" style={{ width: `${storP}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Templates</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              {data.usage.totalTemplates} / {data.limits.maxTemplates} ({tplP}%)
            </div>
            <div className="h-2 w-full rounded bg-muted overflow-hidden">
              <div className="h-2 bg-primary" style={{ width: `${tplP}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Entities</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              {data.usage.totalEntities} / {data.limits.maxEntities} ({entP}%)
            </div>
            <div className="h-2 w-full rounded bg-muted overflow-hidden">
              <div className="h-2 bg-primary" style={{ width: `${entP}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Export</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Download a JSON export of this organisation's data.
          </div>
          <Button
            variant="outline"
            onClick={() => window.open("/api/admin/export", "_blank")}
            data-testid="button-export"
          >
            <Download className="w-4 h-4 mr-2" />
            Download export
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
