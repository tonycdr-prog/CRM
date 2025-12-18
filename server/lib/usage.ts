import { organizationPlans, organizationUsage } from "@shared/schema";
import { PLAN_LIMITS, currentMonthKey, PlanKey } from "./plans";
import { eq } from "drizzle-orm";

export async function getOrgPlanAndUsage(db: any, organizationId: string) {
  const planRow = await db
    .select()
    .from(organizationPlans)
    .where(eq(organizationPlans.organizationId, organizationId))
    .limit(1);

  const plan = (planRow[0]?.plan ?? "free") as PlanKey;

  let usage = await db
    .select()
    .from(organizationUsage)
    .where(eq(organizationUsage.organizationId, organizationId))
    .limit(1);

  if (!usage.length) {
    await db.insert(organizationUsage).values({
      organizationId,
      jobsThisMonth: 0,
      jobsMonthKey: currentMonthKey(),
      totalTemplates: 0,
      totalEntities: 0,
      storageBytes: 0,
    });
    usage = await db
      .select()
      .from(organizationUsage)
      .where(eq(organizationUsage.organizationId, organizationId))
      .limit(1);
  }

  // Reset monthly jobs counter if month changed
  if (usage[0].jobsMonthKey !== currentMonthKey()) {
    await db
      .update(organizationUsage)
      .set({
        jobsThisMonth: 0,
        jobsMonthKey: currentMonthKey(),
        updatedAt: new Date(),
      })
      .where(eq(organizationUsage.organizationId, organizationId));

    usage[0].jobsThisMonth = 0;
    usage[0].jobsMonthKey = currentMonthKey();
  }

  return { plan, limits: PLAN_LIMITS[plan], usage: usage[0] };
}

export function enforce(condition: boolean, message: string) {
  if (!condition) {
    const err: any = new Error(message);
    err.status = 402; // Payment Required semantics
    throw err;
  }
}
