import { 
  type User, type InsertUser, type UpsertUser,
  users, projects, damperTemplates, dampers, tests, stairwellTests, testPacks, complianceChecklists, testSessions, syncQueue,
  clients, customerContacts, customerAddresses, contracts, jobs, quotes, invoices, expenses, timesheets, vehicles, vehicleBookings, subcontractors, documents, communicationLogs, surveys, absences, reminders,
  jobTemplates, siteAccessNotes, equipment, certifications, incidents, auditLogs, formSubmissions, leads, tenders, recurringSchedules, riskAssessments, performanceMetrics, notifications,
  recurringJobs, jobChecklists, suppliers, purchaseOrders, trainingRecords, inventory, defects, documentRegister,
  mileageClaims, workNotes, callbacks, staffDirectory, priceLists, teamInvitations,
  customerFeedback, serviceLevelAgreements, partsCatalog,
  documentTemplates, warranties, competitors,
  serviceHistory, qualityChecklists, timeOffRequests,
  visitTypes, serviceTemplates, siteAssets, sites, jobSiteAssets, assetBatches,
  jobAssignments, jobSkillRequirements, jobEquipmentReservations, staffAvailability, jobPartsUsed,
  jobTimeWindows, shiftHandovers, dailyBriefings, serviceReminders,
  locationCoordinates, schedulingConflicts, capacitySnapshots,
  checkSheetTemplates, checkSheetReadings,
  organizations, organizationInvitations
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or } from "drizzle-orm";

const SHARED_USER_ID = "test-user-shared";

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
type DbCustomerContact = typeof customerContacts.$inferSelect;
type DbCustomerAddress = typeof customerAddresses.$inferSelect;
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
type NewCustomerContact = typeof customerContacts.$inferInsert;
type NewCustomerAddress = typeof customerAddresses.$inferInsert;
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

// New Phase 1-8 types
type DbJobTemplate = typeof jobTemplates.$inferSelect;
type DbSiteAccessNote = typeof siteAccessNotes.$inferSelect;
type DbEquipment = typeof equipment.$inferSelect;
type DbCertification = typeof certifications.$inferSelect;
type DbIncident = typeof incidents.$inferSelect;
type DbAuditLog = typeof auditLogs.$inferSelect;
type DbFormSubmission = typeof formSubmissions.$inferSelect;
type DbLead = typeof leads.$inferSelect;
type DbTender = typeof tenders.$inferSelect;
type DbRecurringSchedule = typeof recurringSchedules.$inferSelect;
type DbRiskAssessment = typeof riskAssessments.$inferSelect;
type DbPerformanceMetric = typeof performanceMetrics.$inferSelect;
type DbNotification = typeof notifications.$inferSelect;

