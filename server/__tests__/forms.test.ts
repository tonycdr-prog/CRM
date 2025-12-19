import assert from "node:assert";
import test from "node:test";
import express from "express";
import { createFormsRouter } from "../formsRoutes";
import { InMemoryFormsRepository } from "../lib/forms";

const listen = (app: express.Express) => {
  return new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
};

function buildApp(repository = new InMemoryFormsRepository()) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).user = { claims: { sub: "user-1", exp: Date.now() + 1000, organizationId: "org-1" } };
    next();
  });
  app.use("/api/forms", createFormsRouter({ repository }));
  return app;
}

async function createTemplate(baseUrl: string) {
  const res = await fetch(`${baseUrl}/templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Safety", description: "Base", organizationId: "org-1" }),
  });
  assert.strictEqual(res.status, 201);
  const body = await res.json();
  return body.template.id as string;
}

test("form builder and runner happy path", async (t) => {
  const repository = new InMemoryFormsRepository();
  const app = buildApp(repository);
  const server = await listen(app);
  t.after(() => server.close());

  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  const baseUrl = `http://127.0.0.1:${port}/api/forms`;

  const templateId = await createTemplate(baseUrl);

  const versionRes = await fetch(`${baseUrl}/templates/${templateId}/versions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "v1",
      entities: [
        {
          title: "Checklist",
          fields: [
            { id: "result", label: "Result", type: "text", required: true },
            { id: "ok", label: "Pass", type: "boolean" },
          ],
        },
      ],
    }),
  });
  assert.strictEqual(versionRes.status, 201);
  const versionBody = await versionRes.json();
  const versionId = versionBody.version.id as string;

  const publishRes = await fetch(`${baseUrl}/versions/${versionId}/publish`, { method: "POST" });
  assert.strictEqual(publishRes.status, 200);

  const submissionRes = await fetch(`${baseUrl}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: "job-1", formVersionId: versionId, organizationId: "org-1" }),
  });
  assert.strictEqual(submissionRes.status, 201);
  const submissionBody = await submissionRes.json();
  const submissionId = submissionBody.submission.id as string;
  const entityInstanceId = submissionBody.submission.entities?.[0]?.id as string;
  assert.ok(entityInstanceId);

  const answerRes = await fetch(`${baseUrl}/submissions/${submissionId}/entities/${entityInstanceId}/answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers: { result: "Completed", ok: true } }),
  });
  assert.strictEqual(answerRes.status, 200);

  const submitRes = await fetch(`${baseUrl}/submissions/${submissionId}/submit`, { method: "POST" });
  assert.strictEqual(submitRes.status, 200);
  const submitBody = await submitRes.json();
  assert.strictEqual(submitBody.submission.status, "submitted");
});

test("cannot edit published version", async (t) => {
  const repository = new InMemoryFormsRepository();
  const app = buildApp(repository);
  const server = await listen(app);
  t.after(() => server.close());

  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  const baseUrl = `http://127.0.0.1:${port}/api/forms`;

  const templateId = await createTemplate(baseUrl);
  const versionRes = await fetch(`${baseUrl}/templates/${templateId}/versions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "v1" }),
  });
  assert.strictEqual(versionRes.status, 201);
  const versionBody = await versionRes.json();
  const versionId = versionBody.version.id as string;

  const publishRes = await fetch(`${baseUrl}/versions/${versionId}/publish`, { method: "POST" });
  assert.strictEqual(publishRes.status, 200);

  const entityRes = await fetch(`${baseUrl}/versions/${versionId}/entities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "After publish",
      definition: {
        title: "After publish",
        fields: [{ id: "late", label: "Late", type: "text" }],
      },
    }),
  });
  assert.strictEqual(entityRes.status, 400);
});
