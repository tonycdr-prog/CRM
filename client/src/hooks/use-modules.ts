import { useEffect, useState } from "react";
import { getModuleList, type ModuleDefinition, type ModuleId } from "@shared/modules";
import {
  loadModuleOverrides,
  onModuleOverridesChanged,
  resolveEnabledModules,
} from "@/lib/module-overrides";

type DevStatusResponse = {
  isDev?: boolean;
  devReviewMode?: boolean;
  modules?: { id: ModuleId; enabled: boolean }[];
};

export function useModules(): { modules: ModuleDefinition[]; loading: boolean } {
  const [modules, setModules] = useState<ModuleDefinition[]>(getModuleList());
  const [loading, setLoading] = useState(true);
  const [overrideTick, setOverrideTick] = useState(0);

  useEffect(() => {
    const off = onModuleOverridesChanged(() => setOverrideTick((v) => v + 1));
    return () => off();
  }, []);

  useEffect(() => {
    fetch("/api/dev/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: DevStatusResponse | null) => {
        const overrides = loadModuleOverrides();
        setModules(resolveEnabledModules({
          status: data ?? undefined,
          overrides,
        }));
      })
      .catch(() => setModules(resolveEnabledModules({ overrides: loadModuleOverrides() })))
      .finally(() => setLoading(false));
  }, [overrideTick]);

  return { modules, loading };
}
