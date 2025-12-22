import { Router } from "express";
import { nanoid } from "nanoid";
import { asyncHandler } from "./utils/routeHelpers";
import {
  createAssignment,
  duplicateAssignment,
  findConflicts,
  getScheduleState,
  updateAssignment,
} from "./lib/scheduleAssignments";
import { ScheduleAssignment } from "@shared/schedule";

export function buildScheduleRouter() {
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
      const body = req.body as Partial<ScheduleAssignment>;
      const start = body.start ?? body.startsAt;
      const end = body.end ?? body.endsAt;
      const engineerId = body.engineerId ?? body.engineerUserId;
      if (!body.jobId || !body.jobTitle || !engineerId || !body.engineerName || !start || !end) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const assignment = createAssignment({
        jobId: body.jobId,
        jobTitle: body.jobTitle,
        engineerId,
        engineerUserId: body.engineerUserId ?? body.engineerId ?? engineerId,
        engineerName: body.engineerName,
        start,
        end,
        startsAt: body.startsAt ?? body.start ?? start,
        endsAt: body.endsAt ?? body.end ?? end,
        requiredEngineers: body.requiredEngineers ?? 1,
        status: body.status || "scheduled",
      });
      const conflicts = findConflicts(getScheduleState().assignments);
      res.json({ assignment, conflicts });
    }),
  );

  router.put(
    "/assignments/:id",
    asyncHandler(async (req, res) => {
      const updates = req.body as Partial<ScheduleAssignment>;
      const updated = updateAssignment(req.params.id, {
        ...updates,
        startsAt: updates.startsAt ?? updates.start,
        endsAt: updates.endsAt ?? updates.end,
        engineerId: updates.engineerId ?? updates.engineerUserId,
        engineerUserId: updates.engineerUserId ?? updates.engineerId,
      });
      if (!updated) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      const conflicts = findConflicts(getScheduleState().assignments);
      res.json({ assignment: updated, conflicts });
    }),
  );

  router.post(
    "/assignments/:id/duplicate",
    asyncHandler(async (req, res) => {
      const overrides = req.body as Partial<ScheduleAssignment>;
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
