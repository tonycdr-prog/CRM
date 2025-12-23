import { z } from "zod";

export const WIDGET_KEYS = {
  HEALTH_STATUS: "health-status",
  TEAM_NOTE: "team-note",
  NAVIGATION_SHORTCUT: "navigation-shortcut",
  SCHEDULE_UPCOMING: "schedule.upcoming",
  SCHEDULE_TODAY: "schedule.today",
  SCHEDULE_CONFLICTS: "schedule.conflicts",
  FINANCE_SUMMARY: "finance.summary",
  REPORTS_QUEUE: "reports.queue",
} as const;

export type WidgetKey = typeof WIDGET_KEYS[keyof typeof WIDGET_KEYS];

export type WidgetRefreshPolicy =
  | { mode: "manual" }
  | { mode: "interval"; intervalMs: number };

export type WidgetPermissionContext = {
  userId: string;
  roles?: string[];
};

export interface DashboardWidgetDefinition<Params extends Record<string, unknown> = Record<string, unknown>> {
  widgetId: string;
  title: string;
  description?: string;
  paramsSchema: z.ZodType<Params>;
  defaultParams: Params;
  checkPermissions: (ctx: WidgetPermissionContext) => Promise<boolean> | boolean;
  refresh: WidgetRefreshPolicy;
  supportsExpand?: boolean;
  supportsNewTab?: boolean;
  supportsSendToScreen?: boolean;
  supportsRefreshAction?: boolean;
  minSize?: { w: number; h: number };
  preferredSize?: { w: number; h: number };
  allowedContexts?: Array<"dashboard" | "modal" | "standalone">;
}

