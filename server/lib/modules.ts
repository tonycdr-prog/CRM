import { MODULE_DEFINITIONS, MODULES, type ModuleDefinition, type ModuleId } from "@shared/modules";

type ModuleStatus = {
  id: ModuleId;
  label: string;
  description: string;
  enabled: boolean;
};

const MODULE_ENV_FLAGS: Record<ModuleId, string> = {
  [MODULES.LIFE_SAFETY]: "ENABLE_MODULE_LIFE_SAFETY_OPS",
  [MODULES.SCHEDULING]: "ENABLE_MODULE_SCHEDULING",
  [MODULES.FINANCE]: "ENABLE_MODULE_FINANCE",
  [MODULES.REPORTING]: "ENABLE_MODULE_REPORTING",
  [MODULES.ASSET_MANAGEMENT]: "ENABLE_MODULE_ASSET_MANAGEMENT",
  [MODULES.COMPLIANCE]: "ENABLE_MODULE_COMPLIANCE",
  [MODULES.FORMS_ENGINE]: "ENABLE_MODULE_FORMS_ENGINE",
  [MODULES.PASSIVE_FIRE_PROTECTION]: "ENABLE_MODULE_PASSIVE_FIRE_PROTECTION",
  [MODULES.FIRE_ALARMS]: "ENABLE_MODULE_FIRE_ALARMS",
  [MODULES.HVAC]: "ENABLE_MODULE_HVAC",
  [MODULES.AIR_CONDITIONING]: "ENABLE_MODULE_AIR_CONDITIONING",
  [MODULES.WATER_QUALITY]: "ENABLE_MODULE_WATER_QUALITY",
  [MODULES.BMS]: "ENABLE_MODULE_BMS",
  [MODULES.SFG20_LIBRARY]: "ENABLE_MODULE_SFG20_LIBRARY",
};

function parseFlag(value: string | undefined) {
  if (value === undefined) return undefined;
  return value.toLowerCase() === "true";
}

function resolveEnabled(module: ModuleDefinition, isDev: boolean) {
  const envFlag = parseFlag(process.env[MODULE_ENV_FLAGS[module.id]]);
  if (envFlag !== undefined) return envFlag;
  if (typeof module.enabledByDefault === "boolean") return module.enabledByDefault;
  return isDev;
}

export function getEnabledModules(isDev: boolean): ModuleStatus[] {
  return Object.values(MODULE_DEFINITIONS).map((module) => ({
    id: module.id,
    label: module.label,
    description: module.description,
    enabled: resolveEnabled(module, isDev),
  }));
}

export function getEnabledModuleIds(isDev: boolean): ModuleId[] {
  return getEnabledModules(isDev)
    .filter((module) => module.enabled)
    .map((module) => module.id);
}
