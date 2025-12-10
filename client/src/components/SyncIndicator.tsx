import { Cloud, CloudOff, RefreshCw, AlertCircle, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface SyncIndicatorProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  lastSyncTime: number | null;
  syncError: string | null;
  onSync?: () => void;
  className?: string;
}

export function SyncIndicator({
  isOnline,
  isSyncing,
  pendingChanges,
  lastSyncTime,
  syncError,
  onSync,
  className,
}: SyncIndicatorProps) {
  const getStatusIcon = () => {
    if (isSyncing) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    if (syncError) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    if (!isOnline) {
      return <CloudOff className="h-4 w-4 text-orange-500" />;
    }
    if (pendingChanges > 0) {
      return <Cloud className="h-4 w-4 text-blue-500" />;
    }
    return <Check className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (isSyncing) return "Syncing...";
    if (syncError) return "Sync failed";
    if (!isOnline) return "Offline";
    if (pendingChanges > 0) return `${pendingChanges} pending`;
    return "Synced";
  };

  const getTooltipText = () => {
    if (syncError) return `Error: ${syncError}`;
    if (!isOnline) return "You're offline. Changes will sync when you reconnect.";
    if (pendingChanges > 0) return `${pendingChanges} changes waiting to sync`;
    if (lastSyncTime) return `Last synced: ${format(new Date(lastSyncTime), "MMM d, h:mm a")}`;
    return "All changes saved";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSync}
          disabled={isSyncing || !isOnline}
          className={cn("gap-2", className)}
          data-testid="button-sync-indicator"
        >
          {getStatusIcon()}
          <span className="text-xs hidden sm:inline">{getStatusText()}</span>
          {pendingChanges > 0 && isOnline && !isSyncing && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {pendingChanges}
            </Badge>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{getTooltipText()}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default SyncIndicator;
