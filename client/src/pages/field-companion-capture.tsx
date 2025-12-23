import { useLocation } from "wouter";
import CompanionShell from "@/features/field-companion/companion-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildPath, ROUTES } from "@/lib/routes";
import { Camera, ClipboardCheck, Layers, Plus, RefreshCcw, Wrench } from "lucide-react";

const captureActions = [
  {
    title: "Assets",
    description: "Add, bulk-clone, and tag per location before running forms.",
    icon: Layers,
    cta: "Open job",
    route: (id: string) => buildPath(ROUTES.FIELD_COMPANION_JOB, { id }),
  },
  {
    title: "Forms",
    description: "Create submission packs from assets — repeat per asset automatically.",
    icon: ClipboardCheck,
    cta: "Start runner",
    route: (id: string) => buildPath(ROUTES.FIELD_COMPANION_JOB_FORMS, { id }),
  },
  {
    title: "Defects",
    description: "Capture evidence, severity, and trigger quote or back-office review.",
    icon: Wrench,
    cta: "Log defect",
    route: (id: string) => buildPath(ROUTES.FIELD_COMPANION_JOB, { id }),
  },
];

export default function FieldCompanionCapture() {
  const [, setLocation] = useLocation();
  const sampleJobId = "demo-job";

  return (
    <CompanionShell
      title="Capture"
      subtitle="Evidence-first, repeat-per-asset"
      status={<Badge variant="outline">Workspace</Badge>}
      topAction={
        <Button variant="secondary" size="sm" className="gap-2" onClick={() => setLocation(ROUTES.FIELD_COMPANION_SYNC)}>
          <RefreshCcw className="h-4 w-4" />
          Sync
        </Button>
      }
    >
      <div className="py-4 space-y-4">
        {captureActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card key={action.title} className="hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{action.title}</p>
                  <CardTitle className="text-lg leading-snug">{action.description}</CardTitle>
                </div>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Button onClick={() => setLocation(action.route(sampleJobId))} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {action.cta}
                </Button>
                <Badge variant="secondary">Golden Thread ready</Badge>
              </CardContent>
            </Card>
          );
        })}

        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <p className="text-xs uppercase text-muted-foreground">Attachments</p>
            <CardTitle className="text-lg">Capture on the move</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Use the Capture tab for photos, signatures, and quick notes without leaving the job.</p>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setLocation(ROUTES.FIELD_COMPANION_SYNC)}>
              <Camera className="h-4 w-4" />
              Review pending uploads
            </Button>
          </CardContent>
        </Card>
      </div>
    </CompanionShell>
  );
}
