import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MapPin,
  Phone,
  Clock,
  Calendar,
  ChevronRight,
  ChevronDown,
  Navigation,
  CheckCircle2,
  PlayCircle,
  AlertCircle,
  User,
  Building2,
  Wrench,
  Package,
} from "lucide-react";
import { SiGooglemaps, SiApple, SiWaze } from "react-icons/si";
import { format, parseISO, isToday, isTomorrow, isPast } from "date-fns";
import type { DbJob } from "@shared/schema";
import { SMOKE_CONTROL_SYSTEM_TYPES } from "@shared/schema";

interface Client {
  id: string;
  companyName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

interface SiteInfo {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postcode: string | null;
  systemType: string | null;
  accessNotes: string | null;
  parkingInfo: string | null;
  siteContactName: string | null;
  siteContactPhone: string | null;
}

interface JobWithSite extends DbJob {
  site: SiteInfo | null;
  assetCount: number;
  completedAssetCount: number;
}

export default function FieldCompanion() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<JobWithSite[]>({
    queryKey: ["/api/jobs-with-sites", user?.id],
    enabled: !!user?.id,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", user?.id],
    enabled: !!user?.id,
  });

  const getClient = (clientId: string | null) => {
    if (!clientId) return null;
    return clients.find((c) => c.id === clientId);
  };

  const getSystemLabel = (systemType: string | null) => {
    if (!systemType) return null;
    const system = SMOKE_CONTROL_SYSTEM_TYPES.find(s => s.value === systemType);
    return system?.label || systemType;
  };

  // Separate jobs by category
  const todaysJobs = jobs.filter(
    (j) => j.scheduledDate && isToday(parseISO(j.scheduledDate)) && j.status !== "completed"
  );
  const activeJob = jobs.find((j) => j.status === "in_progress");
  const upcomingJobs = jobs.filter(
    (j) => j.scheduledDate && !isToday(parseISO(j.scheduledDate)) && !isPast(parseISO(j.scheduledDate)) && j.status !== "completed"
  );
  const completedToday = jobs.filter(
    (j) => j.scheduledDate && isToday(parseISO(j.scheduledDate)) && j.status === "completed"
  );

