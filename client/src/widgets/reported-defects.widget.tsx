import type { WidgetDef } from "@shared/contracts/widgets";

const reportedDefectsWidget: WidgetDef = {
  key: "reported-defects",
  title: "Reported Defects",
  propsSchema: undefined as any,
  eventsIn: [],
  eventsOut: ["defect.selected"],
  query: async () => [],
  actions: [],
};

export default reportedDefectsWidget;
