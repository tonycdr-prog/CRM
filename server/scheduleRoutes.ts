import { Router, type RequestHandler } from "express";
import { nanoid } from "nanoid";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { asyncHandler } from "./utils/routeHelpers";
import {
  createAssignment,
  duplicateAssignment,
  findConflicts,
  getScheduleState,
  updateScheduleState,
  updateAssignment,
  jobsFromAssignments,
  jobConflicts,
} from "./lib/scheduleAssignments";
import {
  assignmentsOverlap,
  CreateScheduleAssignmentSchema,
  ScheduleAssignment,
  ScheduleJobConflict,
  ScheduleJob,
  UpdateScheduleAssignmentSchema,
  ScheduleJobSlot,
  listScheduleConflicts,
  type ScheduleConflictDetail,
  type ScheduleAvailabilitySlot,
  type ScheduleEngineerProfile,
  type ScheduleJobTimeWindow,
} from "@shared/schedule";
import { db, isDatabaseAvailable } from "./db";
import { scheduleAssignments, scheduleEngineerProfiles, staffAvailability, staffDirectory, jobTimeWindows } from "@shared/schema";
import { isDevAuthBypassEnabled } from "./replitAuth";

const toISO = (d: Date) => d.toISOString();

// Overlap rule: [a,b) overlaps [c,d) if a < d AND c < b
const overlapWhere = (startsAt: Date, endsAt: Date) =>
  sql`${scheduleAssignments.startsAt} < ${endsAt} AND ${scheduleAssignments.endsAt} > ${startsAt}`;

function requireOrgId(req: any): string | null {
  return req.user?.organizationId || req.user?.claims?.organizationId || req.user?.claims?.org_id || null;
}

function mapDbRow(row: any): ScheduleAssignment {
  return {
    ...row,
    startsAt: (row.startsAt as Date).toISOString(),
    endsAt: (row.endsAt as Date).toISOString(),
    start: ((row as any).start as Date | undefined)?.toISOString() ?? (row.startsAt as Date).toISOString(),
    end: ((row as any).end as Date | undefined)?.toISOString() ?? (row.endsAt as Date).toISOString(),
    createdAt: (row.createdAt as Date | undefined)?.toISOString(),
    updatedAt: (row.updatedAt as Date | undefined)?.toISOString(),
  } as ScheduleAssignment;
}

const MoveJobSchema = z.object({
  jobId: z.string(),
  startAt: z.string(),
  endAt: z.string(),
});

const DuplicateJobSchema = z.object({
  jobId: z.string(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  newJobId: z.string().optional(),
});

const ScheduleUpsertSchema = z.object({
  jobId: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  engineerIds: z.array(z.string()).default([]),
  title: z.string().optional(),
  engineerId: z.string().optional(),
});

const EngineerProfileSchema = z.object({
  dailyCapacityMinutes: z.number().int().min(60).max(1440).optional(),
  workdayStart: z.string().optional(),
  workdayEnd: z.string().optional(),
  travelBufferMinutes: z.number().int().min(0).max(240).optional(),
  notes: z.string().optional().nullable(),
});

type ScheduleWarning = {
  type: "conflict" | "availability" | "capacity" | "time_window";
  engineerId: string;
  jobId: string;
  message: string;
  overlappingIds?: string[];
};

const DEFAULT_PROFILE: Omit<ScheduleEngineerProfile, "engineerUserId"> = {
  dailyCapacityMinutes: 480,
  workdayStart: "08:00",
  workdayEnd: "17:00",
  travelBufferMinutes: 30,
};

function parseTimeToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const [hh, mm] = value.split(":").map((part) => Number(part));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

function minutesBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 60000);
}

function toDateKey(value: Date) {
  return value.toISOString().split("T")[0] ?? "";
}

function isWithinTimeWindow(start: Date, end: Date, startTime: string | null | undefined, endTime: string | null | undefined) {
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);
  if (startMin === null || endMin === null) return true;
  const fromStart = start.getHours() * 60 + start.getMinutes();
  const fromEnd = end.getHours() * 60 + end.getMinutes();
  return fromStart >= startMin && fromEnd <= endMin;
}

function overlapsTimeWindow(start: Date, end: Date, startTime: string | null | undefined, endTime: string | null | undefined) {
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);
  if (startMin === null || endMin === null) return false;
  const fromStart = start.getHours() * 60 + start.getMinutes();
  const fromEnd = end.getHours() * 60 + end.getMinutes();
  return fromStart < endMin && fromEnd > startMin;
}

function availabilityMatchesDate(slot: ScheduleAvailabilitySlot, date: Date) {
  const dateKey = toDateKey(date);
  if (slot.specificDate && slot.specificDate === dateKey) return true;
  if (slot.dayOfWeek === null || slot.dayOfWeek === undefined) return false;
  if (!slot.isRecurring) return false;
  return slot.dayOfWeek === date.getDay();
}

function buildWarning(
  type: ScheduleWarning["type"],
  engineerId: string,
  jobId: string,
  message: string,
  overlappingIds?: string[],
): ScheduleWarning {
  return { type, engineerId, jobId, message, overlappingIds };
}

