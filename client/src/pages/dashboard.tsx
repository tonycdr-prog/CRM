import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp,
  Clock,
  FileText,
  Plus,
  ArrowRight,
  Briefcase,
  Receipt,
  DollarSign,
  Users,
  AlertCircle,
  FileSignature,
  Package,
  Wrench
} from "lucide-react";
import { Link } from "wouter";
import { loadStorageData, type StorageData } from "@/lib/storage";
import { useState, useEffect, useMemo } from "react";
import { format, parseISO, differenceInDays, addYears, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { SyncIndicator } from "@/components/SyncIndicator";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useAuth } from "@/hooks/useAuth";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Client {
  id: string;
  companyName: string;
  status: string;
}

interface Contract {
  id: string;
  clientId: string | null;
  title: string;
  value: string;
  endDate: string | null;
  renewalDate: string | null;
  status: string;
}

interface Job {
  id: string;
  clientId: string | null;
  title: string;
  status: string;
  scheduledDate: string | null;
  quotedAmount: number | null;
  actualCost: number | null;
}

interface Invoice {
  id: string;
  clientId: string | null;
  invoiceNumber: string;
  title: string;
  total: number | null;
  dueDate: string | null;
  status: string;
  createdAt: string;
}

interface Expense {
  id: string;
  amount: number;
  date: string;
  category: string;
}

interface DashboardStats {
  totalProjects: number;
  totalTests: number;
  passRate: number;
  upcomingTests: number;
  flaggedDampers: number;
  recentActivity: { date: string; type: string; description: string }[];
}

interface ProjectSummary {
  id: string;
  name: string;
  buildings: string[];
  testCount: number;
  passRate: number;
  lastTestDate: string | null;
  nextDueDate: string | null;
  hasIssues: boolean;
}

interface FlaggedDamper {
  damperKey: string;
  building: string;
  location: string;
  floorNumber: string;
  trend: "declining" | "stable" | "improving";
  averageVelocity: number;
  lastVelocity: number;
  velocityChange: number;
  recommendation: string;
}

