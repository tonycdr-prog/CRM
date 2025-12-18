import { z } from "zod";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { logAudit } from "./audit";
import {
  organizationPlans,
  organizationUsage,
  formTemplates,
  formEntities,
  formEntityRows,
  formTemplateEntities,
  formTemplateSystemTypes,
  inspectionInstances,
  inspectionResponses,
  files,
  inspectionRowAttachments,
  importRuns,
} from "../../shared/schema";

export const ImportPayloadSchema = z.object({
  manifest: z.any(),
  targetOrgId: z.string().optional(),
  mode: z.enum(["dry_run", "apply"]),
  explicitOverwrite: z.boolean().optional().default(false),
  includeJobs: z.boolean().optional().default(false),
});

function countArr(x: any) {
  return Array.isArray(x) ? x.length : 0;
}

function newUuid() {
  return crypto.randomUUID();
}

export async function dryRunImport(db: any, source: any) {
  const m = source?.manifest ?? source;
  const summary = {
    sourceOrganizationId: m?.organizationId ?? null,
    exportedAt: m?.exportedAt ?? null,
    counts: {
      templates: countArr(m?.templates),
      entities: countArr(m?.entities),
      entityRows: countArr(m?.entityRows),
      templateEntities: countArr(m?.templateEntities),
      templateSystemTypes: countArr(m?.templateSystemTypes),
      inspections: countArr(m?.inspections),
      inspectionResponses: countArr(m?.inspectionResponses),
      files: countArr(m?.files),
      inspectionRowAttachments: countArr(m?.inspectionRowAttachments),
      auditEvents: countArr(m?.auditEvents),
      serverErrors: countArr(m?.serverErrors),
      jobs: countArr(m?.jobs),
      users: countArr(m?.users),
    },
    warnings: [] as string[],
  };

  if (summary.counts.jobs > 0) {
    summary.warnings.push(
      "Jobs are present in export but not imported via this endpoint. Imported inspections will have jobId set to null."
    );
  }
  if (summary.counts.inspections > 0) {
    summary.warnings.push(
      "Inspections will be imported with jobId=null; link them to jobs manually after import if needed."
    );
  }
  if (summary.counts.files > 0) {
    summary.warnings.push(
      "This endpoint imports metadata only; use ZIP/CLI restore for attachment binaries."
    );
  }
  if (!m?.templates || !Array.isArray(m.templates)) {
    summary.warnings.push("No templates array found — export may be incomplete.");
  }
  return summary;
}

