import { Router } from "express";
import { asyncHandler, AuthenticatedRequest, getUserId } from "../utils/routeHelpers";
import { getOrgId } from "../lib/access";
import { storage } from "../storage";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { organizationUsage, users } from "../../shared/schema";
import { getOrgPlanAndUsage, enforce } from "../lib/usage";

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

export function createJobsRouter() {
  const router = Router();

  router.get("/", asyncHandler(async (req, res) => {
    const { organizationId } = await requireUserOrgId(req);
    const jobs = await storage.getJobsByOrg(organizationId);
    res.json(jobs);
  }));

  router.get("/detail/:id", asyncHandler(async (req, res) => {
    const { organizationId } = await requireUserOrgId(req);
    const job = await storage.getJobByOrg(req.params.id, organizationId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  }));

  router.post("/", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const { organizationId } = await requireUserOrgId(req);

    const { limits, usage } = await getOrgPlanAndUsage(db, organizationId);
    enforce(usage.jobsThisMonth < limits.jobsPerMonth, "Monthly job limit reached");

    const job = await storage.createJob({ ...req.body, userId, organizationId });

    await db
      .update(organizationUsage)
      .set({
        jobsThisMonth: usage.jobsThisMonth + 1,
        updatedAt: new Date(),
      })
      .where(eq(organizationUsage.organizationId, organizationId));

    res.json(job);
  }));

  router.patch("/:id", asyncHandler(async (req, res) => {
    const { organizationId } = await requireUserOrgId(req);
    const job = await storage.updateJobByOrg(req.params.id, organizationId, req.body);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  }));

  router.delete("/:id", asyncHandler(async (req, res) => {
    const { organizationId } = await requireUserOrgId(req);
    const job = await storage.getJobByOrg(req.params.id, organizationId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    await storage.deleteJobByOrg(req.params.id, organizationId);
    res.json({ success: true });
  }));

  return router;
}
