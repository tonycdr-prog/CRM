import type { Express } from "express";
import { Router } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { asyncHandler, AuthenticatedRequest, getUserId } from "./utils/routeHelpers";
import { hashPassword, verifyPassword } from "./auth";
import { insertCheckSheetTemplateSchema, insertCheckSheetReadingSchema, DEFAULT_TEMPLATE_FIELDS, users, jobs, formTemplates, formTemplateSystemTypes, systemTypes, inspectionInstances, formTemplateEntities, formEntities, formEntityRows, inspectionResponses, files, inspectionRowAttachments, auditEvents } from "@shared/schema";
import { logAudit } from "./lib/audit";
import multer from "multer";
import { buildInspectionPdf } from "./pdf/inspectionPdf";
import { seedDatabase } from "./seed";
import fs from "fs";
import path from "path";
import { db } from "./db";
import { eq, and, sql, isNull, desc, inArray } from "drizzle-orm";

// ============================================
// HELPER FUNCTIONS (DB-backed)
// ============================================
async function requireUserOrgId(req: any) {
  const userId = req.user?.claims?.sub;
  if (!userId) throw new Error("Missing user id");
  const u = await db
    .select({ organizationId: users.organizationId, id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u.length || !u[0].organizationId) throw new Error("Missing organization");
  return { userId, organizationId: u[0].organizationId };
}

function coerceValueToColumns(value: any) {
  const asBool = typeof value === "boolean" ? value : null;

  // numbers come from UI as number; store as string for safety (float issues)
  const asNumber =
    typeof value === "number" && Number.isFinite(value) ? String(value) : null;

  const asText =
    typeof value === "string" ? value : null;

  // if value is null/undefined, store nothing
  return {
    valueBool: asBool,
    valueNumber: asNumber,
    valueText: asText,
  };
}

async function requireJobInOrg(jobId: string, organizationId: string) {
  const job = await db
    .select({ id: jobs.id, userOrg: users.organizationId })
    .from(jobs)
    .innerJoin(users, eq(users.id, jobs.userId))
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!job.length) return { ok: false as const, status: 404 as const, message: "Job not found" };
  if (job[0].userOrg !== organizationId) {
    return { ok: false as const, status: 403 as const, message: "Forbidden" };
  }
  return { ok: true as const };
}

