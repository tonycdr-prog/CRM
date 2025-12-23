import { Router } from "express";
import { asyncHandler } from "../utils/routeHelpers";
import { SubmitBodySchema } from "@shared/contracts/api/forms.submit";
import * as FormsService from "../services/forms.service";

const router = Router();

router.get(
  "/templates",
  asyncHandler(async (req, res) => {
    const tag = typeof req.query.tag === "string" ? req.query.tag : undefined;
    const templates = await FormsService.listTemplates(tag);
    res.json({ data: templates });
  }),
);

router.post(
  "/validate",
  asyncHandler(async (req, res) => {
    const body = SubmitBodySchema.partial({ formId: true }).parse(req.body);
    const result = await FormsService.validate(body);
    res.json(result);
  }),
);

router.post(
  "/submit",
  asyncHandler(async (req, res) => {
    const body = SubmitBodySchema.parse(req.body);
    const result = await FormsService.submit(body, (req as any).user?.claims?.sub);
    res.json(result);
  }),
);

export default router;
