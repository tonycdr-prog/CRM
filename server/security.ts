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

export const buildContentSecurityPolicyDirectives = (enableDevRelaxation: boolean) => ({
  "default-src": ["'self'"],
  "img-src": ["'self'", "data:", "blob:"],
  "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
  "connect-src": enableDevRelaxation
    ? ["'self'", "wss:", "ws:"]
    : ["'self'"],
  "script-src": enableDevRelaxation
    ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
    : ["'self'"],
  "style-src": ["'self'", "https://fonts.googleapis.com"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
});

export const createSecurityHeaders = (nodeEnv = process.env.NODE_ENV) => {
  const enableDevRelaxation = nodeEnv === "development";

  return helmet({
    frameguard: { action: "deny" },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: buildContentSecurityPolicyDirectives(enableDevRelaxation),
    },
    referrerPolicy: { policy: "no-referrer" },
    crossOriginResourcePolicy: { policy: "same-site" },
  });
};

export const securityHeaders = createSecurityHeaders();

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down." },
  skip: (req) => {
    // Skip rate limiting for Vite dev assets during development
    const url = req.originalUrl || req.url;
    return url.startsWith("/@") || url.startsWith("/node_modules") || url.endsWith(".ts") || url.endsWith(".tsx") || url.endsWith(".css");
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth requests. Try again later." },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many uploads. Please slow down." },
});

export const pdfLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
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
