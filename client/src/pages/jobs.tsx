import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PostcodeLookup } from "@/components/PostcodeLookup";
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
  Download,
  Users
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nanoid } from "nanoid";
import { Link, useSearch } from "wouter";
import { useEffect } from "react";
import { exportToCSV } from "@/lib/exportUtils";
import { SERVICE_VISIT_TYPES, SMOKE_CONTROL_SYSTEM_TYPES, SYSTEM_CONDITION_OPTIONS, SERVICE_STATEMENTS, SYSTEM_CHECKLIST_TEMPLATES, type SystemChecklistItem } from "@shared/schema";
import { Settings, AlertTriangle, FileText, ClipboardCheck } from "lucide-react";

interface FaultHistoryEntry {
  date: string;
  fault: string;
  resolved: boolean;
  resolution?: string;
}

interface SystemEntry {
  systemType: string;
  location: string;
  notes?: string;
  checklist: SystemChecklistItem[];
}

interface Engineer {
  name: string;
  competency: string;
}

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
  worksheetType: string;
  engineerCount: number;
  engineerNames: Engineer[];
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
  systemAge: string | null;
  systemInstallDate: string | null;
  systemCondition: string;
  faultHistory: FaultHistoryEntry[];
  recommendations: string | null;
  backOfficeNotes: string | null;
  serviceStatement: string | null;
  systems: SystemEntry[];
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
  const [worksheetType, setWorksheetType] = useState("routine_service");
  const [engineerCount, setEngineerCount] = useState(1);
  const [engineers, setEngineers] = useState<Engineer[]>([{ name: "", competency: "competent" }]);
  
  // Multiple systems per visit
  const [systems, setSystems] = useState<SystemEntry[]>([]);

  // Complete Visit dialog state
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [selectedJobForCompletion, setSelectedJobForCompletion] = useState<Job | null>(null);
  
  // Complete Visit form fields
  const [completeSystemAge, setCompleteSystemAge] = useState("");
  const [completeSystemInstallDate, setCompleteSystemInstallDate] = useState("");
  const [completeSystemCondition, setCompleteSystemCondition] = useState("operational");
  const [completeFaultHistory, setCompleteFaultHistory] = useState<FaultHistoryEntry[]>([]);
  const [completeRecommendations, setCompleteRecommendations] = useState("");
  const [completeBackOfficeNotes, setCompleteBackOfficeNotes] = useState("");
  const [completeServiceStatement, setCompleteServiceStatement] = useState(SERVICE_STATEMENTS.operational);
  const [completeCompletionNotes, setCompleteCompletionNotes] = useState("");
  const [completeActualDuration, setCompleteActualDuration] = useState("");
  const [completeSystems, setCompleteSystems] = useState<SystemEntry[]>([]);
  const [expandedSystems, setExpandedSystems] = useState<Record<number, boolean>>({});

  // Systems management
  const addSystem = () => {
    setSystems([...systems, { systemType: "", location: "", notes: "", checklist: [] }]);
  };

  const updateSystem = (index: number, field: keyof SystemEntry, value: string) => {
    const updated = [...systems];
    if (field === "systemType" && value !== updated[index].systemType) {
      const template = SYSTEM_CHECKLIST_TEMPLATES[value] || [];
      const checklist: SystemChecklistItem[] = template.map(item => ({
        ...item,
        id: nanoid(),
        checked: false,
        notes: "",
      }));
      updated[index] = { ...updated[index], [field]: value, checklist };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setSystems(updated);
  };

  const removeSystem = (index: number) => {
    setSystems(systems.filter((_, i) => i !== index));
  };

  // Complete Visit helpers
  const handleConditionChange = (condition: string) => {
    setCompleteSystemCondition(condition);
    if (condition === "operational") {
      setCompleteServiceStatement(SERVICE_STATEMENTS.operational);
    } else {
      setCompleteServiceStatement(SERVICE_STATEMENTS.non_operational);
    }
  };

  const addFaultEntry = () => {
    setCompleteFaultHistory([...completeFaultHistory, { date: new Date().toISOString().split('T')[0], fault: "", resolved: false }]);
  };

  const updateFaultEntry = (index: number, field: keyof FaultHistoryEntry, value: string | boolean) => {
    const updated = [...completeFaultHistory];
    updated[index] = { ...updated[index], [field]: value };
    setCompleteFaultHistory(updated);
  };

  const removeFaultEntry = (index: number) => {
    setCompleteFaultHistory(completeFaultHistory.filter((_, i) => i !== index));
  };

  const openCompleteDialog = (job: Job) => {
    setSelectedJobForCompletion(job);
    setCompleteSystemAge(job.systemAge || "");
    setCompleteSystemInstallDate(job.systemInstallDate || "");
    setCompleteSystemCondition(job.systemCondition || "operational");
    setCompleteFaultHistory(job.faultHistory || []);
    setCompleteRecommendations(job.recommendations || "");
    setCompleteBackOfficeNotes(job.backOfficeNotes || "");
    setCompleteServiceStatement(job.serviceStatement || SERVICE_STATEMENTS.operational);
    setCompleteCompletionNotes(job.completionNotes || "");
    setCompleteActualDuration(job.actualDuration?.toString() || "");
    // Initialize systems with checklists
    const systemsWithChecklists = (job.systems || []).map(sys => {
      // If system already has checklist, use it; otherwise generate from template
      if (sys.checklist && sys.checklist.length > 0) {
        return sys;
      }
      const template = SYSTEM_CHECKLIST_TEMPLATES[sys.systemType] || [];
      return {
        ...sys,
        checklist: template.map(item => ({
          ...item,
          id: nanoid(),
          checked: false,
          notes: "",
        })),
      };
    });
    setCompleteSystems(systemsWithChecklists);
    setExpandedSystems({});
    setIsCompleteDialogOpen(true);
  };

  const resetCompleteFormState = () => {
    setSelectedJobForCompletion(null);
    setCompleteSystemAge("");
    setCompleteSystemInstallDate("");
    setCompleteSystemCondition("operational");
    setCompleteFaultHistory([]);
    setCompleteRecommendations("");
    setCompleteBackOfficeNotes("");
    setCompleteServiceStatement(SERVICE_STATEMENTS.operational);
    setCompleteCompletionNotes("");
    setCompleteActualDuration("");
    setCompleteSystems([]);
    setExpandedSystems({});
  };

  // System checklist helpers
  const toggleSystemExpanded = (index: number) => {
    setExpandedSystems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const updateChecklistItem = (systemIndex: number, itemId: string, checked: boolean) => {
    setCompleteSystems(prev => {
      const updated = [...prev];
      const system = { ...updated[systemIndex] };
      system.checklist = system.checklist.map(item =>
        item.id === itemId ? { ...item, checked } : item
      );
      updated[systemIndex] = system;
      return updated;
    });
  };

  const updateChecklistItemNotes = (systemIndex: number, itemId: string, notes: string) => {
    setCompleteSystems(prev => {
      const updated = [...prev];
      const system = { ...updated[systemIndex] };
      system.checklist = system.checklist.map(item =>
        item.id === itemId ? { ...item, notes } : item
      );
      updated[systemIndex] = system;
      return updated;
    });
  };

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
    setWorksheetType("routine_service");
    setEngineerCount(1);
    setEngineers([{ name: "", competency: "competent" }]);
    setSystems([]);
  };

  const updateEngineerCount = (count: number) => {
    setEngineerCount(count);
    const newEngineers = [...engineers];
    while (newEngineers.length < count) {
      newEngineers.push({ name: "", competency: "competent" });
    }
    while (newEngineers.length > count) {
      newEngineers.pop();
    }
    setEngineers(newEngineers);
  };

  const updateEngineer = (index: number, field: "name" | "competency", value: string) => {
    const newEngineers = [...engineers];
    newEngineers[index] = { ...newEngineers[index], [field]: value };
    setEngineers(newEngineers);
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

  const completeJobMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Job> }) => {
      return apiRequest("PATCH", `/api/jobs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", user?.id] });
      setIsCompleteDialogOpen(false);
      resetCompleteFormState();
      toast({ title: "Visit completed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to complete visit", variant: "destructive" });
    },
  });

  const handleCompleteVisit = () => {
    if (!selectedJobForCompletion) return;
    
    completeJobMutation.mutate({
      id: selectedJobForCompletion.id,
      data: {
        status: "completed",
        completedAt: new Date().toISOString(),
        systemAge: completeSystemAge || null,
        systemInstallDate: completeSystemInstallDate || null,
        systemCondition: completeSystemCondition,
        faultHistory: completeFaultHistory,
        recommendations: completeRecommendations || null,
        backOfficeNotes: completeBackOfficeNotes || null,
        serviceStatement: completeServiceStatement || null,
        completionNotes: completeCompletionNotes || null,
        actualDuration: parseFloat(completeActualDuration) || null,
        systems: completeSystems,
      },
    });
  };

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
      worksheetType: worksheetType,
      engineerCount: engineerCount,
      engineerNames: engineers.filter(e => e.name.trim() !== ""),
      priority: formData.get("priority") as string,
      status: "pending",
      scheduledDate: formData.get("scheduledDate") as string || null,
      siteAddress: formData.get("siteAddress") as string || null,
      estimatedDuration: parseFloat(formData.get("estimatedDuration") as string) || null,
      quotedAmount: parseFloat(formData.get("quotedAmount") as string) || null,
      assignedTechnicianId: formData.get("assignedTechnicianId") as string || null,
      notes: formData.get("notes") as string || null,
      // Systems to service
      systems: systems.filter(s => s.systemType !== ""),
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

  const getWorksheetTypeBadge = (type: string) => {
    const visitType = SERVICE_VISIT_TYPES.find(t => t.value === type);
    switch (type) {
      case "condition_survey":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">{visitType?.label || type}</Badge>;
      case "routine_service":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">{visitType?.label || type}</Badge>;
      case "interim_inspection":
        return <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100">{visitType?.label || type}</Badge>;
      case "remediation":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">{visitType?.label || type}</Badge>;
      case "commissioning":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">{visitType?.label || type}</Badge>;
      case "verification":
        return <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100">{visitType?.label || type}</Badge>;
      case "reactive_fault":
        return <Badge variant="destructive">{visitType?.label || type}</Badge>;
      case "access_enabling":
        return <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100">{visitType?.label || type}</Badge>;
      case "diagnostic_testing":
        return <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100">{visitType?.label || type}</Badge>;
      case "goodwill":
        return <Badge className="bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100">{visitType?.label || type}</Badge>;
      default:
        return null;
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
                    <Label htmlFor="worksheetType">Worksheet Type</Label>
                    <Select value={worksheetType} onValueChange={setWorksheetType}>
                      <SelectTrigger data-testid="select-worksheet-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_VISIT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="engineerCount">Number of Engineers</Label>
                    <Select value={String(engineerCount)} onValueChange={(v) => updateEngineerCount(parseInt(v))}>
                      <SelectTrigger data-testid="select-engineer-count">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Engineer</SelectItem>
                        <SelectItem value="2">2 Engineers</SelectItem>
                        <SelectItem value="3">3 Engineers</SelectItem>
                        <SelectItem value="4">4 Engineers</SelectItem>
                        <SelectItem value="5">5 Engineers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {engineers.map((engineer, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Engineer {index + 1} Name</Label>
                      <Input 
                        value={engineer.name} 
                        onChange={(e) => updateEngineer(index, "name", e.target.value)}
                        placeholder="Engineer name"
                        data-testid={`input-engineer-name-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Competency Level</Label>
                      <Select value={engineer.competency} onValueChange={(v) => updateEngineer(index, "competency", v)}>
                        <SelectTrigger data-testid={`select-engineer-competency-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trainee">Trainee</SelectItem>
                          <SelectItem value="competent">Competent</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="lead">Lead Engineer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                <div className="space-y-2">
                  <Label>Postcode Lookup</Label>
                  <PostcodeLookup 
                    onAddressFound={(addr) => {
                      const fullAddress = [addr.address2, addr.city, addr.postcode].filter(Boolean).join(", ");
                      setSiteAddress(fullAddress);
                    }} 
                  />
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

                {/* Systems Section */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Systems to Service
                    </h4>
                    <Button type="button" variant="outline" size="sm" onClick={addSystem} data-testid="button-add-system">
                      <Plus className="h-3 w-3 mr-1" />
                      Add System
                    </Button>
                  </div>
                  {systems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No systems added. Click "Add System" to specify which systems are being serviced.</p>
                  ) : (
                    <div className="space-y-3">
                      {systems.map((system, index) => (
                        <div key={index} className="border rounded p-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Select value={system.systemType} onValueChange={(v) => updateSystem(index, "systemType", v)}>
                              <SelectTrigger data-testid={`select-system-type-${index}`}>
                                <SelectValue placeholder="Select system type" />
                              </SelectTrigger>
                              <SelectContent>
                                {SMOKE_CONTROL_SYSTEM_TYPES.map(type => (
                                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input 
                              value={system.location}
                              onChange={(e) => updateSystem(index, "location", e.target.value)}
                              placeholder="Location (e.g., Stair 1, Levels B2-L10)"
                              data-testid={`input-system-location-${index}`}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Input 
                              value={system.notes || ""}
                              onChange={(e) => updateSystem(index, "notes", e.target.value)}
                              placeholder="Notes (optional)"
                              className="flex-1"
                              data-testid={`input-system-notes-${index}`}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeSystem(index)} data-testid={`button-remove-system-${index}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                      {getWorksheetTypeBadge(job.worksheetType)}
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
                      <Button variant="ghost" size="icon" data-testid={`button-job-menu-${job.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {(job.status === "pending" || job.status === "scheduled") && (
                        <DropdownMenuItem 
                          onClick={() => updateJobMutation.mutate({ id: job.id, data: { status: "in_progress" } })}
                          data-testid={`button-start-job-${job.id}`}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Job
                        </DropdownMenuItem>
                      )}
                      {job.status === "in_progress" && (
                        <DropdownMenuItem 
                          onClick={() => openCompleteDialog(job)}
                          data-testid={`button-complete-visit-${job.id}`}
                        >
                          <ClipboardCheck className="h-4 w-4 mr-2" />
                          Complete Visit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem data-testid={`button-edit-job-${job.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => deleteJobMutation.mutate(job.id)}
                        data-testid={`button-delete-job-${job.id}`}
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
                  {job.engineerCount > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{job.engineerCount} engineer{job.engineerCount > 1 ? "s" : ""}</span>
                      {job.engineerNames && job.engineerNames.length > 0 && (
                        <span className="text-xs">({job.engineerNames.map(e => e.name).filter(Boolean).join(", ")})</span>
                      )}
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
                {job.systems && job.systems.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Settings className="h-3 w-3" />
                      Systems:
                    </span>
                    {job.systems.map((system, idx) => {
                      const systemType = SMOKE_CONTROL_SYSTEM_TYPES.find(t => t.value === system.systemType);
                      return (
                        <Badge key={idx} variant="secondary" className="text-xs" data-testid={`badge-system-${job.id}-${idx}`}>
                          {systemType?.label || system.systemType}
                          {system.location && ` - ${system.location}`}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Complete Visit Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={(open) => { setIsCompleteDialogOpen(open); if (!open) resetCompleteFormState(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Complete Visit
            </DialogTitle>
            <DialogDescription>
              {selectedJobForCompletion && (
                <span>
                  Complete visit report for <strong>{selectedJobForCompletion.title}</strong> ({selectedJobForCompletion.jobNumber})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* System Information */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Settings className="h-4 w-4" />
                System Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>System Age</Label>
                  <Input 
                    value={completeSystemAge}
                    onChange={(e) => setCompleteSystemAge(e.target.value)}
                    placeholder="e.g., 5 years"
                    data-testid="input-complete-system-age"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Install Date</Label>
                  <Input 
                    type="date"
                    value={completeSystemInstallDate}
                    onChange={(e) => setCompleteSystemInstallDate(e.target.value)}
                    data-testid="input-complete-install-date"
                  />
                </div>
              </div>
            </div>

            {/* System Condition */}
            <div className="space-y-2">
              <Label>System Condition</Label>
              <Select value={completeSystemCondition} onValueChange={handleConditionChange}>
                <SelectTrigger data-testid="select-complete-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYSTEM_CONDITION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {completeSystemCondition !== "operational" && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm mt-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Non-operational condition - requires immediate attention</span>
                </div>
              )}
            </div>

            {/* System Checklists */}
            {completeSystems.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <ClipboardCheck className="h-4 w-4" />
                  System Checklists
                </h4>
                <div className="space-y-3">
                  {completeSystems.map((system, systemIndex) => {
                    const systemType = SMOKE_CONTROL_SYSTEM_TYPES.find(t => t.value === system.systemType);
                    const checkedCount = system.checklist.filter(item => item.checked).length;
                    const totalCount = system.checklist.length;
                    const mandatoryCount = system.checklist.filter(item => item.isMandatory).length;
                    const mandatoryChecked = system.checklist.filter(item => item.isMandatory && item.checked).length;
                    const isExpanded = expandedSystems[systemIndex] || false;
                    
                    // Group checklist items by category
                    const categories = system.checklist.reduce((acc, item) => {
                      if (!acc[item.category]) acc[item.category] = [];
                      acc[item.category].push(item);
                      return acc;
                    }, {} as Record<string, SystemChecklistItem[]>);

                    return (
                      <Collapsible key={systemIndex} open={isExpanded} onOpenChange={() => toggleSystemExpanded(systemIndex)}>
                        <CollapsibleTrigger asChild>
                          <div 
                            className="flex items-center justify-between p-3 border rounded cursor-pointer hover-elevate"
                            data-testid={`collapsible-system-${systemIndex}`}
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <span className="font-medium">{systemType?.label || system.systemType}</span>
                              {system.location && <span className="text-muted-foreground text-sm">- {system.location}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              {mandatoryChecked < mandatoryCount && (
                                <Badge variant="outline" className="text-amber-600 border-amber-600">
                                  {mandatoryCount - mandatoryChecked} mandatory remaining
                                </Badge>
                              )}
                              <Badge variant={checkedCount === totalCount ? "default" : "secondary"}>
                                {checkedCount}/{totalCount} completed
                              </Badge>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <div className="border rounded p-3 space-y-4">
                            {Object.entries(categories).map(([category, items]) => (
                              <div key={category} className="space-y-2">
                                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{category}</h5>
                                <div className="space-y-2">
                                  {items.map((item) => (
                                    <div key={item.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                                      <Checkbox
                                        id={item.id}
                                        checked={item.checked}
                                        onCheckedChange={(checked) => updateChecklistItem(systemIndex, item.id, checked === true)}
                                        data-testid={`checkbox-checklist-${systemIndex}-${item.id}`}
                                      />
                                      <div className="flex-1 space-y-1">
                                        <label 
                                          htmlFor={item.id} 
                                          className={`text-sm cursor-pointer ${item.checked ? 'line-through text-muted-foreground' : ''}`}
                                        >
                                          {item.item}
                                          {item.isMandatory && (
                                            <span className="ml-1 text-red-500">*</span>
                                          )}
                                        </label>
                                        <Input
                                          placeholder="Add notes..."
                                          value={item.notes || ""}
                                          onChange={(e) => updateChecklistItemNotes(systemIndex, item.id, e.target.value)}
                                          className="h-7 text-xs"
                                          data-testid={`input-checklist-notes-${systemIndex}-${item.id}`}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="text-red-500">*</span> indicates mandatory items that should be completed before marking the visit as complete.
                </p>
              </div>
            )}

            {/* Fault History */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Fault History
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={addFaultEntry} data-testid="button-add-fault">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Fault
                </Button>
              </div>
              {completeFaultHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No faults recorded. Click "Add Fault" to record issues found.</p>
              ) : (
                <div className="space-y-3">
                  {completeFaultHistory.map((fault, index) => (
                    <div key={index} className="border rounded p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          type="date"
                          value={fault.date}
                          onChange={(e) => updateFaultEntry(index, "date", e.target.value)}
                          data-testid={`input-fault-date-${index}`}
                        />
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={fault.resolved}
                            onChange={(e) => updateFaultEntry(index, "resolved", e.target.checked)}
                            className="h-4 w-4"
                            data-testid={`checkbox-fault-resolved-${index}`}
                          />
                          <Label className="text-sm">Resolved</Label>
                        </div>
                      </div>
                      <Input 
                        value={fault.fault}
                        onChange={(e) => updateFaultEntry(index, "fault", e.target.value)}
                        placeholder="Describe the fault"
                        data-testid={`input-fault-description-${index}`}
                      />
                      {fault.resolved && (
                        <Input 
                          value={fault.resolution || ""}
                          onChange={(e) => updateFaultEntry(index, "resolution", e.target.value)}
                          placeholder="Resolution details"
                          data-testid={`input-fault-resolution-${index}`}
                        />
                      )}
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeFaultEntry(index)} data-testid={`button-remove-fault-${index}`}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
              <Label>Recommendations</Label>
              <Textarea 
                value={completeRecommendations}
                onChange={(e) => setCompleteRecommendations(e.target.value)}
                placeholder="Enter any recommendations for the client..."
                rows={3}
                data-testid="input-complete-recommendations"
              />
            </div>

            {/* Completion Details */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4" />
                Completion Details
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Actual Duration (hours)</Label>
                  <Input 
                    type="number"
                    step="0.5"
                    value={completeActualDuration}
                    onChange={(e) => setCompleteActualDuration(e.target.value)}
                    placeholder="e.g., 4.5"
                    data-testid="input-complete-duration"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label>Completion Notes</Label>
                <Textarea 
                  value={completeCompletionNotes}
                  onChange={(e) => setCompleteCompletionNotes(e.target.value)}
                  placeholder="Summary of work completed..."
                  rows={3}
                  data-testid="input-complete-notes"
                />
              </div>
            </div>

            {/* Back Office Notes */}
            <div className="space-y-2">
              <Label>Back Office Notes (Internal)</Label>
              <Textarea 
                value={completeBackOfficeNotes}
                onChange={(e) => setCompleteBackOfficeNotes(e.target.value)}
                placeholder="Internal notes for the back office..."
                rows={2}
                data-testid="input-complete-backoffice"
              />
            </div>

            {/* Service Statement */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4" />
                Service Statement
              </h4>
              <div className="bg-muted/50 p-3 rounded text-sm">
                {completeServiceStatement}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This statement is automatically generated based on the system condition and will be included in the report.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCompleteVisit} 
              disabled={completeJobMutation.isPending}
              data-testid="button-submit-complete"
            >
              {completeJobMutation.isPending ? "Completing..." : "Complete Visit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
