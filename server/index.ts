import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { redactSensitiveData } from "./utils/routeHelpers";
import {
  requestId,
  requestLogger,
  securityHeaders,
  generalLimiter,
  authLimiter,
  uploadLimiter,
  pdfLimiter,
} from "./security";

const app = express();
const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);
app.use(requestId);
app.use(requestLogger);
app.use(securityHeaders);
app.use(generalLimiter);

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

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const errMsg = (err as Error)?.message || "";
    const errCode = (err as any)?.code || "";

    if (errMsg.includes("Unsupported file type")) {
      return res.status(415).json({ message: errMsg });
    }
    if (errCode === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "File too large" });
    }

    console.error("Unhandled error:", err);
    
    const status = (err as { status?: number; statusCode?: number })?.status 
      || (err as { status?: number; statusCode?: number })?.statusCode 
      || 500;
    const message = errMsg || "Internal Server Error";

    if (!res.headersSent) {
      res.status(status).json({ error: message });
    }
  });

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
