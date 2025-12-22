import { Request, Response, NextFunction, RequestHandler } from "express";
import { z, ZodError, ZodSchema } from "zod";

export interface AuthenticatedRequest extends Request {
  user: {
    claims: {
      sub: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      exp: number;
    };
    access_token: string;
    refresh_token?: string;
    expires_at: number;
  };
}

export type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<unknown> | unknown;

export function asyncHandler(fn: AuthenticatedHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
  };
}

export function getUserId(req: AuthenticatedRequest): string {
  return req.user.claims.sub;
}

export function validateBody<T>(schema: ZodSchema<T>, body: unknown): T {
  return schema.parse(body);
}

export function validateBodyPartial<T>(schema: ZodSchema<T>, body: unknown): Partial<T> {
  const partialSchema = schema instanceof z.ZodObject 
    ? schema.partial().strict() 
    : schema;
  return partialSchema.parse(body) as Partial<T>;
}

export function handleValidationError(error: unknown, res: Response): boolean {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: error.errors.map(e => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return true;
  }
  return false;
}

export function apiError(res: Response, status: number, message: string, details?: unknown): void {
  const response: { error: string; details?: unknown } = { error: message };
  if (details !== undefined) {
    response.details = details;
  }
  res.status(status).json(response);
}

export function apiSuccess<T>(res: Response, data: T, status = 200): void {
  res.status(status).json(data);
}

const SENSITIVE_KEYS = new Set(
  [
    "password",
    "token",
    "portalToken",
    "access_token",
    "refresh_token",
    "secret",
    "apiKey",
    "api_key",
  ].map((key) => key.toLowerCase())
);

export function redactSensitiveData(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(redactSensitiveData);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      result[key] = redactSensitiveData(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export const ALLOWED_SYNC_ENTITIES = new Set([
  "tests",
  "projects",
  "damperTemplates",
  "stairwellTests",
]);

export function validateSyncPayload(payload: unknown): boolean {
  if (typeof payload !== "object" || payload === null) return false;
  for (const key of Object.keys(payload)) {
    if (!ALLOWED_SYNC_ENTITIES.has(key)) return false;
  }
  return true;
}
