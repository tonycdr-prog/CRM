import { randomUUID } from "crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  entityTemplateDefinitionSchema,
  formsCoreEntities,
  formsCoreInstances,
  formsCoreSubmissions,
  formsCoreTemplates,
  formsCoreVersions,
  insertEntityInstanceReadingSchema,
  insertFormsCoreEntitySchema,
  insertFormsCoreSubmissionSchema,
  insertFormsCoreTemplateSchema,
  insertFormsCoreVersionSchema,
  insertMeterCalibrationSchema,
  insertMeterSchema,
  jobSiteAssets,
  meterCalibrations,
  meters,
  organizations,
  siteAssets,
  entityInstanceReadings,
  systemTypes,
  entityLibrary,
  systemTypeRequiredEntities,
  formTemplateSystemTypes,
  type EntityTemplateDefinition,
  type EntityInstanceReading,
  type FormsCoreEntity,
  type FormsCoreInstance,
  type FormsCoreSubmission,
  type FormsCoreTemplate,
  type FormsCoreVersion,
  type SystemType,
  type EntityLibrary,
  type Meter,
  type MeterCalibration,
} from "@shared/schema";
import {
  SMOKE_ENTITY_LIBRARY,
  SMOKE_LIBRARY_ORG_ID,
  SMOKE_REQUIRED_SETS,
  SMOKE_SYSTEM_TYPES,
  type SmokeEntityLibraryEntry,
  type SmokeSystemTypeCatalogEntry,
} from "./smokeControlLibrary";
import { z } from "zod";

type Database = typeof import("../db")["db"];
let cachedDb: Database | null = null;
async function getDb(): Promise<Database> {
  if (!cachedDb) {
    cachedDb = (await import("../db")).db;
  }
  return cachedDb;
}

const blockUntestedAssets = process.env.FORMS_BLOCK_UNTESTED_ASSETS === "true";

function buildAssetWarnings(
  assets: JobAssetSummary[],
  entities: EntityTemplateRecord[],
  instances: FormsCoreInstance[],
) {
  const repeatable = entities.filter((e) => e.definition?.repeatPerAsset);
  if (!repeatable.length || !assets.length) return [] as string[];
  const missing = assets.filter((asset) =>
    repeatable.some((entity) => {
      const instance = instances.find(
        (i) => i.entityTemplateId === entity.id && i.assetId === asset.id,
      );
      if (!instance) return true;
      const answered = instance.answers && Object.keys(instance.answers).length > 0;
      return !answered;
    }),
  );
  return missing.length ? [`Untested assets: ${missing.map((a) => a.label || a.id).join(", ")}`] : [];
}

function isCalibrationExpired(calibration?: { expiresAt?: Date | null | string } | null) {
  if (!calibration?.expiresAt) return false;
  return new Date(calibration.expiresAt).getTime() < Date.now();
}

function buildCalibrationWarnings(readings: EntityInstanceReadingRecord[]) {
  const expired = readings.filter((reading) => isCalibrationExpired(reading.calibration));
  if (!expired.length) return [] as string[];
  return expired.map(
    (reading) => `Calibration expired for meter ${reading.meter?.name ?? reading.meterId ?? "unknown"}`,
  );
}

export type FormTemplateRecord = FormsCoreTemplate & { versions: FormVersionRecord[] };
export type FormVersionRecord = FormsCoreVersion & { entities: EntityTemplateRecord[] };
export type EntityTemplateRecord = FormsCoreEntity;
export type MeterRecord = Meter & { activeCalibration?: MeterCalibration | null };

export type EntityInstanceReadingRecord = EntityInstanceReading & {
  meter?: Meter | null;
  calibration?: MeterCalibration | null;
};

export type FormSubmissionRecord = FormsCoreSubmission & {
  entities: Array<FormsCoreInstance & { entityTemplateId: string }>;
  readings: EntityInstanceReadingRecord[];
};

export type JobAssetSummary = { id: string; label: string; location?: string | null };
export type SmokeSystemTypeRecord = SystemType;
export type LibraryEntityRecord = EntityLibrary & { sortOrder?: number | null };
export type GeneratedTemplate = { template: FormTemplateRecord; version: FormVersionRecord };

export type InstantiateResult = {
  submission: FormSubmissionRecord | null;
  created: number;
  skipped: number;
  assets: JobAssetSummary[];
};

export type SubmitResult = { submission: FormSubmissionRecord | null; warnings?: string[] };
export type RecordReadingResult = { reading: EntityInstanceReadingRecord | null; warnings?: string[] };

type MeterInput = Omit<z.input<typeof insertMeterSchema>, "createdByUserId">;
type CalibrationInput = Omit<z.input<typeof insertMeterCalibrationSchema>, "createdByUserId" | "meterId">;
type ReadingInput = Omit<z.input<typeof insertEntityInstanceReadingSchema>, "entityInstanceId" | "recordedByUserId">;

export const entityPayloadSchema = insertFormsCoreEntitySchema.extend({
  definition: insertFormsCoreEntitySchema.shape.definition.extend({
    fields: insertFormsCoreEntitySchema.shape.definition.shape.fields.default([]),
  }),
});

const submissionAnswersSchema = z.record(z.unknown());

const expiredCalibrationIsBlocking = () => process.env.FORMS_BLOCK_EXPIRED_CALIBRATION === "true";

