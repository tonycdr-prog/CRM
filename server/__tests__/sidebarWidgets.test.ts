import assert from "node:assert";
import test from "node:test";
import { buildLayoutWithSidebarWidget, mapSidebarRouteToWidget } from "@shared/sidebarWidgets";
import { InMemoryDashboardLayoutRepository, validateLayoutForUser } from "../lib/dashboardLayouts";

const userId = "user-1";

test("sidebar routes resolve to widget definitions with default params", () => {
  const mapping = mapSidebarRouteToWidget("/hub/manage");
  assert.ok(mapping, "expected mapping for manage hub");
  assert.strictEqual(mapping.widgetId, "navigation-shortcut");
  assert.strictEqual((mapping.params as any).label, "Manage hub");
  assert.strictEqual((mapping.params as any).route, "/hub/manage");
  assert.strictEqual((mapping.params as any).description, "");
  assert.deepStrictEqual(mapping.defaultSize, { w: 2, h: 1 });
});

test("add-to-dashboard builder appends widgets with sequential positions", async () => {
  const repository = new InMemoryDashboardLayoutRepository();
  const firstPayload = buildLayoutWithSidebarWidget("/dashboard");
  assert.ok(firstPayload, "expected mapping for dashboard");
  const validatedFirst = await validateLayoutForUser(firstPayload, userId);
  const created = await repository.create(userId, validatedFirst, true);

  const secondPayload = buildLayoutWithSidebarWidget("/hub/work", {
    name: created.name,
    items: created.layout,
  });
  assert.ok(secondPayload, "expected mapping for work hub");
  const validatedSecond = await validateLayoutForUser(secondPayload, userId);
  const updated = await repository.update(created.id, userId, validatedSecond);

  assert.ok(updated);
  assert.strictEqual(updated.layout.length, 2);
  assert.strictEqual(updated.layout[0]?.position.y, 0);
  assert.strictEqual(updated.layout[1]?.position.y, 1);
});
