import { Switch, Route, useLocation, Redirect } from "wouter";
import { useMe } from "@/hooks/useMe";
import { setFlash } from "@/lib/flash";
import { FlashToaster } from "@/components/FlashToaster";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ViewModeProvider, useViewMode, useRouteSync } from "@/hooks/useViewMode";
import { ROUTES, isCompanionPath } from "@/lib/routes";
import { AppLayout } from "@/components/AppLayout";
import FieldCompanion from "@/pages/field-companion";
import FieldJobDetail from "@/pages/field-job-detail";
import FieldJobForms from "@/pages/field-job-forms";
import FieldTesting from "@/pages/field-testing";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";
import Clients from "@/pages/clients";
import Sites from "@/pages/sites";
import SiteDetail from "@/pages/site-detail";
import Contracts from "@/pages/contracts";
import Jobs from "@/pages/jobs";
import Finance from "@/pages/finance";
import Expenses from "@/pages/expenses";
import Timesheets from "@/pages/timesheets";
import Vehicles from "@/pages/vehicles";
import Subcontractors from "@/pages/subcontractors";
import Holidays from "@/pages/holidays";
import ClientDetail from "@/pages/client-detail";
import JobDetail from "@/pages/job-detail";
import Profitability from "@/pages/profitability";
import Reports from "@/pages/reports";
import Schedule from "@/pages/schedule";
import Equipment from "@/pages/equipment";
import Certifications from "@/pages/certifications";
import Leads from "@/pages/leads";
import SiteAccess from "@/pages/site-access";
import Incidents from "@/pages/incidents";
import Tenders from "@/pages/tenders";
import RiskAssessments from "@/pages/risk-assessments";
import JobTemplates from "@/pages/job-templates";
import RecurringJobs from "@/pages/recurring-jobs";
import NotificationsPage from "@/pages/notifications";
import Suppliers from "@/pages/suppliers";
import PurchaseOrders from "@/pages/purchase-orders";
import TrainingRecords from "@/pages/training-records";
import Inventory from "@/pages/inventory";
import Defects from "@/pages/defects";
import DocumentRegister from "@/pages/document-register";
import MileageClaims from "@/pages/mileage-claims";
import WorkNotes from "@/pages/work-notes";
import Callbacks from "@/pages/callbacks";
import SiteAccessNotesPage from "@/pages/site-access-notes";
import StaffDirectory from "@/pages/staff-directory";
import PriceLists from "@/pages/price-lists";
import CustomerFeedback from "@/pages/customer-feedback";
import SLAs from "@/pages/slas";
import PartsCatalog from "@/pages/parts-catalog";
import DocumentTemplates from "@/pages/document-templates";
import Warranties from "@/pages/warranties";
import Competitors from "@/pages/competitors";
import ServiceHistoryPage from "@/pages/service-history";
import QualityChecklists from "@/pages/quality-checklists";
import TimeOffRequests from "@/pages/time-off-requests";
import VisitTypes from "@/pages/visit-types";
import SiteAssets from "@/pages/site-assets";
import CheckSheetReadings from "@/pages/check-sheet-readings";
import GoldenThread from "@/pages/golden-thread";
import ServiceAnalytics from "@/pages/service-analytics";
import EngineerPerformance from "@/pages/engineer-performance";
import SiteHealth from "@/pages/site-health";
import Downloads from "@/pages/downloads";
import ClientPortal from "@/pages/client-portal";
import Settings from "@/pages/settings";
import AdminEntitiesPage from "@/pages/admin/entities";
import AdminEntityEditPage from "@/pages/admin/entity-edit";
import AdminTemplatesPage from "@/pages/admin/templates";
import AdminTemplateEditPage from "@/pages/admin/template-edit";
import JobActivityPage from "@/pages/job-activity";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <p className="text-muted-foreground">This page is under development.</p>
    </div>
  );
}

