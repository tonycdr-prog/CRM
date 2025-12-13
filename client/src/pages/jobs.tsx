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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Briefcase,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  CheckCircle,
  Download
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO } from "date-fns";
import { nanoid } from "nanoid";
import { Link, useSearch } from "wouter";
import { useEffect } from "react";
import { exportToCSV } from "@/lib/exportUtils";

interface Job {
  id: string;
  userId: string;
  clientId: string | null;
  contractId: string | null;
  projectId: string | null;
  jobNumber: string;
  title: string;
  description: string | null;
  jobType: string;
  priority: string;
  status: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  siteAddress: string | null;
  estimatedDuration: number | null;
  actualDuration: number | null;
  quotedAmount: number | null;
  actualCost: number | null;
  materialsCost: number | null;
  labourCost: number | null;
  assignedTechnicianId: string | null;
  assignedSubcontractorId: string | null;
  notes: string | null;
  completionNotes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  id: string;
  companyName: string;
  address: string | null;
  city: string | null;
  postcode: string | null;
}

interface Contract {
  id: string;
  clientId: string | null;
  title: string;
  slaResponseTime: number | null;
}

export default function Jobs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearch();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [siteAddress, setSiteAddress] = useState("");

  // Handle URL parameters for creating a job from contract
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.get("createJob") === "true") {
      const contractId = params.get("contractId");
      const clientId = params.get("clientId");
      if (contractId) setSelectedContractId(contractId);
      if (clientId) setSelectedClientId(clientId);
      setIsCreateDialogOpen(true);
      // Clean up URL
      window.history.replaceState({}, "", "/jobs");
    }
  }, [searchParams]);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      if (client.address) setSiteAddress(client.address);
    }
    setSelectedContractId("");
  };

  const handleContractChange = (contractId: string) => {
    setSelectedContractId(contractId);
    const contract = contracts.find(c => c.id === contractId);
    if (contract?.clientId && contract.clientId !== selectedClientId) {
      handleClientChange(contract.clientId);
    }
  };

  const resetFormState = () => {
    setSelectedClientId("");
    setSelectedContractId("");
    setSiteAddress("");
  };

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs", user?.id],
    enabled: !!user?.id,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", user?.id],
    enabled: !!user?.id,
  });

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts", user?.id],
    enabled: !!user?.id,
  });

  const filteredContracts = selectedClientId 
    ? contracts.filter(c => c.clientId === selectedClientId)
    : contracts;

  const createJobMutation = useMutation({
    mutationFn: async (data: Partial<Job>) => {
      return apiRequest("POST", "/api/jobs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", user?.id] });
      setIsCreateDialogOpen(false);
      resetFormState();
      toast({ title: "Job created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create job", variant: "destructive" });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Job> }) => {
      return apiRequest("PATCH", `/api/jobs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", user?.id] });
      toast({ title: "Job updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update job", variant: "destructive" });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", user?.id] });
      toast({ title: "Job deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete job", variant: "destructive" });
    },
  });

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.siteAddress?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && job.status === statusFilter;
  });

  const handleCreateJob = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createJobMutation.mutate({
      userId: user?.id,
      clientId: formData.get("clientId") as string || null,
      contractId: formData.get("contractId") as string || null,
      jobNumber: formData.get("jobNumber") as string || `JOB-${Date.now()}`,
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      jobType: formData.get("jobType") as string,
      priority: formData.get("priority") as string,
      status: "pending",
      scheduledDate: formData.get("scheduledDate") as string || null,
      siteAddress: formData.get("siteAddress") as string || null,
      estimatedDuration: parseFloat(formData.get("estimatedDuration") as string) || null,
      quotedAmount: parseFloat(formData.get("quotedAmount") as string) || null,
      assignedTechnicianId: formData.get("assignedTechnicianId") as string || null,
      notes: formData.get("notes") as string || null,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Scheduled</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Completed</Badge>;
      case "on_hold":
        return <Badge variant="secondary">On Hold</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">High</Badge>;
      case "normal":
        return <Badge variant="outline">Normal</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "-";
    const client = clients.find(c => c.id === clientId);
    return client?.companyName || "-";
  };

  const getJobStats = () => {
    const pending = jobs.filter(j => j.status === "pending").length;
    const scheduled = jobs.filter(j => j.status === "scheduled").length;
    const inProgress = jobs.filter(j => j.status === "in_progress").length;
    const completed = jobs.filter(j => j.status === "completed").length;
    return { pending, scheduled, inProgress, completed };
  };

  const stats = getJobStats();

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
          <h1 className="text-2xl font-bold" data-testid="text-jobs-title">Jobs</h1>
          <p className="text-muted-foreground">Manage work orders and job scheduling</p>
        </div>
      </div>
      <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => exportToCSV(
              jobs,
              "jobs_export",
              [
                { key: "jobNumber", header: "Job Number" },
                { key: "title", header: "Title" },
                { key: "status", header: "Status" },
                { key: "priority", header: "Priority" },
                { key: "jobType", header: "Type" },
                { key: "scheduledDate", header: "Scheduled Date" },
                { key: "siteAddress", header: "Site Address" },
                { key: "estimatedDuration", header: "Est. Hours" },
                { key: "quotedAmount", header: "Quoted Amount" },
              ]
            )}
            data-testid="button-export-jobs"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { setIsCreateDialogOpen(open); if (!open) resetFormState(); }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-job">
                <Plus className="h-4 w-4 mr-2" />
                New Job
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
              <DialogDescription>Enter the job details below</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateJob}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input id="title" name="title" required data-testid="input-job-title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobNumber">Job Number</Label>
                    <Input id="jobNumber" name="jobNumber" placeholder="Auto-generated" data-testid="input-job-number" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client</Label>
                    <Select name="clientId" value={selectedClientId} onValueChange={handleClientChange}>
                      <SelectTrigger data-testid="select-job-client">
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
                    <Label htmlFor="contractId">Contract {selectedClientId && filteredContracts.length > 0 && `(${filteredContracts.length})`}</Label>
                    <Select name="contractId" value={selectedContractId} onValueChange={handleContractChange}>
                      <SelectTrigger data-testid="select-job-contract">
                        <SelectValue placeholder={selectedClientId && filteredContracts.length === 0 ? "No contracts for this client" : "Select contract"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredContracts.map((contract) => (
                          <SelectItem key={contract.id} value={contract.id}>
                            {contract.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobType">Job Type</Label>
                    <Select name="jobType" defaultValue="inspection">
                      <SelectTrigger data-testid="select-job-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inspection">Annual Inspection</SelectItem>
                        <SelectItem value="commissioning">Commissioning</SelectItem>
                        <SelectItem value="reactive">Reactive Call</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="remedial">Remedial Works</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" defaultValue="normal">
                      <SelectTrigger data-testid="select-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteAddress">Site Address {selectedClientId && "(Auto-filled from client)"}</Label>
                  <Input id="siteAddress" name="siteAddress" value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} data-testid="input-site-address" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate">Scheduled Date</Label>
                    <Input id="scheduledDate" name="scheduledDate" type="date" data-testid="input-scheduled-date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimatedDuration">Est. Hours</Label>
                    <Input id="estimatedDuration" name="estimatedDuration" type="number" step="0.5" data-testid="input-estimated-duration" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quotedAmount">Quoted Amount (£)</Label>
                    <Input id="quotedAmount" name="quotedAmount" type="number" step="0.01" data-testid="input-quoted-amount" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTechnicianId">Assigned Technician</Label>
                  <Input id="assignedTechnicianId" name="assignedTechnicianId" data-testid="input-assigned-technician" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={2} data-testid="input-description" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={2} data-testid="input-notes" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createJobMutation.isPending} data-testid="button-save-job">
                  {createJobMutation.isPending ? "Saving..." : "Create Job"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-testid="card-stat-pending">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-scheduled">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduled}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-in-progress">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-completed">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-jobs"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No jobs found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery ? "Try adjusting your search" : "Create your first job to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-first-job">
                <Plus className="h-4 w-4 mr-2" />
                New Job
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredJobs.map((job) => (
            <Card key={job.id} data-testid={`card-job-${job.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/jobs/${job.id}`}><CardTitle className="text-lg hover:underline cursor-pointer" data-testid={`link-job-${job.id}`}>{job.title}</CardTitle></Link>
                      {getStatusBadge(job.status)}
                      {getPriorityBadge(job.priority)}
                    </div>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span>{job.jobNumber}</span>
                      {job.clientId && (
                        <>
                          <span>•</span>
                          <span>{getClientName(job.clientId)}</span>
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => updateJobMutation.mutate({ id: job.id, data: { status: "in_progress" } })}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Job
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateJobMutation.mutate({ id: job.id, data: { status: "completed", completedAt: new Date().toISOString() } })}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Complete
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => deleteJobMutation.mutate(job.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {job.siteAddress && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{job.siteAddress}</span>
                    </div>
                  )}
                  {job.scheduledDate && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(parseISO(job.scheduledDate), "MMM d, yyyy")}</span>
                    </div>
                  )}
                  {job.estimatedDuration && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{job.estimatedDuration}h estimated</span>
                    </div>
                  )}
                  {job.quotedAmount && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>£{job.quotedAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                {job.description && (
                  <p className="text-sm text-muted-foreground mt-3">{job.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
