import { useMemo } from "react";
import { WidgetFrame } from "@/components/widgets/WidgetFrame";
import { getWidget } from "@shared/dashboard";

type WidgetViewProps = { params: { widgetId: string } };

export default function WidgetView({ params }: WidgetViewProps) {
  const widget = getWidget(params.widgetId);
  const parsedParams = useMemo(() => {
    const search = new URLSearchParams(window.location.search);
    const raw = search.get("params");
    if (!raw) return {} as Record<string, unknown>;
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch (err) {
      console.warn("Unable to parse widget params", err);
      return {} as Record<string, unknown>;
    }
  }, []);

  if (!widget) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <p className="text-muted-foreground">Unknown widget: {params.widgetId}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-4 p-4 md:p-6">
      <WidgetFrame
        widgetId={widget.widgetId}
        title={widget.title}
        description={widget.description}
        supportsExpand={true}
        supportsNewTab={false}
        params={parsedParams}
      >
        <p className="text-sm text-muted-foreground">
          Standalone view for the <strong>{widget.title}</strong> widget. Use the dashboard to pin and resize it,
          or close this tab to return to your layout.
        </p>
      </WidgetFrame>
    </div>
  );
}
