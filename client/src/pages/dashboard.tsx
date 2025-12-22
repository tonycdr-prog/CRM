import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { WidgetFrame } from "@/components/widgets/WidgetFrame";
import { ScheduleUpcomingWidget } from "@/components/widgets/ScheduleUpcomingWidget";
import { ScheduleConflictsWidget } from "@/components/widgets/ScheduleConflictsWidget";
import { FinanceSummaryWidget } from "@/components/widgets/FinanceSummaryWidget";
import { ReportsQueueWidget } from "@/components/widgets/ReportsQueueWidget";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  generateLayoutItemId,
  getWidget,
  listWidgets,
  type DashboardLayoutItem,
  type DashboardWidgetDefinition,
  WIDGET_KEYS,
} from "@shared/dashboard";

const GRID_COLUMNS = 12;
const ROW_HEIGHT = 160;

type LayoutResponse = {
  layout: {
    id: string;
    name: string;
    items: DashboardLayoutItemWithId[];
    isDefault: boolean;
    updatedAt: string | Date;
  } | null;
};

type DashboardLayoutItemWithId = DashboardLayoutItem & { id: string };

function ensureIds(items: DashboardLayoutItem[]): DashboardLayoutItemWithId[] {
  return items.map((item) => ({ ...item, id: (item as DashboardLayoutItemWithId).id ?? generateLayoutItemId() }));
}

