import { Router } from "express";
import { asyncHandler } from "../utils/routeHelpers";
import * as AssignmentService from "../services/assignment.service";

const router = Router();

router.post(
  "/assign/:jobId",
  asyncHandler(async (req, res) => {
    const out = await AssignmentService.assign(req.params.jobId);
    res.json(out);
  }),
);

router.post(
  "/simulate",
  asyncHandler(async (req, res) => {
    const out = await AssignmentService.simulate(req.body);
    res.json(out);
  }),
);

export default router;
