import assert from "node:assert";
import { test } from "node:test";
import { MODULES, MODULE_LABELS, MODULE_TAGLINES, getModuleList } from "@shared/modules";
import { MODULE_NAV, getModulesList } from "../../client/src/lib/modules.ts";
import { getEnabledModuleIds } from "../lib/modules";
import { resolveEnabledModules } from "../../client/src/lib/module-overrides.ts";

test("life safety module constants are defined", () => {
  assert.strictEqual(MODULES.LIFE_SAFETY, "life-safety");
  assert.ok(MODULE_LABELS[MODULES.LIFE_SAFETY]);
  assert.ok(MODULE_TAGLINES[MODULES.LIFE_SAFETY]?.includes("Life Safety Ops"));
});

test("module nav exposes Life Safety Ops links", () => {
  const nav = MODULE_NAV[MODULES.LIFE_SAFETY];
  assert.ok(nav, "Life Safety Ops nav should be present");
  const paths = nav.links.map((link) => link.path);
  [
    "/dashboard",
    "/hub/forms",
    "/forms/builder",
    "/forms/runner",
    "/admin/smoke-control",
    "/reports",
    "/defects",
    "/schedule",
    "/finance",
  ].forEach((requiredPath) => {
    assert.ok(paths.includes(requiredPath), `expected ${requiredPath} in module links`);
  });
});

test("modules list contains Life Safety Ops entry", () => {
  const modules = getModulesList();
  assert.ok(modules.find((m) => m.id === MODULES.LIFE_SAFETY));
});

test("env flags can disable modules", () => {
  const original = process.env.ENABLE_MODULE_SCHEDULING;
  process.env.ENABLE_MODULE_SCHEDULING = "false";
  const ids = getEnabledModuleIds(true);
  assert.ok(!ids.includes(MODULES.SCHEDULING));
  process.env.ENABLE_MODULE_SCHEDULING = original;
});

test("module list exposes new definitions", () => {
  const list = getModuleList();
  assert.ok(list.find((m) => m.id === MODULES.SCHEDULING));
  assert.ok(list.find((m) => m.id === MODULES.FINANCE));
  assert.ok(list.find((m) => m.id === MODULES.REPORTING));
  assert.ok(list.find((m) => m.id === MODULES.ASSET_MANAGEMENT));
  assert.ok(list.find((m) => m.id === MODULES.COMPLIANCE));
  assert.ok(list.find((m) => m.id === MODULES.FORMS_ENGINE));
});

test("module definitions include ownership metadata", () => {
  const lifeSafety = getModuleList().find((m) => m.id === MODULES.LIFE_SAFETY);
  assert.ok(lifeSafety, "Life Safety Ops module should exist");
  assert.strictEqual(lifeSafety?.key, MODULES.LIFE_SAFETY);
  assert.ok(lifeSafety?.ownsRoutes.length);
  assert.ok(Array.isArray(lifeSafety?.ownsWidgets));
  assert.ok(Array.isArray(lifeSafety?.ownsSidebarSections));
});

test("module overrides can toggle modules in dev", () => {
  const resolved = resolveEnabledModules({
    status: { isDev: true, devReviewMode: true },
    overrides: { [MODULES.SCHEDULING]: false },
  });
  assert.ok(!resolved.find((m) => m.id === MODULES.SCHEDULING));
  const reenabled = resolveEnabledModules({
    status: { isDev: true, devReviewMode: true },
    overrides: { [MODULES.SCHEDULING]: true },
  });
  assert.ok(reenabled.find((m) => m.id === MODULES.SCHEDULING));
});
