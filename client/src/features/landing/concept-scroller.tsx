import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { conceptCards } from "./landing-data";

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

export function ConceptScroller() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    const container = scrollRef.current;
    if (!container) return;

    const maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll <= 0) return;

    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    const nextLeft = container.scrollLeft + event.deltaY;
    if (nextLeft <= 0 || nextLeft >= maxScroll) {
      return;
    }

    container.scrollLeft = nextLeft;
    event.preventDefault();
  };

  const scrollByAmount = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    const cardWidth = container.firstElementChild?.clientWidth ?? 320;
    const offset = direction === "left" ? -cardWidth : cardWidth;
    container.scrollBy({ left: offset, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  return (
    <section id="system" className="border-b border-border/60 bg-gradient-to-b from-background via-background/70 to-background py-16">
      <div className="mx-auto max-w-6xl space-y-8 px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="text-[11px] uppercase tracking-[0.3em]">
              System concepts
            </Badge>
            <h2 className="font-serif text-3xl font-semibold md:text-4xl">
              How the system stays explainable
            </h2>
            <p className="text-muted-foreground md:max-w-2xl">
              Each concept maps to a real screen: nothing is abstracted away or hidden behind automation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => scrollByAmount("left")}
              aria-controls="concept-scroll"
            >
              Scroll left
            </Button>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => scrollByAmount("right")}
              aria-controls="concept-scroll"
            >
              Scroll right
            </Button>
          </div>
        </div>

        <div className="relative">
          <div
            id="concept-scroll"
            ref={scrollRef}
            role="region"
            aria-label="System concepts"
            aria-describedby="concept-scroll-hint"
            onWheel={handleWheel}
            className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:thin] snap-x snap-mandatory"
          >
            {conceptCards.map((card) => (
              <Card
                key={card.id}
                className="min-w-[280px] max-w-[360px] flex-1 snap-start border-border/70 bg-gradient-to-b from-background via-background to-background/90 shadow-sm"
              >
                <CardHeader className="space-y-2 pb-3">
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    {card.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-border/60 bg-muted/40 px-2 py-1">
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {card.surfaceTitle}
                  </div>
                  <div className="space-y-2 text-sm">
                    {card.surfaceRows.map((row) => (
                      <div
                        key={row.label}
                        className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2"
                      >
                        <div className="text-[11px] text-muted-foreground">{row.label}</div>
                        <div className="font-medium">{row.value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent"
            aria-hidden
          />
        </div>
        <div id="concept-scroll-hint" className="text-xs text-muted-foreground">
          Scroll horizontally to view each concept, or use the buttons.
        </div>
      </div>
    </section>
  );
}
