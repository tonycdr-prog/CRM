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
  const body = (await response.json()) as { ok: boolean; claims: any };

  assert.strictEqual(response.status, 200);
  assert.strictEqual(body.ok, true);
  assert.strictEqual(body.claims.sub, "dev-user");
  assert.strictEqual(body.claims.email, "dev@local");
});
