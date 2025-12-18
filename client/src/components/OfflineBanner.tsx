import { useNetwork } from "@/hooks/useNetwork";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OfflineBannerProps {
  onSync?: () => void;
  syncing?: boolean;
}

export default function OfflineBanner({ onSync, syncing }: OfflineBannerProps) {
  const { online } = useNetwork();
  
  if (online) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-amber-500 text-amber-950 text-sm p-3 flex items-center justify-between z-50 safe-area-inset-bottom"
      data-testid="banner-offline"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span className="font-medium">Offline — changes saved locally</span>
      </div>
      {onSync && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onSync}
          disabled={syncing}
          className="bg-amber-600 hover:bg-amber-700 text-white border-0"
          data-testid="button-sync-now"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync now"}
        </Button>
      )}
    </div>
  );
}