async function requireOrgRole(req: any, allowed: Array<"owner" | "admin" | "office_staff" | "engineer" | "viewer">) {
  const userId = req.user?.claims?.sub;
  if (!userId) return { ok: false as const, status: 401 as const, message: "Unauthorized" };

  const u = await db
    .select({
      id: users.id,
      organizationId: users.organizationId,
      organizationRole: (users as any).organizationRole,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!u.length) return { ok: false as const, status: 401 as const, message: "Unauthorized" };
  const orgId = u[0].organizationId;
  const role = u[0].organizationRole as any;

  if (!orgId) return { ok: false as const, status: 403 as const, message: "No organization" };
  if (!allowed.includes(role)) {
    return { ok: false as const, status: 403 as const, message: "Forbidden" };
  }

  return { ok: true as const, userId, organizationId: orgId, role };
}

function assertString(x: any, name: string) {
  const v = typeof x === "string" ? x.trim() : "";
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function assertFieldType(x: any) {
  const ok = x === "pass_fail" || x === "number" || x === "text" || x === "choice";
  if (!ok) throw new Error("Invalid fieldType");
  return x as "pass_fail" | "number" | "text" | "choice";
}

// ============================================
// FILE UPLOAD CONFIGURATION
// ============================================
const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      ensureDir(UPLOAD_ROOT);
      cb(null, UPLOAD_ROOT);
    },
    filename: (req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safe}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// ============================================
// FORM INSPECTION API DTOs (DB-backed)
// ============================================
type SystemTypeDTO = { id: string; name: string; code: string };
type TemplateListItemDTO = { id: string; name: string; systemTypeCodes: string[] };
type EntityRowDTO = {
  id: string;
  component: string;
  activity: string;
  reference?: string | null;
  fieldType: string;
  units?: string | null;
  choices?: string[] | null;
  evidenceRequired?: boolean;
};
type EntityDTO = { id: string; title: string; description?: string | null; rows: EntityRowDTO[] };
type FormTemplateDTO = { id: string; name: string; entities: EntityDTO[] };
type ResponseDraft = { rowId: string; value: any; comment?: string };

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================
  // AUTH SETUP (Replit Auth)
  // ============================================
  await setupAuth(app);

  // ============================================
  // SEED TEST USER (for TEST_MODE in frontend)
  // ============================================
  try {
    await storage.upsertUser({
      id: "test-user-shared",
      email: "test-shared@example.com",
      firstName: "Test",
      lastName: "User",
    });
    console.log("Test user seeded successfully");
  } catch (error) {
    console.error("Failed to seed test user:", error);
  }

  // ============================================
  // PUBLIC ROUTES (No authentication required)
  // ============================================

  // SEED DATABASE ENDPOINT (Development only)
  app.post("/api/seed", async (req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ success: false, message: "Seeding is disabled in production" });
    }
    try {
      const result = await seedDatabase();
      res.json(result);
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ success: false, message: "Failed to seed database" });
    }
  });

  // PDF DOWNLOAD ENDPOINT (Public - no auth required)
  app.get("/downloads/capabilities-pdf", (req, res) => {
    const pdfPath = path.join(process.cwd(), "APP_CAPABILITIES.pdf");
    if (fs.existsSync(pdfPath)) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=App_Capabilities_Guide.pdf");
      fs.createReadStream(pdfPath).pipe(res);
    } else {
      res.status(404).json({ error: "PDF not found" });
    }
  });

  // PROJECT ZIP DOWNLOAD ENDPOINT (Public - no auth required)
  app.get("/downloads/project-zip", (req, res) => {
    const zipPath = path.join(process.cwd(), "project-export.zip");
    if (fs.existsSync(zipPath)) {
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", "attachment; filename=life-safety-ops-project.zip");
      fs.createReadStream(zipPath).pipe(res);
    } else {
      res.status(404).json({ error: "Project ZIP not found" });
    }
  });

  // ============================================
  // AUTHENTICATED API ROUTER
  // ============================================
  const apiRouter = Router();

  // Get current authenticated user
  apiRouter.get("/auth/user", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const user = await storage.getUser(userId);
    res.json(user);
  }));

  // Get current user info for role-based UI gating
  apiRouter.get("/me", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const u = await db
      .select({
        id: users.id,
        organizationId: users.organizationId,
        organizationRole: users.organizationRole,
        role: users.role,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!u.length) return res.status(401).json({ message: "Unauthorized" });

    res.json({
      userId: u[0].id,
      organizationId: u[0].organizationId,
      organizationRole: u[0].organizationRole,
      role: u[0].role,
      email: u[0].email,
      firstName: u[0].firstName,
      lastName: u[0].lastName,
    });
  }));

  // ============================================
  // ORGANIZATION ROUTES
  // ============================================
  
  // Valid organization roles for validation
  const VALID_ORG_ROLES = ["owner", "admin", "office_staff", "engineer", "viewer"] as const;
  const ASSIGNABLE_ROLES = ["admin", "office_staff", "engineer", "viewer"] as const;
  
  // Validation schemas
  const createOrgSchema = z.object({
    name: z.string().min(1).max(255),
  });
  
  const updateOrgSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    email: z.string().email().max(255).nullable().optional(),
    phone: z.string().max(50).nullable().optional(),
    website: z.string().max(255).nullable().optional(),
    address: z.string().max(500).nullable().optional(),
  });
  
  const updateMemberRoleSchema = z.object({
    role: z.enum(ASSIGNABLE_ROLES),
  });
  
  const createInvitationSchema = z.object({
    email: z.string().email(),
    role: z.enum(ASSIGNABLE_ROLES).optional().default("engineer"),
  });
  
  const acceptInvitationSchema = z.object({
    token: z.string().min(1),
  });

  // Get current user's organization
  apiRouter.get("/organization", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const user = await storage.getUser(userId);
    if (!user?.organizationId) {
      return res.json(null);
    }
    const org = await storage.getOrganization(user.organizationId);
    res.json(org);
  }));

  // Create organization (for new users)
  apiRouter.post("/organization", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const user = await storage.getUser(userId);
    
    if (user?.organizationId) {
      return res.status(400).json({ error: "User already belongs to an organization" });
    }
    
    const parsed = createOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid organization data", details: parsed.error.issues });
    }
    
    const org = await storage.createOrganization({
      name: parsed.data.name,
      ownerId: userId,
    });
    
    await storage.updateUserOrganization(userId, org.id, "owner");
    res.json(org);
  }));

  // Update organization
  apiRouter.patch("/organization", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const user = await storage.getUser(userId);
    
    if (!user?.organizationId) {
      return res.status(404).json({ error: "No organization found" });
    }
    
    if (user.organizationRole !== "owner" && user.organizationRole !== "admin") {
      return res.status(403).json({ error: "Not authorized to update organization" });
    }
    
    const parsed = updateOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid organization data", details: parsed.error.issues });
    }
    
    const org = await storage.updateOrganization(user.organizationId, parsed.data);
    res.json(org);
  }));

  // Get organization members
  apiRouter.get("/organization/members", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const user = await storage.getUser(userId);
    
    if (!user?.organizationId) {
      return res.json([]);
    }
    
    const members = await storage.getOrganizationMembers(user.organizationId);
    res.json(members);
  }));

  // Update member role
  apiRouter.patch("/organization/members/:memberId", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const user = await storage.getUser(userId);
    
    if (!user?.organizationId) {
      return res.status(404).json({ error: "No organization found" });
    }
    
    if (user.organizationRole !== "owner" && user.organizationRole !== "admin") {
      return res.status(403).json({ error: "Not authorized to manage members" });
    }
    
    // Cannot change own role
    if (req.params.memberId === userId) {
      return res.status(400).json({ error: "Cannot change your own role" });
    }
    
    // Validate role
    const parsed = updateMemberRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid role", details: parsed.error.issues });
    }
    
    // Verify member belongs to same organization
    const targetMember = await storage.getUser(req.params.memberId);
    if (!targetMember || targetMember.organizationId !== user.organizationId) {
      return res.status(404).json({ error: "Member not found in organization" });
    }
    
    // Admins cannot change owner role
    if (targetMember.organizationRole === "owner" && user.organizationRole !== "owner") {
      return res.status(403).json({ error: "Only owner can manage owner role" });
    }
    
    const updated = await storage.updateUserOrganization(
      req.params.memberId,
      user.organizationId,
      parsed.data.role
    );
    res.json(updated);
  }));

  // Remove member from organization
  apiRouter.delete("/organization/members/:memberId", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const user = await storage.getUser(userId);
    
    if (!user?.organizationId) {
      return res.status(404).json({ error: "No organization found" });
    }
    
    if (user.organizationRole !== "owner" && user.organizationRole !== "admin") {
      return res.status(403).json({ error: "Not authorized to remove members" });
    }
    
    if (req.params.memberId === userId) {
      return res.status(400).json({ error: "Cannot remove yourself" });
    }
    
    // Verify member belongs to same organization
    const targetMember = await storage.getUser(req.params.memberId);
    if (!targetMember || targetMember.organizationId !== user.organizationId) {
      return res.status(404).json({ error: "Member not found in organization" });
    }
    
    // Cannot remove owner
    if (targetMember.organizationRole === "owner") {
      return res.status(403).json({ error: "Cannot remove the organization owner" });
    }
    
    await storage.removeUserFromOrganization(req.params.memberId);
    res.json({ success: true });
  }));

  // Get invitations
  apiRouter.get("/organization/invitations", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const user = await storage.getUser(userId);
    
    if (!user?.organizationId) {
      return res.json([]);
    }
    
    const invitations = await storage.getOrganizationInvitations(user.organizationId);
    res.json(invitations);
  }));

  // Create invitation
  apiRouter.post("/organization/invitations", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const user = await storage.getUser(userId);
    
    if (!user?.organizationId) {
      return res.status(404).json({ error: "No organization found" });
    }
    
    if (user.organizationRole !== "owner" && user.organizationRole !== "admin") {
      return res.status(403).json({ error: "Not authorized to invite members" });
    }
    
    const parsed = createInvitationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid invitation data", details: parsed.error.issues });
    }
    
    const { nanoid } = await import("nanoid");
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const invitation = await storage.createOrganizationInvitation({
      organizationId: user.organizationId,
      email: parsed.data.email,
      role: parsed.data.role,
      token,
      invitedBy: userId,
      expiresAt,
    });
    
    res.json(invitation);
  }));

  // Delete invitation
  apiRouter.delete("/organization/invitations/:id", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const user = await storage.getUser(userId);
    
    if (!user?.organizationId) {
      return res.status(404).json({ error: "No organization found" });
    }
    
    if (user.organizationRole !== "owner" && user.organizationRole !== "admin") {
      return res.status(403).json({ error: "Not authorized to manage invitations" });
    }
    
    // Verify invitation belongs to user's organization
    const invitations = await storage.getOrganizationInvitations(user.organizationId);
    const invitation = invitations.find(i => i.id === req.params.id);
    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }
    
    await storage.deleteOrganizationInvitation(req.params.id);
    res.json({ success: true });
  }));

  // Accept invitation (user must be authenticated)
  apiRouter.post("/organization/accept-invitation", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    
    const parsed = acceptInvitationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid token" });
    }
    
    // Check if user already belongs to an organization
    const user = await storage.getUser(userId);
    if (user?.organizationId) {
      return res.status(400).json({ error: "You already belong to an organization" });
    }
    
    const invitation = await storage.getInvitationByToken(parsed.data.token);
    if (!invitation) {
      return res.status(404).json({ error: "Invalid or expired invitation" });
    }
    
    if (invitation.acceptedAt) {
      return res.status(400).json({ error: "Invitation already accepted" });
    }
    
    if (new Date(invitation.expiresAt) < new Date()) {
      return res.status(400).json({ error: "Invitation has expired" });
    }
    
    await storage.acceptInvitation(parsed.data.token, userId);
    const org = await storage.getOrganization(invitation.organizationId);
    res.json({ success: true, organization: org });
  }));

  // ============================================
  // SYNC API ROUTES
  // ============================================
  
  // Get all data for a user (for initial sync)
  apiRouter.get("/sync", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const [projects, tests, dampers, templates, stairwellTests, testPacks, sessions, checklists] = await Promise.all([
      storage.getProjects(userId),
      storage.getTests(userId),
      storage.getDampers(userId),
      storage.getDamperTemplates(userId),
      storage.getStairwellTests(userId),
      storage.getTestPacks(userId),
      storage.getTestSessions(userId),
      storage.getComplianceChecklists(userId),
    ]);
    
    res.json({
      projects,
      tests,
      dampers,
      damperTemplates: templates,
      stairwellTests,
      testPacks,
      testSessions: sessions,
      complianceChecklists: checklists,
      lastSync: Date.now(),
    });
  }));

  // Sync data from client
  apiRouter.post("/sync", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const result = await storage.syncData(userId, req.body);
    res.json(result);
  }));

  // Get sync status
  apiRouter.get("/sync/status", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const status = await storage.getSyncStatus(userId);
    res.json(status);
  }));

  // ============================================
  // PROJECT ROUTES
  // ============================================
  
  apiRouter.get("/projects", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const projects = await storage.getProjects(userId);
    res.json(projects);
  }));

  apiRouter.post("/projects", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const project = await storage.createProject({ ...req.body, userId });
    res.json(project);
  }));

  apiRouter.patch("/projects/:id", asyncHandler(async (req, res) => {
    const project = await storage.updateProject(req.params.id, req.body);
    res.json(project);
  }));

  apiRouter.delete("/projects/:id", asyncHandler(async (req, res) => {
    await storage.deleteProject(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // TEST ROUTES
  // ============================================
  
  apiRouter.get("/tests", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const tests = await storage.getTests(userId);
    res.json(tests);
  }));

  apiRouter.post("/tests", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const test = await storage.createTest({ ...req.body, userId });
    res.json(test);
  }));

  apiRouter.patch("/tests/:id", asyncHandler(async (req, res) => {
    const test = await storage.updateTest(req.params.id, req.body);
    res.json(test);
  }));

  apiRouter.delete("/tests/:id", asyncHandler(async (req, res) => {
    await storage.deleteTest(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // TEST PACK ROUTES
  // ============================================
  
  apiRouter.get("/test-packs", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const packs = await storage.getTestPacks(userId);
    res.json(packs);
  }));

  apiRouter.post("/test-packs", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const pack = await storage.createTestPack({ ...req.body, userId });
    res.json(pack);
  }));

  apiRouter.delete("/test-packs/:id", asyncHandler(async (req, res) => {
    await storage.deleteTestPack(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // TEST SESSION ROUTES (Floor Sequencing)
  // ============================================
  
  apiRouter.get("/test-sessions", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const sessions = await storage.getTestSessions(userId);
    res.json(sessions);
  }));

  apiRouter.get("/test-sessions/detail/:id", asyncHandler(async (req, res) => {
    const session = await storage.getTestSession(req.params.id);
    res.json(session);
  }));

  apiRouter.post("/test-sessions", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const session = await storage.createTestSession({ ...req.body, userId });
    res.json(session);
  }));

  apiRouter.patch("/test-sessions/:id", asyncHandler(async (req, res) => {
    const session = await storage.updateTestSession(req.params.id, req.body);
    res.json(session);
  }));

  apiRouter.delete("/test-sessions/:id", asyncHandler(async (req, res) => {
    await storage.deleteTestSession(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // COMPLIANCE CHECKLIST ROUTES
  // ============================================
  
  apiRouter.get("/compliance-checklists", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const checklists = await storage.getComplianceChecklists(userId);
    res.json(checklists);
  }));

  apiRouter.post("/compliance-checklists", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const checklist = await storage.createComplianceChecklist({ ...req.body, userId });
    res.json(checklist);
  }));

  apiRouter.patch("/compliance-checklists/:id", asyncHandler(async (req, res) => {
    const checklist = await storage.updateComplianceChecklist(req.params.id, req.body);
    res.json(checklist);
  }));

  // ============================================
  // DAMPER TEMPLATE ROUTES
  // ============================================
  
  apiRouter.get("/damper-templates", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const templates = await storage.getDamperTemplates(userId);
    res.json(templates);
  }));

  apiRouter.post("/damper-templates", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const template = await storage.createDamperTemplate({ ...req.body, userId });
    res.json(template);
  }));

  apiRouter.delete("/damper-templates/:id", asyncHandler(async (req, res) => {
    await storage.deleteDamperTemplate(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // STAIRWELL TEST ROUTES
  // ============================================
  
  apiRouter.get("/stairwell-tests", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const tests = await storage.getStairwellTests(userId);
    res.json(tests);
  }));

  apiRouter.post("/stairwell-tests", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const test = await storage.createStairwellTest({ ...req.body, userId });
    res.json(test);
  }));

  apiRouter.delete("/stairwell-tests/:id", asyncHandler(async (req, res) => {
    await storage.deleteStairwellTest(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // BUSINESS MANAGEMENT - CLIENTS
  // ============================================

  apiRouter.get("/clients", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const clients = await storage.getClients(userId);
    res.json(clients);
  }));

  apiRouter.get("/clients/detail/:id", asyncHandler(async (req, res) => {
    const client = await storage.getClient(req.params.id);
    res.json(client);
  }));

  apiRouter.post("/clients", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const client = await storage.createClient({ ...req.body, userId });
    res.json(client);
  }));

  apiRouter.patch("/clients/:id", asyncHandler(async (req, res) => {
    const client = await storage.updateClient(req.params.id, req.body);
    res.json(client);
  }));

  apiRouter.delete("/clients/:id", asyncHandler(async (req, res) => {
    await storage.deleteClient(req.params.id);
    res.json({ success: true });
  }));

  // Generate portal token for client (requires authentication - on apiRouter)
  apiRouter.post("/clients/:id/portal-token", asyncHandler(async (req, res) => {
    const { nanoid } = await import("nanoid");
    const token = nanoid(32);
    const client = await storage.updateClient(req.params.id, {
      portalToken: token,
      portalEnabled: true
    });
    res.json({ token, portalLink: `/client-portal/${token}` });
  }));

  // ============================================
  // CLIENT PORTAL ROUTES (Public access via token)
  // ============================================

  // Get client data by portal token (public route)
  app.get("/api/portal/:token", async (req, res) => {
    try {
      const client = await storage.getClientByPortalToken(req.params.token);
      if (!client || !client.portalEnabled) {
        return res.status(404).json({ error: "Invalid portal access" });
      }
      res.json({
        id: client.id,
        companyName: client.companyName,
        contactName: client.contactName,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: client.city,
        postcode: client.postcode
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch client portal data" });
    }
  });

  // Get invoices for portal client
  app.get("/api/portal/:token/invoices", async (req, res) => {
    try {
      const client = await storage.getClientByPortalToken(req.params.token);
      if (!client || !client.portalEnabled) {
        return res.status(404).json({ error: "Invalid portal access" });
      }
      const invoices = await storage.getInvoicesByClient(client.id);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  // Get jobs/service history for portal client
  app.get("/api/portal/:token/jobs", async (req, res) => {
    try {
      const client = await storage.getClientByPortalToken(req.params.token);
      if (!client || !client.portalEnabled) {
        return res.status(404).json({ error: "Invalid portal access" });
      }
      const jobs = await storage.getJobsByClient(client.id);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  // Get documents for portal client
  app.get("/api/portal/:token/documents", async (req, res) => {
    try {
      const client = await storage.getClientByPortalToken(req.params.token);
      if (!client || !client.portalEnabled) {
        return res.status(404).json({ error: "Invalid portal access" });
      }
      const documents = await storage.getDocumentsByClient(client.id);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Submit service request from portal
  app.post("/api/portal/:token/service-request", async (req, res) => {
    try {
      const client = await storage.getClientByPortalToken(req.params.token);
      if (!client || !client.portalEnabled) {
        return res.status(404).json({ error: "Invalid portal access" });
      }
      // Create a job with pending status
      const job = await storage.createJob({
        userId: client.userId,
        clientId: client.id,
        jobNumber: `SR-${Date.now()}`,
        title: req.body.title || "Service Request from Portal",
        description: req.body.description,
        siteAddress: req.body.siteAddress || client.address,
        scheduledDate: req.body.preferredDate,
        status: "pending",
        priority: "normal",
        jobType: req.body.serviceType || "service"
      });
      res.json({ success: true, jobId: job.id, message: "Service request submitted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to submit service request" });
    }
  });

  // ============================================
  // BUSINESS MANAGEMENT - CUSTOMER CONTACTS
  // ============================================

  apiRouter.get("/customer-contacts/:clientId", asyncHandler(async (req, res) => {
    const contacts = await storage.getCustomerContacts(req.params.clientId);
    res.json(contacts);
  }));

  apiRouter.post("/customer-contacts", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const contact = await storage.createCustomerContact({ ...req.body, userId });
    res.json(contact);
  }));

  apiRouter.patch("/customer-contacts/:id", asyncHandler(async (req, res) => {
    const contact = await storage.updateCustomerContact(req.params.id, req.body);
    res.json(contact);
  }));

  apiRouter.delete("/customer-contacts/:id", asyncHandler(async (req, res) => {
    await storage.deleteCustomerContact(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // BUSINESS MANAGEMENT - CUSTOMER ADDRESSES
  // ============================================

  apiRouter.get("/customer-addresses/:clientId", asyncHandler(async (req, res) => {
    const addresses = await storage.getCustomerAddresses(req.params.clientId);
    res.json(addresses);
  }));

  apiRouter.post("/customer-addresses", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const address = await storage.createCustomerAddress({ ...req.body, userId });
    res.json(address);
  }));

  apiRouter.patch("/customer-addresses/:id", asyncHandler(async (req, res) => {
    const address = await storage.updateCustomerAddress(req.params.id, req.body);
    res.json(address);
  }));

  apiRouter.delete("/customer-addresses/:id", asyncHandler(async (req, res) => {
    await storage.deleteCustomerAddress(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // BUSINESS MANAGEMENT - CONTRACTS
  // ============================================

  apiRouter.get("/contracts", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const contracts = await storage.getContracts(userId);
    res.json(contracts);
  }));

  apiRouter.get("/contracts/detail/:id", asyncHandler(async (req, res) => {
    const contract = await storage.getContract(req.params.id);
    res.json(contract);
  }));

  apiRouter.post("/contracts", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const contract = await storage.createContract({ ...req.body, userId });
    res.json(contract);
  }));

  apiRouter.patch("/contracts/:id", asyncHandler(async (req, res) => {
    const contract = await storage.updateContract(req.params.id, req.body);
    res.json(contract);
  }));

  apiRouter.delete("/contracts/:id", asyncHandler(async (req, res) => {
    await storage.deleteContract(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // BUSINESS MANAGEMENT - JOBS
  // ============================================

  apiRouter.get("/jobs", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const jobs = await storage.getJobs(userId);
    res.json(jobs);
  }));

  apiRouter.get("/jobs-with-sites", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const jobs = await storage.getJobs(userId);
    const sites = await storage.getSites(userId);
    
    const siteMap = new Map(sites.map(s => [s.id, s]));
    
    const jobsWithSites = await Promise.all(jobs.map(async (job) => {
      const site = job.siteId ? siteMap.get(job.siteId) : null;
      const jobAssets = await storage.getJobSiteAssets(job.id);
      return {
        ...job,
        site: site ? {
          id: site.id,
          name: site.name,
          address: site.address,
          city: site.city,
          postcode: site.postcode,
          systemType: site.systemType,
          accessNotes: site.accessNotes,
          parkingInfo: site.parkingInfo,
          siteContactName: site.siteContactName,
          siteContactPhone: site.siteContactPhone,
        } : null,
        assetCount: jobAssets.length,
        completedAssetCount: jobAssets.filter(a => a.status === "completed").length,
      };
    }));
    
    res.json(jobsWithSites);
  }));

  apiRouter.get("/jobs/detail/:id", asyncHandler(async (req, res) => {
    const job = await storage.getJob(req.params.id);
    res.json(job);
  }));

  apiRouter.get("/jobs/detail-with-site/:id", asyncHandler(async (req, res) => {
    const job = await storage.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    const site = job.siteId ? await storage.getSite(job.siteId) : null;
    const jobAssets = await storage.getJobSiteAssetsWithDetails(job.id);
    const allSiteAssets = job.siteId ? await storage.getSiteAssetsBySite(job.siteId) : [];
    
    res.json({
      ...job,
      site: site || null,
      assignedAssets: jobAssets,
      siteAssets: allSiteAssets,
    });
  }));

  apiRouter.post("/jobs", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const job = await storage.createJob({ ...req.body, userId });
    res.json(job);
  }));

  apiRouter.patch("/jobs/:id", asyncHandler(async (req, res) => {
    const job = await storage.updateJob(req.params.id, req.body);
    res.json(job);
  }));

  apiRouter.delete("/jobs/:id", asyncHandler(async (req, res) => {
    await storage.deleteJob(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // BUSINESS MANAGEMENT - QUOTES
  // ============================================

  apiRouter.get("/quotes", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const quotes = await storage.getQuotes(userId);
    res.json(quotes);
  }));

  apiRouter.get("/quotes/detail/:id", asyncHandler(async (req, res) => {
    const quote = await storage.getQuote(req.params.id);
    res.json(quote);
  }));

  apiRouter.post("/quotes", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const quote = await storage.createQuote({ ...req.body, userId });
    res.json(quote);
  }));

  apiRouter.patch("/quotes/:id", asyncHandler(async (req, res) => {
    const quote = await storage.updateQuote(req.params.id, req.body);
    res.json(quote);
  }));

  apiRouter.delete("/quotes/:id", asyncHandler(async (req, res) => {
    await storage.deleteQuote(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // BUSINESS MANAGEMENT - INVOICES
  // ============================================

  apiRouter.get("/invoices", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const invoices = await storage.getInvoices(userId);
    res.json(invoices);
  }));

  apiRouter.get("/invoices/detail/:id", asyncHandler(async (req, res) => {
    const invoice = await storage.getInvoice(req.params.id);
    res.json(invoice);
  }));

  apiRouter.post("/invoices", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const invoice = await storage.createInvoice({ ...req.body, userId });
    res.json(invoice);
  }));

  apiRouter.patch("/invoices/:id", asyncHandler(async (req, res) => {
    const invoice = await storage.updateInvoice(req.params.id, req.body);
    res.json(invoice);
  }));

  apiRouter.delete("/invoices/:id", asyncHandler(async (req, res) => {
    await storage.deleteInvoice(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // BUSINESS MANAGEMENT - EXPENSES
  // ============================================

  apiRouter.get("/expenses", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const expenses = await storage.getExpenses(userId);
    res.json(expenses);
  }));

  apiRouter.post("/expenses", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const expense = await storage.createExpense({ ...req.body, userId });
    res.json(expense);
  }));

  apiRouter.patch("/expenses/:id", asyncHandler(async (req, res) => {
    const expense = await storage.updateExpense(req.params.id, req.body);
    res.json(expense);
  }));

  apiRouter.delete("/expenses/:id", asyncHandler(async (req, res) => {
    await storage.deleteExpense(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // BUSINESS MANAGEMENT - TIMESHEETS
  // ============================================

  apiRouter.get("/timesheets", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const timesheets = await storage.getTimesheets(userId);
    res.json(timesheets);
  }));

  apiRouter.post("/timesheets", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const timesheet = await storage.createTimesheet({ ...req.body, userId });
    res.json(timesheet);
  }));

  apiRouter.patch("/timesheets/:id", asyncHandler(async (req, res) => {
    const timesheet = await storage.updateTimesheet(req.params.id, req.body);
    res.json(timesheet);
  }));

  apiRouter.delete("/timesheets/:id", asyncHandler(async (req, res) => {
    await storage.deleteTimesheet(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // BUSINESS MANAGEMENT - VEHICLES
  // ============================================

  apiRouter.get("/vehicles", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const vehicles = await storage.getVehicles(userId);
    res.json(vehicles);
  }));

  apiRouter.post("/vehicles", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const vehicle = await storage.createVehicle({ ...req.body, userId });
    res.json(vehicle);
  }));

  apiRouter.patch("/vehicles/:id", asyncHandler(async (req, res) => {
    const vehicle = await storage.updateVehicle(req.params.id, req.body);
    res.json(vehicle);
  }));

  apiRouter.delete("/vehicles/:id", asyncHandler(async (req, res) => {
    await storage.deleteVehicle(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // BUSINESS MANAGEMENT - VEHICLE BOOKINGS
  // ============================================

  apiRouter.get("/vehicle-bookings", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const bookings = await storage.getVehicleBookings(userId);
    res.json(bookings);
  }));

  apiRouter.post("/vehicle-bookings", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const booking = await storage.createVehicleBooking({ ...req.body, userId });
    res.json(booking);
  }));

  apiRouter.patch("/vehicle-bookings/:id", asyncHandler(async (req, res) => {
    const booking = await storage.updateVehicleBooking(req.params.id, req.body);
    res.json(booking);
  }));

  apiRouter.delete("/vehicle-bookings/:id", asyncHandler(async (req, res) => {
    await storage.deleteVehicleBooking(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // BUSINESS MANAGEMENT - SUBCONTRACTORS
  // ============================================

  apiRouter.get("/subcontractors", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const subcontractors = await storage.getSubcontractors(userId);
    res.json(subcontractors);
  }));

  apiRouter.post("/subcontractors", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const subcontractor = await storage.createSubcontractor({ ...req.body, userId });
    res.json(subcontractor);
  }));

  apiRouter.patch("/subcontractors/:id", asyncHandler(async (req, res) => {
    const subcontractor = await storage.updateSubcontractor(req.params.id, req.body);
    res.json(subcontractor);
  }));

  apiRouter.delete("/subcontractors/:id", asyncHandler(async (req, res) => {
    await storage.deleteSubcontractor(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // BUSINESS MANAGEMENT - DOCUMENTS
  // ============================================

  apiRouter.get("/documents", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const documents = await storage.getDocuments(userId);
    res.json(documents);
  }));

  apiRouter.post("/documents", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const document = await storage.createDocument({ ...req.body, userId });
    res.json(document);
  }));

  apiRouter.patch("/documents/:id", asyncHandler(async (req, res) => {
    const document = await storage.updateDocument(req.params.id, req.body);
    res.json(document);
  }));

  apiRouter.delete("/documents/:id", asyncHandler(async (req, res) => {
    await storage.deleteDocument(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // BUSINESS MANAGEMENT - COMMUNICATION LOGS
  // ============================================

  apiRouter.get("/communication-logs", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const logs = await storage.getCommunicationLogs(userId);
    res.json(logs);
  }));

  apiRouter.post("/communication-logs", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const log = await storage.createCommunicationLog({ ...req.body, userId });
    res.json(log);
  }));

  // ============================================
  // BUSINESS MANAGEMENT - SURVEYS
  // ============================================

  apiRouter.get("/surveys", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const surveys = await storage.getSurveys(userId);
    res.json(surveys);
  }));

  apiRouter.post("/surveys", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const survey = await storage.createSurvey({ ...req.body, userId });
    res.json(survey);
  }));

  apiRouter.patch("/surveys/:id", asyncHandler(async (req, res) => {
    const survey = await storage.updateSurvey(req.params.id, req.body);
    res.json(survey);
  }));

  // ============================================
  // BUSINESS MANAGEMENT - ABSENCES (Holidays)
  // ============================================

  apiRouter.get("/absences", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const absences = await storage.getAbsences(userId);
    res.json(absences);
  }));

  apiRouter.post("/absences", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const absence = await storage.createAbsence({ ...req.body, userId });
    res.json(absence);
  }));

  apiRouter.patch("/absences/:id", asyncHandler(async (req, res) => {
    const absence = await storage.updateAbsence(req.params.id, req.body);
    res.json(absence);
  }));

  apiRouter.delete("/absences/:id", asyncHandler(async (req, res) => {
    await storage.deleteAbsence(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // BUSINESS MANAGEMENT - REMINDERS
  // ============================================

  apiRouter.get("/reminders", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const reminders = await storage.getReminders(userId);
    res.json(reminders);
  }));

  apiRouter.post("/reminders", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const reminder = await storage.createReminder({ ...req.body, userId });
    res.json(reminder);
  }));

  apiRouter.patch("/reminders/:id", asyncHandler(async (req, res) => {
    const reminder = await storage.updateReminder(req.params.id, req.body);
    res.json(reminder);
  }));

  apiRouter.delete("/reminders/:id", asyncHandler(async (req, res) => {
    await storage.deleteReminder(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // CUSTOM AUTH ROUTES (Optional - for username/password auth)
  // ============================================

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, displayName, companyName } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        displayName,
        companyName,
      });

      res.json({ id: user.id, username: user.username, displayName: user.displayName });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post("/api/auth/login-local", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({ id: user.id, username: user.username, displayName: user.displayName });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // ============================================
  // JOB TEMPLATES ROUTES
  // ============================================

  apiRouter.get("/job-templates", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const templates = await storage.getJobTemplates(userId);
    res.json(templates);
  }));

  apiRouter.post("/job-templates", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const template = await storage.createJobTemplate({ ...req.body, userId });
    res.json(template);
  }));

  apiRouter.delete("/job-templates/:id", asyncHandler(async (req, res) => {
    await storage.deleteJobTemplate(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // SITE ACCESS NOTES ROUTES
  // ============================================

  apiRouter.get("/site-access", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const notes = await storage.getSiteAccessNotes(userId);
    res.json(notes);
  }));

  apiRouter.post("/site-access", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const note = await storage.createSiteAccessNote({ ...req.body, userId });
    res.json(note);
  }));

  apiRouter.patch("/site-access/:id", asyncHandler(async (req, res) => {
    const note = await storage.updateSiteAccessNote(req.params.id, req.body);
    res.json(note);
  }));

  apiRouter.delete("/site-access/:id", asyncHandler(async (req, res) => {
    await storage.deleteSiteAccessNote(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // EQUIPMENT ROUTES
  // ============================================

  apiRouter.get("/equipment", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getEquipment(userId);
    res.json(items);
  }));

  apiRouter.post("/equipment", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createEquipment({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/equipment/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateEquipment(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/equipment/:id", asyncHandler(async (req, res) => {
    await storage.deleteEquipment(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // CERTIFICATIONS ROUTES
  // ============================================

  apiRouter.get("/certifications", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const certs = await storage.getCertifications(userId);
    res.json(certs);
  }));

  apiRouter.post("/certifications", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const cert = await storage.createCertification({ ...req.body, userId });
    res.json(cert);
  }));

  apiRouter.patch("/certifications/:id", asyncHandler(async (req, res) => {
    const cert = await storage.updateCertification(req.params.id, req.body);
    res.json(cert);
  }));

  apiRouter.delete("/certifications/:id", asyncHandler(async (req, res) => {
    await storage.deleteCertification(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // INCIDENTS ROUTES
  // ============================================

  apiRouter.get("/incidents", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const incidents = await storage.getIncidents(userId);
    res.json(incidents);
  }));

  apiRouter.post("/incidents", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const incident = await storage.createIncident({ ...req.body, userId });
    res.json(incident);
  }));

  apiRouter.patch("/incidents/:id", asyncHandler(async (req, res) => {
    const incident = await storage.updateIncident(req.params.id, req.body);
    res.json(incident);
  }));

  apiRouter.delete("/incidents/:id", asyncHandler(async (req, res) => {
    await storage.deleteIncident(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // AUDIT LOGS ROUTES
  // ============================================

  apiRouter.get("/audit-logs", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const logs = await storage.getAuditLogs(userId);
    res.json(logs);
  }));

  apiRouter.post("/audit-logs", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const log = await storage.createAuditLog({ ...req.body, userId });
    res.json(log);
  }));

  // ============================================
  // FORM SUBMISSIONS ROUTES (Golden Thread)
  // ============================================

  apiRouter.get("/form-submissions", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const submissions = await storage.getFormSubmissions(userId);
    res.json(submissions);
  }));

  apiRouter.get("/form-submissions/site/:siteId", asyncHandler(async (req, res) => {
    const submissions = await storage.getFormSubmissionsBySite(req.params.siteId);
    res.json(submissions);
  }));

  apiRouter.get("/form-submissions/job/:jobId", asyncHandler(async (req, res) => {
    const submissions = await storage.getFormSubmissionsByJob(req.params.jobId);
    res.json(submissions);
  }));

  apiRouter.get("/form-submission/:id", asyncHandler(async (req, res) => {
    const submission = await storage.getFormSubmission(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: "Form submission not found" });
    }
    res.json(submission);
  }));

  apiRouter.post("/form-submissions", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const submission = await storage.createFormSubmission({ ...req.body, userId });
    res.json(submission);
  }));

  apiRouter.patch("/form-submissions/:id", asyncHandler(async (req, res) => {
    const submission = await storage.updateFormSubmission(req.params.id, req.body);
    res.json(submission);
  }));

  // ============================================
  // LEADS ROUTES
  // ============================================

  apiRouter.get("/leads", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const leads = await storage.getLeads(userId);
    res.json(leads);
  }));

  apiRouter.post("/leads", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const lead = await storage.createLead({ ...req.body, userId });
    res.json(lead);
  }));

  apiRouter.patch("/leads/:id", asyncHandler(async (req, res) => {
    const lead = await storage.updateLead(req.params.id, req.body);
    res.json(lead);
  }));

  apiRouter.delete("/leads/:id", asyncHandler(async (req, res) => {
    await storage.deleteLead(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // TENDERS ROUTES
  // ============================================

  apiRouter.get("/tenders", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const tenders = await storage.getTenders(userId);
    res.json(tenders);
  }));

  apiRouter.post("/tenders", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const tender = await storage.createTender({ ...req.body, userId });
    res.json(tender);
  }));

  apiRouter.patch("/tenders/:id", asyncHandler(async (req, res) => {
    const tender = await storage.updateTender(req.params.id, req.body);
    res.json(tender);
  }));

  apiRouter.delete("/tenders/:id", asyncHandler(async (req, res) => {
    await storage.deleteTender(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // RECURRING SCHEDULES ROUTES
  // ============================================

  apiRouter.get("/recurring-schedules", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const schedules = await storage.getRecurringSchedules(userId);
    res.json(schedules);
  }));

  apiRouter.post("/recurring-schedules", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const schedule = await storage.createRecurringSchedule({ ...req.body, userId });
    res.json(schedule);
  }));

  apiRouter.patch("/recurring-schedules/:id", asyncHandler(async (req, res) => {
    const schedule = await storage.updateRecurringSchedule(req.params.id, req.body);
    res.json(schedule);
  }));

  apiRouter.delete("/recurring-schedules/:id", asyncHandler(async (req, res) => {
    await storage.deleteRecurringSchedule(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // RISK ASSESSMENTS ROUTES
  // ============================================

  apiRouter.get("/risk-assessments", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const assessments = await storage.getRiskAssessments(userId);
    res.json(assessments);
  }));

  apiRouter.post("/risk-assessments", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const assessment = await storage.createRiskAssessment({ ...req.body, userId });
    res.json(assessment);
  }));

  apiRouter.patch("/risk-assessments/:id", asyncHandler(async (req, res) => {
    const assessment = await storage.updateRiskAssessment(req.params.id, req.body);
    res.json(assessment);
  }));

  apiRouter.delete("/risk-assessments/:id", asyncHandler(async (req, res) => {
    await storage.deleteRiskAssessment(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // PERFORMANCE METRICS ROUTES
  // ============================================

  apiRouter.get("/performance-metrics", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const metrics = await storage.getPerformanceMetrics(userId);
    res.json(metrics);
  }));

  apiRouter.post("/performance-metrics", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const metric = await storage.createPerformanceMetric({ ...req.body, userId });
    res.json(metric);
  }));

  // ============================================
  // NOTIFICATIONS ROUTES
  // ============================================

  apiRouter.get("/notifications", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const notifications = await storage.getNotifications(userId);
    res.json(notifications);
  }));

  apiRouter.post("/notifications", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const notification = await storage.createNotification({ ...req.body, userId });
    res.json(notification);
  }));

  apiRouter.patch("/notifications/:id", asyncHandler(async (req, res) => {
    const notification = await storage.updateNotification(req.params.id, req.body);
    res.json(notification);
  }));

  apiRouter.delete("/notifications/:id", asyncHandler(async (req, res) => {
    await storage.deleteNotification(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // RECURRING JOBS ROUTES
  // ============================================

  apiRouter.get("/recurring-jobs", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const jobs = await storage.getRecurringJobs(userId);
    res.json(jobs);
  }));

  apiRouter.post("/recurring-jobs", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const job = await storage.createRecurringJob({ ...req.body, userId });
    res.json(job);
  }));

  apiRouter.patch("/recurring-jobs/:id", asyncHandler(async (req, res) => {
    const job = await storage.updateRecurringJob(req.params.id, req.body);
    res.json(job);
  }));

  apiRouter.delete("/recurring-jobs/:id", asyncHandler(async (req, res) => {
    await storage.deleteRecurringJob(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // JOB CHECKLISTS ROUTES
  // ============================================

  apiRouter.get("/job-checklists", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const checklists = await storage.getJobChecklists(userId);
    res.json(checklists);
  }));

  apiRouter.get("/job-checklists/job/:jobId", asyncHandler(async (req, res) => {
    const checklist = await storage.getJobChecklistByJobId(req.params.jobId);
    res.json(checklist || null);
  }));

  apiRouter.post("/job-checklists", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const checklist = await storage.createJobChecklist({ ...req.body, userId });
    res.json(checklist);
  }));

  apiRouter.patch("/job-checklists/:id", asyncHandler(async (req, res) => {
    const checklist = await storage.updateJobChecklist(req.params.id, req.body);
    res.json(checklist);
  }));

  apiRouter.delete("/job-checklists/:id", asyncHandler(async (req, res) => {
    await storage.deleteJobChecklist(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // SUPPLIERS ROUTES
  // ============================================

  apiRouter.get("/suppliers", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const suppliersList = await storage.getSuppliers(userId);
    res.json(suppliersList);
  }));

  apiRouter.post("/suppliers", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const supplier = await storage.createSupplier({ ...req.body, userId });
    res.json(supplier);
  }));

  apiRouter.patch("/suppliers/:id", asyncHandler(async (req, res) => {
    const supplier = await storage.updateSupplier(req.params.id, req.body);
    res.json(supplier);
  }));

  apiRouter.delete("/suppliers/:id", asyncHandler(async (req, res) => {
    await storage.deleteSupplier(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // PURCHASE ORDERS ROUTES
  // ============================================

  apiRouter.get("/purchase-orders", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const orders = await storage.getPurchaseOrders(userId);
    res.json(orders);
  }));

  apiRouter.post("/purchase-orders", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const order = await storage.createPurchaseOrder({ ...req.body, userId });
    res.json(order);
  }));

  apiRouter.patch("/purchase-orders/:id", asyncHandler(async (req, res) => {
    const order = await storage.updatePurchaseOrder(req.params.id, req.body);
    res.json(order);
  }));

  apiRouter.delete("/purchase-orders/:id", asyncHandler(async (req, res) => {
    await storage.deletePurchaseOrder(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // TRAINING RECORDS ROUTES
  // ============================================

  apiRouter.get("/training-records", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const records = await storage.getTrainingRecords(userId);
    res.json(records);
  }));

  apiRouter.post("/training-records", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const record = await storage.createTrainingRecord({ ...req.body, userId });
    res.json(record);
  }));

  apiRouter.patch("/training-records/:id", asyncHandler(async (req, res) => {
    const record = await storage.updateTrainingRecord(req.params.id, req.body);
    res.json(record);
  }));

  apiRouter.delete("/training-records/:id", asyncHandler(async (req, res) => {
    await storage.deleteTrainingRecord(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // INVENTORY ROUTES
  // ============================================

  apiRouter.get("/inventory", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getInventory(userId);
    res.json(items);
  }));

  apiRouter.post("/inventory", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createInventoryItem({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/inventory/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateInventoryItem(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/inventory/:id", asyncHandler(async (req, res) => {
    await storage.deleteInventoryItem(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // DEFECTS ROUTES
  // ============================================

  apiRouter.get("/defects", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const defects = await storage.getDefects(userId);
    res.json(defects);
  }));

  apiRouter.post("/defects", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const defect = await storage.createDefect({ ...req.body, userId });
    res.json(defect);
  }));

  apiRouter.patch("/defects/:id", asyncHandler(async (req, res) => {
    const defect = await storage.updateDefect(req.params.id, req.body);
    res.json(defect);
  }));

  apiRouter.delete("/defects/:id", asyncHandler(async (req, res) => {
    await storage.deleteDefect(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // DOCUMENT REGISTER ROUTES
  // ============================================

  apiRouter.get("/document-register", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const docs = await storage.getDocumentRegister(userId);
    res.json(docs);
  }));

  apiRouter.post("/document-register", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const doc = await storage.createDocumentRegisterItem({ ...req.body, userId });
    res.json(doc);
  }));

  apiRouter.patch("/document-register/:id", asyncHandler(async (req, res) => {
    const doc = await storage.updateDocumentRegisterItem(req.params.id, req.body);
    res.json(doc);
  }));

  apiRouter.delete("/document-register/:id", asyncHandler(async (req, res) => {
    await storage.deleteDocumentRegisterItem(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // MILEAGE CLAIMS ROUTES
  // ============================================

  apiRouter.get("/mileage-claims", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const claims = await storage.getMileageClaims(userId);
    res.json(claims);
  }));

  apiRouter.post("/mileage-claims", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const claim = await storage.createMileageClaim({ ...req.body, userId });
    res.json(claim);
  }));

  apiRouter.patch("/mileage-claims/:id", asyncHandler(async (req, res) => {
    const claim = await storage.updateMileageClaim(req.params.id, req.body);
    res.json(claim);
  }));

  apiRouter.delete("/mileage-claims/:id", asyncHandler(async (req, res) => {
    await storage.deleteMileageClaim(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // WORK NOTES ROUTES
  // ============================================

  apiRouter.get("/work-notes", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const notes = await storage.getWorkNotes(userId);
    res.json(notes);
  }));

  apiRouter.get("/work-notes/by-job/:jobId", asyncHandler(async (req, res) => {
    const notes = await storage.getWorkNotesByJob(req.params.jobId);
    res.json(notes);
  }));

  apiRouter.post("/work-notes", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const note = await storage.createWorkNote({ ...req.body, userId });
    res.json(note);
  }));

  apiRouter.patch("/work-notes/:id", asyncHandler(async (req, res) => {
    const note = await storage.updateWorkNote(req.params.id, req.body);
    res.json(note);
  }));

  apiRouter.delete("/work-notes/:id", asyncHandler(async (req, res) => {
    await storage.deleteWorkNote(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // CALLBACKS ROUTES
  // ============================================

  apiRouter.get("/callbacks", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const callbacks = await storage.getCallbacks(userId);
    res.json(callbacks);
  }));

  apiRouter.post("/callbacks", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const callback = await storage.createCallback({ ...req.body, userId });
    res.json(callback);
  }));

  apiRouter.patch("/callbacks/:id", asyncHandler(async (req, res) => {
    const callback = await storage.updateCallback(req.params.id, req.body);
    res.json(callback);
  }));

  apiRouter.delete("/callbacks/:id", asyncHandler(async (req, res) => {
    await storage.deleteCallback(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // STAFF DIRECTORY ROUTES
  // ============================================

  apiRouter.get("/staff-directory", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const staff = await storage.getStaffDirectory(userId);
    const staffWithNames = staff.map(member => ({
      ...member,
      name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown',
      role: member.jobTitle || member.department || 'Technician',
    }));
    res.json(staffWithNames);
  }));

  apiRouter.post("/staff-directory", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const member = await storage.createStaffMember({ ...req.body, userId });
    res.json(member);
  }));

  apiRouter.patch("/staff-directory/:id", asyncHandler(async (req, res) => {
    const member = await storage.updateStaffMember(req.params.id, req.body);
    res.json(member);
  }));

  apiRouter.delete("/staff-directory/:id", asyncHandler(async (req, res) => {
    await storage.deleteStaffMember(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // TEAM INVITATIONS ROUTES
  // ============================================

  apiRouter.get("/team-invitations", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const invitations = await storage.getTeamInvitations(userId);
    res.json(invitations);
  }));

  apiRouter.post("/team-invitations", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const { nanoid } = await import("nanoid");
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invitation = await storage.createTeamInvitation({
      ...req.body,
      userId,
      token,
      expiresAt,
    });
    res.json(invitation);
  }));

  apiRouter.post("/team-invitations/:id/resend", asyncHandler(async (req, res) => {
    const { nanoid } = await import("nanoid");
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invitation = await storage.updateTeamInvitation(req.params.id, {
      token,
      expiresAt,
      status: "pending",
    });
    res.json(invitation);
  }));

  apiRouter.delete("/team-invitations/:id", asyncHandler(async (req, res) => {
    await storage.deleteTeamInvitation(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // PRICE LISTS ROUTES
  // ============================================

  apiRouter.get("/price-lists", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getPriceLists(userId);
    res.json(items);
  }));

  apiRouter.post("/price-lists", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createPriceList({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/price-lists/:id", asyncHandler(async (req, res) => {
    const item = await storage.updatePriceList(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/price-lists/:id", asyncHandler(async (req, res) => {
    await storage.deletePriceList(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // CUSTOMER FEEDBACK ROUTES
  // ============================================

  apiRouter.get("/customer-feedback", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getCustomerFeedback(userId);
    res.json(items);
  }));

  apiRouter.post("/customer-feedback", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createCustomerFeedback({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/customer-feedback/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateCustomerFeedback(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/customer-feedback/:id", asyncHandler(async (req, res) => {
    await storage.deleteCustomerFeedback(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // SLA ROUTES
  // ============================================

  apiRouter.get("/slas", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getSLAs(userId);
    res.json(items);
  }));

  apiRouter.post("/slas", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createSLA({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/slas/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateSLA(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/slas/:id", asyncHandler(async (req, res) => {
    await storage.deleteSLA(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // PARTS CATALOG ROUTES
  // ============================================

  apiRouter.get("/parts-catalog", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getPartsCatalog(userId);
    res.json(items);
  }));

  apiRouter.post("/parts-catalog", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createPart({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/parts-catalog/:id", asyncHandler(async (req, res) => {
    const item = await storage.updatePart(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/parts-catalog/:id", asyncHandler(async (req, res) => {
    await storage.deletePart(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // PHASE 8: DOCUMENT TEMPLATES, WARRANTIES, COMPETITORS
  // ============================================

  apiRouter.get("/document-templates", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getDocumentTemplates(userId);
    res.json(items);
  }));

  apiRouter.post("/document-templates", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createDocumentTemplate({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/document-templates/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateDocumentTemplate(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/document-templates/:id", asyncHandler(async (req, res) => {
    await storage.deleteDocumentTemplate(req.params.id);
    res.json({ success: true });
  }));

  // Warranties routes
  apiRouter.get("/warranties", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getWarranties(userId);
    res.json(items);
  }));

  apiRouter.post("/warranties", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createWarranty({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/warranties/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateWarranty(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/warranties/:id", asyncHandler(async (req, res) => {
    await storage.deleteWarranty(req.params.id);
    res.json({ success: true });
  }));

  // Competitors routes
  apiRouter.get("/competitors", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getCompetitors(userId);
    res.json(items);
  }));

  apiRouter.post("/competitors", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createCompetitor({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/competitors/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateCompetitor(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/competitors/:id", asyncHandler(async (req, res) => {
    await storage.deleteCompetitor(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // PHASE 9: SERVICE HISTORY, QUALITY CHECKLISTS, TIME OFF REQUESTS
  // ============================================

  apiRouter.get("/service-history", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getServiceHistory(userId);
    res.json(items);
  }));

  apiRouter.post("/service-history", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createServiceHistory({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/service-history/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateServiceHistory(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/service-history/:id", asyncHandler(async (req, res) => {
    await storage.deleteServiceHistory(req.params.id);
    res.json({ success: true });
  }));

  // Quality Checklists routes (different from compliance-checklists)
  apiRouter.get("/quality-checklists", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getQualityChecklists(userId);
    res.json(items);
  }));

  apiRouter.post("/quality-checklists", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createQualityChecklist({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/quality-checklists/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateQualityChecklist(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/quality-checklists/:id", asyncHandler(async (req, res) => {
    await storage.deleteQualityChecklist(req.params.id);
    res.json({ success: true });
  }));

  // Time Off Requests routes
  apiRouter.get("/time-off-requests", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getTimeOffRequests(userId);
    res.json(items);
  }));

  apiRouter.post("/time-off-requests", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createTimeOffRequest({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/time-off-requests/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateTimeOffRequest(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/time-off-requests/:id", asyncHandler(async (req, res) => {
    await storage.deleteTimeOffRequest(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // PHASE 10: VISIT TYPES & SERVICE TEMPLATES
  // ============================================

  apiRouter.get("/visit-types", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getVisitTypes(userId);
    res.json(items);
  }));

  apiRouter.post("/visit-types", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createVisitType({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/visit-types/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateVisitType(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/visit-types/:id", asyncHandler(async (req, res) => {
    await storage.deleteVisitType(req.params.id);
    res.json({ success: true });
  }));

  // Service Templates routes
  apiRouter.get("/service-templates", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getServiceTemplates(userId);
    res.json(items);
  }));

  apiRouter.get("/service-templates/by-visit-type/:visitTypeId", asyncHandler(async (req, res) => {
    const items = await storage.getServiceTemplatesByVisitType(req.params.visitTypeId);
    res.json(items);
  }));

  apiRouter.post("/service-templates", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createServiceTemplate({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/service-templates/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateServiceTemplate(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/service-templates/:id", asyncHandler(async (req, res) => {
    await storage.deleteServiceTemplate(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // PHASE 10: SITE ASSETS & BULK ADD
  // ============================================

  apiRouter.get("/site-assets", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getSiteAssets(userId);
    res.json(items);
  }));

  apiRouter.get("/site-assets/by-project/:projectId", asyncHandler(async (req, res) => {
    const items = await storage.getSiteAssetsByProject(req.params.projectId);
    res.json(items);
  }));

  apiRouter.post("/site-assets", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createSiteAsset({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.post("/site-assets/bulk", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const assetsWithUserId = req.body.assets.map((asset: any) => ({ ...asset, userId }));
    const items = await storage.createSiteAssetsBulk(assetsWithUserId);
    res.json(items);
  }));

  apiRouter.patch("/site-assets/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateSiteAsset(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/site-assets/:id", asyncHandler(async (req, res) => {
    await storage.deleteSiteAsset(req.params.id);
    res.json({ success: true });
  }));

  apiRouter.get("/site-assets/by-site/:siteId", asyncHandler(async (req, res) => {
    const items = await storage.getSiteAssetsBySite(req.params.siteId);
    res.json(items);
  }));

  apiRouter.get("/site-assets/by-client/:clientId", asyncHandler(async (req, res) => {
    const items = await storage.getSiteAssetsByClient(req.params.clientId);
    res.json(items);
  }));

  // ============================================
  // SITES (BUILDINGS) ROUTES
  // ============================================

  apiRouter.get("/sites", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getSites(userId);
    res.json(items);
  }));

  apiRouter.get("/sites/by-client/:clientId", asyncHandler(async (req, res) => {
    const items = await storage.getSitesByClient(req.params.clientId);
    res.json(items);
  }));

  apiRouter.get("/sites/detail/:id", asyncHandler(async (req, res) => {
    const site = await storage.getSite(req.params.id);
    if (!site) {
      return res.status(404).json({ error: "Site not found" });
    }
    res.json(site);
  }));

  apiRouter.post("/sites", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const site = await storage.createSite({ ...req.body, userId });
    res.json(site);
  }));

  apiRouter.patch("/sites/:id", asyncHandler(async (req, res) => {
    const site = await storage.updateSite(req.params.id, req.body);
    res.json(site);
  }));

  apiRouter.delete("/sites/:id", asyncHandler(async (req, res) => {
    await storage.deleteSite(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // JOB SITE ASSETS ROUTES
  // ============================================

  apiRouter.get("/job-site-assets/:jobId", asyncHandler(async (req, res) => {
    const items = await storage.getJobSiteAssets(req.params.jobId);
    res.json(items);
  }));

  apiRouter.get("/job-site-assets/with-details/:jobId", asyncHandler(async (req, res) => {
    const items = await storage.getJobSiteAssetsWithDetails(req.params.jobId);
    res.json(items);
  }));

  apiRouter.post("/job-site-assets", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createJobSiteAsset({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.post("/job-site-assets/bulk", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const assignments = req.body.assignments.map((a: any) => ({ ...a, userId }));
    const items = await storage.createJobSiteAssetsBulk(assignments);
    res.json(items);
  }));

  apiRouter.patch("/job-site-assets/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateJobSiteAsset(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/job-site-assets/:id", asyncHandler(async (req, res) => {
    await storage.deleteJobSiteAsset(req.params.id);
    res.json({ success: true });
  }));

  // Asset Batches routes
  apiRouter.get("/asset-batches", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getAssetBatches(userId);
    res.json(items);
  }));

  apiRouter.post("/asset-batches", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createAssetBatch({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/asset-batches/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateAssetBatch(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/asset-batches/:id", asyncHandler(async (req, res) => {
    await storage.deleteAssetBatch(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // PHASE 11: SCHEDULING ENHANCEMENTS
  // ============================================

  // Job Assignments routes
  apiRouter.get("/job-assignments", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getJobAssignments(userId);
    res.json(items);
  }));

  apiRouter.get("/job-assignments/by-job/:jobId", asyncHandler(async (req, res) => {
    const items = await storage.getJobAssignmentsByJob(req.params.jobId);
    res.json(items);
  }));

  apiRouter.post("/job-assignments", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createJobAssignment({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/job-assignments/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateJobAssignment(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/job-assignments/:id", asyncHandler(async (req, res) => {
    await storage.deleteJobAssignment(req.params.id);
    res.json({ success: true });
  }));

  // Job Skill Requirements routes
  apiRouter.get("/job-skill-requirements", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getJobSkillRequirements(userId);
    res.json(items);
  }));

  apiRouter.get("/job-skill-requirements/by-job/:jobId", asyncHandler(async (req, res) => {
    const items = await storage.getJobSkillRequirementsByJob(req.params.jobId);
    res.json(items);
  }));

  apiRouter.post("/job-skill-requirements", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createJobSkillRequirement({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/job-skill-requirements/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateJobSkillRequirement(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/job-skill-requirements/:id", asyncHandler(async (req, res) => {
    await storage.deleteJobSkillRequirement(req.params.id);
    res.json({ success: true });
  }));

  // Job Equipment Reservations routes
  apiRouter.get("/job-equipment-reservations", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getJobEquipmentReservations(userId);
    res.json(items);
  }));

  apiRouter.get("/job-equipment-reservations/by-job/:jobId", asyncHandler(async (req, res) => {
    const items = await storage.getJobEquipmentReservationsByJob(req.params.jobId);
    res.json(items);
  }));

  apiRouter.post("/job-equipment-reservations", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createJobEquipmentReservation({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/job-equipment-reservations/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateJobEquipmentReservation(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/job-equipment-reservations/:id", asyncHandler(async (req, res) => {
    await storage.deleteJobEquipmentReservation(req.params.id);
    res.json({ success: true });
  }));

  // Job Parts Used routes
  apiRouter.get("/job-parts-used", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getJobPartsUsed(userId);
    res.json(items);
  }));

  apiRouter.get("/job-parts-used/by-job/:jobId", asyncHandler(async (req, res) => {
    const items = await storage.getJobPartsUsedByJob(req.params.jobId);
    res.json(items);
  }));

  apiRouter.post("/job-parts-used", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createJobPartsUsed({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/job-parts-used/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateJobPartsUsed(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/job-parts-used/:id", asyncHandler(async (req, res) => {
    await storage.deleteJobPartsUsed(req.params.id);
    res.json({ success: true });
  }));

  // Staff Availability routes
  apiRouter.get("/staff-availability", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getStaffAvailability(userId);
    res.json(items);
  }));

  apiRouter.get("/staff-availability/by-staff/:staffId", asyncHandler(async (req, res) => {
    const items = await storage.getStaffAvailabilityByStaff(req.params.staffId);
    res.json(items);
  }));

  apiRouter.post("/staff-availability", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createStaffAvailability({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/staff-availability/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateStaffAvailability(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/staff-availability/:id", asyncHandler(async (req, res) => {
    await storage.deleteStaffAvailability(req.params.id);
    res.json({ success: true });
  }));

  // Job Time Windows routes
  apiRouter.get("/job-time-windows", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getJobTimeWindows(userId);
    res.json(items);
  }));

  apiRouter.get("/job-time-windows/by-job/:jobId", asyncHandler(async (req, res) => {
    const items = await storage.getJobTimeWindowsByJob(req.params.jobId);
    res.json(items);
  }));

  apiRouter.post("/job-time-windows", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createJobTimeWindow({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/job-time-windows/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateJobTimeWindow(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/job-time-windows/:id", asyncHandler(async (req, res) => {
    await storage.deleteJobTimeWindow(req.params.id);
    res.json({ success: true });
  }));

  // Shift Handovers routes
  apiRouter.get("/shift-handovers", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getShiftHandovers(userId);
    res.json(items);
  }));

  apiRouter.post("/shift-handovers", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createShiftHandover({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/shift-handovers/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateShiftHandover(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/shift-handovers/:id", asyncHandler(async (req, res) => {
    await storage.deleteShiftHandover(req.params.id);
    res.json({ success: true });
  }));

  // Daily Briefings routes
  apiRouter.get("/daily-briefings", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getDailyBriefings(userId);
    res.json(items);
  }));

  apiRouter.post("/daily-briefings", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createDailyBriefing({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/daily-briefings/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateDailyBriefing(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/daily-briefings/:id", asyncHandler(async (req, res) => {
    await storage.deleteDailyBriefing(req.params.id);
    res.json({ success: true });
  }));

  // Service Reminders routes
  apiRouter.get("/service-reminders", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getServiceReminders(userId);
    res.json(items);
  }));

  apiRouter.post("/service-reminders", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createServiceReminder({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/service-reminders/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateServiceReminder(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/service-reminders/:id", asyncHandler(async (req, res) => {
    await storage.deleteServiceReminder(req.params.id);
    res.json({ success: true });
  }));

  // Location Coordinates routes
  apiRouter.get("/location-coordinates", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getLocationCoordinates(userId);
    res.json(items);
  }));

  apiRouter.post("/location-coordinates", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createLocationCoordinate({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/location-coordinates/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateLocationCoordinate(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/location-coordinates/:id", asyncHandler(async (req, res) => {
    await storage.deleteLocationCoordinate(req.params.id);
    res.json({ success: true });
  }));

  // Scheduling Conflicts routes
  apiRouter.get("/scheduling-conflicts", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getSchedulingConflicts(userId);
    res.json(items);
  }));

  apiRouter.post("/scheduling-conflicts", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createSchedulingConflict({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.patch("/scheduling-conflicts/:id", asyncHandler(async (req, res) => {
    const item = await storage.updateSchedulingConflict(req.params.id, req.body);
    res.json(item);
  }));

  apiRouter.delete("/scheduling-conflicts/:id", asyncHandler(async (req, res) => {
    await storage.deleteSchedulingConflict(req.params.id);
    res.json({ success: true });
  }));

  // Capacity Snapshots routes
  apiRouter.get("/capacity-snapshots", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const items = await storage.getCapacitySnapshots(userId);
    res.json(items);
  }));

  apiRouter.post("/capacity-snapshots", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const item = await storage.createCapacitySnapshot({ ...req.body, userId });
    res.json(item);
  }));

  apiRouter.delete("/capacity-snapshots/:id", asyncHandler(async (req, res) => {
    await storage.deleteCapacitySnapshot(req.params.id);
    res.json({ success: true });
  }));

  // Haversine formula for calculating distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  // Estimate travel time in minutes (average speed 30 mph / 48 km/h for urban driving)
  const estimateTravelTime = (distanceKm: number): number => {
    const averageSpeedKmh = 48;
    return Math.ceil((distanceKm / averageSpeedKmh) * 60);
  };

  // Travel time estimation endpoint
  apiRouter.get("/travel-time", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const { from, to } = req.query;
    
    if (!from || !to) {
      res.status(400).json({ error: "Both 'from' and 'to' job IDs are required" });
      return;
    }

    const coordinates = await storage.getLocationCoordinates(userId);
    const fromCoord = coordinates.find(c => c.entityType === "job" && c.entityId === from);
    const toCoord = coordinates.find(c => c.entityType === "job" && c.entityId === to);

    if (!fromCoord || !toCoord) {
      res.json({ 
        available: false, 
        message: "Coordinates not available for one or both jobs" 
      });
      return;
    }

    const distance = calculateDistance(
      fromCoord.latitude, fromCoord.longitude,
      toCoord.latitude, toCoord.longitude
    );
    const travelTimeMinutes = estimateTravelTime(distance);

    res.json({
      available: true,
      fromJobId: from,
      toJobId: to,
      distanceKm: Math.round(distance * 10) / 10,
      distanceMiles: Math.round(distance * 0.621371 * 10) / 10,
      travelTimeMinutes,
      travelTimeFormatted: travelTimeMinutes < 60 
        ? `${travelTimeMinutes} mins`
        : `${Math.floor(travelTimeMinutes / 60)}h ${travelTimeMinutes % 60}m`
    });
  }));

  // Conflict detection endpoint - analyzes all jobs and detects scheduling conflicts
  apiRouter.get("/detect-conflicts", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const jobs = await storage.getJobs(userId);
    const assignments = await storage.getJobAssignments(userId);
    const coordinates = await storage.getLocationCoordinates(userId);
    
    interface Conflict {
      type: string;
      severity: "warning" | "error" | "info";
      job1Id: string;
      job2Id: string;
      job1Title: string;
      job2Title: string;
      staffId?: string;
      staffName?: string;
      conflictDate: string;
      details: string;
      travelTimeMinutes?: number;
      gapMinutes?: number;
    }

    const conflicts: Conflict[] = [];
    const staffMembers = await storage.getStaffDirectory(userId);

    // Filter scheduled jobs with dates
    const scheduledJobs = jobs.filter(j => 
      j.scheduledDate && j.status !== "cancelled" && j.status !== "completed"
    );

    // Group jobs by staff member and date
    const jobsByStaffAndDate: Record<string, typeof scheduledJobs> = {};

    for (const job of scheduledJobs) {
      // Get staff from assignments or assignedTechnicianId
      const jobAssignments = assignments.filter(a => a.jobId === job.id);
      const staffIds = jobAssignments.map(a => a.staffId).filter(Boolean) as string[];
      
      if (job.assignedTechnicianId) {
        staffIds.push(job.assignedTechnicianId);
      }

      for (const staffId of Array.from(new Set(staffIds))) {
        const key = `${staffId}_${job.scheduledDate}`;
        if (!jobsByStaffAndDate[key]) {
          jobsByStaffAndDate[key] = [];
        }
        jobsByStaffAndDate[key].push(job);
      }
    }

    // Check for conflicts within each staff/date group
    for (const [key, dayJobs] of Object.entries(jobsByStaffAndDate)) {
      if (dayJobs.length < 2) continue;

      const [staffId, date] = key.split("_");
      const staff = staffMembers.find(s => s.id === staffId);

      // Sort jobs by scheduled time
      const sortedJobs = dayJobs.sort((a, b) => {
        const timeA = a.scheduledTime || "00:00";
        const timeB = b.scheduledTime || "00:00";
        return timeA.localeCompare(timeB);
      });

      // Check consecutive job pairs for conflicts
      for (let i = 0; i < sortedJobs.length - 1; i++) {
        const job1 = sortedJobs[i];
        const job2 = sortedJobs[i + 1];

        const time1 = job1.scheduledTime || "08:00";
        const time2 = job2.scheduledTime || "08:00";
        const duration1 = job1.estimatedDuration || 2; // Default 2 hours

        // Calculate job1 end time
        const [h1, m1] = time1.split(":").map(Number);
        const endMinutes1 = h1 * 60 + m1 + duration1 * 60;

        // Calculate job2 start time in minutes
        const [h2, m2] = time2.split(":").map(Number);
        const startMinutes2 = h2 * 60 + m2;

        // Gap between jobs
        const gapMinutes = startMinutes2 - endMinutes1;

        // Calculate travel time if coordinates available
        let travelTimeMinutes = 0;
        const coord1 = coordinates.find(c => c.entityType === "job" && c.entityId === job1.id);
        const coord2 = coordinates.find(c => c.entityType === "job" && c.entityId === job2.id);

        if (coord1 && coord2) {
          const distance = calculateDistance(
            coord1.latitude, coord1.longitude,
            coord2.latitude, coord2.longitude
          );
          travelTimeMinutes = estimateTravelTime(distance);
        }

        // Check for overlapping jobs (job2 starts before job1 ends)
        if (gapMinutes < 0) {
          conflicts.push({
            type: "staff_double_booking",
            severity: "error",
            job1Id: job1.id,
            job2Id: job2.id,
            job1Title: job1.title,
            job2Title: job2.title,
            staffId,
            staffName: staff ? `${staff.firstName} ${staff.lastName}` : "Unknown",
            conflictDate: date,
            details: `Jobs overlap by ${Math.abs(gapMinutes)} minutes`,
            gapMinutes
          });
        }
        // Check for insufficient travel time (gap less than travel time)
        else if (travelTimeMinutes > 0 && gapMinutes < travelTimeMinutes) {
          conflicts.push({
            type: "insufficient_travel_time",
            severity: "warning",
            job1Id: job1.id,
            job2Id: job2.id,
            job1Title: job1.title,
            job2Title: job2.title,
            staffId,
            staffName: staff ? `${staff.firstName} ${staff.lastName}` : "Unknown",
            conflictDate: date,
            details: `Gap of ${gapMinutes} mins is less than ${travelTimeMinutes} mins travel time`,
            travelTimeMinutes,
            gapMinutes
          });
        }
        // Tight schedule warning (less than 15 mins buffer after travel)
        else if (travelTimeMinutes > 0 && gapMinutes < travelTimeMinutes + 15) {
          conflicts.push({
            type: "tight_schedule",
            severity: "info",
            job1Id: job1.id,
            job2Id: job2.id,
            job1Title: job1.title,
            job2Title: job2.title,
            staffId,
            staffName: staff ? `${staff.firstName} ${staff.lastName}` : "Unknown",
            conflictDate: date,
            details: `Only ${gapMinutes - travelTimeMinutes} mins buffer after ${travelTimeMinutes} mins travel`,
            travelTimeMinutes,
            gapMinutes
          });
        }
      }
    }

    res.json({
      conflicts,
      totalConflicts: conflicts.length,
      errorCount: conflicts.filter(c => c.severity === "error").length,
      warningCount: conflicts.filter(c => c.severity === "warning").length,
      infoCount: conflicts.filter(c => c.severity === "info").length
    });
  }));

  // ============================================
  // NEXT AVAILABLE SLOT FINDER
  // ============================================
  
  // Find next available time slots for scheduling a job
  apiRouter.post("/find-available-slot", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const { 
      durationHours = 2, 
      preferredStaffId, 
      startDate, 
      endDate, 
      maxResults = 10 
    } = req.body;

    const jobs = await storage.getJobs(userId);
    const assignments = await storage.getJobAssignments(userId);
    const staffMembers = await storage.getStaffDirectory(userId);

    // Guard against null/empty staff directory
    if (!staffMembers || staffMembers.length === 0) {
      res.json({ slots: [], message: "No staff members found. Please add staff first." });
      return;
    }

    // Filter active staff
    const activeStaff = preferredStaffId 
      ? staffMembers.filter(s => s.id === preferredStaffId && s.status !== "inactive")
      : staffMembers.filter(s => s.status !== "inactive");

    if (activeStaff.length === 0) {
      res.json({ slots: [], message: "No active staff available" });
      return;
    }

    // Parse date range
    const rangeStart = startDate ? new Date(startDate) : new Date();
    const rangeEnd = endDate ? new Date(endDate) : new Date(rangeStart.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Working hours: 8 AM to 5 PM
    const WORK_START = 8;
    const WORK_END = 17;
    const SLOT_INCREMENT = 30; // Check every 30 minutes

    interface AvailableSlot {
      date: string;
      startTime: string;
      endTime: string;
      staffId: string;
      staffName: string;
      durationHours: number;
    }

    const availableSlots: AvailableSlot[] = [];

    // Helper to get jobs for a staff member on a specific date
    const getStaffJobsOnDate = (staffId: string, date: string) => {
      const staffJobIds = assignments
        .filter(a => a.staffId === staffId)
        .map(a => a.jobId);
      
      return jobs.filter(job => {
        if (job.scheduledDate !== date) return false;
        if (job.status === "cancelled" || job.status === "completed") return false;
        const isAssigned = staffJobIds.includes(job.id) || job.assignedTo === staffId;
        return isAssigned;
      });
    };

    // Helper to check if a slot is available
    const isSlotAvailable = (staffId: string, date: string, startHour: number, startMinute: number, duration: number): boolean => {
      const existingJobs = getStaffJobsOnDate(staffId, date);
      const slotStart = startHour * 60 + startMinute;
      const slotEnd = slotStart + duration * 60;

      for (const job of existingJobs) {
        const jobTime = job.scheduledTime || "08:00";
        const [h, m] = jobTime.split(":").map(Number);
        const jobStart = h * 60 + m;
        const jobDuration = job.estimatedDuration || 2;
        const jobEnd = jobStart + jobDuration * 60;

        // Check for overlap (add 15 mins buffer for travel)
        if (slotStart < jobEnd + 15 && slotEnd > jobStart - 15) {
          return false;
        }
      }

      return true;
    };

    // Iterate through date range
    let currentDate = new Date(rangeStart);
    while (currentDate <= rangeEnd && availableSlots.length < maxResults) {
      // Skip weekends
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = currentDate.toISOString().split("T")[0];

        // Check each staff member
        for (const staff of activeStaff) {
          if (availableSlots.length >= maxResults) break;

          // Check each time slot
          for (let hour = WORK_START; hour <= WORK_END - durationHours; hour++) {
            for (let minute = 0; minute < 60; minute += SLOT_INCREMENT) {
              if (availableSlots.length >= maxResults) break;

              // Ensure slot doesn't go past work end
              const slotEndHour = hour + durationHours + minute / 60;
              if (slotEndHour > WORK_END) break;

              if (isSlotAvailable(staff.id, dateStr, hour, minute, durationHours)) {
                const startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
                const endHour = Math.floor(hour + durationHours);
                const endMinute = minute;
                const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;

                availableSlots.push({
                  date: dateStr,
                  startTime,
                  endTime,
                  staffId: staff.id,
                  staffName: `${staff.firstName} ${staff.lastName}`,
                  durationHours
                });
                
                // Move to next time block to avoid adjacent slots
                break;
              }
            }
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      slots: availableSlots,
      totalFound: availableSlots.length,
      searchParams: {
        durationHours,
        preferredStaffId,
        startDate: rangeStart.toISOString().split("T")[0],
        endDate: rangeEnd.toISOString().split("T")[0]
      }
    });
  }));

  // ============================================
  // CAPACITY PLANNING
  // ============================================
  
  // Get capacity metrics for staff workload analysis
  apiRouter.get("/capacity-metrics", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const { startDate, endDate } = req.query;

    const jobs = await storage.getJobs(userId);
    const assignments = await storage.getJobAssignments(userId);
    const staffMembers = await storage.getStaffDirectory(userId);

    // Guard against null/empty staff directory - return structured empty response
    if (!staffMembers || staffMembers.length === 0) {
      const now = new Date();
      const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1);
      const defaultEnd = new Date(defaultStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      res.json({
        hasStaff: false,
        message: "No staff members found. Please add staff to view capacity metrics.",
        dateRange: { 
          start: defaultStart.toISOString().split("T")[0], 
          end: defaultEnd.toISOString().split("T")[0], 
          workingDays: 5 
        },
        teamMetrics: {
          totalStaff: 0,
          totalScheduledHours: 0,
          totalAvailableHours: 0,
          overallUtilization: 0,
          totalJobsScheduled: 0
        },
        staffCapacities: [],
        alerts: { overloadedStaff: [], underutilizedStaff: [] }
      });
      return;
    }

    // Parse date range (default to current week)
    const now = new Date();
    const rangeStart = startDate 
      ? new Date(startDate as string) 
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1);
    const rangeEnd = endDate 
      ? new Date(endDate as string) 
      : new Date(rangeStart.getTime() + 6 * 24 * 60 * 60 * 1000);

    // Standard working hours per day (8 hours)
    const HOURS_PER_DAY = 8;
    
    // Calculate working days in range (exclude weekends)
    let workingDays = 0;
    let checkDate = new Date(rangeStart);
    while (checkDate <= rangeEnd) {
      const day = checkDate.getDay();
      if (day !== 0 && day !== 6) workingDays++;
      checkDate.setDate(checkDate.getDate() + 1);
    }

    // Per-staff capacity for the period (e.g., 5 days * 8 hours = 40 hours per person)
    const perStaffCapacityHours = workingDays * HOURS_PER_DAY;

    interface StaffCapacity {
      staffId: string;
      staffName: string;
      role: string;
      scheduledHours: number;
      availableHours: number;
      utilizationPercent: number;
      jobCount: number;
      dailyBreakdown: Record<string, { hours: number; jobs: number }>;
    }

    const activeStaff = staffMembers.filter(s => s.status !== "inactive");
    const staffCapacities: StaffCapacity[] = [];

    // Filter jobs in date range
    const rangeJobs = jobs.filter(job => {
      if (!job.scheduledDate) return false;
      if (job.status === "cancelled") return false;
      const jobDate = new Date(job.scheduledDate);
      return jobDate >= rangeStart && jobDate <= rangeEnd;
    });

    for (const staff of activeStaff) {
      const staffJobIds = assignments
        .filter(a => a.staffId === staff.id)
        .map(a => a.jobId);

      const staffJobs = rangeJobs.filter(job => 
        staffJobIds.includes(job.id) || job.assignedTo === staff.id
      );

      // Calculate scheduled hours
      let scheduledHours = 0;
      const dailyBreakdown: Record<string, { hours: number; jobs: number }> = {};

      for (const job of staffJobs) {
        const duration = job.estimatedDuration || 2;
        scheduledHours += duration;

        const dateKey = job.scheduledDate!;
        if (!dailyBreakdown[dateKey]) {
          dailyBreakdown[dateKey] = { hours: 0, jobs: 0 };
        }
        dailyBreakdown[dateKey].hours += duration;
        dailyBreakdown[dateKey].jobs++;
      }

      // Per-staff available = their individual capacity minus their scheduled hours
      const availableHours = Math.max(0, perStaffCapacityHours - scheduledHours);
      const utilizationPercent = perStaffCapacityHours > 0 
        ? Math.round((scheduledHours / perStaffCapacityHours) * 100)
        : 0;

      staffCapacities.push({
        staffId: staff.id,
        staffName: `${staff.firstName} ${staff.lastName}`,
        role: staff.role || "Technician",
        scheduledHours,
        availableHours,
        utilizationPercent,
        jobCount: staffJobs.length,
        dailyBreakdown
      });
    }

    // Calculate team totals (team capacity = staff count * per-staff capacity)
    const totalScheduledHours = staffCapacities.reduce((sum, s) => sum + s.scheduledHours, 0);
    const totalTeamCapacity = activeStaff.length * perStaffCapacityHours;
    const overallUtilization = totalTeamCapacity > 0 
      ? Math.round((totalScheduledHours / totalTeamCapacity) * 100)
      : 0;

    // Identify overloaded staff (>90% utilization)
    const overloadedStaff = staffCapacities.filter(s => s.utilizationPercent > 90);
    
    // Identify underutilized staff (<50% utilization)
    const underutilizedStaff = staffCapacities.filter(s => s.utilizationPercent < 50);

    res.json({
      dateRange: {
        start: rangeStart.toISOString().split("T")[0],
        end: rangeEnd.toISOString().split("T")[0],
        workingDays
      },
      teamMetrics: {
        totalStaff: activeStaff.length,
        totalScheduledHours,
        totalAvailableHours: totalTeamCapacity,
        overallUtilization,
        totalJobsScheduled: rangeJobs.length
      },
      staffCapacities: staffCapacities.sort((a, b) => b.utilizationPercent - a.utilizationPercent),
      alerts: {
        overloadedStaff: overloadedStaff.map(s => ({
          staffId: s.staffId,
          staffName: s.staffName,
          utilization: s.utilizationPercent
        })),
        underutilizedStaff: underutilizedStaff.map(s => ({
          staffId: s.staffId,
          staffName: s.staffName,
          utilization: s.utilizationPercent
        }))
      }
    });
  }));

  // ============================================
  // CHECK SHEET TEMPLATES
  // ============================================

  apiRouter.get("/check-sheet-templates", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const templates = await storage.getCheckSheetTemplates(userId);
    res.json(templates);
  }));

  apiRouter.get("/check-sheet-templates/detail/:id", asyncHandler(async (req, res) => {
    const template = await storage.getCheckSheetTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: "Check sheet template not found" });
    }
    res.json(template);
  }));

  apiRouter.get("/check-sheet-templates/system/:systemType", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const templates = await storage.getCheckSheetTemplatesBySystemType(userId, req.params.systemType);
    res.json(templates);
  }));

  // Get default template fields for a system type
  apiRouter.get("/check-sheet-templates/defaults/:systemType", asyncHandler(async (req, res) => {
    const { systemType } = req.params;
    const defaultFields = DEFAULT_TEMPLATE_FIELDS[systemType] || [];
    res.json({ systemType, fields: defaultFields });
  }));

  apiRouter.post("/check-sheet-templates", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const validation = insertCheckSheetTemplateSchema.safeParse({ ...req.body, userId });
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid data", details: validation.error.errors });
    }
    // Apply default fields if not provided but systemType is given
    const data = validation.data;
    if (data.systemType && (!data.fields || (Array.isArray(data.fields) && data.fields.length === 0))) {
      data.fields = DEFAULT_TEMPLATE_FIELDS[data.systemType] || [];
    }
    const template = await storage.createCheckSheetTemplate(data);
    res.json(template);
  }));

  apiRouter.patch("/check-sheet-templates/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getCheckSheetTemplate(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Check sheet template not found" });
    }
    const template = await storage.updateCheckSheetTemplate(req.params.id, req.body);
    res.json(template);
  }));

  apiRouter.delete("/check-sheet-templates/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getCheckSheetTemplate(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Check sheet template not found" });
    }
    await storage.deleteCheckSheetTemplate(req.params.id);
    res.json({ success: true });
  }));

  // ============================================
  // CHECK SHEET READINGS
  // ============================================

  apiRouter.get("/check-sheet-readings", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const readings = await storage.getCheckSheetReadings(userId);
    res.json(readings);
  }));

  apiRouter.get("/check-sheet-readings/detail/:id", asyncHandler(async (req, res) => {
    const reading = await storage.getCheckSheetReading(req.params.id);
    if (!reading) {
      return res.status(404).json({ error: "Check sheet reading not found" });
    }
    res.json(reading);
  }));

  apiRouter.get("/check-sheet-readings/job/:jobId", asyncHandler(async (req, res) => {
    const readings = await storage.getCheckSheetReadingsByJob(req.params.jobId);
    res.json(readings);
  }));

  apiRouter.post("/check-sheet-readings", asyncHandler(async (req, res) => {
    const userId = getUserId(req as AuthenticatedRequest);
    const validation = insertCheckSheetReadingSchema.safeParse({ ...req.body, userId });
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid data", details: validation.error.errors });
    }
    const reading = await storage.createCheckSheetReading(validation.data);
    res.json(reading);
  }));

  apiRouter.patch("/check-sheet-readings/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getCheckSheetReading(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Check sheet reading not found" });
    }
    const reading = await storage.updateCheckSheetReading(req.params.id, req.body);
    res.json(reading);
  }));

  apiRouter.delete("/check-sheet-readings/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getCheckSheetReading(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Check sheet reading not found" });
    }
    await storage.deleteCheckSheetReading(req.params.id);
    res.json({ success: true });
  }));

  // ─────────────────────────────────────────────
  // ADMIN: ENTITIES
  // ─────────────────────────────────────────────

  // GET /api/admin/entities
  apiRouter.get("/admin/entities", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const list = await db
      .select({
        id: formEntities.id,
        title: formEntities.title,
        description: formEntities.description,
        createdAt: formEntities.createdAt,
        updatedAt: formEntities.updatedAt,
      })
      .from(formEntities)
      .where(eq(formEntities.organizationId, auth.organizationId))
      .orderBy(formEntities.title);

    res.json({ entities: list });
  });

  // POST /api/admin/entities
  apiRouter.post("/admin/entities", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    try {
      const title = assertString(req.body?.title, "title");
      const description = typeof req.body?.description === "string" ? req.body.description : null;

      const created = await db
        .insert(formEntities)
        .values({
          organizationId: auth.organizationId,
          title,
          description,
        })
        .returning({
          id: formEntities.id,
          title: formEntities.title,
          description: formEntities.description,
        });

      await logAudit(db, {
        organizationId: auth.organizationId,
        actorUserId: auth.userId,
        action: "entity.created",
        entityType: "entity",
        entityId: created[0].id,
        metadata: { title },
      });

      res.json({ entity: created[0] });
    } catch (e: any) {
      res.status(400).json({ message: e?.message ?? "Bad request" });
    }
  });

  // PATCH /api/admin/entities/:id
  apiRouter.patch("/admin/entities/:id", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const entityId = String(req.params.id || "");
    if (!entityId) return res.status(400).json({ message: "Invalid id" });

    const patch: any = {};
    if (typeof req.body?.title === "string") patch.title = req.body.title.trim();
    if (typeof req.body?.description === "string") patch.description = req.body.description;
    patch.updatedAt = new Date();

    const updated = await db
      .update(formEntities)
      .set(patch)
      .where(and(eq(formEntities.id, entityId), eq(formEntities.organizationId, auth.organizationId)))
      .returning({
        id: formEntities.id,
        title: formEntities.title,
        description: formEntities.description,
      });

    if (!updated.length) return res.status(404).json({ message: "Not found" });

    await logAudit(db, {
      organizationId: auth.organizationId,
      actorUserId: auth.userId,
      action: "entity.updated",
      entityType: "entity",
      entityId: updated[0].id,
      metadata: { title: updated[0].title },
    });

    res.json({ entity: updated[0] });
  });

  // DELETE /api/admin/entities/:id
  apiRouter.delete("/admin/entities/:id", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const entityId = String(req.params.id || "");
    if (!entityId) return res.status(400).json({ message: "Invalid id" });

    // Delete rows first (FK safety)
    await db
      .delete(formEntityRows)
      .where(and(eq(formEntityRows.entityId, entityId), eq(formEntityRows.organizationId, auth.organizationId)));

    const deleted = await db
      .delete(formEntities)
      .where(and(eq(formEntities.id, entityId), eq(formEntities.organizationId, auth.organizationId)))
      .returning({ id: formEntities.id });

    if (!deleted.length) return res.status(404).json({ message: "Not found" });

    await logAudit(db, {
      organizationId: auth.organizationId,
      actorUserId: auth.userId,
      action: "entity.deleted",
      entityType: "entity",
      entityId,
      metadata: {},
    });

    res.json({ ok: true });
  });

  // GET /api/admin/entities/:id/rows
  apiRouter.get("/admin/entities/:id/rows", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const entityId = String(req.params.id || "");
    if (!entityId) return res.status(400).json({ message: "Invalid id" });

    const rows = await db
      .select({
        id: formEntityRows.id,
        entityId: formEntityRows.entityId,
        sortOrder: formEntityRows.sortOrder,
        component: formEntityRows.component,
        activity: formEntityRows.activity,
        reference: formEntityRows.reference,
        fieldType: formEntityRows.fieldType,
        units: formEntityRows.units,
        choices: formEntityRows.choices,
        evidenceRequired: formEntityRows.evidenceRequired,
      })
      .from(formEntityRows)
      .where(and(eq(formEntityRows.entityId, entityId), eq(formEntityRows.organizationId, auth.organizationId)))
      .orderBy(formEntityRows.sortOrder);

    res.json({ rows });
  });

  // POST /api/admin/entities/:id/rows
  apiRouter.post("/admin/entities/:id/rows", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    try {
      const entityId = String(req.params.id || "");
      if (!entityId) return res.status(400).json({ message: "Invalid entity id" });

      const component = assertString(req.body?.component, "component");
      const activity = assertString(req.body?.activity, "activity");
      const fieldType = assertFieldType(req.body?.fieldType);

      const reference = typeof req.body?.reference === "string" ? req.body.reference : null;
      const units = typeof req.body?.units === "string" ? req.body.units : null;
      const evidenceRequired = !!req.body?.evidenceRequired;

      const choices =
        fieldType === "choice" && Array.isArray(req.body?.choices)
          ? req.body.choices.filter((c: any) => typeof c === "string")
          : null;

      // Determine next sortOrder
      const max = await db
        .select({ max: sql<number>`coalesce(max(${formEntityRows.sortOrder}), 0)` })
        .from(formEntityRows)
        .where(and(eq(formEntityRows.entityId, entityId), eq(formEntityRows.organizationId, auth.organizationId)));

      const nextSort = (max[0]?.max ?? 0) + 1;

      const created = await db
        .insert(formEntityRows)
        .values({
          organizationId: auth.organizationId,
          entityId,
          sortOrder: nextSort,
          component,
          activity,
          reference,
          fieldType,
          units,
          choices,
          evidenceRequired,
        })
        .returning({
          id: formEntityRows.id,
          entityId: formEntityRows.entityId,
          sortOrder: formEntityRows.sortOrder,
          component: formEntityRows.component,
          activity: formEntityRows.activity,
          reference: formEntityRows.reference,
          fieldType: formEntityRows.fieldType,
          units: formEntityRows.units,
          choices: formEntityRows.choices,
          evidenceRequired: formEntityRows.evidenceRequired,
        });

      await logAudit(db, {
        organizationId: auth.organizationId,
        actorUserId: auth.userId,
        action: "entity_row.created",
        entityType: "entity_row",
        entityId: created[0].id,
        metadata: { entityId, component, activity, fieldType },
      });

      res.json({ row: created[0] });
    } catch (e: any) {
      res.status(400).json({ message: e?.message ?? "Bad request" });
    }
  });

  // PATCH /api/admin/entity-rows/:rowId
  apiRouter.patch("/admin/entity-rows/:rowId", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const rowId = String(req.params.rowId || "");
    if (!rowId) return res.status(400).json({ message: "Invalid rowId" });

    try {
      const patch: any = { updatedAt: new Date() };

      if (typeof req.body?.component === "string") patch.component = req.body.component.trim();
      if (typeof req.body?.activity === "string") patch.activity = req.body.activity.trim();
      if (typeof req.body?.reference === "string") patch.reference = req.body.reference;
      if (typeof req.body?.units === "string") patch.units = req.body.units;
      if (typeof req.body?.evidenceRequired === "boolean") patch.evidenceRequired = req.body.evidenceRequired;

      if (typeof req.body?.fieldType === "string") {
        patch.fieldType = assertFieldType(req.body.fieldType);
        // If switching away from choice, clear choices
        if (patch.fieldType !== "choice") patch.choices = null;
      }

      if (Array.isArray(req.body?.choices)) {
        patch.choices = req.body.choices.filter((c: any) => typeof c === "string");
      }

      const updated = await db
        .update(formEntityRows)
        .set(patch)
        .where(and(eq(formEntityRows.id, rowId), eq(formEntityRows.organizationId, auth.organizationId)))
        .returning({
          id: formEntityRows.id,
          entityId: formEntityRows.entityId,
          sortOrder: formEntityRows.sortOrder,
          component: formEntityRows.component,
          activity: formEntityRows.activity,
          reference: formEntityRows.reference,
          fieldType: formEntityRows.fieldType,
          units: formEntityRows.units,
          choices: formEntityRows.choices,
          evidenceRequired: formEntityRows.evidenceRequired,
        });

      if (!updated.length) return res.status(404).json({ message: "Not found" });

      await logAudit(db, {
        organizationId: auth.organizationId,
        actorUserId: auth.userId,
        action: "entity_row.updated",
        entityType: "entity_row",
        entityId: updated[0].id,
        metadata: { entityId: updated[0].entityId },
      });

      res.json({ row: updated[0] });
    } catch (e: any) {
      res.status(400).json({ message: e?.message ?? "Bad request" });
    }
  });

  // DELETE /api/admin/entity-rows/:rowId
  apiRouter.delete("/admin/entity-rows/:rowId", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const rowId = String(req.params.rowId || "");
    if (!rowId) return res.status(400).json({ message: "Invalid rowId" });

    const deleted = await db
      .delete(formEntityRows)
      .where(and(eq(formEntityRows.id, rowId), eq(formEntityRows.organizationId, auth.organizationId)))
      .returning({ id: formEntityRows.id });

    if (!deleted.length) return res.status(404).json({ message: "Not found" });

    await logAudit(db, {
      organizationId: auth.organizationId,
      actorUserId: auth.userId,
      action: "entity_row.deleted",
      entityType: "entity_row",
      entityId: rowId,
      metadata: {},
    });

    res.json({ ok: true });
  });

  // POST /api/admin/entities/:id/rows/reorder
  apiRouter.post("/admin/entities/:id/rows/reorder", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const entityId = String(req.params.id || "");
    if (!entityId) return res.status(400).json({ message: "Invalid entity id" });

    const orderedRowIds = Array.isArray(req.body?.orderedRowIds) ? req.body.orderedRowIds : [];
    if (!orderedRowIds.length) return res.status(400).json({ message: "orderedRowIds[] required" });

    // Validate all rowIds belong to this entity + org
    const rows = await db
      .select({ id: formEntityRows.id })
      .from(formEntityRows)
      .where(and(eq(formEntityRows.entityId, entityId), eq(formEntityRows.organizationId, auth.organizationId)));

    const existingSet = new Set(rows.map((r) => r.id));
    for (const id of orderedRowIds) {
      if (!existingSet.has(id)) return res.status(400).json({ message: `Invalid rowId: ${id}` });
    }

    // Update sortOrder
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedRowIds.length; i++) {
        await tx
          .update(formEntityRows)
          .set({ sortOrder: i + 1, updatedAt: new Date() })
          .where(and(eq(formEntityRows.id, orderedRowIds[i]), eq(formEntityRows.organizationId, auth.organizationId)));
      }
    });

    res.json({ ok: true });
  });

  // ─────────────────────────────────────────────
  // ADMIN: SYSTEM TYPES (for template mapping)
  // ─────────────────────────────────────────────
  apiRouter.get("/admin/system-types", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const list = await db
      .select({
        id: systemTypes.id,
        code: systemTypes.code,
        name: systemTypes.name,
      })
      .from(systemTypes)
      .where(eq(systemTypes.organizationId, auth.organizationId))
      .orderBy(systemTypes.name);

    res.json({ systemTypes: list });
  });

  // ─────────────────────────────────────────────
  // ADMIN: TEMPLATES
  // ─────────────────────────────────────────────
  apiRouter.get("/admin/templates", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const list = await db
      .select({
        id: formTemplates.id,
        name: formTemplates.name,
        description: formTemplates.description,
        isActive: formTemplates.isActive,
        createdAt: formTemplates.createdAt,
        updatedAt: formTemplates.updatedAt,
      })
      .from(formTemplates)
      .where(eq(formTemplates.organizationId, auth.organizationId))
      .orderBy(formTemplates.name);

    res.json({ templates: list });
  });

  apiRouter.post("/admin/templates", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    try {
      const name = assertString(req.body?.name, "name");
      const description = typeof req.body?.description === "string" ? req.body.description : null;

      const created = await db
        .insert(formTemplates)
        .values({
          organizationId: auth.organizationId,
          name,
          description,
          isActive: true,
        })
        .returning({
          id: formTemplates.id,
          name: formTemplates.name,
          description: formTemplates.description,
          isActive: formTemplates.isActive,
        });

      await logAudit(db, {
        organizationId: auth.organizationId,
        actorUserId: auth.userId,
        action: "template.created",
        entityType: "template",
        entityId: created[0].id,
        metadata: { name },
      });

      res.json({ template: created[0] });
    } catch (e: any) {
      res.status(400).json({ message: e?.message ?? "Bad request" });
    }
  });

  apiRouter.patch("/admin/templates/:id", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const templateId = String(req.params.id || "");
    if (!templateId) return res.status(400).json({ message: "Invalid id" });

    const patch: any = { updatedAt: new Date() };
    if (typeof req.body?.name === "string") patch.name = req.body.name.trim();
    if (typeof req.body?.description === "string") patch.description = req.body.description;
    if (typeof req.body?.isActive === "boolean") patch.isActive = req.body.isActive;

    const updated = await db
      .update(formTemplates)
      .set(patch)
      .where(and(eq(formTemplates.id, templateId), eq(formTemplates.organizationId, auth.organizationId)))
      .returning({
        id: formTemplates.id,
        name: formTemplates.name,
        description: formTemplates.description,
        isActive: formTemplates.isActive,
      });

    if (!updated.length) return res.status(404).json({ message: "Not found" });

    await logAudit(db, {
      organizationId: auth.organizationId,
      actorUserId: auth.userId,
      action: "template.updated",
      entityType: "template",
      entityId: updated[0].id,
      metadata: { name: updated[0].name, isActive: updated[0].isActive },
    });

    res.json({ template: updated[0] });
  });

  apiRouter.delete("/admin/templates/:id", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const templateId = String(req.params.id || "");
    if (!templateId) return res.status(400).json({ message: "Invalid id" });

    // Delete mappings first (FK safety)
    await db
      .delete(formTemplateEntities)
      .where(and(eq(formTemplateEntities.templateId, templateId), eq(formTemplateEntities.organizationId, auth.organizationId)));

    await db
      .delete(formTemplateSystemTypes)
      .where(and(eq(formTemplateSystemTypes.templateId, templateId), eq(formTemplateSystemTypes.organizationId, auth.organizationId)));

    const deleted = await db
      .delete(formTemplates)
      .where(and(eq(formTemplates.id, templateId), eq(formTemplates.organizationId, auth.organizationId)))
      .returning({ id: formTemplates.id });

    if (!deleted.length) return res.status(404).json({ message: "Not found" });

    await logAudit(db, {
      organizationId: auth.organizationId,
      actorUserId: auth.userId,
      action: "template.deleted",
      entityType: "template",
      entityId: templateId,
      metadata: {},
    });

    res.json({ ok: true });
  });

  // GET /api/admin/templates/:id/system-types
  apiRouter.get("/admin/templates/:id/system-types", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const templateId = String(req.params.id || "");
    if (!templateId) return res.status(400).json({ message: "Invalid id" });

    const mappings = await db
      .select({ systemTypeId: formTemplateSystemTypes.systemTypeId })
      .from(formTemplateSystemTypes)
      .where(and(eq(formTemplateSystemTypes.templateId, templateId), eq(formTemplateSystemTypes.organizationId, auth.organizationId)));

    res.json({ systemTypeIds: mappings.map((m) => m.systemTypeId) });
  });

  // POST /api/admin/templates/:id/system-types
  apiRouter.post("/admin/templates/:id/system-types", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const templateId = String(req.params.id || "");
    if (!templateId) return res.status(400).json({ message: "Invalid id" });

    const systemTypeIds = Array.isArray(req.body?.systemTypeIds) ? req.body.systemTypeIds : [];

    // Delete existing mappings
    await db
      .delete(formTemplateSystemTypes)
      .where(and(eq(formTemplateSystemTypes.templateId, templateId), eq(formTemplateSystemTypes.organizationId, auth.organizationId)));

    // Insert new mappings
    if (systemTypeIds.length > 0) {
      const values = systemTypeIds.map((stId: string) => ({
        organizationId: auth.organizationId,
        templateId,
        systemTypeId: stId,
      }));
      await db.insert(formTemplateSystemTypes).values(values);
    }

    res.json({ ok: true, systemTypeIds });
  });

  // GET /api/admin/templates/:id/entities
  apiRouter.get("/admin/templates/:id/entities", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const templateId = String(req.params.id || "");
    if (!templateId) return res.status(400).json({ message: "Invalid id" });

    const mappings = await db
      .select({
        entityId: formTemplateEntities.entityId,
        sortOrder: formTemplateEntities.sortOrder,
        required: formTemplateEntities.required,
        repeatPerAsset: formTemplateEntities.repeatPerAsset,
        evidenceRequired: formTemplateEntities.evidenceRequired,
        entityTitle: formEntities.title,
        entityDescription: formEntities.description,
      })
      .from(formTemplateEntities)
      .innerJoin(formEntities, eq(formEntities.id, formTemplateEntities.entityId))
      .where(and(eq(formTemplateEntities.templateId, templateId), eq(formTemplateEntities.organizationId, auth.organizationId)))
      .orderBy(formTemplateEntities.sortOrder);

    res.json({ entities: mappings });
  });

  // POST /api/admin/templates/:id/entities
  apiRouter.post("/admin/templates/:id/entities", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const templateId = String(req.params.id || "");
    if (!templateId) return res.status(400).json({ message: "Invalid template id" });

    try {
      const entityId = assertString(req.body?.entityId, "entityId");

      // Determine next sortOrder
      const max = await db
        .select({ max: sql<number>`coalesce(max(${formTemplateEntities.sortOrder}), 0)` })
        .from(formTemplateEntities)
        .where(and(eq(formTemplateEntities.templateId, templateId), eq(formTemplateEntities.organizationId, auth.organizationId)));

      const nextSort = (max[0]?.max ?? 0) + 1;

      const created = await db
        .insert(formTemplateEntities)
        .values({
          organizationId: auth.organizationId,
          templateId,
          entityId,
          sortOrder: nextSort,
          required: true,
          repeatPerAsset: false,
          evidenceRequired: false,
        })
        .returning({
          entityId: formTemplateEntities.entityId,
          sortOrder: formTemplateEntities.sortOrder,
          required: formTemplateEntities.required,
          repeatPerAsset: formTemplateEntities.repeatPerAsset,
          evidenceRequired: formTemplateEntities.evidenceRequired,
        });

      res.json({ entity: created[0] });
    } catch (e: any) {
      res.status(400).json({ message: e?.message ?? "Bad request" });
    }
  });

  // POST /api/admin/templates/:id/entities/reorder
  apiRouter.post("/admin/templates/:id/entities/reorder", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const templateId = String(req.params.id || "");
    if (!templateId) return res.status(400).json({ message: "Invalid template id" });

    const orderedEntityIds = Array.isArray(req.body?.orderedEntityIds) ? req.body.orderedEntityIds : [];
    if (!orderedEntityIds.length) return res.status(400).json({ message: "orderedEntityIds[] required" });

    // Validate all entityIds belong to this template + org
    const existing = await db
      .select({ entityId: formTemplateEntities.entityId })
      .from(formTemplateEntities)
      .where(and(eq(formTemplateEntities.templateId, templateId), eq(formTemplateEntities.organizationId, auth.organizationId)));

    const existingSet = new Set(existing.map((e) => e.entityId));
    for (const id of orderedEntityIds) {
      if (!existingSet.has(id)) return res.status(400).json({ message: `Invalid entityId: ${id}` });
    }

    // Update sortOrder
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedEntityIds.length; i++) {
        await tx
          .update(formTemplateEntities)
          .set({ sortOrder: i + 1 })
          .where(
            and(
              eq(formTemplateEntities.templateId, templateId),
              eq(formTemplateEntities.entityId, orderedEntityIds[i]),
              eq(formTemplateEntities.organizationId, auth.organizationId)
            )
          );
      }
    });

    res.json({ ok: true });
  });

  // PATCH /api/admin/templates/:id/entities/:entityId
  apiRouter.patch("/admin/templates/:id/entities/:entityId", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const templateId = String(req.params.id || "");
    const entityId = String(req.params.entityId || "");
    if (!templateId || !entityId) return res.status(400).json({ message: "Invalid ids" });

    const patch: any = {};
    if (typeof req.body?.required === "boolean") patch.required = req.body.required;
    if (typeof req.body?.repeatPerAsset === "boolean") patch.repeatPerAsset = req.body.repeatPerAsset;
    if (typeof req.body?.evidenceRequired === "boolean") patch.evidenceRequired = req.body.evidenceRequired;

    const updated = await db
      .update(formTemplateEntities)
      .set(patch)
      .where(
        and(
          eq(formTemplateEntities.templateId, templateId),
          eq(formTemplateEntities.entityId, entityId),
          eq(formTemplateEntities.organizationId, auth.organizationId)
        )
      )
      .returning({
        entityId: formTemplateEntities.entityId,
        required: formTemplateEntities.required,
        repeatPerAsset: formTemplateEntities.repeatPerAsset,
        evidenceRequired: formTemplateEntities.evidenceRequired,
      });

    if (!updated.length) return res.status(404).json({ message: "Not found" });
    res.json({ entity: updated[0] });
  });

  // DELETE /api/admin/templates/:id/entities/:entityId
  apiRouter.delete("/admin/templates/:id/entities/:entityId", async (req, res) => {
    const auth = await requireOrgRole(req, ["owner", "admin"]);
    if (!auth.ok) return res.status(auth.status).json({ message: auth.message });

    const templateId = String(req.params.id || "");
    const entityId = String(req.params.entityId || "");
    if (!templateId || !entityId) return res.status(400).json({ message: "Invalid ids" });

    const deleted = await db
      .delete(formTemplateEntities)
      .where(
        and(
          eq(formTemplateEntities.templateId, templateId),
          eq(formTemplateEntities.entityId, entityId),
          eq(formTemplateEntities.organizationId, auth.organizationId)
        )
      )
      .returning({ entityId: formTemplateEntities.entityId });

    if (!deleted.length) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  });

  // ─────────────────────────────────────────────
  // FORM INSPECTION API (DB-backed)
  // ─────────────────────────────────────────────

  // GET /api/jobs/:jobId/forms - Returns system types and templates available for this job
  apiRouter.get("/jobs/:jobId/forms", async (req, res) => {
    try {
      const { organizationId } = await requireUserOrgId(req);

      const jobId = String(req.params.jobId || "");
      if (!jobId) return res.status(400).json({ message: "Invalid jobId" });

      // Verify job exists and belongs to org via userId -> user.organizationId
      const access = await requireJobInOrg(jobId, organizationId);
      if (!access.ok) return res.status(access.status).json({ message: access.message });

      // Templates mapped to system types for this org (only active templates)
      const mapped = await db
        .select({
          templateId: formTemplates.id,
          templateName: formTemplates.name,
          systemTypeId: systemTypes.id,
          systemCode: systemTypes.code,
          systemName: systemTypes.name,
        })
        .from(formTemplateSystemTypes)
        .innerJoin(formTemplates, eq(formTemplates.id, formTemplateSystemTypes.templateId))
        .innerJoin(systemTypes, eq(systemTypes.id, formTemplateSystemTypes.systemTypeId))
        .where(and(eq(formTemplateSystemTypes.organizationId, organizationId), eq(formTemplates.isActive, true)));

      const systemTypesOut = Array.from(
        new Map(mapped.map((m) => [m.systemTypeId, { id: m.systemTypeId, code: m.systemCode, name: m.systemName }])).values()
      );

      const templatesOut = mapped.map((m) => ({
        id: m.templateId,
        name: m.templateName,
        systemTypeCode: m.systemCode,
      }));

      res.json({ systemTypes: systemTypesOut, templates: templatesOut });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Error fetching forms" });
    }
  });

  // GET /api/jobs/:jobId/audit - Timeline of audit events for a job
  apiRouter.get("/jobs/:jobId/audit", async (req, res) => {
    try {
      const { organizationId } = await requireUserOrgId(req);
      const jobId = String(req.params.jobId || "");
      if (!jobId) return res.status(400).json({ message: "Invalid jobId" });

      const access = await requireJobInOrg(jobId, organizationId);
      if (!access.ok) return res.status(access.status).json({ message: access.message });

      const rows = await db
        .select({
          id: auditEvents.id,
          action: auditEvents.action,
          entityType: auditEvents.entityType,
          entityId: auditEvents.entityId,
          metadata: auditEvents.metadata,
          createdAt: auditEvents.createdAt,
          actorUserId: auditEvents.actorUserId,
          inspectionId: auditEvents.inspectionId,
        })
        .from(auditEvents)
        .where(and(eq(auditEvents.organizationId, organizationId), eq(auditEvents.jobId, jobId)))
        .orderBy(desc(auditEvents.createdAt))
        .limit(200);

      res.json({ events: rows });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Error fetching audit events" });
    }
  });

  // GET /api/inspections/:id/audit - Timeline of audit events for an inspection
  apiRouter.get("/inspections/:id/audit", async (req, res) => {
    try {
      const { organizationId } = await requireUserOrgId(req);
      const inspectionId = String(req.params.id || "");
      if (!inspectionId) return res.status(400).json({ message: "Invalid inspection id" });

      const insp = await db
        .select({ id: inspectionInstances.id, jobId: inspectionInstances.jobId })
        .from(inspectionInstances)
        .where(and(eq(inspectionInstances.id, inspectionId), eq(inspectionInstances.organizationId, organizationId)))
        .limit(1);

      if (!insp.length) return res.status(404).json({ message: "Inspection not found" });

      const access = await requireJobInOrg(String(insp[0].jobId), organizationId);
      if (!access.ok) return res.status(access.status).json({ message: access.message });

      const rows = await db
        .select({
          id: auditEvents.id,
          action: auditEvents.action,
          entityType: auditEvents.entityType,
          entityId: auditEvents.entityId,
          metadata: auditEvents.metadata,
          createdAt: auditEvents.createdAt,
          actorUserId: auditEvents.actorUserId,
        })
        .from(auditEvents)
        .where(and(eq(auditEvents.organizationId, organizationId), eq(auditEvents.inspectionId, inspectionId)))
        .orderBy(desc(auditEvents.createdAt))
        .limit(200);

      res.json({ events: rows });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Error fetching audit events" });
    }
  });

  // POST /api/inspections - Create or resume inspection instance
  apiRouter.post("/inspections", async (req, res) => {
    try {
      const { organizationId, userId } = await requireUserOrgId(req);

      const { jobId, systemTypeCode, templateId } = req.body ?? {};
      const parsedJobId = String(jobId || "");
      if (!parsedJobId) return res.status(400).json({ message: "Invalid jobId" });
      if (!systemTypeCode || !templateId) return res.status(400).json({ message: "systemTypeCode and templateId are required" });

      // Verify job exists and belongs to org
      const access = await requireJobInOrg(parsedJobId, organizationId);
      if (!access.ok) return res.status(access.status).json({ message: access.message });

      // Ensure template belongs to org
      const tpl = await db
        .select({ id: formTemplates.id, organizationId: formTemplates.organizationId })
        .from(formTemplates)
        .where(and(eq(formTemplates.id, templateId), eq(formTemplates.organizationId, organizationId)))
        .limit(1);

      if (!tpl.length) return res.status(404).json({ message: "Template not found" });

      // Find system type id by code
      const sys = await db
        .select({ id: systemTypes.id })
        .from(systemTypes)
        .where(and(eq(systemTypes.organizationId, organizationId), eq(systemTypes.code, String(systemTypeCode))))
        .limit(1);

      if (!sys.length) return res.status(404).json({ message: "System type not found" });

      // Resume existing incomplete inspection
      const existing = await db
        .select({ id: inspectionInstances.id })
        .from(inspectionInstances)
        .where(
          and(
            eq(inspectionInstances.organizationId, organizationId),
            eq(inspectionInstances.jobId, parsedJobId),
            eq(inspectionInstances.templateId, templateId),
            eq(inspectionInstances.systemTypeId, sys[0].id),
            isNull(inspectionInstances.completedAt)
          )
        )
        .limit(1);

      if (existing.length) return res.json({ inspectionId: existing[0].id });

      const created = await db
        .insert(inspectionInstances)
        .values({
          organizationId,
          jobId: parsedJobId,
          systemTypeId: sys[0].id,
          templateId,
          createdByUserId: userId,
        })
        .returning({ id: inspectionInstances.id });

      res.json({ inspectionId: created[0].id });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Error creating inspection" });
    }
  });

  // Helper to build full template DTO with entities and rows
  async function buildTemplateDTO(templateId: string): Promise<FormTemplateDTO | null> {
    const template = await storage.getFormTemplate(templateId);
    if (!template) return null;

    const templateEntities = await storage.getFormTemplateEntities(templateId);
    const entities: EntityDTO[] = [];

    for (const te of templateEntities) {
      const entity = await storage.getFormEntity(te.entityId);
      if (!entity) continue;
      const rows = await storage.getFormEntityRows(te.entityId);
      entities.push({
        id: entity.id,
        title: entity.title,
        description: entity.description,
        rows: rows.map(r => ({
          id: r.id,
          component: r.component,
          activity: r.activity,
          reference: r.reference,
          fieldType: r.fieldType,
          units: r.units,
          choices: r.choices,
          evidenceRequired: r.evidenceRequired,
        })),
      });
    }

    return { id: template.id, name: template.name, entities };
  }

  // GET /api/inspections/:id - Returns template structure and latest responses
  apiRouter.get("/inspections/:id", async (req, res) => {
    try {
      const { organizationId } = await requireUserOrgId(req);
      const inspectionId = String(req.params.id);

      const insp = await db
        .select({
          id: inspectionInstances.id,
          templateId: inspectionInstances.templateId,
          completedAt: inspectionInstances.completedAt,
        })
        .from(inspectionInstances)
        .where(and(eq(inspectionInstances.id, inspectionId), eq(inspectionInstances.organizationId, organizationId)))
        .limit(1);

      if (!insp.length) return res.status(404).json({ message: "Inspection not found" });

      // Load template + ordered entities
      const template = await db
        .select({
          id: formTemplates.id,
          name: formTemplates.name,
        })
        .from(formTemplates)
        .where(and(eq(formTemplates.id, insp[0].templateId), eq(formTemplates.organizationId, organizationId)))
        .limit(1);

      if (!template.length) return res.status(404).json({ message: "Template not found" });

      const te = await db
        .select({
          entityId: formTemplateEntities.entityId,
          sortOrder: formTemplateEntities.sortOrder,
          title: formEntities.title,
          description: formEntities.description,
        })
        .from(formTemplateEntities)
        .innerJoin(formEntities, eq(formEntities.id, formTemplateEntities.entityId))
        .where(and(eq(formTemplateEntities.templateId, insp[0].templateId), eq(formTemplateEntities.organizationId, organizationId)))
        .orderBy(formTemplateEntities.sortOrder);

      const entityIds = te.map((x) => x.entityId);

      const rows = entityIds.length
        ? await db
            .select({
              id: formEntityRows.id,
              entityId: formEntityRows.entityId,
              sortOrder: formEntityRows.sortOrder,
              component: formEntityRows.component,
              activity: formEntityRows.activity,
              reference: formEntityRows.reference,
              fieldType: formEntityRows.fieldType,
              units: formEntityRows.units,
              choices: formEntityRows.choices,
              evidenceRequired: formEntityRows.evidenceRequired,
            })
            .from(formEntityRows)
            .where(and(eq(formEntityRows.organizationId, organizationId), inArray(formEntityRows.entityId, entityIds)))
            .orderBy(formEntityRows.entityId, formEntityRows.sortOrder)
        : [];

      // Latest responses per rowId
      const resp = await db
        .select({
          rowId: inspectionResponses.rowId,
          valueText: inspectionResponses.valueText,
          valueNumber: inspectionResponses.valueNumber,
          valueBool: inspectionResponses.valueBool,
          comment: inspectionResponses.comment,
          createdAt: inspectionResponses.createdAt,
        })
        .from(inspectionResponses)
        .where(and(eq(inspectionResponses.organizationId, organizationId), eq(inspectionResponses.inspectionId, inspectionId)))
        .orderBy(desc(inspectionResponses.createdAt));

      const latestByRow = new Map<string, any>();
      for (const r of resp) {
        if (!latestByRow.has(r.rowId)) latestByRow.set(r.rowId, r);
      }

      const templateDto = {
        id: template[0].id,
        name: template[0].name,
        entities: te.map((e) => ({
          id: e.entityId,
          title: e.title,
          description: e.description ?? undefined,
          rows: rows
            .filter((r) => r.entityId === e.entityId)
            .map((r) => ({
              id: r.id,
              component: r.component,
              activity: r.activity,
              reference: r.reference ?? undefined,
              fieldType: r.fieldType,
              units: r.units ?? undefined,
              choices: (r.choices as any) ?? undefined,
              evidenceRequired: r.evidenceRequired,
            })),
        })),
      };

      const responsesDto = Array.from(latestByRow.entries()).map(([rowId, r]) => {
        let value: any = null;
        if (r.valueBool !== null && r.valueBool !== undefined) value = r.valueBool;
        else if (r.valueNumber) value = Number(r.valueNumber);
        else if (r.valueText) value = r.valueText;
        return { rowId, value, comment: r.comment ?? undefined };
      });

      res.json({
        id: insp[0].id,
        template: templateDto,
        completedAt: insp[0].completedAt,
        responses: responsesDto,
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Error fetching inspection" });
    }
  });

  // POST /api/inspections/:id/responses - Append-only response inserts
  apiRouter.post("/inspections/:id/responses", async (req, res) => {
    try {
      const { organizationId, userId } = await requireUserOrgId(req);
      const inspectionId = String(req.params.id);

      const insp = await db
        .select({ id: inspectionInstances.id, completedAt: inspectionInstances.completedAt })
        .from(inspectionInstances)
        .where(and(eq(inspectionInstances.id, inspectionId), eq(inspectionInstances.organizationId, organizationId)))
        .limit(1);

      if (!insp.length) return res.status(404).json({ message: "Inspection not found" });
      if (insp[0].completedAt) return res.status(409).json({ message: "Inspection is completed" });

      const { responses } = req.body ?? {};
      if (!Array.isArray(responses)) return res.status(400).json({ message: "responses[] required" });

      // Validate rows belong to org
      const rowIds = responses.map((r: any) => String(r.rowId)).filter(Boolean);
      if (!rowIds.length) return res.status(400).json({ message: "No rowId values" });

      const validRows = await db
        .select({ id: formEntityRows.id })
        .from(formEntityRows)
        .where(and(eq(formEntityRows.organizationId, organizationId), inArray(formEntityRows.id, rowIds)));

      const validSet = new Set(validRows.map((r) => r.id));
      const invalid = rowIds.find((id) => !validSet.has(id));
      if (invalid) return res.status(400).json({ message: `Invalid rowId: ${invalid}` });

      const inserts = responses.map((r: any) => {
        const cols = coerceValueToColumns(r.value);
        return {
          organizationId,
          inspectionId,
          rowId: String(r.rowId),
          ...cols,
          comment: typeof r.comment === "string" ? r.comment : null,
          createdByUserId: userId,
        };
      });

      await db.insert(inspectionResponses).values(inserts);

      res.json({ ok: true });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Error saving responses" });
    }
  });

  // POST /api/inspections/:id/complete - Lock inspection by setting completedAt
  apiRouter.post("/inspections/:id/complete", async (req, res) => {
    try {
      const { organizationId, userId } = await requireUserOrgId(req);
      const inspectionId = String(req.params.id);

      const insp = await db
        .select({ id: inspectionInstances.id, completedAt: inspectionInstances.completedAt })
        .from(inspectionInstances)
        .where(and(eq(inspectionInstances.id, inspectionId), eq(inspectionInstances.organizationId, organizationId)))
        .limit(1);

      if (!insp.length) return res.status(404).json({ message: "Inspection not found" });
      if (insp[0].completedAt) return res.json({ completedAt: insp[0].completedAt });

      const updated = await db
        .update(inspectionInstances)
        .set({
          completedAt: new Date(),
          completedByUserId: userId,
        })
        .where(and(eq(inspectionInstances.id, inspectionId), eq(inspectionInstances.organizationId, organizationId)))
        .returning({ completedAt: inspectionInstances.completedAt });

      res.json({ completedAt: updated[0].completedAt });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Error completing inspection" });
    }
  });

  // ─────────────────────────────────────────────
  // EVIDENCE: Upload + list + download (AUTH)
  // ─────────────────────────────────────────────

  // POST /api/inspections/:id/rows/:rowId/attachments  (multipart form-data: file)
  apiRouter.post(
    "/inspections/:id/rows/:rowId/attachments",
    upload.single("file"),
    async (req, res) => {
      try {
        const { organizationId, userId } = await requireUserOrgId(req);

        const inspectionId = String(req.params.id || "");
        const rowId = String(req.params.rowId || "");
        if (!inspectionId || !rowId) return res.status(400).json({ message: "Invalid ids" });

        // Verify inspection belongs to org + not completed
        const insp = await db
          .select({
            id: inspectionInstances.id,
            jobId: inspectionInstances.jobId,
            completedAt: inspectionInstances.completedAt,
          })
          .from(inspectionInstances)
          .where(and(eq(inspectionInstances.id, inspectionId), eq(inspectionInstances.organizationId, organizationId)))
          .limit(1);

        if (!insp.length) return res.status(404).json({ message: "Inspection not found" });
        if (insp[0].completedAt) return res.status(409).json({ message: "Inspection is completed" });

        // Verify job belongs to org (via job.userId -> user.organizationId)
        const access = await requireJobInOrg(String(insp[0].jobId), organizationId);
        if (!access.ok) return res.status(access.status).json({ message: access.message });

        // Verify row belongs to org
        const row = await db
          .select({ id: formEntityRows.id })
          .from(formEntityRows)
          .where(and(eq(formEntityRows.id, rowId), eq(formEntityRows.organizationId, organizationId)))
          .limit(1);
        if (!row.length) return res.status(400).json({ message: "Invalid rowId" });

        const f = (req as any).file;
        if (!f) return res.status(400).json({ message: "No file uploaded (field name must be 'file')" });

        // Store metadata
        const insertedFile = await db
          .insert(files)
          .values({
            organizationId,
            storage: "local",
            path: f.filename,
            originalName: f.originalname,
            mimeType: f.mimetype,
            sizeBytes: f.size,
            createdByUserId: userId,
          })
          .returning({ id: files.id, originalName: files.originalName, mimeType: files.mimeType, sizeBytes: files.sizeBytes });

        const insertedLink = await db
          .insert(inspectionRowAttachments)
          .values({
            organizationId,
            inspectionId,
            rowId,
            fileId: insertedFile[0].id,
            createdByUserId: userId,
          })
          .returning({ id: inspectionRowAttachments.id });

        res.json({
          attachment: {
            id: insertedLink[0].id,
            fileId: insertedFile[0].id,
            rowId,
            originalName: insertedFile[0].originalName,
            mimeType: insertedFile[0].mimeType,
            sizeBytes: insertedFile[0].sizeBytes,
          },
        });
      } catch (err: any) {
        res.status(400).json({ message: err.message || "Upload failed" });
      }
    }
  );

  // GET /api/inspections/:id/attachments  -> grouped by rowId
  apiRouter.get("/inspections/:id/attachments", async (req, res) => {
    try {
      const { organizationId } = await requireUserOrgId(req);
      const inspectionId = String(req.params.id || "");
      if (!inspectionId) return res.status(400).json({ message: "Invalid inspection id" });

      const insp = await db
        .select({ id: inspectionInstances.id, jobId: inspectionInstances.jobId })
        .from(inspectionInstances)
        .where(and(eq(inspectionInstances.id, inspectionId), eq(inspectionInstances.organizationId, organizationId)))
        .limit(1);

      if (!insp.length) return res.status(404).json({ message: "Inspection not found" });

      const access = await requireJobInOrg(String(insp[0].jobId), organizationId);
      if (!access.ok) return res.status(access.status).json({ message: access.message });

      const rows = await db
        .select({
          attachmentId: inspectionRowAttachments.id,
          rowId: inspectionRowAttachments.rowId,
          fileId: files.id,
          originalName: files.originalName,
          mimeType: files.mimeType,
          sizeBytes: files.sizeBytes,
          createdAt: inspectionRowAttachments.createdAt,
        })
        .from(inspectionRowAttachments)
        .innerJoin(files, eq(files.id, inspectionRowAttachments.fileId))
        .where(and(eq(inspectionRowAttachments.organizationId, organizationId), eq(inspectionRowAttachments.inspectionId, inspectionId)))
        .orderBy(desc(inspectionRowAttachments.createdAt));

      res.json({ attachments: rows });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Failed to load attachments" });
    }
  });

  // ─────────────────────────────────────────────
  // PDF EXPORT (AUTH)
  // ─────────────────────────────────────────────
  function getBaseUrl(req: any) {
    // Prefer explicit public URL if set (recommended for Replit)
    const publicUrl = process.env.PUBLIC_BASE_URL;
    if (publicUrl) return publicUrl.replace(/\/$/, "");

    // Fall back to request host
    const proto = (req.headers["x-forwarded-proto"] as string) || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  apiRouter.get("/inspections/:id/pdf", async (req, res) => {
    try {
      const { organizationId } = await requireUserOrgId(req);
      const inspectionId = String(req.params.id || "");
      if (!inspectionId) return res.status(400).json({ message: "Invalid inspection id" });

      const insp = await db
        .select({
          id: inspectionInstances.id,
          jobId: inspectionInstances.jobId,
          templateId: inspectionInstances.templateId,
          systemTypeId: inspectionInstances.systemTypeId,
          completedAt: inspectionInstances.completedAt,
        })
        .from(inspectionInstances)
        .where(and(eq(inspectionInstances.id, inspectionId), eq(inspectionInstances.organizationId, organizationId)))
        .limit(1);

      if (!insp.length) return res.status(404).json({ message: "Inspection not found" });
      if (!insp[0].completedAt) return res.status(409).json({ message: "Inspection not completed" });

      const access = await requireJobInOrg(String(insp[0].jobId), organizationId);
      if (!access.ok) return res.status(access.status).json({ message: access.message });

      const tpl = await db
        .select({ id: formTemplates.id, name: formTemplates.name })
        .from(formTemplates)
        .where(and(eq(formTemplates.id, insp[0].templateId), eq(formTemplates.organizationId, organizationId)))
        .limit(1);
      if (!tpl.length) return res.status(404).json({ message: "Template not found" });

      const sys = await db
        .select({ id: systemTypes.id, name: systemTypes.name })
        .from(systemTypes)
        .where(and(eq(systemTypes.id, insp[0].systemTypeId), eq(systemTypes.organizationId, organizationId)))
        .limit(1);
      if (!sys.length) return res.status(404).json({ message: "System type not found" });

      const te = await db
        .select({
          entityId: formTemplateEntities.entityId,
          sortOrder: formTemplateEntities.sortOrder,
          title: formEntities.title,
          description: formEntities.description,
        })
        .from(formTemplateEntities)
        .innerJoin(formEntities, eq(formEntities.id, formTemplateEntities.entityId))
        .where(and(eq(formTemplateEntities.templateId, insp[0].templateId), eq(formTemplateEntities.organizationId, organizationId)))
        .orderBy(formTemplateEntities.sortOrder);

      const entityIds = te.map((x) => x.entityId);

      const rows = entityIds.length
        ? await db
            .select({
              id: formEntityRows.id,
              entityId: formEntityRows.entityId,
              sortOrder: formEntityRows.sortOrder,
              component: formEntityRows.component,
              activity: formEntityRows.activity,
              reference: formEntityRows.reference,
              fieldType: formEntityRows.fieldType,
              units: formEntityRows.units,
              evidenceRequired: formEntityRows.evidenceRequired,
            })
            .from(formEntityRows)
            .where(and(eq(formEntityRows.organizationId, organizationId), inArray(formEntityRows.entityId, entityIds)))
            .orderBy(formEntityRows.entityId, formEntityRows.sortOrder)
        : [];

      const resp = await db
        .select({
          rowId: inspectionResponses.rowId,
          valueText: inspectionResponses.valueText,
          valueNumber: inspectionResponses.valueNumber,
          valueBool: inspectionResponses.valueBool,
          comment: inspectionResponses.comment,
          createdAt: inspectionResponses.createdAt,
        })
        .from(inspectionResponses)
        .where(and(eq(inspectionResponses.organizationId, organizationId), eq(inspectionResponses.inspectionId, inspectionId)))
        .orderBy(desc(inspectionResponses.createdAt));

      const latestByRow = new Map<string, any>();
      for (const r of resp) {
        if (!latestByRow.has(r.rowId)) latestByRow.set(r.rowId, r);
      }

      // Attachments (names + local path + mime type for thumbnails)
      const atts = await db
        .select({
          rowId: inspectionRowAttachments.rowId,
          fileId: files.id,
          originalName: files.originalName,
          mimeType: files.mimeType,
          path: files.path,
          storage: files.storage,
        })
        .from(inspectionRowAttachments)
        .innerJoin(files, eq(files.id, inspectionRowAttachments.fileId))
        .where(and(eq(inspectionRowAttachments.organizationId, organizationId), eq(inspectionRowAttachments.inspectionId, inspectionId)))
        .orderBy(desc(inspectionRowAttachments.createdAt));

      const baseUrl = getBaseUrl(req);
      const attachmentsByRowId = new Map<string, Array<{ originalName: string; mimeType?: string | null; localPath?: string | null; downloadUrl?: string | null }>>();
      for (const a of atts) {
        const list = attachmentsByRowId.get(a.rowId) ?? [];

        // local storage: absolute file path for PDF embedding
        let localPath: string | null = null;
        if ((a.storage ?? "local") === "local") {
          localPath = path.join(UPLOAD_ROOT, a.path);
        }

        list.push({
          originalName: a.originalName,
          mimeType: a.mimeType,
          localPath,
          downloadUrl: `${baseUrl}/api/files/${encodeURIComponent(a.fileId)}/download`,
        });

        attachmentsByRowId.set(a.rowId, list);
      }

      const payload = {
        inspectionId,
        templateName: tpl[0].name,
        systemTypeName: sys[0].name,
        jobId: String(insp[0].jobId),
        completedAt: new Date(insp[0].completedAt as any).toISOString(),
        entities: te.map((e) => ({
          title: e.title,
          description: e.description ?? null,
          rows: rows
            .filter((r) => r.entityId === e.entityId)
            .map((r) => {
              const lr = latestByRow.get(r.id);
              let value = "—";
              if (lr) {
                if (lr.valueBool === true) value = "Pass";
                else if (lr.valueBool === false) value = "Fail";
                else if (lr.valueNumber) value = String(lr.valueNumber);
                else if (lr.valueText) value = String(lr.valueText);
              }
              return {
                component: r.component,
                activity: r.activity,
                reference: r.reference ?? null,
                fieldType: String(r.fieldType),
                units: r.units ?? null,
                evidenceRequired: !!r.evidenceRequired,
                value,
                comment: lr?.comment ?? null,
                attachments: attachmentsByRowId.get(r.id) ?? [],
              };
            }),
        })),
      };

      const doc = buildInspectionPdf(payload);

      const filenameSafe = `${payload.jobId}_${payload.templateName}`.replace(/[^a-zA-Z0-9._-]/g, "_");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filenameSafe}.pdf"`);

      doc.pipe(res);
      doc.end();
    } catch (err: any) {
      res.status(400).json({ message: err.message || "PDF generation failed" });
    }
  });

  // GET /api/files/:fileId/download  (auth + tenant check)
  apiRouter.get("/files/:fileId/download", async (req, res) => {
    try {
      const { organizationId } = await requireUserOrgId(req);
      const fileId = String(req.params.fileId || "");
      if (!fileId) return res.status(400).json({ message: "Invalid file id" });

      const f = await db
        .select({
          id: files.id,
          org: files.organizationId,
          path: files.path,
          originalName: files.originalName,
          mimeType: files.mimeType,
        })
        .from(files)
        .where(and(eq(files.id, fileId), eq(files.organizationId, organizationId)))
        .limit(1);

      if (!f.length) return res.status(404).json({ message: "Not found" });

      const abs = path.join(UPLOAD_ROOT, f[0].path);
      if (!fs.existsSync(abs)) return res.status(404).json({ message: "File missing on disk" });

      if (f[0].mimeType) res.setHeader("Content-Type", f[0].mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${f[0].originalName.replace(/"/g, "")}"`);
      fs.createReadStream(abs).pipe(res);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Download failed" });
    }
  });

  // ============================================
  // MOUNT AUTHENTICATED API ROUTER
  // ============================================
  app.use("/api", isAuthenticated, apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
