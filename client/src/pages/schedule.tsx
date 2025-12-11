import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Plus,
  ArrowRight,
  Building2
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  parseISO,
  isToday,
  getDay,
  startOfDay,
  endOfDay,
  isWithinInterval
} from "date-fns";

interface Job {
  id: string;
  clientId: string | null;
  contractId: string | null;
  jobNumber: string;
  title: string;
  description: string | null;
  siteAddress: string | null;
  siteCity: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  estimatedDuration: number | null;
  status: string;
  priority: string;
  jobType: string;
  assignedTo: string | null;
}

interface Client {
  id: string;
  companyName: string;
}

type ViewMode = "month" | "week" | "day";

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  normal: "bg-blue-500 text-white",
  low: "bg-gray-400 text-white",
};

const statusColors: Record<string, string> = {
  pending: "border-l-4 border-l-gray-400",
  scheduled: "border-l-4 border-l-blue-500",
  in_progress: "border-l-4 border-l-yellow-500",
  completed: "border-l-4 border-l-green-500",
  cancelled: "border-l-4 border-l-red-500",
};

export default function Schedule() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs", user?.id],
    enabled: !!user?.id,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", user?.id],
    enabled: !!user?.id,
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Job> }) => {
      return apiRequest("PATCH", `/api/jobs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", user?.id] });
      toast({ title: "Job updated" });
      setIsJobDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update job", variant: "destructive" });
    },
  });

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "No client";
    return clients.find(c => c.id === clientId)?.companyName || "Unknown";
  };

  const getJobsForDate = (date: Date) => {
    return jobs.filter(job => {
      if (!job.scheduledDate) return false;
      return isSameDay(parseISO(job.scheduledDate), date);
    });
  };

  const navigatePrevious = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const navigateNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsCreateDialogOpen(true);
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setIsJobDialogOpen(true);
  };

  const handleReschedule = (newDate: string) => {
    if (selectedJob) {
      updateJobMutation.mutate({
        id: selectedJob.id,
        data: { scheduledDate: newDate },
      });
    }
  };

  // Generate calendar days for month view
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    const days: Date[] = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  // Generate week days for week view
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    return days;
  }, [currentDate]);

  // Time slots for day/week view
  const timeSlots = [
    "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  const renderMonthView = () => (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 bg-muted">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium border-b">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthDays.map((day, index) => {
          const dayJobs = getJobsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={index}
              className={`min-h-[100px] md:min-h-[120px] p-1 border-b border-r cursor-pointer hover-elevate ${
                !isCurrentMonth ? "bg-muted/30 text-muted-foreground" : ""
              } ${isCurrentDay ? "bg-primary/5" : ""}`}
              onClick={() => handleDateClick(day)}
              data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
            >
              <div className={`text-right text-sm p-1 ${isCurrentDay ? "font-bold text-primary" : ""}`}>
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayJobs.slice(0, 3).map(job => (
                  <div
                    key={job.id}
                    className={`text-xs p-1 rounded truncate cursor-pointer ${statusColors[job.status]} bg-card hover:opacity-80`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJobClick(job);
                    }}
                    data-testid={`job-card-${job.id}`}
                  >
                    <div className="font-medium truncate">{job.title}</div>
                    {job.scheduledTime && (
                      <div className="text-muted-foreground">{job.scheduledTime}</div>
                    )}
                  </div>
                ))}
                {dayJobs.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayJobs.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderWeekView = () => (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-8">
        <div className="p-2 border-b border-r bg-muted"></div>
        {weekDays.map(day => (
          <div
            key={day.toISOString()}
            className={`p-2 text-center border-b bg-muted ${isToday(day) ? "bg-primary/10" : ""}`}
          >
            <div className="text-xs text-muted-foreground">{format(day, "EEE")}</div>
            <div className={`text-lg font-semibold ${isToday(day) ? "text-primary" : ""}`}>
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>
      <div className="max-h-[500px] overflow-y-auto">
        {timeSlots.map(time => (
          <div key={time} className="grid grid-cols-8 min-h-[60px]">
            <div className="p-2 text-xs text-muted-foreground border-r border-b text-right">
              {time}
            </div>
            {weekDays.map(day => {
              const dayJobs = getJobsForDate(day).filter(
                job => job.scheduledTime?.startsWith(time.split(":")[0])
              );
              return (
                <div
                  key={`${day.toISOString()}-${time}`}
                  className="p-1 border-r border-b hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    setSelectedDate(day);
                    setIsCreateDialogOpen(true);
                  }}
                >
                  {dayJobs.map(job => (
                    <div
                      key={job.id}
                      className={`text-xs p-1 rounded mb-1 ${priorityColors[job.priority]} cursor-pointer`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJobClick(job);
                      }}
                    >
                      <div className="font-medium truncate">{job.title}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  const renderDayView = () => {
    const dayJobs = getJobsForDate(currentDate);

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="p-4 bg-muted border-b">
          <h3 className="text-lg font-semibold">{format(currentDate, "EEEE, MMMM d, yyyy")}</h3>
          <p className="text-sm text-muted-foreground">{dayJobs.length} jobs scheduled</p>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {timeSlots.map(time => {
            const timeJobs = dayJobs.filter(
              job => job.scheduledTime?.startsWith(time.split(":")[0])
            );
            return (
              <div key={time} className="flex border-b min-h-[80px]">
                <div className="w-20 p-3 text-sm text-muted-foreground border-r flex-shrink-0">
                  {time}
                </div>
                <div
                  className="flex-1 p-2 hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    setSelectedDate(currentDate);
                    setIsCreateDialogOpen(true);
                  }}
                >
                  {timeJobs.map(job => (
                    <div
                      key={job.id}
                      className={`p-3 rounded-lg mb-2 ${statusColors[job.status]} bg-card border cursor-pointer`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJobClick(job);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium">{job.title}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Building2 className="h-3 w-3" />
                            {getClientName(job.clientId)}
                          </div>
                          {job.siteAddress && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.siteAddress}
                            </div>
                          )}
                        </div>
                        <Badge className={priorityColors[job.priority]}>
                          {job.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Jobs without scheduled dates
  const unscheduledJobs = jobs.filter(
    job => !job.scheduledDate && job.status !== "completed" && job.status !== "cancelled"
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-schedule-title">Schedule</h1>
          <p className="text-muted-foreground">Manage job scheduling and assignments</p>
        </div>
        <Link href="/jobs">
          <Button data-testid="button-new-job">
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Main Calendar */}
        <div className="md:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={navigatePrevious} data-testid="button-prev">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={navigateNext} data-testid="button-next">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToToday} data-testid="button-today">
                    Today
                  </Button>
                  <h2 className="text-lg font-semibold ml-2">
                    {viewMode === "day" 
                      ? format(currentDate, "MMMM d, yyyy")
                      : format(currentDate, "MMMM yyyy")
                    }
                  </h2>
                </div>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                  <TabsList>
                    <TabsTrigger value="month" data-testid="tab-month">Month</TabsTrigger>
                    <TabsTrigger value="week" data-testid="tab-week">Week</TabsTrigger>
                    <TabsTrigger value="day" data-testid="tab-day">Day</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === "month" && renderMonthView()}
              {viewMode === "week" && renderWeekView()}
              {viewMode === "day" && renderDayView()}
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-400" />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Completed</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Unscheduled Jobs */}
          <Card data-testid="card-unscheduled-jobs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Unscheduled Jobs</CardTitle>
              <CardDescription>{unscheduledJobs.length} jobs need scheduling</CardDescription>
            </CardHeader>
            <CardContent>
              {unscheduledJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All jobs are scheduled
                </p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {unscheduledJobs.map(job => (
                    <div
                      key={job.id}
                      className={`p-2 rounded-lg border cursor-pointer hover-elevate ${statusColors[job.status]}`}
                      onClick={() => handleJobClick(job)}
                      data-testid={`unscheduled-job-${job.id}`}
                    >
                      <div className="font-medium text-sm">{job.title}</div>
                      <div className="text-xs text-muted-foreground">{getClientName(job.clientId)}</div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {job.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card data-testid="card-today-schedule">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Today</CardTitle>
              <CardDescription>{format(new Date(), "EEEE, MMM d")}</CardDescription>
            </CardHeader>
            <CardContent>
              {getJobsForDate(new Date()).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No jobs scheduled for today
                </p>
              ) : (
                <div className="space-y-2">
                  {getJobsForDate(new Date()).map(job => (
                    <div
                      key={job.id}
                      className="p-2 rounded-lg border cursor-pointer hover-elevate"
                      onClick={() => handleJobClick(job)}
                    >
                      <div className="flex items-center gap-2">
                        {job.scheduledTime && (
                          <span className="text-xs font-mono bg-muted px-1 rounded">
                            {job.scheduledTime}
                          </span>
                        )}
                        <span className="font-medium text-sm truncate">{job.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Priority Legend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Priority Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(priorityColors).map(([priority, color]) => (
                <div key={priority} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${color}`} />
                  <span className="text-sm capitalize">{priority}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Job Details Dialog */}
      <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
            <DialogDescription>View and reschedule this job</DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedJob.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedJob.jobNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Client:</span>
                  <p className="font-medium">{getClientName(selectedJob.clientId)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium capitalize">{selectedJob.status.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Priority:</span>
                  <Badge className={priorityColors[selectedJob.priority]}>{selectedJob.priority}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium capitalize">{selectedJob.jobType?.replace(/_/g, " ")}</p>
                </div>
              </div>

              {selectedJob.siteAddress && (
                <div>
                  <span className="text-sm text-muted-foreground">Location:</span>
                  <p className="font-medium">{selectedJob.siteAddress}</p>
                  {selectedJob.siteCity && <p className="text-sm text-muted-foreground">{selectedJob.siteCity}</p>}
                </div>
              )}

              <div className="border-t pt-4 space-y-3">
                <Label>Reschedule</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    defaultValue={selectedJob.scheduledDate || ""}
                    onChange={(e) => handleReschedule(e.target.value)}
                    data-testid="input-reschedule-date"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Link href={`/jobs/${selectedJob.id}`} className="flex-1">
                  <Button variant="outline" className="w-full" data-testid="button-view-job">
                    View Full Details
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule a Job</DialogTitle>
            <DialogDescription>
              {selectedDate && `Create or assign a job for ${format(selectedDate, "MMMM d, yyyy")}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To schedule a job for this date, create a new job or edit an existing unscheduled job.
            </p>
            <div className="flex gap-2">
              <Link href="/jobs" className="flex-1">
                <Button className="w-full" data-testid="button-create-job-dialog">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Job
                </Button>
              </Link>
            </div>
            {unscheduledJobs.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Or assign an existing job:</p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {unscheduledJobs.slice(0, 5).map(job => (
                    <div
                      key={job.id}
                      className="p-2 rounded border cursor-pointer hover-elevate"
                      onClick={() => {
                        if (selectedDate) {
                          updateJobMutation.mutate({
                            id: job.id,
                            data: { scheduledDate: format(selectedDate, "yyyy-MM-dd") },
                          });
                          setIsCreateDialogOpen(false);
                        }
                      }}
                    >
                      <div className="font-medium text-sm">{job.title}</div>
                      <div className="text-xs text-muted-foreground">{getClientName(job.clientId)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
