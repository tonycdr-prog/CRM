import { 
  type User, type InsertUser, type UpsertUser,
  users, projects, damperTemplates, dampers, tests, stairwellTests, testPacks, complianceChecklists, testSessions, syncQueue,
  clients, contracts, jobs, quotes, invoices, expenses, timesheets, vehicles, vehicleBookings, subcontractors, documents, communicationLogs, surveys, absences, reminders
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Infer types directly from tables for DB operations
type DbProject = typeof projects.$inferSelect;
type DbDamperTemplate = typeof damperTemplates.$inferSelect;
type DbDamper = typeof dampers.$inferSelect;
type DbTest = typeof tests.$inferSelect;
type DbStairwellTest = typeof stairwellTests.$inferSelect;
type DbTestPack = typeof testPacks.$inferSelect;
type DbComplianceChecklist = typeof complianceChecklists.$inferSelect;
type DbTestSession = typeof testSessions.$inferSelect;
type DbClient = typeof clients.$inferSelect;
type DbContract = typeof contracts.$inferSelect;
type DbJob = typeof jobs.$inferSelect;
type DbQuote = typeof quotes.$inferSelect;
type DbInvoice = typeof invoices.$inferSelect;
type DbExpense = typeof expenses.$inferSelect;
type DbTimesheet = typeof timesheets.$inferSelect;
type DbVehicle = typeof vehicles.$inferSelect;
type DbVehicleBooking = typeof vehicleBookings.$inferSelect;
type DbSubcontractor = typeof subcontractors.$inferSelect;
type DbDocument = typeof documents.$inferSelect;
type DbCommunicationLog = typeof communicationLogs.$inferSelect;
type DbSurvey = typeof surveys.$inferSelect;
type DbAbsence = typeof absences.$inferSelect;
type DbReminder = typeof reminders.$inferSelect;

type NewProject = typeof projects.$inferInsert;
type NewDamperTemplate = typeof damperTemplates.$inferInsert;
type NewDamper = typeof dampers.$inferInsert;
type NewTest = typeof tests.$inferInsert;
type NewStairwellTest = typeof stairwellTests.$inferInsert;
type NewTestPack = typeof testPacks.$inferInsert;
type NewComplianceChecklist = typeof complianceChecklists.$inferInsert;
type NewTestSession = typeof testSessions.$inferInsert;
type NewClient = typeof clients.$inferInsert;
type NewContract = typeof contracts.$inferInsert;
type NewJob = typeof jobs.$inferInsert;
type NewQuote = typeof quotes.$inferInsert;
type NewInvoice = typeof invoices.$inferInsert;
type NewExpense = typeof expenses.$inferInsert;
type NewTimesheet = typeof timesheets.$inferInsert;
type NewVehicle = typeof vehicles.$inferInsert;
type NewVehicleBooking = typeof vehicleBookings.$inferInsert;
type NewSubcontractor = typeof subcontractors.$inferInsert;
type NewDocument = typeof documents.$inferInsert;
type NewCommunicationLog = typeof communicationLogs.$inferInsert;
type NewSurvey = typeof surveys.$inferInsert;
type NewAbsence = typeof absences.$inferInsert;
type NewReminder = typeof reminders.$inferInsert;

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Projects
  getProjects(userId: string): Promise<DbProject[]>;
  getProject(id: string): Promise<DbProject | undefined>;
  createProject(project: NewProject): Promise<DbProject>;
  updateProject(id: string, project: Partial<NewProject>): Promise<DbProject | undefined>;
  deleteProject(id: string): Promise<boolean>;
  
  // Damper Templates
  getDamperTemplates(userId: string): Promise<DbDamperTemplate[]>;
  createDamperTemplate(template: NewDamperTemplate): Promise<DbDamperTemplate>;
  deleteDamperTemplate(id: string): Promise<boolean>;
  
  // Dampers
  getDampers(userId: string): Promise<DbDamper[]>;
  getDamper(id: string): Promise<DbDamper | undefined>;
  createDamper(damper: NewDamper): Promise<DbDamper>;
  
  // Tests
  getTests(userId: string): Promise<DbTest[]>;
  getTest(id: string): Promise<DbTest | undefined>;
  createTest(test: NewTest): Promise<DbTest>;
  updateTest(id: string, test: Partial<NewTest>): Promise<DbTest | undefined>;
  deleteTest(id: string): Promise<boolean>;
  
  // Stairwell Tests
  getStairwellTests(userId: string): Promise<DbStairwellTest[]>;
  createStairwellTest(test: NewStairwellTest): Promise<DbStairwellTest>;
  deleteStairwellTest(id: string): Promise<boolean>;
  
  // Test Packs
  getTestPacks(userId: string): Promise<DbTestPack[]>;
  createTestPack(pack: NewTestPack): Promise<DbTestPack>;
  deleteTestPack(id: string): Promise<boolean>;
  
  // Compliance Checklists
  getComplianceChecklists(userId: string): Promise<DbComplianceChecklist[]>;
  createComplianceChecklist(checklist: NewComplianceChecklist): Promise<DbComplianceChecklist>;
  updateComplianceChecklist(id: string, checklist: Partial<NewComplianceChecklist>): Promise<DbComplianceChecklist | undefined>;
  
  // Test Sessions
  getTestSessions(userId: string): Promise<DbTestSession[]>;
  getTestSession(id: string): Promise<DbTestSession | undefined>;
  createTestSession(session: NewTestSession): Promise<DbTestSession>;
  updateTestSession(id: string, session: Partial<NewTestSession>): Promise<DbTestSession | undefined>;
  deleteTestSession(id: string): Promise<boolean>;
  
  // Sync
  syncData(userId: string, data: any): Promise<{ success: boolean; lastSync: number }>;
  getSyncStatus(userId: string): Promise<{ pendingChanges: number; lastSync: number }>;
  
  // Clients
  getClients(userId: string): Promise<DbClient[]>;
  getClient(id: string): Promise<DbClient | undefined>;
  createClient(client: NewClient): Promise<DbClient>;
  updateClient(id: string, client: Partial<NewClient>): Promise<DbClient | undefined>;
  deleteClient(id: string): Promise<boolean>;
  
  // Contracts
  getContracts(userId: string): Promise<DbContract[]>;
  getContract(id: string): Promise<DbContract | undefined>;
  createContract(contract: NewContract): Promise<DbContract>;
  updateContract(id: string, contract: Partial<NewContract>): Promise<DbContract | undefined>;
  deleteContract(id: string): Promise<boolean>;
  
  // Jobs
  getJobs(userId: string): Promise<DbJob[]>;
  getJob(id: string): Promise<DbJob | undefined>;
  createJob(job: NewJob): Promise<DbJob>;
  updateJob(id: string, job: Partial<NewJob>): Promise<DbJob | undefined>;
  deleteJob(id: string): Promise<boolean>;
  
  // Quotes
  getQuotes(userId: string): Promise<DbQuote[]>;
  getQuote(id: string): Promise<DbQuote | undefined>;
  createQuote(quote: NewQuote): Promise<DbQuote>;
  updateQuote(id: string, quote: Partial<NewQuote>): Promise<DbQuote | undefined>;
  deleteQuote(id: string): Promise<boolean>;
  
  // Invoices
  getInvoices(userId: string): Promise<DbInvoice[]>;
  getInvoice(id: string): Promise<DbInvoice | undefined>;
  createInvoice(invoice: NewInvoice): Promise<DbInvoice>;
  updateInvoice(id: string, invoice: Partial<NewInvoice>): Promise<DbInvoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;
  
  // Expenses
  getExpenses(userId: string): Promise<DbExpense[]>;
  createExpense(expense: NewExpense): Promise<DbExpense>;
  updateExpense(id: string, expense: Partial<NewExpense>): Promise<DbExpense | undefined>;
  deleteExpense(id: string): Promise<boolean>;
  
  // Timesheets
  getTimesheets(userId: string): Promise<DbTimesheet[]>;
  createTimesheet(timesheet: NewTimesheet): Promise<DbTimesheet>;
  updateTimesheet(id: string, timesheet: Partial<NewTimesheet>): Promise<DbTimesheet | undefined>;
  deleteTimesheet(id: string): Promise<boolean>;
  
  // Vehicles
  getVehicles(userId: string): Promise<DbVehicle[]>;
  createVehicle(vehicle: NewVehicle): Promise<DbVehicle>;
  updateVehicle(id: string, vehicle: Partial<NewVehicle>): Promise<DbVehicle | undefined>;
  deleteVehicle(id: string): Promise<boolean>;
  
  // Vehicle Bookings
  getVehicleBookings(userId: string): Promise<DbVehicleBooking[]>;
  createVehicleBooking(booking: NewVehicleBooking): Promise<DbVehicleBooking>;
  updateVehicleBooking(id: string, booking: Partial<NewVehicleBooking>): Promise<DbVehicleBooking | undefined>;
  deleteVehicleBooking(id: string): Promise<boolean>;
  
  // Subcontractors
  getSubcontractors(userId: string): Promise<DbSubcontractor[]>;
  createSubcontractor(subcontractor: NewSubcontractor): Promise<DbSubcontractor>;
  updateSubcontractor(id: string, subcontractor: Partial<NewSubcontractor>): Promise<DbSubcontractor | undefined>;
  deleteSubcontractor(id: string): Promise<boolean>;
  
  // Documents
  getDocuments(userId: string): Promise<DbDocument[]>;
  createDocument(document: NewDocument): Promise<DbDocument>;
  updateDocument(id: string, document: Partial<NewDocument>): Promise<DbDocument | undefined>;
  deleteDocument(id: string): Promise<boolean>;
  
  // Communication Logs
  getCommunicationLogs(userId: string): Promise<DbCommunicationLog[]>;
  createCommunicationLog(log: NewCommunicationLog): Promise<DbCommunicationLog>;
  
  // Surveys
  getSurveys(userId: string): Promise<DbSurvey[]>;
  createSurvey(survey: NewSurvey): Promise<DbSurvey>;
  updateSurvey(id: string, survey: Partial<NewSurvey>): Promise<DbSurvey | undefined>;
  
  // Absences
  getAbsences(userId: string): Promise<DbAbsence[]>;
  createAbsence(absence: NewAbsence): Promise<DbAbsence>;
  updateAbsence(id: string, absence: Partial<NewAbsence>): Promise<DbAbsence | undefined>;
  deleteAbsence(id: string): Promise<boolean>;
  
  // Reminders
  getReminders(userId: string): Promise<DbReminder[]>;
  createReminder(reminder: NewReminder): Promise<DbReminder>;
  updateReminder(id: string, reminder: Partial<NewReminder>): Promise<DbReminder | undefined>;
  deleteReminder(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Projects
  async getProjects(userId: string): Promise<DbProject[]> {
    return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<DbProject | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(project: NewProject): Promise<DbProject> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<NewProject>): Promise<DbProject | undefined> {
    const { buildings, ...rest } = project;
    const updateData: any = { ...rest, updatedAt: new Date() };
    if (buildings !== undefined) {
      updateData.buildings = buildings;
    }
    const [updated] = await db.update(projects).set(updateData).where(eq(projects.id, id)).returning();
    return updated || undefined;
  }

  async deleteProject(id: string): Promise<boolean> {
    await db.delete(projects).where(eq(projects.id, id));
    return true;
  }

  // Damper Templates
  async getDamperTemplates(userId: string): Promise<DbDamperTemplate[]> {
    return db.select().from(damperTemplates).where(eq(damperTemplates.userId, userId)).orderBy(desc(damperTemplates.createdAt));
  }

  async createDamperTemplate(template: NewDamperTemplate): Promise<DbDamperTemplate> {
    const [newTemplate] = await db.insert(damperTemplates).values(template).returning();
    return newTemplate;
  }

  async deleteDamperTemplate(id: string): Promise<boolean> {
    await db.delete(damperTemplates).where(eq(damperTemplates.id, id));
    return true;
  }

  // Dampers
  async getDampers(userId: string): Promise<DbDamper[]> {
    return db.select().from(dampers).where(eq(dampers.userId, userId)).orderBy(desc(dampers.createdAt));
  }

  async getDamper(id: string): Promise<DbDamper | undefined> {
    const [damper] = await db.select().from(dampers).where(eq(dampers.id, id));
    return damper || undefined;
  }

  async createDamper(damper: NewDamper): Promise<DbDamper> {
    const [newDamper] = await db.insert(dampers).values(damper).returning();
    return newDamper;
  }

  // Tests
  async getTests(userId: string): Promise<DbTest[]> {
    return db.select().from(tests).where(eq(tests.userId, userId)).orderBy(desc(tests.createdAt));
  }

  async getTest(id: string): Promise<DbTest | undefined> {
    const [test] = await db.select().from(tests).where(eq(tests.id, id));
    return test || undefined;
  }

  async createTest(test: NewTest): Promise<DbTest> {
    const [newTest] = await db.insert(tests).values(test).returning();
    return newTest;
  }

  async updateTest(id: string, test: Partial<NewTest>): Promise<DbTest | undefined> {
    const { readings, ...rest } = test;
    const updateData: any = { ...rest };
    if (readings !== undefined) {
      updateData.readings = readings;
    }
    const [updated] = await db.update(tests).set(updateData).where(eq(tests.id, id)).returning();
    return updated || undefined;
  }

  async deleteTest(id: string): Promise<boolean> {
    await db.delete(tests).where(eq(tests.id, id));
    return true;
  }

  // Stairwell Tests
  async getStairwellTests(userId: string): Promise<DbStairwellTest[]> {
    return db.select().from(stairwellTests).where(eq(stairwellTests.userId, userId)).orderBy(desc(stairwellTests.createdAt));
  }

  async createStairwellTest(test: NewStairwellTest): Promise<DbStairwellTest> {
    const [newTest] = await db.insert(stairwellTests).values(test).returning();
    return newTest;
  }

  async deleteStairwellTest(id: string): Promise<boolean> {
    await db.delete(stairwellTests).where(eq(stairwellTests.id, id));
    return true;
  }

  // Test Packs
  async getTestPacks(userId: string): Promise<DbTestPack[]> {
    return db.select().from(testPacks).where(eq(testPacks.userId, userId)).orderBy(desc(testPacks.createdAt));
  }

  async createTestPack(pack: NewTestPack): Promise<DbTestPack> {
    const [newPack] = await db.insert(testPacks).values(pack).returning();
    return newPack;
  }

  async deleteTestPack(id: string): Promise<boolean> {
    await db.delete(testPacks).where(eq(testPacks.id, id));
    return true;
  }

  // Compliance Checklists
  async getComplianceChecklists(userId: string): Promise<DbComplianceChecklist[]> {
    return db.select().from(complianceChecklists).where(eq(complianceChecklists.userId, userId)).orderBy(desc(complianceChecklists.createdAt));
  }

  async createComplianceChecklist(checklist: NewComplianceChecklist): Promise<DbComplianceChecklist> {
    const [newChecklist] = await db.insert(complianceChecklists).values(checklist).returning();
    return newChecklist;
  }

  async updateComplianceChecklist(id: string, checklist: Partial<NewComplianceChecklist>): Promise<DbComplianceChecklist | undefined> {
    const { checklistItems, ...rest } = checklist;
    const updateData: any = { ...rest, updatedAt: new Date() };
    if (checklistItems !== undefined) {
      updateData.checklistItems = checklistItems;
    }
    const [updated] = await db.update(complianceChecklists).set(updateData).where(eq(complianceChecklists.id, id)).returning();
    return updated || undefined;
  }

  // Test Sessions
  async getTestSessions(userId: string): Promise<DbTestSession[]> {
    return db.select().from(testSessions).where(eq(testSessions.userId, userId)).orderBy(desc(testSessions.createdAt));
  }

  async getTestSession(id: string): Promise<DbTestSession | undefined> {
    const [session] = await db.select().from(testSessions).where(eq(testSessions.id, id));
    return session || undefined;
  }

  async createTestSession(session: NewTestSession): Promise<DbTestSession> {
    const [newSession] = await db.insert(testSessions).values(session).returning();
    return newSession;
  }

  async updateTestSession(id: string, session: Partial<NewTestSession>): Promise<DbTestSession | undefined> {
    const { damperSequence, ...rest } = session;
    const updateData: any = { ...rest, updatedAt: new Date() };
    if (damperSequence !== undefined) {
      updateData.damperSequence = damperSequence;
    }
    const [updated] = await db.update(testSessions).set(updateData).where(eq(testSessions.id, id)).returning();
    return updated || undefined;
  }

  async deleteTestSession(id: string): Promise<boolean> {
    await db.delete(testSessions).where(eq(testSessions.id, id));
    return true;
  }

  // Sync
  async syncData(userId: string, data: any): Promise<{ success: boolean; lastSync: number }> {
    const now = Date.now();
    
    // Process incoming sync data - upsert logic would be more robust but simple create for MVP
    if (data.tests && Array.isArray(data.tests)) {
      for (const test of data.tests) {
        try {
          await this.createTest({ ...test, userId });
        } catch (e) {
          // Skip duplicates
        }
      }
    }
    if (data.projects && Array.isArray(data.projects)) {
      for (const project of data.projects) {
        try {
          await this.createProject({ ...project, userId });
        } catch (e) {
          // Skip duplicates
        }
      }
    }
    if (data.damperTemplates && Array.isArray(data.damperTemplates)) {
      for (const template of data.damperTemplates) {
        try {
          await this.createDamperTemplate({ ...template, userId });
        } catch (e) {
          // Skip duplicates
        }
      }
    }
    
    return { success: true, lastSync: now };
  }

  async getSyncStatus(userId: string): Promise<{ pendingChanges: number; lastSync: number }> {
    const pending = await db.select().from(syncQueue).where(
      and(eq(syncQueue.userId, userId), eq(syncQueue.synced, false))
    );
    return { 
      pendingChanges: pending.length, 
      lastSync: Date.now() 
    };
  }

  // Clients
  async getClients(userId: string): Promise<DbClient[]> {
    return db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.createdAt));
  }

  async getClient(id: string): Promise<DbClient | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(client: NewClient): Promise<DbClient> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: string, client: Partial<NewClient>): Promise<DbClient | undefined> {
    const [updated] = await db.update(clients).set({ ...client, updatedAt: new Date() }).where(eq(clients.id, id)).returning();
    return updated || undefined;
  }

  async deleteClient(id: string): Promise<boolean> {
    await db.delete(clients).where(eq(clients.id, id));
    return true;
  }

  // Contracts
  async getContracts(userId: string): Promise<DbContract[]> {
    return db.select().from(contracts).where(eq(contracts.userId, userId)).orderBy(desc(contracts.createdAt));
  }

  async getContract(id: string): Promise<DbContract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract || undefined;
  }

  async createContract(contract: NewContract): Promise<DbContract> {
    const [newContract] = await db.insert(contracts).values(contract).returning();
    return newContract;
  }

  async updateContract(id: string, contract: Partial<NewContract>): Promise<DbContract | undefined> {
    const [updated] = await db.update(contracts).set({ ...contract, updatedAt: new Date() }).where(eq(contracts.id, id)).returning();
    return updated || undefined;
  }

  async deleteContract(id: string): Promise<boolean> {
    await db.delete(contracts).where(eq(contracts.id, id));
    return true;
  }

  // Jobs
  async getJobs(userId: string): Promise<DbJob[]> {
    return db.select().from(jobs).where(eq(jobs.userId, userId)).orderBy(desc(jobs.createdAt));
  }

  async getJob(id: string): Promise<DbJob | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async createJob(job: NewJob): Promise<DbJob> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async updateJob(id: string, job: Partial<NewJob>): Promise<DbJob | undefined> {
    const [updated] = await db.update(jobs).set({ ...job, updatedAt: new Date() }).where(eq(jobs.id, id)).returning();
    return updated || undefined;
  }

  async deleteJob(id: string): Promise<boolean> {
    await db.delete(jobs).where(eq(jobs.id, id));
    return true;
  }

  // Quotes
  async getQuotes(userId: string): Promise<DbQuote[]> {
    return db.select().from(quotes).where(eq(quotes.userId, userId)).orderBy(desc(quotes.createdAt));
  }

  async getQuote(id: string): Promise<DbQuote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote || undefined;
  }

  async createQuote(quote: NewQuote): Promise<DbQuote> {
    const [newQuote] = await db.insert(quotes).values(quote).returning();
    return newQuote;
  }

  async updateQuote(id: string, quote: Partial<NewQuote>): Promise<DbQuote | undefined> {
    const [updated] = await db.update(quotes).set({ ...quote, updatedAt: new Date() }).where(eq(quotes.id, id)).returning();
    return updated || undefined;
  }

  async deleteQuote(id: string): Promise<boolean> {
    await db.delete(quotes).where(eq(quotes.id, id));
    return true;
  }

  // Invoices
  async getInvoices(userId: string): Promise<DbInvoice[]> {
    return db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<DbInvoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async createInvoice(invoice: NewInvoice): Promise<DbInvoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async updateInvoice(id: string, invoice: Partial<NewInvoice>): Promise<DbInvoice | undefined> {
    const [updated] = await db.update(invoices).set({ ...invoice, updatedAt: new Date() }).where(eq(invoices.id, id)).returning();
    return updated || undefined;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    await db.delete(invoices).where(eq(invoices.id, id));
    return true;
  }

  // Expenses
  async getExpenses(userId: string): Promise<DbExpense[]> {
    return db.select().from(expenses).where(eq(expenses.userId, userId)).orderBy(desc(expenses.createdAt));
  }

  async createExpense(expense: NewExpense): Promise<DbExpense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async updateExpense(id: string, expense: Partial<NewExpense>): Promise<DbExpense | undefined> {
    const [updated] = await db.update(expenses).set({ ...expense, updatedAt: new Date() }).where(eq(expenses.id, id)).returning();
    return updated || undefined;
  }

  async deleteExpense(id: string): Promise<boolean> {
    await db.delete(expenses).where(eq(expenses.id, id));
    return true;
  }

  // Timesheets
  async getTimesheets(userId: string): Promise<DbTimesheet[]> {
    return db.select().from(timesheets).where(eq(timesheets.userId, userId)).orderBy(desc(timesheets.createdAt));
  }

  async createTimesheet(timesheet: NewTimesheet): Promise<DbTimesheet> {
    const [newTimesheet] = await db.insert(timesheets).values(timesheet).returning();
    return newTimesheet;
  }

  async updateTimesheet(id: string, timesheet: Partial<NewTimesheet>): Promise<DbTimesheet | undefined> {
    const [updated] = await db.update(timesheets).set({ ...timesheet, updatedAt: new Date() }).where(eq(timesheets.id, id)).returning();
    return updated || undefined;
  }

  async deleteTimesheet(id: string): Promise<boolean> {
    await db.delete(timesheets).where(eq(timesheets.id, id));
    return true;
  }

  // Vehicles
  async getVehicles(userId: string): Promise<DbVehicle[]> {
    return db.select().from(vehicles).where(eq(vehicles.userId, userId)).orderBy(desc(vehicles.createdAt));
  }

  async createVehicle(vehicle: NewVehicle): Promise<DbVehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return newVehicle;
  }

  async updateVehicle(id: string, vehicle: Partial<NewVehicle>): Promise<DbVehicle | undefined> {
    const [updated] = await db.update(vehicles).set({ ...vehicle, updatedAt: new Date() }).where(eq(vehicles.id, id)).returning();
    return updated || undefined;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
    return true;
  }

  // Vehicle Bookings
  async getVehicleBookings(userId: string): Promise<DbVehicleBooking[]> {
    return db.select().from(vehicleBookings).where(eq(vehicleBookings.userId, userId)).orderBy(desc(vehicleBookings.createdAt));
  }

  async createVehicleBooking(booking: NewVehicleBooking): Promise<DbVehicleBooking> {
    const [newBooking] = await db.insert(vehicleBookings).values(booking).returning();
    return newBooking;
  }

  async updateVehicleBooking(id: string, booking: Partial<NewVehicleBooking>): Promise<DbVehicleBooking | undefined> {
    const [updated] = await db.update(vehicleBookings).set({ ...booking, updatedAt: new Date() }).where(eq(vehicleBookings.id, id)).returning();
    return updated || undefined;
  }

  async deleteVehicleBooking(id: string): Promise<boolean> {
    await db.delete(vehicleBookings).where(eq(vehicleBookings.id, id));
    return true;
  }

  // Subcontractors
  async getSubcontractors(userId: string): Promise<DbSubcontractor[]> {
    return db.select().from(subcontractors).where(eq(subcontractors.userId, userId)).orderBy(desc(subcontractors.createdAt));
  }

  async createSubcontractor(subcontractor: NewSubcontractor): Promise<DbSubcontractor> {
    const [newSubcontractor] = await db.insert(subcontractors).values(subcontractor).returning();
    return newSubcontractor;
  }

  async updateSubcontractor(id: string, subcontractor: Partial<NewSubcontractor>): Promise<DbSubcontractor | undefined> {
    const [updated] = await db.update(subcontractors).set({ ...subcontractor, updatedAt: new Date() }).where(eq(subcontractors.id, id)).returning();
    return updated || undefined;
  }

  async deleteSubcontractor(id: string): Promise<boolean> {
    await db.delete(subcontractors).where(eq(subcontractors.id, id));
    return true;
  }

  // Documents
  async getDocuments(userId: string): Promise<DbDocument[]> {
    return db.select().from(documents).where(eq(documents.userId, userId)).orderBy(desc(documents.createdAt));
  }

  async createDocument(document: NewDocument): Promise<DbDocument> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async updateDocument(id: string, document: Partial<NewDocument>): Promise<DbDocument | undefined> {
    const [updated] = await db.update(documents).set({ ...document, updatedAt: new Date() }).where(eq(documents.id, id)).returning();
    return updated || undefined;
  }

  async deleteDocument(id: string): Promise<boolean> {
    await db.delete(documents).where(eq(documents.id, id));
    return true;
  }

  // Communication Logs
  async getCommunicationLogs(userId: string): Promise<DbCommunicationLog[]> {
    return db.select().from(communicationLogs).where(eq(communicationLogs.userId, userId)).orderBy(desc(communicationLogs.createdAt));
  }

  async createCommunicationLog(log: NewCommunicationLog): Promise<DbCommunicationLog> {
    const [newLog] = await db.insert(communicationLogs).values(log).returning();
    return newLog;
  }

  // Surveys
  async getSurveys(userId: string): Promise<DbSurvey[]> {
    return db.select().from(surveys).where(eq(surveys.userId, userId)).orderBy(desc(surveys.createdAt));
  }

  async createSurvey(survey: NewSurvey): Promise<DbSurvey> {
    const [newSurvey] = await db.insert(surveys).values(survey).returning();
    return newSurvey;
  }

  async updateSurvey(id: string, survey: Partial<NewSurvey>): Promise<DbSurvey | undefined> {
    const [updated] = await db.update(surveys).set(survey).where(eq(surveys.id, id)).returning();
    return updated || undefined;
  }

  // Absences
  async getAbsences(userId: string): Promise<DbAbsence[]> {
    return db.select().from(absences).where(eq(absences.userId, userId)).orderBy(desc(absences.createdAt));
  }

  async createAbsence(absence: NewAbsence): Promise<DbAbsence> {
    const [newAbsence] = await db.insert(absences).values(absence).returning();
    return newAbsence;
  }

  async updateAbsence(id: string, absence: Partial<NewAbsence>): Promise<DbAbsence | undefined> {
    const [updated] = await db.update(absences).set({ ...absence, updatedAt: new Date() }).where(eq(absences.id, id)).returning();
    return updated || undefined;
  }

  async deleteAbsence(id: string): Promise<boolean> {
    await db.delete(absences).where(eq(absences.id, id));
    return true;
  }

  // Reminders
  async getReminders(userId: string): Promise<DbReminder[]> {
    return db.select().from(reminders).where(eq(reminders.userId, userId)).orderBy(desc(reminders.createdAt));
  }

  async createReminder(reminder: NewReminder): Promise<DbReminder> {
    const [newReminder] = await db.insert(reminders).values(reminder).returning();
    return newReminder;
  }

  async updateReminder(id: string, reminder: Partial<NewReminder>): Promise<DbReminder | undefined> {
    const [updated] = await db.update(reminders).set(reminder).where(eq(reminders.id, id)).returning();
    return updated || undefined;
  }

  async deleteReminder(id: string): Promise<boolean> {
    await db.delete(reminders).where(eq(reminders.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
