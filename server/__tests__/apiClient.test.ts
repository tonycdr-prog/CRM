import assert from "node:assert";
import test from "node:test";
import { apiFetch, apiRequest, ApiError } from "../../client/src/lib/queryClient";

const originalFetch = globalThis.fetch;

test("apiFetch returns parsed json and request id", async (t) => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: "ok" }), {
      status: 200,
      headers: { "content-type": "application/json", "x-request-id": "req-1" },
    });

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const { data, requestId, response } = await apiFetch("/api/example", { method: "GET" });
  assert.strictEqual(response.status, 200);
  assert.strictEqual(requestId, "req-1");
  assert.deepStrictEqual(data, { message: "ok" });
});

test("apiRequest throws ApiError with status and request id", async (t) => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json", "x-request-id": "req-401" },
    });

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  await assert.rejects(
    async () => apiRequest("GET", "/api/protected"),
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.strictEqual(err.status, 401);
      assert.strictEqual(err.requestId, "req-401");
      assert.strictEqual(err.message, "Unauthorized");
      return true;
    },
  );
});
