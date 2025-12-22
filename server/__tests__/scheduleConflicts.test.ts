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

async function buildApp() {
  process.env.NODE_ENV = "development";
  process.env.DEV_AUTH_BYPASS = "true";
  process.env.SESSION_SECRET = "dev";
  delete process.env.DATABASE_URL;

  const { buildScheduleRouter } = await import("../scheduleRoutes");
  const app = express();
  app.use(express.json());
  app.use("/api/schedule", buildScheduleRouter());
  return app;
}

test("warnings are returned for overlapping schedule items and non-overlapping succeed", async (t) => {
  const app = await buildApp();
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  t.after(() => {
    server.close();
    process.env.NODE_ENV = originalEnv.NODE_ENV;
    process.env.DEV_AUTH_BYPASS = originalEnv.DEV_AUTH_BYPASS;
    process.env.SESSION_SECRET = originalEnv.SESSION_SECRET;
    if (originalEnv.DATABASE_URL) process.env.DATABASE_URL = originalEnv.DATABASE_URL;
    updateScheduleState(originalState);
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}/api/schedule`;

  const basePayload = {
    jobId: "job-seed-1",
    startAt: new Date("2025-01-01T10:00:00.000Z").toISOString(),
    endAt: new Date("2025-01-01T11:00:00.000Z").toISOString(),
    engineerIds: ["eng-a"],
  };

  const first = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(basePayload),
  });
  assert.strictEqual(first.status, 201);

  const overlap = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...basePayload,
      jobId: "job-seed-2",
      startAt: new Date("2025-01-01T10:30:00.000Z").toISOString(),
      endAt: new Date("2025-01-01T11:30:00.000Z").toISOString(),
    }),
  });
  const overlapBody = await overlap.json();
  assert.strictEqual(overlap.status, 201);
  assert.ok(Array.isArray(overlapBody.warnings));
  assert.ok(overlapBody.warnings.length > 0, "expected warning for overlapping schedule");

  const nonOverlap = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...basePayload,
      jobId: "job-seed-3",
      startAt: new Date("2025-01-02T08:00:00.000Z").toISOString(),
      endAt: new Date("2025-01-02T09:00:00.000Z").toISOString(),
    }),
  });
  const nonOverlapBody = await nonOverlap.json();
  assert.strictEqual(nonOverlap.status, 201);
  assert.ok(Array.isArray(nonOverlapBody.warnings));
  assert.strictEqual(nonOverlapBody.warnings.length, 0);
});
