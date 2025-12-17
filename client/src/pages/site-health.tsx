import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import {
  Building2,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Calendar,
  Search,
  Shield,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, parseISO, differenceInDays, addDays, addMonths, isBefore, isAfter, subMonths } from "date-fns";
import type { DbSite, DbJob, DbDefect } from "@shared/schema";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6b7280"];

interface SiteHealth {
  id: string;
  name: string;
  address: string;
  clientName: string;
  lastTestDate: Date | null;
  nextDueDate: Date | null;
  daysUntilDue: number | null;
  testCount: number;
  passRate: number;
  openDefects: number;
  criticalDefects: number;
  status: "compliant" | "due_soon" | "overdue" | "no_tests";
}

export default function SiteHealth() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: sites = [] } = useQuery<DbSite[]>({
    queryKey: ["/api/sites", user?.id],
    enabled: !!user?.id,
  });

  const { data: jobs = [] } = useQuery<DbJob[]>({
    queryKey: ["/api/jobs", user?.id],
    enabled: !!user?.id,
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients", user?.id],
    enabled: !!user?.id,
  });

  const { data: defects = [] } = useQuery<DbDefect[]>({
    queryKey: [`/api/defects/${user?.id}`],
    enabled: !!user?.id,
  });

  const siteHealthData: SiteHealth[] = useMemo(() => {
    return sites.map(site => {
      const client = clients.find(c => c.id === site.clientId);
      const siteJobs = jobs.filter(j => j.siteId === site.id);
      const siteDefects = defects.filter(d => {
        const job = jobs.find(j => j.id === d.jobId);
        return job?.siteId === site.id;
      });

      const completedJobs = siteJobs.filter(j => 
        ["completed", "complete", "closed"].includes(j.status?.toLowerCase() || "")
      );
      const lastCompletedJob = completedJobs.sort((a, b) => {
        const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 
                      a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
        const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 
                      b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
        return dateB - dateA;
      })[0];

      const getLastTestDate = () => {
        if (!lastCompletedJob) return null;
        const dateStr = lastCompletedJob.completedAt || lastCompletedJob.scheduledDate;
        if (!dateStr) return null;
        return typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
      };
      const lastTestDate = getLastTestDate();

      const testFrequencyMonths = 12; // Default annual testing
      const nextDueDate = lastTestDate ? addMonths(lastTestDate, testFrequencyMonths) : null;
      const today = new Date();
      const daysUntilDue = nextDueDate ? differenceInDays(nextDueDate, today) : null;

      let status: SiteHealth["status"] = "no_tests";
      if (lastTestDate) {
        if (daysUntilDue !== null) {
          if (daysUntilDue < 0) {
            status = "overdue";
          } else if (daysUntilDue <= 30) {
            status = "due_soon";
          } else {
            status = "compliant";
          }
        }
      }

      const passRate = 100; // Will be calculated from actual test results when available
      const openDefects = siteDefects.filter(d => d.status === "open").length;
      const criticalDefects = siteDefects.filter(d => d.status === "open" && d.severity === "critical").length;

      return {
        id: site.id,
        name: site.name,
        address: site.address || "",
        clientName: client?.companyName || "Unknown",
        lastTestDate,
        nextDueDate,
        daysUntilDue,
        testCount: completedJobs.length,
        passRate,
        openDefects,
        criticalDefects,
        status,
      };
    });
  }, [sites, jobs, clients, defects]);

  const filteredSites = useMemo(() => {
    return siteHealthData.filter(site => {
      const matchesSearch = !searchQuery || 
        site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || site.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [siteHealthData, searchQuery, statusFilter]);

  const statusSummary = useMemo(() => {
    return {
      compliant: siteHealthData.filter(s => s.status === "compliant").length,
      dueSoon: siteHealthData.filter(s => s.status === "due_soon").length,
      overdue: siteHealthData.filter(s => s.status === "overdue").length,
      noTests: siteHealthData.filter(s => s.status === "no_tests").length,
      totalDefects: siteHealthData.reduce((sum, s) => sum + s.openDefects, 0),
      criticalDefects: siteHealthData.reduce((sum, s) => sum + s.criticalDefects, 0),
    };
  }, [siteHealthData]);

  const statusChartData = [
    { name: "Compliant", value: statusSummary.compliant, color: "#10b981" },
    { name: "Due Soon", value: statusSummary.dueSoon, color: "#f59e0b" },
    { name: "Overdue", value: statusSummary.overdue, color: "#ef4444" },
    { name: "No Tests", value: statusSummary.noTests, color: "#6b7280" },
  ].filter(d => d.value > 0);

  const upcomingTests = useMemo(() => {
    return siteHealthData
      .filter(s => s.nextDueDate && s.daysUntilDue !== null && s.daysUntilDue <= 60)
      .sort((a, b) => (a.daysUntilDue || 999) - (b.daysUntilDue || 999))
      .slice(0, 10);
  }, [siteHealthData]);

  const getStatusBadge = (status: SiteHealth["status"]) => {
    switch (status) {
      case "compliant":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Compliant</Badge>;
      case "due_soon":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" />Due Soon</Badge>;
      case "overdue":
        return <Badge variant="destructive"><AlertOctagon className="h-3 w-3 mr-1" />Overdue</Badge>;
      case "no_tests":
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />No Tests</Badge>;
    }
  };

  const complianceRate = siteHealthData.length > 0 
    ? Math.round((statusSummary.compliant / siteHealthData.length) * 100) 
    : 0;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Shield className="h-6 w-6" />
            Site Health Overview
          </h1>
          <p className="text-muted-foreground">
            Monitor testing compliance and upcoming due dates
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Compliant Sites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-compliant-count">
              {statusSummary.compliant}
            </div>
            <p className="text-xs text-muted-foreground">
              {complianceRate}% compliance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Due Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-duesoon-count">
              {statusSummary.dueSoon}
            </div>
            <p className="text-xs text-muted-foreground">
              Within 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-red-500" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-overdue-count">
              {statusSummary.overdue}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Open Defects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-defects-count">
              {statusSummary.totalDefects}
            </div>
            <p className="text-xs text-muted-foreground">
              {statusSummary.criticalDefects} critical
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sites" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sites" data-testid="tab-sites">All Sites</TabsTrigger>
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">Upcoming Tests</TabsTrigger>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="sites" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sites..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="compliant">Compliant</SelectItem>
                    <SelectItem value="due_soon">Due Soon</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="no_tests">No Tests</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredSites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No sites found matching your criteria.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSites.map((site) => (
                    <Link href={`/sites/${site.id}`} key={site.id}>
                      <div
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover-elevate cursor-pointer"
                        data-testid={`site-row-${site.id}`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <Building2 className="h-8 w-8 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{site.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {site.clientName} - {site.address}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap justify-end">
                          {site.lastTestDate && (
                            <div className="text-right hidden md:block">
                              <p className="text-xs text-muted-foreground">Last Test</p>
                              <p className="text-sm">{format(site.lastTestDate, "dd MMM yyyy")}</p>
                            </div>
                          )}
                          {site.nextDueDate && (
                            <div className="text-right hidden md:block">
                              <p className="text-xs text-muted-foreground">Next Due</p>
                              <p className="text-sm">{format(site.nextDueDate, "dd MMM yyyy")}</p>
                            </div>
                          )}
                          {site.openDefects > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {site.openDefects} defects
                            </Badge>
                          )}
                          {getStatusBadge(site.status)}
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Tests (Next 60 Days)</CardTitle>
              <CardDescription>Sites that require testing soon</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingTests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tests due in the next 60 days.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingTests.map((site, index) => (
                    <Link href={`/sites/${site.id}`} key={site.id}>
                      <div
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover-elevate cursor-pointer"
                        data-testid={`upcoming-site-${site.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                            site.status === "overdue" ? "bg-red-500/10 text-red-600" :
                            site.daysUntilDue !== null && site.daysUntilDue <= 7 ? "bg-yellow-500/10 text-yellow-600" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{site.name}</p>
                            <p className="text-sm text-muted-foreground">{site.clientName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Due Date</p>
                            <p className="text-sm font-medium">
                              {site.nextDueDate ? format(site.nextDueDate, "dd MMM yyyy") : "N/A"}
                            </p>
                          </div>
                          <Badge 
                            variant={site.status === "overdue" ? "destructive" : 
                                     site.daysUntilDue !== null && site.daysUntilDue <= 7 ? "default" : "secondary"}
                          >
                            {site.daysUntilDue !== null && site.daysUntilDue < 0 
                              ? `${Math.abs(site.daysUntilDue)} days overdue`
                              : `${site.daysUntilDue} days`
                            }
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                {statusChartData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No site data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Compliance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Overall Compliance</span>
                    <span className="text-sm font-medium">{complianceRate}%</span>
                  </div>
                  <Progress value={complianceRate} className="h-3" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Compliant</span>
                    </div>
                    <span className="font-bold text-green-600">{statusSummary.compliant}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <span>Due Soon (30 days)</span>
                    </div>
                    <span className="font-bold text-yellow-600">{statusSummary.dueSoon}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="h-5 w-5 text-red-600" />
                      <span>Overdue</span>
                    </div>
                    <span className="font-bold text-red-600">{statusSummary.overdue}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                      <span>No Test History</span>
                    </div>
                    <span className="font-bold">{statusSummary.noTests}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
