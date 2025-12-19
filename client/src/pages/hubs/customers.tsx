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

export default function CustomersHub() {
  const [, setLocation] = useLocation();

  return (
    <HubShell title="Customers" description="Sites, access, and contracts.">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Tile
          title="Clients"
          blurb="Customer accounts and contacts."
          onOpen={() => setLocation(ROUTES.CLIENTS)}
        />
        <Tile
          title="Sites"
          blurb="Locations, systems, and access context."
          onOpen={() => setLocation(ROUTES.SITES)}
        />
        <Tile
          title="Contracts"
          blurb="Agreements, coverage, and SLAs."
          onOpen={() => setLocation(ROUTES.CONTRACTS)}
        />
      </div>
    </HubShell>
  );
}
