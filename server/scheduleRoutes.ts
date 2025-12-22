import { Router, type RequestHandler } from "express";
import { nanoid } from "nanoid";
import { and, eq, sql } from "drizzle-orm";
import { asyncHandler } from "./utils/routeHelpers";
import {
  createAssignment,
  duplicateAssignment,
  findConflicts,
  getScheduleState,
  updateAssignment,
} from "./lib/scheduleAssignments";
import { assignmentsOverlap, CreateScheduleAssignmentSchema, UpdateScheduleAssignmentSchema } from "@shared/schedule";
import { db, isDatabaseAvailable } from "./db";
import { scheduleAssignments } from "@shared/schema";

const toISO = (d: Date) => d.toISOString();

// Overlap rule: [a,b) overlaps [c,d) if a < d AND c < b
const overlapWhere = (startsAt: Date, endsAt: Date) =>
  sql`${scheduleAssignments.startsAt} < ${endsAt} AND ${scheduleAssignments.endsAt} > ${startsAt}`;

function requireOrgId(req: any): string | null {
  return req.user?.organizationId || req.user?.claims?.organizationId || req.user?.claims?.org_id || null;
}

function buildDbRouter(): Router {
  const router = Router();

  const ensureOrg: RequestHandler = (req, res, next) => {
    const orgId = requireOrgId(req);
    if (!orgId) return res.status(400).json({ message: "Missing organization" });
    (req as any).organizationId = orgId;
    next();
  };

  router.get(
    "/assignments",
    ensureOrg,
    asyncHandler(async (req, res) => {
      const { organizationId } = req as any;
      const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 7 * 86400000);
      const to = req.query.to ? new Date(String(req.query.to)) : new Date(Date.now() + 14 * 86400000);

      const rows = await db
        .select()
        .from(scheduleAssignments)
        .where(
          and(
            eq(scheduleAssignments.organizationId, organizationId),
            sql`${scheduleAssignments.startsAt} < ${to} AND ${scheduleAssignments.endsAt} > ${from}`,
          ),
        );

      res.json(
        rows.map((r) => ({
          ...r,
          startsAt: toISO(r.startsAt as any),
          endsAt: toISO(r.endsAt as any),
          createdAt: toISO(r.createdAt as any),
          updatedAt: toISO(r.updatedAt as any),
        })),
      );
    }),
  );

  router.post(
    "/assignments",
    ensureOrg,
    asyncHandler(async (req, res) => {
      const { organizationId } = req as any;
      const parsed = CreateScheduleAssignmentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });

      const engineerUserId = parsed.data.engineerUserId ?? parsed.data.engineerId;
      if (!engineerUserId) return res.status(400).json({ message: "Missing engineer" });

      const startsAt = new Date(parsed.data.startsAt ?? parsed.data.start ?? "");
      const endsAt = new Date(parsed.data.endsAt ?? parsed.data.end ?? "");
      if (!(startsAt < endsAt)) return res.status(400).json({ message: "startsAt must be before endsAt" });

      const overlapping = await db
        .select({
          id: scheduleAssignments.id,
          jobId: scheduleAssignments.jobId,
          startsAt: scheduleAssignments.startsAt,
          endsAt: scheduleAssignments.endsAt,
        })
        .from(scheduleAssignments)
        .where(
          and(
            eq(scheduleAssignments.organizationId, organizationId),
            eq(scheduleAssignments.engineerUserId, engineerUserId),
            overlapWhere(startsAt, endsAt),
          ),
        );

      if (overlapping.length > 0 && req.query.allowConflict !== "true") {
        return res.status(409).json({
          message: "Scheduling conflict",
          engineerUserId,
          startsAt: parsed.data.startsAt ?? parsed.data.start,
          endsAt: parsed.data.endsAt ?? parsed.data.end,
          overlapping: overlapping.map((o) => ({
            id: o.id,
            jobId: o.jobId,
            startsAt: toISO(o.startsAt as any),
            endsAt: toISO(o.endsAt as any),
          })),
        });
      }

      const [created] = await db
        .insert(scheduleAssignments)
        .values({
          organizationId,
          jobId: parsed.data.jobId,
          engineerUserId,
          startsAt,
          endsAt,
          requiredEngineers: parsed.data.requiredEngineers ?? 1,
        })
        .returning();

      res.status(201).json({
        ...created,
        startsAt: toISO(created.startsAt as any),
        endsAt: toISO(created.endsAt as any),
        createdAt: toISO(created.createdAt as any),
        updatedAt: toISO(created.updatedAt as any),
      });
    }),
  );

  router.patch(
    "/assignments/:id",
    ensureOrg,
    asyncHandler(async (req, res) => {
      const { organizationId } = req as any;
      const parsed = UpdateScheduleAssignmentSchema.safeParse({ ...req.body, id: req.params.id });
      if (!parsed.success) return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });

      const existing = await db
        .select()
        .from(scheduleAssignments)
        .where(and(eq(scheduleAssignments.organizationId, organizationId), eq(scheduleAssignments.id, parsed.data.id)))
        .then((r) => r[0]);

      if (!existing) return res.status(404).json({ message: "Not found" });

      const startsAt = new Date(parsed.data.startsAt ?? parsed.data.start ?? (existing.startsAt as any));
      const endsAt = new Date(parsed.data.endsAt ?? parsed.data.end ?? (existing.endsAt as any));
      const engineerUserId = parsed.data.engineerUserId ?? parsed.data.engineerId ?? (existing.engineerUserId as any as string);

      if (!(startsAt < endsAt)) return res.status(400).json({ message: "startsAt must be before endsAt" });

      const overlapping = await db
        .select({
          id: scheduleAssignments.id,
          jobId: scheduleAssignments.jobId,
          startsAt: scheduleAssignments.startsAt,
          endsAt: scheduleAssignments.endsAt,
        })
        .from(scheduleAssignments)
        .where(
          and(
            eq(scheduleAssignments.organizationId, organizationId),
            eq(scheduleAssignments.engineerUserId, engineerUserId),
            sql`${scheduleAssignments.id} <> ${parsed.data.id}`,
            overlapWhere(startsAt, endsAt),
          ),
        );

      if (overlapping.length > 0 && req.query.allowConflict !== "true") {
        return res.status(409).json({
          message: "Scheduling conflict",
          engineerUserId,
          startsAt: toISO(startsAt),
          endsAt: toISO(endsAt),
          overlapping: overlapping.map((o) => ({
            id: o.id,
            jobId: o.jobId,
            startsAt: toISO(o.startsAt as any),
            endsAt: toISO(o.endsAt as any),
          })),
        });
      }

      const [updated] = await db
        .update(scheduleAssignments)
        .set({
          engineerUserId,
          startsAt,
          endsAt,
          requiredEngineers: parsed.data.requiredEngineers ?? (existing.requiredEngineers as any as number),
          updatedAt: new Date(),
        })
        .where(and(eq(scheduleAssignments.organizationId, organizationId), eq(scheduleAssignments.id, parsed.data.id)))
        .returning();

      res.json({
        ...updated,
        startsAt: toISO(updated.startsAt as any),
        endsAt: toISO(updated.endsAt as any),
        createdAt: toISO(updated.createdAt as any),
        updatedAt: toISO(updated.updatedAt as any),
      });
    }),
  );

  router.post(
    "/conflicts",
    ensureOrg,
    asyncHandler(async (req, res) => {
      const { organizationId } = req as any;
      const engineerUserId = String(req.body.engineerUserId || req.body.engineerId || "");
      const startsAt = new Date(String(req.body.startsAt || req.body.start || ""));
      const endsAt = new Date(String(req.body.endsAt || req.body.end || ""));
      const ignoreId = req.body.ignoreId ? String(req.body.ignoreId) : null;

      if (!engineerUserId || !(startsAt < endsAt)) {
        return res.status(400).json({ message: "Invalid payload" });
      }

      const rows = await db
        .select({
          id: scheduleAssignments.id,
          jobId: scheduleAssignments.jobId,
          startsAt: scheduleAssignments.startsAt,
          endsAt: scheduleAssignments.endsAt,
        })
        .from(scheduleAssignments)
        .where(
          and(
            eq(scheduleAssignments.organizationId, organizationId),
            eq(scheduleAssignments.engineerUserId, engineerUserId),
            ignoreId ? sql`${scheduleAssignments.id} <> ${ignoreId}` : sql`TRUE`,
            overlapWhere(startsAt, endsAt),
          ),
        );

      res.json({
        engineerUserId,
        startsAt: toISO(startsAt),
        endsAt: toISO(endsAt),
        overlapping: rows.map((r) => ({
          id: r.id,
          jobId: r.jobId,
          startsAt: toISO(r.startsAt as any),
          endsAt: toISO(r.endsAt as any),
        })),
      });
    }),
  );

  return router;
}

