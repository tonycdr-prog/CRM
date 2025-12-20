import assert from "node:assert";
import test from "node:test";
import express from "express";
import { buildContentSecurityPolicyDirectives, createSecurityHeaders } from "../security";

const listen = (app: express.Express) => {
  return new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
};

test("dev CSP relaxes script restrictions for Vite", () => {
  const directives = buildContentSecurityPolicyDirectives(true);
  assert.deepStrictEqual(directives["script-src"], ["'self'", "'unsafe-inline'", "'unsafe-eval'"]);
  assert.ok(directives["connect-src"].includes("ws:"));
});

test("production CSP stays strict without inline/eval", () => {
  const directives = buildContentSecurityPolicyDirectives(false);
  assert.deepStrictEqual(directives["script-src"], ["'self'"]);
  assert.ok(directives["connect-src"].includes("ws:"));
});

test("securityHeaders emits relaxed CSP in development", async (t) => {
  const app = express();
  app.use(createSecurityHeaders("development"));
  app.get("/", (_req, res) => res.send("ok"));

  const server = await listen(app);
  t.after(() => server.close());

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const response = await fetch(`http://127.0.0.1:${port}/`);
  const csp = response.headers.get("content-security-policy") ?? "";

  assert.match(csp, /script-src 'self' 'unsafe-inline' 'unsafe-eval'/);
});

test("securityHeaders stays strict outside development", async (t) => {
  const app = express();
  app.use(createSecurityHeaders("production"));
  app.get("/", (_req, res) => res.send("ok"));

  const server = await listen(app);
  t.after(() => server.close());

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const response = await fetch(`http://127.0.0.1:${port}/`);
  const csp = response.headers.get("content-security-policy") ?? "";

  assert.match(csp, /script-src 'self'/);
  assert.ok(!csp.includes("unsafe-inline"));
});
