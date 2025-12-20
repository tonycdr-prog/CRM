import assert from "node:assert";
import test from "node:test";
import { shouldServeSpaRoute } from "../vite";

test("spa fallback allows api and static routes to pass through", () => {
  assert.strictEqual(shouldServeSpaRoute("/api/health"), false);
  assert.strictEqual(shouldServeSpaRoute("/assets/main.js"), false);
  assert.strictEqual(shouldServeSpaRoute("/service-worker.js"), false);
  assert.strictEqual(shouldServeSpaRoute("/uploads/example.pdf"), false);
});

test("spa fallback serves index for client routes without extensions", () => {
  assert.strictEqual(shouldServeSpaRoute("/dashboard"), true);
  assert.strictEqual(shouldServeSpaRoute("/forms-runner/123"), true);
});

test("spa fallback requires html accept header", () => {
  assert.strictEqual(
    shouldServeSpaRoute({ originalUrl: "/dashboard", headers: { accept: "application/json" } }),
    false,
  );
  assert.strictEqual(
    shouldServeSpaRoute({ originalUrl: "/dashboard", headers: { accept: "text/html" } }),
    true,
  );
});
