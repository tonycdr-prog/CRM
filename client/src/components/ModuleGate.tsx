import type React from "react";
import { Loader2 } from "lucide-react";
import ModuleDisabled from "@/pages/module-disabled";
import { useModules } from "@/hooks/use-modules";
import type { ModuleId } from "@shared/modules";

interface Props {
  moduleIds: ModuleId[];
  children: React.ReactNode;
}

export function ModuleGate({ moduleIds, children }: Props) {
  const { modules, loading } = useModules();
  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 text-muted-foreground" role="status">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading module access…
      </div>
    );
  }

  const enabledSet = new Set(modules.map((m) => m.id));
  const allowed = moduleIds.some((id) => enabledSet.has(id));

  if (!allowed) {
    return <ModuleDisabled moduleIds={moduleIds} />;
  }

  return <>{children}</>;
}

export function withModuleGuard(moduleIds: ModuleId[], Component: React.ComponentType<any>) {
  return function ModuleGuardWrapper(props: any) {
    return (
      <ModuleGate moduleIds={moduleIds}>
        <Component {...props} />
      </ModuleGate>
    );
  };
}
