import CompanionShell from "@/features/field-companion/companion-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, HelpCircle, Shield, Monitor } from "lucide-react";

const items = [
  { title: "Settings", description: "Notification tones, offline media size", icon: Settings },
  { title: "Help", description: "Methodology and playbooks", icon: HelpCircle },
  { title: "Audit", description: "Activity and auth banners", icon: Shield },
  { title: "Send to screen", description: "Pop-out workspace to wallboard", icon: Monitor },
];

export default function FieldCompanionMore() {
  return (
    <CompanionShell title="More" subtitle="Calm controls" status={<Badge variant="outline">Trusted</Badge>}>
      <div className="py-4 space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="hover-elevate border-border/70 bg-card/70 shadow-sm">
              <CardHeader className="flex items-start justify-between pb-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{item.title}</p>
                  <CardTitle className="text-lg leading-snug">{item.description}</CardTitle>
                </div>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <Button variant="outline" size="sm">Open</Button>
                <Badge variant="secondary">Calm defaults</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </CompanionShell>
  );
}
