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
// User roles for permission-based access
export const USER_ROLES = ["admin", "office_manager", "field_engineer"] as const;
export type UserRole = typeof USER_ROLES[number];

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
  role: text("role").default("field_engineer"), // admin, office_manager, field_engineer
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
  vatNumber: text("vat_number"),
  accountNumber: text("account_number"),
  paymentTerms: integer("payment_terms").default(30), // Payment terms in days
  priority: text("priority").default("standard"), // standard, preferred, vip
  notes: text("notes"),
  clientType: text("client_type").default("commercial"), // commercial, residential, public_sector
  status: text("status").default("active"), // active, inactive, prospect
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type DbClient = typeof clients.$inferSelect;

// Customer contacts table - multiple contacts per client (regional offices, different departments)
export const customerContacts = pgTable("customer_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  contactName: text("contact_name").notNull(),
  jobTitle: text("job_title"),
  department: text("department"),
  email: text("email"),
  phone: text("phone"),
  mobile: text("mobile"),
  isPrimary: boolean("is_primary").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomerContactSchema = createInsertSchema(customerContacts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCustomerContact = z.infer<typeof insertCustomerContactSchema>;
export type DbCustomerContact = typeof customerContacts.$inferSelect;

// Customer addresses table - multiple addresses per client (head office, regional offices, sites)
export const customerAddresses = pgTable("customer_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  addressType: text("address_type").default("site"), // head_office, regional_office, site, billing
  addressName: text("address_name"), // e.g., "Manchester Office", "Building A"
  address: text("address").notNull(),
  city: text("city"),
  county: text("county"),
  postcode: text("postcode"),
  country: text("country").default("United Kingdom"),
  isPrimary: boolean("is_primary").default(false),
  siteContactName: text("site_contact_name"),
  siteContactPhone: text("site_contact_phone"),
  accessNotes: text("access_notes"),
  parkingInfo: text("parking_info"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomerAddressSchema = createInsertSchema(customerAddresses).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCustomerAddress = z.infer<typeof insertCustomerAddressSchema>;
export type DbCustomerAddress = typeof customerAddresses.$inferSelect;

// Sites table - buildings/locations belonging to clients
export const sites = pgTable("sites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  name: text("name").notNull(), // Building name e.g., "Tower A", "Main Building"
  address: text("address"),
  postcode: text("postcode"),
  city: text("city"),
  systemType: text("system_type"), // Primary system type at this site
  systemDescription: text("system_description"), // Additional system info
  accessNotes: text("access_notes"),
  parkingInfo: text("parking_info"),
  siteContactName: text("site_contact_name"),
  siteContactPhone: text("site_contact_phone"),
  siteContactEmail: text("site_contact_email"),
  notes: text("notes"),
  status: text("status").default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSiteSchema = createInsertSchema(sites).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type DbSite = typeof sites.$inferSelect;

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
  siteId: varchar("site_id").references(() => sites.id),
  jobNumber: text("job_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  siteAddress: text("site_address"),
  scheduledDate: text("scheduled_date"),
  scheduledTime: text("scheduled_time"),
  estimatedDuration: real("estimated_duration"), // Hours
  actualDuration: real("actual_duration"), // Hours
  estimatedTravelTime: real("estimated_travel_time"), // Hours
  actualTravelTime: real("actual_travel_time"), // Hours
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  assignedTechnicianId: varchar("assigned_technician_id"),
  assignedSubcontractorId: varchar("assigned_subcontractor_id"),
  priority: text("priority").default("normal"), // low, normal, high, urgent
  status: text("status").default("pending"), // pending, scheduled, in_progress, completed, cancelled
  jobType: text("job_type").default("testing"), // testing, installation, repair, maintenance
  worksheetType: text("worksheet_type").default("routine_service"), // See SERVICE_VISIT_TYPES constant
  engineerCount: integer("engineer_count").default(1),
  engineerNames: jsonb("engineer_names").$type<{ name: string; competency: string }[]>().default([]),
  quotedAmount: real("quoted_amount"),
  actualCost: real("actual_cost"),
  materialsCost: real("materials_cost"),
  labourCost: real("labour_cost"),
  profitMargin: real("profit_margin"),
  notes: text("notes"),
  completionNotes: text("completion_notes"),
  customerSignature: text("customer_signature"),
  // Visit Report Fields
  systemAge: text("system_age"), // e.g., "5 years", "Installed 2019"
  systemInstallDate: text("system_install_date"),
  systemCondition: text("system_condition").default("operational"), // operational, impaired, non_operational
  faultHistory: jsonb("fault_history").$type<{ date: string; fault: string; resolved: boolean; resolution?: string }[]>().default([]),
  recommendations: text("recommendations"),
  backOfficeNotes: text("back_office_notes"), // Private notes - not visible to client
  serviceStatement: text("service_statement"), // Compliance statement based on condition
  // Multiple systems per visit
  systems: jsonb("systems").$type<{ systemType: string; location: string; notes?: string }[]>().default([]),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type DbJob = typeof jobs.$inferSelect;

// Smoke Control System Types - systems that can be serviced on a visit
export const SMOKE_CONTROL_SYSTEM_TYPES = [
  { value: "mshev", label: "MSHEV (Mechanical Smoke & Heat Exhaust)" },
  { value: "shev", label: "SHEV (Natural Smoke & Heat Exhaust)" },
  { value: "aov", label: "AOV (Automatic Opening Vent)" },
  { value: "stairwell_aov", label: "Stairwell AOV" },
  { value: "lobby_aov", label: "Lobby AOV" },
  { value: "car_park", label: "Car Park Ventilation" },
  { value: "pressurisation", label: "Pressurisation System" },
  { value: "stairwell_pressurisation", label: "Stairwell Pressurisation" },
  { value: "lobby_pressurisation", label: "Lobby Pressurisation" },
  { value: "corridor_pressurisation", label: "Corridor Pressurisation" },
  { value: "smoke_shaft", label: "Smoke Shaft" },
  { value: "smoke_curtain", label: "Smoke Curtain / Barrier" },
  { value: "fire_curtain", label: "Fire Curtain" },
  { value: "damper_system", label: "Smoke Control Dampers" },
  { value: "extract_fan", label: "Smoke Extract Fan" },
  { value: "supply_fan", label: "Air Supply Fan" },
  { value: "bms_interface", label: "BMS / Fire Alarm Interface" },
  { value: "other", label: "Other (specify in notes)" },
] as const;

// Checklist item structure for system service checklists
export interface SystemChecklistItem {
  id: string;
  item: string;
  category: string;
  isMandatory: boolean;
  checked: boolean;
  notes?: string;
}

// Default checklist templates per smoke control system type
export const SYSTEM_CHECKLIST_TEMPLATES: Record<string, Omit<SystemChecklistItem, 'id' | 'checked' | 'notes'>[]> = {
  mshev: [
    { item: "Visual inspection of extract fan unit", category: "Visual Inspection", isMandatory: true },
    { item: "Check fan motor bearings for wear", category: "Mechanical", isMandatory: true },
    { item: "Verify belt tension and condition", category: "Mechanical", isMandatory: true },
    { item: "Clean fan blades and housing", category: "Maintenance", isMandatory: false },
    { item: "Test fire alarm activation signal", category: "Functional Test", isMandatory: true },
    { item: "Measure airflow velocity at extract points", category: "Performance", isMandatory: true },
    { item: "Check damper operation - open/close cycle", category: "Functional Test", isMandatory: true },
    { item: "Verify control panel indicators", category: "Electrical", isMandatory: true },
    { item: "Test manual override function", category: "Functional Test", isMandatory: true },
    { item: "Check electrical connections and terminations", category: "Electrical", isMandatory: true },
  ],
  shev: [
    { item: "Visual inspection of smoke vents", category: "Visual Inspection", isMandatory: true },
    { item: "Check actuator operation", category: "Mechanical", isMandatory: true },
    { item: "Verify weather seals condition", category: "Visual Inspection", isMandatory: true },
    { item: "Test manual release mechanism", category: "Functional Test", isMandatory: true },
    { item: "Test fire alarm activation", category: "Functional Test", isMandatory: true },
    { item: "Measure opening angle/position", category: "Performance", isMandatory: true },
    { item: "Check wiring and connections", category: "Electrical", isMandatory: true },
    { item: "Lubricate hinges and moving parts", category: "Maintenance", isMandatory: false },
  ],
  aov: [
    { item: "Visual inspection of vent condition", category: "Visual Inspection", isMandatory: true },
    { item: "Check actuator/motor operation", category: "Mechanical", isMandatory: true },
    { item: "Test open/close cycle time", category: "Functional Test", isMandatory: true },
    { item: "Verify weather seals", category: "Visual Inspection", isMandatory: true },
    { item: "Test fire alarm trigger", category: "Functional Test", isMandatory: true },
    { item: "Check manual override", category: "Functional Test", isMandatory: true },
    { item: "Inspect control panel indicators", category: "Electrical", isMandatory: true },
    { item: "Check wiring and connections", category: "Electrical", isMandatory: true },
  ],
  stairwell_aov: [
    { item: "Visual inspection of stairwell vent", category: "Visual Inspection", isMandatory: true },
    { item: "Check actuator operation", category: "Mechanical", isMandatory: true },
    { item: "Test fire alarm activation", category: "Functional Test", isMandatory: true },
    { item: "Verify opening position", category: "Performance", isMandatory: true },
    { item: "Check manual override function", category: "Functional Test", isMandatory: true },
    { item: "Inspect seals and weatherproofing", category: "Visual Inspection", isMandatory: true },
    { item: "Test control panel indicators", category: "Electrical", isMandatory: true },
  ],
  lobby_aov: [
    { item: "Visual inspection of lobby vent", category: "Visual Inspection", isMandatory: true },
    { item: "Check actuator operation", category: "Mechanical", isMandatory: true },
    { item: "Test fire alarm activation", category: "Functional Test", isMandatory: true },
    { item: "Verify opening position", category: "Performance", isMandatory: true },
    { item: "Check manual override function", category: "Functional Test", isMandatory: true },
    { item: "Inspect seals and weatherproofing", category: "Visual Inspection", isMandatory: true },
  ],
  car_park: [
    { item: "Visual inspection of extract fans", category: "Visual Inspection", isMandatory: true },
    { item: "Check jet fan operation", category: "Mechanical", isMandatory: true },
    { item: "Test CO/NO2 sensor activation", category: "Functional Test", isMandatory: true },
    { item: "Verify fan speed control", category: "Performance", isMandatory: true },
    { item: "Test fire mode operation", category: "Functional Test", isMandatory: true },
    { item: "Check impulse fan direction", category: "Performance", isMandatory: true },
    { item: "Inspect control panel and BMS interface", category: "Electrical", isMandatory: true },
    { item: "Measure airflow at extract points", category: "Performance", isMandatory: true },
  ],
  pressurisation: [
    { item: "Visual inspection of supply fan", category: "Visual Inspection", isMandatory: true },
    { item: "Check fan motor operation", category: "Mechanical", isMandatory: true },
    { item: "Test fire alarm activation", category: "Functional Test", isMandatory: true },
    { item: "Measure differential pressure", category: "Performance", isMandatory: true },
    { item: "Verify pressure relief damper operation", category: "Functional Test", isMandatory: true },
    { item: "Check door opening force", category: "Performance", isMandatory: true },
    { item: "Test pressure sensors", category: "Functional Test", isMandatory: true },
    { item: "Inspect control panel", category: "Electrical", isMandatory: true },
  ],
  stairwell_pressurisation: [
    { item: "Visual inspection of supply fan", category: "Visual Inspection", isMandatory: true },
    { item: "Check fan motor operation", category: "Mechanical", isMandatory: true },
    { item: "Test fire alarm activation", category: "Functional Test", isMandatory: true },
    { item: "Measure differential pressure at each level", category: "Performance", isMandatory: true },
    { item: "Check door opening force at each level", category: "Performance", isMandatory: true },
    { item: "Verify pressure relief damper operation", category: "Functional Test", isMandatory: true },
    { item: "Test with doors open scenario", category: "Functional Test", isMandatory: true },
    { item: "Inspect air inlet grilles", category: "Visual Inspection", isMandatory: true },
  ],
  lobby_pressurisation: [
    { item: "Visual inspection of supply fan", category: "Visual Inspection", isMandatory: true },
    { item: "Check fan motor operation", category: "Mechanical", isMandatory: true },
    { item: "Test fire alarm activation", category: "Functional Test", isMandatory: true },
    { item: "Measure differential pressure", category: "Performance", isMandatory: true },
    { item: "Check door opening force", category: "Performance", isMandatory: true },
    { item: "Verify pressure relief operation", category: "Functional Test", isMandatory: true },
    { item: "Inspect inlet and outlet grilles", category: "Visual Inspection", isMandatory: true },
  ],
  corridor_pressurisation: [
    { item: "Visual inspection of supply arrangement", category: "Visual Inspection", isMandatory: true },
    { item: "Check fan operation", category: "Mechanical", isMandatory: true },
    { item: "Test fire alarm activation", category: "Functional Test", isMandatory: true },
    { item: "Measure differential pressure", category: "Performance", isMandatory: true },
    { item: "Check door opening forces", category: "Performance", isMandatory: true },
    { item: "Verify damper sequencing", category: "Functional Test", isMandatory: true },
  ],
  smoke_shaft: [
    { item: "Visual inspection of shaft vents", category: "Visual Inspection", isMandatory: true },
    { item: "Check damper operation at each level", category: "Functional Test", isMandatory: true },
    { item: "Test fire alarm activation", category: "Functional Test", isMandatory: true },
    { item: "Verify damper sequencing", category: "Functional Test", isMandatory: true },
    { item: "Measure airflow velocity", category: "Performance", isMandatory: true },
    { item: "Check head of shaft vent", category: "Visual Inspection", isMandatory: true },
    { item: "Test manual override at each damper", category: "Functional Test", isMandatory: true },
  ],
  smoke_curtain: [
    { item: "Visual inspection of curtain fabric", category: "Visual Inspection", isMandatory: true },
    { item: "Check motor/actuator operation", category: "Mechanical", isMandatory: true },
    { item: "Test deploy and retract cycle", category: "Functional Test", isMandatory: true },
    { item: "Verify fire alarm activation", category: "Functional Test", isMandatory: true },
    { item: "Check guide rails and seals", category: "Visual Inspection", isMandatory: true },
    { item: "Measure deploy time", category: "Performance", isMandatory: true },
    { item: "Inspect control unit", category: "Electrical", isMandatory: true },
  ],
  fire_curtain: [
    { item: "Visual inspection of curtain condition", category: "Visual Inspection", isMandatory: true },
    { item: "Check motor/gravity mechanism", category: "Mechanical", isMandatory: true },
    { item: "Test deploy operation", category: "Functional Test", isMandatory: true },
    { item: "Verify fire alarm activation", category: "Functional Test", isMandatory: true },
    { item: "Check guide rails and bottom bar", category: "Visual Inspection", isMandatory: true },
    { item: "Measure deploy time", category: "Performance", isMandatory: true },
    { item: "Test reset function", category: "Functional Test", isMandatory: true },
  ],
  damper_system: [
    { item: "Visual inspection of damper blade", category: "Visual Inspection", isMandatory: true },
    { item: "Check actuator operation", category: "Mechanical", isMandatory: true },
    { item: "Test open/close cycle", category: "Functional Test", isMandatory: true },
    { item: "Verify fire alarm activation", category: "Functional Test", isMandatory: true },
    { item: "Check blade seals", category: "Visual Inspection", isMandatory: true },
    { item: "Measure airflow velocity", category: "Performance", isMandatory: true },
    { item: "Test manual override", category: "Functional Test", isMandatory: true },
    { item: "Check position indicator", category: "Electrical", isMandatory: true },
  ],
  extract_fan: [
    { item: "Visual inspection of fan unit", category: "Visual Inspection", isMandatory: true },
    { item: "Check motor bearings", category: "Mechanical", isMandatory: true },
    { item: "Verify belt tension (if applicable)", category: "Mechanical", isMandatory: false },
    { item: "Test fire alarm activation", category: "Functional Test", isMandatory: true },
    { item: "Measure airflow rate", category: "Performance", isMandatory: true },
    { item: "Check vibration levels", category: "Performance", isMandatory: true },
    { item: "Test speed control", category: "Functional Test", isMandatory: true },
    { item: "Inspect electrical connections", category: "Electrical", isMandatory: true },
  ],
  supply_fan: [
    { item: "Visual inspection of fan unit", category: "Visual Inspection", isMandatory: true },
    { item: "Check motor operation", category: "Mechanical", isMandatory: true },
    { item: "Verify filter condition", category: "Visual Inspection", isMandatory: true },
    { item: "Test fire alarm activation", category: "Functional Test", isMandatory: true },
    { item: "Measure airflow rate", category: "Performance", isMandatory: true },
    { item: "Check inlet damper operation", category: "Functional Test", isMandatory: true },
    { item: "Inspect electrical connections", category: "Electrical", isMandatory: true },
  ],
  bms_interface: [
    { item: "Check BMS communication status", category: "Electrical", isMandatory: true },
    { item: "Verify fire alarm signal receipt", category: "Functional Test", isMandatory: true },
    { item: "Test system activation from BMS", category: "Functional Test", isMandatory: true },
    { item: "Check fault signal transmission", category: "Functional Test", isMandatory: true },
    { item: "Verify status feedback to BMS", category: "Functional Test", isMandatory: true },
    { item: "Review event logs", category: "Electrical", isMandatory: true },
    { item: "Test override functions", category: "Functional Test", isMandatory: true },
  ],
  other: [
    { item: "Visual inspection of system components", category: "Visual Inspection", isMandatory: true },
    { item: "Check operational status", category: "Functional Test", isMandatory: true },
    { item: "Test fire alarm activation", category: "Functional Test", isMandatory: true },
    { item: "Verify performance parameters", category: "Performance", isMandatory: true },
    { item: "Inspect electrical connections", category: "Electrical", isMandatory: true },
  ],
};

// Service Visit Types - purpose/type of each site visit
export const SERVICE_VISIT_TYPES = [
  { value: "condition_survey", label: "Condition / Compliance Survey Visit" },
  { value: "routine_service", label: "Routine Service Visit" },
  { value: "interim_inspection", label: "Interim Inspection Visit" },
  { value: "remediation", label: "Remediation Visit" },
  { value: "commissioning", label: "Commissioning Visit" },
  { value: "verification", label: "Verification / Re-Commissioning Visit" },
  { value: "reactive_fault", label: "Reactive / Fault Attendance Visit" },
  { value: "access_enabling", label: "Access / Enabling Visit" },
  { value: "diagnostic_testing", label: "Diagnostic Testing Visit" },
  { value: "goodwill", label: "Free of Charge / Goodwill Visit" },
] as const;

// Asset Types for site assets
export const ASSET_TYPES = [
  { value: "smoke_damper", label: "Smoke Damper" },
  { value: "fire_damper", label: "Fire Damper" },
  { value: "combination_damper", label: "Combination Fire/Smoke Damper" },
  { value: "aov", label: "AOV (Automatic Opening Vent)" },
  { value: "smoke_shaft", label: "Smoke Shaft" },
  { value: "exhaust_fan", label: "Exhaust Fan" },
  { value: "supply_fan", label: "Supply Fan" },
  { value: "control_panel", label: "Control Panel" },
  { value: "smoke_detector", label: "Smoke Detector" },
  { value: "manual_call_point", label: "Manual Call Point" },
  { value: "pressure_sensor", label: "Pressure Sensor" },
  { value: "air_release_damper", label: "Air Release Damper" },
  { value: "louvre", label: "Louvre" },
  { value: "actuator", label: "Actuator" },
  { value: "bms_interface", label: "BMS Interface" },
  { value: "other", label: "Other" },
] as const;

// System Condition Options for visit reports
export const SYSTEM_CONDITION_OPTIONS = [
  { value: "operational", label: "Operational" },
  { value: "impaired", label: "Impaired / Partial Operation" },
  { value: "non_operational", label: "Non-Operational" },
] as const;

// BS 7346-8:2013+A1:2019 Compliance Service Statements
export const SERVICE_STATEMENTS = {
  operational: `The smoke ventilation system has been inspected, tested and serviced in accordance with BS 7346-8:2013+A1:2019, Clause 11. All functional tests, electrical readings and visual inspections have been completed in line with the manufacturer's instructions. The system was found to be operational at the time of attendance, subject to the defects and observations recorded on this worksheet.`,
  non_operational: `The smoke ventilation system was found to be non-operational or impaired at the time of attendance. This condition represents a non-compliance with BS 7346-8:2013+A1:2019 and may affect life safety. Immediate remedial action is required.`,
} as const;

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

// Recurring Jobs - scheduled repeat jobs with contract-based scheduling
export const recurringJobs = pgTable("recurring_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  templateId: varchar("template_id").references(() => jobTemplates.id),
  clientId: varchar("client_id").references(() => clients.id),
  contractId: varchar("contract_id").references(() => contracts.id),
  name: text("name").notNull(),
  description: text("description"),
  serviceType: text("service_type"), // damper_testing, pressure_testing, maintenance, inspection
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
  reminderDaysBefore: integer("reminder_days_before").default(7), // days before due to send reminder
  lastReminderSent: text("last_reminder_sent"), // timestamp of last reminder
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

// Team Invitations - Invite employees to join
export const teamInvitations = pgTable("team_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").default("engineer"),
  jobTitle: text("job_title"),
  department: text("department"),
  token: text("token").notNull(),
  status: text("status").default("pending"),
  expiresAt: timestamp("expires_at"),
  acceptedAt: timestamp("accepted_at"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeamInvitationSchema = createInsertSchema(teamInvitations).omit({ id: true, createdAt: true, token: true, status: true, expiresAt: true, acceptedAt: true });
export type InsertTeamInvitation = z.infer<typeof insertTeamInvitationSchema>;
export type DbTeamInvitation = typeof teamInvitations.$inferSelect;

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

// Phase 7: Customer Feedback
export const customerFeedback = pgTable("customer_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  jobId: varchar("job_id").references(() => jobs.id),
  feedbackDate: text("feedback_date").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  category: text("category").default("general"), // general, quality, timeliness, communication, value
  feedbackType: text("feedback_type").default("positive"), // positive, negative, neutral, suggestion
  summary: text("summary").notNull(),
  details: text("details"),
  actionTaken: text("action_taken"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: text("follow_up_date"),
  followUpNotes: text("follow_up_notes"),
  resolvedDate: text("resolved_date"),
  staffMember: text("staff_member"),
  source: text("source").default("direct"), // direct, email, phone, survey, online
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomerFeedbackSchema = createInsertSchema(customerFeedback).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCustomerFeedback = z.infer<typeof insertCustomerFeedbackSchema>;
export type DbCustomerFeedback = typeof customerFeedback.$inferSelect;

// Phase 7: Service Level Agreements
export const serviceLevelAgreements = pgTable("service_level_agreements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  contractId: varchar("contract_id").references(() => contracts.id),
  name: text("name").notNull(),
  description: text("description"),
  priority: text("priority").default("standard"), // emergency, urgent, standard, low
  responseTimeHours: integer("response_time_hours").notNull(),
  resolutionTimeHours: integer("resolution_time_hours"),
  escalationLevel1Hours: integer("escalation_level1_hours"),
  escalationLevel1Contact: text("escalation_level1_contact"),
  escalationLevel2Hours: integer("escalation_level2_hours"),
  escalationLevel2Contact: text("escalation_level2_contact"),
  escalationLevel3Hours: integer("escalation_level3_hours"),
  escalationLevel3Contact: text("escalation_level3_contact"),
  serviceHours: text("service_hours").default("business"), // 24x7, business, extended
  businessHoursStart: text("business_hours_start"),
  businessHoursEnd: text("business_hours_end"),
  excludeWeekends: boolean("exclude_weekends").default(true),
  excludeHolidays: boolean("exclude_holidays").default(true),
  penaltyClause: text("penalty_clause"),
  penaltyAmount: real("penalty_amount"),
  isActive: boolean("is_active").default(true),
  effectiveFrom: text("effective_from"),
  effectiveTo: text("effective_to"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSLASchema = createInsertSchema(serviceLevelAgreements).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSLA = z.infer<typeof insertSLASchema>;
export type DbSLA = typeof serviceLevelAgreements.$inferSelect;

// Phase 7: Parts Catalog
export const partsCatalog = pgTable("parts_catalog", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  partNumber: text("part_number").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").default("general"), // damper, motor, sensor, actuator, control, fastener, seal, general
  manufacturer: text("manufacturer"),
  modelNumber: text("model_number"),
  unitOfMeasure: text("unit_of_measure").default("each"), // each, box, pack, meter, kg
  costPrice: real("cost_price").notNull(),
  sellPrice: real("sell_price"),
  markupPercent: real("markup_percent"),
  stockQuantity: integer("stock_quantity").default(0),
  minimumStock: integer("minimum_stock").default(0),
  reorderQuantity: integer("reorder_quantity"),
  leadTimeDays: integer("lead_time_days"),
  location: text("location"), // warehouse location
  barcode: text("barcode"),
  weight: real("weight"),
  dimensions: text("dimensions"),
  compatibleWith: text("compatible_with"),
  alternativeParts: text("alternative_parts"),
  warrantyMonths: integer("warranty_months"),
  isActive: boolean("is_active").default(true),
  lastOrderDate: text("last_order_date"),
  lastPriceUpdate: text("last_price_update"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPartsCatalogSchema = createInsertSchema(partsCatalog).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPartsCatalog = z.infer<typeof insertPartsCatalogSchema>;
export type DbPartsCatalog = typeof partsCatalog.$inferSelect;

// Phase 8: Document Templates
export const documentTemplates = pgTable("document_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  templateType: text("template_type").default("quote"), // quote, invoice, contract, report, letter, certificate
  category: text("category").default("general"), // general, smoke_control, fire_safety, maintenance, compliance
  content: text("content").notNull(), // Template content with placeholders
  placeholders: jsonb("placeholders").$type<string[]>().default([]), // List of placeholder variables
  headerText: text("header_text"),
  footerText: text("footer_text"),
  termsAndConditions: text("terms_and_conditions"),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  version: integer("version").default(1),
  lastUsedDate: text("last_used_date"),
  usageCount: integer("usage_count").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDocumentTemplateSchema = createInsertSchema(documentTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDocumentTemplate = z.infer<typeof insertDocumentTemplateSchema>;
export type DbDocumentTemplate = typeof documentTemplates.$inferSelect;

// Phase 8: Warranties
export const warranties = pgTable("warranties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  jobId: varchar("job_id").references(() => jobs.id),
  equipmentDescription: text("equipment_description").notNull(),
  manufacturer: text("manufacturer"),
  modelNumber: text("model_number"),
  serialNumber: text("serial_number"),
  installationDate: text("installation_date").notNull(),
  warrantyStartDate: text("warranty_start_date").notNull(),
  warrantyEndDate: text("warranty_end_date").notNull(),
  warrantyType: text("warranty_type").default("standard"), // standard, extended, manufacturer, parts_only, labour_only
  warrantyProvider: text("warranty_provider"),
  coverageDetails: text("coverage_details"),
  exclusions: text("exclusions"),
  claimProcess: text("claim_process"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  referenceNumber: text("reference_number"),
  purchasePrice: real("purchase_price"),
  warrantyCost: real("warranty_cost"),
  claimsCount: integer("claims_count").default(0),
  lastClaimDate: text("last_claim_date"),
  status: text("status").default("active"), // active, expired, claimed, void
  documentPath: text("document_path"),
  reminderDays: integer("reminder_days").default(30),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWarrantySchema = createInsertSchema(warranties).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWarranty = z.infer<typeof insertWarrantySchema>;
export type DbWarranty = typeof warranties.$inferSelect;

// Phase 8: Competitors
export const competitors = pgTable("competitors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  companyName: text("company_name").notNull(),
  tradingName: text("trading_name"),
  website: text("website"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  postcode: text("postcode"),
  region: text("region"),
  specializations: text("specializations"), // Comma-separated services
  marketPosition: text("market_position").default("direct"), // direct, indirect, potential
  companySize: text("company_size").default("unknown"), // micro, small, medium, large, enterprise, unknown
  estimatedRevenue: text("estimated_revenue"),
  employeeCount: integer("employee_count"),
  foundedYear: integer("founded_year"),
  accreditations: text("accreditations"),
  keyStrengths: text("key_strengths"),
  keyWeaknesses: text("key_weaknesses"),
  pricingLevel: text("pricing_level").default("unknown"), // budget, competitive, premium, unknown
  averageQuoteVariance: real("average_quote_variance"), // % difference from our quotes
  wonAgainst: integer("won_against").default(0),
  lostTo: integer("lost_to").default(0),
  lastEncounterDate: text("last_encounter_date"),
  lastEncounterOutcome: text("last_encounter_outcome"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  threatLevel: text("threat_level").default("medium"), // low, medium, high
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompetitorSchema = createInsertSchema(competitors).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCompetitor = z.infer<typeof insertCompetitorSchema>;
export type DbCompetitor = typeof competitors.$inferSelect;

// Phase 9: Service History
export const serviceHistory = pgTable("service_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  jobId: varchar("job_id").references(() => jobs.id),
  equipmentId: text("equipment_id"),
  serviceDate: text("service_date").notNull(),
  serviceType: text("service_type").default("maintenance"), // maintenance, repair, installation, inspection, emergency
  technicianName: text("technician_name"),
  description: text("description").notNull(),
  workPerformed: text("work_performed"),
  partsUsed: text("parts_used"),
  partsCost: real("parts_cost"),
  labourHours: real("labour_hours"),
  labourCost: real("labour_cost"),
  totalCost: real("total_cost"),
  outcome: text("outcome").default("completed"), // completed, partial, requires_followup, failed
  nextServiceDue: text("next_service_due"),
  recommendations: text("recommendations"),
  customerSignature: text("customer_signature"),
  signedDate: text("signed_date"),
  documentPath: text("document_path"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertServiceHistorySchema = createInsertSchema(serviceHistory).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertServiceHistory = z.infer<typeof insertServiceHistorySchema>;
export type DbServiceHistory = typeof serviceHistory.$inferSelect;

// Phase 9: Quality Checklists
export const qualityChecklists = pgTable("quality_checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  jobId: varchar("job_id").references(() => jobs.id),
  name: text("name").notNull(),
  checklistType: text("checklist_type").default("pre_work"), // pre_work, in_progress, completion, handover, safety
  category: text("category").default("general"), // general, smoke_control, fire_safety, electrical, mechanical
  completedBy: text("completed_by"),
  completedDate: text("completed_date"),
  status: text("status").default("pending"), // pending, in_progress, completed, failed
  items: jsonb("items").$type<{item: string; checked: boolean; notes?: string}[]>().default([]),
  overallScore: integer("overall_score"),
  passThreshold: integer("pass_threshold").default(80),
  isPassed: boolean("is_passed"),
  supervisorApproval: text("supervisor_approval"),
  supervisorDate: text("supervisor_date"),
  nonConformances: text("non_conformances"),
  correctiveActions: text("corrective_actions"),
  attachments: text("attachments"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQualityChecklistSchema = createInsertSchema(qualityChecklists).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertQualityChecklist = z.infer<typeof insertQualityChecklistSchema>;
export type DbQualityChecklist = typeof qualityChecklists.$inferSelect;

// Phase 9: Time Off Requests
export const timeOffRequests = pgTable("time_off_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  employeeName: text("employee_name").notNull(),
  employeeId: text("employee_id"),
  requestType: text("request_type").default("annual_leave"), // annual_leave, sick_leave, unpaid, compassionate, training, other
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalDays: real("total_days").notNull(),
  isHalfDay: boolean("is_half_day").default(false),
  halfDayPeriod: text("half_day_period"), // morning, afternoon
  reason: text("reason"),
  status: text("status").default("pending"), // pending, approved, rejected, cancelled
  approvedBy: text("approved_by"),
  approvedDate: text("approved_date"),
  rejectionReason: text("rejection_reason"),
  coverArrangements: text("cover_arrangements"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  affectsProjects: text("affects_projects"),
  handoverNotes: text("handover_notes"),
  returnConfirmed: boolean("return_confirmed").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTimeOffRequestSchema = createInsertSchema(timeOffRequests).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTimeOffRequest = z.infer<typeof insertTimeOffRequestSchema>;
export type DbTimeOffRequest = typeof timeOffRequests.$inferSelect;

// Phase 10: Visit Types - System types that dictate service templates
export const visitTypes = pgTable("visit_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(), // NSHEV, MSHEV, Electro-pneumatic, Pressurisation, Residential Stair AOV, Car Park
  code: text("code").notNull(), // nshev, mshev, electro_pneumatic, pressurisation, residential_aov, car_park
  description: text("description"),
  category: text("category").default("smoke_control"), // smoke_control, ventilation, fire_safety
  inspectionIntervals: jsonb("inspection_intervals").$type<{daily: boolean; weekly: boolean; monthly: boolean; quarterly: boolean; biannual: boolean; annual: boolean}>().default({daily: true, weekly: true, monthly: true, quarterly: true, biannual: true, annual: true}),
  regulatoryStandard: text("regulatory_standard"), // BS EN 12101-6, BS EN 12101-8, BS 7346, etc.
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVisitTypeSchema = createInsertSchema(visitTypes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVisitType = z.infer<typeof insertVisitTypeSchema>;
export type DbVisitType = typeof visitTypes.$inferSelect;

// Phase 10: Service Templates - Checklist templates based on visit type and interval
export const serviceTemplates = pgTable("service_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  visitTypeId: varchar("visit_type_id").references(() => visitTypes.id),
  name: text("name").notNull(),
  intervalType: text("interval_type").notNull(), // daily, weekly, monthly, quarterly, biannual, annual
  carriedOutBy: text("carried_out_by").default("competent_person"), // nominated_person, competent_person, competent_maintainer, certified_organisation
  checklistItems: jsonb("checklist_items").$type<{id: string; item: string; category: string; isMandatory: boolean; guidance?: string}[]>().default([]),
  guidelines: text("guidelines"),
  equipmentRequired: text("equipment_required"),
  estimatedDuration: integer("estimated_duration"), // minutes
  regulatoryReference: text("regulatory_reference"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertServiceTemplateSchema = createInsertSchema(serviceTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertServiceTemplate = z.infer<typeof insertServiceTemplateSchema>;
export type DbServiceTemplate = typeof serviceTemplates.$inferSelect;

// Phase 10: Site Assets - Equipment/assets at a site with bulk add support
export const siteAssets = pgTable("site_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  projectId: varchar("project_id").references(() => projects.id),
  clientId: varchar("client_id").references(() => clients.id),
  siteId: varchar("site_id").references(() => sites.id), // Link to specific site/building
  assetNumber: text("asset_number").notNull(), // e.g., AOV-001, SCD-G01
  assetType: text("asset_type").notNull(), // aov, smoke_damper, control_panel, detector, fan, duct, firefighter_switch
  visitType: text("visit_type"), // links to visit type code
  building: text("building"),
  floor: text("floor"),
  area: text("area"),
  location: text("location"),
  description: text("description"),
  manufacturer: text("manufacturer"),
  model: text("model"),
  serialNumber: text("serial_number"),
  installDate: text("install_date"),
  warrantyExpiry: text("warranty_expiry"),
  dimensions: jsonb("dimensions").$type<{width?: number; height?: number; depth?: number}>(),
  specifications: jsonb("specifications").$type<Record<string, string>>(),
  status: text("status").default("active"), // active, inactive, faulty, replaced, pending_inspection
  lastInspectionDate: text("last_inspection_date"),
  nextInspectionDue: text("next_inspection_due"),
  condition: text("condition").default("good"), // good, fair, poor, critical
  photos: jsonb("photos").$type<string[]>().default([]),
  qrCode: text("qr_code"),
  parentAssetId: varchar("parent_asset_id"), // for hierarchical assets (e.g., detector linked to control panel)
  batchId: varchar("batch_id"), // for tracking bulk-added assets
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSiteAssetSchema = createInsertSchema(siteAssets).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSiteAsset = z.infer<typeof insertSiteAssetSchema>;
export type DbSiteAsset = typeof siteAssets.$inferSelect;

// Job Site Assets - Junction table linking site assets to jobs for testing/inspection
export const jobSiteAssets = pgTable("job_site_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  jobId: varchar("job_id").references(() => jobs.id).notNull(),
  siteAssetId: varchar("site_asset_id").references(() => siteAssets.id).notNull(),
  status: text("status").default("assigned"), // assigned, in_progress, completed, skipped
  assignedAt: timestamp("assigned_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by"),
  notes: text("notes"),
  testResults: jsonb("test_results").$type<Record<string, any>>(),
  requiresWork: boolean("requires_work").default(false),
  requiresWorkReason: text("requires_work_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJobSiteAssetSchema = createInsertSchema(jobSiteAssets).omit({ id: true, createdAt: true, updatedAt: true, assignedAt: true });
export type InsertJobSiteAsset = z.infer<typeof insertJobSiteAssetSchema>;
export type DbJobSiteAsset = typeof jobSiteAssets.$inferSelect;

// Phase 10: Asset Batches - Track bulk asset creation operations
export const assetBatches = pgTable("asset_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  projectId: varchar("project_id").references(() => projects.id),
  batchName: text("batch_name").notNull(),
  assetType: text("asset_type").notNull(),
  visitType: text("visit_type"),
  quantity: integer("quantity").notNull(),
  startingFloor: text("starting_floor"),
  startingArea: text("starting_area"),
  numberingPrefix: text("numbering_prefix").notNull(), // e.g., AOV-, SCD-
  startingNumber: integer("starting_number").notNull().default(1),
  numberingFormat: text("numbering_format").default("###"), // 001, 01, 1
  building: text("building"),
  createdAssetsCount: integer("created_assets_count").default(0),
  status: text("status").default("pending"), // pending, in_progress, completed, failed
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAssetBatchSchema = createInsertSchema(assetBatches).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAssetBatch = z.infer<typeof insertAssetBatchSchema>;
export type DbAssetBatch = typeof assetBatches.$inferSelect;

// ============================================
// SCHEDULING ENHANCEMENT TABLES
// ============================================

// Job Assignments - Multi-engineer assignments for jobs
export const jobAssignments = pgTable("job_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  jobId: varchar("job_id").references(() => jobs.id).notNull(),
  staffId: varchar("staff_id").references(() => staffDirectory.id),
  subcontractorId: varchar("subcontractor_id").references(() => subcontractors.id),
  role: text("role").default("technician"), // lead, technician, helper, supervisor
  assignedDate: text("assigned_date"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  status: text("status").default("assigned"), // assigned, confirmed, declined, completed
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJobAssignmentSchema = createInsertSchema(jobAssignments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJobAssignment = z.infer<typeof insertJobAssignmentSchema>;
export type DbJobAssignment = typeof jobAssignments.$inferSelect;

// Job Skill Requirements - Skills/certifications required for jobs
export const jobSkillRequirements = pgTable("job_skill_requirements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  jobId: varchar("job_id").references(() => jobs.id).notNull(),
  skillType: text("skill_type").notNull(), // certification type: cscs, ipaf, pasma, first_aid, asbestos_awareness, etc.
  skillLevel: text("skill_level").default("required"), // required, preferred, optional
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJobSkillRequirementSchema = createInsertSchema(jobSkillRequirements).omit({ id: true, createdAt: true });
export type InsertJobSkillRequirement = z.infer<typeof insertJobSkillRequirementSchema>;
export type DbJobSkillRequirement = typeof jobSkillRequirements.$inferSelect;

// Job Equipment Reservations - Equipment booked for jobs
export const jobEquipmentReservations = pgTable("job_equipment_reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  jobId: varchar("job_id").references(() => jobs.id).notNull(),
  equipmentId: varchar("equipment_id").references(() => equipment.id).notNull(),
  reservedDate: text("reserved_date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  status: text("status").default("reserved"), // reserved, checked_out, returned, cancelled
  checkedOutBy: varchar("checked_out_by"),
  checkedOutAt: timestamp("checked_out_at"),
  returnedAt: timestamp("returned_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJobEquipmentReservationSchema = createInsertSchema(jobEquipmentReservations).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJobEquipmentReservation = z.infer<typeof insertJobEquipmentReservationSchema>;
export type DbJobEquipmentReservation = typeof jobEquipmentReservations.$inferSelect;

// Job Parts Used - Tracks parts/materials used on each job
export const jobPartsUsed = pgTable("job_parts_used", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  jobId: varchar("job_id").references(() => jobs.id).notNull(),
  partId: varchar("part_id").references(() => partsCatalog.id),
  siteAssetId: varchar("site_asset_id").references(() => siteAssets.id),
  partNumber: text("part_number"),
  partName: text("part_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitCost: real("unit_cost"),
  totalCost: real("total_cost"),
  source: text("source").default("stock"), // stock, purchased, supplied_by_client
  supplier: text("supplier"),
  serialNumber: text("serial_number"),
  batchNumber: text("batch_number"),
  warrantyMonths: integer("warranty_months"),
  installLocation: text("install_location"),
  notes: text("notes"),
  addedBy: varchar("added_by").references(() => staffDirectory.id),
  addedAt: timestamp("added_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJobPartsUsedSchema = createInsertSchema(jobPartsUsed).omit({ id: true, createdAt: true, updatedAt: true, addedAt: true });
export type InsertJobPartsUsed = z.infer<typeof insertJobPartsUsedSchema>;
export type DbJobPartsUsed = typeof jobPartsUsed.$inferSelect;

// Staff Availability - Weekly availability patterns and time-off
export const staffAvailability = pgTable("staff_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  staffId: varchar("staff_id").references(() => staffDirectory.id).notNull(),
  dayOfWeek: integer("day_of_week"), // 0=Sunday, 1=Monday, etc. null = specific date
  specificDate: text("specific_date"), // for one-off availability changes
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  availabilityType: text("availability_type").default("available"), // available, unavailable, on_call, holiday
  isRecurring: boolean("is_recurring").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStaffAvailabilitySchema = createInsertSchema(staffAvailability).omit({ id: true, createdAt: true });
export type InsertStaffAvailability = z.infer<typeof insertStaffAvailabilitySchema>;
export type DbStaffAvailability = typeof staffAvailability.$inferSelect;

// Job Time Windows - Customer preferred appointment times
export const jobTimeWindows = pgTable("job_time_windows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  jobId: varchar("job_id").references(() => jobs.id).notNull(),
  preferredDate: text("preferred_date"),
  preferredTimeStart: text("preferred_time_start"),
  preferredTimeEnd: text("preferred_time_end"),
  alternateDate: text("alternate_date"),
  alternateTimeStart: text("alternate_time_start"),
  alternateTimeEnd: text("alternate_time_end"),
  customerNotes: text("customer_notes"),
  accessRestrictions: text("access_restrictions"), // e.g., "No access before 9am", "Building closed weekends"
  estimatedArrivalWindow: text("estimated_arrival_window"), // e.g., "08:00-10:00"
  confirmationStatus: text("confirmation_status").default("pending"), // pending, confirmed, rescheduled, cancelled
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJobTimeWindowSchema = createInsertSchema(jobTimeWindows).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJobTimeWindow = z.infer<typeof insertJobTimeWindowSchema>;
export type DbJobTimeWindow = typeof jobTimeWindows.$inferSelect;

// Shift Handovers - Notes passed between shifts
export const shiftHandovers = pgTable("shift_handovers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  handoverDate: text("handover_date").notNull(),
  outgoingStaffId: varchar("outgoing_staff_id").references(() => staffDirectory.id),
  incomingStaffId: varchar("incoming_staff_id").references(() => staffDirectory.id),
  pendingJobs: jsonb("pending_jobs").$type<{jobId: string; jobNumber: string; notes: string}[]>().default([]),
  completedJobs: jsonb("completed_jobs").$type<{jobId: string; jobNumber: string; notes: string}[]>().default([]),
  issuesRaised: text("issues_raised"),
  equipmentNotes: text("equipment_notes"),
  safetyAlerts: text("safety_alerts"),
  generalNotes: text("general_notes"),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedBy: varchar("acknowledged_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShiftHandoverSchema = createInsertSchema(shiftHandovers).omit({ id: true, createdAt: true });
export type InsertShiftHandover = z.infer<typeof insertShiftHandoverSchema>;
export type DbShiftHandover = typeof shiftHandovers.$inferSelect;

// Daily Briefings - Daily job briefing summaries
export const dailyBriefings = pgTable("daily_briefings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  briefingDate: text("briefing_date").notNull(),
  staffId: varchar("staff_id").references(() => staffDirectory.id),
  scheduledJobs: jsonb("scheduled_jobs").$type<{
    jobId: string;
    jobNumber: string;
    clientName: string;
    siteAddress: string;
    scheduledTime: string;
    estimatedDuration: number;
    priority: string;
    notes: string;
  }[]>().default([]),
  equipmentAssigned: jsonb("equipment_assigned").$type<{equipmentId: string; name: string; assetTag: string}[]>().default([]),
  vehicleAssigned: varchar("vehicle_assigned"),
  specialInstructions: text("special_instructions"),
  safetyReminders: text("safety_reminders"),
  viewedAt: timestamp("viewed_at"),
  printedAt: timestamp("printed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDailyBriefingSchema = createInsertSchema(dailyBriefings).omit({ id: true, createdAt: true });
export type InsertDailyBriefing = z.infer<typeof insertDailyBriefingSchema>;
export type DbDailyBriefing = typeof dailyBriefings.$inferSelect;

// Service Reminders - Annual/periodic service reminders
export const serviceReminders = pgTable("service_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id),
  contractId: varchar("contract_id").references(() => contracts.id),
  projectId: varchar("project_id").references(() => projects.id),
  assetId: varchar("asset_id").references(() => siteAssets.id),
  reminderType: text("reminder_type").notNull(), // annual_service, quarterly_check, calibration, warranty_expiry
  dueDate: text("due_date").notNull(),
  lastServiceDate: text("last_service_date"),
  frequency: text("frequency").default("annual"), // daily, weekly, monthly, quarterly, biannual, annual
  frequencyMonths: integer("frequency_months").default(12),
  reminderLeadDays: integer("reminder_lead_days").default(30), // Days before due to trigger reminder
  status: text("status").default("pending"), // pending, scheduled, completed, overdue, cancelled
  priority: text("priority").default("normal"), // low, normal, high, urgent
  scheduledJobId: varchar("scheduled_job_id").references(() => jobs.id),
  notes: text("notes"),
  autoSchedule: boolean("auto_schedule").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertServiceReminderSchema = createInsertSchema(serviceReminders).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertServiceReminder = z.infer<typeof insertServiceReminderSchema>;
export type DbServiceReminder = typeof serviceReminders.$inferSelect;

// Location Coordinates - Store lat/long for sites for map view
export const locationCoordinates = pgTable("location_coordinates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  entityType: text("entity_type").notNull(), // client, project, job
  entityId: varchar("entity_id").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  address: text("address"),
  postcode: text("postcode"),
  geocodedAt: timestamp("geocoded_at").defaultNow(),
  source: text("source").default("manual"), // manual, geocoded
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLocationCoordinateSchema = createInsertSchema(locationCoordinates).omit({ id: true, createdAt: true });
export type InsertLocationCoordinate = z.infer<typeof insertLocationCoordinateSchema>;
export type DbLocationCoordinate = typeof locationCoordinates.$inferSelect;

// Scheduling Conflicts - Track and resolve scheduling conflicts
export const schedulingConflicts = pgTable("scheduling_conflicts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  conflictType: text("conflict_type").notNull(), // staff_double_booking, equipment_overlap, vehicle_clash, skill_mismatch
  job1Id: varchar("job1_id").references(() => jobs.id),
  job2Id: varchar("job2_id").references(() => jobs.id),
  resourceType: text("resource_type"), // staff, equipment, vehicle
  resourceId: varchar("resource_id"),
  conflictDate: text("conflict_date").notNull(),
  conflictDetails: text("conflict_details"),
  severity: text("severity").default("warning"), // info, warning, error
  status: text("status").default("unresolved"), // unresolved, resolved, ignored
  resolvedBy: varchar("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSchedulingConflictSchema = createInsertSchema(schedulingConflicts).omit({ id: true, createdAt: true });
export type InsertSchedulingConflict = z.infer<typeof insertSchedulingConflictSchema>;
export type DbSchedulingConflict = typeof schedulingConflicts.$inferSelect;

// Capacity Planning - Weekly/monthly capacity snapshots
export const capacitySnapshots = pgTable("capacity_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  periodType: text("period_type").notNull(), // daily, weekly, monthly
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  totalAvailableHours: real("total_available_hours").default(0),
  scheduledHours: real("scheduled_hours").default(0),
  completedHours: real("completed_hours").default(0),
  utilizationPercent: real("utilization_percent").default(0),
  staffCount: integer("staff_count").default(0),
  jobCount: integer("job_count").default(0),
  breakdownByStaff: jsonb("breakdown_by_staff").$type<{staffId: string; name: string; available: number; scheduled: number}[]>().default([]),
  breakdownByJobType: jsonb("breakdown_by_job_type").$type<{jobType: string; hours: number; count: number}[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCapacitySnapshotSchema = createInsertSchema(capacitySnapshots).omit({ id: true, createdAt: true });
export type InsertCapacitySnapshot = z.infer<typeof insertCapacitySnapshotSchema>;
export type DbCapacitySnapshot = typeof capacitySnapshots.$inferSelect;

// ============================================
// CHECK SHEET TEMPLATES & READINGS
// ============================================

// System types for check sheets
export const CHECK_SHEET_SYSTEM_TYPES = [
  { value: "pressurisation", label: "Pressurisation System" },
  { value: "car_park", label: "Car Park Ventilation" },
  { value: "mshev", label: "MShev (Mechanical Smoke & Heat Exhaust)" },
  { value: "nshev", label: "NShev (Natural Smoke & Heat Exhaust)" },
  { value: "aov", label: "AOV (Automatic Opening Vent)" },
  { value: "stairwell_pressurisation", label: "Stairwell Pressurisation" },
  { value: "smoke_shaft", label: "Smoke Shaft" },
  { value: "corridor_extract", label: "Corridor Extract" },
  { value: "lobby_extract", label: "Lobby Extract" },
  { value: "natural_vent", label: "Natural Ventilation" },
  { value: "mixed_mode", label: "Mixed Mode System" },
  { value: "compressor", label: "Compressor System" },
  { value: "electrical_controls", label: "Electrical Control Panel" },
  { value: "fire_damper", label: "Fire Damper Inspection" },
  { value: "smoke_fire_curtain", label: "Smoke & Fire Curtain" },
] as const;

// Field types for check sheet template fields
export const CHECK_SHEET_FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Yes/No" },
  { value: "select", label: "Dropdown" },
  { value: "pass_fail", label: "Pass/Fail" },
  { value: "reading", label: "Meter Reading" },
] as const;

// Field categories for grouping
export const CHECK_SHEET_FIELD_CATEGORIES = [
  { value: "general", label: "General Information" },
  { value: "fan_readings", label: "Fan Readings" },
  { value: "door_force", label: "Door Force Measurements" },
  { value: "co_readings", label: "CO Readings" },
  { value: "battery", label: "Battery Condition" },
  { value: "voltages", label: "Voltage Readings" },
  { value: "timings", label: "Timing Tests" },
  { value: "pressure", label: "Pressure Readings" },
  { value: "airflow", label: "Airflow Measurements" },
  { value: "control_panel", label: "Control Panel" },
  { value: "dampers", label: "Damper Operation" },
  { value: "visual", label: "Visual Inspection" },
] as const;

// Check sheet template field definition
export interface CheckSheetFieldDefinition {
  id: string;
  name: string;
  fieldType: string;
  category: string;
  unit?: string;
  options?: string[];
  required: boolean;
  minValue?: number;
  maxValue?: number;
  passThreshold?: number;
  failThreshold?: number;
  description?: string;
  order: number;
}

// Check sheet templates table - defines templates for each system type
export const checkSheetTemplates = pgTable("check_sheet_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  systemType: text("system_type").notNull(),
  version: text("version").default("1.0"),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  fields: jsonb("fields").$type<CheckSheetFieldDefinition[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCheckSheetTemplateSchema = createInsertSchema(checkSheetTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCheckSheetTemplate = z.infer<typeof insertCheckSheetTemplateSchema>;
export type DbCheckSheetTemplate = typeof checkSheetTemplates.$inferSelect;

// Check sheet reading value
export interface CheckSheetReadingValue {
  fieldId: string;
  value: string | number | boolean | null;
  passFail?: "pass" | "fail" | "na";
  notes?: string;
}

// Check sheet readings table - stores actual readings
export const checkSheetReadings = pgTable("check_sheet_readings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  templateId: varchar("template_id").references(() => checkSheetTemplates.id),
  jobId: varchar("job_id").references(() => jobs.id),
  projectId: varchar("project_id").references(() => projects.id),
  building: text("building"),
  floor: text("floor"),
  location: text("location"),
  systemType: text("system_type").notNull(),
  systemId: text("system_id"),
  testerName: text("tester_name").notNull(),
  testDate: text("test_date").notNull(),
  testTime: text("test_time"),
  readings: jsonb("readings").$type<CheckSheetReadingValue[]>().default([]),
  status: text("status").default("draft"),
  overallResult: text("overall_result"),
  passCount: integer("pass_count").default(0),
  failCount: integer("fail_count").default(0),
  naCount: integer("na_count").default(0),
  notes: text("notes"),
  recommendations: text("recommendations"),
  images: jsonb("images").$type<string[]>().default([]),
  signature: text("signature"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCheckSheetReadingSchema = createInsertSchema(checkSheetReadings).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCheckSheetReading = z.infer<typeof insertCheckSheetReadingSchema>;
export type DbCheckSheetReading = typeof checkSheetReadings.$inferSelect;

// Default template field definitions for each system type
export const DEFAULT_TEMPLATE_FIELDS: Record<string, CheckSheetFieldDefinition[]> = {
  pressurisation: [
    { id: "fan_running", name: "Fan Running", fieldType: "pass_fail", category: "fan_readings", required: true, order: 1 },
    { id: "fan_speed", name: "Fan Speed", fieldType: "number", category: "fan_readings", unit: "RPM", required: true, order: 2 },
    { id: "fan_current", name: "Fan Current", fieldType: "number", category: "fan_readings", unit: "A", required: true, order: 3 },
    { id: "supply_pressure", name: "Supply Pressure", fieldType: "number", category: "pressure", unit: "Pa", required: true, passThreshold: 50, order: 4 },
    { id: "differential_pressure", name: "Differential Pressure", fieldType: "number", category: "pressure", unit: "Pa", required: true, passThreshold: 45, failThreshold: 60, order: 5 },
    { id: "door_force", name: "Door Opening Force", fieldType: "number", category: "door_force", unit: "N", required: true, failThreshold: 100, order: 6 },
    { id: "battery_condition", name: "Battery Condition", fieldType: "pass_fail", category: "battery", required: true, order: 7 },
    { id: "battery_voltage", name: "Battery Voltage", fieldType: "number", category: "voltages", unit: "V", required: true, order: 8 },
    { id: "control_panel", name: "Control Panel Status", fieldType: "pass_fail", category: "control_panel", required: true, order: 9 },
    { id: "fault_indicators", name: "Fault Indicators Clear", fieldType: "pass_fail", category: "control_panel", required: true, order: 10 },
  ],
  car_park: [
    { id: "co_level_ambient", name: "CO Level (Ambient)", fieldType: "number", category: "co_readings", unit: "ppm", required: true, failThreshold: 30, order: 1 },
    { id: "co_level_peak", name: "CO Level (Peak)", fieldType: "number", category: "co_readings", unit: "ppm", required: true, failThreshold: 100, order: 2 },
    { id: "extract_fan_running", name: "Extract Fan Running", fieldType: "pass_fail", category: "fan_readings", required: true, order: 3 },
    { id: "extract_fan_speed", name: "Extract Fan Speed", fieldType: "number", category: "fan_readings", unit: "RPM", required: true, order: 4 },
    { id: "supply_fan_running", name: "Supply Fan Running", fieldType: "pass_fail", category: "fan_readings", required: true, order: 5 },
    { id: "supply_fan_speed", name: "Supply Fan Speed", fieldType: "number", category: "fan_readings", unit: "RPM", required: true, order: 6 },
    { id: "damper_operation", name: "Damper Operation", fieldType: "pass_fail", category: "dampers", required: true, order: 7 },
    { id: "control_response", name: "Control Response Time", fieldType: "number", category: "timings", unit: "sec", required: true, order: 8 },
    { id: "emergency_mode", name: "Emergency Mode Test", fieldType: "pass_fail", category: "control_panel", required: true, order: 9 },
    { id: "jet_fans", name: "Jet Fans Operational", fieldType: "pass_fail", category: "fan_readings", required: false, order: 10 },
  ],
  mshev: [
    { id: "fan_running", name: "Extract Fan Running", fieldType: "pass_fail", category: "fan_readings", required: true, order: 1 },
    { id: "fan_speed", name: "Fan Speed", fieldType: "number", category: "fan_readings", unit: "RPM", required: true, order: 2 },
    { id: "airflow_velocity", name: "Airflow Velocity", fieldType: "number", category: "airflow", unit: "m/s", required: true, passThreshold: 1, order: 3 },
    { id: "damper_open", name: "Damper Opens on Signal", fieldType: "pass_fail", category: "dampers", required: true, order: 4 },
    { id: "damper_close", name: "Damper Closes on Signal", fieldType: "pass_fail", category: "dampers", required: true, order: 5 },
    { id: "failsafe_position", name: "Failsafe Position Correct", fieldType: "pass_fail", category: "dampers", required: true, order: 6 },
    { id: "activation_time", name: "Activation Time", fieldType: "number", category: "timings", unit: "sec", required: true, failThreshold: 60, order: 7 },
    { id: "battery_condition", name: "Battery Condition", fieldType: "pass_fail", category: "battery", required: true, order: 8 },
    { id: "control_panel", name: "Control Panel Status", fieldType: "pass_fail", category: "control_panel", required: true, order: 9 },
    { id: "bms_integration", name: "BMS Integration", fieldType: "pass_fail", category: "control_panel", required: false, order: 10 },
  ],
  aov: [
    { id: "vent_opens", name: "Vent Opens Fully", fieldType: "pass_fail", category: "dampers", required: true, order: 1 },
    { id: "vent_closes", name: "Vent Closes Fully", fieldType: "pass_fail", category: "dampers", required: true, order: 2 },
    { id: "opening_time", name: "Opening Time", fieldType: "number", category: "timings", unit: "sec", required: true, failThreshold: 60, order: 3 },
    { id: "closing_time", name: "Closing Time", fieldType: "number", category: "timings", unit: "sec", required: true, order: 4 },
    { id: "actuator_condition", name: "Actuator Condition", fieldType: "pass_fail", category: "visual", required: true, order: 5 },
    { id: "seals_condition", name: "Seals Condition", fieldType: "pass_fail", category: "visual", required: true, order: 6 },
    { id: "battery_voltage", name: "Battery Voltage", fieldType: "number", category: "voltages", unit: "V", required: true, order: 7 },
    { id: "battery_condition", name: "Battery Condition", fieldType: "pass_fail", category: "battery", required: true, order: 8 },
    { id: "control_panel", name: "Control Panel Status", fieldType: "pass_fail", category: "control_panel", required: true, order: 9 },
    { id: "fire_alarm_link", name: "Fire Alarm Link Test", fieldType: "pass_fail", category: "control_panel", required: true, order: 10 },
  ],
  stairwell_pressurisation: [
    { id: "fan_running", name: "Fan Running", fieldType: "pass_fail", category: "fan_readings", required: true, order: 1 },
    { id: "fan_speed", name: "Fan Speed", fieldType: "number", category: "fan_readings", unit: "RPM", required: true, order: 2 },
    { id: "supply_pressure", name: "Supply Pressure", fieldType: "number", category: "pressure", unit: "Pa", required: true, order: 3 },
    { id: "differential_doors_closed", name: "Differential (All Doors Closed)", fieldType: "number", category: "pressure", unit: "Pa", required: true, passThreshold: 45, failThreshold: 60, order: 4 },
    { id: "differential_door_open", name: "Differential (One Door Open)", fieldType: "number", category: "pressure", unit: "Pa", required: true, passThreshold: 10, order: 5 },
    { id: "door_force_ground", name: "Door Force (Ground)", fieldType: "number", category: "door_force", unit: "N", required: true, failThreshold: 100, order: 6 },
    { id: "door_force_upper", name: "Door Force (Upper Floors)", fieldType: "number", category: "door_force", unit: "N", required: true, failThreshold: 100, order: 7 },
    { id: "airflow_velocity", name: "Airflow Velocity", fieldType: "number", category: "airflow", unit: "m/s", required: true, passThreshold: 0.75, order: 8 },
    { id: "battery_condition", name: "Battery Condition", fieldType: "pass_fail", category: "battery", required: true, order: 9 },
    { id: "control_panel", name: "Control Panel Status", fieldType: "pass_fail", category: "control_panel", required: true, order: 10 },
  ],
  smoke_shaft: [
    { id: "fan_running", name: "Extract Fan Running", fieldType: "pass_fail", category: "fan_readings", required: true, order: 1 },
    { id: "fan_speed", name: "Fan Speed", fieldType: "number", category: "fan_readings", unit: "RPM", required: true, order: 2 },
    { id: "shaft_damper_open", name: "Shaft Damper Opens", fieldType: "pass_fail", category: "dampers", required: true, order: 3 },
    { id: "shaft_damper_close", name: "Shaft Damper Closes", fieldType: "pass_fail", category: "dampers", required: true, order: 4 },
    { id: "airflow_velocity", name: "Airflow Velocity at Damper", fieldType: "number", category: "airflow", unit: "m/s", required: true, passThreshold: 1, order: 5 },
    { id: "failsafe", name: "Failsafe Position Correct", fieldType: "pass_fail", category: "dampers", required: true, order: 6 },
    { id: "activation_time", name: "Activation Time", fieldType: "number", category: "timings", unit: "sec", required: true, failThreshold: 60, order: 7 },
    { id: "battery_condition", name: "Battery Condition", fieldType: "pass_fail", category: "battery", required: true, order: 8 },
    { id: "battery_voltage", name: "Battery Voltage", fieldType: "number", category: "voltages", unit: "V", required: true, order: 9 },
    { id: "control_panel", name: "Control Panel Status", fieldType: "pass_fail", category: "control_panel", required: true, order: 10 },
  ],
  nshev: [
    { id: "vent_free_area", name: "Vent Free Area", fieldType: "number", category: "airflow", unit: "m²", required: true, order: 1, description: "Measured geometric free area of vent" },
    { id: "vent_opens_fire", name: "Vent Opens on Fire Signal", fieldType: "pass_fail", category: "dampers", required: true, order: 2 },
    { id: "vent_opens_manual", name: "Vent Opens on Manual Trigger", fieldType: "pass_fail", category: "dampers", required: true, order: 3 },
    { id: "vent_closes", name: "Vent Closes Fully", fieldType: "pass_fail", category: "dampers", required: true, order: 4 },
    { id: "opening_time", name: "Opening Time", fieldType: "number", category: "timings", unit: "sec", required: true, failThreshold: 60, order: 5 },
    { id: "closing_time", name: "Closing Time", fieldType: "number", category: "timings", unit: "sec", required: true, order: 6 },
    { id: "actuator_type", name: "Actuator Type", fieldType: "text", category: "visual", required: true, order: 7 },
    { id: "actuator_condition", name: "Actuator Condition", fieldType: "pass_fail", category: "visual", required: true, order: 8 },
    { id: "seals_condition", name: "Weather Seals Condition", fieldType: "pass_fail", category: "visual", required: true, order: 9 },
    { id: "louvre_condition", name: "Louvre/Blade Condition", fieldType: "pass_fail", category: "visual", required: true, order: 10 },
    { id: "battery_voltage", name: "Battery Voltage", fieldType: "number", category: "voltages", unit: "V", required: true, order: 11 },
    { id: "battery_condition", name: "Battery Condition", fieldType: "pass_fail", category: "battery", required: true, order: 12 },
    { id: "control_panel", name: "Control Panel Status", fieldType: "pass_fail", category: "control_panel", required: true, order: 13 },
    { id: "fire_alarm_link", name: "Fire Alarm Interface Test", fieldType: "pass_fail", category: "control_panel", required: true, order: 14 },
    { id: "bms_integration", name: "BMS Integration Status", fieldType: "pass_fail", category: "control_panel", required: false, order: 15 },
  ],
  compressor: [
    { id: "compressor_running", name: "Compressor Running", fieldType: "pass_fail", category: "general", required: true, order: 1 },
    { id: "compressor_make", name: "Compressor Make/Model", fieldType: "text", category: "general", required: true, order: 2 },
    { id: "supply_pressure", name: "Supply Pressure", fieldType: "number", category: "pressure", unit: "bar", required: true, passThreshold: 6, order: 3 },
    { id: "max_pressure", name: "Maximum Pressure", fieldType: "number", category: "pressure", unit: "bar", required: true, failThreshold: 10, order: 4 },
    { id: "cut_in_pressure", name: "Cut-in Pressure", fieldType: "number", category: "pressure", unit: "bar", required: true, order: 5 },
    { id: "cut_out_pressure", name: "Cut-out Pressure", fieldType: "number", category: "pressure", unit: "bar", required: true, order: 6 },
    { id: "receiver_capacity", name: "Receiver Capacity", fieldType: "number", category: "general", unit: "litres", required: true, order: 7 },
    { id: "receiver_condition", name: "Receiver Tank Condition", fieldType: "pass_fail", category: "visual", required: true, order: 8 },
    { id: "moisture_trap", name: "Moisture Trap Drained", fieldType: "pass_fail", category: "visual", required: true, order: 9 },
    { id: "prv_test", name: "Pressure Relief Valve Test", fieldType: "pass_fail", category: "pressure", required: true, order: 10 },
    { id: "running_current", name: "Running Current", fieldType: "number", category: "voltages", unit: "A", required: true, order: 11 },
    { id: "oil_level", name: "Oil Level Correct", fieldType: "pass_fail", category: "visual", required: true, order: 12 },
    { id: "belt_condition", name: "Belt/Drive Condition", fieldType: "pass_fail", category: "visual", required: false, order: 13 },
    { id: "noise_vibration", name: "Noise/Vibration Normal", fieldType: "pass_fail", category: "visual", required: true, order: 14 },
    { id: "last_service", name: "Last Service Date", fieldType: "date", category: "general", required: false, order: 15 },
  ],
  electrical_controls: [
    { id: "panel_make", name: "Panel Make/Model", fieldType: "text", category: "control_panel", required: true, order: 1 },
    { id: "panel_clean", name: "Panel Interior Clean", fieldType: "pass_fail", category: "control_panel", required: true, order: 2 },
    { id: "connections_tight", name: "All Connections Tight", fieldType: "pass_fail", category: "control_panel", required: true, order: 3 },
    { id: "supply_voltage_l1", name: "Supply Voltage L1-N", fieldType: "number", category: "voltages", unit: "V", required: true, passThreshold: 220, failThreshold: 250, order: 4 },
    { id: "supply_voltage_l2", name: "Supply Voltage L2-N", fieldType: "number", category: "voltages", unit: "V", required: true, passThreshold: 220, failThreshold: 250, order: 5 },
    { id: "supply_voltage_l3", name: "Supply Voltage L3-N", fieldType: "number", category: "voltages", unit: "V", required: true, passThreshold: 220, failThreshold: 250, order: 6 },
    { id: "earth_loop", name: "Earth Loop Impedance", fieldType: "number", category: "voltages", unit: "Ω", required: true, failThreshold: 1, order: 7 },
    { id: "ir_test", name: "Insulation Resistance", fieldType: "number", category: "voltages", unit: "MΩ", required: true, passThreshold: 1, order: 8 },
    { id: "battery_charger", name: "Battery Charger Status", fieldType: "pass_fail", category: "battery", required: true, order: 9 },
    { id: "battery_voltage", name: "Battery Voltage", fieldType: "number", category: "voltages", unit: "V", required: true, order: 10 },
    { id: "battery_condition", name: "Battery Condition", fieldType: "pass_fail", category: "battery", required: true, order: 11 },
    { id: "fault_indicators", name: "Fault Indicators Clear", fieldType: "pass_fail", category: "control_panel", required: true, order: 12 },
    { id: "led_indicators", name: "LED Indicators Functional", fieldType: "pass_fail", category: "control_panel", required: true, order: 13 },
    { id: "fire_alarm_input", name: "Fire Alarm Input Test", fieldType: "pass_fail", category: "control_panel", required: true, order: 14 },
    { id: "zone_isolation", name: "Zone Isolation Test", fieldType: "pass_fail", category: "control_panel", required: false, order: 15 },
    { id: "manual_override", name: "Manual Override Function", fieldType: "pass_fail", category: "control_panel", required: true, order: 16 },
    { id: "reset_function", name: "Reset Function", fieldType: "pass_fail", category: "control_panel", required: true, order: 17 },
  ],
  fire_damper: [
    { id: "damper_location", name: "Damper Location Reference", fieldType: "text", category: "general", required: true, order: 1 },
    { id: "damper_size", name: "Damper Size", fieldType: "text", category: "general", unit: "mm", required: true, order: 2 },
    { id: "fire_rating", name: "Fire Rating", fieldType: "select", category: "general", options: ["E60", "EI60", "E90", "EI90", "E120", "EI120", "E240", "EI240"], required: true, order: 3 },
    { id: "fusible_link", name: "Fusible Link Present", fieldType: "pass_fail", category: "visual", required: true, order: 4 },
    { id: "link_rating", name: "Fusible Link Rating", fieldType: "select", category: "general", options: ["72°C", "74°C", "141°C"], required: true, order: 5 },
    { id: "blade_condition", name: "Blade Condition", fieldType: "pass_fail", category: "visual", required: true, order: 6 },
    { id: "blade_gaps", name: "Blade Gaps Within Tolerance", fieldType: "pass_fail", category: "visual", required: true, order: 7 },
    { id: "hinges_lubricated", name: "Hinges/Pivots Lubricated", fieldType: "pass_fail", category: "visual", required: true, order: 8 },
    { id: "trip_test", name: "Manual Trip Test", fieldType: "pass_fail", category: "dampers", required: true, order: 9, description: "Simulated release without full closure" },
    { id: "reset_operation", name: "Reset Operation Correct", fieldType: "pass_fail", category: "dampers", required: true, order: 10 },
    { id: "access_adequate", name: "Access for Inspection Adequate", fieldType: "pass_fail", category: "visual", required: true, order: 11 },
    { id: "intumescent_seals", name: "Intumescent Seals Intact", fieldType: "pass_fail", category: "visual", required: true, order: 12 },
    { id: "ductwork_condition", name: "Adjacent Ductwork Condition", fieldType: "pass_fail", category: "visual", required: true, order: 13 },
    { id: "fire_stopping", name: "Fire Stopping Intact", fieldType: "pass_fail", category: "visual", required: true, order: 14 },
    { id: "label_legible", name: "Label/ID Tag Legible", fieldType: "pass_fail", category: "visual", required: true, order: 15 },
  ],
  smoke_fire_curtain: [
    { id: "curtain_type", name: "Curtain Type", fieldType: "select", category: "general", options: ["Smoke Curtain", "Fire Curtain", "Combined Fire/Smoke", "Active Barrier", "Fixed Barrier"], required: true, order: 1 },
    { id: "curtain_location", name: "Curtain Location Reference", fieldType: "text", category: "general", required: true, order: 2 },
    { id: "fire_rating", name: "Fire Rating", fieldType: "select", category: "general", options: ["E30", "E60", "EI30", "EI60", "EI90", "EI120", "DH30", "DH60", "Smoke Only"], required: true, order: 3 },
    { id: "drop_height", name: "Drop Height", fieldType: "number", category: "general", unit: "mm", required: true, order: 4 },
    { id: "curtain_width", name: "Curtain Width", fieldType: "number", category: "general", unit: "mm", required: true, order: 5 },
    { id: "descends_fire_signal", name: "Descends on Fire Signal", fieldType: "pass_fail", category: "dampers", required: true, order: 6 },
    { id: "descends_power_fail", name: "Descends on Power Failure", fieldType: "pass_fail", category: "dampers", required: true, order: 7 },
    { id: "descent_time", name: "Descent Time", fieldType: "number", category: "timings", unit: "sec", required: true, order: 8 },
    { id: "descent_speed", name: "Descent Speed Within Limits", fieldType: "pass_fail", category: "timings", required: true, order: 9, description: "Max 0.15 m/s typically" },
    { id: "retracts_correctly", name: "Retracts Correctly", fieldType: "pass_fail", category: "dampers", required: true, order: 10 },
    { id: "fabric_condition", name: "Fabric Condition", fieldType: "pass_fail", category: "visual", required: true, order: 11 },
    { id: "side_guides", name: "Side Guides/Channels Aligned", fieldType: "pass_fail", category: "visual", required: true, order: 12 },
    { id: "bottom_bar", name: "Bottom Bar Condition", fieldType: "pass_fail", category: "visual", required: true, order: 13 },
    { id: "photocell_test", name: "Photocell/Safety Sensor Test", fieldType: "pass_fail", category: "control_panel", required: false, order: 14 },
    { id: "manual_release", name: "Manual Release Function", fieldType: "pass_fail", category: "control_panel", required: true, order: 15 },
    { id: "battery_backup", name: "Battery Backup Test", fieldType: "pass_fail", category: "battery", required: true, order: 16 },
    { id: "control_panel", name: "Control Panel Status", fieldType: "pass_fail", category: "control_panel", required: true, order: 17 },
    { id: "fire_alarm_link", name: "Fire Alarm Interface Test", fieldType: "pass_fail", category: "control_panel", required: true, order: 18 },
  ],
};
