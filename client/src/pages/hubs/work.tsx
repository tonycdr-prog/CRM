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

export default function WorkHub() {
  const [, setLocation] = useLocation();

  return (
    <HubShell title="Work" description="Plan & manage jobs and visits.">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Tile
          title="Dashboard"
          blurb="Your at-a-glance view of what matters today."
          onOpen={() => setLocation(ROUTES.DASHBOARD)}
        />
        <Tile
          title="Jobs"
          blurb="Create, assign, and track work."
          onOpen={() => setLocation(ROUTES.JOBS)}
        />
        <Tile
          title="Schedule"
          blurb="Calendar view of planned work."
          onOpen={() => setLocation(ROUTES.SCHEDULE)}
        />
        <Tile
          title="Field Companion"
          blurb="Engineer field workflow."
          onOpen={() => setLocation(ROUTES.FIELD_COMPANION_HOME)}
        />
      </div>
    </HubShell>
  );
}