export function generateLayoutItemId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `layout-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const widgetRegistry = new Map<string, DashboardWidgetDefinition<Record<string, unknown>>>();

export function registerWidget<Params extends Record<string, unknown>>(
  definition: DashboardWidgetDefinition<Params>,
): void {
  if (widgetRegistry.has(definition.widgetId)) {
    throw new Error(`Widget ${definition.widgetId} already registered`);
  }
  widgetRegistry.set(definition.widgetId, definition as DashboardWidgetDefinition<Record<string, unknown>>);
}

export function getWidget(
  widgetId: string,
): DashboardWidgetDefinition<Record<string, unknown>> | undefined {
  return widgetRegistry.get(widgetId);
}

export function listWidgets(): DashboardWidgetDefinition<Record<string, unknown>>[] {
  return Array.from(widgetRegistry.values());
}

export const widgetPositionSchema = z.object({
  x: z.number().int().nonnegative().default(0),
  y: z.number().int().nonnegative().default(0),
  w: z.number().int().positive().default(1),
  h: z.number().int().positive().default(1),
});

export const dashboardLayoutItemSchema = z.object({
  id: z.string().optional().default(generateLayoutItemId),
  widgetId: z.string(),
  params: z.record(z.any()).default({}),
  position: widgetPositionSchema,
});

export const dashboardLayoutPayloadSchema = z.object({
  name: z.string().min(1).max(120).default("My dashboard"),
  items: z.array(dashboardLayoutItemSchema).default([]),
});

export type DashboardLayoutItem = z.infer<typeof dashboardLayoutItemSchema>;
export type DashboardLayoutPayload = z.infer<typeof dashboardLayoutPayloadSchema>;

const defaultWidgets: DashboardWidgetDefinition<any>[] = [
  {
    widgetId: WIDGET_KEYS.HEALTH_STATUS,
    title: "Health status",
    description: "Shows the latest API health check result.",
    paramsSchema: z.object({
      label: z.string().default("System health"),
    }),
    defaultParams: { label: "System health" },
    checkPermissions: () => true,
    refresh: { mode: "interval", intervalMs: 30000 },
    supportsExpand: true,
    supportsNewTab: true,
    supportsSendToScreen: true,
    supportsRefreshAction: true,
    preferredSize: { w: 1, h: 1 },
    allowedContexts: ["dashboard", "modal", "standalone"],
  },
  {
    widgetId: WIDGET_KEYS.TEAM_NOTE,
    title: "Team note",
    description: "Short reminder text visible on the dashboard.",
    paramsSchema: z.object({
      message: z.string().default(""),
      audience: z.enum(["field", "office", "all"]).default("all"),
    }),
    defaultParams: { message: "", audience: "all" },
    checkPermissions: () => true,
    refresh: { mode: "manual" },
    supportsExpand: true,
    supportsNewTab: true,
    supportsSendToScreen: true,
    supportsRefreshAction: false,
    preferredSize: { w: 2, h: 1 },
    allowedContexts: ["dashboard", "modal", "standalone"],
  },
  {
    widgetId: WIDGET_KEYS.NAVIGATION_SHORTCUT,
    title: "Navigation shortcut",
    description: "Link to a sidebar destination directly from the dashboard.",
    paramsSchema: z.object({
      label: z.string().min(1),
      route: z.string().min(1),
      description: z.string().default(""),
    }),
    defaultParams: { label: "Shortcut", route: "/dashboard", description: "" },
    checkPermissions: () => true,
    refresh: { mode: "manual" },
    supportsExpand: false,
    supportsNewTab: true,
    supportsSendToScreen: true,
    supportsRefreshAction: false,
    preferredSize: { w: 1, h: 1 },
    allowedContexts: ["dashboard", "standalone"],
  },
  {
    widgetId: WIDGET_KEYS.SCHEDULE_UPCOMING,
    title: "Upcoming jobs",
    description: "Surface the next scheduled assignments for quick dispatching.",
    paramsSchema: z.object({
      days: z.number().int().min(1).max(30).default(7),
    }),
    defaultParams: { days: 7 },
    checkPermissions: () => true,
    refresh: { mode: "interval", intervalMs: 60_000 },
    supportsExpand: true,
    supportsNewTab: true,
    supportsSendToScreen: true,
    supportsRefreshAction: true,
    preferredSize: { w: 6, h: 4 },
    allowedContexts: ["dashboard", "modal", "standalone"],
  },
  {
    widgetId: WIDGET_KEYS.SCHEDULE_TODAY,
    title: "Today’s schedule",
    description: "Compact view of today’s assignments.",
    paramsSchema: z.object({ limit: z.number().int().min(1).max(10).default(5) }),
    defaultParams: { limit: 5 },
    checkPermissions: () => true,
    refresh: { mode: "interval", intervalMs: 45_000 },
    supportsExpand: true,
    supportsNewTab: true,
    supportsSendToScreen: true,
    supportsRefreshAction: true,
    preferredSize: { w: 4, h: 3 },
    allowedContexts: ["dashboard", "modal", "standalone"],
  },
  {
    widgetId: WIDGET_KEYS.SCHEDULE_CONFLICTS,
    title: "Schedule conflicts",
    description: "Upcoming overlaps that may need reassignment.",
    paramsSchema: z.object({ days: z.number().int().min(1).max(30).default(7) }),
    defaultParams: { days: 7 },
    checkPermissions: () => true,
    refresh: { mode: "interval", intervalMs: 60_000 },
    supportsExpand: true,
    supportsNewTab: true,
    supportsSendToScreen: true,
    supportsRefreshAction: true,
    preferredSize: { w: 4, h: 3 },
    allowedContexts: ["dashboard", "modal", "standalone"],
  },
  {
    widgetId: WIDGET_KEYS.FINANCE_SUMMARY,
    title: "Finance summary",
    description: "Revenue, outstanding invoices, and cost snapshot.",
    paramsSchema: z.object({ periodDays: z.number().int().min(7).max(90).default(30) }),
    defaultParams: { periodDays: 30 },
    checkPermissions: () => true,
    refresh: { mode: "manual" },
    supportsExpand: true,
    supportsNewTab: true,
    supportsSendToScreen: true,
    supportsRefreshAction: true,
    preferredSize: { w: 5, h: 3 },
    allowedContexts: ["dashboard", "modal", "standalone"],
  },
  {
    widgetId: WIDGET_KEYS.REPORTS_QUEUE,
    title: "Reports queue",
    description: "Recent reports and signatures awaiting review.",
    paramsSchema: z.object({ limit: z.number().int().min(3).max(20).default(5) }),
    defaultParams: { limit: 5 },
    checkPermissions: () => true,
    refresh: { mode: "interval", intervalMs: 60_000 },
    supportsExpand: true,
    supportsNewTab: true,
    supportsSendToScreen: true,
    supportsRefreshAction: true,
    preferredSize: { w: 5, h: 3 },
    allowedContexts: ["dashboard", "modal", "standalone"],
  },
];

defaultWidgets.forEach((widget) => registerWidget(widget));

export { defaultWidgets };
