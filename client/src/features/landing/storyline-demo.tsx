import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { storySteps } from "./landing-data";

function Connector({ active }: { active: boolean }) {
  return (
    <div
      className={`h-10 w-px rounded-full transition-all duration-500 ${
        active ? "bg-primary/60" : "bg-border"
      }`}
      aria-hidden
    />
  );
}

export function StorylineDemo({ activeStep }: { activeStep: string | null }) {
  const activeIndex = useMemo(() => storySteps.findIndex((step) => step.id === activeStep), [activeStep]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-border/80 bg-gradient-to-b from-background via-background/95 to-background shadow-lg">
        <div className="flex items-center justify-between border-b px-5 py-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          </div>
          <div>Golden Thread preview</div>
          <Badge variant="outline" className="text-[10px] uppercase tracking-[0.25em]">
            Calm mode
          </Badge>
        </div>
        <div className="p-6">
          <div className="space-y-5">
            {storySteps.map((step, index) => (
              <div key={step.id} className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="uppercase tracking-[0.2em]">{step.title}</span>
                  <span className="rounded-full bg-background px-2 py-1 text-[10px]">Step {index + 1}</span>
                </div>
                <div className="mt-2 text-sm font-medium">{step.description}</div>
                <p className="mt-2 text-xs text-muted-foreground">{step.inlineNote}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-5" aria-label="Golden Thread storyline">
        {storySteps.map((step, index) => {
          const isActive = activeIndex === -1 ? index === 0 : index <= activeIndex;
          return (
            <div key={step.id} className="flex items-start gap-4">
              <div className="flex flex-col items-center pt-1">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition ${
                    isActive ? "border-primary/60 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                {index < storySteps.length - 1 && <Connector active={isActive} />}
              </div>
              <Card className={`flex-1 border ${isActive ? "border-primary/50" : "border-border/70"}`}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-base font-semibold">{step.title}</div>
                    <Badge variant="secondary" className="text-[11px]">
                      Golden Thread
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    {step.inlineNote}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
