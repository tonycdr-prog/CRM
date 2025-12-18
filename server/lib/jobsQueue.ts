import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import archiver from "archiver";
import { and, eq, asc } from "drizzle-orm";
import { backgroundJobs } from "../../shared/schema";
import { buildOrgExportManifest } from "./exportManifest";
import { UPLOAD_ROOT } from "./zipExport";

export const JOB_OUTPUT_ROOT = path.join(process.cwd(), "job_outputs");

function ensureDirSync(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
ensureDirSync(JOB_OUTPUT_ROOT);

function safeExists(p: string): boolean {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

async function writeZipToFile(db: any, orgId: string, outPath: string) {
  const manifest = await buildOrgExportManifest(db, orgId);

  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve());
    output.on("error", reject);

    archive.on("warning", (err) => console.warn("[job zip warning]", err?.message || err));
    archive.on("error", reject);

    archive.pipe(output);
    archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });

    const filesMeta = Array.isArray(manifest.files) ? manifest.files : [];
    for (const f of filesMeta) {
      const storage = (f.storage ?? "local") as string;
      if (storage !== "local") continue;
      const rel = String(f.path || "");
      if (!rel) continue;
      const abs = path.join(UPLOAD_ROOT, rel);
      if (!safeExists(abs)) continue;

      const safeName = String(f.originalName || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
      archive.file(abs, { name: `attachments/${f.id}_${safeName}` });
    }

    archive.finalize();
  });
}

export async function startJobsWorker(db: any, opts?: { pollMs?: number }) {
  const pollMs = opts?.pollMs ?? 2500;
  let running = false;

  async function tick() {
    if (running) return;
    running = true;
    try {
      await processTick(db);
    } finally {
      running = false;
    }
  }

  setInterval(tick, pollMs);
  console.log(`[jobs-worker] Started with ${pollMs}ms poll interval`);
}

async function processTick(db: any) {
  const job = await db
      .select()
      .from(backgroundJobs)
      .where(eq(backgroundJobs.status, "queued"))
      .orderBy(asc(backgroundJobs.createdAt))
      .limit(1);

    if (!job.length) return;

    const j = job[0];
    const jobId = j.id as string;

    const claimed = await db
      .update(backgroundJobs)
      .set({ status: "running", startedAt: new Date(), updatedAt: new Date(), progress: 5 })
      .where(and(eq(backgroundJobs.id, jobId), eq(backgroundJobs.status, "queued")))
      .returning({ id: backgroundJobs.id });

    if (!claimed.length) return;

    try {
      if (j.type === "org_export_zip") {
        const outName = `export_${j.organizationId}_${jobId}.zip`;
        const outPath = path.join(JOB_OUTPUT_ROOT, outName);

        await db.update(backgroundJobs).set({ progress: 25, updatedAt: new Date() }).where(eq(backgroundJobs.id, jobId));

        await writeZipToFile(db, j.organizationId, outPath);

        const stat = await fsPromises.stat(outPath);

        await db
          .update(backgroundJobs)
          .set({
            status: "succeeded",
            finishedAt: new Date(),
            updatedAt: new Date(),
            progress: 100,
            output: { fileName: outName, sizeBytes: stat.size },
          })
          .where(eq(backgroundJobs.id, jobId));
      } else {
        await db
          .update(backgroundJobs)
          .set({
            status: "failed",
            finishedAt: new Date(),
            updatedAt: new Date(),
            error: `Unknown job type: ${j.type}`,
            progress: 100,
          })
          .where(eq(backgroundJobs.id, jobId));
      }
    } catch (e: any) {
      await db
        .update(backgroundJobs)
        .set({
          status: "failed",
          finishedAt: new Date(),
          updatedAt: new Date(),
          error: String(e?.message || e),
          progress: 100,
        })
        .where(eq(backgroundJobs.id, jobId));
    }
}
