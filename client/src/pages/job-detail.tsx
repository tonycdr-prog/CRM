import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Clock,
  User,
  FileText,
  Receipt,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Play,
  Plus,
  Car,
  Wrench
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface Job {
  id: string;
  userId: string;
  clientId: string | null;
  contractId: string | null;
  jobNumber: string;
  title: string;
  description: string | null;
  siteAddress: string | null;
  siteCity?: string | null;
  sitePostcode?: string | null;
  scheduledDate: string | null;
  scheduledTime?: string | null;
  estimatedDuration?: number | null;
  actualDuration?: number | null;
  status: string;
  priority: string;
  jobType: string;
  quotedAmount: number | null;
  actualCost: number | null;
  materialsCost?: number | null;
  labourCost?: number | null;
  assignedTo?: string | null;
  notes: string | null;
  completionNotes?: string | null;
  createdAt: string;
}

interface Client {
  id: string;
  companyName: string;
  contactName: string | null;
  phone: string | null;
}

interface Contract {
  id: string;
  title: string;
  contractNumber: string;
  slaResponseTime: number | null;
}

interface Invoice {
  id: string;
  jobId: string | null;
  invoiceNumber: string;
  title: string;
  total: number | null;
  status: string;
}

interface Expense {
  id: string;
  jobId: string | null;
  description: string;
  amount: number;
  date: string;
  category: string;
}