function validateAnswers(fields: EntityTemplateDefinition["fields"], answers: unknown) {
  const result = submissionAnswersSchema.parse(answers ?? {});
  const errors: string[] = [];
  const parsed: Record<string, unknown> = {};
  for (const field of fields) {
    const value = result[field.id];
    if (field.required && (value === undefined || value === null || value === "")) {
      errors.push(`${field.label} is required`);
      continue;
    }
    if (value === undefined || value === null || value === "") continue;
    const before = errors.length;
    switch (field.type) {
      case "text":
        if (typeof value !== "string") errors.push(`${field.label} must be text`);
        break;
      case "number":
        if (typeof value !== "number") errors.push(`${field.label} must be a number`);
        break;
      case "boolean":
        if (typeof value !== "boolean") errors.push(`${field.label} must be true/false`);
        break;
      case "choice":
        if (typeof value !== "string") {
          errors.push(`${field.label} must be a choice`);
        } else if (field.options && !field.options.includes(value)) {
          errors.push(`${field.label} must be one of the provided options`);
        }
        break;
      default:
        errors.push(`${field.label} has unsupported type`);
    }
    if (errors.length === before) {
      parsed[field.id] = value;
    }
  }
  if (errors.length) {
    const err = new Error(errors.join(", "));
    (err as any).details = errors;
    throw err;
  }
  return parsed;
}

export interface FormsRepository {
  createTemplate(input: z.input<typeof insertFormsCoreTemplateSchema>): Promise<FormTemplateRecord>;
  listTemplates(organizationId: string): Promise<FormTemplateRecord[]>;
  createVersion(
    templateId: string,
    userId: string,
    input: z.input<typeof insertFormsCoreVersionSchema>,
  ): Promise<FormVersionRecord>;
  addEntity(
    versionId: string,
    userId: string,
    input: z.input<typeof entityPayloadSchema>,
  ): Promise<EntityTemplateRecord | null>;
  publishVersion(versionId: string, userId: string): Promise<FormVersionRecord | null>;
  listPublishedVersions(organizationId: string): Promise<FormVersionRecord[]>;
  listJobAssets(jobId: string): Promise<JobAssetSummary[]>;
  createSubmission(
    input: z.input<typeof insertFormsCoreSubmissionSchema>,
    userId: string,
  ): Promise<FormSubmissionRecord>;
  getSubmission(id: string): Promise<FormSubmissionRecord | null>;
  saveAnswers(
    submissionId: string,
    entityInstanceId: string,
    answers: Record<string, unknown>,
    userId: string,
  ): Promise<FormsCoreInstance | null>;
  instantiateEntitiesForAssets(submissionId: string, userId: string): Promise<InstantiateResult>;
  submitSubmission(submissionId: string, userId: string): Promise<SubmitResult>;
  createMeter(input: MeterInput, userId: string): Promise<MeterRecord>;
  addCalibration(meterId: string, input: CalibrationInput, userId: string): Promise<MeterCalibration | null>;
  listActiveMeters(organizationId: string): Promise<MeterRecord[]>;
  recordReading(
    entityInstanceId: string,
    input: ReadingInput,
    userId: string,
  ): Promise<RecordReadingResult>;
  listSmokeControlSystemTypes(organizationId: string): Promise<SmokeSystemTypeRecord[]>;
  listSystemTypeEntities(systemTypeCode: string, organizationId: string): Promise<LibraryEntityRecord[]>;
  generateFromSystemType(input: {
    systemTypeCode: string;
    templateName: string;
    organizationId: string;
    createdByUserId: string;
  }): Promise<GeneratedTemplate>;
}

export class InMemoryFormsRepository implements FormsRepository {
  private templates = new Map<string, FormTemplateRecord>();
  private versions = new Map<string, FormVersionRecord>();
  private entities = new Map<string, EntityTemplateRecord>();
  private submissions = new Map<string, FormSubmissionRecord>();
  private usedVersionIds = new Set<string>();
  private jobAssets = new Map<string, JobAssetSummary[]>();
  private meters = new Map<string, MeterRecord>();
  private calibrations = new Map<string, MeterCalibration>();
  private readings = new Map<string, EntityInstanceReadingRecord>();
  private systemTypesByOrg = new Map<string, SmokeSystemTypeRecord[]>();

  setJobAssets(jobId: string, assets: JobAssetSummary[]) {
    this.jobAssets.set(jobId, assets);
  }

  private ensureSystemTypes(orgId: string) {
    if (this.systemTypesByOrg.has(orgId)) return;
    const now = new Date();
    const seeded = SMOKE_SYSTEM_TYPES.map((entry) => ({
      ...entry,
      id: randomUUID(),
      organizationId: orgId,
      createdAt: now,
      updatedAt: now,
    })) as SmokeSystemTypeRecord[];
    this.systemTypesByOrg.set(orgId, seeded);
  }

  async listJobAssets(jobId: string): Promise<JobAssetSummary[]> {
    return this.jobAssets.get(jobId) ?? [];
  }

  private resolveSystemType(orgId: string, code: string) {
    this.ensureSystemTypes(orgId);
    return this.systemTypesByOrg.get(orgId)?.find((t) => t.code === code) ?? null;
  }

  private getRequiredEntities(systemTypeCode: string) {
    const codes = SMOKE_REQUIRED_SETS[systemTypeCode] ?? [];
    return codes
      .map((code, index) => {
        const definition = SMOKE_ENTITY_LIBRARY.find((entry) => entry.code === code);
        if (!definition) return null;
        return {
          id: randomUUID(),
          organizationId: SMOKE_LIBRARY_ORG_ID,
          createdAt: new Date(),
          updatedAt: new Date(),
          sortOrder: index,
          ...definition,
        } as LibraryEntityRecord;
      })
      .filter(Boolean) as LibraryEntityRecord[];
  }

  async createMeter(input: MeterInput, userId: string): Promise<MeterRecord> {
    const parsed = insertMeterSchema.parse({ ...input, createdByUserId: userId });
    const meter: MeterRecord = {
      ...parsed,
      id: randomUUID(),
      createdAt: new Date(),
      activeCalibration: null,
    } as MeterRecord;
    this.meters.set(meter.id, meter);
    return meter;
  }

  async addCalibration(
    meterId: string,
    input: CalibrationInput,
    userId: string,
  ): Promise<MeterCalibration | null> {
    const meter = this.meters.get(meterId);
    if (!meter) return null;
    const parsed = insertMeterCalibrationSchema.parse({ ...input, meterId, createdByUserId: userId });
    const calibration: MeterCalibration = {
      ...parsed,
      id: randomUUID(),
      createdAt: new Date(),
    } as MeterCalibration;
    this.calibrations.set(calibration.id, calibration);
    return calibration;
  }

