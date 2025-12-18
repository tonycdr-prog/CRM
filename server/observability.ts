import type { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from "express";
import { serverErrors } from "../shared/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export function slowRequestLogger(thresholdMs = 1500): RequestHandler {
  return (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const ms = Date.now() - start;
      if (ms >= thresholdMs) {
        const rid = (req as any).requestId || req.headers["x-request-id"] || "-";
        console.warn(`[SLOW] [${rid}] ${res.statusCode} ${req.method} ${req.originalUrl} ${ms}ms`);
      }
    });
    next();
  };
}

function safeString(x: any, max = 2000) {
  const s = typeof x === "string" ? x : JSON.stringify(x);
  return s.length > max ? s.slice(0, max) + "…" : s;
}

export function createErrorHandler(db: NodePgDatabase<any>): ErrorRequestHandler {
  return async (err: any, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);

    const requestId = (req as any).requestId || (req.headers["x-request-id"] as string) || null;
    const status = Number(err?.status || err?.statusCode || 500);
    const message = err?.message || "Internal Server Error";

    let organizationId: string | null = null;
    let userId: string | null = null;
    try {
      userId = (req as any).user?.claims?.sub ?? null;
    } catch {}
    try {
      organizationId = (req as any).organizationId ?? null;
    } catch {}

    const rid = requestId || "-";
    console.error(`[ERR] [${rid}] ${status} ${req.method} ${req.originalUrl} :: ${message}`);

    try {
      if (status >= 500) {
        await db.insert(serverErrors).values({
          organizationId: organizationId ?? undefined,
          userId: userId ?? undefined,
          requestId,
          method: req.method,
          path: req.originalUrl,
          status,
          message: safeString(message, 2000),
          stack: safeString(err?.stack ?? "", 8000),
          metadata: {
            ip: req.headers["x-forwarded-for"] || (req as any).ip || null,
            ua: req.headers["user-agent"] || null,
          },
        });
      }
    } catch {
    }

    res.status(status).json({
      message,
      requestId,
    });
  };
}
