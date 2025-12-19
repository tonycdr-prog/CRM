export const ROUTES = {
  DASHBOARD: "/dashboard",
  FIELD_COMPANION_HOME: "/field-companion",
  
  // Phase 1 journey hubs (prefixed to avoid collision with existing routes)
  HUB_WORK: "/hub/work",
  HUB_FORMS: "/hub/forms",
  HUB_CUSTOMERS: "/hub/customers",
  HUB_REPORTS: "/hub/reports",
  HUB_MANAGE: "/hub/manage",
  FIELD_COMPANION_JOB: "/field-companion/:id",
  FIELD_COMPANION_JOB_FORMS: "/field-companion/:id/forms",
  FIELD_TESTING: "/test",
  SCHEDULE: "/schedule",
  CLIENTS: "/clients",
  CLIENT_DETAIL: "/clients/:id",
  SITES: "/sites",
  SITE_DETAIL: "/sites/:id",
  CONTRACTS: "/contracts",
  JOBS: "/jobs",
  JOB_DETAIL: "/jobs/:id",
  JOB_ACTIVITY: "/jobs/:jobId/activity",
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
  ADMIN_ENTITIES: "/admin/entities",
  ADMIN_ENTITY_EDIT: "/admin/entities/:id",
  ADMIN_TEMPLATES: "/admin/templates",
  ADMIN_TEMPLATE_EDIT: "/admin/templates/:id",
  ADMIN_USAGE: "/admin/usage",
} as const;

/** Build a wouter-compatible path from a pattern like "/field-companion/:id/forms". */
export function buildPath(
  pattern: string,
  params: Record<string, string | number>
) {
  return pattern.replace(/:([A-Za-z0-9_]+)/g, (_, key) =>
    encodeURIComponent(String(params[key]))
  );
}

export function isCompanionPath(pathname: string) {
  return (
    pathname === ROUTES.FIELD_COMPANION_HOME ||
    pathname.startsWith("/field-companion")
  );
}

export function isOfficePath(pathname: string): boolean {
  return !isCompanionPath(pathname) && pathname !== "/";
}
