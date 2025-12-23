import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { foundationItems } from "./landing-data";

export function FoundationSection() {
  return (
    <section id="foundation" className="border-b border-border/60 py-16">
      <div className="mx-auto max-w-6xl space-y-8 px-6">
        <div className="space-y-3">
          <Badge variant="outline" className="text-[11px] uppercase tracking-[0.3em]">
            CRM foundation
          </Badge>
          <h2 className="font-serif text-3xl font-semibold md:text-4xl">
            The truth layer comes first
          </h2>
          <p className="text-muted-foreground md:max-w-3xl">
            Deucalion starts with the core CRM record: jobs, sites, assets, people, and history. Modules attach to that
            foundation instead of replacing it.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {foundationItems.map((item) => (
            <Card key={item.title} className="border-border/70 bg-gradient-to-b from-background via-background to-background/90">
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 px-3 py-2">
                  {item.example}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
