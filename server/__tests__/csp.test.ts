import assert from "node:assert";
import test from "node:test";
import { buildContentSecurityPolicyDirectives } from "../security";

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