  async listActiveMeters(organizationId: string): Promise<MeterRecord[]> {
    const now = Date.now();
    return Array.from(this.meters.values())
      .filter((meter) => meter.organizationId === organizationId)
      .map((meter) => {
        const calibrations = Array.from(this.calibrations.values())
          .filter((cal) => cal.meterId === meter.id && new Date(cal.expiresAt).getTime() > now)
          .sort((a, b) => new Date(b.calibratedAt).getTime() - new Date(a.calibratedAt).getTime());
        return { ...meter, activeCalibration: calibrations[0] ?? null } as MeterRecord;
      });
  }

  async recordReading(
    entityInstanceId: string,
    input: ReadingInput,
    userId: string,
  ): Promise<RecordReadingResult> {
    const parsed = insertEntityInstanceReadingSchema.parse(input);
    const submission = Array.from(this.submissions.values()).find((s) =>
      s.entities.some((e) => e.id === entityInstanceId),
    );
    if (!submission) return { reading: null };
    const instance = submission.entities.find((e) => e.id === entityInstanceId);
    if (!instance) return { reading: null };
    const meter = this.meters.get(parsed.meterId);
    const calibration = this.calibrations.get(parsed.calibrationId);
    if (!meter || !calibration || calibration.meterId !== meter.id) throw new Error("Invalid meter calibration");
    const expired = isCalibrationExpired(calibration);
    const warnings = expired ? [`Calibration expired for meter ${meter.name}`] : [];
    if (expired && expiredCalibrationIsBlocking()) {
      throw new Error(warnings.join("; ") || "Calibration expired");
    }
    const reading: EntityInstanceReadingRecord = {
      ...parsed,
      id: randomUUID(),
      entityInstanceId,
      recordedByUserId: userId,
      createdAt: new Date(),
      meter,
      calibration,
    } as EntityInstanceReadingRecord;
    this.readings.set(reading.id, reading);
    submission.readings = submission.readings.filter((r) => r.id !== reading.id).concat(reading);
    return { reading, warnings };
  }

  async listSmokeControlSystemTypes(organizationId: string): Promise<SmokeSystemTypeRecord[]> {
    this.ensureSystemTypes(organizationId);
    return this.systemTypesByOrg.get(organizationId) ?? [];
  }

  async listSystemTypeEntities(systemTypeCode: string, _organizationId: string): Promise<LibraryEntityRecord[]> {
    return this.getRequiredEntities(systemTypeCode);
  }

  async generateFromSystemType(input: {
    systemTypeCode: string;
    templateName: string;
    organizationId: string;
    createdByUserId: string;
  }): Promise<GeneratedTemplate> {
    const { systemTypeCode, templateName, organizationId, createdByUserId } = input;
    const systemType = this.resolveSystemType(organizationId, systemTypeCode);
    if (!systemType) throw new Error("Unknown system type");

    const template = await this.createTemplate({
      name: templateName,
      description: systemType.standard ?? undefined,
      organizationId,
      createdByUserId,
    });

    const version = await this.createVersion(template.id, createdByUserId, {
      title: `${systemType.name} v1`,
      notes: systemType.standard,
      templateId: template.id,
      createdByUserId,
      definition: { entities: [], systemTypeCode },
    });

    const requiredEntities = this.getRequiredEntities(systemTypeCode);
    for (const entity of requiredEntities) {
      const exists = version.entities.some((e) => e.title === entity.name);
      if (exists) continue;
      await this.addEntity(version.id, createdByUserId, {
        formVersionId: version.id,
        title: entity.name,
        description: entity.description,
        sortOrder: entity.sortOrder ?? 0,
        definition: { ...entity.definition, sortOrder: entity.sortOrder ?? 0 },
        createdByUserId,
      } as any);
    }

    const finalTemplate = this.templates.get(template.id)!;
    const finalVersion = this.versions.get(version.id)!;
    return { template: finalTemplate, version: finalVersion };
  }

  async createTemplate(input: z.input<typeof insertFormsCoreTemplateSchema>): Promise<FormTemplateRecord> {
    const parsed = insertFormsCoreTemplateSchema.parse(input);
    const now = new Date();
    const template: FormTemplateRecord = {
      ...parsed,
      id: randomUUID(),
      createdAt: now,
      versions: [],
    } as FormTemplateRecord;
    this.templates.set(template.id, template);
    return template;
  }

  async listTemplates(organizationId: string): Promise<FormTemplateRecord[]> {
    return Array.from(this.templates.values()).filter((t) => t.organizationId === organizationId);
  }

  async createVersion(
    templateId: string,
    userId: string,
    input: z.input<typeof insertFormsCoreVersionSchema>,
  ): Promise<FormVersionRecord> {
    const template = this.templates.get(templateId);
    if (!template) throw new Error("Template not found");
    const versionNumber = Math.max(0, ...template.versions.map((v) => v.versionNumber)) + 1;
    const parsed = insertFormsCoreVersionSchema.parse({
      ...input,
      templateId,
      versionNumber,
      createdByUserId: userId,
    });
    const version: FormVersionRecord = {
      ...parsed,
      id: randomUUID(),
      templateId,
      versionNumber,
      status: "draft",
      createdByUserId: userId,
      createdAt: new Date(),
      definition: parsed.definition ?? { entities: [] },
      entities: [],
      publishedAt: null,
    } as FormVersionRecord;
    this.versions.set(version.id, version);
    template.versions.push(version);
    return version;
  }

  async addEntity(
    versionId: string,
    userId: string,
    input: z.input<typeof entityPayloadSchema>,
  ): Promise<EntityTemplateRecord | null> {
    const version = this.versions.get(versionId);
    if (!version) return null;
    if (version.status !== "draft") throw new Error("Cannot edit a published version");
    if (this.usedVersionIds.has(versionId)) throw new Error("Version already in use");
    const parsed = entityPayloadSchema.parse({ ...input, formVersionId: versionId, createdByUserId: userId });
    const entity: EntityTemplateRecord = {
      ...parsed,
      id: randomUUID(),
      createdAt: new Date(),
    } as EntityTemplateRecord;
    this.entities.set(entity.id, entity);
    version.entities.push(entity);
    return entity;
  }

