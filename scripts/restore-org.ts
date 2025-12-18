#!/usr/bin/env npx tsx
import fs from "fs";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "../shared/schema";

const USAGE = `
Usage: npx tsx scripts/restore-org.ts <manifest.json> [--mode dry-run|apply]

Options:
  --mode dry-run  (default) Preview changes without modifying database
  --mode apply    Actually restore data to the database

Examples:
  npx tsx scripts/restore-org.ts ./backup/manifest.json
  npx tsx scripts/restore-org.ts ./backup/manifest.json --mode apply
`;

interface ManifestData {
  exportedAt: string;
  organizationId: string;
  plan: Record<string, unknown> | null;
  usage: Record<string, unknown> | null;
  users: unknown[];
  jobs: unknown[];
  inspections: unknown[];
  inspectionResponses: unknown[];
  templates: unknown[];
  templateEntities: unknown[];
  templateSystemTypes: unknown[];
  entities: unknown[];
  entityRows: unknown[];
  files: unknown[];
  inspectionRowAttachments: unknown[];
  auditEvents: unknown[];
  serverErrors: unknown[];
}

function parseArgs(args: string[]): { manifestPath: string; mode: "dry-run" | "apply" } {
  const positional: string[] = [];
  let mode: "dry-run" | "apply" = "dry-run";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--mode") {
      const val = args[++i];
      if (val === "apply") mode = "apply";
      else if (val === "dry-run") mode = "dry-run";
      else {
        console.error(`Invalid mode: ${val}`);
        process.exit(1);
      }
    } else if (!args[i].startsWith("-")) {
      positional.push(args[i]);
    }
  }

  if (!positional[0]) {
    console.log(USAGE);
    process.exit(1);
  }

  return { manifestPath: positional[0], mode };
}

async function main() {
  const args = process.argv.slice(2);
  const { manifestPath, mode } = parseArgs(args);

  if (!fs.existsSync(manifestPath)) {
    console.error(`File not found: ${manifestPath}`);
    process.exit(1);
  }

  console.log(`Reading manifest from: ${manifestPath}`);
  const raw = fs.readFileSync(manifestPath, "utf-8");
  const manifest: ManifestData = JSON.parse(raw);

  console.log(`Organisation ID: ${manifest.organizationId}`);
  console.log(`Exported at: ${manifest.exportedAt}`);
  console.log(`Mode: ${mode}\n`);

  const counts = {
    users: manifest.users?.length ?? 0,
    jobs: manifest.jobs?.length ?? 0,
    inspections: manifest.inspections?.length ?? 0,
    inspectionResponses: manifest.inspectionResponses?.length ?? 0,
    templates: manifest.templates?.length ?? 0,
    templateEntities: manifest.templateEntities?.length ?? 0,
    templateSystemTypes: manifest.templateSystemTypes?.length ?? 0,
    entities: manifest.entities?.length ?? 0,
    entityRows: manifest.entityRows?.length ?? 0,
    files: manifest.files?.length ?? 0,
    inspectionRowAttachments: manifest.inspectionRowAttachments?.length ?? 0,
    auditEvents: manifest.auditEvents?.length ?? 0,
    serverErrors: manifest.serverErrors?.length ?? 0,
  };

  console.log("Records to restore:");
  for (const [table, count] of Object.entries(counts)) {
    if (count > 0) {
      console.log(`  ${table}: ${count}`);
    }
  }
  console.log("");

  if (mode === "dry-run") {
    console.log("Dry-run complete. No changes made.");
    console.log("Run with --mode apply to restore data.");
    process.exit(0);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL environment variable not set");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const pool = new Pool({ connectionString: dbUrl });
  const db = drizzle(pool, { schema });

  console.log("\nStarting restore...\n");

  const insertBatch = async (
    tableName: string,
    table: any,
    rows: any[],
    conflictColumn: any
  ) => {
    if (!rows || rows.length === 0) return;
    console.log(`Restoring ${tableName} (${rows.length} records)...`);

    for (const row of rows) {
      try {
        await db
          .insert(table)
          .values(row)
          .onConflictDoNothing({ target: conflictColumn });
      } catch (err: any) {
        console.warn(`  Warning: Failed to insert ${tableName} record: ${err.message}`);
      }
    }
  };

  if (manifest.plan) {
    console.log("Restoring organization plan...");
    try {
      await db
        .insert(schema.organizationPlans)
        .values(manifest.plan as any)
        .onConflictDoUpdate({
          target: schema.organizationPlans.organizationId,
          set: manifest.plan as any,
        });
    } catch (err: any) {
      console.warn(`  Warning: Failed to restore plan: ${err.message}`);
    }
  }

  if (manifest.usage) {
    console.log("Restoring organization usage...");
    try {
      await db
        .insert(schema.organizationUsage)
        .values(manifest.usage as any)
        .onConflictDoUpdate({
          target: schema.organizationUsage.organizationId,
          set: manifest.usage as any,
        });
    } catch (err: any) {
      console.warn(`  Warning: Failed to restore usage: ${err.message}`);
    }
  }

  await insertBatch("users", schema.users, manifest.users as any[], schema.users.id);
  await insertBatch("jobs", schema.jobs, manifest.jobs as any[], schema.jobs.id);
  await insertBatch("inspectionInstances", schema.inspectionInstances, manifest.inspections as any[], schema.inspectionInstances.id);
  await insertBatch("inspectionResponses", schema.inspectionResponses, manifest.inspectionResponses as any[], schema.inspectionResponses.id);
  await insertBatch("formTemplates", schema.formTemplates, manifest.templates as any[], schema.formTemplates.id);
  await insertBatch("formEntities", schema.formEntities, manifest.entities as any[], schema.formEntities.id);
  await insertBatch("formEntityRows", schema.formEntityRows, manifest.entityRows as any[], schema.formEntityRows.id);
  await insertBatch("files", schema.files, manifest.files as any[], schema.files.id);
  await insertBatch("inspectionRowAttachments", schema.inspectionRowAttachments, manifest.inspectionRowAttachments as any[], schema.inspectionRowAttachments.id);

  console.log("\nRestore complete!");
  console.log("Note: auditEvents and serverErrors are exported for reference but not restored to preserve audit integrity.");
  await pool.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