function LayoutRoutes() {
  const { isOrgAdmin, loading: meLoading } = useMe();

  return (
    <AppLayout isOrgAdmin={isOrgAdmin}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path={ROUTES.DASHBOARD} component={Dashboard} />
        <Route path="/test" component={FieldTesting} />
        <Route path="/clients" component={Clients} />
        <Route path="/clients/:id" component={ClientDetail} />
        <Route path="/sites" component={Sites} />
        <Route path="/sites/:id" component={SiteDetail} />
        <Route path="/contracts" component={Contracts} />
        <Route path="/jobs" component={Jobs} />
        <Route path={ROUTES.JOB_ACTIVITY} component={JobActivityPage} />
        <Route path="/jobs/:id" component={JobDetail} />
        <Route path="/finance" component={Finance} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/timesheets" component={Timesheets} />
        <Route path="/vehicles" component={Vehicles} />
        <Route path="/subcontractors" component={Subcontractors} />
        <Route path="/holidays" component={Holidays} />
        <Route path="/profitability" component={Profitability} />
        <Route path="/reports" component={Reports} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/equipment" component={Equipment} />
        <Route path="/certifications" component={Certifications} />
        <Route path="/leads" component={Leads} />
        <Route path="/tenders" component={Tenders} />
        <Route path="/site-access" component={SiteAccess} />
        <Route path="/incidents" component={Incidents} />
        <Route path="/risk-assessments" component={RiskAssessments} />
        <Route path="/job-templates" component={JobTemplates} />
        <Route path="/recurring-jobs" component={RecurringJobs} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/suppliers" component={Suppliers} />
        <Route path="/purchase-orders" component={PurchaseOrders} />
        <Route path="/training-records" component={TrainingRecords} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/defects" component={Defects} />
        <Route path="/document-register" component={DocumentRegister} />
        <Route path="/mileage-claims" component={MileageClaims} />
        <Route path="/work-notes" component={WorkNotes} />
        <Route path="/callbacks" component={Callbacks} />
        <Route path="/site-access-notes" component={SiteAccessNotesPage} />
        <Route path="/staff-directory" component={StaffDirectory} />
        <Route path="/price-lists" component={PriceLists} />
        <Route path="/customer-feedback" component={CustomerFeedback} />
        <Route path="/slas" component={SLAs} />
        <Route path="/parts-catalog" component={PartsCatalog} />
        <Route path="/document-templates" component={DocumentTemplates} />
        <Route path="/warranties" component={Warranties} />
        <Route path="/competitors" component={Competitors} />
        <Route path="/service-history" component={ServiceHistoryPage} />
        <Route path="/quality-checklists" component={QualityChecklists} />
        <Route path="/check-sheet-readings" component={CheckSheetReadings} />
        <Route path="/time-off-requests" component={TimeOffRequests} />
        <Route path="/visit-types" component={VisitTypes} />
        <Route path="/site-assets" component={SiteAssets} />
        <Route path="/golden-thread" component={GoldenThread} />
        <Route path="/service-analytics" component={ServiceAnalytics} />
        <Route path="/engineer-performance" component={EngineerPerformance} />
        <Route path="/site-health" component={SiteHealth} />
        <Route path="/downloads" component={Downloads} />
        <Route path="/settings" component={Settings} />

        {/* Admin routes - guarded by role */}
        {meLoading ? (
          <Route path="/admin/:rest*" component={() => <div className="p-6 text-muted-foreground">Loading…</div>} />
        ) : isOrgAdmin ? (
          <>
            <Route path={ROUTES.ADMIN_ENTITY_EDIT} component={AdminEntityEditPage} />
            <Route path={ROUTES.ADMIN_ENTITIES} component={AdminEntitiesPage} />
            <Route path={ROUTES.ADMIN_TEMPLATE_EDIT} component={AdminTemplateEditPage} />
            <Route path={ROUTES.ADMIN_TEMPLATES} component={AdminTemplatesPage} />
          </>
        ) : (
          <>
            <Route
              path="/admin/:rest*"
              component={() => {
                setFlash({
                  title: "Forbidden",
                  description: "Admin access only.",
                  variant: "destructive",
                });
                return <Redirect to={ROUTES.DASHBOARD} />;
              }}
            />
          </>
        )}

        <Route path="/reminders">{() => <PlaceholderPage title="Reminders" />}</Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function EngineerShell() {
  const { enterOfficeMode } = useViewMode();
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-3 py-2 border-b bg-card">
        <span className="text-sm font-medium">Field Companion</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => enterOfficeMode(ROUTES.DASHBOARD)}
          data-testid="button-switch-to-office"
        >
          Switch to Office
        </Button>
      </header>
      <div className="flex-1 overflow-hidden">
        <Switch>
          <Route path={ROUTES.FIELD_COMPANION_JOB_FORMS} component={FieldJobForms} />
          <Route path={ROUTES.FIELD_COMPANION_JOB} component={FieldJobDetail} />
          <Route path={ROUTES.FIELD_COMPANION_HOME} component={FieldCompanion} />
          <Route path={ROUTES.FIELD_TESTING} component={FieldTesting} />
          <Route component={FieldCompanion} />
        </Switch>
      </div>
    </div>
  );
}

function AuthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/landing" component={Landing} />
      <Route component={ViewModeRouter} />
    </Switch>
  );
}

function ViewModeRouter() {
  const { isEngineerMode } = useViewMode();
  const [location] = useLocation();
  
  useRouteSync();
  
  const isEngineerRoute = isCompanionPath(location);
  
  if (isEngineerMode && isEngineerRoute) {
    return <EngineerShell />;
  }
  
  return <LayoutRoutes />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // Client Portal is a public route - check before auth
  if (location.startsWith("/client-portal/")) {
    return (
      <Switch>
        <Route path="/client-portal/:token" component={ClientPortal} />
      </Switch>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  return <AuthenticatedRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ViewModeProvider>
        <TooltipProvider>
          <FlashToaster />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ViewModeProvider>
    </QueryClientProvider>
  );
}

export default App;
