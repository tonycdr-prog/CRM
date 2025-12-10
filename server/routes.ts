import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================
  // SYNC API ROUTES
  // ============================================
  
  // Get all data for a user (for initial sync)
  app.get("/api/sync/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
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
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sync data" });
    }
  });

  // Sync data from client
  app.post("/api/sync/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await storage.syncData(userId, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to sync data" });
    }
  });

  // Get sync status
  app.get("/api/sync/:userId/status", async (req, res) => {
    try {
      const { userId } = req.params;
      const status = await storage.getSyncStatus(userId);
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get sync status" });
    }
  });

  // ============================================
  // PROJECT ROUTES
  // ============================================
  
  app.get("/api/projects/:userId", async (req, res) => {
    try {
      const projects = await storage.getProjects(req.params.userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const project = await storage.createProject(req.body);
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.updateProject(req.params.id, req.body);
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // ============================================
  // TEST ROUTES
  // ============================================
  
  app.get("/api/tests/:userId", async (req, res) => {
    try {
      const tests = await storage.getTests(req.params.userId);
      res.json(tests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tests" });
    }
  });

  app.post("/api/tests", async (req, res) => {
    try {
      const test = await storage.createTest(req.body);
      res.json(test);
    } catch (error) {
      res.status(500).json({ error: "Failed to create test" });
    }
  });

  app.patch("/api/tests/:id", async (req, res) => {
    try {
      const test = await storage.updateTest(req.params.id, req.body);
      res.json(test);
    } catch (error) {
      res.status(500).json({ error: "Failed to update test" });
    }
  });

  app.delete("/api/tests/:id", async (req, res) => {
    try {
      await storage.deleteTest(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete test" });
    }
  });

  // ============================================
  // TEST PACK ROUTES
  // ============================================
  
  app.get("/api/test-packs/:userId", async (req, res) => {
    try {
      const packs = await storage.getTestPacks(req.params.userId);
      res.json(packs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch test packs" });
    }
  });

  app.post("/api/test-packs", async (req, res) => {
    try {
      const pack = await storage.createTestPack(req.body);
      res.json(pack);
    } catch (error) {
      res.status(500).json({ error: "Failed to create test pack" });
    }
  });

  app.delete("/api/test-packs/:id", async (req, res) => {
    try {
      await storage.deleteTestPack(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete test pack" });
    }
  });

  // ============================================
  // TEST SESSION ROUTES (Floor Sequencing)
  // ============================================
  
  app.get("/api/test-sessions/:userId", async (req, res) => {
    try {
      const sessions = await storage.getTestSessions(req.params.userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch test sessions" });
    }
  });

  app.get("/api/test-sessions/detail/:id", async (req, res) => {
    try {
      const session = await storage.getTestSession(req.params.id);
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch test session" });
    }
  });

  app.post("/api/test-sessions", async (req, res) => {
    try {
      const session = await storage.createTestSession(req.body);
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to create test session" });
    }
  });

  app.patch("/api/test-sessions/:id", async (req, res) => {
    try {
      const session = await storage.updateTestSession(req.params.id, req.body);
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to update test session" });
    }
  });

  app.delete("/api/test-sessions/:id", async (req, res) => {
    try {
      await storage.deleteTestSession(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete test session" });
    }
  });

  // ============================================
  // COMPLIANCE CHECKLIST ROUTES
  // ============================================
  
  app.get("/api/compliance-checklists/:userId", async (req, res) => {
    try {
      const checklists = await storage.getComplianceChecklists(req.params.userId);
      res.json(checklists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch compliance checklists" });
    }
  });

  app.post("/api/compliance-checklists", async (req, res) => {
    try {
      const checklist = await storage.createComplianceChecklist(req.body);
      res.json(checklist);
    } catch (error) {
      res.status(500).json({ error: "Failed to create compliance checklist" });
    }
  });

  app.patch("/api/compliance-checklists/:id", async (req, res) => {
    try {
      const checklist = await storage.updateComplianceChecklist(req.params.id, req.body);
      res.json(checklist);
    } catch (error) {
      res.status(500).json({ error: "Failed to update compliance checklist" });
    }
  });

  // ============================================
  // DAMPER TEMPLATE ROUTES
  // ============================================
  
  app.get("/api/damper-templates/:userId", async (req, res) => {
    try {
      const templates = await storage.getDamperTemplates(req.params.userId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch damper templates" });
    }
  });

  app.post("/api/damper-templates", async (req, res) => {
    try {
      const template = await storage.createDamperTemplate(req.body);
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to create damper template" });
    }
  });

  app.delete("/api/damper-templates/:id", async (req, res) => {
    try {
      await storage.deleteDamperTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete damper template" });
    }
  });

  // ============================================
  // STAIRWELL TEST ROUTES
  // ============================================
  
  app.get("/api/stairwell-tests/:userId", async (req, res) => {
    try {
      const tests = await storage.getStairwellTests(req.params.userId);
      res.json(tests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stairwell tests" });
    }
  });

  app.post("/api/stairwell-tests", async (req, res) => {
    try {
      const test = await storage.createStairwellTest(req.body);
      res.json(test);
    } catch (error) {
      res.status(500).json({ error: "Failed to create stairwell test" });
    }
  });

  app.delete("/api/stairwell-tests/:id", async (req, res) => {
    try {
      await storage.deleteStairwellTest(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete stairwell test" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
