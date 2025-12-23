import { getModuleList, type ModuleDefinition, type ModuleId } from "@shared/modules";

const STORAGE_KEY = "module-overrides";
const EVENT_KEY = "module-overrides-changed";

export type ModuleOverrideMap = Record<ModuleId, boolean>;

export function loadModuleOverrides(): ModuleOverrideMap {
  if (typeof localStorage === "undefined") return {} as ModuleOverrideMap;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {} as ModuleOverrideMap;
    return JSON.parse(raw) as ModuleOverrideMap;
  } catch (err) {
    console.warn("Failed to parse module overrides", err);
    return {} as ModuleOverrideMap;
  }
}

export function setModuleOverride(id: ModuleId, enabled: boolean) {
  if (typeof localStorage === "undefined") return;
  const current = loadModuleOverrides();
  current[id] = enabled;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT_KEY));
  }
}

export function clearModuleOverride(id: ModuleId) {
  if (typeof localStorage === "undefined") return;
  const current = loadModuleOverrides();
  delete current[id];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT_KEY));
  }
}

export function onModuleOverridesChanged(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => listener();
  window.addEventListener(EVENT_KEY, handler);
  return () => window.removeEventListener(EVENT_KEY, handler);
}

type ResolveArgs = {
  status?: { isDev?: boolean; devReviewMode?: boolean; modules?: { id: ModuleId; enabled: boolean }[] };
  overrides?: ModuleOverrideMap;
};

export function resolveEnabledModules(args: ResolveArgs): ModuleDefinition[] {
  const baseList = getModuleList();
  const enabledFromStatus = args.status?.modules?.filter((m) => m.enabled).map((m) => m.id) ?? null;
  const overrides = args.overrides ?? {};
  const baseEnabledSet = new Set<ModuleId>(
    enabledFromStatus && enabledFromStatus.length > 0
      ? (enabledFromStatus as ModuleId[])
      : baseList.filter((m) => m.enabledByDefault ?? true).map((m) => m.id),
  );

  // Apply overrides only when in dev/review or when explicitly provided.
  const devEnv = typeof import.meta !== "undefined" ? Boolean((import.meta as any).env?.DEV) : false;
  const canOverride = args.status?.isDev || args.status?.devReviewMode || devEnv;

  if (canOverride) {
    Object.entries(overrides).forEach(([id, enabled]) => {
      if (enabled) {
        baseEnabledSet.add(id as ModuleId);
      } else {
        baseEnabledSet.delete(id as ModuleId);
      }
    });
  }

  const enabledSet = canOverride ? baseEnabledSet : new Set(baseEnabledSet);
  return baseList.filter((module) => enabledSet.has(module.id));
}
