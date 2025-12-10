import { 
  type User, type InsertUser,
  users, projects, damperTemplates, dampers, tests, stairwellTests, testPacks, complianceChecklists, testSessions, syncQueue
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

type NewProject = typeof projects.$inferInsert;
type NewDamperTemplate = typeof damperTemplates.$inferInsert;
type NewDamper = typeof dampers.$inferInsert;
type NewTest = typeof tests.$inferInsert;
type NewStairwellTest = typeof stairwellTests.$inferInsert;
type NewTestPack = typeof testPacks.$inferInsert;
type NewComplianceChecklist = typeof complianceChecklists.$inferInsert;
type NewTestSession = typeof testSessions.$inferInsert;

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
}

export const storage = new DatabaseStorage();
