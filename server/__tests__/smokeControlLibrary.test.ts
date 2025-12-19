import assert from "node:assert";
import test from "node:test";
import express from "express";
import { createFormsRouter } from "../formsRoutes";
import { createSmokeControlRouter } from "../smokeControlRoutes";
import { InMemoryFormsRepository } from "../lib/forms";

const listen = (app: express.Express) =>
  new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });

function buildApp(repository = new InMemoryFormsRepository()) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).user = { claims: { sub: "user-1", exp: Date.now() + 1000, organizationId: "org-1" } };
    (req as any).session = { csrfToken: "token" };
    next();
  });
  app.use("/api/smoke-control", createSmokeControlRouter({ repository }));
  app.use("/api/forms", createFormsRouter({ repository }));
  return app;
}

test("catalog endpoints return system types and entities", async (t) => {
  const repository = new InMemoryFormsRepository();
  const app = buildApp(repository);
  const server = await listen(app);
  t.after(() => server.close());

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  const systemTypeRes = await fetch(`${baseUrl}/smoke-control/system-types`);
  assert.strictEqual(systemTypeRes.status, 200);
  const systemBody = await systemTypeRes.json();
  const codes: string[] = systemBody.systemTypes.map((s: any) => s.code);
  assert.ok(codes.includes("PSS"));
  assert.ok(codes.includes("NSS"));

  const entitiesRes = await fetch(`${baseUrl}/smoke-control/system-types/PSS/entities`);
  assert.strictEqual(entitiesRes.status, 200);
  const entitiesBody = await entitiesRes.json();
  assert.ok((entitiesBody.entities as any[]).length >= 3);
});

test("generator builds template and version per system type without duplicates", async (t) => {
  const repository = new InMemoryFormsRepository();
  const app = buildApp(repository);
  const server = await listen(app);
  t.after(() => server.close());

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}/api/forms`;

  const genRes = await fetch(`${baseUrl}/generate-from-system-type`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemTypeCode: "PSS", templateName: "PSS Smoke Template", organizationId: "org-1" }),
  });
  assert.strictEqual(genRes.status, 201);
  const genBody = await genRes.json();
  const titles = (genBody.version.entities as any[]).map((e) => e.title);
  assert.ok(titles.length >= 3);
  assert.strictEqual(new Set(titles).size, titles.length);

  const nssRes = await fetch(`${baseUrl}/generate-from-system-type`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemTypeCode: "NSS", templateName: "NSS Template", organizationId: "org-1" }),
  });
  assert.strictEqual(nssRes.status, 201);
  const nssBody = await nssRes.json();
  const nssTitles = (nssBody.version.entities as any[]).map((e) => e.title);
  assert.ok(nssTitles.length >= 2);
  assert.strictEqual(new Set(nssTitles).size, nssTitles.length);
});
