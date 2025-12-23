import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { widgetSnapshots } from "./landing-data";

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefers(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => setPrefers(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefers;
}

export function WidgetGrid() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mountTimer = setTimeout(() => setMounted(true), prefersReducedMotion ? 0 : 80);
    return () => clearTimeout(mountTimer);
  }, [prefersReducedMotion]);

  return (
    <div className="grid gap-3 md:grid-cols-4" aria-label="Landing widgets demo">
      {widgetSnapshots.map((snapshot, index) => (
        <Card
          key={snapshot.key}
          className={`relative overflow-hidden border-border/70 bg-gradient-to-b from-background via-background to-background/90 shadow-sm transition duration-700 ease-out ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: mounted ? `${index * 40}ms` : undefined }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/4 via-white/0 to-white/4" aria-hidden />
          <div className="flex items-center justify-between px-4 pt-3 text-xs text-muted-foreground">
            <span>{snapshot.category}</span>
            <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]">
              demo
            </span>
          </div>
          <div className="space-y-2 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{snapshot.title}</div>
              <Badge variant="outline" className="text-[11px]">
                {snapshot.summary}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{snapshot.detail}</p>
            <div className="space-y-1 text-[11px] text-muted-foreground">
              {snapshot.items.map((item) => (
                <div key={item} className="rounded-md border border-border/70 bg-muted/40 px-2 py-1">
                  {item}
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
              {snapshot.footer}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
