import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const systemTypeEnum = z.enum(["push", "pull", "push-pull", ""]);
export const visitTypeEnum = z.enum(["initial", "annual", "remedial", "final"]);
export const reportTypeEnum = z.enum(["commissioning", "annual_inspection", "remedial_works", "final_verification"]);

// Damper entity - represents a physical damper that can be tested multiple times
export const damperSchema = z.object({
  id: z.string(),
  damperKey: z.string(), // Unique identifier: building+location+shaftId
  building: z.string(),
  location: z.string(),
  shaftId: z.string(),
  description: z.string().optional(),
  systemType: systemTypeEnum,
  createdAt: z.number(),
});

export type Damper = z.infer<typeof damperSchema>;

export const insertDamperSchema = damperSchema.omit({ id: true, createdAt: true });
export type InsertDamper = z.infer<typeof insertDamperSchema>;

// Report entity - contains project-level information for a testing visit
export const reportSchema = z.object({
  id: z.string(),
  // Project Information
  projectName: z.string(),
  projectNumber: z.string().optional(),
  siteAddress: z.string(),
  sitePostcode: z.string().optional(),
  clientName: z.string(),
  mainContractor: z.string().optional(),
  reportDate: z.string(),
  commissioningDate: z.string().optional(),
  
  // Scope of Works
  systemDescription: z.string(),
  testingStandards: z.string().default("BS EN 12101-8:2020, BSRIA BG 49/2024"),
  testObjectives: z.string().optional(),
  
  // Company/Tester Information
  companyName: z.string(),
  companyLogo: z.string().optional(), // Base64 data URL
  testerCertification: z.string().optional(),
  supervisorName: z.string().optional(),
  
  // Report Settings
  reportTitle: z.string().default("Smoke Control Damper Testing Report"),
  reportType: reportTypeEnum,
  isRepeatVisit: z.boolean().default(false),
  previousReportId: z.string().optional(), // Reference to previous year's report
  includeExecutiveSummary: z.boolean().default(true),
  includePassFailSummary: z.boolean().default(true),
  
  // Metadata
  testIds: z.array(z.string()).default([]), // Tests included in this report
  createdAt: z.number(),
  updatedAt: z.number().optional(),
});

export type Report = z.infer<typeof reportSchema>;

export const insertReportSchema = reportSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;

// Test entity - updated to reference damper and optional report
export const testSchema = z.object({
  id: z.string(),
  testDate: z.string(),
  building: z.string(),
  location: z.string(),
  floorNumber: z.string(),
  shaftId: z.string(),
  systemType: systemTypeEnum,
  testerName: z.string(),
  notes: z.string(),
  readings: z.array(z.union([z.number(), z.literal("")])),
  gridSize: z.number().optional(),
  average: z.number(),
  damperWidth: z.number().optional(),
  damperHeight: z.number().optional(),
  freeArea: z.number().optional(),
  damperOpenImage: z.string().optional(),
  damperClosedImage: z.string().optional(),
  damperId: z.string().optional(), // Reference to damper entity
  reportId: z.string().optional(), // Reference to report entity
  visitType: visitTypeEnum.optional(),
  createdAt: z.number(),
}).refine((data) => {
  const validLengths = [8, 25, 36, 49];
  return validLengths.includes(data.readings.length);
}, {
  message: "Readings array must be 8 (legacy), 25 (5x5), 36 (6x6), or 49 (7x7) points",
  path: ["readings"],
});

export type Test = z.infer<typeof testSchema>;
