import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Calendar,
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  Briefcase,
  Calculator
} from "lucide-react";
import { Link, useSearch } from "wouter";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, differenceInDays, parseISO, subDays } from "date-fns";
import { nanoid } from "nanoid";

// Constants for auto-calculation
const RENEWAL_LEAD_DAYS = 60; // Renewal date is 60 days before end date

interface Contract {
  id: string;
  userId: string;
  clientId: string | null;
  contractNumber: string;
  title: string;
  description: string | null;
  contractType: string;
  value: string;
  startDate: string;
  endDate: string | null;
  renewalDate: string | null;
  autoRenew: boolean;
  slaResponseTime: number | null;
  slaResolutionTime: number | null;
  terms: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  id: string;
  companyName: string;
}

export default function Contracts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearch();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Controlled form state for contract creation
  const [formTitle, setFormTitle] = useState("");
  const [formContractNumber, setFormContractNumber] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formContractType, setFormContractType] = useState("annual_maintenance");
  const [formValue, setFormValue] = useState("");
  const [formAutoRenew, setFormAutoRenew] = useState("false");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formRenewalDate, setFormRenewalDate] = useState("");
  const [formSlaResponseTime, setFormSlaResponseTime] = useState("");
  const [formSlaResolutionTime, setFormSlaResolutionTime] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTerms, setFormTerms] = useState("");
  const [renewalAutoCalculated, setRenewalAutoCalculated] = useState(false);

  // Auto-calculate renewal date when end date changes
  useEffect(() => {
    if (formEndDate) {
      try {
        const endDateObj = parseISO(formEndDate);
        const renewalDateObj = subDays(endDateObj, RENEWAL_LEAD_DAYS);
        const calculatedRenewalDate = format(renewalDateObj, "yyyy-MM-dd");
        setFormRenewalDate(calculatedRenewalDate);
        setRenewalAutoCalculated(true);
      } catch {
        // Invalid date format, don't auto-calculate
      }
    } else {
      if (renewalAutoCalculated) {
        setFormRenewalDate("");
        setRenewalAutoCalculated(false);
      }
    }
  }, [formEndDate]);

  // Handle URL parameters for creating a contract from client page
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.get("createContract") === "true") {
      const clientId = params.get("clientId");
      if (clientId) setFormClientId(clientId);
      setIsCreateDialogOpen(true);
      // Clean up URL
      window.history.replaceState({}, "", "/contracts");
    }
  }, [searchParams]);

  // Reset form state
  const resetFormState = () => {
    setFormTitle("");
    setFormContractNumber("");
    setFormClientId("");
    setFormContractType("annual_maintenance");
    setFormValue("");
    setFormAutoRenew("false");
    setFormStartDate("");
    setFormEndDate("");
    setFormRenewalDate("");
    setFormSlaResponseTime("");
    setFormSlaResolutionTime("");
    setFormDescription("");
    setFormTerms("");
    setRenewalAutoCalculated(false);
  };

  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts", user?.id],
    enabled: !!user?.id,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", user?.id],
    enabled: !!user?.id,
  });

  const createContractMutation = useMutation({
    mutationFn: async (data: Partial<Contract>) => {
      return apiRequest("POST", "/api/contracts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", user?.id] });
      setIsCreateDialogOpen(false);
      resetFormState();
      toast({ title: "Contract created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create contract", variant: "destructive" });
    },
  });

  const deleteContractMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/contracts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", user?.id] });
      toast({ title: "Contract deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete contract", variant: "destructive" });
    },
  });

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch = 
      contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.contractNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && contract.status === statusFilter;
  });

  const getUpcomingRenewals = () => {
    const now = new Date();
    return contracts.filter(c => {
      if (!c.renewalDate) return false;
      const daysUntil = differenceInDays(parseISO(c.renewalDate), now);
      return daysUntil >= 0 && daysUntil <= 30;
    });
  };

  const handleCreateContract = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createContractMutation.mutate({
      id: nanoid(),
      userId: user?.id,
      clientId: formClientId || null,
      contractNumber: formContractNumber || `CON-${Date.now()}`,
      title: formTitle,
      description: formDescription || null,
      contractType: formContractType,
      value: formValue || "0",
      startDate: formStartDate,
      endDate: formEndDate || null,
      renewalDate: formRenewalDate || null,
      autoRenew: formAutoRenew === "true",
      slaResponseTime: parseInt(formSlaResponseTime) || null,
      slaResolutionTime: parseInt(formSlaResolutionTime) || null,
      terms: formTerms || null,
      status: "active",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Pending</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRenewalBadge = (contract: Contract) => {
    if (!contract.renewalDate && !contract.endDate) return null;
    const checkDate = contract.renewalDate || contract.endDate;
    if (!checkDate) return null;
    const daysUntil = differenceInDays(parseISO(checkDate), new Date());
    if (daysUntil < 0) return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    if (daysUntil <= 7) return <Badge variant="destructive" className="text-xs">Due in {daysUntil}d</Badge>;
    if (daysUntil <= 30) return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 text-xs">Due in {daysUntil}d</Badge>;
    if (daysUntil <= 60) return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100 text-xs">60d warning</Badge>;
    if (daysUntil <= 90) return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100 text-xs">90d warning</Badge>;
    return null;
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "-";
    const client = clients.find(c => c.id === clientId);
    return client?.companyName || "-";
  };

  const upcomingRenewals = getUpcomingRenewals();

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
          <h1 className="text-2xl font-bold" data-testid="text-contracts-title">Contracts</h1>
          <p className="text-muted-foreground">Manage service agreements and SLAs</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetFormState();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-contract">
              <Plus className="h-4 w-4 mr-2" />
              New Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Contract</DialogTitle>
              <DialogDescription>Enter the contract details below</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateContract}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Contract Title *</Label>
                    <Input 
                      id="title" 
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required 
                      data-testid="input-contract-title" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractNumber">Contract Number</Label>
                    <Input 
                      id="contractNumber" 
                      value={formContractNumber}
                      onChange={(e) => setFormContractNumber(e.target.value)}
                      placeholder="Auto-generated" 
                      data-testid="input-contract-number" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client</Label>
                    <Select value={formClientId} onValueChange={setFormClientId}>
                      <SelectTrigger data-testid="select-contract-client">
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
                  <div className="space-y-2">
                    <Label htmlFor="contractType">Contract Type</Label>
                    <Select value={formContractType} onValueChange={setFormContractType}>
                      <SelectTrigger data-testid="select-contract-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual_maintenance">Annual Maintenance</SelectItem>
                        <SelectItem value="service_agreement">Service Agreement</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="reactive">Reactive Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="value">Contract Value (GBP)</Label>
                    <Input 
                      id="value" 
                      value={formValue}
                      onChange={(e) => setFormValue(e.target.value)}
                      type="number" 
                      step="0.01" 
                      data-testid="input-contract-value" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="autoRenew">Auto Renew</Label>
                    <Select value={formAutoRenew} onValueChange={setFormAutoRenew}>
                      <SelectTrigger data-testid="select-auto-renew">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input 
                      id="startDate" 
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      type="date" 
                      required 
                      data-testid="input-start-date" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input 
                      id="endDate" 
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      type="date" 
                      data-testid="input-end-date" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="renewalDate" className="flex items-center gap-1">
                      Renewal Date
                      {renewalAutoCalculated && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calculator className="h-3 w-3" />
                          Auto
                        </span>
                      )}
                    </Label>
                    <Input 
                      id="renewalDate" 
                      value={formRenewalDate}
                      onChange={(e) => {
                        setFormRenewalDate(e.target.value);
                        setRenewalAutoCalculated(false);
                      }}
                      type="date" 
                      data-testid="input-renewal-date" 
                    />
                    {renewalAutoCalculated && (
                      <p className="text-xs text-muted-foreground">
                        Calculated as {RENEWAL_LEAD_DAYS} days before end date
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slaResponseTime">SLA Response (hours)</Label>
                    <Input 
                      id="slaResponseTime" 
                      value={formSlaResponseTime}
                      onChange={(e) => setFormSlaResponseTime(e.target.value)}
                      type="number" 
                      data-testid="input-sla-response" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slaResolutionTime">SLA Resolution (hours)</Label>
                    <Input 
                      id="slaResolutionTime" 
                      value={formSlaResolutionTime}
                      onChange={(e) => setFormSlaResolutionTime(e.target.value)}
                      type="number" 
                      data-testid="input-sla-resolution" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2} 
                    data-testid="input-description" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea 
                    id="terms" 
                    value={formTerms}
                    onChange={(e) => setFormTerms(e.target.value)}
                    rows={3} 
                    data-testid="input-terms" 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetFormState();
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createContractMutation.isPending} data-testid="button-save-contract">
                  {createContractMutation.isPending ? "Saving..." : "Create Contract"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {upcomingRenewals.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950" data-testid="card-renewal-alerts">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle>Upcoming Renewals</CardTitle>
            </div>
            <CardDescription>Contracts due for renewal within 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingRenewals.map((contract) => (
                <div 
                  key={contract.id} 
                  className="flex items-center justify-between p-3 bg-background rounded-lg border"
                >
                  <div>
                    <div className="font-medium">{contract.title}</div>
                    <div className="text-sm text-muted-foreground">{getClientName(contract.clientId)}</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-orange-600">
                      <RefreshCw className="h-4 w-4" />
                      <span className="font-medium">
                        {contract.renewalDate && format(parseISO(contract.renewalDate), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {contract.renewalDate && `${differenceInDays(parseISO(contract.renewalDate), new Date())} days`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contracts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-contracts"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredContracts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No contracts found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery ? "Try adjusting your search" : "Create your first contract to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-first-contract">
                <Plus className="h-4 w-4 mr-2" />
                New Contract
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden lg:table-cell">Value</TableHead>
                <TableHead className="hidden md:table-cell">SLA</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract.id} data-testid={`row-contract-${contract.id}`}>
                  <TableCell>
                    <div className="font-medium">{contract.title}</div>
                    <div className="text-sm text-muted-foreground">{contract.contractNumber}</div>
                  </TableCell>
                  <TableCell>{getClientName(contract.clientId)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{(contract.contractType || "N/A").replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {parseFloat(contract.value) > 0 && (
                      <span className="font-medium">£{parseFloat(contract.value).toLocaleString()}</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {contract.slaResponseTime && (
                      <div className="text-sm">
                        <div>Response: {contract.slaResponseTime}h</div>
                        {contract.slaResolutionTime && (
                          <div className="text-muted-foreground">Resolution: {contract.slaResolutionTime}h</div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 flex-wrap">
                      {getStatusBadge(contract.status)}
                      {getRenewalBadge(contract)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/jobs?createJob=true&contractId=${contract.id}&clientId=${contract.clientId}`}>
                          <DropdownMenuItem data-testid={`button-create-job-${contract.id}`}>
                            <Briefcase className="h-4 w-4 mr-2" />
                            Create Job
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Renewal
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => deleteContractMutation.mutate(contract.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