function buildScheduleWarnings(params: {
  assignments: ScheduleAssignment[];
  profiles: Map<string, ScheduleEngineerProfile>;
  availabilityByStaffId: Map<string, ScheduleAvailabilitySlot[]>;
  timeWindowsByJobId: Map<string, ScheduleJobTimeWindow>;
  engineerToStaffId: Map<string, string>;
}): ScheduleWarning[] {
  const warnings: ScheduleWarning[] = [];
  const minutesByEngineer = new Map<string, number>();

  params.assignments.forEach((assignment) => {
    const engineerId = assignment.engineerUserId ?? assignment.engineerId;
    if (!engineerId || engineerId === "unassigned") return;
    const start = assignment.startsAt ?? assignment.start;
    const end = assignment.endsAt ?? assignment.end;
    if (!start || !end) return;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return;

    const durationMin = Math.max(0, minutesBetween(startDate, endDate));
    minutesByEngineer.set(engineerId, (minutesByEngineer.get(engineerId) ?? 0) + durationMin);

    const profile = params.profiles.get(engineerId) ?? { engineerUserId: engineerId, ...DEFAULT_PROFILE };
    if (!isWithinTimeWindow(startDate, endDate, profile.workdayStart, profile.workdayEnd)) {
      warnings.push(
        buildWarning(
          "availability",
          engineerId,
          assignment.jobId,
          "Outside the engineer working window.",
        ),
      );
    }

    const staffId = params.engineerToStaffId.get(engineerId);
    if (staffId) {
      const slots = params.availabilityByStaffId.get(staffId) ?? [];
      const matching = slots.filter((slot) => availabilityMatchesDate(slot, startDate));
      const availableSlots = matching.filter((slot) => slot.availabilityType === "available");
      const blockedSlots = matching.filter(
        (slot) => slot.availabilityType === "unavailable" || slot.availabilityType === "holiday",
      );

      if (blockedSlots.some((slot) => overlapsTimeWindow(startDate, endDate, slot.startTime, slot.endTime))) {
        warnings.push(
          buildWarning(
            "availability",
            engineerId,
            assignment.jobId,
            "Scheduled during an unavailable or holiday window.",
          ),
        );
      } else if (availableSlots.length > 0) {
        const withinAny = availableSlots.some((slot) =>
          isWithinTimeWindow(startDate, endDate, slot.startTime, slot.endTime),
        );
        if (!withinAny) {
          warnings.push(
            buildWarning(
              "availability",
              engineerId,
              assignment.jobId,
              "Outside declared availability for this day.",
            ),
          );
        }
      }
    }

    const timeWindow = params.timeWindowsByJobId.get(assignment.jobId);
    if (timeWindow?.preferredDate) {
      const dateKey = toDateKey(startDate);
      if (dateKey !== timeWindow.preferredDate) {
        warnings.push(
          buildWarning(
            "time_window",
            engineerId,
            assignment.jobId,
            "Outside the preferred customer date.",
          ),
        );
      } else if (
        timeWindow.preferredTimeStart &&
        timeWindow.preferredTimeEnd &&
        !isWithinTimeWindow(startDate, endDate, timeWindow.preferredTimeStart, timeWindow.preferredTimeEnd)
      ) {
        warnings.push(
          buildWarning(
            "time_window",
            engineerId,
            assignment.jobId,
            "Outside the preferred customer time window.",
          ),
        );
      }
    }
  });

  minutesByEngineer.forEach((minutes, engineerId) => {
    const profile = params.profiles.get(engineerId) ?? { engineerUserId: engineerId, ...DEFAULT_PROFILE };
    if (minutes > profile.dailyCapacityMinutes) {
      warnings.push(
        buildWarning(
          "capacity",
          engineerId,
          "capacity",
          "Daily capacity exceeded for this engineer.",
        ),
      );
    }
  });

  return warnings;
}

