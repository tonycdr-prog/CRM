import { Router } from "express";
import { asyncHandler } from "../utils/routeHelpers";

const router = Router();

router.post(
  "/ingest",
  asyncHandler(async (_req, res) => {
    res.status(202).json({ ok: true });
  }),
);

export default router;
