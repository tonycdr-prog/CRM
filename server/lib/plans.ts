export type PlanKey = "free" | "pro" | "enterprise";

export const PLAN_LIMITS: Record<PlanKey, {
  jobsPerMonth: number;
  maxTemplates: number;
  maxEntities: number;
  maxStorageBytes: number;
  pdfEnabled: boolean;
}> = {
  free: {
    jobsPerMonth: 20,
    maxTemplates: 3,
    maxEntities: 10,
    maxStorageBytes: 500 * 1024 * 1024, // 500MB
    pdfEnabled: false,
  },
  pro: {
    jobsPerMonth: 500,
    maxTemplates: 50,
    maxEntities: 500,
    maxStorageBytes: 20 * 1024 * 1024 * 1024, // 20GB
    pdfEnabled: true,
  },
  enterprise: {
    jobsPerMonth: 999999,
    maxTemplates: 999999,
    maxEntities: 999999,
    maxStorageBytes: 999999999999,
    pdfEnabled: true,
  },
};

export function currentMonthKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
