import { Router } from "express";
import { asyncHandler } from "../utils/routeHelpers";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({
      cursor: new Date().toISOString(),
      changes: { jobs: [], assets: [], forms: [], instances: [], attachments: [], defects: [] },
    });
  }),
);

router.post(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, applied: [] });
  }),
);

export default router;
