import { MODULES, MODULE_LABELS, MODULE_TAGLINES } from "@shared/modules";
import { ROUTES } from "@/lib/routes";

export interface ModuleNavEntry {
  id: string;
  label: string;
  tagline: string;
  links: { title: string; path: string }[];
}

export const MODULE_NAV: Record<string, ModuleNavEntry> = {
  [MODULES.LIFE_SAFETY]: {
    id: MODULES.LIFE_SAFETY,
    label: MODULE_LABELS[MODULES.LIFE_SAFETY],
    tagline: MODULE_TAGLINES[MODULES.LIFE_SAFETY],
    links: [
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
  },
};

export function getModulesList(): ModuleNavEntry[] {
  return Object.values(MODULE_NAV);
}
