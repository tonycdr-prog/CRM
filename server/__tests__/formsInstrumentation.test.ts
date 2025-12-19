import assert from "node:assert";
import test from "node:test";
import express from "express";
import { createFormsRouter, createMetersRouter } from "../formsRoutes";
import { InMemoryFormsRepository } from "../lib/forms";

type ServerInstance = ReturnType<express.Express["listen"]>;

const listen = (app: express.Express) =>
  new Promise<ServerInstance>((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });

function buildApp(repository = new InMemoryFormsRepository()) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).user = { claims: { sub: "user-1", exp: Date.now() + 1000, organizationId: "org-1" } };
    next();
  });
  app.use("/api/forms", createFormsRouter({ repository }));
  app.use("/api/meters", createMetersRouter({ repository }));
  return app;
}

async function createTemplate(baseUrl: string) {
  const res = await fetch(`${baseUrl}/templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Instrumentation", description: "With readings", organizationId: "org-1" }),
  });
  assert.strictEqual(res.status, 201);
  const body = await res.json();
  return body.template.id as string;
}

async function createPublishedVersion(baseUrl: string, templateId: string) {
  const versionRes = await fetch(`${baseUrl}/templates/${templateId}/versions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "v1",
      entities: [
        {
          title: "Gauge Reading",
          fields: [{ id: "reading", label: "Reading", type: "number", required: true }],
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

test("records a reading with meter and engineer linkage", async (t) => {
  const repository = new InMemoryFormsRepository();
  const app = buildApp(repository);
  const server = await listen(app);
  t.after(() => server.close());
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  const formsUrl = `http://127.0.0.1:${port}/api/forms`;
  const metersUrl = `http://127.0.0.1:${port}/api/meters`;

  const templateId = await createTemplate(formsUrl);
  const versionId = await createPublishedVersion(formsUrl, templateId);

  const meterRes = await fetch(metersUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Meter A", organizationId: "org-1" }),
  });
  assert.strictEqual(meterRes.status, 201);
  const meterBody = await meterRes.json();
  const meterId = meterBody.meter.id as string;

  const calibrationRes = await fetch(`${metersUrl}/${meterId}/calibrations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ calibratedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString() }),
  });
  assert.strictEqual(calibrationRes.status, 201);
  const calibrationBody = await calibrationRes.json();
  const calibrationId = calibrationBody.calibration.id as string;

  const submissionRes = await fetch(`${formsUrl}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: "job-meter-1", formVersionId: versionId, organizationId: "org-1" }),
  });
  assert.strictEqual(submissionRes.status, 201);
  const submissionBody = await submissionRes.json();
  const instanceId = submissionBody.submission.entities[0].id as string;

  const readingRes = await fetch(`${formsUrl}/entity-instances/${instanceId}/readings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meterId, calibrationId, reading: { value: 3.2 } }),
  });
  assert.strictEqual(readingRes.status, 201);
  const readingBody = await readingRes.json();
  assert.ok(readingBody.reading);
  assert.strictEqual(readingBody.reading.recordedByUserId, "user-1");

  const loadRes = await fetch(`${formsUrl}/submissions/${submissionBody.submission.id}`);
  assert.strictEqual(loadRes.status, 200);
  const loadBody = await loadRes.json();
  assert.ok(Array.isArray(loadBody.submission.readings));
  assert.strictEqual(loadBody.submission.readings[0].meterId, meterId);
});

test("warns on expired calibration when not blocking", async (t) => {
  const prior = process.env.FORMS_BLOCK_EXPIRED_CALIBRATION;
  process.env.FORMS_BLOCK_EXPIRED_CALIBRATION = "false";
  const repository = new InMemoryFormsRepository();
  const app = buildApp(repository);
  const server = await listen(app);
  t.after(() => {
    server.close();
    process.env.FORMS_BLOCK_EXPIRED_CALIBRATION = prior;
  });
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  const formsUrl = `http://127.0.0.1:${port}/api/forms`;
  const metersUrl = `http://127.0.0.1:${port}/api/meters`;

  const templateId = await createTemplate(formsUrl);
  const versionId = await createPublishedVersion(formsUrl, templateId);

  const meterRes = await fetch(metersUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Meter B", organizationId: "org-1" }),
  });
  assert.strictEqual(meterRes.status, 201);
  const meterId = (await meterRes.json()).meter.id as string;

  const calibrationRes = await fetch(`${metersUrl}/${meterId}/calibrations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ calibratedAt: new Date().toISOString(), expiresAt: new Date(Date.now() - 86400000).toISOString() }),
  });
  assert.strictEqual(calibrationRes.status, 201);
  const calibrationId = (await calibrationRes.json()).calibration.id as string;

  const submissionRes = await fetch(`${formsUrl}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: "job-meter-2", formVersionId: versionId, organizationId: "org-1" }),
  });
  const submissionBody = await submissionRes.json();
  const instanceId = submissionBody.submission.entities[0].id as string;

  const readingRes = await fetch(`${formsUrl}/entity-instances/${instanceId}/readings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meterId, calibrationId, reading: { value: 1.1 } }),
  });
  assert.strictEqual(readingRes.status, 200);
  const readingBody = await readingRes.json();
  assert.ok(Array.isArray(readingBody.warnings));
  assert.ok(readingBody.warnings[0].includes("Calibration expired"));
});

test("blocks expired calibration when enforcement is enabled", async (t) => {
  const prior = process.env.FORMS_BLOCK_EXPIRED_CALIBRATION;
  process.env.FORMS_BLOCK_EXPIRED_CALIBRATION = "true";
  const repository = new InMemoryFormsRepository();
  const app = buildApp(repository);
  const server = await listen(app);
  t.after(() => {
    server.close();
    process.env.FORMS_BLOCK_EXPIRED_CALIBRATION = prior;
  });
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  const formsUrl = `http://127.0.0.1:${port}/api/forms`;
  const metersUrl = `http://127.0.0.1:${port}/api/meters`;

  const templateId = await createTemplate(formsUrl);
  const versionId = await createPublishedVersion(formsUrl, templateId);

  const meterRes = await fetch(metersUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Meter C", organizationId: "org-1" }),
  });
  const meterId = (await meterRes.json()).meter.id as string;

  const calibrationRes = await fetch(`${metersUrl}/${meterId}/calibrations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ calibratedAt: new Date().toISOString(), expiresAt: new Date(Date.now() - 3600000).toISOString() }),
  });
  const calibrationId = (await calibrationRes.json()).calibration.id as string;

  const submissionRes = await fetch(`${formsUrl}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: "job-meter-3", formVersionId: versionId, organizationId: "org-1" }),
  });
  const submissionBody = await submissionRes.json();
  const instanceId = submissionBody.submission.entities[0].id as string;

  const readingRes = await fetch(`${formsUrl}/entity-instances/${instanceId}/readings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meterId, calibrationId, reading: { value: 5.5 } }),
  });
  assert.strictEqual(readingRes.status, 400);
});