type NewJobTemplate = typeof jobTemplates.$inferInsert;
type NewSiteAccessNote = typeof siteAccessNotes.$inferInsert;
type NewEquipment = typeof equipment.$inferInsert;
type NewCertification = typeof certifications.$inferInsert;
type NewIncident = typeof incidents.$inferInsert;
type NewAuditLog = typeof auditLogs.$inferInsert;
type NewFormSubmission = typeof formSubmissions.$inferInsert;
type NewLead = typeof leads.$inferInsert;
type NewTender = typeof tenders.$inferInsert;
type NewRecurringSchedule = typeof recurringSchedules.$inferInsert;
type NewRiskAssessment = typeof riskAssessments.$inferInsert;
type NewPerformanceMetric = typeof performanceMetrics.$inferInsert;
type NewNotification = typeof notifications.$inferInsert;
type DbRecurringJob = typeof recurringJobs.$inferSelect;
type NewRecurringJob = typeof recurringJobs.$inferInsert;
type DbJobChecklist = typeof jobChecklists.$inferSelect;
type NewJobChecklist = typeof jobChecklists.$inferInsert;
type DbSupplier = typeof suppliers.$inferSelect;
type NewSupplier = typeof suppliers.$inferInsert;
type DbPurchaseOrder = typeof purchaseOrders.$inferSelect;
type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;
type DbTrainingRecord = typeof trainingRecords.$inferSelect;
type NewTrainingRecord = typeof trainingRecords.$inferInsert;
type DbInventory = typeof inventory.$inferSelect;
type NewInventory = typeof inventory.$inferInsert;
type DbDefect = typeof defects.$inferSelect;
type NewDefect = typeof defects.$inferInsert;
type DbDocumentRegister = typeof documentRegister.$inferSelect;
type NewDocumentRegister = typeof documentRegister.$inferInsert;
type DbMileageClaim = typeof mileageClaims.$inferSelect;
type NewMileageClaim = typeof mileageClaims.$inferInsert;
type DbWorkNote = typeof workNotes.$inferSelect;
type NewWorkNote = typeof workNotes.$inferInsert;
type DbCallback = typeof callbacks.$inferSelect;
type NewCallback = typeof callbacks.$inferInsert;
type DbStaffMember = typeof staffDirectory.$inferSelect;
type NewStaffMember = typeof staffDirectory.$inferInsert;
type DbTeamInvitation = typeof teamInvitations.$inferSelect;
type InsertTeamInvitation = typeof teamInvitations.$inferInsert;
type DbPriceList = typeof priceLists.$inferSelect;
type NewPriceList = typeof priceLists.$inferInsert;
type DbCustomerFeedback = typeof customerFeedback.$inferSelect;
type NewCustomerFeedback = typeof customerFeedback.$inferInsert;
type DbSLA = typeof serviceLevelAgreements.$inferSelect;
type NewSLA = typeof serviceLevelAgreements.$inferInsert;
type DbPartsCatalog = typeof partsCatalog.$inferSelect;
type NewPartsCatalog = typeof partsCatalog.$inferInsert;
type DbDocumentTemplate = typeof documentTemplates.$inferSelect;
type NewDocumentTemplate = typeof documentTemplates.$inferInsert;
type DbWarranty = typeof warranties.$inferSelect;
type NewWarranty = typeof warranties.$inferInsert;
type DbCompetitor = typeof competitors.$inferSelect;
type NewCompetitor = typeof competitors.$inferInsert;
type DbServiceHistory = typeof serviceHistory.$inferSelect;
type NewServiceHistory = typeof serviceHistory.$inferInsert;
type DbQualityChecklist = typeof qualityChecklists.$inferSelect;
type NewQualityChecklist = typeof qualityChecklists.$inferInsert;
type DbTimeOffRequest = typeof timeOffRequests.$inferSelect;
type NewTimeOffRequest = typeof timeOffRequests.$inferInsert;
type DbVisitType = typeof visitTypes.$inferSelect;
type NewVisitType = typeof visitTypes.$inferInsert;
type DbServiceTemplate = typeof serviceTemplates.$inferSelect;
type NewServiceTemplate = typeof serviceTemplates.$inferInsert;
type DbSiteAsset = typeof siteAssets.$inferSelect;
type NewSiteAsset = typeof siteAssets.$inferInsert;
type DbSite = typeof sites.$inferSelect;
type NewSite = typeof sites.$inferInsert;
type DbJobSiteAsset = typeof jobSiteAssets.$inferSelect;
type NewJobSiteAsset = typeof jobSiteAssets.$inferInsert;
type DbAssetBatch = typeof assetBatches.$inferSelect;
type NewAssetBatch = typeof assetBatches.$inferInsert;
type DbJobAssignment = typeof jobAssignments.$inferSelect;
type NewJobAssignment = typeof jobAssignments.$inferInsert;
type DbJobSkillRequirement = typeof jobSkillRequirements.$inferSelect;
type NewJobSkillRequirement = typeof jobSkillRequirements.$inferInsert;
type DbJobEquipmentReservation = typeof jobEquipmentReservations.$inferSelect;
type NewJobEquipmentReservation = typeof jobEquipmentReservations.$inferInsert;
type DbJobPartsUsed = typeof jobPartsUsed.$inferSelect;
type NewJobPartsUsed = typeof jobPartsUsed.$inferInsert;
type DbStaffAvailability = typeof staffAvailability.$inferSelect;
type NewStaffAvailability = typeof staffAvailability.$inferInsert;
type DbJobTimeWindow = typeof jobTimeWindows.$inferSelect;
type NewJobTimeWindow = typeof jobTimeWindows.$inferInsert;
type DbShiftHandover = typeof shiftHandovers.$inferSelect;
type NewShiftHandover = typeof shiftHandovers.$inferInsert;
type DbDailyBriefing = typeof dailyBriefings.$inferSelect;
type NewDailyBriefing = typeof dailyBriefings.$inferInsert;
type DbServiceReminder = typeof serviceReminders.$inferSelect;
type NewServiceReminder = typeof serviceReminders.$inferInsert;
type DbLocationCoordinate = typeof locationCoordinates.$inferSelect;
type NewLocationCoordinate = typeof locationCoordinates.$inferInsert;
type DbSchedulingConflict = typeof schedulingConflicts.$inferSelect;
type NewSchedulingConflict = typeof schedulingConflicts.$inferInsert;
type DbCapacitySnapshot = typeof capacitySnapshots.$inferSelect;
type NewCapacitySnapshot = typeof capacitySnapshots.$inferInsert;
type DbCheckSheetTemplate = typeof checkSheetTemplates.$inferSelect;
type NewCheckSheetTemplate = typeof checkSheetTemplates.$inferInsert;
type DbCheckSheetReading = typeof checkSheetReadings.$inferSelect;
type NewCheckSheetReading = typeof checkSheetReadings.$inferInsert;
type DbOrganization = typeof organizations.$inferSelect;
type NewOrganization = typeof organizations.$inferInsert;
type DbOrganizationInvitation = typeof organizationInvitations.$inferSelect;
type NewOrganizationInvitation = typeof organizationInvitations.$inferInsert;

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
  getClientByPortalToken(token: string): Promise<DbClient | undefined>;
  createClient(client: NewClient): Promise<DbClient>;
  updateClient(id: string, client: Partial<NewClient>): Promise<DbClient | undefined>;
  deleteClient(id: string): Promise<boolean>;
  
  // Client Portal helpers
  getInvoicesByClient(clientId: string): Promise<DbInvoice[]>;
  getJobsByClient(clientId: string): Promise<DbJob[]>;
  getDocumentsByClient(clientId: string): Promise<DbDocument[]>;
  
  // Customer Contacts
  getCustomerContacts(clientId: string): Promise<DbCustomerContact[]>;
  createCustomerContact(contact: NewCustomerContact): Promise<DbCustomerContact>;
  updateCustomerContact(id: string, contact: Partial<NewCustomerContact>): Promise<DbCustomerContact | undefined>;
  deleteCustomerContact(id: string): Promise<boolean>;
  
  // Customer Addresses
  getCustomerAddresses(clientId: string): Promise<DbCustomerAddress[]>;
  createCustomerAddress(address: NewCustomerAddress): Promise<DbCustomerAddress>;
  updateCustomerAddress(id: string, address: Partial<NewCustomerAddress>): Promise<DbCustomerAddress | undefined>;
  deleteCustomerAddress(id: string): Promise<boolean>;
  
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
  updateJob(id: string, job: Partial<DbJob>): Promise<DbJob | undefined>;
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
  
  // Job Templates
  getJobTemplates(userId: string): Promise<DbJobTemplate[]>;
  createJobTemplate(template: NewJobTemplate): Promise<DbJobTemplate>;
  deleteJobTemplate(id: string): Promise<boolean>;
  
  // Site Access Notes
  getSiteAccessNotes(userId: string): Promise<DbSiteAccessNote[]>;
  createSiteAccessNote(note: NewSiteAccessNote): Promise<DbSiteAccessNote>;
  updateSiteAccessNote(id: string, note: Partial<NewSiteAccessNote>): Promise<DbSiteAccessNote | undefined>;
  deleteSiteAccessNote(id: string): Promise<boolean>;
  
  // Equipment
  getEquipment(userId: string): Promise<DbEquipment[]>;
  createEquipment(item: NewEquipment): Promise<DbEquipment>;
  updateEquipment(id: string, item: Partial<NewEquipment>): Promise<DbEquipment | undefined>;
  deleteEquipment(id: string): Promise<boolean>;
  
  // Certifications
  getCertifications(userId: string): Promise<DbCertification[]>;
  createCertification(cert: NewCertification): Promise<DbCertification>;
  updateCertification(id: string, cert: Partial<NewCertification>): Promise<DbCertification | undefined>;
  deleteCertification(id: string): Promise<boolean>;
  
  // Incidents
  getIncidents(userId: string): Promise<DbIncident[]>;
  createIncident(incident: NewIncident): Promise<DbIncident>;
  updateIncident(id: string, incident: Partial<NewIncident>): Promise<DbIncident | undefined>;
  deleteIncident(id: string): Promise<boolean>;
  
  // Audit Logs
  getAuditLogs(userId: string): Promise<DbAuditLog[]>;
  createAuditLog(log: NewAuditLog): Promise<DbAuditLog>;
  
  // Form Submissions (Golden Thread)
  getFormSubmissions(userId: string): Promise<DbFormSubmission[]>;
  getFormSubmissionsBySite(siteId: string): Promise<DbFormSubmission[]>;
  getFormSubmissionsByJob(jobId: string): Promise<DbFormSubmission[]>;
  getFormSubmission(id: string): Promise<DbFormSubmission | undefined>;
  createFormSubmission(submission: NewFormSubmission): Promise<DbFormSubmission>;
  updateFormSubmission(id: string, submission: Partial<NewFormSubmission>): Promise<DbFormSubmission | undefined>;
  
  // Leads
  getLeads(userId: string): Promise<DbLead[]>;
  createLead(lead: NewLead): Promise<DbLead>;
  updateLead(id: string, lead: Partial<NewLead>): Promise<DbLead | undefined>;
  deleteLead(id: string): Promise<boolean>;
  
  // Tenders
  getTenders(userId: string): Promise<DbTender[]>;
  createTender(tender: NewTender): Promise<DbTender>;
  updateTender(id: string, tender: Partial<NewTender>): Promise<DbTender | undefined>;
  deleteTender(id: string): Promise<boolean>;
  
  // Recurring Schedules
  getRecurringSchedules(userId: string): Promise<DbRecurringSchedule[]>;
  createRecurringSchedule(schedule: NewRecurringSchedule): Promise<DbRecurringSchedule>;
  updateRecurringSchedule(id: string, schedule: Partial<NewRecurringSchedule>): Promise<DbRecurringSchedule | undefined>;
  deleteRecurringSchedule(id: string): Promise<boolean>;
  
  // Risk Assessments
  getRiskAssessments(userId: string): Promise<DbRiskAssessment[]>;
  createRiskAssessment(assessment: NewRiskAssessment): Promise<DbRiskAssessment>;
  updateRiskAssessment(id: string, assessment: Partial<NewRiskAssessment>): Promise<DbRiskAssessment | undefined>;
  deleteRiskAssessment(id: string): Promise<boolean>;
  
  // Performance Metrics
  getPerformanceMetrics(userId: string): Promise<DbPerformanceMetric[]>;
  createPerformanceMetric(metric: NewPerformanceMetric): Promise<DbPerformanceMetric>;
  
  // Notifications
  getNotifications(userId: string): Promise<DbNotification[]>;
  createNotification(notification: NewNotification): Promise<DbNotification>;
  updateNotification(id: string, notification: Partial<NewNotification>): Promise<DbNotification | undefined>;
  deleteNotification(id: string): Promise<boolean>;
  
  // Suppliers
  getSuppliers(userId: string): Promise<DbSupplier[]>;
  createSupplier(supplier: NewSupplier): Promise<DbSupplier>;
  updateSupplier(id: string, supplier: Partial<NewSupplier>): Promise<DbSupplier | undefined>;
  deleteSupplier(id: string): Promise<boolean>;
  
  // Purchase Orders
  getPurchaseOrders(userId: string): Promise<DbPurchaseOrder[]>;
  createPurchaseOrder(po: NewPurchaseOrder): Promise<DbPurchaseOrder>;
  updatePurchaseOrder(id: string, po: Partial<NewPurchaseOrder>): Promise<DbPurchaseOrder | undefined>;
  deletePurchaseOrder(id: string): Promise<boolean>;
  
  // Training Records
  getTrainingRecords(userId: string): Promise<DbTrainingRecord[]>;
  createTrainingRecord(record: NewTrainingRecord): Promise<DbTrainingRecord>;
  updateTrainingRecord(id: string, record: Partial<NewTrainingRecord>): Promise<DbTrainingRecord | undefined>;
  deleteTrainingRecord(id: string): Promise<boolean>;
  
  // Inventory
  getInventory(userId: string): Promise<DbInventory[]>;
  createInventoryItem(item: NewInventory): Promise<DbInventory>;
  updateInventoryItem(id: string, item: Partial<NewInventory>): Promise<DbInventory | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;
  
  // Defects
  getDefects(userId: string): Promise<DbDefect[]>;
  createDefect(defect: NewDefect): Promise<DbDefect>;
  updateDefect(id: string, defect: Partial<NewDefect>): Promise<DbDefect | undefined>;
  deleteDefect(id: string): Promise<boolean>;
  
  // Document Register
  getDocumentRegister(userId: string): Promise<DbDocumentRegister[]>;
  createDocumentRegisterItem(doc: NewDocumentRegister): Promise<DbDocumentRegister>;
  updateDocumentRegisterItem(id: string, doc: Partial<NewDocumentRegister>): Promise<DbDocumentRegister | undefined>;
  deleteDocumentRegisterItem(id: string): Promise<boolean>;
  
  // Customer Feedback
  getCustomerFeedback(userId: string): Promise<DbCustomerFeedback[]>;
  createCustomerFeedback(feedback: NewCustomerFeedback): Promise<DbCustomerFeedback>;
  updateCustomerFeedback(id: string, feedback: Partial<NewCustomerFeedback>): Promise<DbCustomerFeedback | undefined>;
  deleteCustomerFeedback(id: string): Promise<boolean>;
  
  // Service Level Agreements
  getSLAs(userId: string): Promise<DbSLA[]>;
  createSLA(sla: NewSLA): Promise<DbSLA>;
  updateSLA(id: string, sla: Partial<NewSLA>): Promise<DbSLA | undefined>;
  deleteSLA(id: string): Promise<boolean>;
  
  // Parts Catalog
  getPartsCatalog(userId: string): Promise<DbPartsCatalog[]>;
  createPart(part: NewPartsCatalog): Promise<DbPartsCatalog>;
  updatePart(id: string, part: Partial<NewPartsCatalog>): Promise<DbPartsCatalog | undefined>;
  deletePart(id: string): Promise<boolean>;

  // Document Templates
  getDocumentTemplates(userId: string): Promise<DbDocumentTemplate[]>;
  createDocumentTemplate(template: NewDocumentTemplate): Promise<DbDocumentTemplate>;
  updateDocumentTemplate(id: string, template: Partial<NewDocumentTemplate>): Promise<DbDocumentTemplate | undefined>;
  deleteDocumentTemplate(id: string): Promise<boolean>;

  // Warranties
  getWarranties(userId: string): Promise<DbWarranty[]>;
  createWarranty(warranty: NewWarranty): Promise<DbWarranty>;
  updateWarranty(id: string, warranty: Partial<NewWarranty>): Promise<DbWarranty | undefined>;
  deleteWarranty(id: string): Promise<boolean>;

  // Competitors
  getCompetitors(userId: string): Promise<DbCompetitor[]>;
  createCompetitor(competitor: NewCompetitor): Promise<DbCompetitor>;
  updateCompetitor(id: string, competitor: Partial<NewCompetitor>): Promise<DbCompetitor | undefined>;
  deleteCompetitor(id: string): Promise<boolean>;

  // Service History
  getServiceHistory(userId: string): Promise<DbServiceHistory[]>;
  createServiceHistory(history: NewServiceHistory): Promise<DbServiceHistory>;
  updateServiceHistory(id: string, history: Partial<NewServiceHistory>): Promise<DbServiceHistory | undefined>;
  deleteServiceHistory(id: string): Promise<boolean>;

  // Quality Checklists
  getQualityChecklists(userId: string): Promise<DbQualityChecklist[]>;
  createQualityChecklist(checklist: NewQualityChecklist): Promise<DbQualityChecklist>;
  updateQualityChecklist(id: string, checklist: Partial<NewQualityChecklist>): Promise<DbQualityChecklist | undefined>;
  deleteQualityChecklist(id: string): Promise<boolean>;

  // Time Off Requests
  getTimeOffRequests(userId: string): Promise<DbTimeOffRequest[]>;
  createTimeOffRequest(request: NewTimeOffRequest): Promise<DbTimeOffRequest>;
  updateTimeOffRequest(id: string, request: Partial<NewTimeOffRequest>): Promise<DbTimeOffRequest | undefined>;
  deleteTimeOffRequest(id: string): Promise<boolean>;

  // Visit Types
  getVisitTypes(userId: string): Promise<DbVisitType[]>;
  createVisitType(visitType: NewVisitType): Promise<DbVisitType>;
  updateVisitType(id: string, visitType: Partial<NewVisitType>): Promise<DbVisitType | undefined>;
  deleteVisitType(id: string): Promise<boolean>;

  // Service Templates
  getServiceTemplates(userId: string): Promise<DbServiceTemplate[]>;
  getServiceTemplatesByVisitType(visitTypeId: string): Promise<DbServiceTemplate[]>;
  createServiceTemplate(template: NewServiceTemplate): Promise<DbServiceTemplate>;
  updateServiceTemplate(id: string, template: Partial<NewServiceTemplate>): Promise<DbServiceTemplate | undefined>;
  deleteServiceTemplate(id: string): Promise<boolean>;

  // Sites (Buildings)
  getSites(userId: string): Promise<DbSite[]>;
  getSitesByClient(clientId: string): Promise<DbSite[]>;
  getSite(id: string): Promise<DbSite | undefined>;
  createSite(site: NewSite): Promise<DbSite>;
  updateSite(id: string, site: Partial<NewSite>): Promise<DbSite | undefined>;
  deleteSite(id: string): Promise<boolean>;

  // Site Assets
  getSiteAssets(userId: string): Promise<DbSiteAsset[]>;
  getSiteAssetsByProject(projectId: string): Promise<DbSiteAsset[]>;
  getSiteAssetsBySite(siteId: string): Promise<DbSiteAsset[]>;
  getSiteAssetsByClient(clientId: string): Promise<DbSiteAsset[]>;
  createSiteAsset(asset: NewSiteAsset): Promise<DbSiteAsset>;
  createSiteAssetsBulk(assets: NewSiteAsset[]): Promise<DbSiteAsset[]>;
  updateSiteAsset(id: string, asset: Partial<NewSiteAsset>): Promise<DbSiteAsset | undefined>;
  deleteSiteAsset(id: string): Promise<boolean>;

  // Job Site Assets (junction table)
  getJobSiteAssets(jobId: string): Promise<DbJobSiteAsset[]>;
  getJobSiteAssetsWithDetails(jobId: string): Promise<(DbJobSiteAsset & { asset: DbSiteAsset })[]>;
  createJobSiteAsset(assignment: NewJobSiteAsset): Promise<DbJobSiteAsset>;
  createJobSiteAssetsBulk(assignments: NewJobSiteAsset[]): Promise<DbJobSiteAsset[]>;
  updateJobSiteAsset(id: string, update: Partial<NewJobSiteAsset>): Promise<DbJobSiteAsset | undefined>;
  deleteJobSiteAsset(id: string): Promise<boolean>;
  deleteJobSiteAssetsByJob(jobId: string): Promise<boolean>;

  // Asset Batches
  getAssetBatches(userId: string): Promise<DbAssetBatch[]>;
  createAssetBatch(batch: NewAssetBatch): Promise<DbAssetBatch>;
  updateAssetBatch(id: string, batch: Partial<NewAssetBatch>): Promise<DbAssetBatch | undefined>;
  deleteAssetBatch(id: string): Promise<boolean>;

  // Job Assignments
  getJobAssignments(userId: string): Promise<DbJobAssignment[]>;
  getJobAssignmentsByJob(jobId: string): Promise<DbJobAssignment[]>;
  createJobAssignment(assignment: NewJobAssignment): Promise<DbJobAssignment>;
  updateJobAssignment(id: string, assignment: Partial<NewJobAssignment>): Promise<DbJobAssignment | undefined>;
  deleteJobAssignment(id: string): Promise<boolean>;

  // Job Skill Requirements
  getJobSkillRequirements(userId: string): Promise<DbJobSkillRequirement[]>;
  getJobSkillRequirementsByJob(jobId: string): Promise<DbJobSkillRequirement[]>;
  createJobSkillRequirement(requirement: NewJobSkillRequirement): Promise<DbJobSkillRequirement>;
  updateJobSkillRequirement(id: string, requirement: Partial<NewJobSkillRequirement>): Promise<DbJobSkillRequirement | undefined>;
  deleteJobSkillRequirement(id: string): Promise<boolean>;

  // Job Equipment Reservations
  getJobEquipmentReservations(userId: string): Promise<DbJobEquipmentReservation[]>;
  getJobEquipmentReservationsByJob(jobId: string): Promise<DbJobEquipmentReservation[]>;
  createJobEquipmentReservation(reservation: NewJobEquipmentReservation): Promise<DbJobEquipmentReservation>;
  updateJobEquipmentReservation(id: string, reservation: Partial<NewJobEquipmentReservation>): Promise<DbJobEquipmentReservation | undefined>;
  deleteJobEquipmentReservation(id: string): Promise<boolean>;

  // Staff Availability
  getStaffAvailability(userId: string): Promise<DbStaffAvailability[]>;
  getStaffAvailabilityByStaff(staffId: string): Promise<DbStaffAvailability[]>;
  createStaffAvailability(availability: NewStaffAvailability): Promise<DbStaffAvailability>;
  updateStaffAvailability(id: string, availability: Partial<NewStaffAvailability>): Promise<DbStaffAvailability | undefined>;
  deleteStaffAvailability(id: string): Promise<boolean>;

  // Job Time Windows
  getJobTimeWindows(userId: string): Promise<DbJobTimeWindow[]>;
  getJobTimeWindowsByJob(jobId: string): Promise<DbJobTimeWindow[]>;
  createJobTimeWindow(timeWindow: NewJobTimeWindow): Promise<DbJobTimeWindow>;
  updateJobTimeWindow(id: string, timeWindow: Partial<NewJobTimeWindow>): Promise<DbJobTimeWindow | undefined>;
  deleteJobTimeWindow(id: string): Promise<boolean>;

  // Job Parts Used
  getJobPartsUsed(userId: string): Promise<DbJobPartsUsed[]>;
  getJobPartsUsedByJob(jobId: string): Promise<DbJobPartsUsed[]>;
  createJobPartsUsed(part: NewJobPartsUsed): Promise<DbJobPartsUsed>;
  updateJobPartsUsed(id: string, part: Partial<NewJobPartsUsed>): Promise<DbJobPartsUsed | undefined>;
  deleteJobPartsUsed(id: string): Promise<boolean>;

  // Shift Handovers
  getShiftHandovers(userId: string): Promise<DbShiftHandover[]>;
  createShiftHandover(handover: NewShiftHandover): Promise<DbShiftHandover>;
  updateShiftHandover(id: string, handover: Partial<NewShiftHandover>): Promise<DbShiftHandover | undefined>;
  deleteShiftHandover(id: string): Promise<boolean>;

  // Daily Briefings
  getDailyBriefings(userId: string): Promise<DbDailyBriefing[]>;
  createDailyBriefing(briefing: NewDailyBriefing): Promise<DbDailyBriefing>;
  updateDailyBriefing(id: string, briefing: Partial<NewDailyBriefing>): Promise<DbDailyBriefing | undefined>;
  deleteDailyBriefing(id: string): Promise<boolean>;

  // Service Reminders
  getServiceReminders(userId: string): Promise<DbServiceReminder[]>;
  createServiceReminder(reminder: NewServiceReminder): Promise<DbServiceReminder>;
  updateServiceReminder(id: string, reminder: Partial<NewServiceReminder>): Promise<DbServiceReminder | undefined>;
  deleteServiceReminder(id: string): Promise<boolean>;

  // Location Coordinates
  getLocationCoordinates(userId: string): Promise<DbLocationCoordinate[]>;
  createLocationCoordinate(coordinate: NewLocationCoordinate): Promise<DbLocationCoordinate>;
  updateLocationCoordinate(id: string, coordinate: Partial<NewLocationCoordinate>): Promise<DbLocationCoordinate | undefined>;
  deleteLocationCoordinate(id: string): Promise<boolean>;

  // Scheduling Conflicts
  getSchedulingConflicts(userId: string): Promise<DbSchedulingConflict[]>;
  createSchedulingConflict(conflict: NewSchedulingConflict): Promise<DbSchedulingConflict>;
  updateSchedulingConflict(id: string, conflict: Partial<NewSchedulingConflict>): Promise<DbSchedulingConflict | undefined>;
  deleteSchedulingConflict(id: string): Promise<boolean>;

  // Capacity Snapshots
  getCapacitySnapshots(userId: string): Promise<DbCapacitySnapshot[]>;
  createCapacitySnapshot(snapshot: NewCapacitySnapshot): Promise<DbCapacitySnapshot>;
  deleteCapacitySnapshot(id: string): Promise<boolean>;

  // Check Sheet Templates
  getCheckSheetTemplates(userId: string): Promise<DbCheckSheetTemplate[]>;
  getCheckSheetTemplate(id: string): Promise<DbCheckSheetTemplate | undefined>;
  getCheckSheetTemplatesBySystemType(userId: string, systemType: string): Promise<DbCheckSheetTemplate[]>;
  createCheckSheetTemplate(template: NewCheckSheetTemplate): Promise<DbCheckSheetTemplate>;
  updateCheckSheetTemplate(id: string, template: Partial<NewCheckSheetTemplate>): Promise<DbCheckSheetTemplate | undefined>;
  deleteCheckSheetTemplate(id: string): Promise<boolean>;

  // Check Sheet Readings
  getCheckSheetReadings(userId: string): Promise<DbCheckSheetReading[]>;
  getCheckSheetReading(id: string): Promise<DbCheckSheetReading | undefined>;
  getCheckSheetReadingsByJob(jobId: string): Promise<DbCheckSheetReading[]>;
  createCheckSheetReading(reading: NewCheckSheetReading): Promise<DbCheckSheetReading>;
  updateCheckSheetReading(id: string, reading: Partial<NewCheckSheetReading>): Promise<DbCheckSheetReading | undefined>;
  deleteCheckSheetReading(id: string): Promise<boolean>;

  // Organization methods
  getOrganization(id: string): Promise<DbOrganization | undefined>;
  getOrganizationByOwnerId(ownerId: string): Promise<DbOrganization | undefined>;
  createOrganization(data: NewOrganization): Promise<DbOrganization>;
  updateOrganization(id: string, data: Partial<NewOrganization>): Promise<DbOrganization | undefined>;

  // Organization members
  getOrganizationMembers(organizationId: string): Promise<User[]>;
  updateUserOrganization(userId: string, organizationId: string, role: string): Promise<User | undefined>;
  removeUserFromOrganization(userId: string): Promise<void>;

  // Organization invitations
  getOrganizationInvitations(organizationId: string): Promise<DbOrganizationInvitation[]>;
  getInvitationByToken(token: string): Promise<DbOrganizationInvitation | undefined>;
  createOrganizationInvitation(data: NewOrganizationInvitation): Promise<DbOrganizationInvitation>;
  acceptInvitation(token: string, userId: string): Promise<void>;
  deleteOrganizationInvitation(id: string): Promise<void>;
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
    // First check if user exists by ID
    if (userData.id) {
      const existingById = await this.getUser(userData.id);
      if (existingById) {
        // Update existing user by ID
        const [updated] = await db
          .update(users)
          .set({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userData.id))
          .returning();
        return updated;
      }
    }
    
    // Check if user exists by email (for test users with different IDs)
    if (userData.email) {
      const [existingByEmail] = await db.select().from(users).where(eq(users.email, userData.email));
      if (existingByEmail) {
        // Update existing user by email
        const updateData: any = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        };
        if (userData.id) {
          updateData.id = userData.id;
        }
        const [updated] = await db
          .update(users)
          .set(updateData)
          .where(eq(users.email, userData.email))
          .returning();
        return updated;
      }
    }
    
    // Create new user
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Projects
  async getProjects(userId: string): Promise<DbProject[]> {
    return db.select().from(projects).where(or(eq(projects.userId, userId), eq(projects.userId, SHARED_USER_ID))).orderBy(desc(projects.createdAt));
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
    return db.select().from(dampers).where(or(eq(dampers.userId, userId), eq(dampers.userId, SHARED_USER_ID))).orderBy(desc(dampers.createdAt));
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
    return db.select().from(tests).where(or(eq(tests.userId, userId), eq(tests.userId, SHARED_USER_ID))).orderBy(desc(tests.createdAt));
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
    return db.select().from(clients).where(or(eq(clients.userId, userId), eq(clients.userId, SHARED_USER_ID))).orderBy(desc(clients.createdAt));
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

  async getClientByPortalToken(token: string): Promise<DbClient | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.portalToken, token));
    return client || undefined;
  }

  async getInvoicesByClient(clientId: string): Promise<DbInvoice[]> {
    return db.select().from(invoices).where(eq(invoices.clientId, clientId)).orderBy(desc(invoices.createdAt));
  }

  async getJobsByClient(clientId: string): Promise<DbJob[]> {
    return db.select().from(jobs).where(eq(jobs.clientId, clientId)).orderBy(desc(jobs.createdAt));
  }

  async getDocumentsByClient(clientId: string): Promise<DbDocument[]> {
    return db.select().from(documents).where(eq(documents.clientId, clientId)).orderBy(desc(documents.createdAt));
  }

  // Customer Contacts
  async getCustomerContacts(clientId: string): Promise<DbCustomerContact[]> {
    return db.select().from(customerContacts).where(eq(customerContacts.clientId, clientId)).orderBy(desc(customerContacts.createdAt));
  }

  async createCustomerContact(contact: NewCustomerContact): Promise<DbCustomerContact> {
    const [newContact] = await db.insert(customerContacts).values(contact).returning();
    return newContact;
  }

  async updateCustomerContact(id: string, contact: Partial<NewCustomerContact>): Promise<DbCustomerContact | undefined> {
    const [updated] = await db.update(customerContacts).set({ ...contact, updatedAt: new Date() }).where(eq(customerContacts.id, id)).returning();
    return updated || undefined;
  }

  async deleteCustomerContact(id: string): Promise<boolean> {
    await db.delete(customerContacts).where(eq(customerContacts.id, id));
    return true;
  }

  // Customer Addresses
  async getCustomerAddresses(clientId: string): Promise<DbCustomerAddress[]> {
    return db.select().from(customerAddresses).where(eq(customerAddresses.clientId, clientId)).orderBy(desc(customerAddresses.createdAt));
  }

  async createCustomerAddress(address: NewCustomerAddress): Promise<DbCustomerAddress> {
    const [newAddress] = await db.insert(customerAddresses).values(address).returning();
    return newAddress;
  }

  async updateCustomerAddress(id: string, address: Partial<NewCustomerAddress>): Promise<DbCustomerAddress | undefined> {
    const [updated] = await db.update(customerAddresses).set({ ...address, updatedAt: new Date() }).where(eq(customerAddresses.id, id)).returning();
    return updated || undefined;
  }

  async deleteCustomerAddress(id: string): Promise<boolean> {
    await db.delete(customerAddresses).where(eq(customerAddresses.id, id));
    return true;
  }

  // Contracts
  async getContracts(userId: string): Promise<DbContract[]> {
    return db.select().from(contracts).where(or(eq(contracts.userId, userId), eq(contracts.userId, SHARED_USER_ID))).orderBy(desc(contracts.createdAt));
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
    return db.select().from(jobs).where(or(eq(jobs.userId, userId), eq(jobs.userId, SHARED_USER_ID))).orderBy(desc(jobs.createdAt));
  }

  async getJob(id: string): Promise<DbJob | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async createJob(job: NewJob): Promise<DbJob> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async updateJob(id: string, job: Partial<DbJob>): Promise<DbJob | undefined> {
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

  // Job Templates
  async getJobTemplates(userId: string): Promise<DbJobTemplate[]> {
    return db.select().from(jobTemplates).where(eq(jobTemplates.userId, userId)).orderBy(desc(jobTemplates.createdAt));
  }

  async createJobTemplate(template: NewJobTemplate): Promise<DbJobTemplate> {
    const [newTemplate] = await db.insert(jobTemplates).values(template).returning();
    return newTemplate;
  }

  async deleteJobTemplate(id: string): Promise<boolean> {
    await db.delete(jobTemplates).where(eq(jobTemplates.id, id));
    return true;
  }

  // Site Access Notes
  async getSiteAccessNotes(userId: string): Promise<DbSiteAccessNote[]> {
    return db.select().from(siteAccessNotes).where(eq(siteAccessNotes.userId, userId)).orderBy(desc(siteAccessNotes.createdAt));
  }

  async createSiteAccessNote(note: NewSiteAccessNote): Promise<DbSiteAccessNote> {
    const [newNote] = await db.insert(siteAccessNotes).values(note).returning();
    return newNote;
  }

  async updateSiteAccessNote(id: string, note: Partial<NewSiteAccessNote>): Promise<DbSiteAccessNote | undefined> {
    const [updated] = await db.update(siteAccessNotes).set({ ...note, updatedAt: new Date() }).where(eq(siteAccessNotes.id, id)).returning();
    return updated || undefined;
  }

  async deleteSiteAccessNote(id: string): Promise<boolean> {
    await db.delete(siteAccessNotes).where(eq(siteAccessNotes.id, id));
    return true;
  }

  // Equipment
  async getEquipment(userId: string): Promise<DbEquipment[]> {
    return db.select().from(equipment).where(eq(equipment.userId, userId)).orderBy(desc(equipment.createdAt));
  }

  async createEquipment(item: NewEquipment): Promise<DbEquipment> {
    const [newItem] = await db.insert(equipment).values(item).returning();
    return newItem;
  }

  async updateEquipment(id: string, item: Partial<NewEquipment>): Promise<DbEquipment | undefined> {
    const [updated] = await db.update(equipment).set({ ...item, updatedAt: new Date() }).where(eq(equipment.id, id)).returning();
    return updated || undefined;
  }

  async deleteEquipment(id: string): Promise<boolean> {
    await db.delete(equipment).where(eq(equipment.id, id));
    return true;
  }

  // Certifications
  async getCertifications(userId: string): Promise<DbCertification[]> {
    return db.select().from(certifications).where(eq(certifications.userId, userId)).orderBy(desc(certifications.createdAt));
  }

  async createCertification(cert: NewCertification): Promise<DbCertification> {
    const [newCert] = await db.insert(certifications).values(cert).returning();
    return newCert;
  }

  async updateCertification(id: string, cert: Partial<NewCertification>): Promise<DbCertification | undefined> {
    const [updated] = await db.update(certifications).set({ ...cert, updatedAt: new Date() }).where(eq(certifications.id, id)).returning();
    return updated || undefined;
  }

  async deleteCertification(id: string): Promise<boolean> {
    await db.delete(certifications).where(eq(certifications.id, id));
    return true;
  }

  // Incidents
  async getIncidents(userId: string): Promise<DbIncident[]> {
    return db.select().from(incidents).where(eq(incidents.userId, userId)).orderBy(desc(incidents.createdAt));
  }

  async createIncident(incident: NewIncident): Promise<DbIncident> {
    const [newIncident] = await db.insert(incidents).values(incident).returning();
    return newIncident;
  }

  async updateIncident(id: string, incident: Partial<NewIncident>): Promise<DbIncident | undefined> {
    const [updated] = await db.update(incidents).set({ ...incident, updatedAt: new Date() }).where(eq(incidents.id, id)).returning();
    return updated || undefined;
  }

  async deleteIncident(id: string): Promise<boolean> {
    await db.delete(incidents).where(eq(incidents.id, id));
    return true;
  }

  // Audit Logs
  async getAuditLogs(userId: string): Promise<DbAuditLog[]> {
    return db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.createdAt));
  }

  async createAuditLog(log: NewAuditLog): Promise<DbAuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  // Form Submissions (Golden Thread)
  async getFormSubmissions(userId: string): Promise<DbFormSubmission[]> {
    return db.select().from(formSubmissions).where(eq(formSubmissions.userId, userId)).orderBy(desc(formSubmissions.submittedAt));
  }

  async getFormSubmissionsBySite(siteId: string): Promise<DbFormSubmission[]> {
    return db.select().from(formSubmissions).where(eq(formSubmissions.siteId, siteId)).orderBy(desc(formSubmissions.submittedAt));
  }

  async getFormSubmissionsByJob(jobId: string): Promise<DbFormSubmission[]> {
    return db.select().from(formSubmissions).where(eq(formSubmissions.jobId, jobId)).orderBy(desc(formSubmissions.submittedAt));
  }

  async getFormSubmission(id: string): Promise<DbFormSubmission | undefined> {
    const [submission] = await db.select().from(formSubmissions).where(eq(formSubmissions.id, id));
    return submission || undefined;
  }

  async createFormSubmission(submission: NewFormSubmission): Promise<DbFormSubmission> {
    const [newSubmission] = await db.insert(formSubmissions).values(submission).returning();
    return newSubmission;
  }

  async updateFormSubmission(id: string, submission: Partial<NewFormSubmission>): Promise<DbFormSubmission | undefined> {
    const [updated] = await db.update(formSubmissions).set({ ...submission, updatedAt: new Date() }).where(eq(formSubmissions.id, id)).returning();
    return updated || undefined;
  }

  // Leads
  async getLeads(userId: string): Promise<DbLead[]> {
    return db.select().from(leads).where(eq(leads.userId, userId)).orderBy(desc(leads.createdAt));
  }

  async createLead(lead: NewLead): Promise<DbLead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async updateLead(id: string, lead: Partial<NewLead>): Promise<DbLead | undefined> {
    const [updated] = await db.update(leads).set({ ...lead, updatedAt: new Date() }).where(eq(leads.id, id)).returning();
    return updated || undefined;
  }

  async deleteLead(id: string): Promise<boolean> {
    await db.delete(leads).where(eq(leads.id, id));
    return true;
  }

  // Tenders
  async getTenders(userId: string): Promise<DbTender[]> {
    return db.select().from(tenders).where(eq(tenders.userId, userId)).orderBy(desc(tenders.createdAt));
  }

  async createTender(tender: NewTender): Promise<DbTender> {
    const [newTender] = await db.insert(tenders).values(tender).returning();
    return newTender;
  }

  async updateTender(id: string, tender: Partial<NewTender>): Promise<DbTender | undefined> {
    const [updated] = await db.update(tenders).set({ ...tender, updatedAt: new Date() }).where(eq(tenders.id, id)).returning();
    return updated || undefined;
  }

  async deleteTender(id: string): Promise<boolean> {
    await db.delete(tenders).where(eq(tenders.id, id));
    return true;
  }

  // Recurring Schedules
  async getRecurringSchedules(userId: string): Promise<DbRecurringSchedule[]> {
    return db.select().from(recurringSchedules).where(eq(recurringSchedules.userId, userId)).orderBy(desc(recurringSchedules.createdAt));
  }

  async createRecurringSchedule(schedule: NewRecurringSchedule): Promise<DbRecurringSchedule> {
    const [newSchedule] = await db.insert(recurringSchedules).values(schedule).returning();
    return newSchedule;
  }

  async updateRecurringSchedule(id: string, schedule: Partial<NewRecurringSchedule>): Promise<DbRecurringSchedule | undefined> {
    const [updated] = await db.update(recurringSchedules).set({ ...schedule, updatedAt: new Date() }).where(eq(recurringSchedules.id, id)).returning();
    return updated || undefined;
  }

  async deleteRecurringSchedule(id: string): Promise<boolean> {
    await db.delete(recurringSchedules).where(eq(recurringSchedules.id, id));
    return true;
  }

  // Risk Assessments
  async getRiskAssessments(userId: string): Promise<DbRiskAssessment[]> {
    return db.select().from(riskAssessments).where(eq(riskAssessments.userId, userId)).orderBy(desc(riskAssessments.createdAt));
  }

  async createRiskAssessment(assessment: NewRiskAssessment): Promise<DbRiskAssessment> {
    const [newAssessment] = await db.insert(riskAssessments).values(assessment).returning();
    return newAssessment;
  }

  async updateRiskAssessment(id: string, assessment: Partial<NewRiskAssessment>): Promise<DbRiskAssessment | undefined> {
    const [updated] = await db.update(riskAssessments).set({ ...assessment, updatedAt: new Date() }).where(eq(riskAssessments.id, id)).returning();
    return updated || undefined;
  }

  async deleteRiskAssessment(id: string): Promise<boolean> {
    await db.delete(riskAssessments).where(eq(riskAssessments.id, id));
    return true;
  }

  // Performance Metrics
  async getPerformanceMetrics(userId: string): Promise<DbPerformanceMetric[]> {
    return db.select().from(performanceMetrics).where(eq(performanceMetrics.userId, userId)).orderBy(desc(performanceMetrics.createdAt));
  }

  async createPerformanceMetric(metric: NewPerformanceMetric): Promise<DbPerformanceMetric> {
    const [newMetric] = await db.insert(performanceMetrics).values(metric).returning();
    return newMetric;
  }

  // Notifications
  async getNotifications(userId: string): Promise<DbNotification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: NewNotification): Promise<DbNotification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async updateNotification(id: string, notification: Partial<NewNotification>): Promise<DbNotification | undefined> {
    const [updated] = await db.update(notifications).set(notification).where(eq(notifications.id, id)).returning();
    return updated || undefined;
  }

  async deleteNotification(id: string): Promise<boolean> {
    await db.delete(notifications).where(eq(notifications.id, id));
    return true;
  }

  // Recurring Jobs
  async getRecurringJobs(userId: string): Promise<DbRecurringJob[]> {
    return db.select().from(recurringJobs).where(eq(recurringJobs.userId, userId)).orderBy(desc(recurringJobs.createdAt));
  }

  async createRecurringJob(job: NewRecurringJob): Promise<DbRecurringJob> {
    const [newJob] = await db.insert(recurringJobs).values(job).returning();
    return newJob;
  }

  async updateRecurringJob(id: string, job: Partial<NewRecurringJob>): Promise<DbRecurringJob | undefined> {
    const [updated] = await db.update(recurringJobs).set({ ...job, updatedAt: new Date() }).where(eq(recurringJobs.id, id)).returning();
    return updated || undefined;
  }

  async deleteRecurringJob(id: string): Promise<boolean> {
    await db.delete(recurringJobs).where(eq(recurringJobs.id, id));
    return true;
  }

  // Job Checklists
  async getJobChecklists(userId: string): Promise<DbJobChecklist[]> {
    return db.select().from(jobChecklists).where(eq(jobChecklists.userId, userId)).orderBy(desc(jobChecklists.createdAt));
  }

  async getJobChecklistByJobId(jobId: string): Promise<DbJobChecklist | undefined> {
    const [checklist] = await db.select().from(jobChecklists).where(eq(jobChecklists.jobId, jobId));
    return checklist || undefined;
  }

  async createJobChecklist(checklist: NewJobChecklist): Promise<DbJobChecklist> {
    const [newChecklist] = await db.insert(jobChecklists).values(checklist).returning();
    return newChecklist;
  }

  async updateJobChecklist(id: string, checklist: Partial<NewJobChecklist>): Promise<DbJobChecklist | undefined> {
    const [updated] = await db.update(jobChecklists).set({ ...checklist, updatedAt: new Date() }).where(eq(jobChecklists.id, id)).returning();
    return updated || undefined;
  }

  async deleteJobChecklist(id: string): Promise<boolean> {
    await db.delete(jobChecklists).where(eq(jobChecklists.id, id));
    return true;
  }

  // Suppliers
  async getSuppliers(userId: string): Promise<DbSupplier[]> {
    return db.select().from(suppliers).where(eq(suppliers.userId, userId)).orderBy(desc(suppliers.createdAt));
  }

  async createSupplier(supplier: NewSupplier): Promise<DbSupplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: string, supplier: Partial<NewSupplier>): Promise<DbSupplier | undefined> {
    const [updated] = await db.update(suppliers).set({ ...supplier, updatedAt: new Date() }).where(eq(suppliers.id, id)).returning();
    return updated || undefined;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
    return true;
  }

  // Purchase Orders
  async getPurchaseOrders(userId: string): Promise<DbPurchaseOrder[]> {
    return db.select().from(purchaseOrders).where(eq(purchaseOrders.userId, userId)).orderBy(desc(purchaseOrders.createdAt));
  }

  async createPurchaseOrder(po: NewPurchaseOrder): Promise<DbPurchaseOrder> {
    const [newPO] = await db.insert(purchaseOrders).values(po).returning();
    return newPO;
  }

  async updatePurchaseOrder(id: string, po: Partial<NewPurchaseOrder>): Promise<DbPurchaseOrder | undefined> {
    const [updated] = await db.update(purchaseOrders).set({ ...po, updatedAt: new Date() }).where(eq(purchaseOrders.id, id)).returning();
    return updated || undefined;
  }

  async deletePurchaseOrder(id: string): Promise<boolean> {
    await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
    return true;
  }

  // Training Records
  async getTrainingRecords(userId: string): Promise<DbTrainingRecord[]> {
    return db.select().from(trainingRecords).where(eq(trainingRecords.userId, userId)).orderBy(desc(trainingRecords.createdAt));
  }

  async createTrainingRecord(record: NewTrainingRecord): Promise<DbTrainingRecord> {
    const [newRecord] = await db.insert(trainingRecords).values(record).returning();
    return newRecord;
  }

  async updateTrainingRecord(id: string, record: Partial<NewTrainingRecord>): Promise<DbTrainingRecord | undefined> {
    const [updated] = await db.update(trainingRecords).set({ ...record, updatedAt: new Date() }).where(eq(trainingRecords.id, id)).returning();
    return updated || undefined;
  }

  async deleteTrainingRecord(id: string): Promise<boolean> {
    await db.delete(trainingRecords).where(eq(trainingRecords.id, id));
    return true;
  }

  // Inventory
  async getInventory(userId: string): Promise<DbInventory[]> {
    return db.select().from(inventory).where(eq(inventory.userId, userId)).orderBy(desc(inventory.createdAt));
  }

  async createInventoryItem(item: NewInventory): Promise<DbInventory> {
    const [newItem] = await db.insert(inventory).values(item).returning();
    return newItem;
  }

  async updateInventoryItem(id: string, item: Partial<NewInventory>): Promise<DbInventory | undefined> {
    const [updated] = await db.update(inventory).set({ ...item, updatedAt: new Date() }).where(eq(inventory.id, id)).returning();
    return updated || undefined;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    await db.delete(inventory).where(eq(inventory.id, id));
    return true;
  }

  // Defects
  async getDefects(userId: string): Promise<DbDefect[]> {
    return db.select().from(defects).where(eq(defects.userId, userId)).orderBy(desc(defects.createdAt));
  }

  async createDefect(defect: NewDefect): Promise<DbDefect> {
    const [newDefect] = await db.insert(defects).values(defect).returning();
    return newDefect;
  }

  async updateDefect(id: string, defect: Partial<NewDefect>): Promise<DbDefect | undefined> {
    const [updated] = await db.update(defects).set({ ...defect, updatedAt: new Date() }).where(eq(defects.id, id)).returning();
    return updated || undefined;
  }

  async deleteDefect(id: string): Promise<boolean> {
    await db.delete(defects).where(eq(defects.id, id));
    return true;
  }

  // Document Register
  async getDocumentRegister(userId: string): Promise<DbDocumentRegister[]> {
    return db.select().from(documentRegister).where(eq(documentRegister.userId, userId)).orderBy(desc(documentRegister.createdAt));
  }

  async createDocumentRegisterItem(doc: NewDocumentRegister): Promise<DbDocumentRegister> {
    const [newDoc] = await db.insert(documentRegister).values(doc).returning();
    return newDoc;
  }

  async updateDocumentRegisterItem(id: string, doc: Partial<NewDocumentRegister>): Promise<DbDocumentRegister | undefined> {
    const [updated] = await db.update(documentRegister).set({ ...doc, updatedAt: new Date() }).where(eq(documentRegister.id, id)).returning();
    return updated || undefined;
  }

  async deleteDocumentRegisterItem(id: string): Promise<boolean> {
    await db.delete(documentRegister).where(eq(documentRegister.id, id));
    return true;
  }

  // Mileage Claims
  async getMileageClaims(userId: string): Promise<DbMileageClaim[]> {
    return db.select().from(mileageClaims).where(eq(mileageClaims.userId, userId)).orderBy(desc(mileageClaims.createdAt));
  }

  async createMileageClaim(claim: NewMileageClaim): Promise<DbMileageClaim> {
    const [newClaim] = await db.insert(mileageClaims).values(claim).returning();
    return newClaim;
  }

  async updateMileageClaim(id: string, claim: Partial<NewMileageClaim>): Promise<DbMileageClaim | undefined> {
    const [updated] = await db.update(mileageClaims).set({ ...claim, updatedAt: new Date() }).where(eq(mileageClaims.id, id)).returning();
    return updated || undefined;
  }

  async deleteMileageClaim(id: string): Promise<boolean> {
    await db.delete(mileageClaims).where(eq(mileageClaims.id, id));
    return true;
  }

  // Work Notes
  async getWorkNotes(userId: string): Promise<DbWorkNote[]> {
    return db.select().from(workNotes).where(eq(workNotes.userId, userId)).orderBy(desc(workNotes.createdAt));
  }

  async getWorkNotesByJob(jobId: string): Promise<DbWorkNote[]> {
    return db.select().from(workNotes).where(eq(workNotes.jobId, jobId)).orderBy(desc(workNotes.createdAt));
  }

  async createWorkNote(note: NewWorkNote): Promise<DbWorkNote> {
    const [newNote] = await db.insert(workNotes).values(note).returning();
    return newNote;
  }

  async updateWorkNote(id: string, note: Partial<NewWorkNote>): Promise<DbWorkNote | undefined> {
    const [updated] = await db.update(workNotes).set({ ...note, updatedAt: new Date() }).where(eq(workNotes.id, id)).returning();
    return updated || undefined;
  }

  async deleteWorkNote(id: string): Promise<boolean> {
    await db.delete(workNotes).where(eq(workNotes.id, id));
    return true;
  }

  // Callbacks
  async getCallbacks(userId: string): Promise<DbCallback[]> {
    return db.select().from(callbacks).where(eq(callbacks.userId, userId)).orderBy(desc(callbacks.createdAt));
  }

  async createCallback(callback: NewCallback): Promise<DbCallback> {
    const [newCallback] = await db.insert(callbacks).values(callback).returning();
    return newCallback;
  }

  async updateCallback(id: string, callback: Partial<NewCallback>): Promise<DbCallback | undefined> {
    const [updated] = await db.update(callbacks).set({ ...callback, updatedAt: new Date() }).where(eq(callbacks.id, id)).returning();
    return updated || undefined;
  }

  async deleteCallback(id: string): Promise<boolean> {
    await db.delete(callbacks).where(eq(callbacks.id, id));
    return true;
  }

  // Staff Directory
  async getStaffDirectory(userId: string): Promise<DbStaffMember[]> {
    return db.select().from(staffDirectory).where(or(eq(staffDirectory.userId, userId), eq(staffDirectory.userId, SHARED_USER_ID))).orderBy(desc(staffDirectory.createdAt));
  }

  async createStaffMember(member: NewStaffMember): Promise<DbStaffMember> {
    const [newMember] = await db.insert(staffDirectory).values(member).returning();
    return newMember;
  }

  async updateStaffMember(id: string, member: Partial<NewStaffMember>): Promise<DbStaffMember | undefined> {
    const [updated] = await db.update(staffDirectory).set({ ...member, updatedAt: new Date() }).where(eq(staffDirectory.id, id)).returning();
    return updated || undefined;
  }

  async deleteStaffMember(id: string): Promise<boolean> {
    await db.delete(staffDirectory).where(eq(staffDirectory.id, id));
    return true;
  }

  // Team Invitations
  async getTeamInvitations(userId: string): Promise<DbTeamInvitation[]> {
    return db.select().from(teamInvitations).where(eq(teamInvitations.userId, userId)).orderBy(desc(teamInvitations.createdAt));
  }

  async getTeamInvitationByToken(token: string): Promise<DbTeamInvitation | undefined> {
    const [invitation] = await db.select().from(teamInvitations).where(eq(teamInvitations.token, token));
    return invitation || undefined;
  }

  async createTeamInvitation(invitation: InsertTeamInvitation & { token: string; expiresAt: Date }): Promise<DbTeamInvitation> {
    const [newInvitation] = await db.insert(teamInvitations).values({
      ...invitation,
      status: "pending",
    }).returning();
    return newInvitation;
  }

  async updateTeamInvitation(id: string, data: Partial<DbTeamInvitation>): Promise<DbTeamInvitation | undefined> {
    const [updated] = await db.update(teamInvitations).set(data).where(eq(teamInvitations.id, id)).returning();
    return updated || undefined;
  }

  async deleteTeamInvitation(id: string): Promise<boolean> {
    await db.delete(teamInvitations).where(eq(teamInvitations.id, id));
    return true;
  }

  // Price Lists
  async getPriceLists(userId: string): Promise<DbPriceList[]> {
    return db.select().from(priceLists).where(eq(priceLists.userId, userId)).orderBy(desc(priceLists.createdAt));
  }

  async createPriceList(item: NewPriceList): Promise<DbPriceList> {
    const [newItem] = await db.insert(priceLists).values(item).returning();
    return newItem;
  }

  async updatePriceList(id: string, item: Partial<NewPriceList>): Promise<DbPriceList | undefined> {
    const [updated] = await db.update(priceLists).set({ ...item, updatedAt: new Date() }).where(eq(priceLists.id, id)).returning();
    return updated || undefined;
  }

  async deletePriceList(id: string): Promise<boolean> {
    await db.delete(priceLists).where(eq(priceLists.id, id));
    return true;
  }

  // Customer Feedback
  async getCustomerFeedback(userId: string): Promise<DbCustomerFeedback[]> {
    return db.select().from(customerFeedback).where(eq(customerFeedback.userId, userId)).orderBy(desc(customerFeedback.createdAt));
  }

  async createCustomerFeedback(feedback: NewCustomerFeedback): Promise<DbCustomerFeedback> {
    const [newItem] = await db.insert(customerFeedback).values(feedback).returning();
    return newItem;
  }

  async updateCustomerFeedback(id: string, feedback: Partial<NewCustomerFeedback>): Promise<DbCustomerFeedback | undefined> {
    const [updated] = await db.update(customerFeedback).set({ ...feedback, updatedAt: new Date() }).where(eq(customerFeedback.id, id)).returning();
    return updated || undefined;
  }

  async deleteCustomerFeedback(id: string): Promise<boolean> {
    await db.delete(customerFeedback).where(eq(customerFeedback.id, id));
    return true;
  }

  // Service Level Agreements
  async getSLAs(userId: string): Promise<DbSLA[]> {
    return db.select().from(serviceLevelAgreements).where(eq(serviceLevelAgreements.userId, userId)).orderBy(desc(serviceLevelAgreements.createdAt));
  }

  async createSLA(sla: NewSLA): Promise<DbSLA> {
    const [newItem] = await db.insert(serviceLevelAgreements).values(sla).returning();
    return newItem;
  }

  async updateSLA(id: string, sla: Partial<NewSLA>): Promise<DbSLA | undefined> {
    const [updated] = await db.update(serviceLevelAgreements).set({ ...sla, updatedAt: new Date() }).where(eq(serviceLevelAgreements.id, id)).returning();
    return updated || undefined;
  }

  async deleteSLA(id: string): Promise<boolean> {
    await db.delete(serviceLevelAgreements).where(eq(serviceLevelAgreements.id, id));
    return true;
  }

  // Parts Catalog
  async getPartsCatalog(userId: string): Promise<DbPartsCatalog[]> {
    return db.select().from(partsCatalog).where(eq(partsCatalog.userId, userId)).orderBy(desc(partsCatalog.createdAt));
  }

  async createPart(part: NewPartsCatalog): Promise<DbPartsCatalog> {
    const [newItem] = await db.insert(partsCatalog).values(part).returning();
    return newItem;
  }

  async updatePart(id: string, part: Partial<NewPartsCatalog>): Promise<DbPartsCatalog | undefined> {
    const [updated] = await db.update(partsCatalog).set({ ...part, updatedAt: new Date() }).where(eq(partsCatalog.id, id)).returning();
    return updated || undefined;
  }

  async deletePart(id: string): Promise<boolean> {
    await db.delete(partsCatalog).where(eq(partsCatalog.id, id));
    return true;
  }

  // Document Templates
  async getDocumentTemplates(userId: string): Promise<DbDocumentTemplate[]> {
    return db.select().from(documentTemplates).where(eq(documentTemplates.userId, userId)).orderBy(desc(documentTemplates.createdAt));
  }

  async createDocumentTemplate(template: NewDocumentTemplate): Promise<DbDocumentTemplate> {
    const [newItem] = await db.insert(documentTemplates).values(template).returning();
    return newItem;
  }

  async updateDocumentTemplate(id: string, template: Partial<NewDocumentTemplate>): Promise<DbDocumentTemplate | undefined> {
    const [updated] = await db.update(documentTemplates).set({ ...template, updatedAt: new Date() }).where(eq(documentTemplates.id, id)).returning();
    return updated || undefined;
  }

  async deleteDocumentTemplate(id: string): Promise<boolean> {
    await db.delete(documentTemplates).where(eq(documentTemplates.id, id));
    return true;
  }

  // Warranties
  async getWarranties(userId: string): Promise<DbWarranty[]> {
    return db.select().from(warranties).where(eq(warranties.userId, userId)).orderBy(desc(warranties.createdAt));
  }

  async createWarranty(warranty: NewWarranty): Promise<DbWarranty> {
    const [newItem] = await db.insert(warranties).values(warranty).returning();
    return newItem;
  }

  async updateWarranty(id: string, warranty: Partial<NewWarranty>): Promise<DbWarranty | undefined> {
    const [updated] = await db.update(warranties).set({ ...warranty, updatedAt: new Date() }).where(eq(warranties.id, id)).returning();
    return updated || undefined;
  }

  async deleteWarranty(id: string): Promise<boolean> {
    await db.delete(warranties).where(eq(warranties.id, id));
    return true;
  }

  // Competitors
  async getCompetitors(userId: string): Promise<DbCompetitor[]> {
    return db.select().from(competitors).where(eq(competitors.userId, userId)).orderBy(desc(competitors.createdAt));
  }

  async createCompetitor(competitor: NewCompetitor): Promise<DbCompetitor> {
    const [newItem] = await db.insert(competitors).values(competitor).returning();
    return newItem;
  }

  async updateCompetitor(id: string, competitor: Partial<NewCompetitor>): Promise<DbCompetitor | undefined> {
    const [updated] = await db.update(competitors).set({ ...competitor, updatedAt: new Date() }).where(eq(competitors.id, id)).returning();
    return updated || undefined;
  }

  async deleteCompetitor(id: string): Promise<boolean> {
    await db.delete(competitors).where(eq(competitors.id, id));
    return true;
  }

  // Service History
  async getServiceHistory(userId: string): Promise<DbServiceHistory[]> {
    return db.select().from(serviceHistory).where(eq(serviceHistory.userId, userId)).orderBy(desc(serviceHistory.createdAt));
  }

  async createServiceHistory(history: NewServiceHistory): Promise<DbServiceHistory> {
    const [newItem] = await db.insert(serviceHistory).values(history).returning();
    return newItem;
  }

  async updateServiceHistory(id: string, history: Partial<NewServiceHistory>): Promise<DbServiceHistory | undefined> {
    const [updated] = await db.update(serviceHistory).set({ ...history, updatedAt: new Date() }).where(eq(serviceHistory.id, id)).returning();
    return updated || undefined;
  }

  async deleteServiceHistory(id: string): Promise<boolean> {
    await db.delete(serviceHistory).where(eq(serviceHistory.id, id));
    return true;
  }

  // Quality Checklists
  async getQualityChecklists(userId: string): Promise<DbQualityChecklist[]> {
    return db.select().from(qualityChecklists).where(eq(qualityChecklists.userId, userId)).orderBy(desc(qualityChecklists.createdAt));
  }

  async createQualityChecklist(checklist: NewQualityChecklist): Promise<DbQualityChecklist> {
    const [newItem] = await db.insert(qualityChecklists).values(checklist).returning();
    return newItem;
  }

  async updateQualityChecklist(id: string, checklist: Partial<NewQualityChecklist>): Promise<DbQualityChecklist | undefined> {
    const [updated] = await db.update(qualityChecklists).set({ ...checklist, updatedAt: new Date() }).where(eq(qualityChecklists.id, id)).returning();
    return updated || undefined;
  }

  async deleteQualityChecklist(id: string): Promise<boolean> {
    await db.delete(qualityChecklists).where(eq(qualityChecklists.id, id));
    return true;
  }

  // Time Off Requests
  async getTimeOffRequests(userId: string): Promise<DbTimeOffRequest[]> {
    return db.select().from(timeOffRequests).where(eq(timeOffRequests.userId, userId)).orderBy(desc(timeOffRequests.createdAt));
  }

  async createTimeOffRequest(request: NewTimeOffRequest): Promise<DbTimeOffRequest> {
    const [newItem] = await db.insert(timeOffRequests).values(request).returning();
    return newItem;
  }

  async updateTimeOffRequest(id: string, request: Partial<NewTimeOffRequest>): Promise<DbTimeOffRequest | undefined> {
    const [updated] = await db.update(timeOffRequests).set({ ...request, updatedAt: new Date() }).where(eq(timeOffRequests.id, id)).returning();
    return updated || undefined;
  }

  async deleteTimeOffRequest(id: string): Promise<boolean> {
    await db.delete(timeOffRequests).where(eq(timeOffRequests.id, id));
    return true;
  }

  // Visit Types
  async getVisitTypes(userId: string): Promise<DbVisitType[]> {
    return db.select().from(visitTypes).where(eq(visitTypes.userId, userId)).orderBy(visitTypes.sortOrder);
  }

  async createVisitType(visitType: NewVisitType): Promise<DbVisitType> {
    const [newItem] = await db.insert(visitTypes).values(visitType).returning();
    return newItem;
  }

  async updateVisitType(id: string, visitType: Partial<NewVisitType>): Promise<DbVisitType | undefined> {
    const [updated] = await db.update(visitTypes).set({ ...visitType, updatedAt: new Date() }).where(eq(visitTypes.id, id)).returning();
    return updated || undefined;
  }

  async deleteVisitType(id: string): Promise<boolean> {
    await db.delete(visitTypes).where(eq(visitTypes.id, id));
    return true;
  }

  // Service Templates
  async getServiceTemplates(userId: string): Promise<DbServiceTemplate[]> {
    return db.select().from(serviceTemplates).where(eq(serviceTemplates.userId, userId)).orderBy(serviceTemplates.sortOrder);
  }

  async getServiceTemplatesByVisitType(visitTypeId: string): Promise<DbServiceTemplate[]> {
    return db.select().from(serviceTemplates).where(eq(serviceTemplates.visitTypeId, visitTypeId)).orderBy(serviceTemplates.sortOrder);
  }

  async createServiceTemplate(template: NewServiceTemplate): Promise<DbServiceTemplate> {
    const [newItem] = await db.insert(serviceTemplates).values(template).returning();
    return newItem;
  }

  async updateServiceTemplate(id: string, template: Partial<NewServiceTemplate>): Promise<DbServiceTemplate | undefined> {
    const [updated] = await db.update(serviceTemplates).set({ ...template, updatedAt: new Date() }).where(eq(serviceTemplates.id, id)).returning();
    return updated || undefined;
  }

  async deleteServiceTemplate(id: string): Promise<boolean> {
    await db.delete(serviceTemplates).where(eq(serviceTemplates.id, id));
    return true;
  }

  // Site Assets
  async getSiteAssets(userId: string): Promise<DbSiteAsset[]> {
    return db.select().from(siteAssets).where(eq(siteAssets.userId, userId)).orderBy(desc(siteAssets.createdAt));
  }

  async getSiteAssetsByProject(projectId: string): Promise<DbSiteAsset[]> {
    return db.select().from(siteAssets).where(eq(siteAssets.projectId, projectId)).orderBy(siteAssets.floor, siteAssets.assetNumber);
  }

  async createSiteAsset(asset: NewSiteAsset): Promise<DbSiteAsset> {
    const [newItem] = await db.insert(siteAssets).values(asset).returning();
    return newItem;
  }

  async createSiteAssetsBulk(assets: NewSiteAsset[]): Promise<DbSiteAsset[]> {
    if (assets.length === 0) return [];
    const newItems = await db.insert(siteAssets).values(assets).returning();
    return newItems;
  }

  async updateSiteAsset(id: string, asset: Partial<NewSiteAsset>): Promise<DbSiteAsset | undefined> {
    const [updated] = await db.update(siteAssets).set({ ...asset, updatedAt: new Date() }).where(eq(siteAssets.id, id)).returning();
    return updated || undefined;
  }

  async deleteSiteAsset(id: string): Promise<boolean> {
    await db.delete(siteAssets).where(eq(siteAssets.id, id));
    return true;
  }

  async getSiteAssetsBySite(siteId: string): Promise<DbSiteAsset[]> {
    return db.select().from(siteAssets).where(eq(siteAssets.siteId, siteId)).orderBy(siteAssets.floor, siteAssets.assetNumber);
  }

  async getSiteAssetsByClient(clientId: string): Promise<DbSiteAsset[]> {
    return db.select().from(siteAssets).where(eq(siteAssets.clientId, clientId)).orderBy(siteAssets.floor, siteAssets.assetNumber);
  }

  // Sites (Buildings)
  async getSites(userId: string): Promise<DbSite[]> {
    return db.select().from(sites).where(or(eq(sites.userId, userId), eq(sites.userId, SHARED_USER_ID))).orderBy(sites.name);
  }

  async getSitesByClient(clientId: string): Promise<DbSite[]> {
    return db.select().from(sites).where(eq(sites.clientId, clientId)).orderBy(sites.name);
  }

  async getSite(id: string): Promise<DbSite | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.id, id));
    return site || undefined;
  }

  async createSite(site: NewSite): Promise<DbSite> {
    const [newSite] = await db.insert(sites).values(site).returning();
    return newSite;
  }

  async updateSite(id: string, site: Partial<NewSite>): Promise<DbSite | undefined> {
    const [updated] = await db.update(sites).set({ ...site, updatedAt: new Date() }).where(eq(sites.id, id)).returning();
    return updated || undefined;
  }

  async deleteSite(id: string): Promise<boolean> {
    await db.delete(sites).where(eq(sites.id, id));
    return true;
  }

  // Job Site Assets (junction table)
  async getJobSiteAssets(jobId: string): Promise<DbJobSiteAsset[]> {
    return db.select().from(jobSiteAssets).where(eq(jobSiteAssets.jobId, jobId)).orderBy(jobSiteAssets.createdAt);
  }

  async getJobSiteAssetsWithDetails(jobId: string): Promise<(DbJobSiteAsset & { asset: DbSiteAsset })[]> {
    const results = await db
      .select()
      .from(jobSiteAssets)
      .innerJoin(siteAssets, eq(jobSiteAssets.siteAssetId, siteAssets.id))
      .where(eq(jobSiteAssets.jobId, jobId));
    
    return results.map(r => ({
      ...r.job_site_assets,
      asset: r.site_assets
    }));
  }

  async createJobSiteAsset(assignment: NewJobSiteAsset): Promise<DbJobSiteAsset> {
    const [newItem] = await db.insert(jobSiteAssets).values(assignment).returning();
    return newItem;
  }

  async createJobSiteAssetsBulk(assignments: NewJobSiteAsset[]): Promise<DbJobSiteAsset[]> {
    if (assignments.length === 0) return [];
    const newItems = await db.insert(jobSiteAssets).values(assignments).returning();
    return newItems;
  }

  async updateJobSiteAsset(id: string, update: Partial<NewJobSiteAsset>): Promise<DbJobSiteAsset | undefined> {
    const [updated] = await db.update(jobSiteAssets).set({ ...update, updatedAt: new Date() }).where(eq(jobSiteAssets.id, id)).returning();
    return updated || undefined;
  }

  async deleteJobSiteAsset(id: string): Promise<boolean> {
    await db.delete(jobSiteAssets).where(eq(jobSiteAssets.id, id));
    return true;
  }

  async deleteJobSiteAssetsByJob(jobId: string): Promise<boolean> {
    await db.delete(jobSiteAssets).where(eq(jobSiteAssets.jobId, jobId));
    return true;
  }

  // Asset Batches
  async getAssetBatches(userId: string): Promise<DbAssetBatch[]> {
    return db.select().from(assetBatches).where(eq(assetBatches.userId, userId)).orderBy(desc(assetBatches.createdAt));
  }

  async createAssetBatch(batch: NewAssetBatch): Promise<DbAssetBatch> {
    const [newItem] = await db.insert(assetBatches).values(batch).returning();
    return newItem;
  }

  async updateAssetBatch(id: string, batch: Partial<NewAssetBatch>): Promise<DbAssetBatch | undefined> {
    const [updated] = await db.update(assetBatches).set({ ...batch, updatedAt: new Date() }).where(eq(assetBatches.id, id)).returning();
    return updated || undefined;
  }

  async deleteAssetBatch(id: string): Promise<boolean> {
    await db.delete(assetBatches).where(eq(assetBatches.id, id));
    return true;
  }

  // Job Assignments
  async getJobAssignments(userId: string): Promise<DbJobAssignment[]> {
    return db.select().from(jobAssignments).where(eq(jobAssignments.userId, userId)).orderBy(desc(jobAssignments.createdAt));
  }

  async getJobAssignmentsByJob(jobId: string): Promise<DbJobAssignment[]> {
    return db.select().from(jobAssignments).where(eq(jobAssignments.jobId, jobId));
  }

  async createJobAssignment(assignment: NewJobAssignment): Promise<DbJobAssignment> {
    const [newItem] = await db.insert(jobAssignments).values(assignment).returning();
    return newItem;
  }

  async updateJobAssignment(id: string, assignment: Partial<NewJobAssignment>): Promise<DbJobAssignment | undefined> {
    const [updated] = await db.update(jobAssignments).set({ ...assignment, updatedAt: new Date() }).where(eq(jobAssignments.id, id)).returning();
    return updated || undefined;
  }

  async deleteJobAssignment(id: string): Promise<boolean> {
    await db.delete(jobAssignments).where(eq(jobAssignments.id, id));
    return true;
  }

  // Job Skill Requirements
  async getJobSkillRequirements(userId: string): Promise<DbJobSkillRequirement[]> {
    return db.select().from(jobSkillRequirements).where(eq(jobSkillRequirements.userId, userId)).orderBy(desc(jobSkillRequirements.createdAt));
  }

  async getJobSkillRequirementsByJob(jobId: string): Promise<DbJobSkillRequirement[]> {
    return db.select().from(jobSkillRequirements).where(eq(jobSkillRequirements.jobId, jobId));
  }

  async createJobSkillRequirement(requirement: NewJobSkillRequirement): Promise<DbJobSkillRequirement> {
    const [newItem] = await db.insert(jobSkillRequirements).values(requirement).returning();
    return newItem;
  }

  async updateJobSkillRequirement(id: string, requirement: Partial<NewJobSkillRequirement>): Promise<DbJobSkillRequirement | undefined> {
    const [updated] = await db.update(jobSkillRequirements).set(requirement).where(eq(jobSkillRequirements.id, id)).returning();
    return updated || undefined;
  }

  async deleteJobSkillRequirement(id: string): Promise<boolean> {
    await db.delete(jobSkillRequirements).where(eq(jobSkillRequirements.id, id));
    return true;
  }

  // Job Equipment Reservations
  async getJobEquipmentReservations(userId: string): Promise<DbJobEquipmentReservation[]> {
    return db.select().from(jobEquipmentReservations).where(eq(jobEquipmentReservations.userId, userId)).orderBy(desc(jobEquipmentReservations.createdAt));
  }

  async getJobEquipmentReservationsByJob(jobId: string): Promise<DbJobEquipmentReservation[]> {
    return db.select().from(jobEquipmentReservations).where(eq(jobEquipmentReservations.jobId, jobId));
  }

  async createJobEquipmentReservation(reservation: NewJobEquipmentReservation): Promise<DbJobEquipmentReservation> {
    const [newItem] = await db.insert(jobEquipmentReservations).values(reservation).returning();
    return newItem;
  }

  async updateJobEquipmentReservation(id: string, reservation: Partial<NewJobEquipmentReservation>): Promise<DbJobEquipmentReservation | undefined> {
    const [updated] = await db.update(jobEquipmentReservations).set({ ...reservation, updatedAt: new Date() }).where(eq(jobEquipmentReservations.id, id)).returning();
    return updated || undefined;
  }

  async deleteJobEquipmentReservation(id: string): Promise<boolean> {
    await db.delete(jobEquipmentReservations).where(eq(jobEquipmentReservations.id, id));
    return true;
  }

  // Job Parts Used
  async getJobPartsUsed(userId: string): Promise<DbJobPartsUsed[]> {
    return db.select().from(jobPartsUsed).where(eq(jobPartsUsed.userId, userId)).orderBy(desc(jobPartsUsed.createdAt));
  }

  async getJobPartsUsedByJob(jobId: string): Promise<DbJobPartsUsed[]> {
    return db.select().from(jobPartsUsed).where(eq(jobPartsUsed.jobId, jobId)).orderBy(desc(jobPartsUsed.createdAt));
  }

  async createJobPartsUsed(part: NewJobPartsUsed): Promise<DbJobPartsUsed> {
    const [newItem] = await db.insert(jobPartsUsed).values(part).returning();
    return newItem;
  }

  async updateJobPartsUsed(id: string, part: Partial<NewJobPartsUsed>): Promise<DbJobPartsUsed | undefined> {
    const [updated] = await db.update(jobPartsUsed).set({ ...part, updatedAt: new Date() }).where(eq(jobPartsUsed.id, id)).returning();
    return updated || undefined;
  }

  async deleteJobPartsUsed(id: string): Promise<boolean> {
    await db.delete(jobPartsUsed).where(eq(jobPartsUsed.id, id));
    return true;
  }

  // Staff Availability
  async getStaffAvailability(userId: string): Promise<DbStaffAvailability[]> {
    return db.select().from(staffAvailability).where(eq(staffAvailability.userId, userId)).orderBy(desc(staffAvailability.createdAt));
  }

  async getStaffAvailabilityByStaff(staffId: string): Promise<DbStaffAvailability[]> {
    return db.select().from(staffAvailability).where(eq(staffAvailability.staffId, staffId));
  }

  async createStaffAvailability(availability: NewStaffAvailability): Promise<DbStaffAvailability> {
    const [newItem] = await db.insert(staffAvailability).values(availability).returning();
    return newItem;
  }

  async updateStaffAvailability(id: string, availability: Partial<NewStaffAvailability>): Promise<DbStaffAvailability | undefined> {
    const [updated] = await db.update(staffAvailability).set(availability).where(eq(staffAvailability.id, id)).returning();
    return updated || undefined;
  }

  async deleteStaffAvailability(id: string): Promise<boolean> {
    await db.delete(staffAvailability).where(eq(staffAvailability.id, id));
    return true;
  }

  // Job Time Windows
  async getJobTimeWindows(userId: string): Promise<DbJobTimeWindow[]> {
    return db.select().from(jobTimeWindows).where(eq(jobTimeWindows.userId, userId)).orderBy(desc(jobTimeWindows.createdAt));
  }

  async getJobTimeWindowsByJob(jobId: string): Promise<DbJobTimeWindow[]> {
    return db.select().from(jobTimeWindows).where(eq(jobTimeWindows.jobId, jobId));
  }

  async createJobTimeWindow(timeWindow: NewJobTimeWindow): Promise<DbJobTimeWindow> {
    const [newItem] = await db.insert(jobTimeWindows).values(timeWindow).returning();
    return newItem;
  }

  async updateJobTimeWindow(id: string, timeWindow: Partial<NewJobTimeWindow>): Promise<DbJobTimeWindow | undefined> {
    const [updated] = await db.update(jobTimeWindows).set({ ...timeWindow, updatedAt: new Date() }).where(eq(jobTimeWindows.id, id)).returning();
    return updated || undefined;
  }

  async deleteJobTimeWindow(id: string): Promise<boolean> {
    await db.delete(jobTimeWindows).where(eq(jobTimeWindows.id, id));
    return true;
  }

  // Shift Handovers
  async getShiftHandovers(userId: string): Promise<DbShiftHandover[]> {
    return db.select().from(shiftHandovers).where(eq(shiftHandovers.userId, userId)).orderBy(desc(shiftHandovers.createdAt));
  }

  async createShiftHandover(handover: NewShiftHandover): Promise<DbShiftHandover> {
    const [newItem] = await db.insert(shiftHandovers).values(handover).returning();
    return newItem;
  }

  async updateShiftHandover(id: string, handover: Partial<NewShiftHandover>): Promise<DbShiftHandover | undefined> {
    const [updated] = await db.update(shiftHandovers).set(handover).where(eq(shiftHandovers.id, id)).returning();
    return updated || undefined;
  }

  async deleteShiftHandover(id: string): Promise<boolean> {
    await db.delete(shiftHandovers).where(eq(shiftHandovers.id, id));
    return true;
  }

  // Daily Briefings
  async getDailyBriefings(userId: string): Promise<DbDailyBriefing[]> {
    return db.select().from(dailyBriefings).where(eq(dailyBriefings.userId, userId)).orderBy(desc(dailyBriefings.createdAt));
  }

  async createDailyBriefing(briefing: NewDailyBriefing): Promise<DbDailyBriefing> {
    const [newItem] = await db.insert(dailyBriefings).values(briefing).returning();
    return newItem;
  }

  async updateDailyBriefing(id: string, briefing: Partial<NewDailyBriefing>): Promise<DbDailyBriefing | undefined> {
    const [updated] = await db.update(dailyBriefings).set(briefing).where(eq(dailyBriefings.id, id)).returning();
    return updated || undefined;
  }

  async deleteDailyBriefing(id: string): Promise<boolean> {
    await db.delete(dailyBriefings).where(eq(dailyBriefings.id, id));
    return true;
  }

  // Service Reminders
  async getServiceReminders(userId: string): Promise<DbServiceReminder[]> {
    return db.select().from(serviceReminders).where(eq(serviceReminders.userId, userId)).orderBy(desc(serviceReminders.createdAt));
  }

  async createServiceReminder(reminder: NewServiceReminder): Promise<DbServiceReminder> {
    const [newItem] = await db.insert(serviceReminders).values(reminder).returning();
    return newItem;
  }

  async updateServiceReminder(id: string, reminder: Partial<NewServiceReminder>): Promise<DbServiceReminder | undefined> {
    const [updated] = await db.update(serviceReminders).set({ ...reminder, updatedAt: new Date() }).where(eq(serviceReminders.id, id)).returning();
    return updated || undefined;
  }

  async deleteServiceReminder(id: string): Promise<boolean> {
    await db.delete(serviceReminders).where(eq(serviceReminders.id, id));
    return true;
  }

  // Location Coordinates
  async getLocationCoordinates(userId: string): Promise<DbLocationCoordinate[]> {
    return db.select().from(locationCoordinates).where(eq(locationCoordinates.userId, userId)).orderBy(desc(locationCoordinates.createdAt));
  }

  async createLocationCoordinate(coordinate: NewLocationCoordinate): Promise<DbLocationCoordinate> {
    const [newItem] = await db.insert(locationCoordinates).values(coordinate).returning();
    return newItem;
  }

  async updateLocationCoordinate(id: string, coordinate: Partial<NewLocationCoordinate>): Promise<DbLocationCoordinate | undefined> {
    const [updated] = await db.update(locationCoordinates).set(coordinate).where(eq(locationCoordinates.id, id)).returning();
    return updated || undefined;
  }

  async deleteLocationCoordinate(id: string): Promise<boolean> {
    await db.delete(locationCoordinates).where(eq(locationCoordinates.id, id));
    return true;
  }

  // Scheduling Conflicts
  async getSchedulingConflicts(userId: string): Promise<DbSchedulingConflict[]> {
    return db.select().from(schedulingConflicts).where(eq(schedulingConflicts.userId, userId)).orderBy(desc(schedulingConflicts.createdAt));
  }

  async createSchedulingConflict(conflict: NewSchedulingConflict): Promise<DbSchedulingConflict> {
    const [newItem] = await db.insert(schedulingConflicts).values(conflict).returning();
    return newItem;
  }

  async updateSchedulingConflict(id: string, conflict: Partial<NewSchedulingConflict>): Promise<DbSchedulingConflict | undefined> {
    const [updated] = await db.update(schedulingConflicts).set(conflict).where(eq(schedulingConflicts.id, id)).returning();
    return updated || undefined;
  }

  async deleteSchedulingConflict(id: string): Promise<boolean> {
    await db.delete(schedulingConflicts).where(eq(schedulingConflicts.id, id));
    return true;
  }

  // Capacity Snapshots
  async getCapacitySnapshots(userId: string): Promise<DbCapacitySnapshot[]> {
    return db.select().from(capacitySnapshots).where(eq(capacitySnapshots.userId, userId)).orderBy(desc(capacitySnapshots.createdAt));
  }

  async createCapacitySnapshot(snapshot: NewCapacitySnapshot): Promise<DbCapacitySnapshot> {
    const [newItem] = await db.insert(capacitySnapshots).values(snapshot).returning();
    return newItem;
  }

  async deleteCapacitySnapshot(id: string): Promise<boolean> {
    await db.delete(capacitySnapshots).where(eq(capacitySnapshots.id, id));
    return true;
  }

  // Check Sheet Templates
  async getCheckSheetTemplates(userId: string): Promise<DbCheckSheetTemplate[]> {
    return db.select().from(checkSheetTemplates).where(eq(checkSheetTemplates.userId, userId)).orderBy(desc(checkSheetTemplates.createdAt));
  }

  async getCheckSheetTemplate(id: string): Promise<DbCheckSheetTemplate | undefined> {
    const [item] = await db.select().from(checkSheetTemplates).where(eq(checkSheetTemplates.id, id));
    return item || undefined;
  }

  async getCheckSheetTemplatesBySystemType(userId: string, systemType: string): Promise<DbCheckSheetTemplate[]> {
    return db.select().from(checkSheetTemplates).where(and(eq(checkSheetTemplates.userId, userId), eq(checkSheetTemplates.systemType, systemType)));
  }

  async createCheckSheetTemplate(template: NewCheckSheetTemplate): Promise<DbCheckSheetTemplate> {
    const [newItem] = await db.insert(checkSheetTemplates).values(template).returning();
    return newItem;
  }

  async updateCheckSheetTemplate(id: string, template: Partial<NewCheckSheetTemplate>): Promise<DbCheckSheetTemplate | undefined> {
    const [updated] = await db.update(checkSheetTemplates).set({ ...template, updatedAt: new Date() }).where(eq(checkSheetTemplates.id, id)).returning();
    return updated || undefined;
  }

  async deleteCheckSheetTemplate(id: string): Promise<boolean> {
    await db.delete(checkSheetTemplates).where(eq(checkSheetTemplates.id, id));
    return true;
  }

  // Check Sheet Readings
  async getCheckSheetReadings(userId: string): Promise<DbCheckSheetReading[]> {
    return db.select().from(checkSheetReadings).where(eq(checkSheetReadings.userId, userId)).orderBy(desc(checkSheetReadings.createdAt));
  }

  async getCheckSheetReading(id: string): Promise<DbCheckSheetReading | undefined> {
    const [item] = await db.select().from(checkSheetReadings).where(eq(checkSheetReadings.id, id));
    return item || undefined;
  }

  async getCheckSheetReadingsByJob(jobId: string): Promise<DbCheckSheetReading[]> {
    return db.select().from(checkSheetReadings).where(eq(checkSheetReadings.jobId, jobId)).orderBy(desc(checkSheetReadings.createdAt));
  }

  async createCheckSheetReading(reading: NewCheckSheetReading): Promise<DbCheckSheetReading> {
    const [newItem] = await db.insert(checkSheetReadings).values(reading).returning();
    return newItem;
  }

  async updateCheckSheetReading(id: string, reading: Partial<NewCheckSheetReading>): Promise<DbCheckSheetReading | undefined> {
    const [updated] = await db.update(checkSheetReadings).set({ ...reading, updatedAt: new Date() }).where(eq(checkSheetReadings.id, id)).returning();
    return updated || undefined;
  }

  async deleteCheckSheetReading(id: string): Promise<boolean> {
    await db.delete(checkSheetReadings).where(eq(checkSheetReadings.id, id));
    return true;
  }

  // Organization methods
  async getOrganization(id: string): Promise<DbOrganization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org || undefined;
  }

  async getOrganizationByOwnerId(ownerId: string): Promise<DbOrganization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.ownerId, ownerId));
    return org || undefined;
  }

  async createOrganization(data: NewOrganization): Promise<DbOrganization> {
    const [newOrg] = await db.insert(organizations).values(data).returning();
    return newOrg;
  }

  async updateOrganization(id: string, data: Partial<NewOrganization>): Promise<DbOrganization | undefined> {
    const [updated] = await db.update(organizations).set({ ...data, updatedAt: new Date() }).where(eq(organizations.id, id)).returning();
    return updated || undefined;
  }

  // Organization members
  async getOrganizationMembers(organizationId: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.organizationId, organizationId));
  }

  // Valid roles that can be assigned (owner is only set when creating organization)
  private readonly VALID_ASSIGNABLE_ROLES = ["admin", "office_staff", "engineer", "viewer"];
  private readonly ALL_VALID_ROLES = ["owner", "admin", "office_staff", "engineer", "viewer"];

  async updateUserOrganization(userId: string, organizationId: string, role: string): Promise<User | undefined> {
    // Validate role - only allow valid assignable roles (not 'owner' via this method except for initial setup)
    if (!this.ALL_VALID_ROLES.includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }
    
    // Prevent changing role of existing owner (unless this is initial setup where user has no org)
    const existingUser = await this.getUser(userId);
    if (existingUser?.organizationRole === "owner" && role !== "owner") {
      throw new Error("Cannot change owner role");
    }
    
    const [updated] = await db.update(users).set({ organizationId, organizationRole: role, updatedAt: new Date() }).where(eq(users.id, userId)).returning();
    return updated || undefined;
  }

  async removeUserFromOrganization(userId: string): Promise<void> {
    // Prevent removing owner
    const user = await this.getUser(userId);
    if (user?.organizationRole === "owner") {
      throw new Error("Cannot remove organization owner");
    }
    
    await db.update(users).set({ organizationId: null, organizationRole: null, updatedAt: new Date() }).where(eq(users.id, userId));
  }

  // Organization invitations
  async getOrganizationInvitations(organizationId: string): Promise<DbOrganizationInvitation[]> {
    return db.select().from(organizationInvitations).where(eq(organizationInvitations.organizationId, organizationId)).orderBy(desc(organizationInvitations.createdAt));
  }

  async getInvitationByToken(token: string): Promise<DbOrganizationInvitation | undefined> {
    const [invitation] = await db.select().from(organizationInvitations).where(eq(organizationInvitations.token, token));
    return invitation || undefined;
  }

  async createOrganizationInvitation(data: NewOrganizationInvitation): Promise<DbOrganizationInvitation> {
    const [newInvitation] = await db.insert(organizationInvitations).values(data).returning();
    return newInvitation;
  }

  async acceptInvitation(token: string, userId: string): Promise<void> {
    const invitation = await this.getInvitationByToken(token);
    if (!invitation || invitation.acceptedAt) {
      throw new Error("Invalid or already accepted invitation");
    }
    
    // Check invitation expiry
    if (new Date(invitation.expiresAt) < new Date()) {
      throw new Error("Invitation has expired");
    }
    
    // Validate and clamp role to valid assignable roles (never allow owner via invitation)
    let role = invitation.role || 'engineer';
    if (!this.VALID_ASSIGNABLE_ROLES.includes(role)) {
      role = 'engineer'; // Default to safe role if invalid
    }
    
    // Check user doesn't already belong to an organization
    const user = await this.getUser(userId);
    if (user?.organizationId) {
      throw new Error("User already belongs to an organization");
    }
    
    await db.update(organizationInvitations).set({ acceptedAt: new Date() }).where(eq(organizationInvitations.token, token));
    await db.update(users).set({ organizationId: invitation.organizationId, organizationRole: role, updatedAt: new Date() }).where(eq(users.id, userId));
  }

  async deleteOrganizationInvitation(id: string): Promise<void> {
    await db.delete(organizationInvitations).where(eq(organizationInvitations.id, id));
  }
}

export const storage = new DatabaseStorage();
