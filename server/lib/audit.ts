// server/lib/audit.ts
import { auditEvents } from "@shared/schema";
import type { InferInsertModel } from "drizzle-orm";

export type AuditInsert = Omit<InferInsertModel<typeof auditEvents>, "id" | "createdAt">;

export async function logAudit(db: any, event: AuditInsert) {
  try {
    await db.insert(auditEvents).values(event);
  } catch {
    // never break the app due to audit failures
  }
}
