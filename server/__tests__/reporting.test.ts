import assert from "node:assert";
import test from "node:test";
import express from "express";
import { createReportingRouter } from "../reportingRoutes";
import { InMemoryFormsRepository } from "../lib/forms";
import { InMemoryReportingRepository } from "../lib/reporting";

type ServerInstance = ReturnType<express.Express["listen"]>;

const listen = (app: express.Express) =>
  new Promise<ServerInstance>((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });

async function seedSubmission(formsRepo: InMemoryFormsRepository, opts?: { systemTypeCode?: string }) {
  const template = await formsRepo.createTemplate({
    name: "Report Template",
    description: "For reporting",
    organizationId: "org-1",
    createdByUserId: "user-1",
  });
  const version = await formsRepo.createVersion(template.id, "user-1", {
    title: "v1",
    templateId: template.id,
    createdByUserId: "user-1",
    definition: { entities: [], systemTypeCode: opts?.systemTypeCode },
  });
  await formsRepo.addEntity(version.id, "user-1", {
    formVersionId: version.id,
    title: "Fan Run",
    description: "",
    sortOrder: 0,
    definition: {
      title: "Fan Run",
      description: "",
      repeatPerAsset: false,
      sortOrder: 0,
      fields: [{ id: "ok", label: "OK", type: "boolean", required: true }],
    },
    createdByUserId: "user-1",
  } as any);
  await formsRepo.publishVersion(version.id, "user-1");
  const submission = await formsRepo.createSubmission({
    formVersionId: version.id,
    jobId: "job-report",
    organizationId: "org-1",
    createdByUserId: "user-1",
  }, "user-1");
  return submission;
}

test("creates a report and stores signature hash", async (t) => {
  const formsRepo = new InMemoryFormsRepository();
  const reportingRepo = new InMemoryReportingRepository(formsRepo);
  const submission = await seedSubmission(formsRepo);

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).user = { claims: { sub: "user-1", exp: Date.now() + 1000, organizationId: "org-1" } };
    next();
  });
  app.use("/api", createReportingRouter({ repository: reportingRepo, formsRepository: formsRepo }));
  const server = await listen(app);
  t.after(() => server.close());
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  const createRes = await fetch(`${baseUrl}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submissionId: submission.id, reportType: "internal" }),
  });
  assert.strictEqual(createRes.status, 201);
  const created = await createRes.json();
  assert.ok(created.report?.id);

  const signRes = await fetch(`${baseUrl}/reports/${created.report.id}/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "engineer" }),
  });
  assert.strictEqual(signRes.status, 201);
  const signatureBody = await signRes.json();
  assert.ok(signatureBody.signature?.payloadHash);
});

test("flags missing required entities for system type", async (t) => {
  const formsRepo = new InMemoryFormsRepository();
  const reportingRepo = new InMemoryReportingRepository(formsRepo);
  const submission = await seedSubmission(formsRepo, { systemTypeCode: "PSS" });

  // remove one required entity by not adding the rest
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).user = { claims: { sub: "user-1", exp: Date.now() + 1000, organizationId: "org-1" } };
    next();
  });
  app.use("/api", createReportingRouter({ repository: reportingRepo, formsRepository: formsRepo }));
  const server = await listen(app);
  t.after(() => server.close());
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  const createRes = await fetch(`${baseUrl}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submissionId: submission.id, reportType: "internal" }),
  });
  const created = await createRes.json();
  const reportId = created.report.id as string;

  const getRes = await fetch(`${baseUrl}/reports/${reportId}`);
  assert.strictEqual(getRes.status, 200);
  const body = await getRes.json();
  assert.ok(body.report.payloadJson.systemSummary.missingEntities.length >= 1);
});

test("defect CRUD and remedials", async (t) => {
  const formsRepo = new InMemoryFormsRepository();
  const reportingRepo = new InMemoryReportingRepository(formsRepo);
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).user = { claims: { sub: "user-1", exp: Date.now() + 1000, organizationId: "org-1" } };
    next();
  });
  app.use("/api", createReportingRouter({ repository: reportingRepo, formsRepository: formsRepo }));
  const server = await listen(app);
  t.after(() => server.close());
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  const createRes = await fetch(`${baseUrl}/defects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: "job-1", description: "Loose damper", severity: "high", status: "open" }),
  });
  assert.strictEqual(createRes.status, 201);
  const created = await createRes.json();
  const defectId = created.defect.id as string;

  const remedialRes = await fetch(`${baseUrl}/defects/${defectId}/remedials`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes: "Isolate circuit" }),
  });
  assert.strictEqual(remedialRes.status, 201);

  const listRes = await fetch(`${baseUrl}/defects?jobId=job-1`);
  assert.strictEqual(listRes.status, 200);
  const listBody = await listRes.json();
  assert.ok(Array.isArray(listBody.defects));
  const [first] = listBody.defects;
  assert.ok(first.remedials?.length);
});
