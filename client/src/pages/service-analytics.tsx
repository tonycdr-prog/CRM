import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle,
  Timer,
  Target,
  BarChart3,
  Gauge
} from "lucide-react";
import { format, parseISO, subMonths, isAfter, startOfMonth, endOfMonth } from "date-fns";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell,
  ReferenceLine
} from "recharts";

interface Engineer {
  name: string;
  competency: string;
}

interface Job {
  id: string;
  clientId: string | null;
  jobNumber: string;
  title: string;
  status: string;
  siteAddress: string | null;
  estimatedDuration: number | null;
  actualDuration: number | null;
  quotedAmount: number | null;
  actualCost: number | null;
  materialsCost: number | null;
  labourCost: number | null;
  engineerNames: Engineer[];
  scheduledDate: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface Client {
  id: string;
  companyName: string;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function ServiceAnalytics() {
  const { user } = useAuth();

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: !!user?.id,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: !!user?.id,
  });

  // Filter jobs that have both estimated and actual duration data
  const completedJobsWithDuration = jobs.filter(
    job => job.status === "completed" && 
           job.estimatedDuration !== null && 
           job.actualDuration !== null &&
           job.estimatedDuration > 0
  );

  // Calculate duration variance for each job
  const jobDurationAnalytics = completedJobsWithDuration.map(job => {
    const estimated = job.estimatedDuration || 0;
    const actual = job.actualDuration || 0;
    const variance = actual - estimated;
    const variancePercent = estimated > 0 ? ((actual - estimated) / estimated) * 100 : 0;
    const client = clients.find(c => c.id === job.clientId);
    
    return {
      ...job,
      clientName: client?.companyName || "Unknown",
      variance,
      variancePercent,
      onTime: variancePercent <= 0, // On time means actual <= estimated
      efficient: variancePercent < 0, // Finished faster than estimated
      overrun: variancePercent > 0, // Any positive variance is an overrun
    };
  });

  // Overall metrics
  const totalJobs = jobDurationAnalytics.length;
  const onTimeJobs = jobDurationAnalytics.filter(j => j.onTime).length;
  const efficientJobs = jobDurationAnalytics.filter(j => j.efficient).length;
  const avgVariancePercent = totalJobs > 0 
    ? jobDurationAnalytics.reduce((sum, j) => sum + j.variancePercent, 0) / totalJobs 
    : 0;
  const onTimeRate = totalJobs > 0 ? (onTimeJobs / totalJobs) * 100 : 0;

  // Engineer efficiency metrics
  const engineerMetrics = (() => {
    const engineerData: Record<string, { 
      name: string; 
      jobCount: number; 
      totalVariance: number; 
      totalEstimated: number;
      totalActual: number;
      competency: string;
    }> = {};

    jobDurationAnalytics.forEach(job => {
      const engineers = (job.engineerNames || []).filter(eng => eng.name);
      const engineerCount = engineers.length || 1;
      // Distribute job hours proportionally among engineers
      const proportionalVariance = job.variance / engineerCount;
      const proportionalEstimated = (job.estimatedDuration || 0) / engineerCount;
      const proportionalActual = (job.actualDuration || 0) / engineerCount;
      
      engineers.forEach(eng => {
        if (!engineerData[eng.name]) {
          engineerData[eng.name] = {
            name: eng.name,
            jobCount: 0,
            totalVariance: 0,
            totalEstimated: 0,
            totalActual: 0,
            competency: eng.competency || "competent",
          };
        }
        engineerData[eng.name].jobCount += 1;
        engineerData[eng.name].totalVariance += proportionalVariance;
        engineerData[eng.name].totalEstimated += proportionalEstimated;
        engineerData[eng.name].totalActual += proportionalActual;
      });
    });

    return Object.values(engineerData).map(eng => ({
      ...eng,
      avgVariance: eng.jobCount > 0 ? eng.totalVariance / eng.jobCount : 0,
      avgVariancePercent: eng.totalEstimated > 0 
        ? ((eng.totalActual - eng.totalEstimated) / eng.totalEstimated) * 100 
        : 0,
      efficiencyScore: eng.totalEstimated > 0 
        ? Math.min(100, Math.max(0, 100 - Math.abs(((eng.totalActual - eng.totalEstimated) / eng.totalEstimated) * 100)))
        : 0,
    })).sort((a, b) => a.avgVariancePercent - b.avgVariancePercent);
  })();

