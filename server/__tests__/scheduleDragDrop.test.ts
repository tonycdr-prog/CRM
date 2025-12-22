import assert from "node:assert";
import test from "node:test";
import express from "express";
import { updateScheduleState, getScheduleState } from "../lib/scheduleAssignments";

const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  DEV_AUTH_BYPASS: process.env.DEV_AUTH_BYPASS,
  SESSION_SECRET: process.env.SESSION_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
};

async function buildApp() {
  process.env.NODE_ENV = "development";
  process.env.DEV_AUTH_BYPASS = "true";
  const { buildScheduleRouter } = await import("../scheduleRoutes");
  const app = express();
  app.use(express.json());
  app.use("/api/schedule", buildScheduleRouter());
  return app;
}

test("schedule patch updates times and post duplicates a job", async (t) => {
  const original = getScheduleState();
  const app = await buildApp();
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  t.after(() => {
    server.close();
    updateScheduleState(original);
    process.env.NODE_ENV = originalEnv.NODE_ENV;
    process.env.DEV_AUTH_BYPASS = originalEnv.DEV_AUTH_BYPASS;
    process.env.SESSION_SECRET = originalEnv.SESSION_SECRET;
    if (originalEnv.DATABASE_URL) process.env.DATABASE_URL = originalEnv.DATABASE_URL;
  });

  const port = (server.address() as any).port as number;
  const baseUrl = `http://127.0.0.1:${port}/api/schedule`;

  const listRes = await fetch(baseUrl);
  assert.strictEqual(listRes.status, 200);
  const listBody = (await listRes.json()) as any;
  assert.ok(Array.isArray(listBody.assignments));
  const firstAssignment = listBody.assignments[0];
  assert.ok(firstAssignment?.id, "expected seed assignment id");

  const patchRes = await fetch(`${baseUrl}/${firstAssignment.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      startAt: new Date("2025-01-01T09:00:00.000Z").toISOString(),
      endAt: new Date("2025-01-01T10:00:00.000Z").toISOString(),
      engineerIds: [firstAssignment.engineerUserId || firstAssignment.engineerId],
    }),
  });
  const patchBody = (await patchRes.json()) as any;
  assert.strictEqual(patchRes.status, 200);
  assert.ok(Array.isArray(patchBody.assignments));

  const createRes = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: "job-drag-dup",
      startAt: new Date("2025-01-02T09:00:00.000Z").toISOString(),
      endAt: new Date("2025-01-02T10:00:00.000Z").toISOString(),
      engineerIds: ["eng-seeded"],
    }),
  });
  const createBody = (await createRes.json()) as any;
  assert.strictEqual(createRes.status, 201);
  assert.ok(createBody.assignments?.some((a: any) => a.jobId === "job-drag-dup"));
});