function normalizePositions(items: DashboardLayoutItemWithId[]): DashboardLayoutItemWithId[] {
  return items.map((item, index) => ({
    ...item,
    position: { ...item.position, x: 0, y: index },
  }));
}

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const widgets = useMemo(() => listWidgets(), []);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>(widgets[0]?.widgetId ?? "");
  const [layoutId, setLayoutId] = useState<string | null>(null);
  const [layoutName, setLayoutName] = useState("My dashboard");
  const [savedItems, setSavedItems] = useState<DashboardLayoutItemWithId[]>([]);
  const [draftItems, setDraftItems] = useState<DashboardLayoutItemWithId[]>([]);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetch("/api/csrf-token", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
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
      const withIds = ensureIds(layoutQuery.data.layout.items ?? []);
      setSavedItems(withIds);
      setDraftItems(withIds);
    } else {
      setLayoutId(null);
      setSavedItems([]);
      setDraftItems([]);
      setLayoutName("My dashboard");
    }
  }, [layoutQuery.data]);

  useEffect(() => {
    if (!editMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDraftItems(savedItems);
        setLayoutName(layoutQuery.data?.layout?.name ?? layoutName);
        setActiveId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editMode, savedItems, layoutName, layoutQuery.data?.layout?.name]);

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
        body: JSON.stringify({ name: layoutName || "My dashboard", items: normalizePositions(draftItems) }),
      });
      if (res.status === 401 || res.status === 403) {
        toast({
          title: "Not authorised",
          description: "Auth/CSRF missing — refresh page",
          variant: "destructive",
        });
      }
      if (!res.ok) throw new Error("Failed to save layout");
      return res.json();
    },
    onSuccess: (data: LayoutResponse | undefined) => {
      if (data?.layout?.id) setLayoutId(data.layout.id);
      const withIds = ensureIds(data?.layout?.items ?? draftItems);
      setSavedItems(withIds);
      setDraftItems(withIds);
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ["dashboard-layout"] });
      toast({ title: "Layout saved" });
    },
    onError: () => toast({ title: "Unable to save layout", variant: "destructive" }),
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
    const nextItem: DashboardLayoutItemWithId = {
      id: generateLayoutItemId(),
      widgetId,
      params: widget.defaultParams,
      position: { x: 0, y: draftItems.length, w: widget.preferredSize?.w ?? 1, h: widget.preferredSize?.h ?? 1 },
    };
    setDraftItems((prev) => [...prev, nextItem]);
  };

  const handleDragStart = (id: string, event: React.DragEvent<HTMLDivElement>) => {
    let nextActive = id;
    if (event.shiftKey) {
      setDraftItems((prev) => {
        const index = prev.findIndex((item) => item.id === id);
        if (index === -1) return prev;
        const duplicate = { ...prev[index], id: generateLayoutItemId() };
        const next = [...prev];
        next.splice(index + 1, 0, duplicate);
        nextActive = duplicate.id;
        return next;
      });
    }
    setActiveId(nextActive);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (id: string, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!activeId || activeId === id) return;
    setDraftItems((prev) => {
      const activeIndex = prev.findIndex((item) => item.id === activeId);
      const targetIndex = prev.findIndex((item) => item.id === id);
      if (activeIndex === -1 || targetIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(activeIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const handleDragEnd = () => {
    setDraftItems((prev) => normalizePositions(prev));
    setActiveId(null);
  };

  const startResize = (id: string, event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const item = draftItems.find((it) => it.id === id);
    if (!item) return;
    const startW = item.position.w;
    const startH = item.position.h;
    const colCount = window.innerWidth >= 768 ? GRID_COLUMNS : 1;
    const containerWidth = gridRef.current?.clientWidth ?? 1200;
    const colWidth = containerWidth / colCount;

    const onMove = (ev: PointerEvent) => {
      const deltaX = ev.clientX - startX;
      const deltaY = ev.clientY - startY;
      const nextW = Math.max(1, Math.round(startW + deltaX / colWidth));
      const nextH = Math.max(1, Math.round(startH + deltaY / ROW_HEIGHT));
      setDraftItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, position: { ...it.position, w: nextW, h: nextH } } : it,
        ),
      );
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleCancel = () => {
    setDraftItems(savedItems);
    setLayoutName(layoutQuery.data?.layout?.name ?? layoutName);
    setEditMode(false);
    setActiveId(null);
  };

  const hasChanges =
    layoutName !== (layoutQuery.data?.layout?.name ?? "My dashboard") ||
    JSON.stringify(draftItems) !== JSON.stringify(savedItems);

  const emptyState = draftItems.length === 0;

  const renderWidgetControls = (item: DashboardLayoutItemWithId, index: number) => {
    const widget = getWidget(item.widgetId) as DashboardWidgetDefinition<any> | undefined;
    if (!widget) return null;
    if (widget.widgetId === WIDGET_KEYS.SCHEDULE_UPCOMING) {
      const parsedDays = Number((item.params as any).days ?? widget.defaultParams.days ?? 7);
      const safeDays = Number.isFinite(parsedDays) ? Math.max(1, Math.min(30, parsedDays)) : 7;
      return <ScheduleUpcomingWidget days={safeDays} />;
    }
    if (widget.widgetId === WIDGET_KEYS.SCHEDULE_TODAY) {
      const limit = Number((item.params as any).limit ?? 5);
      return <ScheduleUpcomingWidget days={1} limit={Math.max(1, Math.min(10, limit))} title="Today" />;
    }
    if (widget.widgetId === WIDGET_KEYS.SCHEDULE_CONFLICTS) {
      const days = Number((item.params as any).days ?? widget.defaultParams.days ?? 7);
      return <ScheduleConflictsWidget days={Math.max(1, Math.min(30, days))} />;
    }
    if (widget.widgetId === WIDGET_KEYS.FINANCE_SUMMARY) {
      const period = Number((item.params as any).periodDays ?? widget.defaultParams.periodDays ?? 30);
      return <FinanceSummaryWidget periodDays={Math.max(7, Math.min(90, period))} />;
    }
    if (widget.widgetId === WIDGET_KEYS.REPORTS_QUEUE) {
      const limit = Number((item.params as any).limit ?? widget.defaultParams.limit ?? 5);
      return <ReportsQueueWidget limit={Math.max(3, Math.min(20, limit))} />;
    }
    if (widget.widgetId === "team-note") {
      return (
        <div className="space-y-2">
          <Label htmlFor={`note-${index}`}>Message</Label>
          <Textarea
            id={`note-${index}`}
            value={(item.params as any).message ?? ""}
            onChange={(e) =>
              setDraftItems((prev) =>
                prev.map((it) =>
                  it.id === item.id
                    ? {
                        ...it,
                        params: {
                          ...it.params,
                          message: e.target.value,
                          audience: (it.params as any).audience ?? "all",
                        },
                      }
                    : it,
                ),
              )
            }
          />
          <div className="space-y-1">
            <Label>Audience</Label>
            <Select
              value={(item.params as any).audience ?? "all"}
              onValueChange={(audience) =>
                setDraftItems((prev) =>
                  prev.map((it) => (it.id === item.id ? { ...it, params: { ...it.params, audience } } : it)),
                )
              }
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

  const savingState = saveLayout.isPending ? "Saving…" : hasChanges && editMode ? "Unsaved changes" : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Add widgets, arrange them, and save your personal layout.</p>
          {savingState ? <p className="text-sm text-muted-foreground">{savingState}</p> : null}
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Input
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
            placeholder="Dashboard name"
            className="md:w-64"
            disabled={!editMode}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant={editMode ? "default" : "outline"} onClick={() => setEditMode((prev) => !prev)}>
              {editMode ? "Exit edit" : "Edit layout"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={!editMode || !hasChanges}
              title="Esc also cancels"
            >
              Cancel
            </Button>
            <Button onClick={() => saveLayout.mutate()} disabled={!editMode || !hasChanges || saveLayout.isPending}>
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
            <div
              ref={gridRef}
              className="grid grid-cols-1 gap-4 md:grid-cols-12"
              style={{ gridAutoRows: `${ROW_HEIGHT}px` }}
            >
              {draftItems.map((item, index) => {
                const widget = getWidget(item.widgetId) as DashboardWidgetDefinition<any> | undefined;
                const widthSpan = Math.max(1, Math.min(item.position.w, GRID_COLUMNS));
                const heightSpan = Math.max(1, item.position.h);
                return (
                  <div
                    key={item.id}
                    draggable={editMode}
                    onDragStart={(e) => handleDragStart(item.id, e)}
                    onDragOver={(e) => handleDragOver(item.id, e)}
                    onDragEnd={handleDragEnd}
                    className="relative"
                    style={{ gridColumn: `span ${widthSpan}`, gridRowEnd: `span ${heightSpan}` }}
                  >
                    {editMode ? (
                      <div className="absolute inset-0 rounded-lg border border-dashed border-primary/40" aria-hidden />
                    ) : null}
                    {editMode ? (
                      <div className="absolute left-2 top-2 z-10 rounded bg-primary/10 px-2 py-1 text-xs text-primary">
                        Drag to reorder (Shift + drag duplicates)
                      </div>
                    ) : null}
                    {editMode ? (
                      <div
                        onPointerDown={(e) => startResize(item.id, e)}
                        className="absolute bottom-1 right-1 z-20 h-4 w-4 cursor-se-resize rounded border border-primary bg-background"
                        title="Drag to resize"
                      />
                    ) : null}
                    <WidgetFrame
                      widgetId={item.widgetId}
                      title={widget?.title ?? item.widgetId}
                      description={widget?.description}
                      supportsExpand={widget?.supportsExpand ?? true}
                      supportsNewTab={widget?.supportsNewTab ?? true}
                      supportsSendToScreen={widget?.supportsSendToScreen ?? false}
                      supportsRefreshAction={widget?.supportsRefreshAction ?? false}
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
                      onRefresh={() => queryClient.invalidateQueries()}
                    >
                      {renderWidgetControls(item, index)}
                    </WidgetFrame>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
