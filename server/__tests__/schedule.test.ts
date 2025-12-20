import assert from "node:assert";
import test from "node:test";
import express from "express";
import { buildScheduleRouter } from "../scheduleRoutes";
import { getScheduleState } from "../lib/scheduleAssignments";

const listen = (app: express.Express) => {
  return new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).user = { claims: { sub: "dev-user" } };
    (req as any).isAuthenticated = () => true;
    next();
  });
  app.use("/api/schedule", buildScheduleRouter());
  return app;
}

test("can create and update schedule assignments", async (t) => {
  const app = buildApp();
  const server = await listen(app);
  t.after(() => server.close());
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}/api/schedule`;

  const createRes = await fetch(`${baseUrl}/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: "job-9",
      jobTitle: "Demo",
      engineerId: "eng-1",
      engineerName: "Alex Engineer",
      start: new Date().toISOString(),
      end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }),
  });
  const createBody = await createRes.json();
  assert.strictEqual(createRes.status, 200);
  assert.ok(createBody.assignment?.id);

  const updateRes = await fetch(`${baseUrl}/assignments/${createBody.assignment.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "in_progress" }),
  });
  const updateBody = await updateRes.json();
  assert.strictEqual(updateRes.status, 200);
  assert.strictEqual(updateBody.assignment.status, "in_progress");
});

test("duplicate creates new assignment and conflicts are detected", async (t) => {
  const app = buildApp();
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