export default function Dashboard() {
  const [storageData, setStorageData] = useState<StorageData | null>(null);
  const { user } = useAuth();
  const syncState = useOfflineSync(user?.id);

  // Fetch business data
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: !!user?.id,
  });

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
    enabled: !!user?.id,
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: !!user?.id,
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    enabled: !!user?.id,
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    enabled: !!user?.id,
  });

  useEffect(() => {
    setStorageData(loadStorageData());
  }, []);

  // Business metrics calculations
  const businessMetrics = useMemo(() => {
    const now = new Date();
    const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
    const lastMonth = { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };

    // Revenue calculations
    const paidInvoices = invoices.filter(i => i.status === "paid");
    const thisMonthRevenue = paidInvoices
      .filter(i => i.createdAt && isWithinInterval(parseISO(i.createdAt), thisMonth))
      .reduce((sum, i) => sum + (i.total || 0), 0);
    const lastMonthRevenue = paidInvoices
      .filter(i => i.createdAt && isWithinInterval(parseISO(i.createdAt), lastMonth))
      .reduce((sum, i) => sum + (i.total || 0), 0);
    const revenueChange = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    // Outstanding invoices
    const outstandingInvoices = invoices.filter(i => i.status === "sent" || i.status === "overdue");
    const outstandingAmount = outstandingInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const overdueInvoices = invoices.filter(i => {
      if (i.status !== "sent" || !i.dueDate) return false;
      return parseISO(i.dueDate) < now;
    });

    // Job stats
    const activeJobs = jobs.filter(j => j.status === "in_progress" || j.status === "scheduled");
    const pendingJobs = jobs.filter(j => j.status === "pending");
    const completedThisMonth = jobs.filter(j => 
      j.status === "completed" && j.scheduledDate && 
      isWithinInterval(parseISO(j.scheduledDate), thisMonth)
    );

    // Contract renewals
    const upcomingRenewals = contracts.filter(c => {
      if (c.status !== "active") return false;
      const renewDate = c.renewalDate || c.endDate;
      if (!renewDate) return false;
      const daysUntil = differenceInDays(parseISO(renewDate), now);
      return daysUntil >= 0 && daysUntil <= 30;
    });

    // Active clients
    const activeClients = clients.filter(c => c.status === "active").length;

    // Monthly revenue chart data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthInterval = { start: startOfMonth(monthDate), end: endOfMonth(monthDate) };
      const revenue = paidInvoices
        .filter(inv => inv.createdAt && isWithinInterval(parseISO(inv.createdAt), monthInterval))
        .reduce((sum, inv) => sum + (inv.total || 0), 0);
      const expenseTotal = expenses
        .filter(exp => isWithinInterval(parseISO(exp.date), monthInterval))
        .reduce((sum, exp) => sum + exp.amount, 0);
      monthlyData.push({
        month: format(monthDate, "MMM"),
        revenue,
        expenses: expenseTotal,
        profit: revenue - expenseTotal,
      });
    }

    return {
      thisMonthRevenue,
      lastMonthRevenue,
      revenueChange,
      outstandingAmount,
      overdueCount: overdueInvoices.length,
      activeJobs: activeJobs.length,
      pendingJobs: pendingJobs.length,
      completedThisMonth: completedThisMonth.length,
      upcomingRenewals,
      activeClients,
      overdueInvoices,
      monthlyData,
    };
  }, [clients, contracts, jobs, invoices, expenses]);

  const stats = useMemo<DashboardStats>(() => {
    if (!storageData) {
      return {
        totalProjects: 0,
        totalTests: 0,
        passRate: 0,
        upcomingTests: 0,
        flaggedDampers: 0,
        recentActivity: [],
      };
    }

    const tests = Object.values(storageData.tests);
    const projects = Object.values(storageData.projects);
    
    const passedTests = tests.filter(t => t.average >= 1.0);
    const passRate = tests.length > 0 ? (passedTests.length / tests.length) * 100 : 0;

    const now = new Date();
    let upcomingCount = 0;
    const testsByDamper = new Map<string, typeof tests>();
    
    tests.forEach(test => {
      const key = `${test.building}_${test.location}_${test.floorNumber}`;
      if (!testsByDamper.has(key)) {
        testsByDamper.set(key, []);
      }
      testsByDamper.get(key)!.push(test);
    });

    testsByDamper.forEach((damperTests) => {
      const latestTest = damperTests.sort((a, b) => b.createdAt - a.createdAt)[0];
      const testDate = parseISO(latestTest.testDate);
      const nextDue = addYears(testDate, 1);
      const daysUntilDue = differenceInDays(nextDue, now);
      if (daysUntilDue <= 30 && daysUntilDue > -30) {
        upcomingCount++;
      }
    });

    const recentActivity = tests
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map(test => ({
        date: format(new Date(test.createdAt), "MMM d, yyyy"),
        type: "test",
        description: `${test.building} - Floor ${test.floorNumber}`,
      }));

    return {
      totalProjects: projects.length,
      totalTests: tests.length,
      passRate,
      upcomingTests: upcomingCount,
      flaggedDampers: 0,
      recentActivity,
    };
  }, [storageData]);

  const projectSummaries = useMemo<ProjectSummary[]>(() => {
    if (!storageData) return [];

    const tests = Object.values(storageData.tests);
    const projects = Object.values(storageData.projects);

    return projects.map(project => {
      const projectTests = tests.filter(t => 
        project.buildings.some(b => t.building.toLowerCase().includes(b.toLowerCase()))
      );
      
      const passedTests = projectTests.filter(t => t.average >= 1.0);
      const passRate = projectTests.length > 0 ? (passedTests.length / projectTests.length) * 100 : 0;
      
      const latestTest = projectTests.sort((a, b) => b.createdAt - a.createdAt)[0];
      const lastTestDate = latestTest ? latestTest.testDate : null;
      
      let nextDueDate: string | null = null;
      if (lastTestDate) {
        const nextDue = addYears(parseISO(lastTestDate), 1);
        nextDueDate = format(nextDue, "yyyy-MM-dd");
      }

      const hasIssues = passRate < 80 || projectTests.some(t => t.failureReasonCode);

      return {
        id: project.id,
        name: project.name,
        buildings: project.buildings,
        testCount: projectTests.length,
        passRate,
        lastTestDate,
        nextDueDate,
        hasIssues,
      };
    });
  }, [storageData]);

  const flaggedDampers = useMemo<FlaggedDamper[]>(() => {
    if (!storageData) return [];

    const tests = Object.values(storageData.tests);
    const damperTests = new Map<string, typeof tests>();

    tests.forEach(test => {
      const key = `${test.building}_${test.location}_${test.floorNumber}_${test.shaftId}`;
      if (!damperTests.has(key)) {
        damperTests.set(key, []);
      }
      damperTests.get(key)!.push(test);
    });

    const flagged: FlaggedDamper[] = [];

    damperTests.forEach((damperTestList, key) => {
      if (damperTestList.length < 2) return;

      const sorted = damperTestList.sort((a, b) => a.createdAt - b.createdAt);
      const velocities = sorted.map(t => t.average);
      
      const n = velocities.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = velocities.reduce((a, b) => a + b, 0);
      const sumXY = velocities.reduce((sum, y, x) => sum + x * y, 0);
      const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      
      const lastVelocity = velocities[velocities.length - 1];
      const firstVelocity = velocities[0];
      const velocityChange = ((lastVelocity - firstVelocity) / firstVelocity) * 100;
      const avgVelocity = sumY / n;

      if (slope < -0.1 || lastVelocity < 1.0) {
        const latestTest = sorted[sorted.length - 1];
        
        let recommendation = "";
        if (lastVelocity < 0.5) {
          recommendation = "Immediate inspection required - critical low velocity";
        } else if (lastVelocity < 1.0) {
          recommendation = "Schedule inspection - velocity below minimum threshold";
        } else if (slope < -0.2) {
          recommendation = "Monitor closely - rapid velocity decline detected";
        } else {
          recommendation = "Schedule preventive maintenance - gradual decline trend";
        }

        flagged.push({
          damperKey: key,
          building: latestTest.building,
          location: latestTest.location,
          floorNumber: latestTest.floorNumber,
          trend: slope < -0.1 ? "declining" : slope > 0.1 ? "improving" : "stable",
          averageVelocity: avgVelocity,
          lastVelocity,
          velocityChange,
          recommendation,
        });
      }
    });

    return flagged.sort((a, b) => a.lastVelocity - b.lastVelocity);
  }, [storageData]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground">Business overview and key metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <SyncIndicator
            isOnline={syncState.isOnline}
            isSyncing={syncState.isSyncing}
            pendingChanges={syncState.pendingChanges}
            lastSyncTime={syncState.lastSyncTime}
            syncError={syncState.syncError}
            onSync={syncState.syncToServer}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <Card data-testid="card-quick-actions">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href="/schedule">
              <Button size="sm" data-testid="button-quick-today-schedule">
                <Calendar className="h-4 w-4 mr-1" />
                Today's Schedule
              </Button>
            </Link>
            <Link href="/jobs?createJob=true">
              <Button size="sm" data-testid="button-quick-new-job">
                <Plus className="h-4 w-4 mr-1" />
                New Job
              </Button>
            </Link>
            <Link href="/finance?createInvoice=true">
              <Button size="sm" variant="outline" data-testid="button-quick-new-invoice">
                <Receipt className="h-4 w-4 mr-1" />
                New Invoice
              </Button>
            </Link>
            <Link href="/finance?createQuote=true">
              <Button size="sm" variant="outline" data-testid="button-quick-new-quote">
                <FileSignature className="h-4 w-4 mr-1" />
                New Quote
              </Button>
            </Link>
            <Link href="/clients">
              <Button size="sm" variant="outline" data-testid="button-quick-new-client">
                <Users className="h-4 w-4 mr-1" />
                New Client
              </Button>
            </Link>
            <Link href="/check-sheets">
              <Button size="sm" variant="outline" data-testid="button-quick-new-test">
                <FileText className="h-4 w-4 mr-1" />
                New Check Sheet
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Business Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-testid="card-stat-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{businessMetrics.thisMonthRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {businessMetrics.revenueChange !== 0 && (
                <>
                  {businessMetrics.revenueChange > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={businessMetrics.revenueChange > 0 ? "text-green-600" : "text-red-600"}>
                    {businessMetrics.revenueChange > 0 ? "+" : ""}{businessMetrics.revenueChange.toFixed(1)}%
                  </span>
                  <span className="ml-1">vs last month</span>
                </>
              )}
              {businessMetrics.revenueChange === 0 && <span>Revenue</span>}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-outstanding">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{businessMetrics.outstandingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {businessMetrics.overdueCount > 0 && (
                <span className="text-red-600">{businessMetrics.overdueCount} overdue</span>
              )}
              {businessMetrics.overdueCount === 0 && "Awaiting payment"}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-active-jobs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessMetrics.activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              {businessMetrics.pendingJobs} pending · {businessMetrics.completedThisMonth} completed this month
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-clients">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessMetrics.activeClients}</div>
            <p className="text-xs text-muted-foreground">Total clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Contract Renewals Alert */}
        {businessMetrics.upcomingRenewals.length > 0 && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950" data-testid="card-renewals-alert">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-base">Contract Renewals Due</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {businessMetrics.upcomingRenewals.slice(0, 3).map((contract) => {
                  const client = clients.find(c => c.id === contract.clientId);
                  const renewDate = contract.renewalDate || contract.endDate;
                  const daysUntil = renewDate ? differenceInDays(parseISO(renewDate), new Date()) : 0;
                  return (
                    <div key={contract.id} className="flex items-center justify-between p-2 bg-background rounded border">
                      <div>
                        <div className="font-medium text-sm">{contract.title}</div>
                        <div className="text-xs text-muted-foreground">{client?.companyName}</div>
                      </div>
                      <Badge variant={daysUntil <= 7 ? "destructive" : "outline"} className="text-xs">
                        {daysUntil} days
                      </Badge>
                    </div>
                  );
                })}
              </div>
              {businessMetrics.upcomingRenewals.length > 3 && (
                <Link href="/contracts">
                  <Button variant="ghost" size="sm" className="w-full mt-2">
                    View all {businessMetrics.upcomingRenewals.length} renewals
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Overdue Invoices Alert */}
        {businessMetrics.overdueInvoices.length > 0 && (
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950" data-testid="card-overdue-alert">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-base">Overdue Invoices</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {businessMetrics.overdueInvoices.slice(0, 3).map((invoice) => {
                  const client = clients.find(c => c.id === invoice.clientId);
                  const daysOverdue = invoice.dueDate ? differenceInDays(new Date(), parseISO(invoice.dueDate)) : 0;
                  return (
                    <div key={invoice.id} className="flex items-center justify-between p-2 bg-background rounded border">
                      <div>
                        <div className="font-medium text-sm">{invoice.invoiceNumber}</div>
                        <div className="text-xs text-muted-foreground">{client?.companyName}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">£{(invoice.total || 0).toLocaleString()}</div>
                        <div className="text-xs text-red-600">{daysOverdue} days overdue</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {businessMetrics.overdueInvoices.length > 3 && (
                <Link href="/finance">
                  <Button variant="ghost" size="sm" className="w-full mt-2">
                    View all {businessMetrics.overdueInvoices.length} overdue
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Revenue Chart */}
      <Card data-testid="card-revenue-chart">
        <CardHeader>
          <CardTitle>Revenue & Profit Trend</CardTitle>
          <CardDescription>Last 6 months performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={businessMetrics.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => `£${value}`} />
                <Tooltip 
                  formatter={(value: number) => [`£${value.toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} name="Revenue" />
                <Area type="monotone" dataKey="profit" stackId="2" stroke="hsl(142.1 76.2% 36.3%)" fill="hsl(142.1 76.2% 36.3%)" fillOpacity={0.3} name="Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Testing Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-testid="card-stat-projects">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">Active projects</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-tests">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Tests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTests}</div>
            <p className="text-xs text-muted-foreground">Total completed</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-pass-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</div>
            <Progress value={stats.passRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card data-testid="card-stat-upcoming">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingTests}</div>
            <p className="text-xs text-muted-foreground">Annual tests due</p>
          </CardContent>
        </Card>
      </div>

      {/* Flagged Dampers - Predictive Maintenance */}
      {flaggedDampers.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950" data-testid="card-flagged-dampers">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle>Attention Required</CardTitle>
            </div>
            <CardDescription>Dampers with declining performance trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {flaggedDampers.slice(0, 5).map((damper, index) => (
                <div 
                  key={damper.damperKey} 
                  className="flex items-center justify-between p-3 bg-background rounded-lg border"
                  data-testid={`card-flagged-damper-${index}`}
                >
                  <div className="flex-1">
                    <div className="font-medium">{damper.building}</div>
                    <div className="text-sm text-muted-foreground">
                      {damper.location} - Floor {damper.floorNumber}
                    </div>
                    <div className="text-sm text-orange-600 mt-1">{damper.recommendation}</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {damper.trend === "declining" ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : damper.trend === "improving" ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : null}
                      <span className="font-medium">{damper.lastVelocity.toFixed(2)} m/s</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {damper.velocityChange > 0 ? "+" : ""}{damper.velocityChange.toFixed(1)}% change
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {flaggedDampers.length > 5 && (
              <Button variant="ghost" className="w-full mt-3" data-testid="button-view-all-flagged">
                View all {flaggedDampers.length} flagged dampers
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Projects Overview */}
      <Card data-testid="card-projects-overview">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Your active testing projects</CardDescription>
            </div>
            <Link href="/test">
              <Button variant="outline" size="sm" data-testid="button-manage-projects">
                Manage Projects
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {projectSummaries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No projects yet</p>
              <p className="text-sm">Create your first project to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projectSummaries.map((project) => (
                <div 
                  key={project.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  data-testid={`card-project-${project.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{project.name}</span>
                      {project.hasIssues && (
                        <Badge variant="destructive" className="text-xs">Issues</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {project.buildings.length} building{project.buildings.length !== 1 ? "s" : ""} · {project.testCount} tests
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{project.passRate.toFixed(0)}% pass</div>
                    {project.nextDueDate && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due {format(parseISO(project.nextDueDate), "MMM d, yyyy")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card data-testid="card-recent-activity">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest testing activity</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3"
                  data-testid={`activity-item-${index}`}
                >
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <span className="font-medium">{activity.description}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{activity.date}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