async function loadScheduleMeta(organizationId: string, assignments: ScheduleAssignment[]) {
  const engineerIds = Array.from(
    new Set(
      assignments
        .map((a) => a.engineerUserId ?? a.engineerId)
        .filter((id): id is string => Boolean(id && id !== "unassigned")),
    ),
  );

  const staffRows = engineerIds.length
    ? await db
        .select({
          id: staffDirectory.id,
          userId: staffDirectory.userId,
          firstName: staffDirectory.firstName,
          lastName: staffDirectory.lastName,
        })
        .from(staffDirectory)
        .where(inArray(staffDirectory.userId, engineerIds))
    : [];

  const engineerToStaffId = new Map<string, string>();
  const engineers = engineerIds.map((id) => {
    const staff = staffRows.find((row) => row.userId === id);
    if (staff?.id) engineerToStaffId.set(id, staff.id);
    return {
      id,
      name: staff ? `${staff.firstName} ${staff.lastName}`.trim() : id,
      staffId: staff?.id ?? null,
    };
  });

  const profileRows = engineerIds.length
    ? await db
        .select()
        .from(scheduleEngineerProfiles)
        .where(
          and(
            eq(scheduleEngineerProfiles.organizationId, organizationId),
            inArray(scheduleEngineerProfiles.engineerUserId, engineerIds),
          ),
        )
    : [];
  const profiles = engineerIds.map((engineerId) => {
    const profile = profileRows.find((row) => row.engineerUserId === engineerId);
    return {
      engineerUserId: engineerId,
      dailyCapacityMinutes: profile?.dailyCapacityMinutes ?? DEFAULT_PROFILE.dailyCapacityMinutes,
      workdayStart: profile?.workdayStart ?? DEFAULT_PROFILE.workdayStart,
      workdayEnd: profile?.workdayEnd ?? DEFAULT_PROFILE.workdayEnd,
      travelBufferMinutes: profile?.travelBufferMinutes ?? DEFAULT_PROFILE.travelBufferMinutes,
      notes: profile?.notes ?? null,
    } satisfies ScheduleEngineerProfile;
  });

  const staffIds = Array.from(new Set(staffRows.map((row) => row.id).filter(Boolean)));
  const availabilityRows = staffIds.length
    ? await db.select().from(staffAvailability).where(inArray(staffAvailability.staffId, staffIds))
    : [];
  const availability: ScheduleAvailabilitySlot[] = availabilityRows.map((row) => ({
    id: row.id,
    staffId: row.staffId,
    dayOfWeek: row.dayOfWeek,
    specificDate: row.specificDate,
    startTime: row.startTime,
    endTime: row.endTime,
    availabilityType: row.availabilityType ?? "available",
    isRecurring: row.isRecurring ?? false,
    notes: row.notes ?? null,
  }));

  const jobIds = Array.from(new Set(assignments.map((a) => a.jobId)));
  const timeWindowRows = jobIds.length
    ? await db.select().from(jobTimeWindows).where(inArray(jobTimeWindows.jobId, jobIds))
    : [];
  const timeWindows: ScheduleJobTimeWindow[] = timeWindowRows.map((row) => ({
    jobId: row.jobId,
    preferredDate: row.preferredDate,
    preferredTimeStart: row.preferredTimeStart,
    preferredTimeEnd: row.preferredTimeEnd,
    alternateDate: row.alternateDate,
    alternateTimeStart: row.alternateTimeStart,
    alternateTimeEnd: row.alternateTimeEnd,
    accessRestrictions: row.accessRestrictions,
    confirmationStatus: row.confirmationStatus,
  }));

  const profilesByEngineer = new Map(profiles.map((profile) => [profile.engineerUserId, profile]));
  const availabilityByStaffId = availability.reduce((acc, slot) => {
    const existing = acc.get(slot.staffId) ?? [];
    existing.push(slot);
    acc.set(slot.staffId, existing);
    return acc;
  }, new Map<string, ScheduleAvailabilitySlot[]>());
  const timeWindowsByJobId = new Map(timeWindows.map((tw) => [tw.jobId, tw]));

  const warnings = buildScheduleWarnings({
    assignments,
    profiles: profilesByEngineer,
    availabilityByStaffId,
    timeWindowsByJobId,
    engineerToStaffId,
  });

  return {
    engineers,
    profiles,
    availability,
    timeWindows,
    warnings,
    profilesByEngineer,
    availabilityByStaffId,
    timeWindowsByJobId,
    engineerToStaffId,
  };
}
const DEMO_ENGINEERS = [
  { id: "eng-a", name: "Avery Demo" },
  { id: "eng-b", name: "Blake Demo" },
];

const DEMO_JOBS: ScheduleJobSlot[] = [
  {
    id: "job-demo-1",
    title: "Atrium inspection",
    startAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    assignedEngineerIds: ["eng-a"],
    site: "City HQ",
  },
  {
    id: "job-demo-2",
    title: "Garage ventilation",
    startAt: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    assignedEngineerIds: ["eng-a", "eng-b"],
    site: "Lot 12",
  },
];

function aggregateJobs(assignments: ScheduleAssignment[], jobs: ScheduleJob[] = []) {
  const jobsList = jobsFromAssignments(assignments, jobs as any);
  const conflicts: ScheduleJobConflict[] = jobConflicts(assignments);
  return { jobs: jobsList, conflicts };
}

function buildWarnings(assignments: ScheduleAssignment[], candidate: ScheduleAssignment, ignoreId?: string): ScheduleWarning[] {
  const overlaps = assignments.filter((a) => {
    if (ignoreId && a.id === ignoreId) return false;
    if (!a.engineerUserId || !candidate.engineerUserId) return false;
    if (a.engineerUserId !== candidate.engineerUserId) return false;
    return assignmentsOverlap(a, candidate);
  });
  if (!overlaps.length) return [];
  return [
    {
      type: "conflict" as const,
      engineerId: candidate.engineerUserId ?? candidate.engineerId ?? "",
      jobId: candidate.jobId,
      message: "Overlapping assignments detected.",
      overlappingIds: overlaps.map((o) => o.id),
    },
  ];
}

function computeConflicts(assignments: ScheduleAssignment[]): ScheduleConflictDetail[] {
  return listScheduleConflicts(assignments);
}

async function maybeSeedScheduleDemo(organizationId: string) {
  if (!isDevAuthBypassEnabled() || process.env.SEED_DEMO?.toLowerCase() !== "true") return;
  const existing = await db
    .select({ id: scheduleAssignments.id })
    .from(scheduleAssignments)
    .where(eq(scheduleAssignments.organizationId, organizationId))
    .limit(1);
  if (existing.length > 0) return;

  const now = new Date();
  const start = new Date(now.getTime() + 45 * 60 * 1000);
  const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  await db.insert(scheduleAssignments).values([
    {
      organizationId,
      jobId: "job-demo-1",
      engineerUserId: DEMO_ENGINEERS[0]!.id,
      startsAt: start,
      endsAt: end,
      requiredEngineers: 1,
    },
    {
      organizationId,
      jobId: "job-demo-2",
      engineerUserId: DEMO_ENGINEERS[1]!.id,
      startsAt: new Date(end.getTime() + 30 * 60 * 1000),
      endsAt: new Date(end.getTime() + 2 * 60 * 60 * 1000),
      requiredEngineers: 1,
    },
  ]);
}

