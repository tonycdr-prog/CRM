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

export default function ManageHub() {
  const [, setLocation] = useLocation();

  return (
    <HubShell title="Manage" description="People, assets, and system settings.">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Tile
          title="Usage"
          blurb="Plan limits and current usage (admin/owner)."
          onOpen={() => setLocation(ROUTES.ADMIN_USAGE)}
        />
        <Tile
          title="Staff Directory"
          blurb="Team directory, roles, and access."
          onOpen={() => setLocation(ROUTES.STAFF_DIRECTORY)}
        />
        <Tile
          title="Settings"
          blurb="Account and organisation settings."
          onOpen={() => setLocation(ROUTES.SETTINGS)}
        />
        <Tile
          title="Finance"
          blurb="Quotes, invoices, expenses."
          onOpen={() => setLocation(ROUTES.FINANCE)}
        />
      </div>
    </HubShell>
  );
}
