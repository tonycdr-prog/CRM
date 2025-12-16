import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Navigation,
  Mail,
  Building2,
  FileText,
  AlertTriangle,
  Wrench,
  User,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DbJob } from "@shared/schema";

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

export default function FieldJobDetail() {
  const [, params] = useRoute("/field-companion/:id");
  const [, setLocation] = useLocation();
  const jobId = params?.id;
  const { toast } = useToast();
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showNoAccessDialog, setShowNoAccessDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [noAccessReason, setNoAccessReason] = useState("");

  const { data: job, isLoading: jobLoading } = useQuery<DbJob>({
    queryKey: ["/api/jobs/detail", jobId],
    enabled: !!jobId,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const client = clients.find((c) => c.id === job?.clientId);
  const contract = contracts.find((c) => c.id === job?.contractId);

  const updateJobMutation = useMutation({
    mutationFn: async (updates: Partial<DbJob>) => {
      return apiRequest("PATCH", `/api/jobs/${jobId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/detail", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
  });

  const handleStartJob = () => {
    updateJobMutation.mutate(
      { status: "in_progress" },
      {
        onSuccess: () => {
          toast({ title: "Job started", description: "You're now on site" });
        },
      }
    );
  };

  const handleComplete = () => {
    updateJobMutation.mutate(
      {
        status: "completed",
        completionNotes: completionNotes || undefined,
        completedAt: new Date(),
      },
      {
        onSuccess: () => {
          setShowCompleteDialog(false);
          toast({ title: "Job completed!" });
          setLocation("/field-companion");
        },
      }
    );
  };

  const handleNoAccess = () => {
    updateJobMutation.mutate(
      {
        status: "cancelled",
        notes: noAccessReason
          ? `${job?.notes || ""}\n\n[No Access] ${noAccessReason}`
          : job?.notes,
      },
      {
        onSuccess: () => {
          setShowNoAccessDialog(false);
          toast({ title: "No access recorded" });
          setLocation("/field-companion");
        },
      }
    );
  };

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      scheduled: { variant: "outline", label: "Scheduled" },
      in_progress: { variant: "default", label: "In Progress" },
      completed: { variant: "secondary", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    const config = variants[status || "pending"] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string | null) => {
    if (priority === "urgent") {
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Urgent</Badge>;
    }
    if (priority === "high") {
      return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">High</Badge>;
    }
    return null;
  };

  if (jobLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Job not found</p>
        <Link href="/field-companion">
          <Button variant="outline">Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b p-4">
        <div className="flex items-start gap-3">
          <Link href="/field-companion">
            <Button variant="ghost" size="icon" className="shrink-0" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-lg" data-testid="text-job-number">
                {job.jobNumber}
              </h1>
              {getStatusBadge(job.status)}
              {getPriorityBadge(job.priority)}
            </div>
            <p className="text-muted-foreground mt-1" data-testid="text-job-title">
              {job.title}
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Quick Actions - Most prominent */}
          <Card className="border-2 border-primary/50">
            <CardContent className="p-4 space-y-3">
              {job.status === "scheduled" || job.status === "pending" ? (
                <Button
                  className="w-full h-14 text-lg"
                  onClick={handleStartJob}
                  disabled={updateJobMutation.isPending}
                  data-testid="button-start-job"
                >
                  <PlayCircle className="h-6 w-6 mr-2" />
                  Start Job
                </Button>
              ) : job.status === "in_progress" ? (
                <Button
                  className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
                  onClick={() => setShowCompleteDialog(true)}
                  disabled={updateJobMutation.isPending}
                  data-testid="button-complete-job"
                >
                  <CheckCircle2 className="h-6 w-6 mr-2" />
                  Complete Job
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-2 py-4 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="font-medium">Job Completed</span>
                </div>
              )}

              {job.status !== "completed" && job.status !== "cancelled" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowNoAccessDialog(true)}
                  data-testid="button-no-access"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Report No Access
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Site Information */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Site Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {job.siteAddress && (
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{job.siteAddress}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      window.open(
                        `https://maps.google.com/?q=${encodeURIComponent(job.siteAddress || "")}`,
                        "_blank"
                      )
                    }
                    data-testid="button-navigate"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Open in Maps
                  </Button>
                </div>
              )}

              {job.scheduledDate && (
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(parseISO(job.scheduledDate), "EEE, d MMM yyyy")}
                      {job.scheduledTime && ` at ${job.scheduledTime}`}
                    </p>
                  </div>
                  {job.estimatedDuration && (
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {job.estimatedDuration}h
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Information */}
          {client && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-medium">{client.companyName}</p>
                
                {client.contactName && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{client.contactName}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  {client.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `tel:${client.phone}`}
                      data-testid="button-call-client"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  )}
                  {client.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `mailto:${client.email}`}
                      data-testid="button-email-client"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Systems to service */}
          {job.systems && job.systems.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Systems ({job.systems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {job.systems.map((system, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div>
                        <p className="font-medium text-sm">{system.systemType}</p>
                        {system.location && (
                          <p className="text-xs text-muted-foreground">{system.location}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {(job.notes || job.description) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {job.description && <p className="text-sm mb-2">{job.description}</p>}
                {job.notes && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-sm">{job.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contract info */}
          {contract && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Contract</p>
                <p className="font-medium">{contract.title}</p>
                {contract.contractNumber && (
                  <p className="text-sm text-muted-foreground">#{contract.contractNumber}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Complete Job Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Job</DialogTitle>
            <DialogDescription>
              Add any completion notes before marking this job as complete.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Add completion notes (optional)..."
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={updateJobMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              Complete Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* No Access Dialog */}
      <Dialog open={showNoAccessDialog} onOpenChange={setShowNoAccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report No Access</DialogTitle>
            <DialogDescription>
              Please provide a reason why you couldn't access the site.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describe why access was not possible..."
            value={noAccessReason}
            onChange={(e) => setNoAccessReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNoAccessDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleNoAccess}
              disabled={updateJobMutation.isPending}
            >
              Submit No Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
