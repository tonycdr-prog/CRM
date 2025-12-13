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

  // ============================================
  // STAFF DIRECTORY ROUTES
  // ============================================

  app.get("/api/staff-directory/:userId", async (req, res) => {
    try {
      const staff = await storage.getStaffDirectory(req.params.userId);
      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff directory" });
    }
  });

  app.post("/api/staff-directory", async (req, res) => {
    try {
      const member = await storage.createStaffMember(req.body);
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: "Failed to create staff member" });
    }
  });

  app.patch("/api/staff-directory/:id", async (req, res) => {
    try {
      const member = await storage.updateStaffMember(req.params.id, req.body);
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: "Failed to update staff member" });
    }
  });

  app.delete("/api/staff-directory/:id", async (req, res) => {
    try {
      await storage.deleteStaffMember(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete staff member" });
    }
  });

  // ============================================
  // PRICE LISTS ROUTES
  // ============================================

  app.get("/api/price-lists/:userId", async (req, res) => {
    try {
      const items = await storage.getPriceLists(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch price lists" });
    }
  });

  app.post("/api/price-lists", async (req, res) => {
    try {
      const item = await storage.createPriceList(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create price list item" });
    }
  });

  app.patch("/api/price-lists/:id", async (req, res) => {
    try {
      const item = await storage.updatePriceList(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update price list item" });
    }
  });

  app.delete("/api/price-lists/:id", async (req, res) => {
    try {
      await storage.deletePriceList(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete price list item" });
    }
  });

  // Customer Feedback routes
  app.get("/api/customer-feedback/:userId", async (req, res) => {
    try {
      const items = await storage.getCustomerFeedback(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer feedback" });
    }
  });

  app.post("/api/customer-feedback", async (req, res) => {
    try {
      const item = await storage.createCustomerFeedback(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create customer feedback" });
    }
  });

  app.patch("/api/customer-feedback/:id", async (req, res) => {
    try {
      const item = await storage.updateCustomerFeedback(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update customer feedback" });
    }
  });

  app.delete("/api/customer-feedback/:id", async (req, res) => {
    try {
      await storage.deleteCustomerFeedback(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete customer feedback" });
    }
  });

  // SLA routes
  app.get("/api/slas/:userId", async (req, res) => {
    try {
      const items = await storage.getSLAs(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch SLAs" });
    }
  });

  app.post("/api/slas", async (req, res) => {
    try {
      const item = await storage.createSLA(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create SLA" });
    }
  });

  app.patch("/api/slas/:id", async (req, res) => {
    try {
      const item = await storage.updateSLA(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update SLA" });
    }
  });

  app.delete("/api/slas/:id", async (req, res) => {
    try {
      await storage.deleteSLA(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete SLA" });
    }
  });

  // Parts Catalog routes
  app.get("/api/parts-catalog/:userId", async (req, res) => {
    try {
      const items = await storage.getPartsCatalog(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch parts catalog" });
    }
  });

  app.post("/api/parts-catalog", async (req, res) => {
    try {
      const item = await storage.createPart(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create part" });
    }
  });

  app.patch("/api/parts-catalog/:id", async (req, res) => {
    try {
      const item = await storage.updatePart(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update part" });
    }
  });

  app.delete("/api/parts-catalog/:id", async (req, res) => {
    try {
      await storage.deletePart(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete part" });
    }
  });

  // ============================================
  // PHASE 8: DOCUMENT TEMPLATES, WARRANTIES, COMPETITORS
  // ============================================

  // Document Templates routes
  app.get("/api/document-templates/:userId", async (req, res) => {
    try {
      const items = await storage.getDocumentTemplates(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document templates" });
    }
  });

  app.post("/api/document-templates", async (req, res) => {
    try {
      const item = await storage.createDocumentTemplate(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create document template" });
    }
  });

  app.patch("/api/document-templates/:id", async (req, res) => {
    try {
      const item = await storage.updateDocumentTemplate(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update document template" });
    }
  });

  app.delete("/api/document-templates/:id", async (req, res) => {
    try {
      await storage.deleteDocumentTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document template" });
    }
  });

  // Warranties routes
  app.get("/api/warranties/:userId", async (req, res) => {
    try {
      const items = await storage.getWarranties(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch warranties" });
    }
  });

  app.post("/api/warranties", async (req, res) => {
    try {
      const item = await storage.createWarranty(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create warranty" });
    }
  });

  app.patch("/api/warranties/:id", async (req, res) => {
    try {
      const item = await storage.updateWarranty(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update warranty" });
    }
  });

  app.delete("/api/warranties/:id", async (req, res) => {
    try {
      await storage.deleteWarranty(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete warranty" });
    }
  });

  // Competitors routes
  app.get("/api/competitors/:userId", async (req, res) => {
    try {
      const items = await storage.getCompetitors(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch competitors" });
    }
  });

  app.post("/api/competitors", async (req, res) => {
    try {
      const item = await storage.createCompetitor(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create competitor" });
    }
  });

  app.patch("/api/competitors/:id", async (req, res) => {
    try {
      const item = await storage.updateCompetitor(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update competitor" });
    }
  });

  app.delete("/api/competitors/:id", async (req, res) => {
    try {
      await storage.deleteCompetitor(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete competitor" });
    }
  });

  // ============================================
  // PHASE 9: SERVICE HISTORY, QUALITY CHECKLISTS, TIME OFF REQUESTS
  // ============================================

  // Service History routes
  app.get("/api/service-history/:userId", async (req, res) => {
    try {
      const items = await storage.getServiceHistory(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service history" });
    }
  });

  app.post("/api/service-history", async (req, res) => {
    try {
      const item = await storage.createServiceHistory(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create service history" });
    }
  });

  app.patch("/api/service-history/:id", async (req, res) => {
    try {
      const item = await storage.updateServiceHistory(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update service history" });
    }
  });

  app.delete("/api/service-history/:id", async (req, res) => {
    try {
      await storage.deleteServiceHistory(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete service history" });
    }
  });

  // Quality Checklists routes
  app.get("/api/quality-checklists/:userId", async (req, res) => {
    try {
      const items = await storage.getQualityChecklists(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quality checklists" });
    }
  });

  app.post("/api/quality-checklists", async (req, res) => {
    try {
      const item = await storage.createQualityChecklist(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create quality checklist" });
    }
  });

  app.patch("/api/quality-checklists/:id", async (req, res) => {
    try {
      const item = await storage.updateQualityChecklist(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update quality checklist" });
    }
  });

  app.delete("/api/quality-checklists/:id", async (req, res) => {
    try {
      await storage.deleteQualityChecklist(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete quality checklist" });
    }
  });

  // Time Off Requests routes
  app.get("/api/time-off-requests/:userId", async (req, res) => {
    try {
      const items = await storage.getTimeOffRequests(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time off requests" });
    }
  });

  app.post("/api/time-off-requests", async (req, res) => {
    try {
      const item = await storage.createTimeOffRequest(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create time off request" });
    }
  });

  app.patch("/api/time-off-requests/:id", async (req, res) => {
    try {
      const item = await storage.updateTimeOffRequest(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update time off request" });
    }
  });

  app.delete("/api/time-off-requests/:id", async (req, res) => {
    try {
      await storage.deleteTimeOffRequest(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete time off request" });
    }
  });

  // ============================================
  // PHASE 10: VISIT TYPES & SERVICE TEMPLATES
  // ============================================

  // Visit Types routes
  app.get("/api/visit-types/:userId", async (req, res) => {
    try {
      const items = await storage.getVisitTypes(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch visit types" });
    }
  });

  app.post("/api/visit-types", async (req, res) => {
    try {
      const item = await storage.createVisitType(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create visit type" });
    }
  });

  app.patch("/api/visit-types/:id", async (req, res) => {
    try {
      const item = await storage.updateVisitType(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update visit type" });
    }
  });

  app.delete("/api/visit-types/:id", async (req, res) => {
    try {
      await storage.deleteVisitType(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete visit type" });
    }
  });

  // Service Templates routes
  app.get("/api/service-templates/:userId", async (req, res) => {
    try {
      const items = await storage.getServiceTemplates(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service templates" });
    }
  });

  app.get("/api/service-templates/by-visit-type/:visitTypeId", async (req, res) => {
    try {
      const items = await storage.getServiceTemplatesByVisitType(req.params.visitTypeId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service templates by visit type" });
    }
  });

  app.post("/api/service-templates", async (req, res) => {
    try {
      const item = await storage.createServiceTemplate(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create service template" });
    }
  });

  app.patch("/api/service-templates/:id", async (req, res) => {
    try {
      const item = await storage.updateServiceTemplate(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update service template" });
    }
  });

  app.delete("/api/service-templates/:id", async (req, res) => {
    try {
      await storage.deleteServiceTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete service template" });
    }
  });

  // ============================================
  // PHASE 10: SITE ASSETS & BULK ADD
  // ============================================

  // Site Assets routes
  app.get("/api/site-assets/:userId", async (req, res) => {
    try {
      const items = await storage.getSiteAssets(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch site assets" });
    }
  });

  app.get("/api/site-assets/by-project/:projectId", async (req, res) => {
    try {
      const items = await storage.getSiteAssetsByProject(req.params.projectId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch site assets by project" });
    }
  });

  app.post("/api/site-assets", async (req, res) => {
    try {
      const item = await storage.createSiteAsset(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create site asset" });
    }
  });

  app.post("/api/site-assets/bulk", async (req, res) => {
    try {
      const items = await storage.createSiteAssetsBulk(req.body.assets);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to create bulk site assets" });
    }
  });

  app.patch("/api/site-assets/:id", async (req, res) => {
    try {
      const item = await storage.updateSiteAsset(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update site asset" });
    }
  });

  app.delete("/api/site-assets/:id", async (req, res) => {
    try {
      await storage.deleteSiteAsset(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete site asset" });
    }
  });

  // Asset Batches routes
  app.get("/api/asset-batches/:userId", async (req, res) => {
    try {
      const items = await storage.getAssetBatches(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch asset batches" });
    }
  });

  app.post("/api/asset-batches", async (req, res) => {
    try {
      const item = await storage.createAssetBatch(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create asset batch" });
    }
  });

  app.patch("/api/asset-batches/:id", async (req, res) => {
    try {
      const item = await storage.updateAssetBatch(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update asset batch" });
    }
  });

  app.delete("/api/asset-batches/:id", async (req, res) => {
    try {
      await storage.deleteAssetBatch(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete asset batch" });
    }
  });

  // ============================================
  // PHASE 11: SCHEDULING ENHANCEMENTS
  // ============================================

  // Job Assignments routes
  app.get("/api/job-assignments/:userId", async (req, res) => {
    try {
      const items = await storage.getJobAssignments(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job assignments" });
    }
  });

  app.get("/api/job-assignments/by-job/:jobId", async (req, res) => {
    try {
      const items = await storage.getJobAssignmentsByJob(req.params.jobId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job assignments by job" });
    }
  });

  app.post("/api/job-assignments", async (req, res) => {
    try {
      const item = await storage.createJobAssignment(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create job assignment" });
    }
  });

  app.patch("/api/job-assignments/:id", async (req, res) => {
    try {
      const item = await storage.updateJobAssignment(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update job assignment" });
    }
  });

  app.delete("/api/job-assignments/:id", async (req, res) => {
    try {
      await storage.deleteJobAssignment(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete job assignment" });
    }
  });

  // Job Skill Requirements routes
  app.get("/api/job-skill-requirements/:userId", async (req, res) => {
    try {
      const items = await storage.getJobSkillRequirements(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job skill requirements" });
    }
  });

  app.get("/api/job-skill-requirements/by-job/:jobId", async (req, res) => {
    try {
      const items = await storage.getJobSkillRequirementsByJob(req.params.jobId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job skill requirements by job" });
    }
  });

  app.post("/api/job-skill-requirements", async (req, res) => {
    try {
      const item = await storage.createJobSkillRequirement(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create job skill requirement" });
    }
  });

  app.patch("/api/job-skill-requirements/:id", async (req, res) => {
    try {
      const item = await storage.updateJobSkillRequirement(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update job skill requirement" });
    }
  });

  app.delete("/api/job-skill-requirements/:id", async (req, res) => {
    try {
      await storage.deleteJobSkillRequirement(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete job skill requirement" });
    }
  });

  // Job Equipment Reservations routes
  app.get("/api/job-equipment-reservations/:userId", async (req, res) => {
    try {
      const items = await storage.getJobEquipmentReservations(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job equipment reservations" });
    }
  });

  app.get("/api/job-equipment-reservations/by-job/:jobId", async (req, res) => {
    try {
      const items = await storage.getJobEquipmentReservationsByJob(req.params.jobId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job equipment reservations by job" });
    }
  });

  app.post("/api/job-equipment-reservations", async (req, res) => {
    try {
      const item = await storage.createJobEquipmentReservation(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create job equipment reservation" });
    }
  });

  app.patch("/api/job-equipment-reservations/:id", async (req, res) => {
    try {
      const item = await storage.updateJobEquipmentReservation(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update job equipment reservation" });
    }
  });

  app.delete("/api/job-equipment-reservations/:id", async (req, res) => {
    try {
      await storage.deleteJobEquipmentReservation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete job equipment reservation" });
    }
  });

  // Staff Availability routes
  app.get("/api/staff-availability/:userId", async (req, res) => {
    try {
      const items = await storage.getStaffAvailability(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff availability" });
    }
  });

  app.get("/api/staff-availability/by-staff/:staffId", async (req, res) => {
    try {
      const items = await storage.getStaffAvailabilityByStaff(req.params.staffId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff availability by staff" });
    }
  });

  app.post("/api/staff-availability", async (req, res) => {
    try {
      const item = await storage.createStaffAvailability(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create staff availability" });
    }
  });

  app.patch("/api/staff-availability/:id", async (req, res) => {
    try {
      const item = await storage.updateStaffAvailability(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update staff availability" });
    }
  });

  app.delete("/api/staff-availability/:id", async (req, res) => {
    try {
      await storage.deleteStaffAvailability(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete staff availability" });
    }
  });

  // Job Time Windows routes
  app.get("/api/job-time-windows/:userId", async (req, res) => {
    try {
      const items = await storage.getJobTimeWindows(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job time windows" });
    }
  });

  app.get("/api/job-time-windows/by-job/:jobId", async (req, res) => {
    try {
      const items = await storage.getJobTimeWindowsByJob(req.params.jobId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job time windows by job" });
    }
  });

  app.post("/api/job-time-windows", async (req, res) => {
    try {
      const item = await storage.createJobTimeWindow(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create job time window" });
    }
  });

  app.patch("/api/job-time-windows/:id", async (req, res) => {
    try {
      const item = await storage.updateJobTimeWindow(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update job time window" });
    }
  });

  app.delete("/api/job-time-windows/:id", async (req, res) => {
    try {
      await storage.deleteJobTimeWindow(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete job time window" });
    }
  });

  // Shift Handovers routes
  app.get("/api/shift-handovers/:userId", async (req, res) => {
    try {
      const items = await storage.getShiftHandovers(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shift handovers" });
    }
  });

  app.post("/api/shift-handovers", async (req, res) => {
    try {
      const item = await storage.createShiftHandover(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create shift handover" });
    }
  });

  app.patch("/api/shift-handovers/:id", async (req, res) => {
    try {
      const item = await storage.updateShiftHandover(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update shift handover" });
    }
  });

  app.delete("/api/shift-handovers/:id", async (req, res) => {
    try {
      await storage.deleteShiftHandover(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete shift handover" });
    }
  });

  // Daily Briefings routes
  app.get("/api/daily-briefings/:userId", async (req, res) => {
    try {
      const items = await storage.getDailyBriefings(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily briefings" });
    }
  });

  app.post("/api/daily-briefings", async (req, res) => {
    try {
      const item = await storage.createDailyBriefing(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create daily briefing" });
    }
  });

  app.patch("/api/daily-briefings/:id", async (req, res) => {
    try {
      const item = await storage.updateDailyBriefing(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update daily briefing" });
    }
  });

  app.delete("/api/daily-briefings/:id", async (req, res) => {
    try {
      await storage.deleteDailyBriefing(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete daily briefing" });
    }
  });

  // Service Reminders routes
  app.get("/api/service-reminders/:userId", async (req, res) => {
    try {
      const items = await storage.getServiceReminders(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service reminders" });
    }
  });

  app.post("/api/service-reminders", async (req, res) => {
    try {
      const item = await storage.createServiceReminder(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create service reminder" });
    }
  });

  app.patch("/api/service-reminders/:id", async (req, res) => {
    try {
      const item = await storage.updateServiceReminder(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update service reminder" });
    }
  });

  app.delete("/api/service-reminders/:id", async (req, res) => {
    try {
      await storage.deleteServiceReminder(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete service reminder" });
    }
  });

  // Location Coordinates routes
  app.get("/api/location-coordinates/:userId", async (req, res) => {
    try {
      const items = await storage.getLocationCoordinates(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch location coordinates" });
    }
  });

  app.post("/api/location-coordinates", async (req, res) => {
    try {
      const item = await storage.createLocationCoordinate(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create location coordinate" });
    }
  });

  app.patch("/api/location-coordinates/:id", async (req, res) => {
    try {
      const item = await storage.updateLocationCoordinate(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update location coordinate" });
    }
  });

  app.delete("/api/location-coordinates/:id", async (req, res) => {
    try {
      await storage.deleteLocationCoordinate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete location coordinate" });
    }
  });

  // Scheduling Conflicts routes
  app.get("/api/scheduling-conflicts/:userId", async (req, res) => {
    try {
      const items = await storage.getSchedulingConflicts(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scheduling conflicts" });
    }
  });

  app.post("/api/scheduling-conflicts", async (req, res) => {
    try {
      const item = await storage.createSchedulingConflict(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create scheduling conflict" });
    }
  });

  app.patch("/api/scheduling-conflicts/:id", async (req, res) => {
    try {
      const item = await storage.updateSchedulingConflict(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update scheduling conflict" });
    }
  });

  app.delete("/api/scheduling-conflicts/:id", async (req, res) => {
    try {
      await storage.deleteSchedulingConflict(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete scheduling conflict" });
    }
  });

  // Capacity Snapshots routes
  app.get("/api/capacity-snapshots/:userId", async (req, res) => {
    try {
      const items = await storage.getCapacitySnapshots(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch capacity snapshots" });
    }
  });

  app.post("/api/capacity-snapshots", async (req, res) => {
    try {
      const item = await storage.createCapacitySnapshot(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create capacity snapshot" });
    }
  });

  app.delete("/api/capacity-snapshots/:id", async (req, res) => {
    try {
      await storage.deleteCapacitySnapshot(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete capacity snapshot" });
    }
  });

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
  app.get("/api/travel-time/:userId", async (req, res) => {
    try {
      const { from, to } = req.query;
      
      if (!from || !to) {
        res.status(400).json({ error: "Both 'from' and 'to' job IDs are required" });
        return;
      }

      const coordinates = await storage.getLocationCoordinates(req.params.userId);
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
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate travel time" });
    }
  });

  // Conflict detection endpoint - analyzes all jobs and detects scheduling conflicts
  app.get("/api/detect-conflicts/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
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
    } catch (error) {
      console.error("Conflict detection error:", error);
      res.status(500).json({ error: "Failed to detect conflicts" });
    }
  });

  // ============================================
  // NEXT AVAILABLE SLOT FINDER
  // ============================================
  
  // Find next available time slots for scheduling a job
  app.post("/api/find-available-slot/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
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
    } catch (error) {
      console.error("Find available slot error:", error);
      res.status(500).json({ error: "Failed to find available slots" });
    }
  });

  // ============================================
  // CAPACITY PLANNING
  // ============================================
  
  // Get capacity metrics for staff workload analysis
  app.get("/api/capacity-metrics/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
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
    } catch (error) {
      console.error("Capacity metrics error:", error);
      res.status(500).json({ error: "Failed to calculate capacity metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