interface Timesheet {
  id: string;
  jobId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: number | null;
  description: string | null;
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: job, isLoading: jobLoading } = useQuery<Job>({
    queryKey: [`/api/jobs/detail/${id}`],
    enabled: !!id && !!user?.id,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", user?.id],
    enabled: !!user?.id,
  });

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts", user?.id],
    enabled: !!user?.id,
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", user?.id],
    enabled: !!user?.id,
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", user?.id],
    enabled: !!user?.id,
  });

  const { data: timesheets = [] } = useQuery<Timesheet[]>({
    queryKey: ["/api/timesheets", user?.id],
    enabled: !!user?.id,
  });

  const updateJobMutation = useMutation({
    mutationFn: async (data: Partial<Job>) => {
      return apiRequest("PATCH", `/api/jobs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "Job updated" });
    },
  });

  const client = job?.clientId ? clients.find(c => c.id === job.clientId) : null;
  const contract = job?.contractId ? contracts.find(c => c.id === job.contractId) : null;
  const jobInvoices = invoices.filter(i => i.jobId === id);
  const jobExpenses = expenses.filter(e => e.jobId === id);
  const jobTimesheets = timesheets.filter(t => t.jobId === id);

  const totalExpenses = jobExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalHours = jobTimesheets.reduce((sum, t) => sum + (t.totalHours || 0), 0);
  const totalInvoiced = jobInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const labourCost = job?.labourCost || (totalHours * 25);
  const materialsCost = job?.materialsCost || jobExpenses.filter(e => e.category === "materials").reduce((sum, e) => sum + e.amount, 0);
  const totalCost = totalExpenses + labourCost;
  const profitMargin = totalInvoiced > 0 ? ((totalInvoiced - totalCost) / totalInvoiced * 100) : 0;

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "",
      scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    };
    return <Badge className={colors[status] || ""} variant={colors[status] ? undefined : "outline"}>{status.replace(/_/g, " ")}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      normal: "",
      low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
    };
    return <Badge className={colors[priority] || ""} variant={colors[priority] ? undefined : "outline"}>{priority}</Badge>;
  };

  if (jobLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Job not found</h2>
          <Link href="/jobs">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/jobs">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold" data-testid="text-job-title">{job.title}</h1>
            {getStatusBadge(job.status)}
            {getPriorityBadge(job.priority)}
          </div>
          <p className="text-muted-foreground">{job.jobNumber}</p>
        </div>
        <div className="flex gap-2">
          {job.status === "pending" && (
            <Button onClick={() => updateJobMutation.mutate({ status: "scheduled" })}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          )}
          {job.status === "scheduled" && (
            <Button onClick={() => updateJobMutation.mutate({ status: "in_progress" })}>
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          )}
          {job.status === "in_progress" && (
            <Button onClick={() => updateJobMutation.mutate({ status: "completed" })}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Quoted</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{(job.quotedAmount || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Invoiced</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{totalInvoiced.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">£{totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
            {job.estimatedDuration && (
              <Progress value={(totalHours / job.estimatedDuration) * 100} className="mt-2" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
              {profitMargin.toFixed(0)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client && (
              <div>
                <div className="text-sm text-muted-foreground">Client</div>
                <Link href={`/clients/${client.id}`}>
                  <div className="font-medium flex items-center gap-2 hover:underline cursor-pointer">
                    <Building2 className="h-4 w-4" />
                    {client.companyName}
                  </div>
                </Link>
                {client.contactName && (
                  <div className="text-sm text-muted-foreground">{client.contactName}</div>
                )}
              </div>
            )}
            {contract && (
              <div>
                <div className="text-sm text-muted-foreground">Contract</div>
                <div className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {contract.title}
                </div>
                {contract.slaResponseTime && (
                  <div className="text-sm text-muted-foreground">SLA: {contract.slaResponseTime}h response</div>
                )}
              </div>
            )}
            {job.siteAddress && (
              <div>
                <div className="text-sm text-muted-foreground">Site Address</div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <div>{job.siteAddress}</div>
                </div>
              </div>
            )}
            {job.scheduledDate && (
              <div>
                <div className="text-sm text-muted-foreground">Scheduled</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(parseISO(job.scheduledDate), "EEEE, MMMM d, yyyy")}
                </div>
              </div>
            )}
            {job.assignedTo && (
              <div>
                <div className="text-sm text-muted-foreground">Assigned To</div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {job.assignedTo}
                </div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground">Job Type</div>
              <Badge variant="outline">{job.jobType}</Badge>
            </div>
            {job.description && (
              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground mb-1">Description</div>
                <p className="text-sm">{job.description}</p>
              </div>
            )}
            {job.notes && (
              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground mb-1">Notes</div>
                <p className="text-sm">{job.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <Tabs defaultValue="expenses">
            <CardHeader className="pb-0">
              <TabsList>
                <TabsTrigger value="expenses">Expenses ({jobExpenses.length})</TabsTrigger>
                <TabsTrigger value="timesheets">Time ({jobTimesheets.length})</TabsTrigger>
                <TabsTrigger value="invoices">Invoices ({jobInvoices.length})</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-4">
              <TabsContent value="expenses" className="mt-0">
                {jobExpenses.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No expenses recorded</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobExpenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell>{format(parseISO(expense.date), "MMM d")}</TableCell>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{expense.category}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              £{expense.amount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex justify-between items-center pt-4 border-t mt-4">
                      <span className="font-medium">Total</span>
                      <span className="font-bold">£{totalExpenses.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="timesheets" className="mt-0">
                {jobTimesheets.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No time entries</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Hours</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobTimesheets.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{format(parseISO(entry.date), "MMM d")}</TableCell>
                            <TableCell>{entry.startTime} - {entry.endTime}</TableCell>
                            <TableCell>{entry.description || "-"}</TableCell>
                            <TableCell className="text-right font-medium">
                              {entry.totalHours?.toFixed(1)}h
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex justify-between items-center pt-4 border-t mt-4">
                      <span className="font-medium">Total Hours</span>
                      <span className="font-bold">{totalHours.toFixed(1)}h</span>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="invoices" className="mt-0">
                {jobInvoices.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No invoices created</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Invoice
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <div className="font-medium">{invoice.title}</div>
                            <div className="text-xs text-muted-foreground">{invoice.invoiceNumber}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={invoice.status === "paid" ? "default" : "outline"}>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            £{(invoice.total || 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
