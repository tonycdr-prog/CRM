import { Router } from "express";
import { z } from "zod";
import { asyncHandler, getUserId, type AuthenticatedRequest } from "./utils/routeHelpers";
import {
  DbFormsRepository,
  entityPayloadSchema,
  FormsRepository,
  InMemoryFormsRepository,
} from "./lib/forms";
import {
  entityTemplateDefinitionSchema,
  formFieldSchema,
  insertEntityInstanceReadingSchema,
  insertFormsCoreSubmissionSchema,
  insertFormsCoreTemplateSchema,
  insertFormsCoreVersionSchema,
  insertMeterCalibrationSchema,
  insertMeterSchema,
} from "@shared/schema";

const createTemplateSchema = insertFormsCoreTemplateSchema.pick({
  name: true,
  description: true,
  organizationId: true,
}).extend({ organizationId: z.string().optional() });

const createVersionSchema = insertFormsCoreVersionSchema
  .pick({ title: true, notes: true })
  .extend({ entities: z.array(entityTemplateDefinitionSchema).optional() });

const createSubmissionSchema = insertFormsCoreSubmissionSchema.pick({
  formVersionId: true,
  jobId: true,
  organizationId: true,
}).extend({ organizationId: z.string().optional() });

const createMeterSchema = insertMeterSchema.pick({
  name: true,
  serialNumber: true,
  model: true,
  organizationId: true,
}).extend({ organizationId: z.string().optional() });

const dateValue = z.preprocess((val) => (typeof val === "string" ? new Date(val) : val), z.date());

const createCalibrationSchema = z.object({
  calibratedAt: dateValue.optional(),
  expiresAt: dateValue,
  certificateUrl: z.string().optional().nullable(),
});

const createReadingSchema = insertEntityInstanceReadingSchema.pick({
  meterId: true,
  calibrationId: true,
  reading: true,
});

const generateFromSystemTypeSchema = z.object({
  systemTypeCode: z.string().min(1),
  templateName: z.string().min(1),
  organizationId: z.string().optional(),
});

export function resolveOrganizationId(req: AuthenticatedRequest, provided?: string) {
  return (
    provided ||
    ((req as any).user?.claims?.organizationId as string | undefined) ||
    (req.headers["x-org-id"] as string | undefined) ||
    "demo-org"
  );
}

function handleError(res: any, error: unknown) {
  const message = error instanceof Error ? error.message : "Invalid request";
  res.status(400).json({ message });
}

