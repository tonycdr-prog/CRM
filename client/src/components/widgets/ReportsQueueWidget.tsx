import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type ReportListItem = {
  id: string;
  reportType?: string;
  status?: string;
  createdAt?: string;
};

export function ReportsQueueWidget({ limit = 5 }: { limit?: number }) {
  const query = useQuery<ReportListItem[]>({
    queryKey: ["reports-queue", limit],
    queryFn: async () => {
      const res = await fetch("/api/reports", { credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        toast({
          title: "Auth or session missing — refresh page",
          description: "Preview mode needs a refresh to continue.",
          variant: "destructive",
        });
      }
      if (!res.ok) {
        throw new Error("Unable to load reports");
      }
      return res.json();
    },
  });

  const items = query.data ?? [];

  return (
    <div className="space-y-3">
      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading reports…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reports yet.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {items.slice(0, limit).map((report) => (
            <li key={report.id} className="flex items-center justify-between gap-2 rounded border bg-background px-2 py-1">
              <span className="truncate">{report.reportType ?? "Report"}</span>
              <span className="text-xs text-muted-foreground">{report.status ?? "draft"}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-2">
        <Button variant="outline" size="sm" onClick={() => (window.location.href = "/reports")}>Open reports</Button>
      </div>
    </div>
  );
}
