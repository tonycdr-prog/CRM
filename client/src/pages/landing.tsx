import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClosingCta } from "@/features/landing/closing-cta";
import { ModulesShowcase } from "@/features/landing/modules-showcase";
import { StorylineDemo } from "@/features/landing/storyline-demo";
import { WidgetGrid } from "@/features/landing/widget-grid";
import { WorkspacesShowcase } from "@/features/landing/workspaces-showcase";
import { storySteps } from "@/features/landing/landing-data";

export default function Landing() {
  const [activeStep, setActiveStep] = useState<string | null>(storySteps[0]?.id ?? null);

  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLDivElement>("[data-story-step]"));
    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveStep(entry.target.getAttribute("data-story-step"));
          }
        });
      },
      { threshold: 0.4, rootMargin: "-25% 0px -25% 0px" },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-gradient-to-b from-background via-background/90 to-background text-foreground">
      <header className="border-b border-border/60 bg-gradient-to-b from-background via-background to-background/90" id="hero">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4 md:max-w-xl">
            <Badge variant="outline" className="text-[11px] uppercase tracking-[0.3em]">
              Deucalion — calm operational CRM
            </Badge>
            <h1 className="font-serif text-4xl font-semibold leading-tight md:text-5xl">
              Golden Thread operations without marketing noise
            </h1>
            <p className="text-muted-foreground">
              Deucalion keeps jobs, sites, assets, forms, and reports in one evidence-first timeline. Built with macOS
              Sequoia / Tahoe calmness: soft depth, restrained color, and high contrast clarity.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <a href="#story">Explore how it works</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#modules">View modules</a>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted/40 px-2 py-1">Widget grid demo</span>
              <span className="rounded-full bg-muted/40 px-2 py-1">Evidence-first</span>
              <span className="rounded-full bg-muted/40 px-2 py-1">Human judgment in the loop</span>
            </div>
          </div>

          <div className="w-full max-w-3xl space-y-3 md:pt-6">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
              Above-the-fold shows the actual product widgets — Jobs, Sites, Assets, Schedule, Forms, Defects, Reports —
              rearranging subtly to signal composability.
            </div>
            <WidgetGrid />
          </div>
        </div>
      </header>

      <main className="space-y-12">
        <section id="story" className="border-b border-border/60 py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2 md:max-w-2xl">
                <Badge variant="outline" className="text-[11px] uppercase tracking-[0.3em]">
                  Golden Thread
                </Badge>
                <h2 className="font-serif text-3xl font-semibold md:text-4xl">Scroll the evidence chain</h2>
                <p className="text-muted-foreground">
                  Job → Form → Instrument → Report → Defect → Quote → Remedial Job. Light motion, no signup needed,
                  human judgment intact.
                </p>
              </div>
              <div className="rounded-full border border-border/60 bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
                Calm mode • prefers-reduced-motion aware
              </div>
            </div>

            <div className="space-y-6" aria-label="Golden Thread steps">
              {storySteps.map((step) => (
                <Card
                  key={step.id}
                  data-story-step={step.id}
                  className={`border ${activeStep === step.id ? "border-primary/60 shadow-md" : "border-border/70"}`}
                >
                  <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{step.title}</div>
                      <p className="text-base font-semibold">{step.description}</p>
                      <p className="text-sm text-muted-foreground">{step.inlineNote}</p>
                    </div>
                    <Badge variant="secondary" className="self-start md:self-auto">
                      Golden Thread
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>

            <StorylineDemo activeStep={activeStep} />
          </div>
        </section>

        <ModulesShowcase />
        <WorkspacesShowcase />
        <ClosingCta />
      </main>
    </div>
  );
}
