import assert from "node:assert";
import test from "node:test";
import express from "express";
import { createDashboardRouter } from "../dashboardRoutes";
import { InMemoryDashboardLayoutRepository } from "../lib/dashboardLayouts";
import { defaultWidgets } from "@shared/dashboard";

const listen = (app: express.Express) => {
  return new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
};

function buildApp(repository: InMemoryDashboardLayoutRepository) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).user = {
      claims: { sub: "user-1", exp: Date.now() + 1000 },
      access_token: "token",
    };
    next();
  });
  app.use("/api/dashboard", createDashboardRouter({ repository }));
  return app;
}

const healthWidgetId = defaultWidgets[0].widgetId;

const baseLayout = {
  name: "Team dashboard",
  items: [
    {
      id: "item-1",
      widgetId: healthWidgetId,
      params: { label: "Primary health" },
      position: { x: 0, y: 0, w: 1, h: 1 },
    },
  ],
};

test("dashboard layouts can be created, updated, and set as default", async (t) => {
  const repository = new InMemoryDashboardLayoutRepository();
  const app = buildApp(repository);
  const server = await listen(app);
  t.after(() => server.close());

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}/api/dashboard`;

  const createResponse = await fetch(`${baseUrl}/layouts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(baseLayout),
  });
  const createdBody = await createResponse.json();

  assert.strictEqual(createResponse.status, 201);
  assert.ok(createdBody.layout?.id);
  assert.strictEqual(createdBody.layout?.isDefault, true);

  const layoutId = createdBody.layout.id as string;

  const updateResponse = await fetch(`${baseUrl}/layouts/${layoutId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...baseLayout, name: "Updated layout", items: baseLayout.items.map((item) => ({
      ...item,
      position: { ...item.position, w: 2 },
    })) }),
  });
  const updatedBody = await updateResponse.json();

  assert.strictEqual(updateResponse.status, 200);
  assert.strictEqual(updatedBody.layout?.name, "Updated layout");
  assert.strictEqual(updatedBody.layout?.items?.[0]?.position?.w, 2);

  const secondLayoutResponse = await fetch(`${baseUrl}/layouts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...baseLayout, name: "Secondary" }),
  });
  const secondBody = await secondLayoutResponse.json();

  assert.strictEqual(secondLayoutResponse.status, 201);
  assert.strictEqual(secondBody.layout?.isDefault, false);

  const secondId = secondBody.layout.id as string;
  const defaultResponse = await fetch(`${baseUrl}/layouts/${secondId}/default`, { method: "POST" });
  assert.strictEqual(defaultResponse.status, 200);

  const loadResponse = await fetch(`${baseUrl}/layout`);
  const loadBody = await loadResponse.json();

  assert.strictEqual(loadResponse.status, 200);
  assert.strictEqual(loadBody.layout?.id, secondId);
  assert.strictEqual(loadBody.layout?.isDefault, true);
});

test("dashboard layout updates persist size changes and allow duplication", async (t) => {
  const repository = new InMemoryDashboardLayoutRepository();
  const app = buildApp(repository);
  const server = await listen(app);
  t.after(() => server.close());

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}/api/dashboard`;

  const createResponse = await fetch(`${baseUrl}/layouts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(baseLayout),
  });
  const createdBody = await createResponse.json();
  const layoutId = createdBody.layout.id as string;

  const widened = await fetch(`${baseUrl}/layouts/${layoutId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...baseLayout,
      items: baseLayout.items.map((item) => ({ ...item, position: { ...item.position, w: 3, h: 2 } })),
    }),
  });
  const widenedBody = await widened.json();
  assert.strictEqual(widened.status, 200);
  assert.strictEqual(widenedBody.layout.items[0].position.w, 3);
  assert.strictEqual(widenedBody.layout.items[0].position.h, 2);

  const duplicatePayload = {
    ...baseLayout,
    items: [
      { ...baseLayout.items[0], position: { x: 0, y: 0, w: 1, h: 1 } },
      { ...baseLayout.items[0], id: "item-2", position: { x: 0, y: 1, w: 2, h: 1 } },
    ],
  };

  const duplicateResponse = await fetch(`${baseUrl}/layouts/${layoutId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(duplicatePayload),
  });
  const duplicateBody = await duplicateResponse.json();

  assert.strictEqual(duplicateResponse.status, 200);
  assert.strictEqual(duplicateBody.layout.items.length, 2);
});
