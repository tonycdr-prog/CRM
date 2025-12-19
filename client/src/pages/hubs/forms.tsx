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

export default function FormsHub() {
  const [, setLocation] = useLocation();

  return (
    <HubShell title="Forms" description="Inspect, test, and record results.">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Tile
          title="Forms Builder"
          blurb="Build reusable forms used in Field Companion."
          onOpen={() => setLocation(ROUTES.ADMIN_TEMPLATES)}
        />
        <Tile
          title="Entities"
          blurb="Manage form building blocks and question rows."
          onOpen={() => setLocation(ROUTES.ADMIN_ENTITIES)}
        />
        <Tile
          title="Field Companion"
          blurb="Fill forms on-site and upload evidence."
          onOpen={() => setLocation(ROUTES.FIELD_COMPANION_HOME)}
        />
        <Tile
          title="Smoke Control Library"
          blurb="Generate templates from standards-based smoke control libraries."
          onOpen={() => setLocation(ROUTES.SMOKE_CONTROL_LIBRARY)}
        />
      </div>
    </HubShell>
  );
}
