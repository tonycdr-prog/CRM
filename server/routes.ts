import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { hashPassword, verifyPassword } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================
  // AUTH SETUP (Replit Auth)
  // ============================================
  await setupAuth(app);

  // Get current authenticated user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

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

  // ============================================
  // BUSINESS MANAGEMENT - CLIENTS
  // ============================================

  app.get("/api/clients/:userId", async (req, res) => {
    try {
      const clients = await storage.getClients(req.params.userId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/detail/:id", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const client = await storage.createClient(req.body);
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to create client" });
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.updateClient(req.params.id, req.body);
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      await storage.deleteClient(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete client" });
    }
  });

  // ============================================
  // BUSINESS MANAGEMENT - CONTRACTS
  // ============================================

  app.get("/api/contracts/:userId", async (req, res) => {
    try {
      const contracts = await storage.getContracts(req.params.userId);
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  app.get("/api/contracts/detail/:id", async (req, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract" });
    }
  });

  app.post("/api/contracts", async (req, res) => {
    try {
      const contract = await storage.createContract(req.body);
      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to create contract" });
    }
  });

  app.patch("/api/contracts/:id", async (req, res) => {
    try {
      const contract = await storage.updateContract(req.params.id, req.body);
      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to update contract" });
    }
  });

  app.delete("/api/contracts/:id", async (req, res) => {
    try {
      await storage.deleteContract(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contract" });
    }
  });

  // ============================================
  // BUSINESS MANAGEMENT - JOBS
  // ============================================

  app.get("/api/jobs/:userId", async (req, res) => {
    try {
      const jobs = await storage.getJobs(req.params.userId);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/detail/:id", async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      const job = await storage.createJob(req.body);
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to create job" });
    }
  });

  app.patch("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.updateJob(req.params.id, req.body);
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to update job" });
    }
  });

  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      await storage.deleteJob(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete job" });
    }
  });

  // ============================================
  // BUSINESS MANAGEMENT - QUOTES
  // ============================================

  app.get("/api/quotes/:userId", async (req, res) => {
    try {
      const quotes = await storage.getQuotes(req.params.userId);
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  app.get("/api/quotes/detail/:id", async (req, res) => {
    try {
      const quote = await storage.getQuote(req.params.id);
      res.json(quote);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quote" });
    }
  });

  app.post("/api/quotes", async (req, res) => {
    try {
      const quote = await storage.createQuote(req.body);
      res.json(quote);
    } catch (error) {
      res.status(500).json({ error: "Failed to create quote" });
    }
  });

  app.patch("/api/quotes/:id", async (req, res) => {
    try {
      const quote = await storage.updateQuote(req.params.id, req.body);
      res.json(quote);
    } catch (error) {
      res.status(500).json({ error: "Failed to update quote" });
    }
  });

  app.delete("/api/quotes/:id", async (req, res) => {
    try {
      await storage.deleteQuote(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete quote" });
    }
  });

  // ============================================
  // BUSINESS MANAGEMENT - INVOICES
  // ============================================

  app.get("/api/invoices/:userId", async (req, res) => {
    try {
      const invoices = await storage.getInvoices(req.params.userId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/detail/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const invoice = await storage.createInvoice(req.body);
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  app.patch("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.updateInvoice(req.params.id, req.body);
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      await storage.deleteInvoice(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete invoice" });
    }
  });

  // ============================================
  // BUSINESS MANAGEMENT - EXPENSES
  // ============================================

  app.get("/api/expenses/:userId", async (req, res) => {
    try {
      const expenses = await storage.getExpenses(req.params.userId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const expense = await storage.createExpense(req.body);
      res.json(expense);
    } catch (error) {
      res.status(500).json({ error: "Failed to create expense" });
    }
  });

  app.patch("/api/expenses/:id", async (req, res) => {
    try {
      const expense = await storage.updateExpense(req.params.id, req.body);
      res.json(expense);
    } catch (error) {
      res.status(500).json({ error: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      await storage.deleteExpense(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  // ============================================
  // BUSINESS MANAGEMENT - TIMESHEETS
  // ============================================

  app.get("/api/timesheets/:userId", async (req, res) => {
    try {
      const timesheets = await storage.getTimesheets(req.params.userId);
      res.json(timesheets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch timesheets" });
    }
  });

  app.post("/api/timesheets", async (req, res) => {
    try {
      const timesheet = await storage.createTimesheet(req.body);
      res.json(timesheet);
    } catch (error) {
      res.status(500).json({ error: "Failed to create timesheet" });
    }
  });

  app.patch("/api/timesheets/:id", async (req, res) => {
    try {
      const timesheet = await storage.updateTimesheet(req.params.id, req.body);
      res.json(timesheet);
    } catch (error) {
      res.status(500).json({ error: "Failed to update timesheet" });
    }
  });

  app.delete("/api/timesheets/:id", async (req, res) => {
    try {
      await storage.deleteTimesheet(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete timesheet" });
    }
  });

  // ============================================
  // BUSINESS MANAGEMENT - VEHICLES
  // ============================================

  app.get("/api/vehicles/:userId", async (req, res) => {
    try {
      const vehicles = await storage.getVehicles(req.params.userId);
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const vehicle = await storage.createVehicle(req.body);
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Failed to create vehicle" });
    }
  });

  app.patch("/api/vehicles/:id", async (req, res) => {
    try {
      const vehicle = await storage.updateVehicle(req.params.id, req.body);
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Failed to update vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      await storage.deleteVehicle(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete vehicle" });
    }
  });

  // ============================================
  // BUSINESS MANAGEMENT - VEHICLE BOOKINGS
  // ============================================

  app.get("/api/vehicle-bookings/:userId", async (req, res) => {
    try {
      const bookings = await storage.getVehicleBookings(req.params.userId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle bookings" });
    }
  });

  app.post("/api/vehicle-bookings", async (req, res) => {
    try {
      const booking = await storage.createVehicleBooking(req.body);
      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: "Failed to create vehicle booking" });
    }
  });

  app.patch("/api/vehicle-bookings/:id", async (req, res) => {
    try {
      const booking = await storage.updateVehicleBooking(req.params.id, req.body);
      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: "Failed to update vehicle booking" });
    }
  });

  app.delete("/api/vehicle-bookings/:id", async (req, res) => {
    try {
      await storage.deleteVehicleBooking(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete vehicle booking" });
    }
  });

  // ============================================
  // BUSINESS MANAGEMENT - SUBCONTRACTORS
  // ============================================

  app.get("/api/subcontractors/:userId", async (req, res) => {
    try {
      const subcontractors = await storage.getSubcontractors(req.params.userId);
      res.json(subcontractors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subcontractors" });
    }
  });

  app.post("/api/subcontractors", async (req, res) => {
    try {
      const subcontractor = await storage.createSubcontractor(req.body);
      res.json(subcontractor);
    } catch (error) {
      res.status(500).json({ error: "Failed to create subcontractor" });
    }
  });

  app.patch("/api/subcontractors/:id", async (req, res) => {
    try {
      const subcontractor = await storage.updateSubcontractor(req.params.id, req.body);
      res.json(subcontractor);
    } catch (error) {
      res.status(500).json({ error: "Failed to update subcontractor" });
    }
  });

  app.delete("/api/subcontractors/:id", async (req, res) => {
    try {
      await storage.deleteSubcontractor(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete subcontractor" });
    }
  });

  // ============================================
  // BUSINESS MANAGEMENT - DOCUMENTS
  // ============================================

  app.get("/api/documents/:userId", async (req, res) => {
    try {
      const documents = await storage.getDocuments(req.params.userId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const document = await storage.createDocument(req.body);
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.patch("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.updateDocument(req.params.id, req.body);
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      await storage.deleteDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // ============================================
  // BUSINESS MANAGEMENT - COMMUNICATION LOGS
  // ============================================

  app.get("/api/communication-logs/:userId", async (req, res) => {
    try {
      const logs = await storage.getCommunicationLogs(req.params.userId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch communication logs" });
    }
  });

  app.post("/api/communication-logs", async (req, res) => {
    try {
      const log = await storage.createCommunicationLog(req.body);
      res.json(log);
    } catch (error) {
      res.status(500).json({ error: "Failed to create communication log" });
    }
  });

  // ============================================
  // BUSINESS MANAGEMENT - SURVEYS
  // ============================================

  app.get("/api/surveys/:userId", async (req, res) => {
    try {
      const surveys = await storage.getSurveys(req.params.userId);
      res.json(surveys);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch surveys" });
    }
  });

  app.post("/api/surveys", async (req, res) => {
    try {
      const survey = await storage.createSurvey(req.body);
      res.json(survey);
    } catch (error) {
      res.status(500).json({ error: "Failed to create survey" });
    }
  });

  app.patch("/api/surveys/:id", async (req, res) => {
    try {
      const survey = await storage.updateSurvey(req.params.id, req.body);
      res.json(survey);
    } catch (error) {
      res.status(500).json({ error: "Failed to update survey" });
    }
  });

  // ============================================
  // BUSINESS MANAGEMENT - ABSENCES (Holidays)
  // ============================================

  app.get("/api/absences/:userId", async (req, res) => {
    try {
      const absences = await storage.getAbsences(req.params.userId);
      res.json(absences);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch absences" });
    }
  });

  app.post("/api/absences", async (req, res) => {
    try {
      const absence = await storage.createAbsence(req.body);
      res.json(absence);
    } catch (error) {
      res.status(500).json({ error: "Failed to create absence" });
    }
  });

  app.patch("/api/absences/:id", async (req, res) => {
    try {
      const absence = await storage.updateAbsence(req.params.id, req.body);
      res.json(absence);
    } catch (error) {
      res.status(500).json({ error: "Failed to update absence" });
    }
  });

  app.delete("/api/absences/:id", async (req, res) => {
    try {
      await storage.deleteAbsence(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete absence" });
    }
  });

  // ============================================
  // BUSINESS MANAGEMENT - REMINDERS
  // ============================================

  app.get("/api/reminders/:userId", async (req, res) => {
    try {
      const reminders = await storage.getReminders(req.params.userId);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reminders" });
    }
  });

  app.post("/api/reminders", async (req, res) => {
    try {
      const reminder = await storage.createReminder(req.body);
      res.json(reminder);
    } catch (error) {
      res.status(500).json({ error: "Failed to create reminder" });
    }
  });

  app.patch("/api/reminders/:id", async (req, res) => {
    try {
      const reminder = await storage.updateReminder(req.params.id, req.body);
      res.json(reminder);
    } catch (error) {
      res.status(500).json({ error: "Failed to update reminder" });
    }
  });

  app.delete("/api/reminders/:id", async (req, res) => {
    try {
      await storage.deleteReminder(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete reminder" });
    }
  });

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

  app.get("/api/job-templates/:userId", async (req, res) => {
    try {
      const templates = await storage.getJobTemplates(req.params.userId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job templates" });
    }
  });

  app.post("/api/job-templates", async (req, res) => {
    try {
      const template = await storage.createJobTemplate(req.body);
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to create job template" });
    }
  });

  app.delete("/api/job-templates/:id", async (req, res) => {
    try {
      await storage.deleteJobTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete job template" });
    }
  });

  // ============================================
  // SITE ACCESS NOTES ROUTES
  // ============================================

  app.get("/api/site-access/:userId", async (req, res) => {
    try {
      const notes = await storage.getSiteAccessNotes(req.params.userId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch site access notes" });
    }
  });

  app.post("/api/site-access", async (req, res) => {
    try {
      const note = await storage.createSiteAccessNote(req.body);
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to create site access note" });
    }
  });

  app.patch("/api/site-access/:id", async (req, res) => {
    try {
      const note = await storage.updateSiteAccessNote(req.params.id, req.body);
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to update site access note" });
    }
  });

  app.delete("/api/site-access/:id", async (req, res) => {
    try {
      await storage.deleteSiteAccessNote(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete site access note" });
    }
  });

  // ============================================
  // EQUIPMENT ROUTES
  // ============================================

  app.get("/api/equipment/:userId", async (req, res) => {
    try {
      const items = await storage.getEquipment(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });

  app.post("/api/equipment", async (req, res) => {
    try {
      const item = await storage.createEquipment(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create equipment" });
    }
  });

  app.patch("/api/equipment/:id", async (req, res) => {
    try {
      const item = await storage.updateEquipment(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update equipment" });
    }
  });

  app.delete("/api/equipment/:id", async (req, res) => {
    try {
      await storage.deleteEquipment(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete equipment" });
    }
  });

  // ============================================
  // CERTIFICATIONS ROUTES
  // ============================================

  app.get("/api/certifications/:userId", async (req, res) => {
    try {
      const certs = await storage.getCertifications(req.params.userId);
      res.json(certs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch certifications" });
    }
  });

  app.post("/api/certifications", async (req, res) => {
    try {
      const cert = await storage.createCertification(req.body);
      res.json(cert);
    } catch (error) {
      res.status(500).json({ error: "Failed to create certification" });
    }
  });

  app.patch("/api/certifications/:id", async (req, res) => {
    try {
      const cert = await storage.updateCertification(req.params.id, req.body);
      res.json(cert);
    } catch (error) {
      res.status(500).json({ error: "Failed to update certification" });
    }
  });

  app.delete("/api/certifications/:id", async (req, res) => {
    try {
      await storage.deleteCertification(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete certification" });
    }
  });

  // ============================================
  // INCIDENTS ROUTES
  // ============================================

  app.get("/api/incidents/:userId", async (req, res) => {
    try {
      const incidents = await storage.getIncidents(req.params.userId);
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch incidents" });
    }
  });

  app.post("/api/incidents", async (req, res) => {
    try {
      const incident = await storage.createIncident(req.body);
      res.json(incident);
    } catch (error) {
      res.status(500).json({ error: "Failed to create incident" });
    }
  });

  app.patch("/api/incidents/:id", async (req, res) => {
    try {
      const incident = await storage.updateIncident(req.params.id, req.body);
      res.json(incident);
    } catch (error) {
      res.status(500).json({ error: "Failed to update incident" });
    }
  });

  app.delete("/api/incidents/:id", async (req, res) => {
    try {
      await storage.deleteIncident(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete incident" });
    }
  });

  // ============================================
  // AUDIT LOGS ROUTES
  // ============================================

  app.get("/api/audit-logs/:userId", async (req, res) => {
    try {
      const logs = await storage.getAuditLogs(req.params.userId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  app.post("/api/audit-logs", async (req, res) => {
    try {
      const log = await storage.createAuditLog(req.body);
      res.json(log);
    } catch (error) {
      res.status(500).json({ error: "Failed to create audit log" });
    }
  });

  // ============================================
  // LEADS ROUTES
  // ============================================

  app.get("/api/leads/:userId", async (req, res) => {
    try {
      const leads = await storage.getLeads(req.params.userId);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const lead = await storage.createLead(req.body);
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  app.patch("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.updateLead(req.params.id, req.body);
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", async (req, res) => {
    try {
      await storage.deleteLead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  // ============================================
  // TENDERS ROUTES
  // ============================================

  app.get("/api/tenders/:userId", async (req, res) => {
    try {
      const tenders = await storage.getTenders(req.params.userId);
      res.json(tenders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tenders" });
    }
  });

  app.post("/api/tenders", async (req, res) => {
    try {
      const tender = await storage.createTender(req.body);
      res.json(tender);
    } catch (error) {
      res.status(500).json({ error: "Failed to create tender" });
    }
  });

  app.patch("/api/tenders/:id", async (req, res) => {
    try {
      const tender = await storage.updateTender(req.params.id, req.body);
      res.json(tender);
    } catch (error) {
      res.status(500).json({ error: "Failed to update tender" });
    }
  });

  app.delete("/api/tenders/:id", async (req, res) => {
    try {
      await storage.deleteTender(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete tender" });
    }
  });

  // ============================================
  // RECURRING SCHEDULES ROUTES
  // ============================================

  app.get("/api/recurring-schedules/:userId", async (req, res) => {
    try {
      const schedules = await storage.getRecurringSchedules(req.params.userId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recurring schedules" });
    }
  });

  app.post("/api/recurring-schedules", async (req, res) => {
    try {
      const schedule = await storage.createRecurringSchedule(req.body);
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ error: "Failed to create recurring schedule" });
    }
  });

  app.patch("/api/recurring-schedules/:id", async (req, res) => {
    try {
      const schedule = await storage.updateRecurringSchedule(req.params.id, req.body);
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ error: "Failed to update recurring schedule" });
    }
  });

  app.delete("/api/recurring-schedules/:id", async (req, res) => {
    try {
      await storage.deleteRecurringSchedule(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete recurring schedule" });
    }
  });

  // ============================================
  // RISK ASSESSMENTS ROUTES
  // ============================================

  app.get("/api/risk-assessments/:userId", async (req, res) => {
    try {
      const assessments = await storage.getRiskAssessments(req.params.userId);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risk assessments" });
    }
  });

  app.post("/api/risk-assessments", async (req, res) => {
    try {
      const assessment = await storage.createRiskAssessment(req.body);
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create risk assessment" });
    }
  });

  app.patch("/api/risk-assessments/:id", async (req, res) => {
    try {
      const assessment = await storage.updateRiskAssessment(req.params.id, req.body);
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update risk assessment" });
    }
  });

  app.delete("/api/risk-assessments/:id", async (req, res) => {
    try {
      await storage.deleteRiskAssessment(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete risk assessment" });
    }
  });

  // ============================================
  // PERFORMANCE METRICS ROUTES
  // ============================================

  app.get("/api/performance-metrics/:userId", async (req, res) => {
    try {
      const metrics = await storage.getPerformanceMetrics(req.params.userId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch performance metrics" });
    }
  });

  app.post("/api/performance-metrics", async (req, res) => {
    try {
      const metric = await storage.createPerformanceMetric(req.body);
      res.json(metric);
    } catch (error) {
      res.status(500).json({ error: "Failed to create performance metric" });
    }
  });

  // ============================================
  // NOTIFICATIONS ROUTES
  // ============================================

  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.params.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const notification = await storage.createNotification(req.body);
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id", async (req, res) => {
    try {
      const notification = await storage.updateNotification(req.params.id, req.body);
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to update notification" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // ============================================
  // RECURRING JOBS ROUTES
  // ============================================

  app.get("/api/recurring-jobs/:userId", async (req, res) => {
    try {
      const jobs = await storage.getRecurringJobs(req.params.userId);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recurring jobs" });
    }
  });

  app.post("/api/recurring-jobs", async (req, res) => {
    try {
      const job = await storage.createRecurringJob(req.body);
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to create recurring job" });
    }
  });

  app.patch("/api/recurring-jobs/:id", async (req, res) => {
    try {
      const job = await storage.updateRecurringJob(req.params.id, req.body);
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to update recurring job" });
    }
  });

  app.delete("/api/recurring-jobs/:id", async (req, res) => {
    try {
      await storage.deleteRecurringJob(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete recurring job" });
    }
  });

  // ============================================
  // JOB CHECKLISTS ROUTES
  // ============================================

  app.get("/api/job-checklists/:userId", async (req, res) => {
    try {
      const checklists = await storage.getJobChecklists(req.params.userId);
      res.json(checklists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job checklists" });
    }
  });

  app.get("/api/job-checklists/job/:jobId", async (req, res) => {
    try {
      const checklist = await storage.getJobChecklistByJobId(req.params.jobId);
      res.json(checklist || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job checklist" });
    }
  });

  app.post("/api/job-checklists", async (req, res) => {
    try {
      const checklist = await storage.createJobChecklist(req.body);
      res.json(checklist);
    } catch (error) {
      res.status(500).json({ error: "Failed to create job checklist" });
    }
  });

  app.patch("/api/job-checklists/:id", async (req, res) => {
    try {
      const checklist = await storage.updateJobChecklist(req.params.id, req.body);
      res.json(checklist);
    } catch (error) {
      res.status(500).json({ error: "Failed to update job checklist" });
    }
  });

  app.delete("/api/job-checklists/:id", async (req, res) => {
    try {
      await storage.deleteJobChecklist(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete job checklist" });
    }
  });

  // ============================================
  // SUPPLIERS ROUTES
  // ============================================

  app.get("/api/suppliers/:userId", async (req, res) => {
    try {
      const suppliersList = await storage.getSuppliers(req.params.userId);
      res.json(suppliersList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplier = await storage.createSupplier(req.body);
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });

  app.patch("/api/suppliers/:id", async (req, res) => {
    try {
      const supplier = await storage.updateSupplier(req.params.id, req.body);
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ error: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      await storage.deleteSupplier(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  });

  // ============================================
  // PURCHASE ORDERS ROUTES
  // ============================================

  app.get("/api/purchase-orders/:userId", async (req, res) => {
    try {
      const orders = await storage.getPurchaseOrders(req.params.userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch purchase orders" });
    }
  });

  app.post("/api/purchase-orders", async (req, res) => {
    try {
      const order = await storage.createPurchaseOrder(req.body);
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to create purchase order" });
    }
  });

  app.patch("/api/purchase-orders/:id", async (req, res) => {
    try {
      const order = await storage.updatePurchaseOrder(req.params.id, req.body);
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update purchase order" });
    }
  });

  app.delete("/api/purchase-orders/:id", async (req, res) => {
    try {
      await storage.deletePurchaseOrder(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete purchase order" });
    }
  });

  // ============================================
  // TRAINING RECORDS ROUTES
  // ============================================

  app.get("/api/training-records/:userId", async (req, res) => {
    try {
      const records = await storage.getTrainingRecords(req.params.userId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch training records" });
    }
  });

  app.post("/api/training-records", async (req, res) => {
    try {
      const record = await storage.createTrainingRecord(req.body);
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: "Failed to create training record" });
    }
  });

  app.patch("/api/training-records/:id", async (req, res) => {
    try {
      const record = await storage.updateTrainingRecord(req.params.id, req.body);
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: "Failed to update training record" });
    }
  });

  app.delete("/api/training-records/:id", async (req, res) => {
    try {
      await storage.deleteTrainingRecord(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete training record" });
    }
  });

  // ============================================
  // INVENTORY ROUTES
  // ============================================

  app.get("/api/inventory/:userId", async (req, res) => {
    try {
      const items = await storage.getInventory(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const item = await storage.createInventoryItem(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create inventory item" });
    }
  });

  app.patch("/api/inventory/:id", async (req, res) => {
    try {
      const item = await storage.updateInventoryItem(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update inventory item" });
    }
  });

  app.delete("/api/inventory/:id", async (req, res) => {
    try {
      await storage.deleteInventoryItem(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete inventory item" });
    }
  });

  // ============================================
  // DEFECTS ROUTES
  // ============================================

  app.get("/api/defects/:userId", async (req, res) => {
    try {
      const defects = await storage.getDefects(req.params.userId);
      res.json(defects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch defects" });
    }
  });

  app.post("/api/defects", async (req, res) => {
    try {
      const defect = await storage.createDefect(req.body);
      res.json(defect);
    } catch (error) {
      res.status(500).json({ error: "Failed to create defect" });
    }
  });

  app.patch("/api/defects/:id", async (req, res) => {
    try {
      const defect = await storage.updateDefect(req.params.id, req.body);
      res.json(defect);
    } catch (error) {
      res.status(500).json({ error: "Failed to update defect" });
    }
  });

  app.delete("/api/defects/:id", async (req, res) => {
    try {
      await storage.deleteDefect(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete defect" });
    }
  });

  // ============================================
  // DOCUMENT REGISTER ROUTES
  // ============================================

  app.get("/api/document-register/:userId", async (req, res) => {
    try {
      const docs = await storage.getDocumentRegister(req.params.userId);
      res.json(docs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document register" });
    }
  });

  app.post("/api/document-register", async (req, res) => {
    try {
      const doc = await storage.createDocumentRegisterItem(req.body);
      res.json(doc);
    } catch (error) {
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.patch("/api/document-register/:id", async (req, res) => {
    try {
      const doc = await storage.updateDocumentRegisterItem(req.params.id, req.body);
      res.json(doc);
    } catch (error) {
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  app.delete("/api/document-register/:id", async (req, res) => {
    try {
      await storage.deleteDocumentRegisterItem(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // ============================================
  // MILEAGE CLAIMS ROUTES
  // ============================================

  app.get("/api/mileage-claims/:userId", async (req, res) => {
    try {
      const claims = await storage.getMileageClaims(req.params.userId);
      res.json(claims);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mileage claims" });
    }
  });

  app.post("/api/mileage-claims", async (req, res) => {
    try {
      const claim = await storage.createMileageClaim(req.body);
      res.json(claim);
    } catch (error) {
      res.status(500).json({ error: "Failed to create mileage claim" });
    }
  });

  app.patch("/api/mileage-claims/:id", async (req, res) => {
    try {
      const claim = await storage.updateMileageClaim(req.params.id, req.body);
      res.json(claim);
    } catch (error) {
      res.status(500).json({ error: "Failed to update mileage claim" });
    }
  });

  app.delete("/api/mileage-claims/:id", async (req, res) => {
    try {
      await storage.deleteMileageClaim(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete mileage claim" });
    }
  });

  // ============================================
  // WORK NOTES ROUTES
  // ============================================

  app.get("/api/work-notes/:userId", async (req, res) => {
    try {
      const notes = await storage.getWorkNotes(req.params.userId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch work notes" });
    }
  });

  app.post("/api/work-notes", async (req, res) => {
    try {
      const note = await storage.createWorkNote(req.body);
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to create work note" });
    }
  });

  app.patch("/api/work-notes/:id", async (req, res) => {
    try {
      const note = await storage.updateWorkNote(req.params.id, req.body);
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to update work note" });
    }
  });

  app.delete("/api/work-notes/:id", async (req, res) => {
    try {
      await storage.deleteWorkNote(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete work note" });
    }
  });

  // ============================================
  // CALLBACKS ROUTES
  // ============================================

  app.get("/api/callbacks/:userId", async (req, res) => {
    try {
      const callbacks = await storage.getCallbacks(req.params.userId);
      res.json(callbacks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch callbacks" });
    }
  });

  app.post("/api/callbacks", async (req, res) => {
    try {
      const callback = await storage.createCallback(req.body);
      res.json(callback);
    } catch (error) {
      res.status(500).json({ error: "Failed to create callback" });
    }
  });

  app.patch("/api/callbacks/:id", async (req, res) => {
    try {
      const callback = await storage.updateCallback(req.params.id, req.body);
      res.json(callback);
    } catch (error) {
      res.status(500).json({ error: "Failed to update callback" });
    }
  });

  app.delete("/api/callbacks/:id", async (req, res) => {
    try {
      await storage.deleteCallback(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete callback" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
