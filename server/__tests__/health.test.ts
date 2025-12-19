import assert from "node:assert";
import test from "node:test";
import express from "express";
import { buildHealthHandler, HEALTH_SEED, type HealthDb } from "../health";

const listen = (app: express.Express) => {
  return new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
};

test("GET /api/health returns ok when DB ping succeeds", async (t) => {
  let executed = false;
  const fakeDb: HealthDb = {
    execute: async () => {
      executed = true;
      return HEALTH_SEED;
    },
  };

  const app = express();
  app.get("/api/health", buildHealthHandler(fakeDb));

  const server = await listen(app);
  t.after(() => server.close());

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const response = await fetch(`http://127.0.0.1:${port}/api/health`);
  const body = await response.json();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(body.ok, true);
  assert.strictEqual(body.dbOk, true);
  assert.strictEqual(executed, true);
  assert.ok(typeof body.uptimeSeconds === "number");
  assert.ok(typeof body.durationMs === "number");
});
