import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// DATABASE TABLES
// ============================================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  companyName: text("company_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  companyName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Projects table - groups multiple buildings
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  siteAddress: text("site_address").notNull(),
  sitePostcode: text("site_postcode"),
  clientName: text("client_name").notNull(),
  mainContractor: text("main_contractor"),
  buildings: jsonb("buildings").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type DbProject = typeof projects.$inferSelect;

// Damper templates table
export const damperTemplates = pgTable("damper_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  damperWidth: real("damper_width").notNull(),
  damperHeight: real("damper_height").notNull(),
  systemType: text("system_type").default(""),
  location: text("location"),
  shaftId: text("shaft_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDamperTemplateSchema = createInsertSchema(damperTemplates).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertDamperTemplate = z.infer<typeof insertDamperTemplateSchema>;
export type DbDamperTemplate = typeof damperTemplates.$inferSelect;

// Dampers table - represents physical dampers
export const dampers = pgTable("dampers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  damperKey: text("damper_key").notNull(),
  building: text("building").notNull(),
  location: text("location").notNull(),
  floorNumber: text("floor_number").notNull(),
  shaftId: text("shaft_id").notNull(),
  description: text("description"),
  systemType: text("system_type").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDamperSchema = createInsertSchema(dampers).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertDamper = z.infer<typeof insertDamperSchema>;
export type DbDamper = typeof dampers.$inferSelect;

// Tests table - velocity readings
export const tests = pgTable("tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  damperId: varchar("damper_id").references(() => dampers.id),
  testDate: text("test_date").notNull(),
  building: text("building").notNull(),
  location: text("location").notNull(),
  floorNumber: text("floor_number").notNull(),
  shaftId: text("shaft_id").notNull(),
  systemType: text("system_type").default(""),
  testerName: text("tester_name").notNull(),
  notes: text("notes").default(""),
  readings: jsonb("readings").$type<(number | "")[]>().notNull(),
  gridSize: integer("grid_size"),
  average: real("average").notNull(),
  damperWidth: real("damper_width"),
  damperHeight: real("damper_height"),
  freeArea: real("free_area"),
  damperOpenImage: text("damper_open_image"),
  damperClosedImage: text("damper_closed_image"),
  reportId: varchar("report_id"),
  visitType: text("visit_type"),
  failureReasonCode: text("failure_reason_code"),
  failureNarrative: text("failure_narrative"),
  correctiveAction: text("corrective_action"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestSchema = createInsertSchema(tests).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertTest = z.infer<typeof insertTestSchema>;
export type DbTest = typeof tests.$inferSelect;

// Stairwell pressure tests table
export const stairwellTests = pgTable("stairwell_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  testDate: text("test_date").notNull(),
  testTime: text("test_time"),
  testerName: text("tester_name").notNull(),
  building: text("building").notNull(),
  stairwellId: text("stairwell_id").notNull(),
  stairwellLocation: text("stairwell_location"),
  systemType: text("system_type").default(""),
  systemDescription: text("system_description"),
  standardVersion: text("standard_version").default("bs_en_12101_6_2022"),
  applicableStandards: jsonb("applicable_standards").$type<string[]>().default(["BS EN 12101-6"]),
  scenario: text("scenario").default(""),
  scenarioDescription: text("scenario_description"),
  fanRunning: boolean("fan_running").default(true),
  fanSpeed: real("fan_speed"),
  fanSpeedUnit: text("fan_speed_unit").default(""),
  damperStates: text("damper_states"),
  levelMeasurements: jsonb("level_measurements").$type<any[]>().default([]),
  averageDifferential: real("average_differential"),
  minDifferential: real("min_differential"),
  maxDifferential: real("max_differential"),
  averageDoorForce: real("average_door_force"),
  maxDoorForce: real("max_door_force"),
  overallPressureCompliant: boolean("overall_pressure_compliant"),
  overallForceCompliant: boolean("overall_force_compliant"),
  overallCompliant: boolean("overall_compliant"),
  ambientTemperature: real("ambient_temperature"),
  windConditions: text("wind_conditions").default(""),
  notes: text("notes"),
  recommendations: text("recommendations"),
  reportId: varchar("report_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStairwellTestSchema = createInsertSchema(stairwellTests).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertStairwellTest = z.infer<typeof insertStairwellTestSchema>;
export type DbStairwellTest = typeof stairwellTests.$inferSelect;

// Sync queue for offline changes
export const syncQueue = pgTable("sync_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  entityType: text("entity_type").notNull(), // 'test', 'project', 'damper', etc.
  entityId: varchar("entity_id").notNull(),
  action: text("action").notNull(), // 'create', 'update', 'delete'
  data: jsonb("data"),
  synced: boolean("synced").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bulk test packs table
export const testPacks = pgTable("test_packs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  buildingType: text("building_type"), // e.g., "residential_high_rise", "commercial_office"
  floors: integer("floors").notNull(),
  dampersPerFloor: integer("dampers_per_floor").notNull(),
  damperConfig: jsonb("damper_config").$type<{
    width: number;
    height: number;
    systemType: string;
    locations: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestPackSchema = createInsertSchema(testPacks).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertTestPack = z.infer<typeof insertTestPackSchema>;
export type DbTestPack = typeof testPacks.$inferSelect;

// Compliance checklists table
export const complianceChecklists = pgTable("compliance_checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  testId: varchar("test_id").references(() => tests.id),
  projectId: varchar("project_id").references(() => projects.id),
  inspectionType: text("inspection_type").notNull(), // 'commissioning', 'annual', 'remedial'
  standardReference: text("standard_reference").default("BS EN 12101-8:2020"),
  checklistItems: jsonb("checklist_items").$type<{
    id: string;
    category: string;
    requirement: string;
    checked: boolean;
    notes: string;
    reference: string;
  }[]>().default([]),
  overallCompliant: boolean("overall_compliant"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertComplianceChecklistSchema = createInsertSchema(complianceChecklists).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertComplianceChecklist = z.infer<typeof insertComplianceChecklistSchema>;
export type DbComplianceChecklist = typeof complianceChecklists.$inferSelect;

// Floor sequencing sessions
export const testSessions = pgTable("test_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  projectId: varchar("project_id").references(() => projects.id),
  name: text("name").notNull(),
  building: text("building").notNull(),
  status: text("status").default("pending"), // 'pending', 'in_progress', 'completed'
  currentIndex: integer("current_index").default(0),
  damperSequence: jsonb("damper_sequence").$type<{
    floorNumber: string;
    location: string;
    shaftId: string;
    completed: boolean;
    testId?: string;
  }[]>().default([]),
  totalDampers: integer("total_dampers").default(0),
  completedDampers: integer("completed_dampers").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTestSessionSchema = createInsertSchema(testSessions).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertTestSession = z.infer<typeof insertTestSessionSchema>;
export type DbTestSession = typeof testSessions.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  tests: many(tests),
  dampers: many(dampers),
  damperTemplates: many(damperTemplates),
  stairwellTests: many(stairwellTests),
  testPacks: many(testPacks),
  testSessions: many(testSessions),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  testSessions: many(testSessions),
  complianceChecklists: many(complianceChecklists),
}));

export const dampersRelations = relations(dampers, ({ one, many }) => ({
  user: one(users, { fields: [dampers.userId], references: [users.id] }),
  tests: many(tests),
}));

export const testsRelations = relations(tests, ({ one }) => ({
  user: one(users, { fields: [tests.userId], references: [users.id] }),
  damper: one(dampers, { fields: [tests.damperId], references: [dampers.id] }),
}));

// ============================================
// ZOD SCHEMAS (for client-side validation)
// ============================================

export const systemTypeEnum = z.enum(["push", "pull", "push-pull", ""]);
export const visitTypeEnum = z.enum(["initial", "annual", "remedial", "final"]);
export const reportTypeEnum = z.enum(["commissioning", "annual_inspection", "remedial_works", "final_verification"]);

// Damper entity - represents a physical damper that can be tested multiple times
export const damperSchema = z.object({
  id: z.string(),
  damperKey: z.string(),
  building: z.string(),
  location: z.string(),
  floorNumber: z.string(),
  shaftId: z.string(),
  description: z.string().optional(),
  systemType: systemTypeEnum,
  createdAt: z.number(),
});

export type Damper = z.infer<typeof damperSchema>;

// Report entity - contains project-level information for a testing visit
export const reportSchema = z.object({
  id: z.string(),
  projectName: z.string(),
  projectNumber: z.string().optional(),
  siteAddress: z.string(),
  sitePostcode: z.string().optional(),
  clientName: z.string(),
  mainContractor: z.string().optional(),
  reportDate: z.string(),
  commissioningDate: z.string().optional(),
  systemDescription: z.string(),
  testingStandards: z.string().default("BS EN 12101-8:2020, BSRIA BG 49/2024"),
  testObjectives: z.string().optional(),
  companyName: z.string(),
  companyLogo: z.string().optional(),
  testerCertification: z.string().optional(),
  supervisorName: z.string().optional(),
  reportTitle: z.string().default("Smoke Control Damper Testing Report"),
  reportType: reportTypeEnum,
  isRepeatVisit: z.boolean().default(false),
  previousReportId: z.string().optional(),
  includeExecutiveSummary: z.boolean().default(true),
  includePassFailSummary: z.boolean().default(true),
  testerSignature: z.string().optional(),
  witnessSignature: z.string().optional(),
  witnessName: z.string().optional(),
  testIds: z.array(z.string()).default([]),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
});

export type Report = z.infer<typeof reportSchema>;

export const insertReportSchema = reportSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;

// Test entity with deviation narrative support
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
  damperId: z.string().optional(),
  reportId: z.string().optional(),
  visitType: visitTypeEnum.optional(),
  failureReasonCode: z.string().optional(),
  failureNarrative: z.string().optional(),
  correctiveAction: z.string().optional(),
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

export const PRESSURE_COMPLIANCE = {
  CLASS_A_MIN: 45,
  CLASS_A_NOMINAL: 50,
  CLASS_A_MAX: 60,
  OPEN_DOOR_MIN: 10,
  DOOR_FORCE_MAX: 100,
  DOOR_FORCE_WITH_CLOSER_MAX: 140,
  CLASS_B_MIN: 10,
  CLASS_B_NOMINAL: 12.5,
  CLASS_B_MAX: 25,
  MIN_AIRFLOW_VELOCITY: 0.75,
} as const;

export const levelMeasurementSchema = z.object({
  id: z.string(),
  floorNumber: z.string(),
  floorDescription: z.string().optional(),
  lobbyPressure: z.number().optional(),
  stairwellPressure: z.number().optional(),
  differentialPressure: z.number().optional(),
  doorOpeningForce: z.number().optional(),
  hasDoorCloser: z.boolean().default(false),
  doorGapStatus: z.enum(["sealed", "normal_gap", "large_gap", ""]).default(""),
  doorCondition: z.enum(["good", "fair", "poor", ""]).default(""),
  pressureCompliant: z.boolean().optional(),
  forceCompliant: z.boolean().optional(),
  notes: z.string().optional(),
});

export type LevelMeasurement = z.infer<typeof levelMeasurementSchema>;

export const stairwellPressureTestSchema = z.object({
  id: z.string(),
  testDate: z.string(),
  testTime: z.string().optional(),
  testerName: z.string(),
  building: z.string(),
  stairwellId: z.string(),
  stairwellLocation: z.string().optional(),
  systemType: pressureSystemTypeEnum,
  systemDescription: z.string().optional(),
  standardVersion: standardVersionEnum.default("bs_en_12101_6_2022"),
  applicableStandards: z.array(z.string()).default(["BS EN 12101-6"]),
  scenario: testScenarioEnum,
  scenarioDescription: z.string().optional(),
  fanRunning: z.boolean().default(true),
  fanSpeed: z.number().optional(),
  fanSpeedUnit: z.enum(["percent", "rpm", ""]).default(""),
  damperStates: z.string().optional(),
  levelMeasurements: z.array(levelMeasurementSchema).default([]),
  averageDifferential: z.number().optional(),
  minDifferential: z.number().optional(),
  maxDifferential: z.number().optional(),
  averageDoorForce: z.number().optional(),
  maxDoorForce: z.number().optional(),
  overallPressureCompliant: z.boolean().optional(),
  overallForceCompliant: z.boolean().optional(),
  overallCompliant: z.boolean().optional(),
  ambientTemperature: z.number().optional(),
  windConditions: z.enum(["calm", "light", "moderate", "strong", ""]).default(""),
  notes: z.string().optional(),
  recommendations: z.string().optional(),
  reportId: z.string().optional(),
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

// Project entity - groups multiple buildings
export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  siteAddress: z.string(),
  sitePostcode: z.string().optional(),
  clientName: z.string(),
  mainContractor: z.string().optional(),
  buildings: z.array(z.string()).default([]),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
});

export type Project = z.infer<typeof projectSchema>;

// Damper template for saving common configurations
export const damperTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  damperWidth: z.number(),
  damperHeight: z.number(),
  systemType: systemTypeEnum,
  location: z.string().optional(),
  shaftId: z.string().optional(),
  createdAt: z.number(),
});

export type DamperTemplate = z.infer<typeof damperTemplateSchema>;

// ============================================
// FAILURE REASON CODES
// ============================================

export const FAILURE_REASON_CODES = [
  { code: "LOW_VELOCITY", label: "Velocity below minimum threshold", category: "performance" },
  { code: "HIGH_VELOCITY", label: "Velocity exceeds maximum threshold", category: "performance" },
  { code: "DAMPER_STUCK", label: "Damper mechanism stuck/jammed", category: "mechanical" },
  { code: "DAMPER_PARTIAL", label: "Damper not fully open/closed", category: "mechanical" },
  { code: "ACTUATOR_FAULT", label: "Actuator malfunction", category: "electrical" },
  { code: "CONTROL_FAULT", label: "Control system fault", category: "electrical" },
  { code: "OBSTRUCTION", label: "Airway obstruction detected", category: "environmental" },
  { code: "SEAL_DAMAGE", label: "Seal damage/deterioration", category: "mechanical" },
  { code: "CORROSION", label: "Corrosion affecting operation", category: "mechanical" },
  { code: "DUCTWORK_ISSUE", label: "Ductwork integrity issue", category: "environmental" },
  { code: "FAN_FAULT", label: "Extract/supply fan fault", category: "system" },
  { code: "BALANCING_ISSUE", label: "System balancing required", category: "system" },
  { code: "OTHER", label: "Other (see notes)", category: "other" },
] as const;

export type FailureReasonCode = typeof FAILURE_REASON_CODES[number]["code"];

// ============================================
// BS EN 12101-8 COMPLIANCE CHECKLIST ITEMS
// ============================================

export const BS_EN_12101_8_CHECKLIST = [
  // Pre-test checks
  { id: "pre_1", category: "Pre-Test Verification", requirement: "Damper installation matches approved drawings", reference: "BS EN 12101-8 Clause 5.1" },
  { id: "pre_2", category: "Pre-Test Verification", requirement: "Damper model and size verified against specification", reference: "BS EN 12101-8 Clause 5.2" },
  { id: "pre_3", category: "Pre-Test Verification", requirement: "Actuator and control wiring correctly installed", reference: "BS EN 12101-8 Clause 6.1" },
  { id: "pre_4", category: "Pre-Test Verification", requirement: "Access for maintenance and testing adequate", reference: "BSRIA BG 49/2024" },
  
  // Functional tests
  { id: "func_1", category: "Functional Testing", requirement: "Damper opens fully on command", reference: "BS EN 12101-8 Clause 7.1" },
  { id: "func_2", category: "Functional Testing", requirement: "Damper closes fully on command", reference: "BS EN 12101-8 Clause 7.1" },
  { id: "func_3", category: "Functional Testing", requirement: "Fail-safe position correct on power loss", reference: "BS EN 12101-8 Clause 7.2" },
  { id: "func_4", category: "Functional Testing", requirement: "Position indication signals correct", reference: "BS EN 12101-8 Clause 7.3" },
  { id: "func_5", category: "Functional Testing", requirement: "Integration with BMS/fire alarm verified", reference: "BS EN 12101-8 Clause 8.1" },
  
  // Performance tests
  { id: "perf_1", category: "Performance Testing", requirement: "Airflow velocity within design parameters", reference: "BS EN 12101-8 Clause 9.1" },
  { id: "perf_2", category: "Performance Testing", requirement: "Grid measurement points per BSRIA methodology", reference: "BSRIA BG 49/2024 Appendix A" },
  { id: "perf_3", category: "Performance Testing", requirement: "Average velocity meets minimum requirement", reference: "BS EN 12101-8 Clause 9.2" },
  { id: "perf_4", category: "Performance Testing", requirement: "Velocity distribution acceptable (no excessive variation)", reference: "BSRIA BG 49/2024" },
  
  // Documentation
  { id: "doc_1", category: "Documentation", requirement: "Test equipment calibration certificates available", reference: "BSRIA BG 49/2024" },
  { id: "doc_2", category: "Documentation", requirement: "O&M manual information complete", reference: "BS EN 12101-8 Clause 10.1" },
  { id: "doc_3", category: "Documentation", requirement: "As-built drawings updated", reference: "BS EN 12101-8 Clause 10.2" },
  { id: "doc_4", category: "Documentation", requirement: "Commissioning certificate prepared", reference: "BS EN 12101-8 Clause 10.3" },
] as const;

export type ComplianceChecklistItem = {
  id: string;
  category: string;
  requirement: string;
  checked: boolean;
  notes: string;
  reference: string;
};
