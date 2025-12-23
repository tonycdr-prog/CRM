import type { WidgetDef } from "@shared/contracts/widgets";

const inboxWidget: WidgetDef = {
  key: "inbox",
  title: "Inbox",
  propsSchema: undefined as any,
  eventsIn: [],
  eventsOut: ["email.selected"],
  query: async () => [],
  actions: [],
};

export default inboxWidget;
