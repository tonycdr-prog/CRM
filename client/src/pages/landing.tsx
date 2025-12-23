import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClosingCta } from "@/features/landing/closing-cta";
import { ConceptScroller } from "@/features/landing/concept-scroller";
import { FoundationSection } from "@/features/landing/foundation-section";
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
    <div className="landing-ios bg-gradient-to-b from-background via-background/95 to-background text-foreground">
      <header className="border-b border-border/60 bg-gradient-to-b from-background via-background to-background/90" id="hero">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14 md:flex-row md:items-center md:justify-between">
          <div className="space-y-5 md:max-w-xl">
            <Badge variant="outline" className="text-[11px] uppercase tracking-[0.3em]">
              Deucalion
            </Badge>
            <h1 className="font-serif text-4xl font-semibold leading-tight md:text-5xl">
              Evidence-first CRM for serious operational work
            </h1>
            <p className="text-muted-foreground">
              Deucalion is a modular CRM and operational platform that keeps jobs, sites, assets, people, and history in
              one calm, structured system. It does not automate decisions or hide the chain of evidence.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Not a black-box automation layer</li>
              <li>Not a generic CRM skin</li>
              <li>Built for traceable compliance work</li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <a href="#foundation">See the system</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#modules">View modules</a>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted/40 px-2 py-1">Jobs</span>
              <span className="rounded-full bg-muted/40 px-2 py-1">Sites</span>
              <span className="rounded-full bg-muted/40 px-2 py-1">Assets</span>
              <span className="rounded-full bg-muted/40 px-2 py-1">People</span>
              <span className="rounded-full bg-muted/40 px-2 py-1">History</span>
            </div>
          </div>

          <div className="w-full max-w-xl space-y-4 md:pt-6">
            <Card className="border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live snapshot</div>
              <div className="mt-3 space-y-2">
                <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
                  Job #1432 | North Hospital | SLA 14:00
                </div>
                <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
                  Evidence pack | 3 forms | meter linked
                </div>
                <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
                  Report revision 2 | awaiting reviewer
                </div>
              </div>
            </Card>
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-xs text-muted-foreground">
              Every surface stays grounded in the CRM truth layer. Modules extend it without obscuring it.
            </div>
          </div>
        </div>
      </header>

      <main className="space-y-12">
        <FoundationSection />
        <ConceptScroller />

        <section id="dashboards" className="border-b border-border/60 py-16">
          <div className="mx-auto max-w-6xl space-y-6 px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2 md:max-w-2xl">
                <Badge variant="outline" className="text-[11px] uppercase tracking-[0.3em]">
                  Composable dashboards
                </Badge>
                <h2 className="font-serif text-3xl font-semibold md:text-4xl">
                  Widgets that behave like real product surfaces
                </h2>
                <p className="text-muted-foreground">
                  Each widget is a live slice of the system, not a visual placeholder. Pop-out and expand without losing
                  context.
                </p>
              </div>
              <div className="rounded-full border border-border/60 bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
                Widget chrome mirrors the actual app
              </div>
            </div>
            <WidgetGrid />
          </div>
        </section>

        <section id="evidence" className="border-b border-border/60 py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2 md:max-w-2xl">
                <Badge variant="outline" className="text-[11px] uppercase tracking-[0.3em]">
                  Evidence spine
                </Badge>
                <h2 className="font-serif text-3xl font-semibold md:text-4xl">
                  Follow the Golden Thread end to end
                </h2>
                <p className="text-muted-foreground">
                  Jobs, forms, instruments, and reports stay connected. Every step is visible and reviewable.
                </p>
              </div>
              <div className="rounded-full border border-border/60 bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
                Motion stays restrained
              </div>
            </div>

            <div className="space-y-6" aria-label="Evidence spine steps">
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
                      Evidence spine
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
