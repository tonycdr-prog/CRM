import { useEffect, useState } from "react";
import { getModuleList, type ModuleDefinition, type ModuleId } from "@shared/modules";

type DevStatusResponse = {
  modules?: { id: ModuleId; enabled: boolean }[];
};

export function useModules(): { modules: ModuleDefinition[]; loading: boolean } {
  const [modules, setModules] = useState<ModuleDefinition[]>(getModuleList());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dev/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: DevStatusResponse | null) => {
        if (!data?.modules) {
          setModules(getModuleList());
          return;
        }
        const enabledIds = data.modules.filter((m) => m.enabled).map((m) => m.id);
        if (enabledIds.length === 0) {
          setModules([]);
          return;
        }
        const enabledSet = new Set(enabledIds);
        setModules(getModuleList().filter((module) => enabledSet.has(module.id)));
      })
      .catch(() => setModules(getModuleList()))
      .finally(() => setLoading(false));
  }, []);

  return { modules, loading };
}
