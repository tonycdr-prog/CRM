import {
  dashboardLayoutPayloadSchema,
  generateLayoutItemId,
  type DashboardLayoutItem,
  type DashboardLayoutPayload,
  getWidget,
} from "./dashboard";

export type SidebarWidgetMapping = {
  route: string;
  widgetId: string;
  defaultParams?: Record<string, unknown>;
  defaultSize?: { w: number; h: number };
};

export const SIDEBAR_WIDGET_MAPPINGS: SidebarWidgetMapping[] = [
  {
    route: "/dashboard",
    widgetId: "health-status",
    defaultParams: { label: "Dashboard health" },
    defaultSize: { w: 2, h: 1 },
  },
  {
    route: "/hub/work",
    widgetId: "navigation-shortcut",
    defaultParams: { label: "Work hub", route: "/hub/work" },
    defaultSize: { w: 2, h: 1 },
  },
  {
    route: "/hub/forms",
    widgetId: "navigation-shortcut",
    defaultParams: { label: "Forms hub", route: "/hub/forms" },
    defaultSize: { w: 2, h: 1 },
  },
  {
    route: "/hub/customers",
    widgetId: "navigation-shortcut",
    defaultParams: { label: "Customers hub", route: "/hub/customers" },
    defaultSize: { w: 2, h: 1 },
  },
  {
    route: "/hub/reports",
    widgetId: "navigation-shortcut",
    defaultParams: { label: "Reports hub", route: "/hub/reports" },
    defaultSize: { w: 2, h: 1 },
  },
  {
    route: "/hub/manage",
    widgetId: "navigation-shortcut",
    defaultParams: { label: "Manage hub", route: "/hub/manage" },
    defaultSize: { w: 2, h: 1 },
  },
];

export function mapSidebarRouteToWidget(route: string) {
  const mapping = SIDEBAR_WIDGET_MAPPINGS.find((entry) => entry.route === route);
  if (!mapping) return null;
  const widget = getWidget(mapping.widgetId);
  if (!widget) return null;
  const params = widget.paramsSchema.parse({
    ...widget.defaultParams,
    ...(mapping.defaultParams ?? {}),
  });

  return {
    widgetId: widget.widgetId,
    params,
    defaultSize: mapping.defaultSize,
  } as const;
}

export function buildLayoutWithSidebarWidget(
  route: string,
  layout?: { name?: string; items?: DashboardLayoutItem[] | null },
): DashboardLayoutPayload | null {
  const resolved = mapSidebarRouteToWidget(route);
  if (!resolved) return null;

  const existingItems = layout?.items ?? [];
  const nextItem: DashboardLayoutItem = {
    id: generateLayoutItemId(),
    widgetId: resolved.widgetId,
    params: resolved.params,
    position: {
      x: 0,
      y: existingItems.length,
      w: resolved.defaultSize?.w ?? 1,
      h: resolved.defaultSize?.h ?? 1,
    },
  };

  const payload = {
    name: layout?.name || "My dashboard",
    items: [...existingItems, nextItem],
  } satisfies DashboardLayoutPayload;

  return dashboardLayoutPayloadSchema.parse(payload);
}
