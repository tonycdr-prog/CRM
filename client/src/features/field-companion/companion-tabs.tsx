import { useMemo } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { Radio, ClipboardList, UploadCloud, MoreHorizontal, Home } from "lucide-react";

const tabs = [
  { key: "today", label: "Today", icon: Home, path: ROUTES.FIELD_COMPANION_HOME },
  { key: "jobs", label: "Jobs", icon: Radio, path: ROUTES.FIELD_COMPANION_JOBS },
  { key: "capture", label: "Capture", icon: ClipboardList, path: ROUTES.FIELD_COMPANION_CAPTURE },
  { key: "sync", label: "Sync", icon: UploadCloud, path: ROUTES.FIELD_COMPANION_SYNC },
  { key: "more", label: "More", icon: MoreHorizontal, path: ROUTES.FIELD_COMPANION_MORE },
];

export default function CompanionTabs() {
  const [location, setLocation] = useLocation();

  const active = useMemo(() => {
    const current = tabs.find((tab) => location.startsWith(tab.path));
    return current?.key ?? "today";
  }, [location]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5 text-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setLocation(tab.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className="font-medium">{tab.label}</span>
              <span
                className={cn("h-1 w-8 rounded-full", isActive ? "bg-primary" : "bg-transparent")}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
