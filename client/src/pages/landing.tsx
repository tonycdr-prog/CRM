import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardCheck, 
  Cloud, 
  FileText, 
  Gauge, 
  Shield, 
  Smartphone,
  TrendingUp,
  Building2,
  Users,
  Calendar,
  FileSpreadsheet,
  Truck,
  Wrench,
  Bell,
  MapPin,
  Clock,
  BarChart3,
  Briefcase,
  Receipt,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Package,
  GraduationCap
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Airflow Velocity Testing</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild data-testid="button-features">
              <a href="#features">Features</a>
            </Button>
            <Button variant="ghost" asChild data-testid="button-crm">
              <a href="#crm">Business Tools</a>
            </Button>
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-4">
              UK Regulation Compliant
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Complete Smoke Control Testing &amp; Business Management Platform
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Professional airflow velocity testing tools combined with a full-featured CRM 
              for smoke control service companies. From field testing to invoicing, all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild data-testid="button-get-started">
                <a href="/api/login">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-learn-more">
                <a href="#features">Learn More</a>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-primary">BS EN</div>
              <div className="text-sm text-muted-foreground">12101-8 Compliant</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-primary">BSRIA</div>
              <div className="text-sm text-muted-foreground">BG 49/2024</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Cloud Synced</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-primary">Mobile</div>
              <div className="text-sm text-muted-foreground">iOS &amp; Android</div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Testing &amp; Compliance Tools</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need for professional smoke control testing, from automatic grid calculations to comprehensive PDF reports.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <Shield className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">UK Regulation Compliant</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Automatic 5x5, 6x6, or 7x7 grid calculation based on damper dimensions per BS EN 12101-8 standards
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <FileText className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">Professional Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    PDF exports with cover pages, grid visualizations, trend charts, signatures, and QR code verification
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <Gauge className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">Pressure Testing</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    BS EN 12101-6 compliant stairwell differential pressure testing with multi-standard support
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <TrendingUp className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">Trend Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Year-over-year velocity trends with predictive maintenance alerts for declining performance
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex gap-4 items-start">
                <ClipboardCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Compliance Checklists</h3>
                  <p className="text-muted-foreground text-sm">
                    BS EN 12101-8 verification with categorized items, progress tracking, and inspection types
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <Building2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Project Management</h3>
                  <p className="text-muted-foreground text-sm">
                    Organize tests by building and project with floor sequencing mode for efficient testing
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <AlertTriangle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Anomaly Detection</h3>
                  <p className="text-muted-foreground text-sm">
                    Intelligent MAD algorithm detects unusual readings and statistical outliers
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <Cloud className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Offline Support</h3>
                  <p className="text-muted-foreground text-sm">
                    Full offline functionality with delta sync for field work without internet
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <Smartphone className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Mobile Apps</h3>
                  <p className="text-muted-foreground text-sm">
                    Native iOS and Android apps with camera integration for damper documentation
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <FileSpreadsheet className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Data Export</h3>
                  <p className="text-muted-foreground text-sm">
                    CSV and JSON export with backup/restore for data portability and analysis
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="crm" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Business Management</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Complete CRM for Service Companies</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Manage your entire smoke control service business from one platform. Clients, contracts, jobs, invoicing, and more.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mb-12">
              <Card className="hover-elevate">
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Client Management</CardTitle>
                  <CardDescription>
                    Full CRM with company and contact details, communication logs, status tracking, and client type categorization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Contact database with full details
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Commercial, residential, public sector
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Status tracking and notes
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader>
                  <Briefcase className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Contract Management</CardTitle>
                  <CardDescription>
                    Service agreements with SLA tracking, auto-renewal alerts, contract value tracking, and renewal warning badges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      SLA response and resolution times
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Auto-renewal management
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Color-coded renewal urgency badges
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader>
                  <Calendar className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Job Scheduling</CardTitle>
                  <CardDescription>
                    Work order management with scheduling, priority levels, multi-engineer assignment, and recurring job automation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Gantt timeline and calendar views
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Map view with job locations
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Conflict detection and travel time
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <Receipt className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-base">Quotes &amp; Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Financial document management with VAT calculations, status tracking, and overdue alerts
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <Clock className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-base">Timesheets</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Working hours tracking with job assignment, hourly rates, and weekly summaries
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <Truck className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-base">Vehicle Fleet</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Fleet management with MOT, tax, insurance expiry tracking and maintenance schedules
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <UserCheck className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-base">Subcontractors</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Approved subcontractor database with insurance and accreditation expiry alerts
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <Wrench className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-base">Equipment Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Asset register with calibration due dates and maintenance schedules
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <GraduationCap className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-base">Certifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Staff qualifications tracking (CSCS, IPAF, PASMA) with expiry monitoring
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <BarChart3 className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-base">Sales Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Kanban-style lead tracking with stages, values, and win probability
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="pb-2">
                  <Package className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-base">Purchase Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Full PO workflow with supplier linking and automatic calculations
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Additional Capabilities</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                A comprehensive suite of tools designed specifically for smoke control service companies.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="flex gap-4 items-start p-4 rounded-lg bg-background">
                <Bell className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Notifications Center</h3>
                  <p className="text-muted-foreground text-sm">
                    Internal notification system with category filtering and bulk operations
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 rounded-lg bg-background">
                <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Site Access Notes</h3>
                  <p className="text-muted-foreground text-sm">
                    Parking instructions, access codes, key safe locations per site
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 rounded-lg bg-background">
                <AlertTriangle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Incident Reporting</h3>
                  <p className="text-muted-foreground text-sm">
                    Accident and near-miss logging with RIDDOR flags and corrective actions
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 rounded-lg bg-background">
                <FileText className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Risk Assessments</h3>
                  <p className="text-muted-foreground text-sm">
                    RAMS creation with method statements and approval workflow
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 rounded-lg bg-background">
                <Calendar className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Holiday Management</h3>
                  <p className="text-muted-foreground text-sm">
                    Leave requests with approval workflow and annual allowance tracking
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 rounded-lg bg-background">
                <Briefcase className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Tender Management</h3>
                  <p className="text-muted-foreground text-sm">
                    Full tender register with submission deadlines and win rate tracking
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to streamline your smoke control business?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join smoke control service companies using our platform to manage testing, compliance, and business operations all in one place.
              </p>
              <Button size="lg" asChild data-testid="button-cta-get-started">
                <a href="/api/login">
                  Get Started Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Gauge className="h-6 w-6 text-primary" />
              <span className="font-semibold">Airflow Velocity Testing</span>
            </div>
            <p className="text-muted-foreground text-sm text-center">
              Compliant with BS EN 12101-8, BS EN 12101-6, and BSRIA BG 49/2024 standards
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
