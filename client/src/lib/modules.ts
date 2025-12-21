import {
  MODULES,
  MODULE_DEFINITIONS,
  MODULE_LABELS,
  MODULE_TAGLINES,
  type ModuleId,
  type ModuleDefinition,
  getModuleList,
} from "@shared/modules";
import { ROUTES } from "@/lib/routes";

export interface ModuleNavEntry {
  id: string;
  label: string;
  tagline: string;
  links: { title: string; path: string }[];
}

const MODULE_LINKS: Partial<Record<ModuleId, { title: string; path: string }[]>> = {
  [MODULES.LIFE_SAFETY]: [
    { title: "Dashboard", path: ROUTES.DASHBOARD },
    { title: "Forms Hub", path: ROUTES.HUB_FORMS },
    { title: "Forms Builder", path: ROUTES.FORMS_BUILDER },
    { title: "Forms Runner", path: ROUTES.FORMS_RUNNER },
    { title: "Smoke Control Library", path: ROUTES.SMOKE_CONTROL_LIBRARY },
    { title: "Reports", path: ROUTES.REPORTS },
    { title: "Defects", path: ROUTES.DEFECTS },
    { title: "Schedule", path: ROUTES.SCHEDULE },
    { title: "Finance", path: ROUTES.FINANCE },
  ],
  [MODULES.SCHEDULING]: [
    { title: "Schedule", path: ROUTES.SCHEDULE },
    { title: "Dashboard", path: ROUTES.DASHBOARD },
  ],
  [MODULES.FINANCE]: [
    { title: "Finance", path: ROUTES.FINANCE },
    { title: "Reports", path: ROUTES.REPORTS },
  ],
};

export const MODULE_NAV: Record<string, ModuleNavEntry> = Object.fromEntries(
  Object.values(MODULE_DEFINITIONS).map((module) => [
    module.id,
    {
      id: module.id,
      label: MODULE_LABELS[module.id],
      tagline: MODULE_TAGLINES[module.id],
      links: MODULE_LINKS[module.id] ?? module.routes,
    },
  ]),
);

export function getModulesList(): ModuleNavEntry[] {
  return Object.values(MODULE_NAV);
}

export function getEnabledModules(enabledModuleIds?: ModuleId[]): ModuleDefinition[] {
  const enabledSet = new Set(enabledModuleIds);
  const baseModules = getModuleList();
  if (!enabledModuleIds || enabledSet.size === 0) return baseModules;
  return baseModules.filter((module) => enabledSet.has(module.id));
}
