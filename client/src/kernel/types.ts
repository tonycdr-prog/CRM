export type WidgetInstance = {
  id: string;
  widgetKey: string;
  props: unknown;
  layout: { x: number; y: number; w: number; h: number };
};
