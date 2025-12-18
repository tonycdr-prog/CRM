import { eq, desc } from "drizzle-orm";
import {
  organizationPlans,
  organizationUsage,
  users,
  jobs,
  inspectionInstances,
  inspectionResponses,
  formTemplates,
  formTemplateEntities,
  formTemplateSystemTypes,
  formEntities,
  formEntityRows,
  files,
  inspectionRowAttachments,
  auditEvents,
  serverErrors,
} from "../../shared/schema";

export async function buildOrgExportManifest(db: any, orgId: string) {
  const now = new Date();

  const [
    planRow,
    usageRow,
    userRows,
    jobRows,
    inspectionRows,
    responseRows,
    templateRows,
    templateEntityRows,
    templateSystemRows,
    entityRowsList,
    entityRowRows,
    fileRows,
    inspectionAttachmentRows,
    auditRows,
    errorRows,
  ] = await Promise.all([
    db.select().from(organizationPlans).where(eq(organizationPlans.organizationId, orgId)).limit(1),
    db.select().from(organizationUsage).where(eq(organizationUsage.organizationId, orgId)).limit(1),

    db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        organizationRole: users.organizationRole,
        organizationId: users.organizationId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.organizationId, orgId)),

    db
      .select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        siteId: jobs.siteId,
        userId: jobs.userId,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
      })
      .from(jobs)
      .innerJoin(users, eq(users.id, jobs.userId))
      .where(eq(users.organizationId, orgId)),

    db
      .select({
        id: inspectionInstances.id,
        organizationId: inspectionInstances.organizationId,
        jobId: inspectionInstances.jobId,
        templateId: inspectionInstances.templateId,
        systemTypeId: inspectionInstances.systemTypeId,
        createdByUserId: inspectionInstances.createdByUserId,
        completedAt: inspectionInstances.completedAt,
        createdAt: inspectionInstances.createdAt,
      })
      .from(inspectionInstances)
      .where(eq(inspectionInstances.organizationId, orgId)),

    db
      .select({
        id: inspectionResponses.id,
        organizationId: inspectionResponses.organizationId,
        inspectionId: inspectionResponses.inspectionId,
        rowId: inspectionResponses.rowId,
        valueText: inspectionResponses.valueText,
        valueNumber: inspectionResponses.valueNumber,
        valueBool: inspectionResponses.valueBool,
        comment: inspectionResponses.comment,
        createdByUserId: inspectionResponses.createdByUserId,
        createdAt: inspectionResponses.createdAt,
      })
      .from(inspectionResponses)
      .where(eq(inspectionResponses.organizationId, orgId)),

    db
      .select({
        id: formTemplates.id,
        organizationId: formTemplates.organizationId,
        name: formTemplates.name,
        description: formTemplates.description,
        isActive: formTemplates.isActive,
        archivedAt: formTemplates.archivedAt,
        createdAt: formTemplates.createdAt,
        updatedAt: formTemplates.updatedAt,
      })
      .from(formTemplates)
      .where(eq(formTemplates.organizationId, orgId)),

    db
      .select({
        templateId: formTemplateEntities.templateId,
        entityId: formTemplateEntities.entityId,
        sortOrder: formTemplateEntities.sortOrder,
        organizationId: formTemplateEntities.organizationId,
      })
      .from(formTemplateEntities)
      .where(eq(formTemplateEntities.organizationId, orgId)),

    db
      .select({
        templateId: formTemplateSystemTypes.templateId,
        systemTypeId: formTemplateSystemTypes.systemTypeId,
        organizationId: formTemplateSystemTypes.organizationId,
      })
      .from(formTemplateSystemTypes)
      .where(eq(formTemplateSystemTypes.organizationId, orgId)),

    db
      .select({
        id: formEntities.id,
        organizationId: formEntities.organizationId,
        title: formEntities.title,
        description: formEntities.description,
        archivedAt: formEntities.archivedAt,
        createdAt: formEntities.createdAt,
        updatedAt: formEntities.updatedAt,
      })
      .from(formEntities)
      .where(eq(formEntities.organizationId, orgId)),

    db
      .select({
        id: formEntityRows.id,
        organizationId: formEntityRows.organizationId,
        entityId: formEntityRows.entityId,
        sortOrder: formEntityRows.sortOrder,
        component: formEntityRows.component,
        activity: formEntityRows.activity,
        reference: formEntityRows.reference,
        fieldType: formEntityRows.fieldType,
        units: formEntityRows.units,
        choices: formEntityRows.choices,
        evidenceRequired: formEntityRows.evidenceRequired,
        archivedAt: formEntityRows.archivedAt,
        createdAt: formEntityRows.createdAt,
        updatedAt: formEntityRows.updatedAt,
      })
      .from(formEntityRows)
      .where(eq(formEntityRows.organizationId, orgId)),

    db
      .select({
        id: files.id,
        organizationId: files.organizationId,
        storage: files.storage,
        path: files.path,
        originalName: files.originalName,
        mimeType: files.mimeType,
        sizeBytes: files.sizeBytes,
        createdByUserId: files.createdByUserId,
        createdAt: files.createdAt,
      })
      .from(files)
      .where(eq(files.organizationId, orgId)),

    db
      .select({
        id: inspectionRowAttachments.id,
        organizationId: inspectionRowAttachments.organizationId,
        inspectionId: inspectionRowAttachments.inspectionId,
        rowId: inspectionRowAttachments.rowId,
        fileId: inspectionRowAttachments.fileId,
        createdByUserId: inspectionRowAttachments.createdByUserId,
        createdAt: inspectionRowAttachments.createdAt,
      })
      .from(inspectionRowAttachments)
      .where(eq(inspectionRowAttachments.organizationId, orgId)),

    db
      .select({
        id: auditEvents.id,
        organizationId: auditEvents.organizationId,
        actorUserId: auditEvents.actorUserId,
        action: auditEvents.action,
        entityType: auditEvents.entityType,
        entityId: auditEvents.entityId,
        jobId: auditEvents.jobId,
        inspectionId: auditEvents.inspectionId,
        metadata: auditEvents.metadata,
        createdAt: auditEvents.createdAt,
      })
      .from(auditEvents)
      .where(eq(auditEvents.organizationId, orgId))
      .orderBy(desc(auditEvents.createdAt))
      .limit(5000),

    db
      .select({
        id: serverErrors.id,
        organizationId: serverErrors.organizationId,
        userId: serverErrors.userId,
        requestId: serverErrors.requestId,
        method: serverErrors.method,
        path: serverErrors.path,
        status: serverErrors.status,
        message: serverErrors.message,
        createdAt: serverErrors.createdAt,
      })
      .from(serverErrors)
      .where(eq(serverErrors.organizationId, orgId))
      .orderBy(desc(serverErrors.createdAt))
      .limit(2000),
  ]);

  return {
    exportedAt: now.toISOString(),
    organizationId: orgId,
    plan: planRow[0] ?? null,
    usage: usageRow[0] ?? null,
    users: userRows,
    jobs: jobRows,
    inspections: inspectionRows,
    inspectionResponses: responseRows,
    templates: templateRows,
    templateEntities: templateEntityRows,
    templateSystemTypes: templateSystemRows,
    entities: entityRowsList,
    entityRows: entityRowRows,
    files: fileRows,
    inspectionRowAttachments: inspectionAttachmentRows,
    auditEvents: auditRows,
    serverErrors: errorRows,
  };
}
