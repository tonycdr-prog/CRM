export const MODULES = {
  LIFE_SAFETY: "life-safety",
  SCHEDULING: "scheduling",
  FINANCE: "finance",
} as const;

export type ModuleId = typeof MODULES[keyof typeof MODULES];

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  description: string;
  tagline: string;
  enabledByDefault?: boolean;
  routes: { title: string; path: string }[];
  widgets?: string[];
}

export const MODULE_DEFINITIONS: Record<ModuleId, ModuleDefinition> = {
  [MODULES.LIFE_SAFETY]: {
    id: MODULES.LIFE_SAFETY,
    label: "Life Safety Ops",
    description:
      "Compliance-focused inspections, smoke-control workflows, reporting, and defects management.",
    tagline:
      "Life Safety Ops is a standards-led operations module that turns site assets and calibrated test readings into compliant smoke-control forms, defects, and signed reports—fast, repeatably, and audit-ready.",
    enabledByDefault: true,
    routes: [
      { title: "Dashboard", path: "/dashboard" },
      { title: "Forms Hub", path: "/hub/forms" },
      { title: "Forms Builder", path: "/forms/builder" },
      { title: "Forms Runner", path: "/forms/runner" },
      { title: "Smoke Control Library", path: "/admin/smoke-control" },
      { title: "Reports", path: "/reports" },
      { title: "Defects", path: "/defects" },
      { title: "Schedule", path: "/schedule" },
      { title: "Finance", path: "/finance" },
    ],
    widgets: [
      "dashboard",
      "reports",
      "defects",
      "forms",
      "finance",
      "schedule",
    ],
  },
  [MODULES.SCHEDULING]: {
    id: MODULES.SCHEDULING,
    label: "Advanced Scheduling",
    description: "Multi-engineer drag/drop dispatching and conflict visibility.",
    tagline: "Plan and dispatch engineers with drag/drop scheduling and conflict awareness.",
    enabledByDefault: true,
    routes: [
      { title: "Schedule", path: "/schedule" },
      { title: "Dashboard", path: "/dashboard" },
    ],
    widgets: ["schedule"],
  },
  [MODULES.FINANCE]: {
    id: MODULES.FINANCE,
    label: "Finance Ops",
    description: "Quotes, invoices, and profitability insights tied to operational workflows.",
    tagline: "Operational finance dashboards and quotes-to-cash tracking for field work.",
    enabledByDefault: true,
    routes: [
      { title: "Finance", path: "/finance" },
      { title: "Reports", path: "/reports" },
    ],
    widgets: ["finance", "reports"],
  },
};

export const MODULE_LABELS: Record<ModuleId, string> = Object.fromEntries(
  Object.values(MODULE_DEFINITIONS).map((module) => [module.id, module.label]),
) as Record<ModuleId, string>;

export const MODULE_TAGLINES: Record<ModuleId, string> = Object.fromEntries(
  Object.values(MODULE_DEFINITIONS).map((module) => [module.id, module.tagline]),
) as Record<ModuleId, string>;

export function getModuleList(): ModuleDefinition[] {
  return Object.values(MODULE_DEFINITIONS);
}