  // Site efficiency metrics (group by siteAddress or clientId)
  const siteMetrics = (() => {
    const siteData: Record<string, {
      site: string;
      clientId: string | null;
      clientName: string;
      jobCount: number;
      totalVariance: number;
      totalEstimated: number;
      totalActual: number;
    }> = {};

    jobDurationAnalytics.forEach(job => {
      const siteKey = job.siteAddress || job.clientId || "Unknown";
      const client = clients.find(c => c.id === job.clientId);
      
      if (!siteData[siteKey]) {
        siteData[siteKey] = {
          site: job.siteAddress || client?.companyName || "Unknown",
          clientId: job.clientId,
          clientName: client?.companyName || "Unknown",
          jobCount: 0,
          totalVariance: 0,
          totalEstimated: 0,
          totalActual: 0,
        };
      }
      siteData[siteKey].jobCount += 1;
      siteData[siteKey].totalVariance += job.variance;
      siteData[siteKey].totalEstimated += job.estimatedDuration || 0;
      siteData[siteKey].totalActual += job.actualDuration || 0;
    });

    return Object.values(siteData).map(site => ({
      ...site,
      avgVariance: site.jobCount > 0 ? site.totalVariance / site.jobCount : 0,
      avgVariancePercent: site.totalEstimated > 0 
        ? ((site.totalActual - site.totalEstimated) / site.totalEstimated) * 100 
        : 0,
      problematic: site.totalEstimated > 0 && 
        ((site.totalActual - site.totalEstimated) / site.totalEstimated) * 100 > 20,
    })).sort((a, b) => b.avgVariancePercent - a.avgVariancePercent);
  })();

  // Billing accuracy analysis - use actualCost as single source of truth when available
  const billingAnalytics = jobs.filter(job => 
    job.status === "completed" && 
    (job.quotedAmount !== null || job.actualCost !== null || job.labourCost !== null)
  ).map(job => {
    const quoted = job.quotedAmount || 0;
    // Use actualCost if available, otherwise sum components (avoid double-counting)
    const totalCost = job.actualCost !== null && job.actualCost > 0 
      ? job.actualCost 
      : (job.materialsCost || 0) + (job.labourCost || 0);
    const labourCost = job.labourCost || 0;
    const billingVariance = quoted - totalCost;
    const billingVariancePercent = quoted > 0 ? ((quoted - totalCost) / quoted) * 100 : 0;
    const client = clients.find(c => c.id === job.clientId);
    
    return {
      ...job,
      clientName: client?.companyName || "Unknown",
      quoted,
      actualCost: totalCost,
      labourCost,
      billingVariance,
      billingVariancePercent,
      profitable: billingVariance > 0,
    };
  });

  const totalQuoted = billingAnalytics.reduce((sum, j) => sum + j.quoted, 0);
  const totalActualCost = billingAnalytics.reduce((sum, j) => sum + j.actualCost, 0);
  const overallBillingMargin = totalQuoted > 0 ? ((totalQuoted - totalActualCost) / totalQuoted) * 100 : 0;

