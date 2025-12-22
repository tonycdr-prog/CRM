import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

type FinanceSnapshot = {
  revenue?: number;
  outstandingInvoices?: number;
  expenses?: number;
  margin?: number;
};

export function FinanceSummaryWidget({ periodDays = 30 }: { periodDays?: number }) {
  const query = useQuery<FinanceSnapshot>({
    queryKey: ["finance-summary", periodDays],
    queryFn: async () => {
      const res = await api.get(`/api/finance/summary?periodDays=${periodDays}`);
      if (res.status === 401 || res.status === 403) {
        toast({
          title: "Auth or session missing — refresh page",
          description: "Preview mode needs a refresh to continue.",
          variant: "destructive",
        });
      }
      if (!res.ok) {
        throw new Error("Unable to load finance summary");
      }
      return res.json();
    },
  });

  const fallback = useMemo(
    () => ({ revenue: 24000, outstandingInvoices: 8200, expenses: 6100, margin: 0.32 }),
    [],
  );

  const data = query.data ?? fallback;
  const marginPercent = Math.round((data.margin ?? 0) * 100);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Revenue" value={currency(data.revenue)} hint={`Last ${periodDays} days`} />
        <Metric label="Outstanding" value={currency(data.outstandingInvoices)} hint="Unpaid invoices" />
        <Metric label="Expenses" value={currency(data.expenses)} hint="Period to date" />
        <div className="rounded border bg-muted/40 p-3">
          <div className="text-sm font-medium">Margin</div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{marginPercent}%</span>
            <span className="text-xs">target 40%</span>
          </div>
          <Progress value={Math.min(100, marginPercent)} className="mt-2" />
        </div>
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Collections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Invoices 30/60/90</span>
            <span className="text-muted-foreground">${(data.outstandingInvoices ?? 0).toLocaleString()}</span>
          </div>
          <div className="text-xs text-muted-foreground">Track aged debt and prioritise outreach.</div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded border bg-background p-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

function currency(value?: number) {
  if (value === undefined) return "—";
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
