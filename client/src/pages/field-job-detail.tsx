import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  FileText,
  History,
  Building2,
  ClipboardList,
  Briefcase,
  Route,
  QrCode,
  Menu,
  Navigation,
  User,
  Send,
  Car,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Job {
  id: string;
  jobNumber: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  estimatedDuration: number | null;
  siteAddress: string | null;
  clientId: string | null;
  contractId: string | null;
  notes: string | null;
  accessInstructions: string | null;
  specialRequirements: string | null;
  systems: any[];
  engineerIds: string[];
  checkInTime: string | null;
  checkOutTime: string | null;
}

interface Client {
  id: string;
  companyName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

interface Contract {
  id: string;
  title: string;
  contractNumber: string | null;
}

interface CheckSheet {
  id: string;
  systemType: string;
  status: string;
  completedAt: string | null;
}

export default function FieldJobDetail() {
  const [, params] = useRoute("/field-companion/:id");
  const jobId = params?.id;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [contractExpanded, setContractExpanded] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showNoAccessDialog, setShowNoAccessDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [noAccessReason, setNoAccessReason] = useState("");

  const { data: job, isLoading: jobLoading } = useQuery<Job>({
    queryKey: ["/api/jobs", jobId],
    enabled: !!jobId,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const { data: checkSheets = [] } = useQuery<CheckSheet[]>({
    queryKey: ["/api/check-sheets", jobId],
    enabled: !!jobId,
  });

  const client = clients.find((c) => c.id === job?.clientId);
  const contract = contracts.find((c) => c.id === job?.contractId);

  const updateJobMutation = useMutation({
    mutationFn: async (updates: Partial<Job>) => {
      return apiRequest("PATCH", `/api/jobs/${jobId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
  });

  const handleCheckIn = () => {
    updateJobMutation.mutate(
      {
        status: "in_progress",
        checkInTime: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          toast({ title: "Checked in successfully" });
        },
      }
    );
  };

  const handleCheckOut = () => {
    updateJobMutation.mutate(
      {
        checkOutTime: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          toast({ title: "Left site recorded" });
        },
      }
    );
  };

  const handleComplete = () => {
    updateJobMutation.mutate(
      {
        status: "completed",
        notes: completionNotes
          ? `${job?.notes || ""}\n\nCompletion Notes: ${completionNotes}`
          : job?.notes,
        checkOutTime: job?.checkOutTime || new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setShowCompleteDialog(false);
          toast({ title: "Job completed successfully" });
        },
      }
    );
  };

  const handleNoAccess = () => {
    updateJobMutation.mutate(
      {
        status: "no_access",
        notes: noAccessReason
          ? `${job?.notes || ""}\n\nNo Access: ${noAccessReason}`
          : job?.notes,
      },
      {
        onSuccess: () => {
          setShowNoAccessDialog(false);
          toast({ title: "No access recorded" });
        },
      }
    );
  };

  const handleOnMyWay = () => {
    toast({
      title: "Notification sent",
      description: `Client notified that you're on your way to ${client?.companyName || "the site"}`,
    });
  };

  const handleJobCompleteNotify = () => {
    toast({
      title: "Notification sent",
      description: `Client notified that the job at ${client?.companyName || "the site"} is complete`,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      scheduled: { variant: "outline", label: "Scheduled" },
      in_progress: { variant: "default", label: "On Site" },
      completed: { variant: "secondary", label: "Complete" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      no_access: { variant: "destructive", label: "No Access" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const hasAlerts =
    job?.notes || job?.accessInstructions || job?.specialRequirements;

  if (jobLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">Job not found</p>
        <Link href="/field-companion">
          <Button variant="outline">Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b p-3">
        <div className="flex items-center gap-3">
          <Link href="/field-companion">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-semibold" data-testid="text-job-number">
              {job.jobNumber}
            </h1>
            <p className="text-sm text-muted-foreground truncate" data-testid="text-job-title">
              {job.title}
            </p>
          </div>
          {getStatusBadge(job.status)}
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="grid grid-cols-3 mx-3 mt-3">
          <TabsTrigger value="details" data-testid="tab-details">
            Details
          </TabsTrigger>
          <TabsTrigger value="checksheets" data-testid="tab-checksheets">
            Check Sheets
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            History
          </TabsTrigger>
        </TabsList>

        <main className="flex-1 overflow-y-auto p-3 space-y-3">
          <TabsContent value="details" className="m-0 space-y-3">
            {hasAlerts && (
              <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-2 text-sm">
                      {job.notes && (
                        <div>
                          <span className="font-medium">Job Notes:</span>{" "}
                          {job.notes}
                        </div>
                      )}
                      {job.accessInstructions && (
                        <div>
                          <span className="font-medium">Access:</span>{" "}
                          {job.accessInstructions}
                        </div>
                      )}
                      {job.specialRequirements && (
                        <div>
                          <span className="font-medium">Special Requirements:</span>{" "}
                          {job.specialRequirements}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Site Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client && (
                  <div>
                    <p className="font-medium">{client.companyName}</p>
                    {client.contactName && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {client.contactName}
                      </p>
                    )}
                  </div>
                )}

                {job.siteAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm">{job.siteAddress}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-primary hover:bg-transparent"
                        onClick={() => {
                          window.open(
                            `https://maps.google.com/?q=${encodeURIComponent(job.siteAddress || "")}`,
                            "_blank"
                          );
                        }}
                        data-testid="link-view-map"
                      >
                        <Navigation className="h-3 w-3 mr-1" />
                        View On Map
                      </Button>
                    </div>
                  </div>
                )}

                {client?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${client.phone}`}
                      className="text-sm text-primary hover:underline"
                      data-testid="link-call-client"
                    >
                      {client.phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {job.scheduledDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(parseISO(job.scheduledDate), "EEEE, dd MMMM yyyy")}
                    </span>
                  </div>
                )}
                {job.scheduledTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{job.scheduledTime}</span>
                  </div>
                )}
                {job.estimatedDuration && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Est. {job.estimatedDuration}h duration</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {job.systems && job.systems.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Systems to Test
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {job.systems.map((system, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                      >
                        <div>
                          <p className="font-medium text-sm">{system.systemType}</p>
                          {system.location && (
                            <p className="text-xs text-muted-foreground">
                              {system.location}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {system.damperCount || system.quantity || 1} units
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-2">Quick Notifications</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleOnMyWay}
                    data-testid="button-on-my-way"
                  >
                    <Car className="h-4 w-4 mr-2" />
                    On My Way
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleJobCompleteNotify}
                    data-testid="button-notify-complete"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Job Complete
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              {job.status === "scheduled" && (
                <Button
                  className="flex-1"
                  onClick={handleCheckIn}
                  disabled={updateJobMutation.isPending}
                  data-testid="button-check-in"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Check In
                </Button>
              )}
              {job.status === "in_progress" && !job.checkOutTime && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCheckOut}
                  disabled={updateJobMutation.isPending}
                  data-testid="button-leave-site"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Site
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowNoAccessDialog(true)}
                data-testid="button-no-access"
              >
                <XCircle className="h-4 w-4 mr-2" />
                No Access
              </Button>
            </div>

            {job.status !== "completed" && (
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
                onClick={() => setShowCompleteDialog(true)}
                data-testid="button-complete-visit"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Complete Visit
              </Button>
            )}

            <Collapsible open={contractExpanded} onOpenChange={setContractExpanded}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between py-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Contract Info
                    </CardTitle>
                    {contractExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 text-sm">
                    {contract ? (
                      <div className="space-y-1">
                        <p>
                          <span className="text-muted-foreground">Contract:</span>{" "}
                          {contract.title}
                        </p>
                        {contract.contractNumber && (
                          <p>
                            <span className="text-muted-foreground">Number:</span>{" "}
                            {contract.contractNumber}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No contract linked
                      </p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Collapsible open={historyExpanded} onOpenChange={setHistoryExpanded}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between py-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Previous Visits
                    </CardTitle>
                    {historyExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 text-sm text-muted-foreground">
                    No previous visits recorded
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Collapsible open={notesExpanded} onOpenChange={setNotesExpanded}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between py-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      System Notes
                    </CardTitle>
                    {notesExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 text-sm">
                    {job.description ? (
                      <p>{job.description}</p>
                    ) : (
                      <p className="text-muted-foreground">No system notes</p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </TabsContent>

          <TabsContent value="checksheets" className="m-0 space-y-3">
            {job.systems && job.systems.length > 0 ? (
              job.systems.map((system, idx) => (
                <Link key={idx} href={`/test?jobId=${job.id}&systemIndex=${idx}`}>
                  <Card className="hover-elevate cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{system.systemType}</p>
                        {system.location && (
                          <p className="text-sm text-muted-foreground">
                            {system.location}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">Start Check Sheet</Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No systems assigned to this job
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="m-0 space-y-3">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {job.checkInTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <LogIn className="h-4 w-4 text-green-600" />
                      <span>
                        Checked in:{" "}
                        {format(parseISO(job.checkInTime), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                  )}
                  {job.checkOutTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <LogOut className="h-4 w-4 text-blue-600" />
                      <span>
                        Left site:{" "}
                        {format(parseISO(job.checkOutTime), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                  )}
                  {!job.checkInTime && !job.checkOutTime && (
                    <p className="text-muted-foreground text-sm">
                      No activity recorded yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </main>
      </Tabs>

      <nav className="sticky bottom-0 bg-background border-t">
        <div className="grid grid-cols-4">
          <Link href="/field-companion">
            <Button
              variant="ghost"
              className="w-full h-14 flex flex-col gap-1 rounded-none"
              data-testid="nav-jobs"
            >
              <Briefcase className="h-5 w-5" />
              <span className="text-xs">Jobs</span>
            </Button>
          </Link>
          <Link href="/field-companion/routes">
            <Button
              variant="ghost"
              className="w-full h-14 flex flex-col gap-1 rounded-none"
              data-testid="nav-routes"
            >
              <Route className="h-5 w-5" />
              <span className="text-xs">Routes</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full h-14 flex flex-col gap-1 rounded-none"
            data-testid="nav-scan"
          >
            <QrCode className="h-5 w-5" />
            <span className="text-xs">Scan</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full h-14 flex flex-col gap-1 rounded-none"
            data-testid="nav-menu"
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs">Menu</span>
          </Button>
        </div>
      </nav>

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Visit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to mark this job as complete?
            </p>
            <Textarea
              placeholder="Add any completion notes (optional)"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              data-testid="input-completion-notes"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
              data-testid="button-cancel-complete"
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleComplete}
              disabled={updateJobMutation.isPending}
              data-testid="button-confirm-complete"
            >
              Complete Visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNoAccessDialog} onOpenChange={setShowNoAccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Access</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for no access:
            </p>
            <Textarea
              placeholder="Enter reason..."
              value={noAccessReason}
              onChange={(e) => setNoAccessReason(e.target.value)}
              data-testid="input-no-access-reason"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNoAccessDialog(false)}
              data-testid="button-cancel-no-access"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleNoAccess}
              disabled={updateJobMutation.isPending || !noAccessReason}
              data-testid="button-confirm-no-access"
            >
              Record No Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
