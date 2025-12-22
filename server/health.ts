import type { Request, Response } from "express";
import { sql, type SQLWrapper } from "drizzle-orm";

export type HealthDb = { execute: (query: SQLWrapper | string) => Promise<unknown> };

// Seed payload to emulate a successful database heartbeat during tests or local development.
export const HEALTH_SEED = { heartbeat: 1 };

export function buildHealthHandler(db: HealthDb) {
  return async (_req: Request, res: Response) => {
    const started = Date.now();
    let dbOk = false;

    try {
      await db.execute(sql`select 1`);
      dbOk = true;
    } catch {
      dbOk = false;
    }

    res.status(dbOk ? 200 : 503).json({
      ok: dbOk,
      dbOk,
      uptimeSeconds: Math.floor(process.uptime()),
      time: new Date().toISOString(),
      durationMs: Date.now() - started,
    });
  };
}
