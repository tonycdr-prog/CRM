import type { Request } from "express";
import { and, eq } from "drizzle-orm";
import { jobs } from "../../shared/schema";
import { db } from "../db";

export function getOrgId(req: Request): string {
  const user = req.user as any;
  const orgId = user?.organizationId || user?.claims?.organizationId;
  if (!orgId) {
    const err: any = new Error("No organization context");
    err.status = 403;
    throw err;
  }
  return String(orgId);
}

export function getUserId(req: Request): string {
  const user = req.user as any;
  return String(user?.claims?.sub ?? user?.id);
}

export async function assertJobAccess(jobId: string, organizationId: string) {
  const job = await db.query.jobs.findFirst({
    where: (t, { and, eq }) => and(eq(t.id, jobId), eq(t.organizationId, organizationId)),
  });
  if (!job) {
    const err: any = new Error("Job not found");
    err.status = 404;
    throw err;
  }
  return job;
}