  async publishVersion(versionId: string): Promise<FormVersionRecord | null> {
    const version = this.versions.get(versionId);
    if (!version) return null;
    if (version.status === "published") return version;
    version.status = "published";
    version.publishedAt = new Date();
    return version;
  }

  async listPublishedVersions(organizationId: string): Promise<FormVersionRecord[]> {
    return Array.from(this.versions.values()).filter((v) => {
      const template = this.templates.get(v.templateId);
      return template?.organizationId === organizationId && v.status === "published";
    });
  }

  async createSubmission(
    input: z.input<typeof insertFormsCoreSubmissionSchema>,
    userId: string,
  ): Promise<FormSubmissionRecord> {
    const parsed = insertFormsCoreSubmissionSchema.parse({ ...input, createdByUserId: userId });
    const version = this.versions.get(parsed.formVersionId);
    if (!version || version.status !== "published") throw new Error("Version must be published");
    const now = new Date();
    const submission: FormSubmissionRecord = {
      ...parsed,
      id: randomUUID(),
      status: "in_progress",
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
      entities: [],
      readings: [],
    } as FormSubmissionRecord;
    for (const entity of version.entities) {
      const instance: FormsCoreInstance = {
        id: randomUUID(),
        submissionId: submission.id,
        entityTemplateId: entity.id,
        answers: {},
        status: "in_progress",
        createdByUserId: userId,
        createdAt: now,
        updatedAt: now,
      } as FormsCoreInstance;
      submission.entities.push(instance);
    }
    this.usedVersionIds.add(version.id);
    this.submissions.set(submission.id, submission);
    return submission;
  }

  async getSubmission(id: string): Promise<FormSubmissionRecord | null> {
    const submission = this.submissions.get(id);
    if (!submission) return null;
    const instanceIds = submission.entities.map((e) => e.id);
    const readings = Array.from(this.readings.values())
      .filter((reading) => instanceIds.includes(reading.entityInstanceId))
      .map((reading) => ({
        ...reading,
        meter: this.meters.get(reading.meterId) ?? null,
        calibration: this.calibrations.get(reading.calibrationId) ?? null,
      }));
    return { ...submission, readings };
  }

  async saveAnswers(
    submissionId: string,
    entityInstanceId: string,
    answers: Record<string, unknown>,
    userId: string,
  ): Promise<FormsCoreInstance | null> {
    const submission = this.submissions.get(submissionId);
    if (!submission) return null;
    if (submission.status === "submitted") throw new Error("Submission already complete");
    const instance = submission.entities.find((e) => e.id === entityInstanceId);
    if (!instance) return null;
    const version = this.versions.get(submission.formVersionId);
    const template = version?.entities.find((e) => e.id === instance.entityTemplateId);
    if (!version || !template) return null;
    instance.answers = validateAnswers(template.definition.fields, answers);
    instance.updatedAt = new Date();
    submission.updatedAt = new Date();
    submission.status = "in_progress";
    return instance;
  }

