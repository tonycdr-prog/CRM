import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { workspaceDemos } from "./landing-data";

export function WorkspacesShowcase() {
  return (
    <section className="border-b border-border/60 bg-gradient-to-b from-background via-background/60 to-background py-16">
      <div className="mx-auto max-w-6xl space-y-4 px-6 text-center">
        <Badge variant="outline" className="text-[11px] uppercase tracking-[0.3em]">
          Composable workspaces
        </Badge>
        <h2 className="font-serif text-3xl font-semibold md:text-4xl">Build calm, modular dashboards</h2>
        <p className="text-muted-foreground">
          Widgets pop out, expand, and send-to-screen while keeping the Golden Thread visible.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl gap-5 px-6 lg:grid-cols-2">
        {workspaceDemos.map((workspace) => (
          <Card
            key={workspace.name}
            className="border-border/70 bg-gradient-to-br from-background via-white/5 to-background shadow-sm"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{workspace.name}</CardTitle>
                <Badge variant="secondary" className="text-[11px]">
                  Read-only demo
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{workspace.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {workspace.widgets.map((widget) => (
                  <div
                    key={widget}
                    className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                    <div className="font-medium">{widget}</div>
                    <p className="text-[11px] text-muted-foreground">Composable widget chrome</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                {workspace.actions.join(" • ")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