function buildDbRouter(): Router {
  const router = Router();

  const ensureOrg: RequestHandler = (req, res, next) => {
    const orgId = requireOrgId(req);
    if (!orgId) return res.status(400).json({ message: "Missing organisation" });
    (req as any).organizationId = orgId;
    next();
  };

  router.get(
    "/engineer-profiles",
    ensureOrg,
    asyncHandler(async (req, res) => {
      const { organizationId } = req as any;
      const rows = await db
        .select()
        .from(scheduleEngineerProfiles)
        .where(eq(scheduleEngineerProfiles.organizationId, organizationId));
      res.json(rows.map((row) => ({
        engineerUserId: row.engineerUserId,
        dailyCapacityMinutes: row.dailyCapacityMinutes ?? DEFAULT_PROFILE.dailyCapacityMinutes,
        workdayStart: row.workdayStart ?? DEFAULT_PROFILE.workdayStart,
        workdayEnd: row.workdayEnd ?? DEFAULT_PROFILE.workdayEnd,
        travelBufferMinutes: row.travelBufferMinutes ?? DEFAULT_PROFILE.travelBufferMinutes,
        notes: row.notes ?? null,
      } satisfies ScheduleEngineerProfile)));
    }),
  );

  router.put(
    "/engineer-profiles/:engineerUserId",
    ensureOrg,
    asyncHandler(async (req, res) => {
      const { organizationId } = req as any;
      const engineerUserId = req.params.engineerUserId;
      const parsed = EngineerProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid profile payload", issues: parsed.error.issues });
      }

      const existing = await db
        .select({ id: scheduleEngineerProfiles.id })
        .from(scheduleEngineerProfiles)
        .where(
          and(
            eq(scheduleEngineerProfiles.organizationId, organizationId),
            eq(scheduleEngineerProfiles.engineerUserId, engineerUserId),
          ),
        )
        .limit(1);

      if (existing.length) {
        const [updated] = await db
          .update(scheduleEngineerProfiles)
          .set({ ...parsed.data, updatedAt: new Date() })
          .where(eq(scheduleEngineerProfiles.id, existing[0].id))
          .returning();
        return res.json({
          engineerUserId: updated.engineerUserId,
          dailyCapacityMinutes: updated.dailyCapacityMinutes ?? DEFAULT_PROFILE.dailyCapacityMinutes,
          workdayStart: updated.workdayStart ?? DEFAULT_PROFILE.workdayStart,
          workdayEnd: updated.workdayEnd ?? DEFAULT_PROFILE.workdayEnd,
          travelBufferMinutes: updated.travelBufferMinutes ?? DEFAULT_PROFILE.travelBufferMinutes,
          notes: updated.notes ?? null,
        } satisfies ScheduleEngineerProfile);
      }

      const [created] = await db
        .insert(scheduleEngineerProfiles)
        .values({
          organizationId,
          engineerUserId,
          dailyCapacityMinutes: parsed.data.dailyCapacityMinutes ?? DEFAULT_PROFILE.dailyCapacityMinutes,
          workdayStart: parsed.data.workdayStart ?? DEFAULT_PROFILE.workdayStart,
          workdayEnd: parsed.data.workdayEnd ?? DEFAULT_PROFILE.workdayEnd,
          travelBufferMinutes: parsed.data.travelBufferMinutes ?? DEFAULT_PROFILE.travelBufferMinutes,
          notes: parsed.data.notes ?? null,
        })
        .returning();

      res.status(201).json({
        engineerUserId: created.engineerUserId,
        dailyCapacityMinutes: created.dailyCapacityMinutes ?? DEFAULT_PROFILE.dailyCapacityMinutes,
        workdayStart: created.workdayStart ?? DEFAULT_PROFILE.workdayStart,
        workdayEnd: created.workdayEnd ?? DEFAULT_PROFILE.workdayEnd,
        travelBufferMinutes: created.travelBufferMinutes ?? DEFAULT_PROFILE.travelBufferMinutes,
        notes: created.notes ?? null,
      } satisfies ScheduleEngineerProfile);
    }),
  );

  router.get(
    "/",
    ensureOrg,
    asyncHandler(async (req, res) => {
      const { organizationId } = req as any;
      const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 7 * 86400000);
      const to = req.query.to ? new Date(String(req.query.to)) : new Date(Date.now() + 14 * 86400000);

      await maybeSeedScheduleDemo(organizationId);

      const rows = await db
        .select()
        .from(scheduleAssignments)
        .where(
          and(
            eq(scheduleAssignments.organizationId, organizationId),
            sql`${scheduleAssignments.startsAt} < ${to} AND ${scheduleAssignments.endsAt} > ${from}`,
          ),
        );

      const assignments = rows.map(mapDbRow);
      const { jobs } = aggregateJobs(assignments);
      const detailedConflicts = computeConflicts(assignments);
      const meta = await loadScheduleMeta(organizationId, assignments);

      res.json({
        jobs,
        conflicts: detailedConflicts,
        warnings: meta.warnings,
        assignments,
        engineers: meta.engineers,
        profiles: meta.profiles,
        availability: meta.availability,
        timeWindows: meta.timeWindows,
      });
    }),
  );

  router.post(
    "/",
    ensureOrg,
    asyncHandler(async (req, res) => {
      const { organizationId } = req as any;
      const parsed = ScheduleUpsertSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });

      const startAt = new Date(parsed.data.startAt);
      const endAt = new Date(parsed.data.endAt);
      if (!(startAt < endAt)) return res.status(400).json({ message: "startAt must be before endAt" });

      const existingRows = await db
        .select()
        .from(scheduleAssignments)
        .where(eq(scheduleAssignments.organizationId, organizationId));
      const existing = existingRows.map(mapDbRow);

      const engineerIds = parsed.data.engineerIds.length ? parsed.data.engineerIds : ["unassigned"];
      const candidates: ScheduleAssignment[] = engineerIds.map((engId) => ({
        id: nanoid(),
        jobId: parsed.data.jobId,
        engineerUserId: engId,
        engineerId: engId,
        startsAt: startAt.toISOString(),
        endsAt: endAt.toISOString(),
        start: startAt.toISOString(),
        end: endAt.toISOString(),
        requiredEngineers: 1,
        jobTitle: parsed.data.title,
      })) as ScheduleAssignment[];

      const combined = [...existing, ...candidates];
      const conflictDetails = computeConflicts(combined).filter((c) => candidates.some((cand) => cand.id === c.itemId));

      if (conflictDetails.length && req.query.allowConflict !== "true") {
        return res.status(409).json({ message: "Scheduling conflict", conflicts: conflictDetails });
      }

      const createdAssignments: ScheduleAssignment[] = [];
      for (const candidate of candidates) {
        const [inserted] = await db
          .insert(scheduleAssignments)
          .values({
            id: candidate.id,
            organizationId,
            jobId: candidate.jobId,
            engineerUserId: candidate.engineerUserId ?? "unassigned",
            startsAt: new Date(candidate.startsAt),
            endsAt: new Date(candidate.endsAt),
            requiredEngineers: candidate.requiredEngineers ?? 1,
          })
          .returning();
        createdAssignments.push(mapDbRow(inserted));
      }

      const assignments = [...existing, ...createdAssignments];
      const { jobs } = aggregateJobs(assignments);
      const detailedConflicts = computeConflicts(assignments).filter((c) =>
        createdAssignments.some((a) => a.id === c.itemId),
      );
      const meta = await loadScheduleMeta(organizationId, assignments);
      res.status(201).json({
        jobs,
        conflicts: detailedConflicts,
        warnings: meta.warnings,
        assignments,
        engineers: meta.engineers,
        profiles: meta.profiles,
        availability: meta.availability,
        timeWindows: meta.timeWindows,
      });
    }),
  );

  router.patch(
    "/:id",
    ensureOrg,
    asyncHandler(async (req, res) => {
      const { organizationId } = req as any;
      const parsed = ScheduleUpsertSchema.partial().required({ startAt: true, endAt: true }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });

      const existingRow = await db
        .select()
        .from(scheduleAssignments)
        .where(and(eq(scheduleAssignments.organizationId, organizationId), eq(scheduleAssignments.id, req.params.id)))
        .then((r) => r[0]);
      if (!existingRow) return res.status(404).json({ message: "Not found" });
      const existing = mapDbRow(existingRow);

      const startAt = new Date(parsed.data.startAt);
      const endAt = new Date(parsed.data.endAt);
      if (!(startAt < endAt)) return res.status(400).json({ message: "startAt must be before endAt" });

      const nextEngineerId = parsed.data.engineerIds?.[0] ?? parsed.data.engineerId;

      const allRows = await db
        .select()
        .from(scheduleAssignments)
        .where(eq(scheduleAssignments.organizationId, organizationId));
      const mapped = allRows.map(mapDbRow);

      const updatedAssignment: ScheduleAssignment = {
        ...existing,
        startsAt: startAt.toISOString(),
        endsAt: endAt.toISOString(),
        start: startAt.toISOString(),
        end: endAt.toISOString(),
        engineerUserId: nextEngineerId ?? existing.engineerUserId,
        engineerId: nextEngineerId ?? existing.engineerId,
      } as ScheduleAssignment;

      const others = mapped.filter((a) => a.id !== req.params.id);
      const conflictDetails = computeConflicts([...others, updatedAssignment]).filter((c) => c.itemId === updatedAssignment.id);

      if (conflictDetails.length && req.query.allowConflict !== "true") {
        return res.status(409).json({ message: "Scheduling conflict", conflicts: conflictDetails });
      }

      await db
        .update(scheduleAssignments)
        .set({
          startsAt: startAt,
          endsAt: endAt,
          updatedAt: new Date(),
          ...(nextEngineerId ? { engineerUserId: nextEngineerId } : {}),
        })
        .where(and(eq(scheduleAssignments.organizationId, organizationId), eq(scheduleAssignments.id, req.params.id)));

      const refreshedRows = await db
        .select()
        .from(scheduleAssignments)
        .where(eq(scheduleAssignments.organizationId, organizationId));
      const refreshed = refreshedRows.map(mapDbRow);
      const detailedConflicts = computeConflicts(refreshed);
      const { jobs } = aggregateJobs(refreshed);
      const meta = await loadScheduleMeta(organizationId, refreshed);
      res.json({
        jobs,
        conflicts: detailedConflicts,
        warnings: meta.warnings,
        assignments: refreshed,
        engineers: meta.engineers,
        profiles: meta.profiles,
        availability: meta.availability,
        timeWindows: meta.timeWindows,
      });
    }),
  );

  router.delete(
    "/:id",
    ensureOrg,
    asyncHandler(async (req, res) => {
      const { organizationId } = req as any;
      await db
        .delete(scheduleAssignments)
        .where(and(eq(scheduleAssignments.organizationId, organizationId), eq(scheduleAssignments.id, req.params.id)));
      res.status(204).end();
    }),
  );

  router.get(
    "/jobs",
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

      const assignments = rows.map((r) => ({
        ...r,
        startsAt: (r.startsAt as Date).toISOString(),
        endsAt: (r.endsAt as Date).toISOString(),
        start: ((r as any).start as Date | undefined)?.toISOString() ?? (r.startsAt as Date).toISOString(),
        end: ((r as any).end as Date | undefined)?.toISOString() ?? (r.endsAt as Date).toISOString(),
        createdAt: (r.createdAt as Date | undefined)?.toISOString(),
        updatedAt: (r.updatedAt as Date | undefined)?.toISOString(),
      }));

        const { jobs } = aggregateJobs(assignments);
        const conflicts = computeConflicts(assignments);

        res.json({
          jobs: jobs.map((j) => ({
            ...j,
            startAt: new Date(j.startAt).toISOString(),
            endAt: new Date(j.endAt).toISOString(),
          })),
          conflicts,
        });
      }),
    );

  router.post(
    "/move-job",
    ensureOrg,
    asyncHandler(async (req, res) => {
      const { organizationId } = req as any;
      const parsed = MoveJobSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });
      const startAt = new Date(parsed.data.startAt);
      const endAt = new Date(parsed.data.endAt);
      if (!(startAt < endAt)) return res.status(400).json({ message: "startAt must be before endAt" });

      const currentAssignments = await db
        .select()
        .from(scheduleAssignments)
        .where(and(eq(scheduleAssignments.organizationId, organizationId), eq(scheduleAssignments.jobId, parsed.data.jobId)));

      if (currentAssignments.length === 0) {
        return res.status(404).json({ message: "Job not found" });
      }

      await db
        .update(scheduleAssignments)
        .set({ startsAt: startAt, endsAt: endAt, updatedAt: new Date() })
        .where(and(eq(scheduleAssignments.organizationId, organizationId), eq(scheduleAssignments.jobId, parsed.data.jobId)));

      const allAssignments = await db
        .select()
        .from(scheduleAssignments)
        .where(eq(scheduleAssignments.organizationId, organizationId));

      const mapped = allAssignments.map((r) => ({
        ...r,
        startsAt: (r.startsAt as Date).toISOString(),
        endsAt: (r.endsAt as Date).toISOString(),
        start: ((r as any).start as Date | undefined)?.toISOString() ?? (r.startsAt as Date).toISOString(),
        end: ((r as any).end as Date | undefined)?.toISOString() ?? (r.endsAt as Date).toISOString(),
        createdAt: (r.createdAt as Date | undefined)?.toISOString(),
        updatedAt: (r.updatedAt as Date | undefined)?.toISOString(),
      }));

      const { jobs, conflicts } = aggregateJobs(mapped);
      const movedJob = jobs.find((j) => j.id === parsed.data.jobId);
      res.json({ job: movedJob, conflicts });
    }),
  );

  router.post(
    "/duplicate-job",
    ensureOrg,
    asyncHandler(async (req, res) => {
      const { organizationId } = req as any;
      const parsed = DuplicateJobSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });
      const source = await db
        .select()
        .from(scheduleAssignments)
        .where(and(eq(scheduleAssignments.organizationId, organizationId), eq(scheduleAssignments.jobId, parsed.data.jobId)));
      if (source.length === 0) return res.status(404).json({ message: "Job not found" });

      const startAt = parsed.data.startAt ? new Date(parsed.data.startAt) : (source[0].startsAt as any as Date);
      const endAt = parsed.data.endAt ? new Date(parsed.data.endAt) : (source[0].endsAt as any as Date);
      if (!(startAt < endAt)) return res.status(400).json({ message: "startAt must be before endAt" });
      const newJobId = parsed.data.newJobId ?? nanoid();

      await db.insert(scheduleAssignments).values(
        source.map((row) => ({
          organizationId,
          jobId: newJobId,
          engineerUserId: row.engineerUserId,
          startsAt: startAt,
          endsAt: endAt,
          requiredEngineers: row.requiredEngineers,
        })),
      );

      const allAssignments = await db
        .select()
        .from(scheduleAssignments)
        .where(eq(scheduleAssignments.organizationId, organizationId));
      const mapped = allAssignments.map((r) => ({
        ...r,
        startsAt: (r.startsAt as Date).toISOString(),
        endsAt: (r.endsAt as Date).toISOString(),
        start: ((r as any).start as Date | undefined)?.toISOString() ?? (r.startsAt as Date).toISOString(),
        end: ((r as any).end as Date | undefined)?.toISOString() ?? (r.endsAt as Date).toISOString(),
        createdAt: (r.createdAt as Date | undefined)?.toISOString(),
        updatedAt: (r.updatedAt as Date | undefined)?.toISOString(),
      }));
      const { jobs, conflicts } = aggregateJobs(mapped);
      const duplicate = jobs.find((j) => j.id === newJobId);
      res.json({ job: duplicate, conflicts });
    }),
  );

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

      const candidateId = nanoid();

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
        const conflicts: ScheduleConflictDetail[] = overlapping.map((o) => ({
          engineerId: engineerUserId,
          itemId: candidateId,
          itemJobId: parsed.data.jobId,
          overlapsWithId: o.id,
          overlapsWithJobId: o.jobId,
          overlapRange: { start: toISO(startsAt), end: toISO(endsAt) },
        }));
        return res.status(409).json({
          message: "Scheduling conflict",
          conflicts,
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
          id: candidateId,
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
        const conflicts: ScheduleConflictDetail[] = overlapping.map((o) => ({
          engineerId: engineerUserId,
          itemId: parsed.data.id,
          itemJobId: existing.jobId,
          overlapsWithId: o.id,
          overlapsWithJobId: o.jobId,
          overlapRange: { start: toISO(startsAt), end: toISO(endsAt) },
        }));
        return res.status(409).json({ message: "Scheduling conflict", conflicts });
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

    router.get(
      "/conflicts",
      ensureOrg,
      asyncHandler(async (req, res) => {
        const { organizationId } = req as any;
        const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 7 * 86400000);
        const to = req.query.to ? new Date(String(req.query.to)) : new Date(Date.now() + 14 * 86400000);
        const engineerFilter = req.query.engineerId ? String(req.query.engineerId) : null;

        const rows = await db
          .select()
          .from(scheduleAssignments)
          .where(
            and(
              eq(scheduleAssignments.organizationId, organizationId),
              sql`${scheduleAssignments.startsAt} < ${to} AND ${scheduleAssignments.endsAt} > ${from}`,
              engineerFilter ? eq(scheduleAssignments.engineerUserId, engineerFilter) : sql`TRUE`,
            ),
          );

        const assignments = rows.map(mapDbRow);
        const conflicts = computeConflicts(assignments);
        res.json({ conflicts });
      }),
    );

  return router;
}

