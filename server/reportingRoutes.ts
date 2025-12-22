import { Router } from "express";
import { z } from "zod";
import { asyncHandler, getUserId, type AuthenticatedRequest } from "./utils/routeHelpers";
import {
  DbReportingRepository,
  InMemoryReportingRepository,
  type ReportingRepository,
} from "./lib/reporting";
import { DbFormsRepository, InMemoryFormsRepository, type FormsRepository } from "./lib/forms";

const createReportSchema = z.object({
  submissionId: z.string().min(1),
  reportType: z.string().min(1),
});

const signReportSchema = z.object({
  role: z.string().min(1),
});

const createDefectSchema = z.object({
  jobId: z.string().min(1),
  assetId: z.string().optional(),
  entityInstanceId: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  title: z.string().optional(),
  description: z.string().min(1),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).default("open"),
});

const updateDefectSchema = createDefectSchema.partial();

const remedialSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved"]).default("open"),
  notes: z.string().optional(),
});

export function createReportingRouter(options?: {
  repository?: ReportingRepository;
  formsRepository?: FormsRepository;
}) {
  const formsRepository = options?.formsRepository ?? new DbFormsRepository();
  const repository = options?.repository ?? new DbReportingRepository(formsRepository);
  const router = Router();

  router.post(
    "/reports",
    asyncHandler(async (req, res) => {
      const userId = getUserId(req as AuthenticatedRequest);
      const parsed = createReportSchema.parse(req.body ?? {});
      const report = await repository.createReport({ ...parsed, userId });
      res.status(201).json({ report });
    }),
  );

  router.get(
    "/reports/:id",
    asyncHandler(async (req, res) => {
      const report = await repository.getReport(req.params.id);
      if (!report) return res.status(404).json({ message: "Report not found" });
      res.json({ report });
    }),
  );

  router.post(
    "/reports/:id/sign",
    asyncHandler(async (req, res) => {
      const userId = getUserId(req as AuthenticatedRequest);
      const parsed = signReportSchema.parse(req.body ?? {});
      const signature = await repository.signReport(req.params.id, userId, parsed.role);
      if (!signature) return res.status(404).json({ message: "Report not found" });
      res.status(201).json({ signature });
    }),
  );

  router.post(
    "/defects",
    asyncHandler(async (req, res) => {
      const userId = getUserId(req as AuthenticatedRequest);
      const parsed = createDefectSchema.parse(req.body ?? {});
      const defect = await repository.createDefect(parsed, userId);
      res.status(201).json({ defect });
    }),
  );

  router.get(
    "/defects",
    asyncHandler(async (req, res) => {
      const defects = await repository.listDefects(req.query.jobId as string | undefined);
      res.json({ defects });
    }),
  );

  router.patch(
    "/defects/:id",
    asyncHandler(async (req, res) => {
      const userId = getUserId(req as AuthenticatedRequest);
      const parsed = updateDefectSchema.parse(req.body ?? {});
      const defect = await repository.updateDefect(req.params.id, parsed, userId);
      if (!defect) return res.status(404).json({ message: "Defect not found" });
      res.json({ defect });
    }),
  );

  router.post(
    "/defects/:id/remedials",
    asyncHandler(async (req, res) => {
      const userId = getUserId(req as AuthenticatedRequest);
      const parsed = remedialSchema.parse(req.body ?? {});
      const remedial = await repository.addRemedial(req.params.id, parsed, userId);
      if (!remedial) return res.status(404).json({ message: "Defect not found" });
      res.status(201).json({ remedial });
    }),
  );

  return router;
}

export function createInMemoryReportingRouter() {
  const formsRepo = new InMemoryFormsRepository();
  const reportingRepo = new InMemoryReportingRepository(formsRepo);
  return createReportingRouter({ repository: reportingRepo, formsRepository: formsRepo });
}
