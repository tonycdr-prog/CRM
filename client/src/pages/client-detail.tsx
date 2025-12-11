import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { 
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Briefcase,
  Receipt,
  DollarSign,
  TrendingUp,
  Calendar,
  Plus,
  Clock
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface Client {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  clientType: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface Contract {
  id: string;
  clientId: string | null;
  contractNumber: string;
  title: string;
  value: number | null;
  startDate: string;
  endDate: string | null;
  renewalDate: string | null;
  status: string;
  slaResponseTime: number | null;
}

interface Job {
  id: string;
  clientId: string | null;
  contractId: string | null;
  jobNumber: string;
  title: string;
  scheduledDate: string | null;
  status: string;
  priority: string;
  quotedAmount: number | null;
  actualCost: number | null;
}

interface Invoice {
  id: string;
  clientId: string | null;
  invoiceNumber: string;
  title: string;
  total: number | null;
  dueDate: string | null;
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

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: [`/api/clients/detail/${id}`],
    enabled: !!id && !!user?.id,
  });

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts", user?.id],
    enabled: !!user?.id,
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs", user?.id],
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

  const clientContracts = contracts.filter(c => c.clientId === id);
  const clientJobs = jobs.filter(j => j.clientId === id);
  const clientInvoices = invoices.filter(i => i.clientId === id);
  
  const clientJobIds = clientJobs.map(j => j.id);
  const clientExpenses = expenses.filter(e => e.jobId && clientJobIds.includes(e.jobId));

  const totalContractValue = clientContracts.reduce((sum, c) => sum + (c.value || 0), 0);
  const totalInvoiced = clientInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const totalPaid = clientInvoices.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.total || 0), 0);
  const totalOutstanding = clientInvoices.filter(i => i.status === "sent").reduce((sum, i) => sum + (i.total || 0), 0);
  const totalExpenses = clientExpenses.reduce((sum, e) => sum + e.amount, 0);
  const profitEstimate = totalPaid - totalExpenses;

  const getStatusBadge = (status: string, type: "contract" | "job" | "invoice") => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      expired: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
      draft: "",
    };
    return <Badge className={colors[status] || ""} variant={colors[status] ? undefined : "outline"}>{status.replace(/_/g, " ")}</Badge>;
  };

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Client not found</h2>
          <Link href="/clients">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold" data-testid="text-client-name">{client.companyName}</h1>
            <Badge variant={client.status === "active" ? "default" : "secondary"}>
              {client.status}
            </Badge>
            <Badge variant="outline">{client.clientType}</Badge>
          </div>
          {client.contactName && (
            <p className="text-muted-foreground">{client.contactName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Contract Value</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{totalContractValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{clientContracts.length} contract{clientContracts.length !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{totalInvoiced.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{clientInvoices.length} invoice{clientInvoices.length !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">£{totalPaid.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">£{totalOutstanding.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Est. Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitEstimate >= 0 ? "text-green-600" : "text-red-600"}`}>
              £{profitEstimate.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${client.email}`} className="text-primary hover:underline">{client.email}</a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${client.phone}`} className="text-primary hover:underline">{client.phone}</a>
              </div>
            )}
            {(client.address || client.city || client.postcode) && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  {client.address && <div>{client.address}</div>}
                  {(client.city || client.postcode) && (
                    <div>{[client.city, client.postcode].filter(Boolean).join(", ")}</div>
                  )}
                </div>
              </div>
            )}
            {client.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <Tabs defaultValue="jobs">
            <CardHeader className="pb-0">
              <TabsList>
                <TabsTrigger value="jobs">Jobs ({clientJobs.length})</TabsTrigger>
                <TabsTrigger value="contracts">Contracts ({clientContracts.length})</TabsTrigger>
                <TabsTrigger value="invoices">Invoices ({clientInvoices.length})</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-4">
              <TabsContent value="jobs" className="mt-0">
                {clientJobs.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No jobs yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientJobs.slice(0, 5).map((job) => (
                        <TableRow key={job.id}>
                          <TableCell>
                            <Link href={`/jobs/${job.id}`}>
                              <span className="font-medium hover:underline cursor-pointer">{job.title}</span>
                            </Link>
                            <div className="text-xs text-muted-foreground">{job.jobNumber}</div>
                          </TableCell>
                          <TableCell>
                            {job.scheduledDate && format(parseISO(job.scheduledDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>{getStatusBadge(job.status, "job")}</TableCell>
                          <TableCell className="text-right">
                            {job.quotedAmount && `£${job.quotedAmount.toLocaleString()}`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="contracts" className="mt-0">
                {clientContracts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No contracts yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contract</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientContracts.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell>
                            <div className="font-medium">{contract.title}</div>
                            <div className="text-xs text-muted-foreground">{contract.contractNumber}</div>
                          </TableCell>
                          <TableCell>
                            {format(parseISO(contract.startDate), "MMM yyyy")}
                            {contract.endDate && ` - ${format(parseISO(contract.endDate), "MMM yyyy")}`}
                          </TableCell>
                          <TableCell>{getStatusBadge(contract.status, "contract")}</TableCell>
                          <TableCell className="text-right">
                            {contract.value && `£${contract.value.toLocaleString()}`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="invoices" className="mt-0">
                {clientInvoices.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No invoices yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientInvoices.slice(0, 5).map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <div className="font-medium">{invoice.title}</div>
                            <div className="text-xs text-muted-foreground">{invoice.invoiceNumber}</div>
                          </TableCell>
                          <TableCell>
                            {invoice.dueDate && format(parseISO(invoice.dueDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>{getStatusBadge(invoice.status, "invoice")}</TableCell>
                          <TableCell className="text-right font-medium">
                            {invoice.total && `£${invoice.total.toLocaleString()}`}
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
