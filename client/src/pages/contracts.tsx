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
  RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, differenceInDays, parseISO } from "date-fns";
import { nanoid } from "nanoid";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

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
    const formData = new FormData(e.currentTarget);
    createContractMutation.mutate({
      id: nanoid(),
      userId: user?.id,
      clientId: formData.get("clientId") as string || null,
      contractNumber: formData.get("contractNumber") as string || `CON-${Date.now()}`,
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      contractType: formData.get("contractType") as string,
      value: formData.get("value") as string || "0",
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string || null,
      renewalDate: formData.get("renewalDate") as string || null,
      autoRenew: formData.get("autoRenew") === "true",
      slaResponseTime: parseInt(formData.get("slaResponseTime") as string) || null,
      slaResolutionTime: parseInt(formData.get("slaResolutionTime") as string) || null,
      terms: formData.get("terms") as string || null,
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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                    <Input id="title" name="title" required data-testid="input-contract-title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractNumber">Contract Number</Label>
                    <Input id="contractNumber" name="contractNumber" placeholder="Auto-generated" data-testid="input-contract-number" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client</Label>
                    <Select name="clientId">
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
                    <Select name="contractType" defaultValue="annual_maintenance">
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
                    <Input id="value" name="value" type="number" step="0.01" data-testid="input-contract-value" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="autoRenew">Auto Renew</Label>
                    <Select name="autoRenew" defaultValue="false">
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
                    <Input id="startDate" name="startDate" type="date" required data-testid="input-start-date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" name="endDate" type="date" data-testid="input-end-date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="renewalDate">Renewal Date</Label>
                    <Input id="renewalDate" name="renewalDate" type="date" data-testid="input-renewal-date" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slaResponseTime">SLA Response (hours)</Label>
                    <Input id="slaResponseTime" name="slaResponseTime" type="number" data-testid="input-sla-response" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slaResolutionTime">SLA Resolution (hours)</Label>
                    <Input id="slaResolutionTime" name="slaResolutionTime" type="number" data-testid="input-sla-resolution" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={2} data-testid="input-description" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea id="terms" name="terms" rows={3} data-testid="input-terms" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
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
                    <Badge variant="outline">{contract.contractType.replace(/_/g, " ")}</Badge>
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
                  <TableCell>{getStatusBadge(contract.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
