import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Building2,
  FileText,
  Briefcase,
  Receipt,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  PoundSterling,
  Download,
  Plus
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface PortalClient {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  title: string;
  totalAmount: number | null;
  status: string;
  issueDate: string | null;
  dueDate: string | null;
}

interface Job {
  id: string;
  jobNumber: string;
  title: string;
  status: string;
  scheduledDate: string | null;
  jobType: string;
  siteAddress: string | null;
}

interface Document {
  id: string;
  title: string;
  documentType: string;
  createdAt: string | null;
  status: string;
}

export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    title: "",
    description: "",
    serviceType: "service",
    siteAddress: "",
    preferredDate: ""
  });

  const { data: client, isLoading: clientLoading, error: clientError } = useQuery<PortalClient>({
    queryKey: [`/api/portal/${token}`],
    enabled: !!token
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: [`/api/portal/${token}/invoices`],
    enabled: !!token && !!client
  });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: [`/api/portal/${token}/jobs`],
    enabled: !!token && !!client
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: [`/api/portal/${token}/documents`],
    enabled: !!token && !!client
  });

  const submitRequestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/portal/${token}/service-request`, requestForm);
    },
    onSuccess: () => {
      toast({ title: "Service request submitted successfully" });
      setIsRequestDialogOpen(false);
      setRequestForm({ title: "", description: "", serviceType: "service", siteAddress: "", preferredDate: "" });
    },
    onError: () => {
      toast({ title: "Failed to submit request", variant: "destructive" });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case "sent":
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "overdue":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
      case "completed":
      case "complete":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "scheduled":
        return <Badge variant="secondary"><Calendar className="w-3 h-3 mr-1" />Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocumentTypeBadge = (type: string) => {
    const typeLabels: Record<string, string> = {
      report: "Test Report",
      certificate: "Certificate",
      invoice: "Invoice",
      quote: "Quote",
      rams: "RAMS",
      contract: "Contract"
    };
    return typeLabels[type] || type;
  };

  if (clientLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading portal...</p>
        </div>
      </div>
    );
  }

  if (clientError || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              This portal link is invalid or has expired. Please contact your service provider for a new access link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold" data-testid="text-company-name">{client.companyName}</h1>
                <p className="text-sm text-muted-foreground">Client Portal</p>
              </div>
            </div>
            <Button onClick={() => setIsRequestDialogOpen(true)} data-testid="button-new-request">
              <Plus className="w-4 h-4 mr-2" />
              Request Service
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.contactName && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span>{client.contactName}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span>{client.address}{client.city && `, ${client.city}`}{client.postcode && ` ${client.postcode}`}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-outstanding-count">
                {invoices.filter(i => i.status !== "paid").length}
              </div>
              <p className="text-sm text-muted-foreground">
                {invoices.filter(i => i.status !== "paid").length === 0 ? "All paid" : "Awaiting payment"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-scheduled-count">
                {jobs.filter(j => j.status === "scheduled").length}
              </div>
              <p className="text-sm text-muted-foreground">Upcoming visits</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="invoices">
          <TabsList>
            <TabsTrigger value="invoices" data-testid="tab-invoices">
              <Receipt className="w-4 h-4 mr-2" />
              Invoices ({invoices.length})
            </TabsTrigger>
            <TabsTrigger value="jobs" data-testid="tab-jobs">
              <Briefcase className="w-4 h-4 mr-2" />
              Service History ({jobs.length})
            </TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents">
              <FileText className="w-4 h-4 mr-2" />
              Documents ({documents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="mt-4 space-y-4">
            {invoicesLoading ? (
              <div className="text-center py-8">Loading invoices...</div>
            ) : invoices.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Receipt className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground" data-testid="text-no-invoices">No invoices found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {invoices.map(invoice => (
                  <Card key={invoice.id} data-testid={`card-invoice-${invoice.id}`}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <Receipt className="w-8 h-8 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{invoice.invoiceNumber}</div>
                            <div className="text-sm text-muted-foreground">{invoice.title}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="text-right">
                            <div className="font-bold flex items-center gap-1">
                              <PoundSterling className="w-4 h-4" />
                              {invoice.totalAmount?.toFixed(2) || "0.00"}
                            </div>
                            {invoice.dueDate && (
                              <div className="text-xs text-muted-foreground">
                                Due: {format(parseISO(invoice.dueDate), "dd MMM yyyy")}
                              </div>
                            )}
                          </div>
                          {getStatusBadge(invoice.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="jobs" className="mt-4 space-y-4">
            {jobsLoading ? (
              <div className="text-center py-8">Loading service history...</div>
            ) : jobs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground" data-testid="text-no-jobs">No service history</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.map(job => (
                  <Card key={job.id} data-testid={`card-job-${job.id}`}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <Briefcase className="w-8 h-8 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{job.title}</div>
                            <div className="text-sm text-muted-foreground">{job.jobNumber}</div>
                            {job.siteAddress && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {job.siteAddress}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          {job.scheduledDate && (
                            <div className="text-sm flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {format(parseISO(job.scheduledDate), "dd MMM yyyy")}
                            </div>
                          )}
                          {getStatusBadge(job.status)}
                          <Badge variant="outline">{job.jobType}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="mt-4 space-y-4">
            {documentsLoading ? (
              <div className="text-center py-8">Loading documents...</div>
            ) : documents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground" data-testid="text-no-documents">No documents available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {documents.map(doc => (
                  <Card key={doc.id} data-testid={`card-document-${doc.id}`}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{doc.title}</div>
                            <div className="text-sm text-muted-foreground">{getDocumentTypeBadge(doc.documentType)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {doc.createdAt && (
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(doc.createdAt), "dd MMM yyyy")}
                            </span>
                          )}
                          <Button variant="outline" size="sm" data-testid={`button-download-${doc.id}`}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Service</DialogTitle>
            <DialogDescription>
              Submit a service request and we'll get back to you shortly.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); submitRequestMutation.mutate(); }} className="space-y-4">
            <div>
              <Label>Service Type</Label>
              <Select value={requestForm.serviceType} onValueChange={(v) => setRequestForm({ ...requestForm, serviceType: v })}>
                <SelectTrigger data-testid="select-service-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Routine Service</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="quote">Request Quote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title / Brief Description</Label>
              <Input
                value={requestForm.title}
                onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                placeholder="e.g., Annual damper inspection"
                required
                data-testid="input-request-title"
              />
            </div>
            <div>
              <Label>Details</Label>
              <Textarea
                value={requestForm.description}
                onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                placeholder="Provide any additional details about your request..."
                rows={4}
                data-testid="input-request-description"
              />
            </div>
            <div>
              <Label>Site Address (if different from main address)</Label>
              <Input
                value={requestForm.siteAddress}
                onChange={(e) => setRequestForm({ ...requestForm, siteAddress: e.target.value })}
                placeholder="Leave blank to use main address"
                data-testid="input-request-address"
              />
            </div>
            <div>
              <Label>Preferred Date (optional)</Label>
              <Input
                type="date"
                value={requestForm.preferredDate}
                onChange={(e) => setRequestForm({ ...requestForm, preferredDate: e.target.value })}
                data-testid="input-preferred-date"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsRequestDialogOpen(false)} data-testid="button-cancel-request">
                Cancel
              </Button>
              <Button type="submit" disabled={submitRequestMutation.isPending} data-testid="button-submit-request">
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
