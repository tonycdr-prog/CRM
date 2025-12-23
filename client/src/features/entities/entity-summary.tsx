import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type EntitySummaryItem = {
  label: string;
  value: string;
};

type EntitySummaryProps = {
  title: string;
  subtitle?: string;
  status?: string;
  items: EntitySummaryItem[];
};

export function EntitySummary({ title, subtitle, status, items }: EntitySummaryProps) {
  return (
    <Card className="border-border/70 bg-card/70 shadow-sm">
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          {status ? (
            <Badge variant="outline" className="text-[11px] uppercase tracking-[0.2em]">
              {status}
            </Badge>
          ) : null}
        </div>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </CardHeader>
      <CardContent className="grid gap-2 text-sm md:grid-cols-2">
        {items.map((item) => (
          <div key={`${item.label}-${item.value}`} className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {item.label}
            </div>
            <div className="font-medium text-foreground">{item.value}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
