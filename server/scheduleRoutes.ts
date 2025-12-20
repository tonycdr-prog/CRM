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
      if (!body.jobId || !body.jobTitle || !body.engineerId || !body.engineerName || !body.start || !body.end) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const assignment = createAssignment({
        jobId: body.jobId,
        jobTitle: body.jobTitle,
        engineerId: body.engineerId,
        engineerName: body.engineerName,
        start: body.start,
        end: body.end,
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
      const updated = updateAssignment(req.params.id, updates);
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
