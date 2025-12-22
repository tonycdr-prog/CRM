import assert from "node:assert";
import test from "node:test";
import { z } from "zod";
import { WIDGET_KEYS, getWidget, listWidgets, registerWidget } from "@shared/dashboard";

test("widgets can be registered and retrieved", () => {
  const startingCount = listWidgets().length;
  const widgetId = `test-widget-${startingCount}`;

  registerWidget({
    widgetId,
    title: "Test widget",
    description: "Ensures registry adds entries",
    paramsSchema: z.object({ enabled: z.boolean().default(true) }),
    defaultParams: { enabled: true },
    checkPermissions: () => true,
    refresh: { mode: "manual" },
  });

  const listed = listWidgets();
  assert.strictEqual(listed.length, startingCount + 1);
  assert.ok(listed.find((w) => w.widgetId === widgetId));
  assert.ok(getWidget(widgetId));
});

test("duplicate widget ids are rejected", () => {
  const widgetId = "duplicate-widget";
  registerWidget({
    widgetId,
    title: "First", 
    description: "baseline",
    paramsSchema: z.object({ message: z.string().default("") }),
    defaultParams: { message: "" },
    checkPermissions: () => true,
    refresh: { mode: "manual" },
  });

  assert.throws(() =>
    registerWidget({
      widgetId,
      title: "Second",
      paramsSchema: z.object({ active: z.boolean().default(false) }),
      defaultParams: { active: false },
      checkPermissions: () => true,
      refresh: { mode: "manual" },
    }),
  );
});

test("default schedule widget is registered", () => {
  const widget = getWidget(WIDGET_KEYS.SCHEDULE_UPCOMING);
  assert.ok(widget, "schedule widget should exist in registry");
  assert.strictEqual(widget?.supportsExpand, true);
  assert.strictEqual(widget?.supportsSendToScreen, true);
});

test("finance and reporting widgets are registered", () => {
  const finance = getWidget(WIDGET_KEYS.FINANCE_SUMMARY);
  const reports = getWidget(WIDGET_KEYS.REPORTS_QUEUE);
  assert.ok(finance, "finance summary widget should exist");
  assert.ok(reports, "reports queue widget should exist");
});
