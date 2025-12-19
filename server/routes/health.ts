import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

export function createHealthRouter() {
  const router = Router();

  router.get("/", async (_req, res) => {
    const start = Date.now();
    let dbOk = false;
    try {
      await db.execute(sql`SELECT 1`);
      dbOk = true;
    } catch {
      dbOk = false;
    }
    const durationMs = Date.now() - start;
    const uptimeSeconds = Math.floor(process.uptime());
    res.json({
      ok: dbOk,
      dbOk,
      uptimeSeconds,
      durationMs,
    });
  });

  return router;
}
