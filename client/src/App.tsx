import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import AirflowTester from "@/pages/airflow-tester";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";
import Clients from "@/pages/clients";
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

function AuthenticatedRoutes() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/test" component={AirflowTester} />
        <Route path="/clients" component={Clients} />
        <Route path="/clients/:id" component={ClientDetail} />
        <Route path="/contracts" component={Contracts} />
        <Route path="/jobs" component={Jobs} />
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
        <Route path="/documents">{() => <PlaceholderPage title="Documents" />}</Route>
        <Route path="/reminders">{() => <PlaceholderPage title="Reminders" />}</Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

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
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
