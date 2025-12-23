import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { moduleCards } from "./landing-data";

export function ModulesShowcase() {
  return (
    <section id="modules" className="border-b border-border/60 py-16">
      <div className="mx-auto max-w-6xl space-y-6 px-6 text-center">
        <Badge variant="outline" className="text-[11px] uppercase tracking-[0.3em]">
          Modules
        </Badge>
        <div className="space-y-2">
          <h2 className="font-serif text-3xl font-semibold md:text-4xl">Industry-specific modules</h2>
          <p className="text-muted-foreground">
            Pre-filled, read-only cards show how each domain keeps evidence and outcomes aligned.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl gap-4 px-6 md:grid-cols-2 lg:grid-cols-3">
        {moduleCards.map((module) => (
          <Card key={module.name} className="border-border/70 bg-gradient-to-b from-background via-background to-background/90">
            <CardHeader className="space-y-1 pb-3">
              <CardTitle className="text-lg">{module.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{module.description}</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 px-3 py-2">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Evidence produced</div>
                <div className="mt-1 font-medium">{module.evidence}</div>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Outcome</div>
                <div className="mt-1 font-medium">{module.outcome}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
