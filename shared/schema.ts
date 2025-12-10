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
  damperKey: z.string(), // Unique identifier: building+location+floorNumber+shaftId
  building: z.string(),
  location: z.string(),
  floorNumber: z.string(), // Floor number is part of damper identity for trend tracking
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

// ============================================
// STAIRWELL DIFFERENTIAL PRESSURE TESTING
// Compliant with BS 5588-4, BS 9999, BS 9991, BS EN 12101-6
// ============================================

export const pressureSystemTypeEnum = z.enum(["class_a", "class_b", "class_c", "class_d", "class_e", "class_f", ""]);
export const testScenarioEnum = z.enum(["doors_closed", "single_door_open", "multiple_doors_open", "fire_service_override", ""]);
export const standardVersionEnum = z.enum([
  "bs_5588_4_1978",
  "bs_5588_4_1998", 
  "bs_en_12101_6_2005",
  "bs_en_12101_6_2022",
  ""
]);

// Compliance thresholds per BS EN 12101-6
export const PRESSURE_COMPLIANCE = {
  // Class A: Firefighting shaft - requires 50Pa nominal, 45-60Pa range
  CLASS_A_MIN: 45,
  CLASS_A_NOMINAL: 50,
  CLASS_A_MAX: 60,
  // Open door requirement: minimum 10Pa across single open door
  OPEN_DOOR_MIN: 10,
  // Door opening force limits
  DOOR_FORCE_MAX: 100, // Newtons (≤100N per BS EN 12101-6)
  DOOR_FORCE_WITH_CLOSER_MAX: 140, // With door closer
  // Class B: Protected escape route
  CLASS_B_MIN: 10,
  CLASS_B_NOMINAL: 12.5,
  CLASS_B_MAX: 25,
  // Air velocity through open door (BS EN 12101-6)
  MIN_AIRFLOW_VELOCITY: 0.75, // m/s through open door
} as const;

// Individual floor/level measurement
export const levelMeasurementSchema = z.object({
  id: z.string(),
  floorNumber: z.string(),
  floorDescription: z.string().optional(), // e.g., "Ground Floor", "Level 2 - Office"
  
  // Pressure readings (Pa)
  lobbyPressure: z.number().optional(), // Pressure in lobby/landing
  stairwellPressure: z.number().optional(), // Pressure in stairwell
  differentialPressure: z.number().optional(), // Calculated: stairwell - lobby
  
  // Door force measurement (Newtons)
  doorOpeningForce: z.number().optional(),
  hasDoorCloser: z.boolean().default(false),
  
  // Door status
  doorGapStatus: z.enum(["sealed", "normal_gap", "large_gap", ""]).default(""),
  doorCondition: z.enum(["good", "fair", "poor", ""]).default(""),
  
  // Compliance results
  pressureCompliant: z.boolean().optional(),
  forceCompliant: z.boolean().optional(),
  
  // Notes
  notes: z.string().optional(),
});

export type LevelMeasurement = z.infer<typeof levelMeasurementSchema>;

// Main stairwell pressure test
export const stairwellPressureTestSchema = z.object({
  id: z.string(),
  
  // Test metadata
  testDate: z.string(),
  testTime: z.string().optional(),
  testerName: z.string(),
  
  // Location identification
  building: z.string(),
  stairwellId: z.string(), // e.g., "Stair 1", "Core A Stairwell"
  stairwellLocation: z.string().optional(), // e.g., "North Core", "East Wing"
  
  // System classification
  systemType: pressureSystemTypeEnum,
  systemDescription: z.string().optional(), // e.g., "Mechanical pressurization with roof-mounted fan"
  
  // Standards compliance
  standardVersion: standardVersionEnum.default("bs_en_12101_6_2022"), // Version system was designed to
  applicableStandards: z.array(z.string()).default(["BS EN 12101-6"]),
  
  // Test scenario
  scenario: testScenarioEnum,
  scenarioDescription: z.string().optional(), // e.g., "All doors closed, system in firefighting mode"
  
  // System status during test
  fanRunning: z.boolean().default(true),
  fanSpeed: z.number().optional(), // Percentage or RPM
  fanSpeedUnit: z.enum(["percent", "rpm", ""]).default(""),
  damperStates: z.string().optional(), // Description of damper positions
  
  // Floor measurements
  levelMeasurements: z.array(levelMeasurementSchema).default([]),
  
  // Summary statistics (calculated)
  averageDifferential: z.number().optional(),
  minDifferential: z.number().optional(),
  maxDifferential: z.number().optional(),
  averageDoorForce: z.number().optional(),
  maxDoorForce: z.number().optional(),
  
  // Overall compliance
  overallPressureCompliant: z.boolean().optional(),
  overallForceCompliant: z.boolean().optional(),
  overallCompliant: z.boolean().optional(),
  
  // Environmental conditions
  ambientTemperature: z.number().optional(), // °C
  windConditions: z.enum(["calm", "light", "moderate", "strong", ""]).default(""),
  
  // Additional notes
  notes: z.string().optional(),
  recommendations: z.string().optional(),
  
  // Report linkage
  reportId: z.string().optional(),
  
  // Metadata
  createdAt: z.number(),
  updatedAt: z.number().optional(),
});

export type StairwellPressureTest = z.infer<typeof stairwellPressureTestSchema>;

export const insertStairwellPressureTestSchema = stairwellPressureTestSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  overallPressureCompliant: true,
  overallForceCompliant: true,
  overallCompliant: true,
});
export type InsertStairwellPressureTest = z.infer<typeof insertStairwellPressureTestSchema>;
