import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Phone,
  Clock,
  Calendar,
  ChevronRight,
  Briefcase,
  Route,
  QrCode,
  Menu,
  AlertTriangle,
} from "lucide-react";
import { format, parseISO, isToday } from "date-fns";

interface Job {
  id: string;
  jobNumber: string;
  title: string;
  status: string;
  priority: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  estimatedDuration: number | null;
  siteAddress: string | null;
  clientId: string | null;
  notes: string | null;
  systems: any[];
}

interface Client {
  id: string;
  companyName: string;
  contactName: string | null;
  phone: string | null;
}

export default function FieldCompanion() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortOrder, setSortOrder] = useState("date-asc");

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs", user?.id],
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      scheduled: { variant: "outline", label: "Scheduled" },
      in_progress: { variant: "default", label: "On Site" },
      completed: { variant: "secondary", label: "Complete" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityStyles = (priority: string) => {
    const baseStyle = "border-l-4";
    switch (priority) {
      case "urgent":
        return `${baseStyle} border-l-red-500 dark:border-l-red-400`;
      case "high":
        return `${baseStyle} border-l-orange-500 dark:border-l-orange-400`;
      case "medium":
        return `${baseStyle} border-l-yellow-500 dark:border-l-yellow-400`;
      default:
        return `${baseStyle} border-l-gray-300 dark:border-l-gray-600`;
    }
  };

  const filteredJobs = jobs
    .filter((job) => {
      if (activeTab === "today") {
        return job.scheduledDate && isToday(parseISO(job.scheduledDate));
      }
      if (activeTab === "working") {
        return job.status === "in_progress";
      }
      return true;
    })
    .filter((job) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const client = getClient(job.clientId);
      return (
        job.jobNumber?.toLowerCase().includes(query) ||
        job.title?.toLowerCase().includes(query) ||
        job.siteAddress?.toLowerCase().includes(query) ||
        client?.companyName?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortOrder === "date-asc") {
        return (a.scheduledDate || "").localeCompare(b.scheduledDate || "");
      }
      if (sortOrder === "date-desc") {
        return (b.scheduledDate || "").localeCompare(a.scheduledDate || "");
      }
      if (sortOrder === "priority") {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) -
          (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
      }
      return 0;
    });

  const todayCount = jobs.filter(
    (j) => j.scheduledDate && isToday(parseISO(j.scheduledDate))
  ).length;
  const workingCount = jobs.filter((j) => j.status === "in_progress").length;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by job number, site, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-field-search"
            />
          </div>
          <Button variant="outline" size="icon" data-testid="button-field-filter">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-full" data-testid="select-sort-order">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-asc">Date - Oldest First</SelectItem>
            <SelectItem value="date-desc">Date - Newest First</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
          </SelectContent>
        </Select>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" data-testid="tabs-job-filter">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="all" data-testid="tab-all-jobs">
              All <Badge variant="secondary" className="ml-1 text-xs">{jobs.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="today" data-testid="tab-today-jobs">
              Today <Badge variant="secondary" className="ml-1 text-xs">{todayCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="working" data-testid="tab-working-jobs">
              Working <Badge variant="secondary" className="ml-1 text-xs">{workingCount}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <main className="flex-1 overflow-y-auto p-3 space-y-3 touch-pan-y">
        {jobsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No jobs found
          </div>
        ) : (
          filteredJobs.map((job) => {
            const client = getClient(job.clientId);
            return (
              <Link key={job.id} href={`/field-companion/${job.id}`}>
                <Card
                  className={`hover-elevate cursor-pointer ${getPriorityStyles(job.priority)}`}
                  data-testid={`card-job-${job.id}`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-primary" data-testid={`text-job-number-${job.id}`}>
                            {job.jobNumber}
                          </span>
                          {job.notes && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <p className="font-medium truncate" data-testid={`text-job-title-${job.id}`}>
                          {job.title}
                        </p>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>

                    {client && (
                      <p className="text-sm text-muted-foreground">
                        {client.companyName}
                      </p>
                    )}

                    <p className="text-sm line-clamp-2 text-muted-foreground">
                      {job.notes || "No special notes"}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {job.scheduledDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(parseISO(job.scheduledDate), "dd/MM/yyyy")}
                            {job.scheduledTime && ` - ${job.scheduledTime}`}
                          </span>
                        </div>
                      )}
                      {job.estimatedDuration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{job.estimatedDuration}h</span>
                        </div>
                      )}
                    </div>

                    {job.siteAddress && (
                      <div className="flex items-start gap-1 text-sm">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                        <span className="text-muted-foreground">{job.siteAddress}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-auto text-primary underline"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(
                              `https://maps.google.com/?q=${encodeURIComponent(job.siteAddress || "")}`,
                              "_blank"
                            );
                          }}
                          data-testid={`link-map-${job.id}`}
                        >
                          View On Map
                        </Button>
                      </div>
                    )}

                    {client?.phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-primary underline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `tel:${client.phone}`;
                          }}
                          data-testid={`link-call-${job.id}`}
                        >
                          {client.phone}
                        </Button>
                      </div>
                    )}

                    {job.systems && job.systems.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {job.systems.slice(0, 3).map((system, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {system.systemType}
                          </Badge>
                        ))}
                        {job.systems.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{job.systems.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {job.status !== "completed" && (
                      <Button
                        className="w-full mt-2"
                        variant="default"
                        data-testid={`button-complete-${job.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                        }}
                      >
                        Complete
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </main>

      <nav className="sticky bottom-0 bg-background border-t">
        <div className="grid grid-cols-4">
          <button
            onClick={() => setLocation("/field-companion")}
            className="flex flex-col items-center justify-center gap-1 h-14 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            data-testid="nav-jobs"
          >
            <Briefcase className="h-5 w-5" />
            <span className="text-xs">Jobs</span>
          </button>
          <button
            onClick={() => setLocation("/field-companion/routes")}
            className="flex flex-col items-center justify-center gap-1 h-14 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            data-testid="nav-routes"
          >
            <Route className="h-5 w-5" />
            <span className="text-xs">Routes</span>
          </button>
          <button
            className="flex flex-col items-center justify-center gap-1 h-14 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            data-testid="nav-scan"
          >
            <QrCode className="h-5 w-5" />
            <span className="text-xs">Scan</span>
          </button>
          <button
            className="flex flex-col items-center justify-center gap-1 h-14 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            data-testid="nav-menu"
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs">Menu</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
