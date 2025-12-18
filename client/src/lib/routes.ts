export const ROUTES = {
  DASHBOARD: "/dashboard",
  FIELD_COMPANION: "/field-companion",
  FIELD_JOB_DETAIL: "/field-companion/:id",
  FIELD_JOB_FORMS: "/field-companion/:id/forms",
  FIELD_TESTING: "/test",
  SCHEDULE: "/schedule",
  CLIENTS: "/clients",
  CLIENT_DETAIL: "/clients/:id",
  SITES: "/sites",
  SITE_DETAIL: "/sites/:id",
  CONTRACTS: "/contracts",
  JOBS: "/jobs",
  JOB_DETAIL: "/jobs/:id",
  FINANCE: "/finance",
  EXPENSES: "/expenses",
  TIMESHEETS: "/timesheets",
  VEHICLES: "/vehicles",
  SUBCONTRACTORS: "/subcontractors",
  HOLIDAYS: "/holidays",
  PROFITABILITY: "/profitability",
  REPORTS: "/reports",
  EQUIPMENT: "/equipment",
  CERTIFICATIONS: "/certifications",
  LEADS: "/leads",
  SITE_ACCESS: "/site-access",
  INCIDENTS: "/incidents",
  TENDERS: "/tenders",
  RISK_ASSESSMENTS: "/risk-assessments",
  JOB_TEMPLATES: "/job-templates",
  RECURRING_JOBS: "/recurring-jobs",
  NOTIFICATIONS: "/notifications",
  SUPPLIERS: "/suppliers",
  PURCHASE_ORDERS: "/purchase-orders",
  TRAINING_RECORDS: "/training-records",
  INVENTORY: "/inventory",
  DEFECTS: "/defects",
  DOCUMENT_REGISTER: "/document-register",
  MILEAGE_CLAIMS: "/mileage-claims",
  WORK_NOTES: "/work-notes",
  CALLBACKS: "/callbacks",
  SITE_ACCESS_NOTES: "/site-access-notes",
  STAFF_DIRECTORY: "/staff-directory",
  PRICE_LISTS: "/price-lists",
  CUSTOMER_FEEDBACK: "/customer-feedback",
  SLAS: "/slas",
  PARTS_CATALOG: "/parts-catalog",
  SETTINGS: "/settings",
  VISIT_TYPES: "/visit-types",
  QUALITY_CHECKLISTS: "/quality-checklists",
  DOWNLOADS: "/downloads",
} as const;

export function isCompanionPath(pathname: string): boolean {
  const companionRoutes = [ROUTES.FIELD_COMPANION, ROUTES.FIELD_TESTING];
  
  return companionRoutes.some(route => 
    pathname === route || pathname.startsWith(route + "/")
  );
}

export function isOfficePath(pathname: string): boolean {
  return !isCompanionPath(pathname) && pathname !== "/";
}
