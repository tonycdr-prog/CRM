export const MODULES = {
  LIFE_SAFETY: "life-safety",
  SCHEDULING: "scheduling",
  FINANCE: "finance",
  REPORTING: "reporting",
  ASSET_MANAGEMENT: "asset-management",
  COMPLIANCE: "compliance",
  FORMS_ENGINE: "forms-engine",
  PASSIVE_FIRE_PROTECTION: "passive-fire-protection",
  FIRE_ALARMS: "fire-alarms",
  HVAC: "hvac",
  AIR_CONDITIONING: "air-conditioning",
  WATER_QUALITY: "water-quality",
  BMS: "bms",
  SFG20_LIBRARY: "sfg20-library",
} as const;

export type ModuleKey = typeof MODULES[keyof typeof MODULES];

export type WidgetKey = string;

export type SidebarSectionKey = string;

export type ModuleId = typeof MODULES[keyof typeof MODULES];

export interface ModuleDefinition {
  key: ModuleKey;
  id: ModuleId;
  label: string;
  description: string;
  tagline: string;
  enabledByDefault?: boolean;
  routes: { title: string; path: string }[];
  widgets?: WidgetKey[];
  ownsRoutes: string[];
  ownsWidgets: WidgetKey[];
  ownsSidebarSections: SidebarSectionKey[];
}