  // Monthly trend data
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    return {
      month: format(date, "MMM yyyy"),
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  });

  const monthlyTrend = last6Months.map(({ month, start, end }) => {
    const monthJobs = jobDurationAnalytics.filter(j => {
      if (!j.completedAt) return false;
      const completed = parseISO(j.completedAt);
      // Use >= and <= to include boundary dates
      return completed >= start && completed <= end;
    });

    const avgVariance = monthJobs.length > 0
      ? monthJobs.reduce((sum, j) => sum + j.variancePercent, 0) / monthJobs.length
      : 0;
    const onTimeCount = monthJobs.filter(j => j.onTime).length;
    const onTimeRate = monthJobs.length > 0 ? (onTimeCount / monthJobs.length) * 100 : 0;

    return {
      month,
      avgVariance: Math.round(avgVariance * 10) / 10,
      onTimeRate: Math.round(onTimeRate),
      jobCount: monthJobs.length,
    };
  });

  // Jobs taking significantly longer than estimated
  const problemJobs = jobDurationAnalytics
    .filter(j => j.variancePercent > 25)
    .sort((a, b) => b.variancePercent - a.variancePercent)
    .slice(0, 10);

  // Most efficient jobs
  const efficientJobsList = jobDurationAnalytics
    .filter(j => j.variancePercent < -10)
    .sort((a, b) => a.variancePercent - b.variancePercent)
    .slice(0, 10);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Service Duration Analytics</h1>
        <p className="text-muted-foreground">Track predicted vs actual time, engineer efficiency, and billing accuracy</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Jobs Analyzed</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-jobs-analyzed">
              {totalJobs}
            </div>
            <p className="text-xs text-muted-foreground">With duration data</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${onTimeRate >= 80 ? "text-green-600" : onTimeRate >= 60 ? "text-yellow-600" : "text-red-600"}`} data-testid="text-on-time-rate">
              {onTimeRate.toFixed(0)}%
            </div>
            <Progress value={onTimeRate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Avg Duration Variance</CardTitle>
            {avgVariancePercent <= 0 ? (
              <TrendingDown className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-orange-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${avgVariancePercent <= 0 ? "text-green-600" : avgVariancePercent <= 15 ? "text-yellow-600" : "text-red-600"}`} data-testid="text-avg-variance">
              {avgVariancePercent > 0 ? "+" : ""}{avgVariancePercent.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {avgVariancePercent <= 0 ? "Ahead of estimates" : "Over estimates"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Billing Margin</CardTitle>
            <Gauge className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overallBillingMargin >= 20 ? "text-green-600" : overallBillingMargin >= 0 ? "text-yellow-600" : "text-red-600"}`} data-testid="text-billing-margin">
              {overallBillingMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Quoted vs actual cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Duration Variance Trend</CardTitle>
          <CardDescription>Average variance and on-time rate over time</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyTrend.every(m => m.jobCount === 0) ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No completed jobs with duration data yet</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <ReferenceLine yAxisId="left" y={0} stroke="#666" strokeDasharray="3 3" />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="avgVariance" 
                  name="Avg Variance %" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: "#f59e0b" }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="onTimeRate" 
                  name="On-Time Rate %" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: "#10b981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="engineers">
        <TabsList>
          <TabsTrigger value="engineers" data-testid="tab-engineers">Engineer Efficiency</TabsTrigger>
          <TabsTrigger value="sites" data-testid="tab-sites">Site Patterns</TabsTrigger>
          <TabsTrigger value="billing" data-testid="tab-billing">Billing Accuracy</TabsTrigger>
          <TabsTrigger value="jobs" data-testid="tab-jobs">Job Details</TabsTrigger>
        </TabsList>

        <TabsContent value="engineers" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Engineer Efficiency Rankings
                </CardTitle>
                <CardDescription>Average duration variance by engineer</CardDescription>
              </CardHeader>
              <CardContent>
                {engineerMetrics.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No engineer performance data yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {engineerMetrics.slice(0, 10).map((eng, index) => (
                      <div key={eng.name} className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          index < 3 ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-muted text-muted-foreground"
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium" data-testid={`text-engineer-name-${index}`}>{eng.name}</span>
                            <Badge variant="outline" className="text-xs">{eng.competency}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{eng.jobCount} jobs</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${eng.avgVariancePercent <= 0 ? "text-green-600" : eng.avgVariancePercent <= 15 ? "text-yellow-600" : "text-red-600"}`}>
                            {eng.avgVariancePercent > 0 ? "+" : ""}{eng.avgVariancePercent.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {eng.avgVariance > 0 ? "+" : ""}{eng.avgVariance.toFixed(1)}h avg
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Efficiency Score Distribution</CardTitle>
                <CardDescription>How close engineers are to estimates (higher is better)</CardDescription>
              </CardHeader>
              <CardContent>
                {engineerMetrics.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={engineerMetrics.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip formatter={(value: number) => `${value.toFixed(0)}%`} />
                      <Bar dataKey="efficiencyScore" name="Efficiency Score" fill="#3b82f6">
                        {engineerMetrics.slice(0, 8).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.efficiencyScore >= 85 ? "#10b981" : entry.efficiencyScore >= 70 ? "#f59e0b" : "#ef4444"} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sites" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Problem Sites
                </CardTitle>
                <CardDescription>Sites consistently taking longer than predicted</CardDescription>
              </CardHeader>
              <CardContent>
                {siteMetrics.filter(s => s.problematic).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-50 text-green-500" />
                    <p>No problematic sites identified</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {siteMetrics.filter(s => s.problematic).slice(0, 8).map((site) => (
                      <div key={site.site} className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate" data-testid={`text-problem-site-${site.site}`}>{site.site}</div>
                            <div className="text-sm text-muted-foreground">{site.clientName}</div>
                            <div className="text-sm text-muted-foreground">{site.jobCount} jobs</div>
                          </div>
                          <div className="text-right">
                            <Badge variant="destructive">
                              +{site.avgVariancePercent.toFixed(0)}%
                            </Badge>
                            <div className="text-sm text-muted-foreground mt-1">
                              +{site.avgVariance.toFixed(1)}h avg
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-green-500" />
                  Efficient Sites
                </CardTitle>
                <CardDescription>Sites completing faster than predicted</CardDescription>
              </CardHeader>
              <CardContent>
                {siteMetrics.filter(s => s.avgVariancePercent < 0).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No sites completing ahead of schedule yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {siteMetrics.filter(s => s.avgVariancePercent < 0).sort((a, b) => a.avgVariancePercent - b.avgVariancePercent).slice(0, 8).map((site) => (
                      <div key={site.site} className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{site.site}</div>
                            <div className="text-sm text-muted-foreground">{site.clientName}</div>
                            <div className="text-sm text-muted-foreground">{site.jobCount} jobs</div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-600">
                              {site.avgVariancePercent.toFixed(0)}%
                            </Badge>
                            <div className="text-sm text-muted-foreground mt-1">
                              {site.avgVariance.toFixed(1)}h avg
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Accuracy Analysis</CardTitle>
              <CardDescription>Compare quoted amounts vs actual costs incurred</CardDescription>
            </CardHeader>
            <CardContent>
              {billingAnalytics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Timer className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No jobs with billing data yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Quoted</TableHead>
                      <TableHead className="text-right">Actual Cost</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingAnalytics.slice(0, 15).map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <Link href={`/jobs/${job.id}`}>
                            <span className="font-medium hover:underline cursor-pointer">{job.title}</span>
                          </Link>
                          <div className="text-xs text-muted-foreground">{job.jobNumber}</div>
                        </TableCell>
                        <TableCell>{job.clientName}</TableCell>
                        <TableCell className="text-right">£{job.quoted.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-orange-600">£{job.actualCost.toLocaleString()}</TableCell>
                        <TableCell className={`text-right font-medium ${job.billingVariance >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {job.billingVariance >= 0 ? "+" : ""}£{job.billingVariance.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={job.billingVariancePercent >= 20 ? "default" : job.billingVariancePercent >= 0 ? "secondary" : "destructive"}>
                            {job.billingVariancePercent.toFixed(0)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Jobs Over Estimate
                </CardTitle>
                <CardDescription>Jobs that took significantly longer than predicted</CardDescription>
              </CardHeader>
              <CardContent>
                {problemJobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-50 text-green-500" />
                    <p>No jobs significantly over estimate</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {problemJobs.map((job) => (
                      <div key={job.id} className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <Link href={`/jobs/${job.id}`}>
                              <span className="font-medium hover:underline cursor-pointer">{job.title}</span>
                            </Link>
                            <div className="text-sm text-muted-foreground">{job.clientName}</div>
                            <div className="text-xs text-muted-foreground">
                              Est: {job.estimatedDuration}h | Actual: {job.actualDuration}h
                            </div>
                          </div>
                          <Badge variant="destructive">
                            +{job.variancePercent.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-green-500" />
                  Most Efficient Jobs
                </CardTitle>
                <CardDescription>Jobs completed faster than estimated</CardDescription>
              </CardHeader>
              <CardContent>
                {efficientJobsList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No jobs completed ahead of estimate yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {efficientJobsList.map((job) => (
                      <div key={job.id} className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <Link href={`/jobs/${job.id}`}>
                              <span className="font-medium hover:underline cursor-pointer">{job.title}</span>
                            </Link>
                            <div className="text-sm text-muted-foreground">{job.clientName}</div>
                            <div className="text-xs text-muted-foreground">
                              Est: {job.estimatedDuration}h | Actual: {job.actualDuration}h
                            </div>
                          </div>
                          <Badge className="bg-green-600">
                            {job.variancePercent.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
