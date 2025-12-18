import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface SyncStatusBarProps {
  pending: number;
  syncing: boolean;
  progress: { sent: number; remaining: number };
  onSyncNow: () => void;
}

export default function SyncStatusBar({
  pending,
  syncing,
  progress,
  onSyncNow,
}: SyncStatusBarProps) {
  if (pending <= 0 && !syncing) return null;

  const total = progress.sent + progress.remaining;
  const pct = total > 0 ? Math.round((progress.sent / total) * 100) : 0;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-background border-b p-2 flex items-center justify-between gap-2"
      data-testid="sync-status-bar"
    >
      <div className="text-sm">
        {syncing ? (
          <span data-testid="text-sync-progress">
            Syncing… {progress.sent}/{total} ({pct}%)
          </span>
        ) : (
          <span data-testid="text-sync-pending">
            Pending sync items: {pending}
          </span>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onSyncNow}
        disabled={syncing || !navigator.onLine}
        data-testid="button-sync-now"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
        Sync now
      </Button>
    </div>
  );
}
