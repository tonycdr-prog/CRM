import assert from "node:assert";
import test from "node:test";
import type { Server } from "http";

const listen = (server: Server) =>
  new Promise<Server>((resolve) => {
    const listener = server.listen(0, () => resolve(listener));
  });

test("/api/dev/seed-demo requires opt-in flag", async (t) => {
  const originalEnv = {
    NODE_ENV: process.env.NODE_ENV,
    DEV_AUTH_BYPASS: process.env.DEV_AUTH_BYPASS,
    SESSION_SECRET: process.env.SESSION_SECRET,
    SEED_DEMO: process.env.SEED_DEMO,
  };

  process.env.NODE_ENV = "development";
  process.env.DEV_AUTH_BYPASS = "true";
  process.env.SESSION_SECRET = "dev";
  delete process.env.SEED_DEMO;

  const { registerRoutes } = await import("../routes");
  const server = await registerRoutes((await import("express")).default());
  const listener = await listen(server);

  t.after(() => {
    listener.close();
    process.env.NODE_ENV = originalEnv.NODE_ENV;
    process.env.DEV_AUTH_BYPASS = originalEnv.DEV_AUTH_BYPASS;
    process.env.SESSION_SECRET = originalEnv.SESSION_SECRET;
    if (originalEnv.SEED_DEMO) process.env.SEED_DEMO = originalEnv.SEED_DEMO;
  });

  const address = listener.address();
  const port = typeof address === "object" && address ? address.port : 0;

  const res = await fetch(`http://127.0.0.1:${port}/api/dev/seed-demo`, {
    method: "POST",
  });

  assert.strictEqual(res.status, 400);
  const body = (await res.json()) as { message?: string };
  assert.ok(body.message?.includes("SEED_DEMO"));
});
