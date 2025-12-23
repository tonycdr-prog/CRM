import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import CompanionTabs from "./companion-tabs";

interface CompanionShellProps {
  title: string;
  subtitle?: string;
  status?: ReactNode;
  topAction?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Shared mobile-first shell for the companion app.
 * Keeps a calm header + bottom navigation while letting each screen supply its own body.
 */
export function CompanionShell({
  title,
  subtitle,
  status,
  topAction,
  children,
  className,
}: CompanionShellProps) {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <div className="sticky top-0 z-10 bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b">
        <div className="px-4 py-3 flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Field Companion</p>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold leading-tight">{title}</h1>
              {status}
            </div>
            {subtitle && <p className="text-sm text-muted-foreground leading-tight">{subtitle}</p>}
          </div>
          {topAction}
        </div>
        <Separator />
      </div>

      <div
        className={cn("flex-1 overflow-y-auto px-4 pb-24", className)}
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        {children}
      </div>
      <CompanionTabs />
    </div>
  );
}

export default CompanionShell;
