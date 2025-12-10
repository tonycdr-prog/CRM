import { useState, useEffect } from "react";
import { Check, Cloud, CloudOff, Loader2 } from "lucide-react";

interface AutoSaveIndicatorProps {
  lastSaved: number | null;
  isSaving?: boolean;
  className?: string;
}

export default function AutoSaveIndicator({
  lastSaved,
  isSaving = false,
  className = "",
}: AutoSaveIndicatorProps) {
  const [displayText, setDisplayText] = useState<string>("Not saved");

  useEffect(() => {
    if (!lastSaved) {
      setDisplayText("Not saved");
      return;
    }

    const updateText = () => {
      const now = Date.now();
      const diff = now - lastSaved;
      
      if (diff < 5000) {
        setDisplayText("Just saved");
      } else if (diff < 60000) {
        setDisplayText("Saved seconds ago");
      } else if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        setDisplayText(`Saved ${mins}m ago`);
      } else if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        setDisplayText(`Saved ${hours}h ago`);
      } else {
        const date = new Date(lastSaved);
        setDisplayText(`Saved ${date.toLocaleDateString()}`);
      }
    };

    updateText();
    const interval = setInterval(updateText, 10000);
    return () => clearInterval(interval);
  }, [lastSaved]);

  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  return (
    <div
      className={`flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}
      data-testid="auto-save-indicator"
    >
      {isSaving ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      ) : !isOnline ? (
        <>
          <CloudOff className="h-3 w-3 text-amber-500" />
          <span className="text-amber-500">Offline</span>
        </>
      ) : lastSaved ? (
        <>
          <Check className="h-3 w-3 text-green-500" />
          <span>{displayText}</span>
        </>
      ) : (
        <>
          <Cloud className="h-3 w-3" />
          <span>{displayText}</span>
        </>
      )}
    </div>
  );
}
