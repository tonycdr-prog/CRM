import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search,
  FileText,
  Receipt,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  MoreHorizontal,
  Send,
  Copy
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO, differenceInDays } from "date-fns";
import { nanoid } from "nanoid";

interface Quote {
  id: string;
  userId: string;
  clientId: string | null;
  quoteNumber: string;
  title: string;
  description: string | null;
  lineItems: any;
  subtotal: string;
  vatRate: string;
  vatAmount: string;
  total: string;
  validUntil: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface Invoice {
  id: string;
  userId: string;
  clientId: string | null;
  jobId: string | null;
  quoteId: string | null;
  invoiceNumber: string;
  title: string;
  description: string | null;
  lineItems: any;
  subtotal: string;
  vatRate: string;
  vatAmount: string;
  total: string;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  status: string;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
}

interface Client {
  id: string;
  companyName: string;
}

export default function Finance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("invoices");
  const [searchQuery, setSearchQuery] = useState("");
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

  const { data: quotes = [], isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes", user?.id],
    enabled: !!user?.id,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", user?.id],
    enabled: !!user?.id,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", user?.id],
    enabled: !!user?.id,
  });

  const createQuoteMutation = useMutation({
    mutationFn: async (data: Partial<Quote>) => {
      return apiRequest("POST", "/api/quotes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes", user?.id] });
      setIsQuoteDialogOpen(false);
      toast({ title: "Quote created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create quote", variant: "destructive" });
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: Partial<Invoice>) => {
      return apiRequest("POST", "/api/invoices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", user?.id] });
      setIsInvoiceDialogOpen(false);
      toast({ title: "Invoice created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create invoice", variant: "destructive" });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Invoice> }) => {
      return apiRequest("PATCH", `/api/invoices/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", user?.id] });
      toast({ title: "Invoice updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update invoice", variant: "destructive" });
    },
  });

  const handleCreateQuote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const subtotal = parseFloat(formData.get("subtotal") as string) || 0;
    const vatRate = parseFloat(formData.get("vatRate") as string) || 20;
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;
    
    createQuoteMutation.mutate({
      id: nanoid(),
      userId: user?.id,
      clientId: formData.get("clientId") as string || null,
      quoteNumber: formData.get("quoteNumber") as string || `QUO-${Date.now()}`,
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      lineItems: [],
      subtotal: subtotal.toFixed(2),
      vatRate: vatRate.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      total: total.toFixed(2),
      validUntil: formData.get("validUntil") as string || null,
      status: "draft",
      notes: formData.get("notes") as string || null,
    });
  };

  const handleCreateInvoice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const subtotal = parseFloat(formData.get("subtotal") as string) || 0;
    const vatRate = parseFloat(formData.get("vatRate") as string) || 20;
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;
    
    createInvoiceMutation.mutate({
      id: nanoid(),
      userId: user?.id,
      clientId: formData.get("clientId") as string || null,
      invoiceNumber: formData.get("invoiceNumber") as string || `INV-${Date.now()}`,
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      lineItems: [],
      subtotal: subtotal.toFixed(2),
      vatRate: vatRate.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      total: total.toFixed(2),
      issueDate: formData.get("issueDate") as string || new Date().toISOString().split("T")[0],
      dueDate: formData.get("dueDate") as string,
      status: "draft",
      notes: formData.get("notes") as string || null,
    });
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "-";
    const client = clients.find(c => c.id === clientId);
    return client?.companyName || "-";
  };

  const getInvoiceStatusBadge = (status: string, dueDate?: string) => {
    if (status === "paid") {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Paid</Badge>;
    }
    if (status === "sent" && dueDate) {
      const daysOverdue = differenceInDays(new Date(), parseISO(dueDate));
      if (daysOverdue > 0) {
        return <Badge variant="destructive">Overdue ({daysOverdue}d)</Badge>;
      }
    }
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Sent</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getQuoteStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Sent</Badge>;
      case "accepted":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Accepted</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFinancialStats = () => {
    const totalInvoiced = invoices
      .filter(i => i.status !== "cancelled")
      .reduce((sum, i) => sum + parseFloat(i.total), 0);
    const totalPaid = invoices
      .filter(i => i.status === "paid")
      .reduce((sum, i) => sum + parseFloat(i.total), 0);
    const totalOutstanding = invoices
      .filter(i => i.status === "sent")
      .reduce((sum, i) => sum + parseFloat(i.total), 0);
    const overdueInvoices = invoices.filter(i => {
      if (i.status !== "sent" || !i.dueDate) return false;
      return differenceInDays(new Date(), parseISO(i.dueDate)) > 0;
    });
    const totalOverdue = overdueInvoices.reduce((sum, i) => sum + parseFloat(i.total), 0);
    
    return { totalInvoiced, totalPaid, totalOutstanding, totalOverdue, overdueCount: overdueInvoices.length };
  };

  const stats = getFinancialStats();
  const isLoading = quotesLoading || invoicesLoading;

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
          <h1 className="text-2xl font-bold" data-testid="text-finance-title">Quotes & Invoices</h1>
          <p className="text-muted-foreground">Manage your financial documents</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-new-quote">
                <FileText className="h-4 w-4 mr-2" />
                New Quote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Create Quote</DialogTitle>
                <DialogDescription>Create a new quote for a client</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateQuote}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input id="title" name="title" required data-testid="input-quote-title" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientId">Client</Label>
                      <Select name="clientId">
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subtotal">Subtotal (GBP)</Label>
                      <Input id="subtotal" name="subtotal" type="number" step="0.01" data-testid="input-subtotal" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vatRate">VAT %</Label>
                      <Input id="vatRate" name="vatRate" type="number" step="0.01" defaultValue="20" data-testid="input-vat-rate" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="validUntil">Valid Until</Label>
                      <Input id="validUntil" name="validUntil" type="date" data-testid="input-valid-until" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" rows={3} data-testid="input-description" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsQuoteDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createQuoteMutation.isPending}>Create Quote</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-invoice">
                <Receipt className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Create Invoice</DialogTitle>
                <DialogDescription>Create a new invoice for a client</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateInvoice}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input id="title" name="title" required data-testid="input-invoice-title" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientId">Client</Label>
                      <Select name="clientId">
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="issueDate">Issue Date</Label>
                      <Input id="issueDate" name="issueDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} data-testid="input-issue-date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date *</Label>
                      <Input id="dueDate" name="dueDate" type="date" required data-testid="input-due-date" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subtotal">Subtotal (GBP)</Label>
                      <Input id="subtotal" name="subtotal" type="number" step="0.01" data-testid="input-invoice-subtotal" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vatRate">VAT %</Label>
                      <Input id="vatRate" name="vatRate" type="number" step="0.01" defaultValue="20" data-testid="input-invoice-vat" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" rows={3} data-testid="input-invoice-description" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createInvoiceMutation.isPending}>Create Invoice</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{stats.totalInvoiced.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">£{stats.totalPaid.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">£{stats.totalOutstanding.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className={stats.totalOverdue > 0 ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">£{stats.totalOverdue.toLocaleString()}</div>
            {stats.overdueCount > 0 && (
              <p className="text-xs text-muted-foreground">{stats.overdueCount} invoice{stats.overdueCount !== 1 ? "s" : ""}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="invoices" data-testid="tab-invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="quotes" data-testid="tab-quotes">Quotes ({quotes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Issue Date</TableHead>
                  <TableHead className="hidden md:table-cell">Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No invoices yet. Create your first invoice to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="font-medium">{invoice.title}</div>
                        <div className="text-sm text-muted-foreground">{invoice.invoiceNumber}</div>
                      </TableCell>
                      <TableCell>{getClientName(invoice.clientId)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(parseISO(invoice.issueDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(parseISO(invoice.dueDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        £{parseFloat(invoice.total).toLocaleString()}
                      </TableCell>
                      <TableCell>{getInvoiceStatusBadge(invoice.status, invoice.dueDate)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateInvoiceMutation.mutate({ id: invoice.id, data: { status: "sent" } })}>
                              <Send className="h-4 w-4 mr-2" />
                              Mark as Sent
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateInvoiceMutation.mutate({ id: invoice.id, data: { status: "paid", paidDate: new Date().toISOString() } })}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as Paid
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="quotes" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Valid Until</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No quotes yet. Create your first quote to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  quotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <div className="font-medium">{quote.title}</div>
                        <div className="text-sm text-muted-foreground">{quote.quoteNumber}</div>
                      </TableCell>
                      <TableCell>{getClientName(quote.clientId)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {quote.validUntil && format(parseISO(quote.validUntil), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        £{parseFloat(quote.total).toLocaleString()}
                      </TableCell>
                      <TableCell>{getQuoteStatusBadge(quote.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Send className="h-4 w-4 mr-2" />
                              Send to Client
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Receipt className="h-4 w-4 mr-2" />
                              Convert to Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
