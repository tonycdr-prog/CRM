import { z } from "zod";

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
    widgetId: "health-status",
    title: "Health status",
    description: "Shows the latest API health check result.",
    paramsSchema: z.object({
      label: z.string().default("System health"),
    }),
    defaultParams: { label: "System health" },
    checkPermissions: () => true,
    refresh: { mode: "interval", intervalMs: 30000 },
  },
  {
    widgetId: "team-note",
    title: "Team note",
    description: "Short reminder text visible on the dashboard.",
    paramsSchema: z.object({
      message: z.string().default(""),
      audience: z.enum(["field", "office", "all"]).default("all"),
    }),
    defaultParams: { message: "", audience: "all" },
    checkPermissions: () => true,
    refresh: { mode: "manual" },
  },
  {
    widgetId: "navigation-shortcut",
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
  },
];

defaultWidgets.forEach((widget) => registerWidget(widget));

export { defaultWidgets };
