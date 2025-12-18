import helmet from "helmet";
import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";
import crypto from "crypto";

export const requestId: RequestHandler = (req, res, next) => {
  const incoming = (req.headers["x-request-id"] as string) || "";
  const id = incoming || crypto.randomUUID();
  (req as any).requestId = id;
  res.setHeader("x-request-id", id);
  next();
};

export const securityHeaders = helmet({
  frameguard: { action: "deny" },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "data:", "blob:"],
      "connect-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
    },
  },
  referrerPolicy: { policy: "no-referrer" },
  crossOriginResourcePolicy: { policy: "same-site" },
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down." },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth requests. Try again later." },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many uploads. Please slow down." },
});

export const pdfLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many PDF requests. Please slow down." },
});

export const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const rid = (req as any).requestId || "-";
    const status = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;
    console.log(`[${rid}] ${status} ${method} ${url} ${ms}ms`);
  });
  next();
};
