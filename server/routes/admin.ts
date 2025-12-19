import { Router } from "express";
import { asyncHandler } from "../utils/routeHelpers";
import { db } from "../db";
import { eq, desc, sql } from "drizzle-orm";
import { users, serverErrors, backgroundJobs, importRuns } from "../../shared/schema";
import { getOrgPlanAndUsage } from "../lib/usage";
import { organizationPlans, organizationUsage } from "../../shared/schema";
import { streamOrgExportZip } from "../lib/zipExport";
import { JOB_OUTPUT_ROOT } from "../lib/jobsQueue";
import { dryRunImport, applyImport, ImportPayloadSchema } from "../lib/importOrg";
import fs from "fs";
import path from "path";

async function requireUserOrgId(req: any) {
  const userId = req.user?.claims?.sub;
  if (!userId) throw new Error("Missing user id");
  const u = await db
    .select({ organizationId: users.organizationId, id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u.length || !u[0].organizationId) throw new Error("Missing organization");
  return { userId, organizationId: u[0].organizationId };
}

async function requireOrgRole(req: any, allowed: Array<"owner" | "admin" | "office_staff" | "engineer" | "viewer">) {
  const userId = req.user?.claims?.sub;
  if (!userId) return { ok: false as const, status: 401 as const, message: "Unauthorized" };

  const u = await db
    .select({
      id: users.id,
      organizationId: users.organizationId,
      organizationRole: (users as any).organizationRole,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!u.length || !u[0].organizationId) {
    return { ok: false as const, status: 403 as const, message: "Missing organization" };
  }
  const role = u[0].organizationRole ?? "viewer";
  if (!allowed.includes(role as any)) {
    return { ok: false as const, status: 403 as const, message: "Insufficient permissions" };
  }
  return { ok: true as const, organizationId: u[0].organizationId, role };
}

export function createAdminRouter() {
  const router = Router();

  router.get("/usage", asyncHandler(async (req, res) => {
    const { organizationId } = await requireUserOrgId(req);
    const { plan, limits, usage } = await getOrgPlanAndUsage(db, organizationId);
    res.json({ plan, limits, usage });
  }));

  router.post("/plan", asyncHandler(async (req, res) => {
    const check = await requireOrgRole(req, ["owner", "admin"]);
    if (!check.ok) return res.status(check.status).json({ error: check.message });
    const { plan } = req.body;
    if (!["free", "pro", "enterprise"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }
    await db
      .insert(organizationPlans)
      .values({ organizationId: check.organizationId, plan, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: organizationPlans.organizationId,
        set: { plan, updatedAt: new Date() },
      });
    res.json({ success: true, plan });
  }));

  router.get("/errors", asyncHandler(async (req, res) => {
    const check = await requireOrgRole(req, ["owner", "admin"]);
    if (!check.ok) return res.status(check.status).json({ error: check.message });
    const errors = await db
      .select()
      .from(serverErrors)
      .where(eq(serverErrors.organizationId, check.organizationId))
      .orderBy(desc(serverErrors.createdAt))
      .limit(100);
    res.json(errors);
  }));

  return router;
}
