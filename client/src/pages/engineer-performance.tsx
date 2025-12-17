import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Wrench,
  Timer,
  Target,
  BarChart3,
  Calendar
} from "lucide-react";
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
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, parseISO, subMonths, isAfter, differenceInMinutes, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import type { DbStaffDirectory, DbJob, DbDefect, DbJobPartsUsed } from "@shared/schema";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

interface EngineerStats {
  id: string;
  name: string;
  initials: string;
  jobsCompleted: number;
  jobsInProgress: number;
  jobsScheduled: number;
  avgTimeOnSite: number;
  defectsFound: number;
  partsUsed: number;
  totalPartsCost: number;
  onTimeRate: number;
  firstTimeFixRate: number;
}

export default function EngineerPerformance() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("3months");
  const [selectedEngineer, setSelectedEngineer] = useState<string>("all");

  const { data: staff = [] } = useQuery<DbStaffDirectory[]>({
    queryKey: ["/api/staff-directory", user?.id],
    enabled: !!user?.id,
  });

  const { data: jobs = [] } = useQuery<DbJob[]>({
    queryKey: ["/api/jobs", user?.id],
    enabled: !!user?.id,
  });

  const { data: defects = [] } = useQuery<DbDefect[]>({
    queryKey: [`/api/defects/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: partsUsed = [] } = useQuery<DbJobPartsUsed[]>({
    queryKey: ["/api/job-parts-used", user?.id],
    enabled: !!user?.id,
  });

  const engineers = useMemo(() => {
    return staff.filter(s => 
      s.isActive && 
      (s.department?.toLowerCase().includes("engineer") || 
       s.jobTitle?.toLowerCase().includes("engineer") ||
       s.jobTitle?.toLowerCase().includes("technician"))
    );
  }, [staff]);

  const periodStart = useMemo(() => {
    const months = selectedPeriod === "1month" ? 1 : selectedPeriod === "3months" ? 3 : selectedPeriod === "6months" ? 6 : 12;
    return subMonths(new Date(), months);
  }, [selectedPeriod]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (!job.scheduledDate) return false;
      const jobDate = parseISO(job.scheduledDate);
      return isAfter(jobDate, periodStart);
    });
  }, [jobs, periodStart]);

  const engineerStats: EngineerStats[] = useMemo(() => {
    return engineers.map(engineer => {
      const engineerName = `${engineer.firstName} ${engineer.lastName}`.toLowerCase();
      
      const engineerJobs = filteredJobs.filter(job => {
        const assignedNames = job.engineerNames || [];
        return assignedNames.some((e: any) => 
          e.name?.toLowerCase().includes(engineerName) ||
          engineerName.includes(e.name?.toLowerCase() || "")
        );
      });

      const completedJobs = engineerJobs.filter(j => 
        ["completed", "complete", "closed"].includes(j.status?.toLowerCase() || "")
      );
      const inProgressJobs = engineerJobs.filter(j => 
        ["in_progress", "in progress", "active"].includes(j.status?.toLowerCase() || "")
      );
      const scheduledJobs = engineerJobs.filter(j => 
        ["scheduled", "pending", "booked"].includes(j.status?.toLowerCase() || "")
      );

      let totalTimeOnSite = 0;
      let timeRecordCount = 0;
      completedJobs.forEach(job => {
        if (job.checkInTime && job.checkOutTime) {
          const checkIn = typeof job.checkInTime === "string" ? parseISO(job.checkInTime) : job.checkInTime;
          const checkOut = typeof job.checkOutTime === "string" ? parseISO(job.checkOutTime) : job.checkOutTime;
          const minutes = differenceInMinutes(checkOut, checkIn);
          if (minutes > 0 && minutes < 480) {
            totalTimeOnSite += minutes;
            timeRecordCount++;
          }
        }
      });
      const avgTimeOnSite = timeRecordCount > 0 ? Math.round(totalTimeOnSite / timeRecordCount) : 0;

      const engineerDefects = defects.filter(d => {
        const job = jobs.find(j => j.id === d.jobId);
        if (!job) return false;
        const assignedNames = job.engineerNames || [];
        return assignedNames.some((e: any) => 
          e.name?.toLowerCase().includes(engineerName) ||
          engineerName.includes(e.name?.toLowerCase() || "")
        );
      });

      const engineerParts = partsUsed.filter(p => {
        const job = jobs.find(j => j.id === p.jobId);
        if (!job) return false;
        const assignedNames = job.engineerNames || [];
        return assignedNames.some((e: any) => 
          e.name?.toLowerCase().includes(engineerName) ||
          engineerName.includes(e.name?.toLowerCase() || "")
        );
      });

      const totalPartsCost = engineerParts.reduce((sum, p) => sum + (p.totalCost || 0), 0);

      const onTimeJobs = completedJobs.filter(job => {
        if (!job.scheduledDate || !job.completedAt) return false;
        const scheduled = typeof job.scheduledDate === "string" ? parseISO(job.scheduledDate) : job.scheduledDate;
        const completed = typeof job.completedAt === "string" ? parseISO(job.completedAt) : job.completedAt;
        return completed <= scheduled;
      });
      const onTimeRate = completedJobs.length > 0 ? Math.round((onTimeJobs.length / completedJobs.length) * 100) : 0;

      const firstTimeFixJobs = completedJobs.filter(job => {
        const jobDefects = defects.filter(d => d.jobId === job.id && d.status !== "resolved");
        return jobDefects.length === 0;
      });
      const firstTimeFixRate = completedJobs.length > 0 ? Math.round((firstTimeFixJobs.length / completedJobs.length) * 100) : 0;

      return {
        id: engineer.id,
        name: `${engineer.firstName} ${engineer.lastName}`,
        initials: `${engineer.firstName?.[0] || ""}${engineer.lastName?.[0] || ""}`.toUpperCase(),
        jobsCompleted: completedJobs.length,
        jobsInProgress: inProgressJobs.length,
        jobsScheduled: scheduledJobs.length,
        avgTimeOnSite,
        defectsFound: engineerDefects.length,
        partsUsed: engineerParts.length,
        totalPartsCost,
        onTimeRate,
        firstTimeFixRate,
      };
    });
  }, [engineers, filteredJobs, defects, partsUsed, jobs]);

  const totalStats = useMemo(() => {
    const total = engineerStats.reduce(
      (acc, eng) => ({
        jobsCompleted: acc.jobsCompleted + eng.jobsCompleted,
        jobsInProgress: acc.jobsInProgress + eng.jobsInProgress,
        defectsFound: acc.defectsFound + eng.defectsFound,
        partsUsed: acc.partsUsed + eng.partsUsed,
        totalPartsCost: acc.totalPartsCost + eng.totalPartsCost,
      }),
      { jobsCompleted: 0, jobsInProgress: 0, defectsFound: 0, partsUsed: 0, totalPartsCost: 0 }
    );
    
    const avgOnTime = engineerStats.length > 0 
      ? Math.round(engineerStats.reduce((sum, e) => sum + e.onTimeRate, 0) / engineerStats.length) 
      : 0;
    const avgFirstFix = engineerStats.length > 0 
      ? Math.round(engineerStats.reduce((sum, e) => sum + e.firstTimeFixRate, 0) / engineerStats.length)
      : 0;
    
    return { ...total, avgOnTime, avgFirstFix };
  }, [engineerStats]);

  const jobsChartData = useMemo(() => {
    return engineerStats.map(eng => ({
      name: eng.name.split(" ")[0],
      completed: eng.jobsCompleted,
      inProgress: eng.jobsInProgress,
      scheduled: eng.jobsScheduled,
    }));
  }, [engineerStats]);

  const metricsChartData = useMemo(() => {
    return engineerStats.map(eng => ({
      name: eng.name.split(" ")[0],
      onTimeRate: eng.onTimeRate,
      firstTimeFixRate: eng.firstTimeFixRate,
      avgTime: eng.avgTimeOnSite,
    }));
  }, [engineerStats]);

  const jobStatusDistribution = useMemo(() => {
    const completed = filteredJobs.filter(j => j.status === "completed").length;
    const inProgress = filteredJobs.filter(j => j.status === "in_progress").length;
    const scheduled = filteredJobs.filter(j => j.status === "scheduled").length;
    const other = filteredJobs.length - completed - inProgress - scheduled;
    
    return [
      { name: "Completed", value: completed, color: "#10b981" },
      { name: "In Progress", value: inProgress, color: "#3b82f6" },
      { name: "Scheduled", value: scheduled, color: "#f59e0b" },
      { name: "Other", value: other, color: "#6b7280" },
    ].filter(d => d.value > 0);
  }, [filteredJobs]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Users className="h-6 w-6" />
            Engineer Performance
          </h1>
          <p className="text-muted-foreground">
            Track individual and team performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Jobs Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-completed">
              {totalStats.jobsCompleted}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalStats.jobsInProgress} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              On-Time Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ontime-rate">
              {totalStats.avgOnTime}%
            </div>
            <Progress value={totalStats.avgOnTime} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              First-Time Fix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-firstfix-rate">
              {totalStats.avgFirstFix}%
            </div>
            <Progress value={totalStats.avgFirstFix} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Defects Logged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-defects">
              {totalStats.defectsFound}
            </div>
            <p className="text-xs text-muted-foreground">
              £{totalStats.totalPartsCost.toFixed(0)} parts used
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="charts" data-testid="tab-charts">Charts</TabsTrigger>
          <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Engineer Rankings</CardTitle>
              <CardDescription>Performance comparison across all engineers</CardDescription>
            </CardHeader>
            <CardContent>
              {engineerStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No engineers found in staff directory.</p>
                  <p className="text-sm">Add engineers with "Engineer" or "Technician" in their job title.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {engineerStats
                    .sort((a, b) => b.jobsCompleted - a.jobsCompleted)
                    .map((eng, index) => (
                      <div
                        key={eng.id}
                        className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                        data-testid={`engineer-row-${eng.id}`}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          #{index + 1}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{eng.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{eng.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {eng.jobsCompleted} completed, {eng.jobsInProgress} in progress
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {eng.avgTimeOnSite}m avg
                          </Badge>
                          <Badge 
                            variant={eng.onTimeRate >= 80 ? "default" : eng.onTimeRate >= 60 ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            <Target className="h-3 w-3 mr-1" />
                            {eng.onTimeRate}% on-time
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Jobs by Engineer</CardTitle>
              </CardHeader>
              <CardContent>
                {jobsChartData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={jobsChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completed" name="Completed" fill="#10b981" />
                        <Bar dataKey="inProgress" name="In Progress" fill="#3b82f6" />
                        <Bar dataKey="scheduled" name="Scheduled" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Job Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {jobStatusDistribution.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={jobStatusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {jobStatusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Metrics by Engineer</CardTitle>
            </CardHeader>
            <CardContent>
              {metricsChartData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metricsChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="onTimeRate" name="On-Time %" fill="#3b82f6" />
                      <Bar dataKey="firstTimeFixRate" name="First-Time Fix %" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {engineerStats.map(eng => (
              <Card key={eng.id} data-testid={`engineer-card-${eng.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-lg">{eng.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{eng.name}</CardTitle>
                      <CardDescription>{eng.jobsCompleted + eng.jobsInProgress + eng.jobsScheduled} total jobs</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-green-500/10 rounded">
                      <div className="text-lg font-bold text-green-600">{eng.jobsCompleted}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded">
                      <div className="text-lg font-bold text-blue-600">{eng.jobsInProgress}</div>
                      <div className="text-xs text-muted-foreground">In Progress</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">On-Time Rate</span>
                      <span className="font-medium">{eng.onTimeRate}%</span>
                    </div>
                    <Progress value={eng.onTimeRate} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">First-Time Fix</span>
                      <span className="font-medium">{eng.firstTimeFixRate}%</span>
                    </div>
                    <Progress value={eng.firstTimeFixRate} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
                    <div>
                      <span className="text-muted-foreground">Avg Time on Site</span>
                      <div className="font-medium">{eng.avgTimeOnSite} mins</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Defects Found</span>
                      <div className="font-medium">{eng.defectsFound}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Parts Used</span>
                      <div className="font-medium">{eng.partsUsed} items</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Parts Cost</span>
                      <div className="font-medium">£{eng.totalPartsCost.toFixed(0)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {engineerStats.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No engineers found in the staff directory.</p>
                <p className="text-sm mt-1">
                  Engineers are identified by having "Engineer" or "Technician" in their job title.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