export function createFormsRouter(options?: { repository?: FormsRepository }) {
  const repository = options?.repository ?? new DbFormsRepository();
  const router = Router();

  router.get(
    "/templates",
    asyncHandler(async (req, res) => {
      const orgId = resolveOrganizationId(req as AuthenticatedRequest, req.query.organizationId as string | undefined);
      const templates = await repository.listTemplates(orgId);
      res.json({ templates });
    }),
  );

  router.post(
    "/templates",
    asyncHandler(async (req, res) => {
      const userId = getUserId(req as AuthenticatedRequest);
      try {
        const parsed = createTemplateSchema.parse(req.body ?? {});
        const organizationId = resolveOrganizationId(req as AuthenticatedRequest, parsed.organizationId);
        const template = await repository.createTemplate({
          ...parsed,
          organizationId,
          createdByUserId: userId,
        });
        res.status(201).json({ template });
      } catch (error) {
        handleError(res, error);
      }
    }),
  );

  router.post(
    "/templates/:templateId/versions",
    asyncHandler(async (req, res) => {
      const userId = getUserId(req as AuthenticatedRequest);
      try {
        const parsed = createVersionSchema.parse(req.body ?? {});
        const version = await repository.createVersion(req.params.templateId, userId, {
          ...parsed,
          templateId: req.params.templateId,
          createdByUserId: userId,
        });

        if (parsed.entities?.length) {
          for (const entity of parsed.entities) {
            await repository.addEntity(version.id, userId, {
              formVersionId: version.id,
              title: entity.title,
              description: entity.description,
              sortOrder: entity.sortOrder ?? 0,
              definition: {
                title: entity.title,
                description: entity.description,
                fields: entity.fields,
                sortOrder: entity.sortOrder ?? 0,
                repeatPerAsset: entity.repeatPerAsset ?? false,
              },
              createdByUserId: userId,
            } as any);
          }
        }

        res.status(201).json({ version });
      } catch (error) {
        handleError(res, error);
      }
    }),
  );

  router.post(
    "/versions/:versionId/entities",
    asyncHandler(async (req, res) => {
      const userId = getUserId(req as AuthenticatedRequest);
      try {
        const parsed = entityPayloadSchema
          .omit({ formVersionId: true, createdByUserId: true })
          .extend({
            formVersionId: z.string().min(1),
            createdByUserId: z.string().optional(),
            definition: entityPayloadSchema.shape.definition.extend({
              fields: z.array(formFieldSchema),
            }),
          })
          .parse({ ...req.body, formVersionId: req.params.versionId });
        const entity = await repository.addEntity(req.params.versionId, userId, {
          ...parsed,
          createdByUserId: userId,
          definition: {
            ...parsed.definition,
            repeatPerAsset: parsed.definition.repeatPerAsset ?? false,
          },
        });
        if (!entity) return res.status(404).json({ message: "Version not found" });
        res.status(201).json({ entity });
      } catch (error) {
        handleError(res, error);
      }
    }),
  );

  router.post(
    "/versions/:versionId/publish",
    asyncHandler(async (req, res) => {
      try {
        const version = await repository.publishVersion(req.params.versionId, getUserId(req as AuthenticatedRequest));
        if (!version) return res.status(404).json({ message: "Version not found" });
        res.json({ version });
      } catch (error) {
        handleError(res, error);
      }
    }),
  );

  router.get(
    "/versions",
    asyncHandler(async (req, res) => {
      const orgId = resolveOrganizationId(req as AuthenticatedRequest, req.query.organizationId as string | undefined);
      const versions = await repository.listPublishedVersions(orgId);
      res.json({ versions });
    }),
  );

  router.post(
    "/generate-from-system-type",
    asyncHandler(async (req, res) => {
      const userId = getUserId(req as AuthenticatedRequest);
      try {
        const parsed = generateFromSystemTypeSchema.parse(req.body ?? {});
        const organizationId = resolveOrganizationId(req as AuthenticatedRequest, parsed.organizationId);
        const result = await repository.generateFromSystemType({
          ...parsed,
          organizationId,
          createdByUserId: userId,
        });
        res.status(201).json(result);
      } catch (error) {
        handleError(res, error);
      }
    }),
  );

  router.post(
    "/submissions",
    asyncHandler(async (req, res) => {
      const userId = getUserId(req as AuthenticatedRequest);
      try {
        const parsed = createSubmissionSchema.parse(req.body ?? {});
        const organizationId = resolveOrganizationId(req as AuthenticatedRequest, parsed.organizationId);
        const submission = await repository.createSubmission(
          { ...parsed, organizationId, createdByUserId: userId },
          userId,
        );
        res.status(201).json({ submission });
      } catch (error) {
        handleError(res, error);
      }
    }),
  );

  router.get(
    "/submissions/:submissionId",
    asyncHandler(async (req, res) => {
      const submission = await repository.getSubmission(req.params.submissionId);
      if (!submission) return res.status(404).json({ message: "Submission not found" });
      res.json({ submission });
    }),
  );

  router.post(
    "/submissions/:submissionId/instantiate",
    asyncHandler(async (req, res) => {
      const userId = getUserId(req as AuthenticatedRequest);
      try {
        const result = await repository.instantiateEntitiesForAssets(req.params.submissionId, userId);
        if (!result.submission) return res.status(404).json({ message: "Submission not found" });
        res.json(result);
      } catch (error) {
        handleError(res, error);
      }
    }),
  );

  router.post(
    "/submissions/:submissionId/entities/:entityInstanceId/answers",
    asyncHandler(async (req, res) => {
      const userId = getUserId(req as AuthenticatedRequest);
      try {
        const answers = z.record(z.unknown()).parse(req.body?.answers ?? req.body ?? {});
        const updated = await repository.saveAnswers(
          req.params.submissionId,
          req.params.entityInstanceId,
          answers,
          userId,
        );
        if (!updated) return res.status(404).json({ message: "Entity instance not found" });
        res.json({ entity: updated });
      } catch (error) {
        handleError(res, error);
      }
    }),
  );

  router.post(
    "/entity-instances/:entityInstanceId/readings",
    asyncHandler(async (req, res) => {
      const userId = getUserId(req as AuthenticatedRequest);
      try {
        const parsed = createReadingSchema.parse(req.body ?? {});
        const result = await repository.recordReading(req.params.entityInstanceId, parsed, userId);
        if (!result.reading) return res.status(404).json({ message: "Entity instance not found" });
        res.status(result.warnings?.length ? 200 : 201).json({
          reading: result.reading,
          warnings: result.warnings ?? [],
        });
      } catch (error) {
        handleError(res, error);
      }
    }),
  );

  router.post(
    "/submissions/:submissionId/submit",
    asyncHandler(async (req, res) => {
      try {
        const result = await repository.submitSubmission(
          req.params.submissionId,
          getUserId(req as AuthenticatedRequest),
        );
        if (!result.submission) return res.status(404).json({ message: "Submission not found" });
        res.json({ submission: result.submission, warnings: result.warnings ?? [] });
      } catch (error) {
        handleError(res, error);
      }
    }),
  );

  return router;
}

export function createInMemoryFormsRouter() {
  return createFormsRouter({ repository: new InMemoryFormsRepository() });
}

export function createMetersRouter(options?: { repository?: FormsRepository }) {
  const repository = options?.repository ?? new DbFormsRepository();
  const router = Router();

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const userId = getUserId(req as AuthenticatedRequest);
      try {
        const parsed = createMeterSchema.parse(req.body ?? {});
        const organizationId = resolveOrganizationId(req as AuthenticatedRequest, parsed.organizationId);
        const meter = await repository.createMeter({ ...parsed, organizationId }, userId);
        res.status(201).json({ meter });
      } catch (error) {
        handleError(res, error);
      }
    }),
  );

  router.post(
    "/:meterId/calibrations",
    asyncHandler(async (req, res) => {
      const userId = getUserId(req as AuthenticatedRequest);
      try {
        const parsed = createCalibrationSchema.parse(req.body ?? {});
        const calibration = await repository.addCalibration(req.params.meterId, parsed, userId);
        if (!calibration) return res.status(404).json({ message: "Meter not found" });
        res.status(201).json({ calibration });
      } catch (error) {
        handleError(res, error);
      }
    }),
  );

  router.get(
    "/active",
    asyncHandler(async (req, res) => {
      const organizationId = resolveOrganizationId(req as AuthenticatedRequest, req.query.organizationId as string | undefined);
      const meters = await repository.listActiveMeters(organizationId);
      res.json({ meters });
    }),
  );

  return router;
}

export function createInMemoryMetersRouter() {
  return createMetersRouter({ repository: new InMemoryFormsRepository() });
}