  async instantiateEntitiesForAssets(submissionId: string, userId: string): Promise<InstantiateResult> {
    const submission = this.submissions.get(submissionId);
    if (!submission) return { submission: null, created: 0, skipped: 0, assets: [] };
    const version = this.versions.get(submission.formVersionId);
    const assets = this.jobAssets.get(submission.jobId) ?? [];
    const repeatable = version?.entities.filter((e) => e.definition?.repeatPerAsset) ?? [];
    let created = 0;
    let skipped = 0;
    for (const asset of assets) {
      for (const entity of repeatable) {
        const existing = submission.entities.find(
          (e) => e.entityTemplateId === entity.id && e.assetId === asset.id,
        );
        if (existing) {
          skipped += 1;
          continue;
        }
        const instance: FormsCoreInstance = {
          id: randomUUID(),
          submissionId: submission.id,
          entityTemplateId: entity.id,
          assetId: asset.id,
          location: asset.location ?? null,
          answers: {},
          status: "in_progress",
          createdByUserId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as FormsCoreInstance;
        submission.entities.push(instance);
        created += 1;
      }
    }
    return { submission, created, skipped, assets };
  }

  async submitSubmission(submissionId: string, userId: string): Promise<SubmitResult> {
    const instantiateResult = await this.instantiateEntitiesForAssets(submissionId, userId);
    const submission = instantiateResult.submission;
    if (!submission) return { submission: null };
    if (submission.status === "submitted") return { submission };
    const version = this.versions.get(submission.formVersionId);
    const assetWarnings = buildAssetWarnings(
      this.jobAssets.get(submission.jobId) ?? [],
      version?.entities ?? [],
      submission.entities,
    );
    const calibrationWarnings = buildCalibrationWarnings(submission.readings);
    if (assetWarnings.length && blockUntestedAssets) {
      throw new Error(assetWarnings.join("; "));
    }
    if (calibrationWarnings.length && expiredCalibrationIsBlocking()) {
      throw new Error(calibrationWarnings.join("; "));
    }
    const warnings = [...assetWarnings, ...calibrationWarnings];
    submission.status = "submitted";
    submission.submittedAt = new Date();
    submission.updatedAt = new Date();
    submission.entities = submission.entities.map((e) => ({ ...e, status: "submitted" } as FormsCoreInstance));
    return { submission, warnings };
  }
}

export class DbFormsRepository implements FormsRepository {
  private async seedSmokeLibrary() {
    const db = await getDb();
    await db
      .insert(organizations)
      .values({ id: SMOKE_LIBRARY_ORG_ID, name: "Smoke Control Library", slug: "smoke-control-library" })
      .onConflictDoNothing();

    const existingTypes = await db
      .select()
      .from(systemTypes)
      .where(eq(systemTypes.organizationId, SMOKE_LIBRARY_ORG_ID));

    const missingTypes = SMOKE_SYSTEM_TYPES.filter((type) => !existingTypes.some((row) => row.code === type.code));
    if (missingTypes.length) {
      await db
        .insert(systemTypes)
        .values(missingTypes.map((type) => ({ ...type, organizationId: SMOKE_LIBRARY_ORG_ID })))
        .onConflictDoNothing();
    }

    const existingLibrary = await db
      .select()
      .from(entityLibrary)
      .where(eq(entityLibrary.organizationId, SMOKE_LIBRARY_ORG_ID));

    const missingLibrary = SMOKE_ENTITY_LIBRARY.filter((entry) => !existingLibrary.some((row) => row.code === entry.code));
    if (missingLibrary.length) {
      await db
        .insert(entityLibrary)
        .values(missingLibrary.map((entry) => ({ ...entry, organizationId: SMOKE_LIBRARY_ORG_ID })))
        .onConflictDoNothing();
    }

    const typeRows = await db
      .select()
      .from(systemTypes)
      .where(eq(systemTypes.organizationId, SMOKE_LIBRARY_ORG_ID));
    const entityRows = await db
      .select()
      .from(entityLibrary)
      .where(eq(entityLibrary.organizationId, SMOKE_LIBRARY_ORG_ID));

    const existingMappings = await db
      .select()
      .from(systemTypeRequiredEntities)
      .where(eq(systemTypeRequiredEntities.organizationId, SMOKE_LIBRARY_ORG_ID));
    const pairs = new Set(existingMappings.map((row) => `${row.systemTypeId}:${row.entityLibraryId}`));
    const typesByCode = new Map(typeRows.map((row) => [row.code, row] as const));
    const entitiesByCode = new Map(entityRows.map((row) => [row.code, row] as const));

    const inserts: Array<{ organizationId: string; systemTypeId: string; entityLibraryId: string; sortOrder: number }> = [];
    for (const [code, entries] of Object.entries(SMOKE_REQUIRED_SETS)) {
      const typeRow = typesByCode.get(code);
      if (!typeRow) continue;
      entries.forEach((entityCode, index) => {
        const entityRow = entitiesByCode.get(entityCode);
        if (!entityRow) return;
        const key = `${typeRow.id}:${entityRow.id}`;
        if (pairs.has(key)) return;
        inserts.push({
          organizationId: SMOKE_LIBRARY_ORG_ID,
          systemTypeId: typeRow.id,
          entityLibraryId: entityRow.id,
          sortOrder: index,
        });
      });
    }

    if (inserts.length) {
      await db.insert(systemTypeRequiredEntities).values(inserts).onConflictDoNothing();
    }
  }

  private async ensureSystemTypeForOrg(
    organizationId: string,
    code: string,
  ): Promise<SmokeSystemTypeRecord | null> {
    const db = await getDb();
    const existing = await db
      .select()
      .from(systemTypes)
      .where(and(eq(systemTypes.organizationId, organizationId), eq(systemTypes.code, code)))
      .limit(1);
    if (existing.length) return existing[0] as SmokeSystemTypeRecord;

    const catalog = SMOKE_SYSTEM_TYPES.find((entry) => entry.code === code);
    if (!catalog) return null;

    const [created] = await db
      .insert(systemTypes)
      .values({ ...catalog, organizationId })
      .returning();
    return created as SmokeSystemTypeRecord;
  }

  async createTemplate(input: z.input<typeof insertFormsCoreTemplateSchema>): Promise<FormTemplateRecord> {
    const parsed = insertFormsCoreTemplateSchema.parse(input);
    const db = await getDb();
    const [template] = await db.insert(formsCoreTemplates).values(parsed).returning();
    return { ...template, versions: [] } as FormTemplateRecord;
  }

  async listTemplates(organizationId: string): Promise<FormTemplateRecord[]> {
    const db = await getDb();
    const templates = await db.select().from(formsCoreTemplates).where(eq(formsCoreTemplates.organizationId, organizationId));
    const templateIds = templates.map((t) => t.id);
    const versions = templateIds.length
      ? await db.select().from(formsCoreVersions).where(inArray(formsCoreVersions.templateId, templateIds))
      : [];
    const grouped = new Map<string, FormVersionRecord[]>();
    for (const version of versions) {
      const list = grouped.get(version.templateId) ?? [];
      list.push({ ...version, entities: [] } as FormVersionRecord);
      grouped.set(version.templateId, list);
    }
    return templates.map((t) => ({ ...t, versions: grouped.get(t.id) ?? [] } as FormTemplateRecord));
  }

  async createVersion(
    templateId: string,
    userId: string,
    input: z.input<typeof insertFormsCoreVersionSchema>,
  ): Promise<FormVersionRecord> {
    const db = await getDb();
    const template = await db.select().from(formsCoreTemplates).where(eq(formsCoreTemplates.id, templateId)).limit(1);
    if (!template.length) throw new Error("Template not found");
    const [latest] = await db
      .select()
      .from(formsCoreVersions)
      .where(eq(formsCoreVersions.templateId, templateId))
      .orderBy(desc(formsCoreVersions.versionNumber))
      .limit(1);
    const nextVersion = (latest?.versionNumber ?? 0) + 1;
    const parsed = insertFormsCoreVersionSchema.parse({
      ...input,
      templateId,
      versionNumber: nextVersion,
      createdByUserId: userId,
    });
    const versionPayload = { ...parsed, versionNumber: nextVersion };
    const [version] = await db.insert(formsCoreVersions).values(versionPayload).returning();
    return { ...version, entities: [] } as FormVersionRecord;
  }

