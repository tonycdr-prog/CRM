import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { redactSensitiveData } from "./utils/routeHelpers";
import {
  requestId,
  requestLogger,
  buildSecurityHeaders,
  generalLimiter,
  authLimiter,
  uploadLimiter,
  pdfLimiter,
} from "./security";
import { slowRequestLogger, createErrorHandler } from "./observability";
import { db } from "./db";
import { startJobsWorker } from "./lib/jobsQueue";
import { ZodError } from "zod";

const app = express();
const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);
app.use(requestId);
app.use(requestLogger);
app.use(buildSecurityHeaders({ isDev: !isProduction }));
app.use(generalLimiter);
app.use(slowRequestLogger(1500));

app.use("/api/auth", authLimiter);
app.use("/api/login", authLimiter);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      if (!isProduction && capturedJsonResponse) {
        const redacted = redactSensitiveData(capturedJsonResponse);
        const jsonStr = JSON.stringify(redacted);
        if (jsonStr.length <= 200) {
          logLine += ` :: ${jsonStr}`;
        }
      }

      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  startJobsWorker(db);

  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    const requestIdVal = (req as any).requestId;

    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        requestId: requestIdVal,
        issues: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
          code: i.code,
        })),
      });
    }

    const errMessage = (err as Error)?.message;
    if (errMessage === "Session not initialized") {
      return res.status(401).json({ message: "Session missing", requestId: requestIdVal });
    }
    if (errMessage === "Invalid CSRF token") {
      return res.status(403).json({ message: "Invalid CSRF token", requestId: requestIdVal });
    }

    const errMsg = (err as Error)?.message || "";
    const errCode = (err as any)?.code || "";

    if (errMsg.includes("Unsupported file type")) {
      return res.status(415).json({ message: errMsg, requestId: requestIdVal });
    }
    if (errCode === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "File too large", requestId: requestIdVal });
    }

    return next(err);
  });

  app.use(createErrorHandler(db));

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
