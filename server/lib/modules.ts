import { moduleRegistry } from "@shared/modules";

type ModuleStatus = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

function parseFlag(value: string | undefined) {
  if (value === undefined) return undefined;
  return value.toLowerCase() === "true";
}

export function getEnabledModules(isDev: boolean): ModuleStatus[] {
  return moduleRegistry.map((module) => {
    const flagValue = parseFlag(process.env[module.envFlag]);
    const enabled =
      flagValue !== undefined
        ? flagValue
        : module.enabledByDefault;

    return {
      id: module.id,
      name: module.name,
      description: module.description,
      enabled: isDev ? enabled : enabled,
    };
  });
}

export function getEnabledModuleIds(isDev: boolean): string[] {
  return getEnabledModules(isDev)
    .filter((module) => module.enabled)
    .map((module) => module.id);
}
