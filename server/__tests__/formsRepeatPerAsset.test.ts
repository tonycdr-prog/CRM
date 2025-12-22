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
    body: JSON.stringify({ name: "Assets", description: "With assets", organizationId: "org-1" }),
  });
  assert.strictEqual(res.status, 201);
  const body = await res.json();
  return body.template.id as string;
}

async function createPublishedVersion(baseUrl: string, templateId: string, repeatPerAsset = false) {
  const versionRes = await fetch(`${baseUrl}/templates/${templateId}/versions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "v1",
      entities: [
        {
          title: "Asset Check",
          repeatPerAsset,
          fields: [
            { id: "result", label: "Result", type: "text", required: true },
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
  return versionId;
}

test("instantiation creates one instance per asset and is idempotent", async (t) => {
  const repository = new InMemoryFormsRepository();
  repository.setJobAssets("job-asset-1", [
    { id: "asset-1", label: "Detector 1" },
    { id: "asset-2", label: "Detector 2" },
  ]);

  const app = buildApp(repository);
  const server = await listen(app);
  t.after(() => server.close());

  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  const baseUrl = `http://127.0.0.1:${port}/api/forms`;

  const templateId = await createTemplate(baseUrl);
  const versionId = await createPublishedVersion(baseUrl, templateId, true);

  const submissionRes = await fetch(`${baseUrl}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: "job-asset-1", formVersionId: versionId, organizationId: "org-1" }),
  });
  assert.strictEqual(submissionRes.status, 201);
  const submissionBody = await submissionRes.json();
  const submissionId = submissionBody.submission.id as string;

  const instantiateRes = await fetch(`${baseUrl}/submissions/${submissionId}/instantiate`, { method: "POST" });
  assert.strictEqual(instantiateRes.status, 200);
  const instantiateBody = await instantiateRes.json();
  assert.strictEqual(instantiateBody.created, 2);
  const assetInstances = (instantiateBody.submission.entities as any[]).filter((e) => e.assetId);
  assert.strictEqual(assetInstances.length, 2);
  assert.deepStrictEqual(
    assetInstances.map((e: any) => e.assetId).sort(),
    ["asset-1", "asset-2"],
  );

  const repeatInstantiate = await fetch(`${baseUrl}/submissions/${submissionId}/instantiate`, { method: "POST" });
  assert.strictEqual(repeatInstantiate.status, 200);
  const repeatBody = await repeatInstantiate.json();
  assert.strictEqual(repeatBody.created, 0);
});

test("submit warns when assets remain untested", async (t) => {
  const repository = new InMemoryFormsRepository();
  repository.setJobAssets("job-asset-2", [
    { id: "asset-1", label: "Detector 1" },
    { id: "asset-2", label: "Detector 2" },
  ]);

  const app = buildApp(repository);
  const server = await listen(app);
  t.after(() => server.close());

  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  const baseUrl = `http://127.0.0.1:${port}/api/forms`;

  const templateId = await createTemplate(baseUrl);
  const versionId = await createPublishedVersion(baseUrl, templateId, true);

  const submissionRes = await fetch(`${baseUrl}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: "job-asset-2", formVersionId: versionId, organizationId: "org-1" }),
  });
  assert.strictEqual(submissionRes.status, 201);
  const submissionBody = await submissionRes.json();
  const submissionId = submissionBody.submission.id as string;

  const instantiateRes = await fetch(`${baseUrl}/submissions/${submissionId}/instantiate`, { method: "POST" });
  assert.strictEqual(instantiateRes.status, 200);
  const instantiateBody = await instantiateRes.json();
  const firstInstance = instantiateBody.submission.entities.find((e: any) => e.assetId === "asset-1");
  assert.ok(firstInstance?.id);

  const answerRes = await fetch(
    `${baseUrl}/submissions/${submissionId}/entities/${firstInstance.id}/answers`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: { result: "Pass" } }),
    },
  );
  assert.strictEqual(answerRes.status, 200);

  const submitRes = await fetch(`${baseUrl}/submissions/${submissionId}/submit`, { method: "POST" });
  assert.strictEqual(submitRes.status, 200);
  const submitBody = await submitRes.json();
  assert.ok(Array.isArray(submitBody.warnings));
  assert.ok(submitBody.warnings.length > 0);
});