  async addEntity(
    versionId: string,
    userId: string,
    input: z.input<typeof entityPayloadSchema>,
  ): Promise<EntityTemplateRecord | null> {
    const db = await getDb();
    const version = await db
      .select()
      .from(formsCoreVersions)
      .where(eq(formsCoreVersions.id, versionId))
      .limit(1);
    if (!version.length) return null;
    if (version[0].status === "published") throw new Error("Cannot edit a published version");
    const submissions = await db
      .select({ id: formsCoreSubmissions.id })
      .from(formsCoreSubmissions)
      .where(eq(formsCoreSubmissions.formVersionId, versionId))
      .limit(1);
    if (submissions.length) throw new Error("Version already in use");
    const parsed = entityPayloadSchema.parse({ ...input, formVersionId: versionId, createdByUserId: userId });
    const [entity] = await db.insert(formsCoreEntities).values(parsed).returning();
    return entity as EntityTemplateRecord;
  }

  async publishVersion(versionId: string): Promise<FormVersionRecord | null> {
    const db = await getDb();
    const [updated] = await db
      .update(formsCoreVersions)
      .set({ status: "published", publishedAt: new Date() })
      .where(eq(formsCoreVersions.id, versionId))
      .returning();
    return updated ? ({ ...updated, entities: [] } as FormVersionRecord) : null;
  }

  async listPublishedVersions(organizationId: string): Promise<FormVersionRecord[]> {
    const db = await getDb();
    const versions = await db
      .select({
        version: formsCoreVersions,
        template: formsCoreTemplates,
      })
      .from(formsCoreVersions)
      .innerJoin(formsCoreTemplates, eq(formsCoreVersions.templateId, formsCoreTemplates.id))
      .where(and(eq(formsCoreVersions.status, "published"), eq(formsCoreTemplates.organizationId, organizationId)))
      .orderBy(formsCoreVersions.versionNumber);
    const versionIds = versions.map((v) => v.version.id);
    const entities = versionIds.length
      ? await db.select().from(formsCoreEntities).where(inArray(formsCoreEntities.formVersionId, versionIds))
      : [];
    const grouped = new Map<string, EntityTemplateRecord[]>();
    for (const entity of entities) {
      const list = grouped.get(entity.formVersionId) ?? [];
      list.push(entity as EntityTemplateRecord);
      grouped.set(entity.formVersionId, list);
    }
    return versions.map((v) => ({ ...v.version, entities: grouped.get(v.version.id) ?? [] } as FormVersionRecord));
  }

  async createSubmission(
    input: z.input<typeof insertFormsCoreSubmissionSchema>,
    userId: string,
  ): Promise<FormSubmissionRecord> {
    const db = await getDb();
    const parsed = insertFormsCoreSubmissionSchema.parse({ ...input, createdByUserId: userId });
    const version = await db
      .select()
      .from(formsCoreVersions)
      .where(and(eq(formsCoreVersions.id, parsed.formVersionId), eq(formsCoreVersions.status, "published")))
      .limit(1);
    if (!version.length) throw new Error("Version must be published");
    const [submission] = await db.insert(formsCoreSubmissions).values(parsed).returning();
    const templates = await db
      .select()
      .from(formsCoreEntities)
      .where(eq(formsCoreEntities.formVersionId, parsed.formVersionId));
    const instances: FormsCoreInstance[] = [];
    for (const template of templates) {
      const [instance] = await db
        .insert(formsCoreInstances)
        .values({
          submissionId: submission.id,
          entityTemplateId: template.id,
          answers: {},
          status: "in_progress",
          createdByUserId: userId,
        })
        .returning();
      instances.push(instance);
    }
    return { ...submission, entities: instances, readings: [] } as FormSubmissionRecord;
  }

  async getSubmission(id: string): Promise<FormSubmissionRecord | null> {
    const db = await getDb();
    const submission = await db.select().from(formsCoreSubmissions).where(eq(formsCoreSubmissions.id, id)).limit(1);
    if (!submission.length) return null;
    const entities = await db
      .select()
      .from(formsCoreInstances)
      .where(eq(formsCoreInstances.submissionId, id));
    const readings = entities.length
      ? await db
          .select({ reading: entityInstanceReadings, calibration: meterCalibrations, meter: meters })
          .from(entityInstanceReadings)
          .leftJoin(meterCalibrations, eq(entityInstanceReadings.calibrationId, meterCalibrations.id))
          .leftJoin(meters, eq(entityInstanceReadings.meterId, meters.id))
          .where(inArray(entityInstanceReadings.entityInstanceId, entities.map((e) => e.id)))
      : [];
    const mappedReadings: EntityInstanceReadingRecord[] = readings.map((row) => ({
      ...(row.reading as EntityInstanceReading),
      calibration: (row.calibration as MeterCalibration | null) ?? null,
      meter: (row.meter as Meter | null) ?? null,
    }));
    return { ...submission[0], entities, readings: mappedReadings } as FormSubmissionRecord;
  }

  async listJobAssets(jobId: string): Promise<JobAssetSummary[]> {
    const db = await getDb();
    const jobAssetsRows = await db
      .select({
        id: jobSiteAssets.id,
        assetNumber: jobSiteAssets.id,
        siteAssetId: jobSiteAssets.siteAssetId,
        siteAssetNumber: siteAssets.assetNumber,
        siteAssetLocation: siteAssets.location,
      })
      .from(jobSiteAssets)
      .leftJoin(siteAssets, eq(jobSiteAssets.siteAssetId, siteAssets.id))
      .where(eq(jobSiteAssets.jobId, jobId));

    return jobAssetsRows.map((asset) => ({
      id: asset.id,
      label: asset.siteAssetNumber || asset.assetNumber || asset.id,
      location: asset.siteAssetLocation,
    }));
  }