export const MODULE_DEFINITIONS: Record<ModuleId, ModuleDefinition> = {
  [MODULES.LIFE_SAFETY]: {
    key: MODULES.LIFE_SAFETY,
    id: MODULES.LIFE_SAFETY,
    label: "Smoke Control",
    description:
      "Smoke control inspections, compliance workflows, reporting, and defects management.",
    tagline:
      "Smoke Control is a standards-led operations module that turns site assets and calibrated test readings into compliant smoke-control forms, defects, and signed reports fast, repeatably, and audit-ready.",
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
      "finance.summary",
      "reports.queue",
    ],
    ownsRoutes: [
      "/dashboard",
      "/hub/forms",
      "/forms/builder",
      "/forms/runner",
      "/admin/smoke-control",
      "/reports",
      "/defects",
      "/schedule",
      "/finance",
    ],
    ownsWidgets: [
      "dashboard",
      "reports",
      "defects",
      "forms",
      "finance",
      "schedule",
    ],
    ownsSidebarSections: [],
  },
  [MODULES.SCHEDULING]: {
    key: MODULES.SCHEDULING,
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
    ownsRoutes: ["/schedule", "/dashboard"],
    ownsWidgets: ["schedule", "schedule.today", "schedule.upcoming", "schedule.conflicts"],
    ownsSidebarSections: [],
  },
  [MODULES.FINANCE]: {
    key: MODULES.FINANCE,
    id: MODULES.FINANCE,
    label: "Finance Ops",
    description: "Quotes, invoices, and profitability insights tied to operational workflows.",
    tagline: "Operational finance dashboards and quotes-to-cash tracking for field work.",
    enabledByDefault: true,
    routes: [
      { title: "Finance", path: "/finance" },
      { title: "Reports", path: "/reports" },
    ],
    widgets: ["finance", "reports", "finance.summary"],
    ownsRoutes: ["/finance", "/reports"],
    ownsWidgets: ["finance", "reports", "finance.summary"],
    ownsSidebarSections: [],
  },
  [MODULES.REPORTING]: {
    key: MODULES.REPORTING,
    id: MODULES.REPORTING,
    label: "Reporting",
    description: "Operational and client-facing outputs across modules.",
    tagline: "Role-based reports that tie submissions, defects, and finance together.",
    enabledByDefault: true,
    routes: [
      { title: "Reports", path: "/reports" },
      { title: "Dashboard", path: "/dashboard" },
    ],
    widgets: ["reports", "reports.queue"],
    ownsRoutes: ["/reports", "/dashboard"],
    ownsWidgets: ["reports", "reports.queue"],
    ownsSidebarSections: [],
  },
  [MODULES.ASSET_MANAGEMENT]: {
    key: MODULES.ASSET_MANAGEMENT,
    id: MODULES.ASSET_MANAGEMENT,
    label: "Asset Management",
    description: "Track sites, assets, and maintenance context for jobs and forms.",
    tagline: "Assets, sites, and lineage that feed jobs, forms, and defects.",
    enabledByDefault: true,
    routes: [
      { title: "Sites", path: "/sites" },
      { title: "Site Assets", path: "/site-assets" },
    ],
    widgets: ["assets"],
    ownsRoutes: ["/sites", "/site-assets"],
    ownsWidgets: ["assets"],
    ownsSidebarSections: [],
  },
  [MODULES.COMPLIANCE]: {
    key: MODULES.COMPLIANCE,
    id: MODULES.COMPLIANCE,
    label: "Compliance and Certifications",
    description: "Maintain certifications, golden thread, and safety documentation.",
    tagline: "Compliance records and certifications tied to assets and jobs.",
    enabledByDefault: true,
    routes: [
      { title: "Certifications", path: "/certifications" },
      { title: "Golden Thread", path: "/golden-thread" },
    ],
    widgets: ["compliance"],
    ownsRoutes: ["/certifications", "/golden-thread"],
    ownsWidgets: ["compliance"],
    ownsSidebarSections: [],
  },
  [MODULES.FORMS_ENGINE]: {
    key: MODULES.FORMS_ENGINE,
    id: MODULES.FORMS_ENGINE,
    label: "Forms Engine",
    description: "Versioned templates, runner, and smoke-control library.",
    tagline: "Standards-led forms engine for smoke-control and calibrated testing.",
    enabledByDefault: true,
    routes: [
      { title: "Forms Hub", path: "/hub/forms" },
      { title: "Forms Builder", path: "/forms/builder" },
      { title: "Forms Runner", path: "/forms/runner" },
      { title: "Smoke Control Library", path: "/admin/smoke-control" },
    ],
    widgets: ["forms"],
    ownsRoutes: [
      "/hub/forms",
      "/forms/builder",
      "/forms/runner",
      "/admin/smoke-control",
    ],
    ownsWidgets: ["forms"],
    ownsSidebarSections: [],
  },
  [MODULES.PASSIVE_FIRE_PROTECTION]: {
    key: MODULES.PASSIVE_FIRE_PROTECTION,
    id: MODULES.PASSIVE_FIRE_PROTECTION,
    label: "Passive Fire Protection",
    description: "Inspections and maintenance for passive fire measures.",
    tagline: "Evidence-led inspections for doors, seals, and compartmentation.",
    enabledByDefault: false,
    routes: [],
    widgets: [],
    ownsRoutes: [],
    ownsWidgets: [],
    ownsSidebarSections: [],
  },
  [MODULES.FIRE_ALARMS]: {
    key: MODULES.FIRE_ALARMS,
    id: MODULES.FIRE_ALARMS,
    label: "Fire Alarms",
    description: "Alarm testing, servicing schedules, and compliance tracking.",
    tagline: "Cause and effect checks with zone-level evidence.",
    enabledByDefault: false,
    routes: [],
    widgets: [],
    ownsRoutes: [],
    ownsWidgets: [],
    ownsSidebarSections: [],
  },
  [MODULES.HVAC]: {
    key: MODULES.HVAC,
    id: MODULES.HVAC,
    label: "HVAC",
    description: "HVAC maintenance workflows and asset histories.",
    tagline: "Air handling maintenance with linked evidence packs.",
    enabledByDefault: false,
    routes: [],
    widgets: [],
    ownsRoutes: [],
    ownsWidgets: [],
    ownsSidebarSections: [],
  },
  [MODULES.AIR_CONDITIONING]: {
    key: MODULES.AIR_CONDITIONING,
    id: MODULES.AIR_CONDITIONING,
    label: "Air Conditioning and Air Quality",
    description: "Indoor air quality checks and cooling system servicing.",
    tagline: "Air quality evidence tied to maintenance schedules.",
    enabledByDefault: false,
    routes: [],
    widgets: [],
    ownsRoutes: [],
    ownsWidgets: [],
    ownsSidebarSections: [],
  },
  [MODULES.WATER_QUALITY]: {
    key: MODULES.WATER_QUALITY,
    id: MODULES.WATER_QUALITY,
    label: "Water Quality",
    description: "Water quality sampling, compliance, and remediation.",
    tagline: "Sampling workflows with audit-ready evidence packs.",
    enabledByDefault: false,
    routes: [],
    widgets: [],
    ownsRoutes: [],
    ownsWidgets: [],
    ownsSidebarSections: [],
  },
  [MODULES.BMS]: {
    key: MODULES.BMS,
    id: MODULES.BMS,
    label: "BMS",
    description: "Building management system integrations and monitoring.",
    tagline: "System-level visibility with linked operational context.",
    enabledByDefault: false,
    routes: [],
    widgets: [],
    ownsRoutes: [],
    ownsWidgets: [],
    ownsSidebarSections: [],
  },
  [MODULES.SFG20_LIBRARY]: {
    key: MODULES.SFG20_LIBRARY,
    id: MODULES.SFG20_LIBRARY,
    label: "SFG20 Library",
    description: "Planned maintenance schedules and catalog references.",
    tagline: "Structured maintenance standards ready for future rollout.",
    enabledByDefault: false,
    routes: [],
    widgets: [],
    ownsRoutes: [],
    ownsWidgets: [],
    ownsSidebarSections: [],
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
