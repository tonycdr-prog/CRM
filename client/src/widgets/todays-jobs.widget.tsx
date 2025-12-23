import type { WidgetDef } from "@shared/contracts/widgets";

const todaysJobsWidget: WidgetDef = {
  key: "todays-jobs",
  title: "Today's Jobs",
  propsSchema: undefined as any,
  eventsIn: [],
  eventsOut: ["job.selected"],
  query: async () => [],
  actions: [],
};

export default todaysJobsWidget;
