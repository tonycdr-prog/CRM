import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, real, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// DATABASE TABLES
// ============================================

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - supports both Replit Auth and custom auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: text("username").unique(),
  password: text("password"),
  displayName: text("display_name"),
  companyName: text("company_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
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

// ============================================
// BUSINESS MANAGEMENT TABLES
// ============================================

// Clients table - customer database
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  postcode: text("postcode"),
  city: text("city"),
  notes: text("notes"),
  clientType: text("client_type").default("commercial"), // commercial, residential, public_sector
  status: text("status").default("active"), // active, inactive, prospect
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type DbClient = typeof clients.$inferSelect;

// Contracts table - service agreements
export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  contractNumber: text("contract_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  value: real("value"), // Total contract value
  billingFrequency: text("billing_frequency").default("annual"), // monthly, quarterly, annual, one_time
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  renewalDate: text("renewal_date"),
  autoRenew: boolean("auto_renew").default(false),
  slaLevel: text("sla_level").default("standard"), // basic, standard, premium
  slaResponseTime: integer("sla_response_time"), // Hours
  slaResolutionTime: integer("sla_resolution_time"), // Hours
  terms: text("terms"),
  status: text("status").default("active"), // draft, active, expired, cancelled
  signedByClient: boolean("signed_by_client").default(false),
  signedByCompany: boolean("signed_by_company").default(false),
  clientSignature: text("client_signature"),
  companySignature: text("company_signature"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContractSchema = createInsertSchema(contracts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertContract = z.infer<typeof insertContractSchema>;
export type DbContract = typeof contracts.$inferSelect;

// Jobs table - work orders
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  contractId: varchar("contract_id").references(() => contracts.id),
  projectId: varchar("project_id").references(() => projects.id),
  jobNumber: text("job_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  siteAddress: text("site_address"),
  scheduledDate: text("scheduled_date"),
  scheduledTime: text("scheduled_time"),
  estimatedDuration: real("estimated_duration"), // Hours
  actualDuration: real("actual_duration"), // Hours
  assignedTechnicianId: varchar("assigned_technician_id"),
  assignedSubcontractorId: varchar("assigned_subcontractor_id"),
  priority: text("priority").default("normal"), // low, normal, high, urgent
  status: text("status").default("pending"), // pending, scheduled, in_progress, completed, cancelled
  jobType: text("job_type").default("testing"), // testing, installation, repair, maintenance
  quotedAmount: real("quoted_amount"),
  actualCost: real("actual_cost"),
  materialsCost: real("materials_cost"),
  labourCost: real("labour_cost"),
  profitMargin: real("profit_margin"),
  notes: text("notes"),
  completionNotes: text("completion_notes"),
  customerSignature: text("customer_signature"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type DbJob = typeof jobs.$inferSelect;

// Quotes table
export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  jobId: varchar("job_id").references(() => jobs.id),
  quoteNumber: text("quote_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  lineItems: jsonb("line_items").$type<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[]>().default([]),
  subtotal: real("subtotal"),
  vatRate: real("vat_rate").default(20),
  vatAmount: real("vat_amount"),
  total: real("total"),
  validUntil: text("valid_until"),
  terms: text("terms"),
  status: text("status").default("draft"), // draft, sent, accepted, rejected, expired
  sentAt: timestamp("sent_at"),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true, updatedAt: true, sentAt: true, acceptedAt: true });
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type DbQuote = typeof quotes.$inferSelect;

// Invoices table
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  jobId: varchar("job_id").references(() => jobs.id),
  contractId: varchar("contract_id").references(() => contracts.id),
  quoteId: varchar("quote_id").references(() => quotes.id),
  invoiceNumber: text("invoice_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  lineItems: jsonb("line_items").$type<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[]>().default([]),
  subtotal: real("subtotal"),
  vatRate: real("vat_rate").default(20),
  vatAmount: real("vat_amount"),
  total: real("total"),
  dueDate: text("due_date"),
  terms: text("terms"),
  status: text("status").default("draft"), // draft, sent, paid, overdue, cancelled
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeInvoiceId: text("stripe_invoice_id"),
  paidAmount: real("paid_amount").default(0),
  paidAt: timestamp("paid_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true, paidAt: true, sentAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type DbInvoice = typeof invoices.$inferSelect;

// Expenses table
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  jobId: varchar("job_id").references(() => jobs.id),
  category: text("category").notNull(), // mileage, materials, accommodation, fuel, tools, other
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  date: text("date").notNull(),
  mileage: real("mileage"), // For mileage expenses
  mileageRate: real("mileage_rate").default(0.45), // £/mile
  receiptImage: text("receipt_image"),
  reimbursable: boolean("reimbursable").default(true),
  reimbursed: boolean("reimbursed").default(false),
  reimbursedAt: timestamp("reimbursed_at"),
  approvedBy: varchar("approved_by"),
  status: text("status").default("pending"), // pending, approved, rejected, reimbursed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true, updatedAt: true, reimbursedAt: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type DbExpense = typeof expenses.$inferSelect;

// Timesheets table
export const timesheets = pgTable("timesheets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  jobId: varchar("job_id").references(() => jobs.id),
  technicianId: varchar("technician_id"),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  breakDuration: real("break_duration").default(0), // Minutes
  totalHours: real("total_hours"),
  hourlyRate: real("hourly_rate"),
  overtimeHours: real("overtime_hours").default(0),
  overtimeRate: real("overtime_rate"),
  description: text("description"),
  status: text("status").default("pending"), // pending, submitted, approved, rejected
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTimesheetSchema = createInsertSchema(timesheets).omit({ id: true, createdAt: true, updatedAt: true, approvedAt: true });
export type InsertTimesheet = z.infer<typeof insertTimesheetSchema>;
export type DbTimesheet = typeof timesheets.$inferSelect;

// Vehicles table
export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  registration: text("registration").notNull(),
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  color: text("color"),
  mileage: real("mileage"),
  fuelType: text("fuel_type").default("diesel"), // diesel, petrol, electric, hybrid
  insuranceExpiry: text("insurance_expiry"),
  motExpiry: text("mot_expiry"),
  serviceDate: text("service_date"),
  nextServiceDate: text("next_service_date"),
  status: text("status").default("available"), // available, in_use, maintenance, out_of_service
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type DbVehicle = typeof vehicles.$inferSelect;

// Vehicle bookings table
export const vehicleBookings = pgTable("vehicle_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  vehicleId: varchar("vehicle_id").references(() => vehicles.id),
  jobId: varchar("job_id").references(() => jobs.id),
  technicianId: varchar("technician_id"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  startMileage: real("start_mileage"),
  endMileage: real("end_mileage"),
  purpose: text("purpose"),
  status: text("status").default("confirmed"), // pending, confirmed, cancelled, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVehicleBookingSchema = createInsertSchema(vehicleBookings).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVehicleBooking = z.infer<typeof insertVehicleBookingSchema>;
export type DbVehicleBooking = typeof vehicleBookings.$inferSelect;

// Subcontractors table
export const subcontractors = pgTable("subcontractors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  specializations: jsonb("specializations").$type<string[]>().default([]),
  hourlyRate: real("hourly_rate"),
  dayRate: real("day_rate"),
  insuranceExpiry: text("insurance_expiry"),
  certifications: jsonb("certifications").$type<{
    name: string;
    number: string;
    expiry: string;
  }[]>().default([]),
  rating: real("rating"),
  status: text("status").default("active"), // active, inactive, blacklisted
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubcontractorSchema = createInsertSchema(subcontractors).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubcontractor = z.infer<typeof insertSubcontractorSchema>;
export type DbSubcontractor = typeof subcontractors.$inferSelect;

// Documents table - RAMS, risk assessments, method statements, certificates
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  jobId: varchar("job_id").references(() => jobs.id),
  documentType: text("document_type").notNull(), // rams, risk_assessment, method_statement, insurance_certificate, contract, quote, invoice, report
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url"),
  fileData: text("file_data"), // Base64 for small files
  content: jsonb("content").$type<any>(), // For generated documents
  version: integer("version").default(1),
  expiryDate: text("expiry_date"),
  status: text("status").default("draft"), // draft, active, expired, archived
  signedBy: jsonb("signed_by").$type<{
    name: string;
    signature: string;
    date: string;
    role: string;
  }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type DbDocument = typeof documents.$inferSelect;

// Communication logs table
export const communicationLogs = pgTable("communication_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  jobId: varchar("job_id").references(() => jobs.id),
  type: text("type").notNull(), // email, phone, meeting, site_visit, note
  subject: text("subject"),
  content: text("content").notNull(),
  contactName: text("contact_name"),
  direction: text("direction").default("outbound"), // inbound, outbound
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: text("follow_up_date"),
  followUpCompleted: boolean("follow_up_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunicationLogSchema = createInsertSchema(communicationLogs).omit({ id: true, createdAt: true });
export type InsertCommunicationLog = z.infer<typeof insertCommunicationLogSchema>;
export type DbCommunicationLog = typeof communicationLogs.$inferSelect;

// Customer satisfaction surveys table
export const surveys = pgTable("surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  jobId: varchar("job_id").references(() => jobs.id),
  sentAt: timestamp("sent_at"),
  completedAt: timestamp("completed_at"),
  overallRating: integer("overall_rating"), // 1-5
  qualityRating: integer("quality_rating"),
  timelinessRating: integer("timeliness_rating"),
  communicationRating: integer("communication_rating"),
  valueRating: integer("value_rating"),
  wouldRecommend: boolean("would_recommend"),
  feedback: text("feedback"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpNotes: text("follow_up_notes"),
  status: text("status").default("pending"), // pending, sent, completed, expired
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSurveySchema = createInsertSchema(surveys).omit({ id: true, createdAt: true, sentAt: true, completedAt: true });
export type InsertSurvey = z.infer<typeof insertSurveySchema>;
export type DbSurvey = typeof surveys.$inferSelect;

// Holiday/absence calendar table
export const absences = pgTable("absences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  technicianId: varchar("technician_id"),
  technicianName: text("technician_name").notNull(),
  type: text("type").notNull(), // holiday, sick, training, other
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  halfDay: boolean("half_day").default(false),
  halfDayPeriod: text("half_day_period"), // morning, afternoon
  notes: text("notes"),
  status: text("status").default("pending"), // pending, approved, rejected, cancelled
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAbsenceSchema = createInsertSchema(absences).omit({ id: true, createdAt: true, updatedAt: true, approvedAt: true });
export type InsertAbsence = z.infer<typeof insertAbsenceSchema>;
export type DbAbsence = typeof absences.$inferSelect;

// Reminders table - automated follow-ups, contract renewals, payment reminders
export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  entityType: text("entity_type").notNull(), // contract, invoice, job, client, survey
  entityId: varchar("entity_id").notNull(),
  reminderType: text("reminder_type").notNull(), // contract_renewal, payment_due, follow_up, survey, annual_test
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("due_date").notNull(),
  status: text("status").default("pending"), // pending, sent, completed, dismissed
  sentAt: timestamp("sent_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, createdAt: true, sentAt: true, completedAt: true });
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type DbReminder = typeof reminders.$inferSelect;

// ============================================
// BUSINESS MANAGEMENT ZOD SCHEMAS (for client-side)
// ============================================

export const clientSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  postcode: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
  clientType: z.enum(["commercial", "residential", "public_sector"]).default("commercial"),
  status: z.enum(["active", "inactive", "prospect"]).default("active"),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
});

export type Client = z.infer<typeof clientSchema>;

export const contractSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  contractNumber: z.string(),
  title: z.string(),
  description: z.string().optional(),
  value: z.number().optional(),
  billingFrequency: z.enum(["monthly", "quarterly", "annual", "one_time"]).default("annual"),
  startDate: z.string(),
  endDate: z.string().optional(),
  renewalDate: z.string().optional(),
  autoRenew: z.boolean().default(false),
  slaLevel: z.enum(["basic", "standard", "premium"]).default("standard"),
  slaResponseTime: z.number().optional(),
  slaResolutionTime: z.number().optional(),
  terms: z.string().optional(),
  status: z.enum(["draft", "active", "expired", "cancelled"]).default("active"),
  signedByClient: z.boolean().default(false),
  signedByCompany: z.boolean().default(false),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
});

export type Contract = z.infer<typeof contractSchema>;

export const jobSchema = z.object({
  id: z.string(),
  clientId: z.string().optional(),
  contractId: z.string().optional(),
  projectId: z.string().optional(),
  jobNumber: z.string(),
  title: z.string(),
  description: z.string().optional(),
  siteAddress: z.string().optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  estimatedDuration: z.number().optional(),
  actualDuration: z.number().optional(),
  assignedTechnicianId: z.string().optional(),
  assignedSubcontractorId: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  status: z.enum(["pending", "scheduled", "in_progress", "completed", "cancelled"]).default("pending"),
  jobType: z.enum(["testing", "installation", "repair", "maintenance"]).default("testing"),
  quotedAmount: z.number().optional(),
  actualCost: z.number().optional(),
  materialsCost: z.number().optional(),
  labourCost: z.number().optional(),
  profitMargin: z.number().optional(),
  notes: z.string().optional(),
  completionNotes: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
});

export type Job = z.infer<typeof jobSchema>;

export const expenseSchema = z.object({
  id: z.string(),
  jobId: z.string().optional(),
  category: z.enum(["mileage", "materials", "accommodation", "fuel", "tools", "other"]),
  description: z.string(),
  amount: z.number(),
  date: z.string(),
  mileage: z.number().optional(),
  mileageRate: z.number().default(0.45),
  receiptImage: z.string().optional(),
  reimbursable: z.boolean().default(true),
  reimbursed: z.boolean().default(false),
  status: z.enum(["pending", "approved", "rejected", "reimbursed"]).default("pending"),
  createdAt: z.number(),
});

export type Expense = z.infer<typeof expenseSchema>;

export const timesheetSchema = z.object({
  id: z.string(),
  jobId: z.string().optional(),
  technicianId: z.string().optional(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  breakDuration: z.number().default(0),
  totalHours: z.number().optional(),
  hourlyRate: z.number().optional(),
  overtimeHours: z.number().default(0),
  overtimeRate: z.number().optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "submitted", "approved", "rejected"]).default("pending"),
  createdAt: z.number(),
});

export type Timesheet = z.infer<typeof timesheetSchema>;

// ============================================
// PHASE 1-8 ADDITIONAL TABLES
// ============================================

// Job templates - reusable job configurations
export const jobTemplates = pgTable("job_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  jobType: text("job_type").default("testing"),
  estimatedDuration: real("estimated_duration"),
  defaultPrice: real("default_price"),
  checklist: jsonb("checklist").$type<{ id: string; item: string; required: boolean }[]>().default([]),
  equipmentRequired: jsonb("equipment_required").$type<string[]>().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJobTemplateSchema = createInsertSchema(jobTemplates).omit({ id: true, createdAt: true });
export type InsertJobTemplate = z.infer<typeof insertJobTemplateSchema>;
export type DbJobTemplate = typeof jobTemplates.$inferSelect;

// Site access notes - parking, keys, contacts per building
export const siteAccessNotes = pgTable("site_access_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  siteName: text("site_name").notNull(),
  siteAddress: text("site_address"),
  parkingInstructions: text("parking_instructions"),
  accessCode: text("access_code"),
  keySafeLocation: text("key_safe_location"),
  keySafeCode: text("key_safe_code"),
  buildingManagerName: text("building_manager_name"),
  buildingManagerPhone: text("building_manager_phone"),
  securityContact: text("security_contact"),
  accessHours: text("access_hours"),
  specialRequirements: text("special_requirements"),
  inductionRequired: boolean("induction_required").default(false),
  inductionNotes: text("induction_notes"),
  photos: jsonb("photos").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSiteAccessNoteSchema = createInsertSchema(siteAccessNotes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSiteAccessNote = z.infer<typeof insertSiteAccessNoteSchema>;
export type DbSiteAccessNote = typeof siteAccessNotes.$inferSelect;

// Equipment/assets tracking
export const equipment = pgTable("equipment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  assetTag: text("asset_tag").notNull(),
  name: text("name").notNull(),
  category: text("category").default("tool"), // tool, meter, ppe, vehicle, other
  manufacturer: text("manufacturer"),
  model: text("model"),
  serialNumber: text("serial_number"),
  purchaseDate: text("purchase_date"),
  purchasePrice: real("purchase_price"),
  currentValue: real("current_value"),
  calibrationDue: text("calibration_due"),
  lastCalibrated: text("last_calibrated"),
  calibrationCertificate: text("calibration_certificate"),
  maintenanceDue: text("maintenance_due"),
  lastMaintenance: text("last_maintenance"),
  assignedTo: varchar("assigned_to"),
  location: text("location"),
  status: text("status").default("available"), // available, in_use, maintenance, retired
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type DbEquipment = typeof equipment.$inferSelect;

// Technician certifications
export const certifications = pgTable("certifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  technicianId: varchar("technician_id"),
  technicianName: text("technician_name").notNull(),
  certificationType: text("certification_type").notNull(), // cscs, ipaf, pasma, first_aid, asbestos, electrical
  certificationName: text("certification_name").notNull(),
  issuingBody: text("issuing_body"),
  certificateNumber: text("certificate_number"),
  issueDate: text("issue_date"),
  expiryDate: text("expiry_date"),
  certificateFile: text("certificate_file"),
  status: text("status").default("valid"), // valid, expiring_soon, expired
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCertificationSchema = createInsertSchema(certifications).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type DbCertification = typeof certifications.$inferSelect;

// Incidents and safety reports
export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  jobId: varchar("job_id").references(() => jobs.id),
  incidentDate: text("incident_date").notNull(),
  incidentTime: text("incident_time"),
  location: text("location").notNull(),
  type: text("type").notNull(), // accident, near_miss, unsafe_condition, damage
  severity: text("severity").default("low"), // low, medium, high, critical
  description: text("description").notNull(),
  immediateActions: text("immediate_actions"),
  personsInvolved: jsonb("persons_involved").$type<{ name: string; role: string; injured: boolean }[]>().default([]),
  witnesses: jsonb("witnesses").$type<{ name: string; contact: string }[]>().default([]),
  photos: jsonb("photos").$type<string[]>().default([]),
  rootCause: text("root_cause"),
  correctiveActions: text("corrective_actions"),
  preventiveMeasures: text("preventive_measures"),
  reportedTo: text("reported_to"),
  reportedAt: timestamp("reported_at"),
  investigatedBy: text("investigated_by"),
  investigatedAt: timestamp("investigated_at"),
  closedBy: text("closed_by"),
  closedAt: timestamp("closed_at"),
  status: text("status").default("open"), // open, investigating, closed
  riddorReportable: boolean("riddor_reportable").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({ id: true, createdAt: true, updatedAt: true, reportedAt: true, investigatedAt: true, closedAt: true });
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type DbIncident = typeof incidents.$inferSelect;

// Audit logs - track all changes
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  entityType: text("entity_type").notNull(), // job, client, contract, invoice, etc
  entityId: varchar("entity_id").notNull(),
  action: text("action").notNull(), // create, update, delete, view, export
  changes: jsonb("changes").$type<{ field: string; oldValue: any; newValue: any }[]>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type DbAuditLog = typeof auditLogs.$inferSelect;

// Leads/sales pipeline
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  source: text("source"), // website, referral, cold_call, trade_show, advertising
  estimatedValue: real("estimated_value"),
  probability: integer("probability"), // 0-100
  stage: text("stage").default("new"), // new, contacted, qualified, proposal, negotiation, won, lost
  assignedTo: varchar("assigned_to"),
  nextFollowUp: text("next_follow_up"),
  notes: text("notes"),
  lostReason: text("lost_reason"),
  convertedToClientId: varchar("converted_to_client_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type DbLead = typeof leads.$inferSelect;

// Tenders/bids
export const tenders = pgTable("tenders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  tenderNumber: text("tender_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  issuer: text("issuer"),
  receivedDate: text("received_date"),
  submissionDeadline: text("submission_deadline"),
  contractValue: real("contract_value"),
  contractDuration: text("contract_duration"),
  bidAmount: real("bid_amount"),
  bidSubmittedDate: text("bid_submitted_date"),
  competitors: jsonb("competitors").$type<{ name: string; notes: string }[]>().default([]),
  winProbability: integer("win_probability"),
  documents: jsonb("documents").$type<{ name: string; url: string }[]>().default([]),
  status: text("status").default("received"), // received, preparing, submitted, won, lost, withdrawn
  outcome: text("outcome"),
  debriefNotes: text("debrief_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTenderSchema = createInsertSchema(tenders).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTender = z.infer<typeof insertTenderSchema>;
export type DbTender = typeof tenders.$inferSelect;

// Recurring job schedules
export const recurringSchedules = pgTable("recurring_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  contractId: varchar("contract_id").references(() => contracts.id),
  templateId: varchar("template_id").references(() => jobTemplates.id),
  title: text("title").notNull(),
  frequency: text("frequency").notNull(), // daily, weekly, monthly, quarterly, annual
  dayOfWeek: integer("day_of_week"), // 0-6 for weekly
  dayOfMonth: integer("day_of_month"), // 1-31 for monthly
  monthOfYear: integer("month_of_year"), // 1-12 for annual
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  nextRunDate: text("next_run_date"),
  lastRunDate: text("last_run_date"),
  autoCreate: boolean("auto_create").default(true),
  advanceNoticeDays: integer("advance_notice_days").default(7),
  siteAddress: text("site_address"),
  assignedTo: varchar("assigned_to"),
  notes: text("notes"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRecurringScheduleSchema = createInsertSchema(recurringSchedules).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRecurringSchedule = z.infer<typeof insertRecurringScheduleSchema>;
export type DbRecurringSchedule = typeof recurringSchedules.$inferSelect;

// Risk assessments / RAMS templates
export const riskAssessments = pgTable("risk_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  jobId: varchar("job_id").references(() => jobs.id),
  title: text("title").notNull(),
  siteAddress: text("site_address"),
  assessmentDate: text("assessment_date"),
  assessedBy: text("assessed_by"),
  reviewDate: text("review_date"),
  hazards: jsonb("hazards").$type<{
    id: string;
    hazard: string;
    whoAtRisk: string;
    initialRisk: string;
    controls: string;
    residualRisk: string;
  }[]>().default([]),
  methodStatement: text("method_statement"),
  ppe: jsonb("ppe").$type<string[]>().default([]),
  emergencyProcedures: text("emergency_procedures"),
  signatures: jsonb("signatures").$type<{
    name: string;
    role: string;
    signature: string;
    date: string;
  }[]>().default([]),
  status: text("status").default("draft"), // draft, approved, active, expired
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRiskAssessmentSchema = createInsertSchema(riskAssessments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;
export type DbRiskAssessment = typeof riskAssessments.$inferSelect;

// Performance KPIs
export const performanceMetrics = pgTable("performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  metricDate: text("metric_date").notNull(),
  metricType: text("metric_type").notNull(), // revenue, jobs_completed, customer_satisfaction, first_time_fix, response_time
  value: real("value").notNull(),
  target: real("target"),
  technicianId: varchar("technician_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).omit({ id: true, createdAt: true });
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;
export type DbPerformanceMetric = typeof performanceMetrics.$inferSelect;

// Notifications/alerts
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("info"), // info, warning, error, success
  category: text("category"), // contract, invoice, job, certification, equipment
  entityType: text("entity_type"),
  entityId: varchar("entity_id"),
  read: boolean("read").default(false),
  readAt: timestamp("read_at"),
  actionUrl: text("action_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, readAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type DbNotification = typeof notifications.$inferSelect;

// Recurring Jobs - scheduled repeat jobs
export const recurringJobs = pgTable("recurring_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  templateId: varchar("template_id").references(() => jobTemplates.id),
  clientId: varchar("client_id").references(() => clients.id),
  name: text("name").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull(), // daily, weekly, monthly, quarterly, biannually, annually
  interval: integer("interval").default(1), // e.g., every 2 weeks
  dayOfWeek: integer("day_of_week"), // 0-6 for weekly
  dayOfMonth: integer("day_of_month"), // 1-31 for monthly
  monthOfYear: integer("month_of_year"), // 1-12 for annually
  startDate: text("start_date").notNull(),
  endDate: text("end_date"), // null = no end
  nextDueDate: text("next_due_date"),
  lastGeneratedDate: text("last_generated_date"),
  siteAddress: text("site_address"),
  assignedTechnician: text("assigned_technician"),
  priority: text("priority").default("medium"),
  autoCreateDays: integer("auto_create_days").default(14), // days before due to create job
  isActive: boolean("is_active").default(true),
  jobsGenerated: integer("jobs_generated").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRecurringJobSchema = createInsertSchema(recurringJobs).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRecurringJob = z.infer<typeof insertRecurringJobSchema>;
export type DbRecurringJob = typeof recurringJobs.$inferSelect;

// Job Checklists - completion tracking for jobs
export const jobChecklists = pgTable("job_checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  jobId: varchar("job_id").references(() => jobs.id),
  templateId: varchar("template_id").references(() => jobTemplates.id),
  items: jsonb("items").$type<{
    id: string;
    description: string;
    required: boolean;
    completed: boolean;
    completedAt?: string;
    completedBy?: string;
    notes?: string;
    category?: string;
  }[]>().default([]),
  completedCount: integer("completed_count").default(0),
  totalCount: integer("total_count").default(0),
  status: text("status").default("pending"), // pending, in_progress, completed
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJobChecklistSchema = createInsertSchema(jobChecklists).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });
export type InsertJobChecklist = z.infer<typeof insertJobChecklistSchema>;
export type DbJobChecklist = typeof jobChecklists.$inferSelect;

// Suppliers/Vendors
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  postcode: text("postcode"),
  website: text("website"),
  category: text("category"), // parts, equipment, services, consumables
  accountNumber: text("account_number"),
  paymentTerms: text("payment_terms"), // net30, net60, cod
  taxId: text("tax_id"),
  rating: integer("rating"), // 1-5 stars
  notes: text("notes"),
  isPreferred: boolean("is_preferred").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type DbSupplier = typeof suppliers.$inferSelect;

// Purchase Orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  poNumber: text("po_number").notNull(),
  orderDate: text("order_date").notNull(),
  expectedDeliveryDate: text("expected_delivery_date"),
  actualDeliveryDate: text("actual_delivery_date"),
  status: text("status").default("draft"), // draft, sent, confirmed, partially_received, received, cancelled
  items: jsonb("items").$type<{
    id: string;
    description: string;
    partNumber?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    received?: number;
  }[]>().default([]),
  subtotal: real("subtotal").default(0),
  vatRate: real("vat_rate").default(20),
  vatAmount: real("vat_amount").default(0),
  totalAmount: real("total_amount").default(0),
  shippingAddress: text("shipping_address"),
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  jobId: varchar("job_id").references(() => jobs.id),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({ id: true, createdAt: true, updatedAt: true, approvedAt: true });
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type DbPurchaseOrder = typeof purchaseOrders.$inferSelect;

// Training Records
export const trainingRecords = pgTable("training_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  employeeName: text("employee_name").notNull(),
  employeeId: text("employee_id"),
  courseName: text("course_name").notNull(),
  courseType: text("course_type"), // internal, external, online, practical
  provider: text("provider"),
  completedDate: text("completed_date"),
  expiryDate: text("expiry_date"),
  certificateNumber: text("certificate_number"),
  status: text("status").default("scheduled"), // scheduled, in_progress, completed, expired, failed
  score: real("score"),
  passingScore: real("passing_score"),
  duration: text("duration"), // hours
  cost: real("cost"),
  reimbursed: boolean("reimbursed").default(false),
  notes: text("notes"),
  attachments: jsonb("attachments").$type<{
    name: string;
    url: string;
    type: string;
  }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTrainingRecordSchema = createInsertSchema(trainingRecords).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTrainingRecord = z.infer<typeof insertTrainingRecordSchema>;
export type DbTrainingRecord = typeof trainingRecords.$inferSelect;

// Inventory/Stock
export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  itemName: text("item_name").notNull(),
  partNumber: text("part_number"),
  description: text("description"),
  category: text("category"), // dampers, actuators, controls, ductwork, fixings, consumables
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  location: text("location"), // warehouse, van, site
  quantityInStock: integer("quantity_in_stock").default(0),
  minimumStock: integer("minimum_stock").default(0),
  reorderPoint: integer("reorder_point").default(0),
  reorderQuantity: integer("reorder_quantity"),
  unitCost: real("unit_cost"),
  sellPrice: real("sell_price"),
  unit: text("unit").default("each"), // each, box, pack, metre
  lastPurchaseDate: text("last_purchase_date"),
  lastStockCheck: text("last_stock_check"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type DbInventory = typeof inventory.$inferSelect;

// Defect Register
export const defects = pgTable("defects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  defectNumber: text("defect_number").notNull(),
  jobId: varchar("job_id").references(() => jobs.id),
  clientId: varchar("client_id").references(() => clients.id),
  siteAddress: text("site_address"),
  location: text("location"), // floor, zone, room
  damperRef: text("damper_ref"),
  category: text("category"), // damper, actuator, controls, ductwork, access, other
  severity: text("severity").default("medium"), // critical, high, medium, low
  description: text("description").notNull(),
  discoveredDate: text("discovered_date").notNull(),
  discoveredBy: text("discovered_by"),
  status: text("status").default("open"), // open, quoted, scheduled, in_progress, resolved, closed
  resolution: text("resolution"),
  resolvedDate: text("resolved_date"),
  resolvedBy: text("resolved_by"),
  estimatedCost: real("estimated_cost"),
  actualCost: real("actual_cost"),
  quoteId: varchar("quote_id").references(() => quotes.id),
  remedialJobId: varchar("remedial_job_id").references(() => jobs.id),
  photos: jsonb("photos").$type<{
    url: string;
    caption: string;
  }[]>().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDefectSchema = createInsertSchema(defects).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDefect = z.infer<typeof insertDefectSchema>;
export type DbDefect = typeof defects.$inferSelect;

// Document Register (controlled documents)
export const documentRegister = pgTable("document_register", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  documentNumber: text("document_number").notNull(),
  title: text("title").notNull(),
  category: text("category"), // certificate, report, drawing, manual, policy, insurance, contract
  documentType: text("document_type"), // pdf, word, excel, image, cad
  description: text("description"),
  version: text("version").default("1.0"),
  clientId: varchar("client_id").references(() => clients.id),
  jobId: varchar("job_id").references(() => jobs.id),
  projectId: varchar("project_id").references(() => projects.id),
  issueDate: text("issue_date"),
  expiryDate: text("expiry_date"),
  reviewDate: text("review_date"),
  status: text("status").default("current"), // draft, current, superseded, archived
  fileReference: text("file_reference"), // external file reference/path
  issuedBy: text("issued_by"),
  approvedBy: text("approved_by"),
  tags: text("tags").array(),
  notes: text("notes"),
  isConfidential: boolean("is_confidential").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDocumentRegisterSchema = createInsertSchema(documentRegister).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDocumentRegister = z.infer<typeof insertDocumentRegisterSchema>;
export type DbDocumentRegister = typeof documentRegister.$inferSelect;

// Mileage Claims - HMRC compliant mileage tracking
export const mileageClaims = pgTable("mileage_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  jobId: varchar("job_id").references(() => jobs.id),
  vehicleId: varchar("vehicle_id").references(() => vehicles.id),
  claimDate: text("claim_date").notNull(),
  startLocation: text("start_location").notNull(),
  endLocation: text("end_location").notNull(),
  purpose: text("purpose"),
  distanceMiles: real("distance_miles").notNull(),
  ratePerMile: real("rate_per_mile").default(0.45), // HMRC approved rate
  totalAmount: real("total_amount"),
  isBusinessMiles: boolean("is_business_miles").default(true),
  vehicleType: text("vehicle_type").default("car"), // car, motorcycle, bicycle
  passengerCount: integer("passenger_count").default(0),
  passengerRate: real("passenger_rate").default(0.05), // extra per passenger per mile
  status: text("status").default("pending"), // pending, approved, rejected, paid
  approvedBy: text("approved_by"),
  approvedDate: text("approved_date"),
  paidDate: text("paid_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMileageClaimSchema = createInsertSchema(mileageClaims).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMileageClaim = z.infer<typeof insertMileageClaimSchema>;
export type DbMileageClaim = typeof mileageClaims.$inferSelect;

// Work Notes - Job-related communication log
export const workNotes = pgTable("work_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  jobId: varchar("job_id").references(() => jobs.id),
  clientId: varchar("client_id").references(() => clients.id),
  noteDate: text("note_date").notNull(),
  noteType: text("note_type").default("general"), // general, site_visit, phone_call, email, meeting, issue
  subject: text("subject"),
  content: text("content").notNull(),
  authorName: text("author_name"),
  contactPerson: text("contact_person"),
  isInternal: boolean("is_internal").default(false),
  priority: text("priority").default("normal"), // low, normal, high, urgent
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: text("follow_up_date"),
  followUpCompleted: boolean("follow_up_completed").default(false),
  attachments: jsonb("attachments").$type<{
    name: string;
    url: string;
  }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWorkNoteSchema = createInsertSchema(workNotes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWorkNote = z.infer<typeof insertWorkNoteSchema>;
export type DbWorkNote = typeof workNotes.$inferSelect;

// Callbacks - Customer follow-up tracking
export const callbacks = pgTable("callbacks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  jobId: varchar("job_id").references(() => jobs.id),
  clientId: varchar("client_id").references(() => clients.id),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  reason: text("reason").notNull(),
  category: text("category").default("general"), // general, quote_request, complaint, warranty, booking, emergency
  priority: text("priority").default("normal"), // low, normal, high, urgent
  requestedDate: text("requested_date").notNull(),
  preferredTime: text("preferred_time"),
  assignedTo: text("assigned_to"),
  status: text("status").default("pending"), // pending, attempted, completed, cancelled, escalated
  attemptCount: integer("attempt_count").default(0),
  lastAttemptDate: text("last_attempt_date"),
  completedDate: text("completed_date"),
  outcome: text("outcome"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCallbackSchema = createInsertSchema(callbacks).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCallback = z.infer<typeof insertCallbackSchema>;
export type DbCallback = typeof callbacks.$inferSelect;

// Staff Directory - Employee management
export const staffDirectory = pgTable("staff_directory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  employeeNumber: text("employee_number"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  mobile: text("mobile"),
  jobTitle: text("job_title"),
  department: text("department"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  employmentType: text("employment_type").default("full_time"), // full_time, part_time, contractor, apprentice
  lineManager: text("line_manager"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  emergencyContactRelation: text("emergency_contact_relation"),
  address: text("address"),
  postcode: text("postcode"),
  niNumber: text("ni_number"),
  drivingLicence: boolean("driving_licence").default(false),
  drivingLicenceExpiry: text("driving_licence_expiry"),
  skills: text("skills").array(),
  qualifications: text("qualifications").array(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStaffDirectorySchema = createInsertSchema(staffDirectory).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStaffDirectory = z.infer<typeof insertStaffDirectorySchema>;
export type DbStaffDirectory = typeof staffDirectory.$inferSelect;

// Price Lists - Service pricing
export const priceLists = pgTable("price_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  code: text("code"),
  category: text("category").default("service"), // service, product, labour, materials, call_out
  description: text("description"),
  unit: text("unit").default("each"), // each, hour, day, meter, m2, kg
  costPrice: real("cost_price"),
  sellPrice: real("sell_price").notNull(),
  marginPercent: real("margin_percent"),
  vatRate: real("vat_rate").default(20),
  vatIncluded: boolean("vat_included").default(false),
  minimumCharge: real("minimum_charge"),
  discountable: boolean("discountable").default(true),
  maxDiscountPercent: real("max_discount_percent"),
  effectiveFrom: text("effective_from"),
  effectiveTo: text("effective_to"),
  supplierRef: text("supplier_ref"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPriceListSchema = createInsertSchema(priceLists).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPriceList = z.infer<typeof insertPriceListSchema>;
export type DbPriceList = typeof priceLists.$inferSelect;
