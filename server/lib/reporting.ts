import { createHash, randomUUID } from "crypto";
import { and, eq, inArray } from "drizzle-orm";
import {
  auditLogs,
  defects,
  formTemplateSystemTypes,
  insertAuditLogSchema,
  insertDefectSchema,
  insertOpsReportSchema,
  insertReportSignatureSchema,
  insertRemedialSchema,
  reportSignatures,
  reports,
  remedials,
  systemTypes,
  type DbDefect,
  type DbRemedial,
  type DbOpsReport,
  type DbReportSignature,
} from "@shared/schema";
import { DbFormsRepository, FormsRepository, InMemoryFormsRepository, type FormVersionRecord } from "./forms";
import { z } from "zod";

let cachedDb: typeof import("../db")["db"] | null = null;
async function getDb() {
  if (!cachedDb) {
    cachedDb = (await import("../db")).db;
  }
  return cachedDb;
}

export type ReportPayload = {
  reportType: string;
  submissionId: string;
  jobId: string;
  organizationId?: string;
  status: string;
  perAsset: Array<{
    assetId: string | null;
    label: string;
    location?: string | null;
    instances: Array<{
      id: string;
      entityTemplateId: string;
      title?: string | null;
      status: string;
      answers: Record<string, unknown>;
      readings: Array<{
        meterId?: string;
        calibrationId?: string;
        reading: Record<string, unknown>;
        calibration?: { expiresAt?: string | Date | null; calibratedAt?: string | Date | null } | null;
        meter?: { name?: string | null; serialNumber?: string | null } | null;
      }>;
    }>;
  }>;
  systemSummary: {
    systemTypeCode?: string | null;
    requiredEntities: string[];
    missingEntities: string[];
  };
  siteSummary: {
    totalEntities: number;
    submittedEntities: number;
  };
  warnings: string[];
};

export type ReportRecord = DbOpsReport & { payloadJson: ReportPayload };
export type ReportWithSignatures = ReportRecord & { signatures: DbReportSignature[] };
export type DefectRecord = DbDefect & { remedials?: DbRemedial[] };
export type CreateDefectInput = {
  jobId: string;
  description: string;
  severity?: string;
  status?: string;
  assetId?: string;
  entityInstanceId?: string;
  title?: string;
  discoveredDate?: string;
};

