// server/seedForms.ts
import { db } from "./db"; // adjust if your db import path differs
import {
  systemTypes,
  formEntities,
  formEntityRows,
  formTemplates,
  formTemplateEntities,
  formTemplateSystemTypes,
} from "../shared/schema";
import { and, eq } from "drizzle-orm";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

// You must provide ORG_ID to seed into (uuid of an existing organization).
// Example:
// ORG_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx node --loader tsx server/seedForms.ts
async function main() {
  const orgId = requireEnv("ORG_ID");

  // Upsert system types
  const systems = [
    { code: "MSHEV", name: "MSHEV" },
    { code: "PRESSURISATION", name: "Pressurisation" },
    { code: "NSHEV", name: "nSHEV" },
  ];

  const systemIdByCode = new Map<string, string>();

  for (const s of systems) {
    const existing = await db
      .select()
      .from(systemTypes)
      .where(and(eq(systemTypes.organizationId, orgId as any), eq(systemTypes.code, s.code)))
      .limit(1);

    if (existing.length) {
      systemIdByCode.set(s.code, existing[0].id);
    } else {
      const inserted = await db
        .insert(systemTypes)
        .values({
          organizationId: orgId as any,
          code: s.code,
          name: s.name,
        })
        .returning({ id: systemTypes.id });

      systemIdByCode.set(s.code, inserted[0].id);
    }
  }

  // Create entities + rows
  const [mshevEntity] = await db
    .insert(formEntities)
    .values({
      organizationId: orgId as any,
      title: "MSHEV Maintenance Activities",
      description: "Maintenance activities undertaken during visit (MSHEV)",
    })
    .returning({ id: formEntities.id });

  await db.insert(formEntityRows).values([
    {
      organizationId: orgId as any,
      entityId: mshevEntity.id,
      sortOrder: 1,
      component: "Fan casing",
      activity: "Inspection for corrosion and secure mounting",
      reference: "Manufacturer",
      fieldType: "pass_fail",
    },
    {
      organizationId: orgId as any,
      entityId: mshevEntity.id,
      sortOrder: 2,
      component: "Fan speed",
      activity: "Measurement during operation",
      reference: "Manufacturer",
      fieldType: "number",
      units: "RPM",
    },
    {
      organizationId: orgId as any,
      entityId: mshevEntity.id,
      sortOrder: 3,
      component: "Airflow performance",
      activity: "Verification of fan duty",
      reference: "Design / BS 7346-7",
      fieldType: "number",
      units: "m³/s",
    },
    {
      organizationId: orgId as any,
      entityId: mshevEntity.id,
      sortOrder: 4,
      component: "Control response",
      activity: "Verification of automatic and manual operation",
      reference: "Fire strategy",
      fieldType: "pass_fail",
    },
  ]);

  const [pressEntity] = await db
    .insert(formEntities)
    .values({
      organizationId: orgId as any,
      title: "Pressure Differential System Tests",
      description: "Stair/lobby pressurisation checks",
    })
    .returning({ id: formEntities.id });

  await db.insert(formEntityRows).values([
    {
      organizationId: orgId as any,
      entityId: pressEntity.id,
      sortOrder: 1,
      component: "Pressure differential",
      activity: "Measurement between protected and adjacent spaces",
      reference: "Design / BS 5588-4",
      fieldType: "number",
      units: "Pa",
    },
    {
      organizationId: orgId as any,
      entityId: pressEntity.id,
      sortOrder: 2,
      component: "Door opening force",
      activity: "Measurement at door handle",
      reference: "Design / BS 5588-4",
      fieldType: "number",
      units: "N",
    },
    {
      organizationId: orgId as any,
      entityId: pressEntity.id,
      sortOrder: 3,
      component: "Control logic",
      activity: "Verification of correct system response",
      reference: "Fire strategy",
      fieldType: "pass_fail",
    },
  ]);

  // Templates
  const [damperTemplate] = await db
    .insert(formTemplates)
    .values({
      organizationId: orgId as any,
      name: "Damper Testing",
      description: "MSHEV damper/fan checks",
    })
    .returning({ id: formTemplates.id });

  const [pressureTemplate] = await db
    .insert(formTemplates)
    .values({
      organizationId: orgId as any,
      name: "Pressure Differential Testing",
      description: "Pressurisation checks",
    })
    .returning({ id: formTemplates.id });

  // Map entities onto templates
  await db.insert(formTemplateEntities).values([
    {
      organizationId: orgId as any,
      templateId: damperTemplate.id,
      entityId: mshevEntity.id,
      sortOrder: 1,
      required: true,
      repeatPerAsset: false,
      evidenceRequired: false,
    },
    {
      organizationId: orgId as any,
      templateId: pressureTemplate.id,
      entityId: pressEntity.id,
      sortOrder: 1,
      required: true,
      repeatPerAsset: false,
      evidenceRequired: false,
    },
  ]);

  // Map templates to system types
  await db.insert(formTemplateSystemTypes).values([
    {
      organizationId: orgId as any,
      templateId: damperTemplate.id,
      systemTypeId: systemIdByCode.get("MSHEV")!,
    },
    {
      organizationId: orgId as any,
      templateId: pressureTemplate.id,
      systemTypeId: systemIdByCode.get("PRESSURISATION")!,
    },
  ]);

  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
