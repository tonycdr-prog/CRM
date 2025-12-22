import assert from "node:assert";
import test from "node:test";
import express from "express";
import { getScheduleState } from "../lib/scheduleAssignments";
import { insertScheduleAssignmentSchema } from "@shared/schema";

const listen = (app: express.Express) => {
  return new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
};

async function buildApp() {
  process.env.NODE_ENV = "development";
  process.env.DEV_AUTH_BYPASS = "true";
  const { buildScheduleRouter } = await import("../scheduleRoutes");
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).user = { claims: { sub: "dev-user", org_id: "11111111-1111-1111-1111-111111111111" } };
    (req as any).isAuthenticated = () => true;
    next();
  });
  app.use("/api/schedule", buildScheduleRouter());
  return app;
}

test("can create and update schedule assignments", async (t) => {
  const app = await buildApp();
  const server = await listen(app);
  t.after(() => server.close());
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}/api/schedule`;

  const createRes = await fetch(`${baseUrl}/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: "22222222-2222-2222-2222-222222222222",
      engineerId: "eng-new",
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    }),
  });
  const createBody = await createRes.json();
  assert.strictEqual(createRes.status, 201);
  assert.ok(createBody.id || createBody.assignment?.id);

  const assignmentId = createBody.id ?? createBody.assignment?.id;
  const updateRes = await fetch(`${baseUrl}/assignments/${assignmentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requiredEngineers: 2 }),
  });
  const updateBody = await updateRes.json();
  assert.strictEqual(updateRes.status, 200);
  const updatedRequired = updateBody.requiredEngineers ?? updateBody.assignment?.requiredEngineers;
  assert.strictEqual(updatedRequired, 2);
});

test("duplicate creates new assignment and conflicts are detected", async (t) => {
  const app = await buildApp();
  const server = await listen(app);
  t.after(() => server.close());
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}/api/schedule`;

  const state = getScheduleState();
  const originalId = state.assignments[0]?.id as string;
  assert.ok(originalId);

  const dupRes = await fetch(`${baseUrl}/assignments/${originalId}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ engineerId: state.engineers[0]?.id, engineerName: state.engineers[0]?.name }),
  });
  const dupBody = await dupRes.json();
  assert.strictEqual(dupRes.status, 200);
  assert.notStrictEqual(dupBody.assignment.id, originalId);

  const conflicts = dupBody.conflicts as any[];
  assert.ok(conflicts.length > 0, "conflict should be reported for overlapping duplicates");
});

test("schedule assignment insert schema validates required fields", () => {
  const now = new Date();
  const payload = {
    organizationId: "11111111-1111-1111-1111-111111111111",
    jobId: "22222222-2222-2222-2222-222222222222",
    engineerUserId: "eng-1",
    startsAt: now,
    endsAt: new Date(now.getTime() + 60 * 60 * 1000),
  };

  assert.doesNotThrow(() => insertScheduleAssignmentSchema.parse(payload));

  assert.throws(
    () => insertScheduleAssignmentSchema.parse({ ...payload, jobId: undefined }),
    /jobId/,
  );
});
