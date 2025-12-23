import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ethosHighlights } from "./landing-data";

export function ClosingCta() {
  return (
    <section className="py-16" id="cta">
      <div className="mx-auto max-w-5xl px-6">
        <Card className="border-border/70 bg-gradient-to-r from-background via-white/3 to-background shadow-sm">
          <CardContent className="grid gap-8 px-6 py-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div className="space-y-4">
              <Badge variant="outline" className="text-[11px] uppercase tracking-[0.3em]">
                Ethos
              </Badge>
              <h2 className="font-serif text-3xl font-semibold">Calm systems for critical work</h2>
              <p className="text-muted-foreground">
                Deucalion keeps human judgment in the loop while the evidence spine maintains traceability across jobs,
                forms, defects, and reports.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg">Request a walkthrough</Button>
                <Button size="lg" variant="outline">Read the methodology</Button>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm">
              {ethosHighlights.map((highlight) => (
                <div key={highlight} className="rounded-lg border border-border/60 bg-background px-3 py-2">
                  {highlight}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
