import assert from "node:assert";
import test from "node:test";
import express from "express";
import { isAuthenticated } from "../replitAuth";

const listen = (app: express.Express) => {
  return new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
};

test("DEV auth bypass allows access without OIDC", async (t) => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalBypass = process.env.DEV_AUTH_BYPASS;

  process.env.NODE_ENV = "development";
  process.env.DEV_AUTH_BYPASS = "true";

  const app = express();
  app.get("/api/protected", isAuthenticated, (req, res) => {
    res.json({
      ok: true,
      claims: (req.user as any)?.claims,
      authenticated: req.isAuthenticated(),
    });
  });

  const server = await listen(app);
  t.after(() => {
    server.close();
    process.env.NODE_ENV = originalNodeEnv;
    process.env.DEV_AUTH_BYPASS = originalBypass;
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const response = await fetch(`http://127.0.0.1:${port}/api/protected`);
  const body = (await response.json()) as { ok: boolean; claims: any; authenticated: boolean };

  assert.strictEqual(response.status, 200);
  assert.strictEqual(body.ok, true);
  assert.strictEqual(body.claims.sub, "dev-user");
  assert.strictEqual(body.claims.email, "dev@local");
  assert.strictEqual(body.authenticated, true);
});

test("server boots without database in dev bypass mode", async (t) => {
  const originalEnv = {
    NODE_ENV: process.env.NODE_ENV,
    DEV_AUTH_BYPASS: process.env.DEV_AUTH_BYPASS,
    SESSION_SECRET: process.env.SESSION_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
  };

  process.env.NODE_ENV = "development";
  process.env.DEV_AUTH_BYPASS = "true";
  process.env.SESSION_SECRET = "dev";
  delete process.env.DATABASE_URL;

  const { registerRoutes } = await import("../routes");
  const app = express();
  const server = await registerRoutes(app);
  const listener = await new Promise<ReturnType<typeof server.listen>>((resolve) => {
    const srv = server.listen(0, () => resolve(srv));
  });

  t.after(() => {
    listener.close();
    process.env.NODE_ENV = originalEnv.NODE_ENV;
    process.env.DEV_AUTH_BYPASS = originalEnv.DEV_AUTH_BYPASS;
    process.env.SESSION_SECRET = originalEnv.SESSION_SECRET;
    if (originalEnv.DATABASE_URL) {
      process.env.DATABASE_URL = originalEnv.DATABASE_URL;
    }
  });

  const address = listener.address();
  const port = typeof address === "object" && address ? address.port : 0;

  const statusResponse = await fetch(`http://127.0.0.1:${port}/api/dev/status`);
  const status = (await statusResponse.json()) as {
    devAuthBypass: boolean;
    hasDbConnection: boolean;
    limitedMode: boolean;
  };

  assert.strictEqual(statusResponse.status, 200);
  assert.strictEqual(status.devAuthBypass, true);
  assert.strictEqual(status.hasDbConnection, false);
  assert.strictEqual(status.limitedMode, true);

  const layoutResponse = await fetch(`http://127.0.0.1:${port}/api/dashboard/layout`);
  assert.strictEqual(layoutResponse.status, 200);
});

test("dev seed endpoint is guarded and fails gracefully without db", async (t) => {
  const originalEnv = {
    NODE_ENV: process.env.NODE_ENV,
    DEV_AUTH_BYPASS: process.env.DEV_AUTH_BYPASS,
    SESSION_SECRET: process.env.SESSION_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    SEED_DEMO: process.env.SEED_DEMO,
  };

  process.env.NODE_ENV = "development";
  process.env.DEV_AUTH_BYPASS = "true";
  process.env.SESSION_SECRET = "dev";
  process.env.SEED_DEMO = "true";
  delete process.env.DATABASE_URL;

  const { registerRoutes } = await import("../routes");
  const app = express();
  const server = await registerRoutes(app);
  const listener = await new Promise<ReturnType<typeof server.listen>>((resolve) => {
    const srv = server.listen(0, () => resolve(srv));
  });

  t.after(() => {
    listener.close();
    process.env.NODE_ENV = originalEnv.NODE_ENV;
    process.env.DEV_AUTH_BYPASS = originalEnv.DEV_AUTH_BYPASS;
    process.env.SESSION_SECRET = originalEnv.SESSION_SECRET;
    process.env.SEED_DEMO = originalEnv.SEED_DEMO;
    if (originalEnv.DATABASE_URL) {
      process.env.DATABASE_URL = originalEnv.DATABASE_URL;
    }
  });

  const address = listener.address();
  const port = typeof address === "object" && address ? address.port : 0;

  const response = await fetch(`http://127.0.0.1:${port}/api/dev/seed-demo`, { method: "POST" });
  assert.strictEqual(response.status, 503);
  const body = (await response.json()) as { message: string };
  assert.ok(body.message.includes("Database unavailable"));
});
