#!/usr/bin/env npx tsx
import fs from "fs";
import path from "path";
import crypto from "crypto";
import AdmZip from "adm-zip";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import * as schema from "../shared/schema";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

function getArg(name: string): string | null {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const zipPath = getArg("--zip");
const manifestPath = getArg("--manifest");
const dryRun = process.argv.includes("--dry-run");
const apply = process.argv.includes("--apply");
const newOrgId = getArg("--new-org");
const operatorUserId = getArg("--operator-user");

const USAGE = `
Usage: npx tsx scripts/restore-org.ts [options]

Options:
  --zip <path>              Path to export.zip file
  --manifest <path>         Path to manifest.json file (alternative to --zip)
  --dry-run                 Preview changes without modifying database
  --apply                   Actually restore data to the database
  --new-org <uuid>          Target organisation ID (required for --apply)
  --operator-user <uuid>    User ID for createdByUserId fields (required for --apply)

Examples:
  npx tsx scripts/restore-org.ts --zip ./export.zip --dry-run
  npx tsx scripts/restore-org.ts --zip ./export.zip --apply --new-org <uuid> --operator-user <uuid>
  npx tsx scripts/restore-org.ts --manifest ./manifest.json --dry-run
`;

if (!zipPath && !manifestPath) {
  console.log(USAGE);
  process.exit(1);
}

if (apply) {
  if (!newOrgId) {
    console.error("Apply requires --new-org <uuid>");
    process.exit(1);
  }
  if (!operatorUserId) {
    console.error("Apply requires --operator-user <uuid>");
    process.exit(1);
  }
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

function ensureDir(p: string): void {
  fs.mkdirSync(p, { recursive: true });
}

function newUuid(): string {
  return crypto.randomUUID();
}

interface Manifest {
  exportedAt: string;
  organizationId: string;
  plan: any;
  usage: any;
  users: any[];
  jobs: any[];
  inspections: any[];
  inspectionResponses: any[];
  templates: any[];
  templateEntities: any[];
  templateSystemTypes: any[];
  entities: any[];
  entityRows: any[];
  files: any[];
  inspectionRowAttachments: any[];
  auditEvents: any[];
  serverErrors: any[];
}

function loadManifestFromZip(p: string): { manifest: Manifest; zip: AdmZip } {
  const zip = new AdmZip(p);
  const entry = zip.getEntry("manifest.json");
  if (!entry) throw new Error("manifest.json not found in zip");
  const text = entry.getData().toString("utf-8");
  const manifest = JSON.parse(text) as Manifest;
  return { manifest, zip };
}

function loadManifestFromJson(p: string): Manifest {
  return JSON.parse(fs.readFileSync(p, "utf-8")) as Manifest;
}

function printCounts(m: Manifest): void {
  const counts = {
    templates: m.templates?.length ?? 0,
    entities: m.entities?.length ?? 0,
    entityRows: m.entityRows?.length ?? 0,
    templateEntities: m.templateEntities?.length ?? 0,
    templateSystemTypes: m.templateSystemTypes?.length ?? 0,
    inspections: m.inspections?.length ?? 0,
    responses: m.inspectionResponses?.length ?? 0,
    files: m.files?.length ?? 0,
    inspectionRowAttachments: m.inspectionRowAttachments?.length ?? 0,
    jobs: m.jobs?.length ?? 0,
    users: m.users?.length ?? 0,
  };
  console.log("Source organisation:", m.organizationId);
  console.log("Exported at:", m.exportedAt);
  console.log("\nRecord counts:");
  for (const [key, val] of Object.entries(counts)) {
    if (val > 0) console.log(`  ${key}: ${val}`);
  }
}

function createIdMap() {
  const map = new Map<string, string>();
  return {
    get(oldId: string) { return map.get(oldId); },
    set(oldId: string, newId: string) { map.set(oldId, newId); },
    must(oldId: string) {
      const v = map.get(oldId);
      if (!v) throw new Error(`Missing id mapping for ${oldId}`);
      return v;
    },
  };
}

async function main() {
  let manifest: Manifest;
  let zip: AdmZip | null = null;

  if (zipPath) {
    console.log(`Reading ZIP from: ${zipPath}`);
    const loaded = loadManifestFromZip(zipPath);
    manifest = loaded.manifest;
    zip = loaded.zip;
  } else {
    console.log(`Reading manifest from: ${manifestPath}`);
    manifest = loadManifestFromJson(manifestPath!);
  }

  printCounts(manifest);

  if (!apply) {
    console.log("\nDry-run complete. No changes made.");
    console.log("Run with --apply --new-org <uuid> --operator-user <uuid> to restore data.");
    process.exit(0);
  }

  if (!isUuid(newOrgId!)) throw new Error("--new-org must be a valid UUID");
  if (!isUuid(operatorUserId!)) throw new Error("--operator-user must be a valid UUID");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL environment variable not set");
    process.exit(1);
  }

  console.log("\nConnecting to database...");
  const pool = new Pool({ connectionString: dbUrl });
  const db = drizzle(pool, { schema });

  const existingPlan = await db
    .select()
    .from(schema.organizationPlans)
    .where(eq(schema.organizationPlans.organizationId, newOrgId!))
    .limit(1);

  if (existingPlan.length > 0) {
    throw new Error(`Refusing to apply: organizationPlans already exists for org ${newOrgId} (choose a new org)`);
  }

  console.log(`\nAPPLY: Restoring into NEW organisation: ${newOrgId}`);
  ensureDir(UPLOAD_ROOT);

  const mapTemplate = createIdMap();
  const mapEntity = createIdMap();
  const mapRow = createIdMap();
  const mapInspection = createIdMap();
  const mapFile = createIdMap();

  console.log("\n1. Restoring organisation plan and usage...");
  if (manifest.plan) {
    const planData = { ...manifest.plan, organizationId: newOrgId! };
    delete planData.id;
    planData.createdAt = planData.createdAt ? new Date(planData.createdAt) : new Date();
    planData.updatedAt = new Date();
    await db.insert(schema.organizationPlans).values(planData as any);
  } else {
    await db.insert(schema.organizationPlans).values({
      organizationId: newOrgId!,
      plan: "free" as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  if (manifest.usage) {
    const usageData = { ...manifest.usage, organizationId: newOrgId! };
    delete usageData.id;
    usageData.updatedAt = new Date();
    await db.insert(schema.organizationUsage).values(usageData as any);
  } else {
    await db.insert(schema.organizationUsage).values({
      organizationId: newOrgId!,
      jobsThisMonth: 0,
      jobsMonthKey: "1970-01",
      totalTemplates: 0,
      totalEntities: 0,
      storageBytes: 0,
      updatedAt: new Date(),
    });
  }

  console.log("2. Restoring form templates...");
  for (const t of manifest.templates || []) {
    const newId = newUuid();
    mapTemplate.set(t.id, newId);
    await db.insert(schema.formTemplates).values({
      id: newId,
      organizationId: newOrgId!,
      name: t.name,
      description: t.description ?? null,
      isActive: !!t.isActive,
      archivedAt: t.archivedAt ? new Date(t.archivedAt) : null,
      createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
      updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
    });
  }

  console.log("3. Restoring form entities...");
  for (const e of manifest.entities || []) {
    const newId = newUuid();
    mapEntity.set(e.id, newId);
    await db.insert(schema.formEntities).values({
      id: newId,
      organizationId: newOrgId!,
      title: e.title,
      description: e.description ?? null,
      archivedAt: e.archivedAt ? new Date(e.archivedAt) : null,
      createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
      updatedAt: e.updatedAt ? new Date(e.updatedAt) : new Date(),
    });
  }

  console.log("4. Restoring entity rows...");
  for (const r of manifest.entityRows || []) {
    const newId = newUuid();
    mapRow.set(r.id, newId);
    await db.insert(schema.formEntityRows).values({
      id: newId,
      organizationId: newOrgId!,
      entityId: mapEntity.must(r.entityId),
      sortOrder: r.sortOrder ?? 0,
      component: r.component,
      activity: r.activity,
      reference: r.reference ?? null,
      fieldType: r.fieldType,
      units: r.units ?? null,
      choices: r.choices ?? null,
      evidenceRequired: !!r.evidenceRequired,
      archivedAt: r.archivedAt ? new Date(r.archivedAt) : null,
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
    });
  }

  console.log("5. Restoring template-entity mappings...");
  for (const m of manifest.templateEntities || []) {
    await db.insert(schema.formTemplateEntities).values({
      organizationId: newOrgId!,
      templateId: mapTemplate.must(m.templateId),
      entityId: mapEntity.must(m.entityId),
      sortOrder: m.sortOrder ?? 0,
    });
  }

  console.log("6. Restoring template-system-type mappings...");
  for (const m of manifest.templateSystemTypes || []) {
    await db.insert(schema.formTemplateSystemTypes).values({
      organizationId: newOrgId!,
      templateId: mapTemplate.must(m.templateId),
      systemTypeId: m.systemTypeId,
    });
  }

  console.log("7. Restoring inspections...");
  for (const insp of manifest.inspections || []) {
    const newId = newUuid();
    mapInspection.set(insp.id, newId);
    await db.insert(schema.inspectionInstances).values({
      id: newId,
      organizationId: newOrgId!,
      jobId: insp.jobId,
      templateId: mapTemplate.must(insp.templateId),
      systemTypeId: insp.systemTypeId,
      createdByUserId: operatorUserId!,
      completedAt: insp.completedAt ? new Date(insp.completedAt) : null,
      createdAt: insp.createdAt ? new Date(insp.createdAt) : new Date(),
    });
  }

  console.log("8. Restoring inspection responses...");
  for (const r of manifest.inspectionResponses || []) {
    await db.insert(schema.inspectionResponses).values({
      id: newUuid(),
      organizationId: newOrgId!,
      inspectionId: mapInspection.must(r.inspectionId),
      rowId: mapRow.must(r.rowId),
      valueText: r.valueText ?? null,
      valueNumber: r.valueNumber ?? null,
      valueBool: r.valueBool ?? null,
      comment: r.comment ?? null,
      createdByUserId: operatorUserId!,
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
    });
  }

  console.log("9. Restoring files...");
  let restoredBytes = 0;
  const filesMeta = manifest.files || [];

  if (zip) {
    for (const f of filesMeta) {
      const storage = String(f.storage ?? "local");
      if (storage !== "local") continue;

      const oldFileId = String(f.id);
      const newFileId = newUuid();
      mapFile.set(oldFileId, newFileId);

      const relPath = String(f.path || "");
      const sizeBytes = Number(f.sizeBytes || 0);

      await db.insert(schema.files).values({
        id: newFileId,
        organizationId: newOrgId!,
        storage: "local",
        path: relPath,
        originalName: f.originalName,
        mimeType: f.mimeType ?? null,
        sizeBytes: sizeBytes,
        createdByUserId: operatorUserId!,
        createdAt: f.createdAt ? new Date(f.createdAt) : new Date(),
      });

      const prefix = `attachments/${oldFileId}_`;
      const entry = zip.getEntries().find((e) => e.entryName.startsWith(prefix));
      if (entry) {
        const absTarget = path.join(UPLOAD_ROOT, relPath);
        ensureDir(path.dirname(absTarget));
        fs.writeFileSync(absTarget, entry.getData());
        restoredBytes += sizeBytes;
      } else {
        console.warn(`  WARN: binary not found in zip for fileId ${oldFileId}`);
      }
    }
  } else {
    for (const f of filesMeta) {
      const oldFileId = String(f.id);
      const newFileId = newUuid();
      mapFile.set(oldFileId, newFileId);

      await db.insert(schema.files).values({
        id: newFileId,
        organizationId: newOrgId!,
        storage: String(f.storage ?? "local"),
        path: f.path,
        originalName: f.originalName,
        mimeType: f.mimeType ?? null,
        sizeBytes: Number(f.sizeBytes || 0),
        createdByUserId: operatorUserId!,
        createdAt: f.createdAt ? new Date(f.createdAt) : new Date(),
      });
    }
  }

  console.log("10. Restoring inspection row attachments...");
  for (const a of manifest.inspectionRowAttachments || []) {
    await db.insert(schema.inspectionRowAttachments).values({
      id: newUuid(),
      organizationId: newOrgId!,
      inspectionId: mapInspection.must(a.inspectionId),
      rowId: mapRow.must(a.rowId),
      fileId: mapFile.must(a.fileId),
      createdByUserId: operatorUserId!,
      createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
    });
  }

  console.log("11. Updating storage bytes from restored files...");
  if (restoredBytes > 0) {
    await db
      .update(schema.organizationUsage)
      .set({
        storageBytes: restoredBytes,
        updatedAt: new Date(),
      })
      .where(eq(schema.organizationUsage.organizationId, newOrgId!));
  }

  console.log("\n========== RESTORE COMPLETE ==========");
  console.log(`New organisation: ${newOrgId}`);
  console.log(`Templates restored: ${manifest.templates?.length ?? 0}`);
  console.log(`Entities restored: ${manifest.entities?.length ?? 0}`);
  console.log(`Entity rows restored: ${manifest.entityRows?.length ?? 0}`);
  console.log(`Inspections restored: ${manifest.inspections?.length ?? 0}`);
  console.log(`Responses restored: ${manifest.inspectionResponses?.length ?? 0}`);
  console.log(`Files restored: ${manifest.files?.length ?? 0}`);
  console.log(`Attachment mappings restored: ${manifest.inspectionRowAttachments?.length ?? 0}`);
  console.log(`Binary bytes restored: ${restoredBytes}`);
  console.log("\nNOTES:");
  console.log("- Users were NOT restored (OIDC). createdByUserId fields set to operator-user.");
  console.log("- Jobs were NOT restored. Ensure jobs exist or adapt as needed.");
  console.log("- auditEvents and serverErrors were NOT restored to preserve audit integrity.");

  await pool.end();
}

main().catch((e) => {
  console.error("RESTORE FAILED:", e);
  process.exit(1);
});
