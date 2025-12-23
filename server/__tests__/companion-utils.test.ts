import assert from "node:assert/strict";
import test from "node:test";
import {
  saveRunnerProgress,
  loadRunnerProgress,
  clearRunnerProgress,
} from "../../client/src/features/field-companion/runner-progress";
import { mapAuthErrorToToast } from "../../client/src/features/field-companion/errors";
import { isCompanionPath, ROUTES, buildPath } from "../../client/src/lib/routes";

const store = new Map<string, string>();
// Simple localStorage shim for Node tests
(global as any).localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
};

test("runner progress persists completion and instrument", () => {
  saveRunnerProgress("job-1", "template-1", {
    inspectionId: "insp-1",
    completion: 45,
    updatedAt: Date.now(),
    instrumentId: "mano-a12",
  });

  const loaded = loadRunnerProgress("job-1", "template-1");
  assert.equal(loaded?.inspectionId, "insp-1");
  assert.equal(loaded?.completion, 45);
  assert.equal(loaded?.instrumentId, "mano-a12");

  clearRunnerProgress("job-1", "template-1");
  assert.equal(loadRunnerProgress("job-1", "template-1"), null);
});

test("auth mapping returns toast for 401/403", () => {
  const toast401 = mapAuthErrorToToast(401);
  assert.ok(toast401);
  assert.match(toast401!.title, /Auth\/CSRF missing/);

  const toast403 = mapAuthErrorToToast(403);
  assert.ok(toast403);
  assert.equal(mapAuthErrorToToast(200), null);
});

test("companion paths include new tabs", () => {
  assert.ok(isCompanionPath(ROUTES.FIELD_COMPANION_HOME));
  assert.ok(isCompanionPath(ROUTES.FIELD_COMPANION_JOBS));
  assert.ok(isCompanionPath(ROUTES.FIELD_COMPANION_CAPTURE));
  assert.ok(isCompanionPath(ROUTES.FIELD_COMPANION_SYNC));
  assert.ok(isCompanionPath(ROUTES.FIELD_COMPANION_MORE));
  assert.ok(!isCompanionPath("/dashboard"));

  assert.equal(buildPath(ROUTES.FIELD_COMPANION_JOB, { id: "abc" }), "/field-companion/abc");
});
