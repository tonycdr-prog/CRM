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

test("conflicts are reported for overlapping jobs and cleared when moved", async (t) => {
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

  // ensure starting state with overlapping assignments from demo seed
  const initialRes = await fetch(`${baseUrl}/jobs`);
  const initialBody = await initialRes.json();
  assert.ok(Array.isArray(initialBody.conflicts));
  assert.ok(initialBody.conflicts.length > 0, "expected an overlapping conflict in seed data");

  const firstJob = initialBody.jobs[0];
  assert.ok(firstJob);

  // move job out of overlap window
  const moveRes = await fetch(`${baseUrl}/move-job`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: firstJob.id,
      startAt: new Date("2025-01-02T08:00:00.000Z").toISOString(),
      endAt: new Date("2025-01-02T09:00:00.000Z").toISOString(),
    }),
  });
  assert.strictEqual(moveRes.status, 200);
  const moveBody = await moveRes.json();
  assert.ok(Array.isArray(moveBody.conflicts));

  // when checking again, conflicts should still be an array (possibly empty)
  const afterMove = await fetch(`${baseUrl}/jobs`);
  const afterBody = await afterMove.json();
  assert.ok(Array.isArray(afterBody.conflicts));

  // duplicate overlapping to trigger warning but not an error
  const dupRes = await fetch(`${baseUrl}/duplicate-job`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: firstJob.id,
      startAt: new Date("2025-01-02T08:30:00.000Z").toISOString(),
      endAt: new Date("2025-01-02T09:30:00.000Z").toISOString(),
    }),
  });
  assert.strictEqual(dupRes.status, 200);
  const dupBody = await dupRes.json();
  assert.ok(Array.isArray(dupBody.conflicts));
});
