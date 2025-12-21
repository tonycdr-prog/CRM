import { MODULE_DEFINITIONS, MODULES, type ModuleId, type ModuleDefinition } from "@shared/modules";

const MODULE_ENV_FLAGS: Record<ModuleId, string> = {
  [MODULES.LIFE_SAFETY]: "ENABLE_MODULE_LIFE_SAFETY_OPS",
  [MODULES.SCHEDULING]: "ENABLE_MODULE_SCHEDULING",
  [MODULES.FINANCE]: "ENABLE_MODULE_FINANCE",
};

export function resolveEnabledModules(isDev: boolean): ModuleDefinition[] {
  return Object.values(MODULE_DEFINITIONS).filter((module) => {
    const envFlag = process.env[MODULE_ENV_FLAGS[module.id]]?.toLowerCase();
    if (envFlag === "true") return true;
    if (envFlag === "false") return false;
    if (typeof module.enabledByDefault === "boolean") {
      return module.enabledByDefault;
    }
    return isDev;
  });
}

export function getEnabledModuleIds(isDev: boolean): ModuleId[] {
  return resolveEnabledModules(isDev).map((module) => module.id);
}