function buildInMemoryRouter(): Router {
  const router = Router();

  router.get(
    "/assignments",
    asyncHandler(async (_req, res) => {
      const state = getScheduleState();
      const conflicts = findConflicts(state.assignments);
      res.json({ ...state, conflicts });
    }),
  );

  router.post(
    "/assignments",
    asyncHandler(async (req, res) => {
      const body = req.body as Partial<ReturnType<typeof CreateScheduleAssignmentSchema.parse>>;
      const start = (body as any).start ?? (body as any).startsAt;
      const end = (body as any).end ?? (body as any).endsAt;
      const engineerId = (body as any).engineerId ?? (body as any).engineerUserId;
      if (!body.jobId || !engineerId || !start || !end) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const candidate: any = {
        jobId: body.jobId,
        jobTitle: (body as any).jobTitle,
        engineerId,
        engineerUserId: (body as any).engineerUserId ?? (body as any).engineerId ?? engineerId,
        engineerName: (body as any).engineerName,
        start,
        end,
        startsAt: (body as any).startsAt ?? (body as any).start ?? start,
        endsAt: (body as any).endsAt ?? (body as any).end ?? end,
        requiredEngineers: (body as any).requiredEngineers ?? 1,
        status: (body as any).status || "scheduled",
      } as any;

      const overlaps = getScheduleState().assignments.filter((a) => assignmentsOverlap(a, candidate));
      if (overlaps.length && req.query.allowConflict !== "true") {
        return res.status(409).json({
          message: "Scheduling conflict",
          engineerUserId: candidate.engineerUserId ?? candidate.engineerId,
          startsAt: candidate.startsAt ?? candidate.start,
          endsAt: candidate.endsAt ?? candidate.end,
          overlapping: overlaps.map((o) => ({
            id: o.id,
            jobId: o.jobId,
            startsAt: o.startsAt ?? o.start,
            endsAt: o.endsAt ?? o.end,
          })),
        });
      }

      const assignment = createAssignment(candidate);
      const conflicts = findConflicts(getScheduleState().assignments);
      res.status(201).json({ assignment, conflicts });
    }),
  );

  router.patch(
    "/assignments/:id",
    asyncHandler(async (req, res) => {
      const updates = req.body as any;
      const candidate = {
        ...updates,
        startsAt: updates.startsAt ?? updates.start,
        endsAt: updates.endsAt ?? updates.end,
        engineerId: updates.engineerId ?? updates.engineerUserId,
        engineerUserId: updates.engineerUserId ?? updates.engineerId,
      };
      const updated = updateAssignment(req.params.id, candidate);
      if (!updated) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      const overlaps = getScheduleState().assignments.filter(
        (a) => a.id !== updated.id && assignmentsOverlap(a, updated),
      );
      if (overlaps.length && req.query.allowConflict !== "true") {
        return res.status(409).json({
          message: "Scheduling conflict",
          engineerUserId: updated.engineerUserId ?? updated.engineerId,
          startsAt: updated.startsAt ?? updated.start,
          endsAt: updated.endsAt ?? updated.end,
          overlapping: overlaps.map((o) => ({
            id: o.id,
            jobId: o.jobId,
            startsAt: o.startsAt ?? o.start,
            endsAt: o.endsAt ?? o.end,
          })),
        });
      }
      const conflicts = findConflicts(getScheduleState().assignments);
      res.json({ assignment: updated, conflicts });
    }),
  );

  router.post(
    "/assignments/:id/duplicate",
    asyncHandler(async (req, res) => {
      const overrides = req.body as any;
      const duplicate = duplicateAssignment(req.params.id, {
        ...overrides,
        startsAt: overrides.startsAt ?? overrides.start,
        endsAt: overrides.endsAt ?? overrides.end,
        engineerId: overrides.engineerId ?? overrides.engineerUserId,
        engineerUserId: overrides.engineerUserId ?? overrides.engineerId,
        id: nanoid(),
      });
      if (!duplicate) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      const conflicts = findConflicts(getScheduleState().assignments);
      res.json({ assignment: duplicate, conflicts });
    }),
  );

  return router;
}

export function buildScheduleRouter() {
  if (!isDatabaseAvailable) return buildInMemoryRouter();
  return buildDbRouter();
}
