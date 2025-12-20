import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  getWidget,
  listWidgets,
  type DashboardLayoutItem,
  type DashboardWidgetDefinition,
} from "@shared/dashboard";
import { WidgetFrame } from "@/components/widgets/WidgetFrame";

const numberFromInput = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

type LayoutResponse = {
  layout: {
    id: string;
    name: string;
    items: DashboardLayoutItem[];
    isDefault: boolean;
    updatedAt: string | Date;
  } | null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const widgets = useMemo(() => listWidgets(), []);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>(widgets[0]?.widgetId ?? "");
  const [layoutId, setLayoutId] = useState<string | null>(null);
  const [layoutName, setLayoutName] = useState("My dashboard");
  const [items, setItems] = useState<DashboardLayoutItem[]>([]);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetch("/api/csrf-token", { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setCsrfToken(data?.csrfToken ?? null))
      .catch(() => setCsrfToken(null));
  }, [user?.id]);

  const layoutQuery = useQuery<LayoutResponse>({
    queryKey: ["dashboard-layout"],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch("/api/dashboard/layout", { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to load dashboard layout");
      }
      return res.json();
    },
  });

  useEffect(() => {
    if (layoutQuery.data?.layout) {
      setLayoutId(layoutQuery.data.layout.id);
      setLayoutName(layoutQuery.data.layout.name);
      setItems(layoutQuery.data.layout.items ?? []);
    } else {
      setLayoutId(null);
      setItems([]);
      setLayoutName("My dashboard");
    }
  }, [layoutQuery.data]);

  const saveLayout = useMutation({
    mutationFn: async () => {
      const method = layoutId ? "PUT" : "POST";
      const url = layoutId ? `/api/dashboard/layouts/${layoutId}` : "/api/dashboard/layouts";
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        body: JSON.stringify({ name: layoutName || "My dashboard", items }),
      });
      if (!res.ok) throw new Error("Failed to save layout");
      return res.json();
    },
    onSuccess: (data: LayoutResponse | undefined) => {
      if (data?.layout?.id) setLayoutId(data.layout.id);
      queryClient.invalidateQueries({ queryKey: ["dashboard-layout"] });
    },
  });

  const setDefault = useMutation({
    mutationFn: async () => {
      if (!layoutId) return;
      const res = await fetch(`/api/dashboard/layouts/${layoutId}/default`, {
        method: "POST",
        credentials: "include",
        headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
      });
      if (!res.ok) throw new Error("Failed to set default layout");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-layout"] }),
  });

  const addWidget = (widgetId: string) => {
    const widget = getWidget(widgetId) as DashboardWidgetDefinition<Record<string, unknown>> | undefined;
    if (!widget) return;
    setItems((prev) => [
      ...prev,
      {
        widgetId,
        params: widget.defaultParams,
        position: { x: 0, y: prev.length, w: 1, h: 1 },
      },
    ]);
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next.map((item, idx) => ({ ...item, position: { ...item.position, y: idx } }));
    });
  };

  const updateSize = (index: number, key: "w" | "h", value: number) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, position: { ...item.position, [key]: Math.max(1, value) } } : item,
      ),
    );
  };

  const updateParams = (index: number, params: Record<string, unknown>) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, params } : item)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const renderWidgetControls = (item: DashboardLayoutItem, index: number) => {
    const widget = getWidget(item.widgetId) as DashboardWidgetDefinition<any> | undefined;
    if (!widget) return null;
    if (widget.widgetId === "team-note") {
      return (
        <div className="space-y-2">
          <Label htmlFor={`note-${index}`}>Message</Label>
          <Textarea
            id={`note-${index}`}
            value={(item.params as any).message ?? ""}
            onChange={(e) =>
              updateParams(index, {
                ...item.params,
                message: e.target.value,
                audience: (item.params as any).audience ?? "all",
              })
            }
          />
          <div className="space-y-1">
            <Label>Audience</Label>
            <Select
              value={(item.params as any).audience ?? "all"}
              onValueChange={(audience) => updateParams(index, { ...item.params, audience })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="field">Field</SelectItem>
                <SelectItem value="office">Office</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    return (
      <p className="text-sm text-muted-foreground">
        {widget.description || "This widget has no configurable parameters."}
      </p>
    );
  };

  const emptyState = items.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Add widgets, arrange them, and save your personal layout.</p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Input
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
            placeholder="Dashboard name"
            className="md:w-64"
          />
          <div className="flex gap-2">
            <Button onClick={() => saveLayout.mutate()} disabled={saveLayout.isPending}>
              {saveLayout.isPending ? "Saving..." : "Save layout"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDefault.mutate()}
              disabled={!layoutId || setDefault.isPending}
            >
              {setDefault.isPending ? "Updating..." : "Set as default"}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="flex flex-col gap-4 border-b p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Widgets</h2>
            <p className="text-sm text-muted-foreground">Select a widget to add to your dashboard.</p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Select value={selectedWidgetId} onValueChange={setSelectedWidgetId}>
              <SelectTrigger className="md:w-64">
                <SelectValue placeholder="Choose a widget" />
              </SelectTrigger>
              <SelectContent>
                {widgets.map((widget) => (
                  <SelectItem value={widget.widgetId} key={widget.widgetId}>
                    {widget.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => addWidget(selectedWidgetId)} disabled={!selectedWidgetId}>
              Add widget
            </Button>
          </div>
        </div>
        <div className="p-4">
          {emptyState ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              <p>No widgets yet.</p>
              <p className="text-sm">Use the selector above to add your first widget.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((item, index) => {
                const widget = getWidget(item.widgetId) as DashboardWidgetDefinition<any> | undefined;
                return (
                  <WidgetFrame
                    key={`${item.widgetId}-${index}`}
                    widgetId={item.widgetId}
                    title={widget?.title ?? item.widgetId}
                    description={widget?.description}
                    supportsExpand={widget?.supportsExpand ?? true}
                    supportsNewTab={widget?.supportsNewTab ?? true}
                    params={item.params as Record<string, unknown>}
                    headerExtras={
                      widget ? (
                        <Badge variant={widget.refresh.mode === "interval" ? "default" : "secondary"}>
                          {widget.refresh.mode === "interval"
                            ? `Auto every ${Math.round((widget.refresh as any).intervalMs / 1000)}s`
                            : "Manual"}
                        </Badge>
                      ) : null
                    }
                  >
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span>Size</span>
                      <Input
                        type="number"
                        min={1}
                        className="w-16"
                        value={item.position.w}
                        onChange={(e) => updateSize(index, "w", numberFromInput(e.target.value, item.position.w))}
                      />
                      <span>×</span>
                      <Input
                        type="number"
                        min={1}
                        className="w-16"
                        value={item.position.h}
                        onChange={(e) => updateSize(index, "h", numberFromInput(e.target.value, item.position.h))}
                      />
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => moveItem(index, -1)} disabled={index === 0}>
                          Move up
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveItem(index, 1)}
                          disabled={index === items.length - 1}
                        >
                          Move down
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                    {renderWidgetControls(item, index)}
                  </WidgetFrame>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
