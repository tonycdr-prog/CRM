import { type ComponentType, type ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface WorkspaceShellProps {
  title: string;
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
  breadcrumbs?: string[];
  meta?: { label: string; value: string }[];
  rail?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Standard workspace framing used across modules to reinforce the calm, modular layout pattern:
 * - Context header with breadcrumbs and meta anchors
 * - Primary workspace canvas for widgets/panels
 * - Optional secondary rail for related evidence, warnings, or actions
 *
 * This keeps CRM entities first-class while letting modules attach composable capabilities.
 */
export function WorkspaceShell({
  title,
  subtitle,
  icon: Icon,
  breadcrumbs,
  meta,
  rail,
  children,
  className,
}: WorkspaceShellProps) {
  return (
    <div className={cn("px-6 py-4 space-y-4", className)}>
      <header className="rounded-xl border bg-card/60 backdrop-blur-sm p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {Icon ? (
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Icon className="h-5 w-5" />
              </div>
            ) : null}
            <div className="space-y-1">
              {breadcrumbs?.length ? (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  {breadcrumbs.join(" / ")}
                </div>
              ) : null}
              <div className="text-2xl font-semibold leading-tight">{title}</div>
              {subtitle ? (
                <p className="text-sm text-muted-foreground leading-snug">{subtitle}</p>
              ) : null}
            </div>
          </div>
          {meta?.length ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {meta.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="rounded-lg border bg-background/80 px-3 py-2 shadow-sm"
                >
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </div>
                  <div className="font-medium leading-tight">{item.value}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">{children}</div>
        {rail ? <aside className="space-y-3">{rail}</aside> : null}
      </div>
    </div>
  );
}

interface WorkspaceSectionProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function WorkspaceSection({ title, description, actions, children }: WorkspaceSectionProps) {
  return (
    <section className="rounded-xl border bg-card/70 shadow-sm">
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold leading-tight">{title}</div>
          {description ? (
            <p className="text-sm text-muted-foreground leading-snug">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <Separator />
      <div className="p-4 space-y-3">{children}</div>
    </section>
  );
}