  async saveAnswers(
    submissionId: string,
    entityInstanceId: string,
    answers: Record<string, unknown>,
    userId: string,
  ): Promise<FormsCoreInstance | null> {
    const db = await getDb();
    const submission = await db
      .select()
      .from(formsCoreSubmissions)
      .where(eq(formsCoreSubmissions.id, submissionId))
      .limit(1);
    if (!submission.length) return null;
    if (submission[0].status === "submitted") throw new Error("Submission already complete");
    const [instance] = await db
      .select()
      .from(formsCoreInstances)
      .where(and(eq(formsCoreInstances.id, entityInstanceId), eq(formsCoreInstances.submissionId, submissionId)))
      .limit(1);
    if (!instance) return null;
    const [template] = await db
      .select()
      .from(formsCoreEntities)
      .where(eq(formsCoreEntities.id, instance.entityTemplateId))
      .limit(1);
    if (!template) return null;
    const parsed = validateAnswers(template.definition.fields, answers);
    const [updated] = await db
      .update(formsCoreInstances)
      .set({ answers: parsed, updatedAt: new Date(), createdByUserId: userId })
      .where(eq(formsCoreInstances.id, instance.id))
      .returning();
    await db
      .update(formsCoreSubmissions)
      .set({ updatedAt: new Date(), status: "in_progress" })
      .where(eq(formsCoreSubmissions.id, submissionId));
    return updated;
  }

  async instantiateEntitiesForAssets(submissionId: string, userId: string): Promise<InstantiateResult> {
    const db = await getDb();
    const submission = await db
      .select()
      .from(formsCoreSubmissions)
      .where(eq(formsCoreSubmissions.id, submissionId))
      .limit(1);
    if (!submission.length)
      return { submission: null, created: 0, skipped: 0, assets: [] } as InstantiateResult;

    const assets = await this.listJobAssets(submission[0].jobId);

    const templates = await db
      .select()
      .from(formsCoreEntities)
      .where(eq(formsCoreEntities.formVersionId, submission[0].formVersionId));
    const repeatable = templates.filter((t) => t.definition?.repeatPerAsset);

    const instances = await db
      .select()
      .from(formsCoreInstances)
      .where(eq(formsCoreInstances.submissionId, submissionId));

    let created = 0;
    let skipped = 0;
    for (const asset of assets) {
      for (const entity of repeatable) {
        const existing = instances.find(
          (inst) => inst.entityTemplateId === entity.id && inst.assetId === asset.id,
        );
        if (existing) {
          skipped += 1;
          continue;
        }
        const [inserted] = await db
          .insert(formsCoreInstances)
          .values({
            submissionId: submissionId,
            entityTemplateId: entity.id,
            assetId: asset.id,
            location: asset.location ?? null,
            answers: {},
            status: "in_progress",
            createdByUserId: userId,
          })
          .returning();
        instances.push(inserted as FormsCoreInstance);
        created += 1;
      }
    }

    const submissionRecord = await this.getSubmission(submissionId);
    return { submission: submissionRecord, created, skipped, assets };
  }

  async submitSubmission(submissionId: string, userId: string): Promise<SubmitResult> {
    const db = await getDb();
    const instantiateResult = await this.instantiateEntitiesForAssets(submissionId, userId);
    const submission = instantiateResult.submission;
    if (!submission) return { submission: null };
    if (submission.status === "submitted") return { submission };
    const templates = await db
      .select()
      .from(formsCoreEntities)
      .where(eq(formsCoreEntities.formVersionId, submission.formVersionId));
    const assetWarnings = buildAssetWarnings(instantiateResult.assets, templates, submission.entities);
    const calibrationWarnings = buildCalibrationWarnings(submission.readings ?? []);
    if (assetWarnings.length && blockUntestedAssets) {
      throw new Error(assetWarnings.join("; "));
    }
    if (calibrationWarnings.length && expiredCalibrationIsBlocking()) {
      throw new Error(calibrationWarnings.join("; "));
    }
    const warnings = [...assetWarnings, ...calibrationWarnings];
    const [updated] = await db
      .update(formsCoreSubmissions)
      .set({ status: "submitted", submittedAt: new Date(), updatedAt: new Date() })
      .where(eq(formsCoreSubmissions.id, submissionId))
      .returning();
    const entities = await db
      .update(formsCoreInstances)
      .set({ status: "submitted", updatedAt: new Date() })
      .where(eq(formsCoreInstances.submissionId, submissionId))
      .returning();
    const refreshed = await this.getSubmission(submissionId);
    const hydrated = refreshed ?? { ...updated, entities, readings: submission.readings };
    return { submission: hydrated as FormSubmissionRecord, warnings };
  }

  async createMeter(input: MeterInput, userId: string): Promise<MeterRecord> {
    const db = await getDb();
    const parsed = insertMeterSchema.parse({ ...input, createdByUserId: userId });
    const [meter] = await db.insert(meters).values(parsed).returning();
    return { ...meter, activeCalibration: null } as MeterRecord;
  }

  async addCalibration(
    meterId: string,
    input: CalibrationInput,
    userId: string,
  ): Promise<MeterCalibration | null> {
    const db = await getDb();
    const meter = await db.select().from(meters).where(eq(meters.id, meterId)).limit(1);
    if (!meter.length) return null;
    const parsed = insertMeterCalibrationSchema.parse({ ...input, meterId, createdByUserId: userId });
    const [calibration] = await db.insert(meterCalibrations).values(parsed).returning();
    return calibration;
  }

  async listActiveMeters(organizationId: string): Promise<MeterRecord[]> {
    const db = await getDb();
    const meterList = await db.select().from(meters).where(eq(meters.organizationId, organizationId));
    const meterIds = meterList.map((m) => m.id);
    const calibrations = meterIds.length
      ? await db.select().from(meterCalibrations).where(inArray(meterCalibrations.meterId, meterIds))
      : [];
    const now = Date.now();
    const activeByMeter = new Map<string, MeterCalibration | null>();
    for (const meter of meterIds) {
      const candidates = calibrations
        .filter((cal) => cal.meterId === meter && new Date(cal.expiresAt).getTime() > now)
        .sort((a, b) => new Date(b.calibratedAt).getTime() - new Date(a.calibratedAt).getTime());
      activeByMeter.set(meter, candidates[0] ?? null);
    }
    return meterList.map((meter) => ({ ...meter, activeCalibration: activeByMeter.get(meter.id) ?? null } as MeterRecord));
  }

