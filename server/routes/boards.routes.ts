import { Router } from "express";
import { asyncHandler } from "../utils/routeHelpers";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({ data: [] });
  }),
);

router.post(
  "/",
  asyncHandler(async (_req, res) => {
    res.status(201).json({ ok: true });
  }),
);

export default router;
