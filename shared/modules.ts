export const MODULES = {
  LIFE_SAFETY: "life-safety",
} as const;

export type ModuleId = typeof MODULES[keyof typeof MODULES];

export const MODULE_LABELS: Record<ModuleId, string> = {
  "life-safety": "Life Safety Ops",
};

export const MODULE_TAGLINES: Record<ModuleId, string> = {
  "life-safety":
    "Life Safety Ops is a standards-led operations module that turns site assets and calibrated test readings into compliant smoke-control forms, defects, and signed reports—fast, repeatably, and audit-ready.",
};