  async recordReading(
    entityInstanceId: string,
    input: ReadingInput,
    userId: string,
  ): Promise<RecordReadingResult> {
    const db = await getDb();
    const parsed = insertEntityInstanceReadingSchema.parse(input);
    const [instance] = await db
      .select()
      .from(formsCoreInstances)
      .where(eq(formsCoreInstances.id, entityInstanceId))
      .limit(1);
    if (!instance) return { reading: null };
    const [submission] = await db
      .select()
      .from(formsCoreSubmissions)
      .where(eq(formsCoreSubmissions.id, instance.submissionId))
      .limit(1);
    if (!submission) return { reading: null };
    const [meter] = await db.select().from(meters).where(eq(meters.id, parsed.meterId)).limit(1);
    if (!meter || meter.organizationId !== submission.organizationId) throw new Error("Meter not found for organization");
    const [calibration] = await db
      .select()
      .from(meterCalibrations)
      .where(eq(meterCalibrations.id, parsed.calibrationId))
      .limit(1);
    if (!calibration || calibration.meterId !== meter.id) throw new Error("Calibration not found for meter");
    const expired = isCalibrationExpired(calibration);
    const warnings = expired ? [`Calibration expired for meter ${meter.name}`] : [];
    if (expired && expiredCalibrationIsBlocking()) {
      throw new Error(warnings.join("; ") || "Calibration expired");
    }
    const [inserted] = await db
      .insert(entityInstanceReadings)
      .values({
        ...parsed,
        entityInstanceId,
        recordedByUserId: userId,
      })
      .returning();
    await db
      .update(formsCoreSubmissions)
      .set({ updatedAt: new Date(), status: submission.status === "submitted" ? submission.status : "in_progress" })
      .where(eq(formsCoreSubmissions.id, submission.id));
    return { reading: { ...inserted, meter, calibration } as EntityInstanceReadingRecord, warnings };
  }

  async listSmokeControlSystemTypes(organizationId: string): Promise<SmokeSystemTypeRecord[]> {
    await this.seedSmokeLibrary();
    const db = await getDb();
    const orgTypes = await db.select().from(systemTypes).where(eq(systemTypes.organizationId, organizationId));
    const libraryTypes = await db.select().from(systemTypes).where(eq(systemTypes.organizationId, SMOKE_LIBRARY_ORG_ID));
    const byCode = new Map<string, SmokeSystemTypeRecord>();
    for (const type of libraryTypes) byCode.set(type.code, type as SmokeSystemTypeRecord);
    for (const type of orgTypes) byCode.set(type.code, type as SmokeSystemTypeRecord);
    return Array.from(byCode.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async listSystemTypeEntities(systemTypeCode: string, organizationId: string): Promise<LibraryEntityRecord[]> {
    await this.seedSmokeLibrary();
    const db = await getDb();
    const systemTypeRows = await db
      .select()
      .from(systemTypes)
      .where(and(eq(systemTypes.code, systemTypeCode), inArray(systemTypes.organizationId, [organizationId, SMOKE_LIBRARY_ORG_ID])));
    const libraryType = systemTypeRows.find((row) => row.organizationId === SMOKE_LIBRARY_ORG_ID);
    const mappingTypeId = libraryType?.id ?? systemTypeRows[0]?.id;
    if (!mappingTypeId) return [];

    const mappings = await db
      .select()
      .from(systemTypeRequiredEntities)
      .where(eq(systemTypeRequiredEntities.systemTypeId, mappingTypeId))
      .orderBy(systemTypeRequiredEntities.sortOrder);
    if (!mappings.length) return [];

    const entities = await db
      .select()
      .from(entityLibrary)
      .where(inArray(entityLibrary.id, mappings.map((mapping) => mapping.entityLibraryId)));

    return mappings
      .map((mapping) => {
        const entity = entities.find((entry) => entry.id === mapping.entityLibraryId);
        if (!entity) return null;
        return { ...(entity as EntityLibrary), sortOrder: mapping.sortOrder } as LibraryEntityRecord;
      })
      .filter(Boolean) as LibraryEntityRecord[];
  }

  async generateFromSystemType(input: {
    systemTypeCode: string;
    templateName: string;
    organizationId: string;
    createdByUserId: string;
  }): Promise<GeneratedTemplate> {
    const { systemTypeCode, templateName, organizationId, createdByUserId } = input;
    await this.seedSmokeLibrary();
    const systemType = await this.ensureSystemTypeForOrg(organizationId, systemTypeCode);
    if (!systemType) throw new Error("Unknown system type");
    const requiredEntities = await this.listSystemTypeEntities(systemTypeCode, organizationId);
    if (!requiredEntities.length) throw new Error("No required entities for system type");

    const template = await this.createTemplate({
      name: templateName,
      description: systemType.standard ?? undefined,
      organizationId,
      createdByUserId,
    });

    const version = await this.createVersion(template.id, createdByUserId, {
      title: `${systemType.name} v1`,
      notes: systemType.standard,
      templateId: template.id,
      createdByUserId,
      definition: { entities: [], systemTypeCode },
    });

    for (const entity of requiredEntities) {
      await this.addEntity(version.id, createdByUserId, {
        formVersionId: version.id,
        title: entity.name,
        description: entity.description ?? undefined,
        sortOrder: entity.sortOrder ?? 0,
        definition: { ...entity.definition, sortOrder: entity.sortOrder ?? 0 },
        createdByUserId,
      } as any);
    }

    const db = await getDb();
    await db
      .insert(formTemplateSystemTypes)
      .values({ templateId: template.id, systemTypeId: systemType.id, organizationId })
      .onConflictDoNothing();

    const entities = (await db
      .select()
      .from(formsCoreEntities)
      .where(eq(formsCoreEntities.formVersionId, version.id))) as EntityTemplateRecord[];
    const hydratedVersion = { ...version, entities } as FormVersionRecord;
    return { template: { ...template, versions: [hydratedVersion] } as FormTemplateRecord, version: hydratedVersion };
  }
}