function buildInMemoryRouter(): Router {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      const state = getScheduleState();
      const { jobs, conflicts } = aggregateJobs(state.assignments, state.jobs as any);
      const profiles = state.engineers.map((engineer) => ({
        engineerUserId: engineer.id,
        dailyCapacityMinutes: DEFAULT_PROFILE.dailyCapacityMinutes,
        workdayStart: DEFAULT_PROFILE.workdayStart,
        workdayEnd: DEFAULT_PROFILE.workdayEnd,
        travelBufferMinutes: DEFAULT_PROFILE.travelBufferMinutes,
        notes: null,
      }));
      const warnings = buildScheduleWarnings({
        assignments: state.assignments,
        profiles: new Map(profiles.map((profile) => [profile.engineerUserId, profile])),
        availabilityByStaffId: new Map(),
        timeWindowsByJobId: new Map(),
        engineerToStaffId: new Map(),
      });
      res.json({
        jobs,
        conflicts,
        warnings,
        assignments: state.assignments,
        engineers: state.engineers.map((engineer) => ({ id: engineer.id, name: engineer.name })),
        profiles,
        availability: [],
        timeWindows: [],
      });
    }),
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const parsed = ScheduleUpsertSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });

      const startAt = new Date(parsed.data.startAt);
      const endAt = new Date(parsed.data.endAt);
      if (!(startAt < endAt)) return res.status(400).json({ message: "startAt must be before endAt" });

      const state = getScheduleState();
      const engineerIds = parsed.data.engineerIds.length ? parsed.data.engineerIds : ["unassigned"];
      const created: ScheduleAssignment[] = [];
      let warnings: ScheduleWarning[] = [];
      const candidates: ScheduleAssignment[] = engineerIds.map((engId) => ({
        id: nanoid(),
        jobId: parsed.data.jobId,
        engineerId: engId,
        engineerUserId: engId,
        startsAt: startAt.toISOString(),
        endsAt: endAt.toISOString(),
        start: startAt.toISOString(),
        end: endAt.toISOString(),
        requiredEngineers: 1,
        jobTitle: parsed.data.title,
      })) as ScheduleAssignment[];

      const conflictDetails = computeConflicts([...state.assignments, ...candidates]).filter((c) =>
        candidates.some((cand) => cand.id === c.itemId),
      );
      if (conflictDetails.length && req.query.allowConflict !== "true") {
        return res.status(409).json({ message: "Scheduling conflict", conflicts: conflictDetails });
      }

      candidates.forEach((candidate) => {
        warnings = warnings.concat(buildWarnings(state.assignments, candidate));
        created.push(createAssignment(candidate));
      });

      const { assignments } = getScheduleState();
      const { jobs } = aggregateJobs(assignments, state.jobs as any);
      const conflicts = computeConflicts(assignments).filter((c) => created.some((a) => a.id === c.itemId));
      const profiles = state.engineers.map((engineer) => ({
        engineerUserId: engineer.id,
        dailyCapacityMinutes: DEFAULT_PROFILE.dailyCapacityMinutes,
        workdayStart: DEFAULT_PROFILE.workdayStart,
        workdayEnd: DEFAULT_PROFILE.workdayEnd,
        travelBufferMinutes: DEFAULT_PROFILE.travelBufferMinutes,
        notes: null,
      }));
      const scheduleWarnings = buildScheduleWarnings({
        assignments,
        profiles: new Map(profiles.map((profile) => [profile.engineerUserId, profile])),
        availabilityByStaffId: new Map(),
        timeWindowsByJobId: new Map(),
        engineerToStaffId: new Map(),
      });
      res.status(201).json({
        jobs,
        conflicts,
        warnings: scheduleWarnings,
        assignments,
        engineers: state.engineers.map((engineer) => ({ id: engineer.id, name: engineer.name })),
        profiles,
        availability: [],
        timeWindows: [],
      });
    }),
  );

  router.patch(
    "/:id",
    asyncHandler(async (req, res) => {
      const parsed = ScheduleUpsertSchema.partial().required({ startAt: true, endAt: true }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });

      const startAt = new Date(parsed.data.startAt);
      const endAt = new Date(parsed.data.endAt);
      if (!(startAt < endAt)) return res.status(400).json({ message: "startAt must be before endAt" });

      const engineerId = parsed.data.engineerIds?.[0] ?? parsed.data.engineerId;
      const updated = updateAssignment(req.params.id, {
        startsAt: startAt.toISOString(),
        endsAt: endAt.toISOString(),
        start: startAt.toISOString(),
        end: endAt.toISOString(),
        engineerId,
        engineerUserId: engineerId,
      });

      if (!updated) return res.status(404).json({ message: "Assignment not found" });
      const state = getScheduleState();
      const { jobs, conflicts } = aggregateJobs(state.assignments, state.jobs as any);
      const profiles = state.engineers.map((engineer) => ({
        engineerUserId: engineer.id,
        dailyCapacityMinutes: DEFAULT_PROFILE.dailyCapacityMinutes,
        workdayStart: DEFAULT_PROFILE.workdayStart,
        workdayEnd: DEFAULT_PROFILE.workdayEnd,
        travelBufferMinutes: DEFAULT_PROFILE.travelBufferMinutes,
        notes: null,
      }));
      const warnings = buildScheduleWarnings({
        assignments: state.assignments,
        profiles: new Map(profiles.map((profile) => [profile.engineerUserId, profile])),
        availabilityByStaffId: new Map(),
        timeWindowsByJobId: new Map(),
        engineerToStaffId: new Map(),
      });
      res.json({
        jobs,
        conflicts,
        warnings,
        assignments: state.assignments,
        engineers: state.engineers.map((engineer) => ({ id: engineer.id, name: engineer.name })),
        profiles,
        availability: [],
        timeWindows: [],
      });
    }),
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      updateScheduleState({
        ...getScheduleState(),
        assignments: getScheduleState().assignments.filter((a) => a.id !== req.params.id),
      });
      res.status(204).end();
    }),
  );

    router.get(
      "/jobs",
      asyncHandler(async (_req, res) => {
        const state = getScheduleState();
        const { jobs, conflicts } = aggregateJobs(state.assignments, state.jobs as any);
        res.json({ jobs, conflicts });
      }),
    );

    router.get(
      "/conflicts",
      asyncHandler(async (_req, res) => {
        const state = getScheduleState();
        const conflicts = computeConflicts(state.assignments);
        res.json({ conflicts });
      }),
    );

  router.post(
    "/move-job",
    asyncHandler(async (req, res) => {
      const parsed = MoveJobSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });
      const startAt = new Date(parsed.data.startAt);
      const endAt = new Date(parsed.data.endAt);
      if (!(startAt < endAt)) return res.status(400).json({ message: "startAt must be before endAt" });

      const state = getScheduleState();
      const matching = state.assignments.filter((a) => a.jobId === parsed.data.jobId);
      if (matching.length === 0) return res.status(404).json({ message: "Job not found" });

      const duration = matching[0].endsAt && matching[0].startsAt ? new Date(matching[0].endsAt).getTime() - new Date(matching[0].startsAt).getTime() : new Date(parsed.data.endAt).getTime() - new Date(parsed.data.startAt).getTime();

      const updatedAssignments = state.assignments.map((a) => {
        if (a.jobId !== parsed.data.jobId) return a;
        const nextEnd = new Date(startAt.getTime() + duration);
        return {
          ...a,
          startsAt: startAt.toISOString(),
          endsAt: nextEnd.toISOString(),
          start: startAt.toISOString(),
          end: nextEnd.toISOString(),
        };
      });
      updateScheduleState({ ...state, assignments: updatedAssignments });
      const { jobs, conflicts } = aggregateJobs(updatedAssignments, state.jobs);
      const job = jobs.find((j) => j.id === parsed.data.jobId);
      res.json({ job, conflicts });
    }),
  );

  router.post(
    "/duplicate-job",
    asyncHandler(async (req, res) => {
      const parsed = DuplicateJobSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });
      const state = getScheduleState();
      const matching = state.assignments.filter((a) => a.jobId === parsed.data.jobId);
      if (matching.length === 0) return res.status(404).json({ message: "Job not found" });
      const startAt = parsed.data.startAt ? new Date(parsed.data.startAt) : new Date(matching[0].startsAt ?? matching[0].start ?? new Date());
      const endAt = parsed.data.endAt
        ? new Date(parsed.data.endAt)
        : new Date(matching[0].endsAt ?? matching[0].end ?? new Date(startAt.getTime() + 60 * 60 * 1000));
      const duration = endAt.getTime() - startAt.getTime();
      const newJobId = parsed.data.newJobId ?? nanoid();
      const duplicates = matching.map((m) => ({
        ...m,
        id: nanoid(),
        jobId: newJobId,
        startsAt: startAt.toISOString(),
        endsAt: new Date(startAt.getTime() + duration).toISOString(),
        start: startAt.toISOString(),
        end: new Date(startAt.getTime() + duration).toISOString(),
      }));
      updateScheduleState({ ...state, assignments: [...state.assignments, ...duplicates] });
      const { jobs, conflicts } = aggregateJobs(getScheduleState().assignments, state.jobs);
      const job = jobs.find((j) => j.id === newJobId);
      res.json({ job, conflicts });
    }),
  );

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
          const conflicts: ScheduleConflictDetail[] = overlaps.map((o) => ({
            engineerId: updated.engineerUserId ?? updated.engineerId ?? "",
            itemId: updated.id,
            itemJobId: updated.jobId ?? "",
            overlapsWithId: o.id,
            overlapsWithJobId: o.jobId,
            overlapRange: { start: updated.startsAt ?? updated.start, end: updated.endsAt ?? updated.end },
          }));
          return res.status(409).json({ message: "Scheduling conflict", conflicts });
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
