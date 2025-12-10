import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { loadStorageData, type StorageData } from "@/lib/storage";
import { useState, useEffect, useMemo } from "react";
import { format, parseISO, differenceInDays, addYears } from "date-fns";
import { SyncIndicator } from "@/components/SyncIndicator";
import { useOfflineSync } from "@/hooks/useOfflineSync";

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
  const syncState = useOfflineSync();

  useEffect(() => {
    setStorageData(loadStorageData());
  }, []);

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

    // Calculate upcoming tests (annual inspections due within 30 days)
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

    // Recent activity
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
      flaggedDampers: 0, // Will be calculated by predictive maintenance
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

    // Group tests by damper
    tests.forEach(test => {
      const key = `${test.building}_${test.location}_${test.floorNumber}_${test.shaftId}`;
      if (!damperTests.has(key)) {
        damperTests.set(key, []);
      }
      damperTests.get(key)!.push(test);
    });

    const flagged: FlaggedDamper[] = [];

    damperTests.forEach((damperTestList, key) => {
      if (damperTestList.length < 2) return; // Need at least 2 tests for trend

      const sorted = damperTestList.sort((a, b) => a.createdAt - b.createdAt);
      const velocities = sorted.map(t => t.average);
      
      // Calculate trend using simple linear regression
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

      // Flag if declining more than 10% or below threshold
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
          <p className="text-muted-foreground">Overview of your smoke control testing</p>
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
          <Link href="/test">
            <Button data-testid="button-new-test">
              <Plus className="h-4 w-4 mr-2" />
              New Test
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
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
