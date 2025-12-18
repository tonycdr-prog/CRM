import archiver from "archiver";
import path from "path";
import fs from "fs";
import { Response } from "express";
import { buildOrgExportManifest } from "./exportManifest";

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

function safeExists(p: string): boolean {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

export async function streamOrgExportZip(args: {
  db: any;
  orgId: string;
  res: Response;
}) {
  const { db, orgId, res } = args;

  const manifest = await buildOrgExportManifest(db, orgId);

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("warning", (err) => console.warn("[zip warning]", err?.message || err));
  archive.on("error", (err) => {
    console.error("[zip error]", err);
    try {
      res.status(500).end();
    } catch {}
  });

  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="org_export_${orgId}_${new Date().toISOString().replace(/[:.]/g, "-")}.zip"`
  );

  archive.pipe(res);

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
    const entryName = `attachments/${f.id}_${safeName}`;
    archive.file(abs, { name: entryName });
  }

  await archive.finalize();
}
