import assert from "node:assert";
import test from "node:test";
import express from "express";
import { getScheduleState, updateScheduleState } from "../lib/scheduleAssignments";

const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  DEV_AUTH_BYPASS: process.env.DEV_AUTH_BYPASS,
  SESSION_SECRET: process.env.SESSION_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
};
const originalState = getScheduleState();

test("returns 409 when overlapping", async (t) => {
  process.env.NODE_ENV = "development";
  process.env.DEV_AUTH_BYPASS = "true";
  process.env.SESSION_SECRET = "dev";
  delete process.env.DATABASE_URL;
  updateScheduleState({ ...originalState, assignments: [] });

  t.after(() => {
    process.env.NODE_ENV = originalEnv.NODE_ENV;
    process.env.DEV_AUTH_BYPASS = originalEnv.DEV_AUTH_BYPASS;
    process.env.SESSION_SECRET = originalEnv.SESSION_SECRET;
    if (originalEnv.DATABASE_URL) process.env.DATABASE_URL = originalEnv.DATABASE_URL;
    updateScheduleState(originalState);
  });

  const { buildScheduleRouter } = await import("../scheduleRoutes");

  const app = express();
  app.use(express.json());
  app.use("/api/schedule", buildScheduleRouter());

  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  t.after(() => server.close());

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}/api/schedule`;

  const base = {
    jobId: "00000000-0000-0000-0000-000000000001",
    engineerUserId: "dev-user",
    startsAt: new Date("2025-01-01T10:00:00.000Z").toISOString(),
    endsAt: new Date("2025-01-01T11:00:00.000Z").toISOString(),
    requiredEngineers: 1,
  };

  const r1 = await fetch(`${baseUrl}/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(base),
  });
  assert.ok([201, 200].includes(r1.status));

  const r2 = await fetch(`${baseUrl}/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...base,
      startsAt: new Date("2025-01-01T10:30:00.000Z").toISOString(),
      endsAt: new Date("2025-01-01T11:30:00.000Z").toISOString(),
    }),
  });

  assert.strictEqual(r2.status, 409);
});