function hashPayload(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

async function resolveSystemTypeCode(version: FormVersionRecord | null, repo: FormsRepository, organizationId: string) {
  const fromDefinition = (version?.definition as any)?.systemTypeCode as string | undefined;
  if (fromDefinition) return fromDefinition;
  if (!(repo instanceof DbFormsRepository) || !version) return null;
  const db = await getDb();
  const mapping = await db
    .select({ code: systemTypes.code })
    .from(formTemplateSystemTypes)
    .innerJoin(systemTypes, eq(systemTypes.id, formTemplateSystemTypes.systemTypeId))
    .where(and(eq(formTemplateSystemTypes.templateId, version.templateId), eq(formTemplateSystemTypes.organizationId, organizationId)))
    .limit(1);
  return mapping[0]?.code ?? null;
}

async function buildReportPayload(
  repo: FormsRepository,
  submissionId: string,
  reportType: string,
): Promise<{ payload: ReportPayload; version: FormVersionRecord | null }> {
  const submission = await repo.getSubmission(submissionId);
  if (!submission) throw new Error("Submission not found");
  const versions = await repo.listPublishedVersions(submission.organizationId);
  const version = versions.find((v) => v.id === submission.formVersionId) ?? null;
  const entityById = new Map<string, any>();
  version?.entities?.forEach((entity) => entityById.set(entity.id, entity));

  const assets = await repo.listJobAssets(submission.jobId);
  const readingsByInstance = new Map<string, any[]>();
  (submission.readings ?? []).forEach((reading) => {
    const existing = readingsByInstance.get(reading.entityInstanceId) ?? [];
    existing.push(reading);
    readingsByInstance.set(reading.entityInstanceId, existing);
  });

  const generalInstances = submission.entities.filter((instance) => !instance.assetId);
  const perAsset: ReportPayload["perAsset"] = assets.map((asset) => ({
    assetId: asset.id,
    label: asset.label,
    location: asset.location,
    instances: submission.entities
      .filter((instance) => instance.assetId === asset.id)
      .map((instance) => ({
        id: instance.id,
        entityTemplateId: instance.entityTemplateId,
        title: entityById.get(instance.entityTemplateId)?.title ?? null,
        status: instance.status,
        answers: (instance as any).answers ?? {},
        readings: readingsByInstance.get(instance.id) ?? [],
      })),
  }));

  if (generalInstances.length) {
    perAsset.push({
      assetId: null,
      label: "General",
      location: null,
      instances: generalInstances.map((instance) => ({
        id: instance.id,
        entityTemplateId: instance.entityTemplateId,
        title: entityById.get(instance.entityTemplateId)?.title ?? null,
        status: instance.status,
        answers: (instance as any).answers ?? {},
        readings: readingsByInstance.get(instance.id) ?? [],
      })),
    });
  }

  const systemTypeCode = await resolveSystemTypeCode(version, repo, submission.organizationId);
  const required = systemTypeCode
    ? await repo.listSystemTypeEntities(systemTypeCode, submission.organizationId)
    : [];
  const requiredNames = required.map((entry) => entry.name);
  const missingEntities = requiredNames.filter((name) =>
    !(version?.entities ?? []).some((entity) => entity.title === name),
  );

  const payload: ReportPayload = {
    reportType,
    submissionId,
    jobId: submission.jobId,
    organizationId: submission.organizationId,
    status: submission.status,
    perAsset,
    systemSummary: {
      systemTypeCode,
      requiredEntities: requiredNames,
      missingEntities,
    },
    siteSummary: {
      totalEntities: submission.entities.length,
      submittedEntities: submission.entities.filter((entity) => entity.status === "submitted").length,
    },
    warnings: missingEntities.length ? [
      `Missing required entities: ${missingEntities.join(", ")}`,
    ] : [],
  };

  return { payload, version };
}

export interface ReportingRepository {
  createReport(input: { submissionId: string; reportType: string; userId: string }): Promise<ReportRecord>;
  getReport(id: string): Promise<ReportWithSignatures | null>;
  signReport(id: string, userId: string, role: string): Promise<DbReportSignature | null>;
  createDefect(input: CreateDefectInput, userId: string): Promise<DefectRecord>;
  listDefects(jobId?: string): Promise<DefectRecord[]>;
  updateDefect(id: string, input: Partial<DbDefect>, userId: string): Promise<DefectRecord | null>;
  addRemedial(defectId: string, input: Omit<z.input<typeof insertRemedialSchema>, "defectId">, userId: string): Promise<DbRemedial | null>;
}

export class InMemoryReportingRepository implements ReportingRepository {
  constructor(private formsRepo: FormsRepository = new InMemoryFormsRepository()) {}
  private reports = new Map<string, ReportRecord>();
  private signatures = new Map<string, DbReportSignature[]>();
  private defects = new Map<string, DefectRecord>();
  private remedials = new Map<string, DbRemedial>();

  async createReport(input: { submissionId: string; reportType: string; userId: string }): Promise<ReportRecord> {
    const { payload } = await buildReportPayload(this.formsRepo, input.submissionId, input.reportType);
    const report: ReportRecord = {
      id: randomUUID(),
      organizationId: payload.organizationId ?? (this.formsRepo as any).organizationId ?? "org-1",
      jobId: payload.jobId,
      submissionId: payload.submissionId,
      reportType: input.reportType,
      payloadJson: payload,
      status: "draft",
      createdBy: input.userId,
      createdAt: new Date(),
    } as ReportRecord;
    this.reports.set(report.id, report);
    return report;
  }

  async getReport(id: string): Promise<ReportWithSignatures | null> {
    const report = this.reports.get(id);
    if (!report) return null;
    const signatures = this.signatures.get(id) ?? [];
    return { ...report, signatures };
  }

  async signReport(id: string, userId: string, role: string): Promise<DbReportSignature | null> {
    const report = this.reports.get(id);
    if (!report) return null;
    const signature: DbReportSignature = {
      id: randomUUID(),
      reportId: id,
      signedBy: userId,
      role,
      payloadHash: hashPayload(report.payloadJson),
      signedAt: new Date(),
    } as DbReportSignature;
    const list = this.signatures.get(id) ?? [];
    list.push(signature);
    this.signatures.set(id, list);
    return signature;
  }

  async createDefect(input: CreateDefectInput, userId: string): Promise<DefectRecord> {
    const defectNumber = input.title ?? `DEF-${Date.now()}`;
    const defect: DefectRecord = {
      id: randomUUID(),
      defectNumber,
      jobId: input.jobId ?? "job-unknown",
      description: input.description ?? "",
      severity: input.severity ?? "medium",
      status: input.status ?? "open",
      discoveredDate: input.discoveredDate ?? new Date().toISOString(),
      discoveredBy: userId,
      assetId: input.assetId ?? null,
      entityInstanceId: input.entityInstanceId ?? null,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as DefectRecord;
    this.defects.set(defect.id, defect);
    return defect;
  }

  async listDefects(jobId?: string): Promise<DefectRecord[]> {
    const list = Array.from(this.defects.values());
    const filtered = jobId ? list.filter((d) => d.jobId === jobId) : list;
    return filtered.map((defect) => ({
      ...defect,
      remedials: Array.from(this.remedials.values()).filter((r) => r.defectId === defect.id),
    }));
  }

  async updateDefect(id: string, input: Partial<DbDefect>, _userId: string): Promise<DefectRecord | null> {
    const existing = this.defects.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...input, updatedAt: new Date() } as DefectRecord;
    this.defects.set(id, updated);
    return updated;
  }

  async addRemedial(defectId: string, input: Partial<DbRemedial>, userId: string): Promise<DbRemedial | null> {
    const defect = this.defects.get(defectId);
    if (!defect) return null;
    const remedial: DbRemedial = {
      id: randomUUID(),
      defectId,
      status: input.status ?? "open",
      notes: input.notes ?? null,
      createdBy: userId,
      createdAt: new Date(),
    } as DbRemedial;
    this.remedials.set(remedial.id, remedial);
    return remedial;
  }
}

export class DbReportingRepository implements ReportingRepository {
  constructor(private formsRepo: FormsRepository = new DbFormsRepository()) {}

  private async logAudit(input: z.input<typeof insertAuditLogSchema>) {
    const db = await getDb();
    await db.insert(auditLogs).values(insertAuditLogSchema.parse(input) as any).returning();
  }

  async createReport(input: { submissionId: string; reportType: string; userId: string }): Promise<ReportRecord> {
    const { payload, version } = await buildReportPayload(this.formsRepo, input.submissionId, input.reportType);
    const parsed = insertOpsReportSchema.parse({
      organizationId: payload.organizationId ?? (this.formsRepo as any).organizationId ?? "demo-org",
      jobId: payload.jobId,
      submissionId: payload.submissionId,
      reportType: input.reportType,
      payloadJson: payload,
      createdBy: input.userId,
      status: "draft",
    } as any);
    const db = await getDb();
    const [report] = await db.insert(reports).values(parsed).returning();
    await this.logAudit({
      userId: input.userId,
      entityType: "report",
      entityId: report.id,
      action: "create",
      metadata: { submissionId: payload.submissionId, systemType: (version as any)?.definition?.systemTypeCode },
    });
    return report as ReportRecord;
  }

  async getReport(id: string): Promise<ReportWithSignatures | null> {
    const db = await getDb();
    const rows = await db.select().from(reports).where(eq(reports.id, id));
    if (!rows.length) return null;
    const signatures = await db.select().from(reportSignatures).where(eq(reportSignatures.reportId, id));
    return { ...(rows[0] as ReportRecord), signatures };
  }

  async signReport(id: string, userId: string, role: string): Promise<DbReportSignature | null> {
    const db = await getDb();
    const reportRows = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
    if (!reportRows.length) return null;
    const report = reportRows[0] as ReportRecord;
    const signaturePayload = insertReportSignatureSchema.parse({
      reportId: id,
      signedBy: userId,
      role,
      payloadHash: hashPayload(report.payloadJson),
    });
    const [signature] = await db.insert(reportSignatures).values(signaturePayload).returning();
    await this.logAudit({
      userId,
      entityType: "report",
      entityId: id,
      action: "sign",
      metadata: { role },
    });
    return signature as DbReportSignature;
  }

  async createDefect(input: CreateDefectInput, userId: string): Promise<DefectRecord> {
    const defectNumber = input.title ?? `DEF-${Date.now()}`;
    const parsed = insertDefectSchema.parse({
      ...input,
      defectNumber,
      description: input.description ?? "",
      severity: input.severity ?? "medium",
      status: input.status ?? "open",
      discoveredDate: input.discoveredDate ?? new Date().toISOString(),
      discoveredBy: userId,
      createdBy: userId,
    });
    const db = await getDb();
    const [inserted] = await db.insert(defects).values(parsed as any).returning();
    await this.logAudit({
      userId,
      entityType: "defect",
      entityId: inserted.id,
      action: "create",
      metadata: { jobId: inserted.jobId, severity: inserted.severity },
    });
    return inserted as DefectRecord;
  }

  async listDefects(jobId?: string): Promise<DefectRecord[]> {
    const db = await getDb();
    const query = db.select().from(defects);
    const rows = jobId ? await query.where(eq(defects.jobId, jobId)) : await query;
    const ids = rows.map((row) => row.id);
    const remedialRows = ids.length
      ? await db.select().from(remedials).where(inArray(remedials.defectId, ids))
      : [];
    return rows.map((row) => ({
      ...(row as DefectRecord),
      remedials: remedialRows.filter((remedial) => remedial.defectId === row.id),
    }));
  }

  async updateDefect(id: string, input: Partial<DbDefect>, userId: string): Promise<DefectRecord | null> {
    const db = await getDb();
    const [updated] = await db
      .update(defects)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(defects.id, id))
      .returning();
    if (!updated) return null;
    await this.logAudit({
      userId,
      entityType: "defect",
      entityId: id,
      action: "update",
      metadata: { status: (input as any)?.status },
    });
    return updated as DefectRecord;
  }

  async addRemedial(defectId: string, input: Omit<z.input<typeof insertRemedialSchema>, "defectId">, userId: string): Promise<DbRemedial | null> {
    const db = await getDb();
    const existing = await db.select({ id: defects.id }).from(defects).where(eq(defects.id, defectId)).limit(1);
    if (!existing.length) return null;
    const parsed = insertRemedialSchema.parse({ ...input, defectId, createdBy: userId });
    const [inserted] = await db.insert(remedials).values(parsed).returning();
    await this.logAudit({
      userId,
      entityType: "remedial",
      entityId: inserted.id,
      action: "create",
      metadata: { defectId },
    });
    return inserted as DbRemedial;
  }
}

export async function buildReportPreview(repo: FormsRepository, submissionId: string, reportType: string) {
  const { payload } = await buildReportPayload(repo, submissionId, reportType);
  return payload;
}
