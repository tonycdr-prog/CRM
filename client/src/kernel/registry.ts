import type { WidgetDef } from "@shared/contracts/widgets";

export class Registry {
  private widgets = new Map<string, WidgetDef>();

  register(widget: WidgetDef) {
    this.widgets.set(widget.key, widget);
  }

  get(key: string) {
    return this.widgets.get(key);
  }

  list() {
    return Array.from(this.widgets.values());
  }
}