  // Filter by search
  const filterJobs = (jobList: JobWithSite[]) => {
    if (!searchQuery) return jobList;
    const query = searchQuery.toLowerCase();
    return jobList.filter((job) => {
      const client = getClient(job.clientId);
      return (
        job.jobNumber?.toLowerCase().includes(query) ||
        job.title?.toLowerCase().includes(query) ||
        job.siteAddress?.toLowerCase().includes(query) ||
        job.site?.name?.toLowerCase().includes(query) ||
        client?.companyName?.toLowerCase().includes(query)
      );
    });
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "in_progress":
        return "bg-blue-500 dark:bg-blue-400";
      case "completed":
        return "bg-green-500 dark:bg-green-400";
      case "scheduled":
        return "bg-amber-500 dark:bg-amber-400";
      default:
        return "bg-gray-400 dark:bg-gray-500";
    }
  };

  const getPriorityLabel = (priority: string | null) => {
    switch (priority) {
      case "urgent":
        return { label: "Urgent", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
      case "high":
        return { label: "High", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" };
      default:
        return null;
    }
  };

  const JobCard = ({ job, showDate = false }: { job: JobWithSite; showDate?: boolean }) => {
    const client = getClient(job.clientId);
    const priority = getPriorityLabel(job.priority);

    return (
      <Card
        className="hover-elevate cursor-pointer transition-all"
        onClick={() => setLocation(`/field-companion/${job.id}`)}
        data-testid={`card-job-${job.id}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Status indicator */}
            <div className={`w-2 h-full min-h-[60px] rounded-full ${getStatusColor(job.status)}`} />
            
            <div className="flex-1 min-w-0 space-y-2">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm" data-testid={`text-job-number-${job.id}`}>
                      {job.jobNumber}
                    </span>
                    {priority && (
                      <Badge className={priority.className} variant="secondary">
                        {priority.label}
                      </Badge>
                    )}
                    {job.assetCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Package className="h-3 w-3 mr-1" />
                        {job.completedAssetCount}/{job.assetCount}
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium text-base" data-testid={`text-job-title-${job.id}`}>
                    {job.title}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>

              {/* Site info */}
              {job.site && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="font-medium truncate" data-testid={`text-site-name-${job.id}`}>{job.site.name}</span>
                  {job.site.systemType && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      <Wrench className="h-3 w-3 mr-1" />
                      {getSystemLabel(job.site.systemType)}
                    </Badge>
                  )}
                </div>
              )}

              {/* Client */}
              {client && !job.site && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">{client.companyName}</span>
                </div>
              )}

              {/* Address */}
              {(job.site?.address || job.siteAddress) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {job.site?.address || job.siteAddress}
                    {job.site?.city && `, ${job.site.city}`}
                  </span>
                </div>
              )}

              {/* Time info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                {showDate && job.scheduledDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {isTomorrow(parseISO(job.scheduledDate))
                        ? "Tomorrow"
                        : format(parseISO(job.scheduledDate), "EEE, d MMM")}
                    </span>
                  </div>
                )}
                {job.scheduledTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{job.scheduledTime}</span>
                  </div>
                )}
                {job.estimatedDuration && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">
                    {job.estimatedDuration}h
                  </span>
                )}
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-2 pt-1">
                {job.siteAddress && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        data-testid={`button-navigate-${job.id}`}
                      >
                        <Navigation className="h-3 w-3 mr-1" />
                        Navigate
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `https://maps.google.com/?q=${encodeURIComponent(job.siteAddress || "")}`,
                            "_blank"
                          );
                        }}
                        data-testid={`menu-google-maps-${job.id}`}
                      >
                        <SiGooglemaps className="h-4 w-4 mr-2 text-[#4285F4]" />
                        Google Maps
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `https://maps.apple.com/?q=${encodeURIComponent(job.siteAddress || "")}`,
                            "_blank"
                          );
                        }}
                        data-testid={`menu-apple-maps-${job.id}`}
                      >
                        <SiApple className="h-4 w-4 mr-2" />
                        Apple Maps
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `https://waze.com/ul?q=${encodeURIComponent(job.siteAddress || "")}`,
                            "_blank"
                          );
                        }}
                        data-testid={`menu-waze-${job.id}`}
                      >
                        <SiWaze className="h-4 w-4 mr-2 text-[#33CCFF]" />
                        Waze
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {client?.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `tel:${client.phone}`;
                    }}
                    data-testid={`button-call-${job.id}`}
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Search bar */}
      <div className="bg-background border-b p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs, clients, addresses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-field-search"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {jobsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* Active Job - Most prominent */}
              {activeJob && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    <h2 className="font-semibold text-lg">Currently On Site</h2>
                  </div>
                  <div className="ring-2 ring-blue-500 dark:ring-blue-400 rounded-md">
                    <JobCard job={activeJob} />
                  </div>
                </div>
              )}

              {/* Today's Schedule */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-lg">Today's Jobs</h2>
                  <Badge variant="secondary" className="ml-auto">
                    {filterJobs(todaysJobs).length}
                  </Badge>
                </div>
                
                {filterJobs(todaysJobs).length === 0 ? (
                  <Card className="bg-muted/50">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500 dark:text-green-400" />
                      <p>No more jobs scheduled for today</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filterJobs(todaysJobs)
                      .sort((a, b) => (a.scheduledTime || "").localeCompare(b.scheduledTime || ""))
                      .map((job) => (
                        <JobCard key={job.id} job={job} />
                      ))}
                  </div>
                )}
              </div>

              {/* Completed Today */}
              {completedToday.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <h2 className="font-semibold text-lg">Completed Today</h2>
                    <Badge variant="secondary" className="ml-auto">
                      {completedToday.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {completedToday.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Jobs */}
              {filterJobs(upcomingJobs).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                    <h2 className="font-semibold text-lg">Upcoming</h2>
                    <Badge variant="secondary" className="ml-auto">
                      {filterJobs(upcomingJobs).length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {filterJobs(upcomingJobs)
                      .sort((a, b) => (a.scheduledDate || "").localeCompare(b.scheduledDate || ""))
                      .slice(0, 5)
                      .map((job) => (
                        <JobCard key={job.id} job={job} showDate />
                      ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {jobs.length === 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No jobs assigned</p>
                    <p className="text-sm mt-1">Jobs will appear here when scheduled</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Bottom quick stats bar */}
      <div className="bg-background border-t p-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-primary dark:text-primary">{todaysJobs.length}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedToday.length}</p>
            <p className="text-xs text-muted-foreground">Done</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{upcomingJobs.length}</p>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </div>
        </div>
      </div>
    </div>
  );
}