export async function applyImport(
  db: any,
  args: {
    auth: { organizationId: string; userId: string };
    payload: any;
  }
) {
  const parsed = ImportPayloadSchema.parse(args.payload);
  const m = parsed.manifest ?? args.payload;
  const manifest = m?.manifest ?? m;

  const sourceOrgId = manifest?.organizationId ?? null;
  const targetOrgId = parsed.targetOrgId ?? args.auth.organizationId;

  const existingPlan = await db
    .select()
    .from(organizationPlans)
    .where(eq(organizationPlans.organizationId, targetOrgId))
    .limit(1);

  if (existingPlan.length && !parsed.explicitOverwrite) {
    const err: any = new Error(
      "Target org already exists. Refusing to overwrite without explicitOverwrite=true."
    );
    err.status = 409;
    throw err;
  }

  const mapTemplate = new Map<string, string>();
  const mapEntity = new Map<string, string>();
  const mapRow = new Map<string, string>();
  const mapInspection = new Map<string, string>();
  const mapFile = new Map<string, string>();

  const planKey = (manifest?.plan?.plan ?? "free") as any;

  await db
    .insert(organizationPlans)
    .values({
      organizationId: targetOrgId,
      plan: planKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: organizationPlans.organizationId,
      set: { plan: planKey, updatedAt: new Date() },
    });

  await db
    .insert(organizationUsage)
    .values({
      organizationId: targetOrgId,
      jobsThisMonth: manifest?.usage?.jobsThisMonth ?? 0,
      jobsMonthKey: manifest?.usage?.jobsMonthKey ?? "1970-01",
      totalTemplates: 0,
      totalEntities: 0,
      storageBytes: 0,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: organizationUsage.organizationId,
      set: {
        jobsThisMonth: manifest?.usage?.jobsThisMonth ?? 0,
        jobsMonthKey: manifest?.usage?.jobsMonthKey ?? "1970-01",
        updatedAt: new Date(),
      },
    });

  for (const t of manifest?.templates ?? []) {
    const newId = newUuid();
    mapTemplate.set(t.id, newId);
    await db.insert(formTemplates).values({
      id: newId,
      organizationId: targetOrgId,
      name: t.name,
      description: t.description ?? null,
      isActive: !!t.isActive,
      archivedAt: t.archivedAt ?? null,
      createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
      updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
    });
  }

  for (const e of manifest?.entities ?? []) {
    const newId = newUuid();
    mapEntity.set(e.id, newId);
    await db.insert(formEntities).values({
      id: newId,
      organizationId: targetOrgId,
      title: e.title,
      description: e.description ?? null,
      archivedAt: e.archivedAt ?? null,
      createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
      updatedAt: e.updatedAt ? new Date(e.updatedAt) : new Date(),
    });
  }

  for (const r of manifest?.entityRows ?? []) {
    const newId = newUuid();
    mapRow.set(r.id, newId);
    await db.insert(formEntityRows).values({
      id: newId,
      organizationId: targetOrgId,
      entityId: mapEntity.get(r.entityId) ?? null,
      sortOrder: r.sortOrder ?? 0,
      component: r.component,
      activity: r.activity,
      reference: r.reference ?? null,
      fieldType: r.fieldType,
      units: r.units ?? null,
      choices: r.choices ?? null,
      evidenceRequired: !!r.evidenceRequired,
      archivedAt: r.archivedAt ?? null,
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
    });
  }

  for (const m of manifest?.templateEntities ?? []) {
    const tid = mapTemplate.get(m.templateId);
    const eid = mapEntity.get(m.entityId);
    if (!tid || !eid) continue;
    await db.insert(formTemplateEntities).values({
      organizationId: targetOrgId,
      templateId: tid,
      entityId: eid,
      sortOrder: m.sortOrder ?? 0,
    });
  }

  for (const m of manifest?.templateSystemTypes ?? []) {
    const tid = mapTemplate.get(m.templateId);
    if (!tid) continue;
    await db.insert(formTemplateSystemTypes).values({
      organizationId: targetOrgId,
      templateId: tid,
      systemTypeId: m.systemTypeId,
    });
  }

  for (const insp of manifest?.inspections ?? []) {
    const newId = newUuid();
    mapInspection.set(insp.id, newId);
    await db.insert(inspectionInstances).values({
      id: newId,
      organizationId: targetOrgId,
      jobId: null,
      templateId: mapTemplate.get(insp.templateId) ?? null,
      systemTypeId: insp.systemTypeId,
      createdByUserId: args.auth.userId,
      completedAt: insp.completedAt ? new Date(insp.completedAt) : null,
      createdAt: insp.createdAt ? new Date(insp.createdAt) : new Date(),
    });
  }

  for (const r of manifest?.inspectionResponses ?? []) {
    const iid = mapInspection.get(r.inspectionId);
    const rid = mapRow.get(r.rowId);
    if (!iid || !rid) continue;

    await db.insert(inspectionResponses).values({
      id: newUuid(),
      organizationId: targetOrgId,
      inspectionId: iid,
      rowId: rid,
      valueText: r.valueText ?? null,
      valueNumber: r.valueNumber ?? null,
      valueBool: r.valueBool ?? null,
      comment: r.comment ?? null,
      createdByUserId: args.auth.userId,
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
    });
  }

  for (const f of manifest?.files ?? []) {
    const newId = newUuid();
    mapFile.set(f.id, newId);
    await db.insert(files).values({
      id: newId,
      organizationId: targetOrgId,
      storage: f.storage ?? "local",
      path: f.path,
      originalName: f.originalName,
      mimeType: f.mimeType ?? null,
      sizeBytes: Number(f.sizeBytes || 0),
      createdByUserId: args.auth.userId,
      createdAt: f.createdAt ? new Date(f.createdAt) : new Date(),
    });
  }

  for (const a of manifest?.inspectionRowAttachments ?? []) {
    const iid = mapInspection.get(a.inspectionId);
    const rid = mapRow.get(a.rowId);
    const fid = mapFile.get(a.fileId);
    if (!iid || !rid || !fid) continue;

    await db.insert(inspectionRowAttachments).values({
      id: newUuid(),
      organizationId: targetOrgId,
      inspectionId: iid,
      rowId: rid,
      fileId: fid,
      createdByUserId: args.auth.userId,
      createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
    });
  }

  const totalTemplates = manifest?.templates?.length ?? 0;
  const totalEntities = manifest?.entities?.length ?? 0;
  const storageBytes = (manifest?.files ?? []).reduce(
    (sum: number, f: any) => sum + Number(f.sizeBytes || 0),
    0
  );

  await db
    .update(organizationUsage)
    .set({
      totalTemplates,
      totalEntities,
      storageBytes,
      updatedAt: new Date(),
    })
    .where(eq(organizationUsage.organizationId, targetOrgId));

  await logAudit(db, {
    organizationId: targetOrgId,
    actorUserId: args.auth.userId,
    action: "org.imported",
    entityType: "organization",
    entityId: targetOrgId,
    metadata: {
      sourceOrganizationId: sourceOrgId,
      counts: { totalTemplates, totalEntities, storageBytes },
    },
  });

  try {
    await db.insert(importRuns).values({
      organizationId: targetOrgId,
      sourceOrganizationId: sourceOrgId,
      mode: "apply",
      status: "succeeded",
      summary: {
        sourceOrganizationId: sourceOrgId,
        totalTemplates,
        totalEntities,
        storageBytes,
      },
      createdByUserId: args.auth.userId,
    });
  } catch {}

  return {
    ok: true,
    targetOrgId,
    sourceOrganizationId: sourceOrgId,
    totals: { totalTemplates, totalEntities, storageBytes },
    note: "This server import restores metadata only. Use ZIP/CLI restore to restore attachment binaries.",
  };
}
