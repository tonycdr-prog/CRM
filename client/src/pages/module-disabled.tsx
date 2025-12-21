import { AlertCircle } from "lucide-react";
import { MODULE_DEFINITIONS, MODULE_LABELS, MODULE_TAGLINES, type ModuleId } from "@shared/modules";

interface Props {
  moduleIds: ModuleId[];
}

export function ModuleDisabled({ moduleIds }: Props) {
  const primaryId = moduleIds[0];
  const title = MODULE_LABELS[primaryId] ?? "Module";
  const tagline = MODULE_TAGLINES[primaryId] ?? MODULE_DEFINITIONS[primaryId]?.tagline;

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-4">
        <AlertCircle className="text-amber-600" />
        <div>
          <h1 className="text-2xl font-semibold">{title} module not enabled</h1>
          {tagline ? <p className="text-muted-foreground">{tagline}</p> : null}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        This area belongs to an optional module. Enable it via module flags in development or contact your administrator to
        provision access.
      </p>
    </div>
  );
}

export default ModuleDisabled;
