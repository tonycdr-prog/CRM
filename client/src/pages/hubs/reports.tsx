import { useLocation } from "wouter";
import HubShell from "./_HubShell";
import { ROUTES } from "@/lib/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Tile(props: { title: string; blurb: string; onOpen: () => void }) {
  return (
    <Card data-testid={`card-hub-${props.title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader>
        <CardTitle className="text-base">{props.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">{props.blurb}</div>
        <Button onClick={props.onOpen} data-testid={`button-open-${props.title.toLowerCase().replace(/\s+/g, "-")}`}>Open</Button>
      </CardContent>
    </Card>
  );
}

export default function ReportsHub() {
  const [, setLocation] = useLocation();

  return (
    <HubShell title="Reports" description="Performance, compliance, and outputs.">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Tile
          title="Reports"
          blurb="Generate and view outputs."
          onOpen={() => setLocation(ROUTES.REPORTS)}
        />
        <Tile
          title="Downloads"
          blurb="Exports and generated files."
          onOpen={() => setLocation(ROUTES.DOWNLOADS)}
        />
        <Tile
          title="Notifications"
          blurb="Updates and alerts."
          onOpen={() => setLocation(ROUTES.NOTIFICATIONS)}
        />
      </div>
    </HubShell>
  );
}
