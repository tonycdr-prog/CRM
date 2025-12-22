import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { ROUTES, buildPath } from "@/lib/routes";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  Wrench,
  Users,
  Award,
  Package,
  X,
  UserPlus,
  Shield,
  AlertCircle,
  ClipboardList,
  ExternalLink,
  Activity
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState } from "react";

interface JobSystem {
  systemType: string;
  location: string;
  notes?: string;
}

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
  systems?: JobSystem[];
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

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  jobTitle: string | null;
  department: string | null;
  skills: string[] | null;
  qualifications: string[] | null;
  isActive: boolean;
}

interface Equipment {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  manufacturer: string | null;
  model: string | null;
  status: string;
  location: string | null;
}

interface JobAssignment {
  id: string;
  jobId: string;
  staffId: string | null;
  subcontractorId: string | null;
  role: string;
  assignedDate: string | null;
  startTime: string | null;
  endTime: string | null;
  status: string;
  notes: string | null;
}

interface JobSkillRequirement {
  id: string;
  jobId: string;
  skillType: string;
  skillLevel: string;
  description: string | null;
}

interface JobEquipmentReservation {
  id: string;
  jobId: string;
  equipmentId: string;
  reservedDate: string;
  startTime: string | null;
  endTime: string | null;
  status: string;
  notes: string | null;
}

interface CheckSheetReading {
  id: string;
  jobId: string | null;
  systemType: string;
  location: string | null;
  building: string | null;
  testerName: string;
  testDate: string;
  status: string;
  overallResult: string | null;
  passCount: number;
  failCount: number;
  naCount: number;
}

const SKILL_TYPES = [
  { value: "cscs", label: "CSCS Card" },
  { value: "ipaf", label: "IPAF" },
  { value: "pasma", label: "PASMA" },
  { value: "first_aid", label: "First Aid" },
  { value: "asbestos_awareness", label: "Asbestos Awareness" },
  { value: "fire_safety", label: "Fire Safety" },
  { value: "electrical", label: "Electrical" },
  { value: "gas_safe", label: "Gas Safe" },
  { value: "confined_space", label: "Confined Space" },
  { value: "working_at_height", label: "Working at Height" },
];

const SKILL_LEVELS = [
  { value: "required", label: "Required" },
  { value: "preferred", label: "Preferred" },
  { value: "optional", label: "Optional" },
];

const ASSIGNMENT_ROLES = [
  { value: "lead", label: "Lead Technician" },
  { value: "technician", label: "Technician" },
  { value: "helper", label: "Helper" },
  { value: "supervisor", label: "Supervisor" },
];

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false);
  const [showAddSkillDialog, setShowAddSkillDialog] = useState(false);
  const [showAddEquipmentDialog, setShowAddEquipmentDialog] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("technician");
  const [selectedSkillType, setSelectedSkillType] = useState<string>("");
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string>("required");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");

  const { data: job, isLoading: jobLoading } = useQuery<Job>({
    queryKey: [`/api/jobs/detail/${id}`],
    enabled: !!id && !!user?.id,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: !!user?.id,
  });

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
    enabled: !!user?.id,
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    enabled: !!user?.id,
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    enabled: !!user?.id,
  });

  const { data: timesheets = [] } = useQuery<Timesheet[]>({
    queryKey: ["/api/timesheets"],
    enabled: !!user?.id,
  });

  // Scheduling enhancement queries
  const { data: staffDirectory = [], isLoading: staffLoading } = useQuery<StaffMember[]>({
    queryKey: ["/api/staff-directory"],
    enabled: !!user?.id,
  });

  const { data: equipmentList = [], isLoading: equipmentLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
    enabled: !!user?.id,
  });

  const { data: jobAssignments = [], isLoading: assignmentsLoading } = useQuery<JobAssignment[]>({
    queryKey: ["/api/job-assignments/by-job", id],
    enabled: !!id && !!user?.id,
  });

  const { data: jobSkillRequirements = [], isLoading: skillsLoading } = useQuery<JobSkillRequirement[]>({
    queryKey: ["/api/job-skill-requirements/by-job", id],
    enabled: !!id && !!user?.id,
  });

  const { data: jobEquipmentReservations = [], isLoading: reservationsLoading } = useQuery<JobEquipmentReservation[]>({
    queryKey: ["/api/job-equipment-reservations/by-job", id],
    enabled: !!id && !!user?.id,
  });

  // Check sheets linked to this job
  const { data: jobCheckSheets = [] } = useQuery<CheckSheetReading[]>({
    queryKey: ["/api/check-sheet-readings/job", id],
    enabled: !!id && !!user?.id,
  });

  // Visit notes for job report
  interface WorkNote {
    id: string;
    jobId: string | null;
    noteDate: string | null;
    noteType: string | null;
    content: string | null;
    authorName: string | null;
    attachments?: { name: string; url: string }[];
  }
  const { data: jobVisitNotes = [] } = useQuery<WorkNote[]>({
    queryKey: ["/api/work-notes/by-job", id],
    enabled: !!id && !!user?.id,
  });

  // Job assets with requires work flag
  interface JobSiteAssetWithDetails {
    id: string;
    jobId: string;
    siteAssetId: string;
    status: string;
    requiresWork: boolean | null;
    requiresWorkReason: string | null;
    notes: string | null;
    asset: {
      id: string;
      assetNumber: string;
      assetType: string;
      floor: string | null;
      location: string | null;
    };
  }
  const { data: jobSiteAssets = [] } = useQuery<JobSiteAssetWithDetails[]>({
    queryKey: ["/api/job-site-assets/with-details", id],
    enabled: !!id && !!user?.id,
  });

  // Filter assets that require work
  const assetsRequiringWork = jobSiteAssets.filter(a => a.requiresWork);

  const updateJobMutation = useMutation({
    mutationFn: async (data: Partial<Job>) => {
      return apiRequest("PATCH", `/api/jobs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "Job updated" });
    },
  });

  // Assignment mutations
  const addAssignmentMutation = useMutation({
    mutationFn: async (data: { staffId: string; role: string }) => {
      return apiRequest("POST", "/api/job-assignments", {
        jobId: id,
        staffId: data.staffId,
        role: data.role,
        assignedDate: job?.scheduledDate || new Date().toISOString().split("T")[0],
        status: "assigned",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-assignments/by-job", id] });
      setShowAddStaffDialog(false);
      setSelectedStaffId("");
      setSelectedRole("technician");
      toast({ title: "Staff assigned to job" });
    },
    onError: () => {
      toast({ title: "Failed to assign staff", variant: "destructive" });
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return apiRequest("DELETE", `/api/job-assignments/${assignmentId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-assignments/by-job", id] });
      toast({ title: "Staff removed from job" });
    },
    onError: () => {
      toast({ title: "Failed to remove staff", variant: "destructive" });
    },
  });

  // Skill requirement mutations
  const addSkillMutation = useMutation({
    mutationFn: async (data: { skillType: string; skillLevel: string }) => {
      return apiRequest("POST", "/api/job-skill-requirements", {
        jobId: id,
        skillType: data.skillType,
        skillLevel: data.skillLevel,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-skill-requirements/by-job", id] });
      setShowAddSkillDialog(false);
      setSelectedSkillType("");
      setSelectedSkillLevel("required");
      toast({ title: "Skill requirement added" });
    },
    onError: () => {
      toast({ title: "Failed to add skill requirement", variant: "destructive" });
    },
  });

  const removeSkillMutation = useMutation({
    mutationFn: async (skillId: string) => {
      return apiRequest("DELETE", `/api/job-skill-requirements/${skillId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-skill-requirements/by-job", id] });
      toast({ title: "Skill requirement removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove skill requirement", variant: "destructive" });
    },
  });

  // Equipment reservation mutations
  const addEquipmentMutation = useMutation({
    mutationFn: async (equipmentId: string) => {
      return apiRequest("POST", "/api/job-equipment-reservations", {
        jobId: id,
        equipmentId: equipmentId,
        reservedDate: job?.scheduledDate || new Date().toISOString().split("T")[0],
        status: "reserved",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-equipment-reservations/by-job", id] });
      setShowAddEquipmentDialog(false);
      setSelectedEquipmentId("");
      toast({ title: "Equipment reserved for job" });
    },
    onError: () => {
      toast({ title: "Failed to reserve equipment", variant: "destructive" });
    },
  });

  const removeEquipmentMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      return apiRequest("DELETE", `/api/job-equipment-reservations/${reservationId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-equipment-reservations/by-job", id] });
      toast({ title: "Equipment reservation cancelled" });
    },
    onError: () => {
      toast({ title: "Failed to cancel reservation", variant: "destructive" });
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

  // Helper functions
  const getStaffName = (staffId: string | null) => {
    if (!staffId) return "Unknown";
    const staff = staffDirectory.find(s => s.id === staffId);
    return staff ? `${staff.firstName} ${staff.lastName}` : "Unknown";
  };

  const getEquipmentName = (equipmentId: string) => {
    const equip = equipmentList.find(e => e.id === equipmentId);
    return equip ? equip.name : "Unknown";
  };

  const getEquipmentDetails = (equipmentId: string) => {
    return equipmentList.find(e => e.id === equipmentId);
  };

  const getSkillLabel = (skillType: string) => {
    const skill = SKILL_TYPES.find(s => s.value === skillType);
    return skill ? skill.label : skillType;
  };

  const getRoleLabel = (role: string) => {
    const roleItem = ASSIGNMENT_ROLES.find(r => r.value === role);
    return roleItem ? roleItem.label : role;
  };

  // Filter out already assigned staff
  const availableStaff = staffDirectory.filter(
    staff => staff.isActive && !jobAssignments.some(a => a.staffId === staff.id)
  );

  // Filter out already reserved equipment (handle undefined status gracefully)
  const availableEquipment = equipmentList.filter(
    equip => (equip.status === "available" || !equip.status) && !jobEquipmentReservations.some(r => r.equipmentId === equip.id)
  );

  // Filter out already added skills
  const availableSkills = SKILL_TYPES.filter(
    skill => !jobSkillRequirements.some(r => r.skillType === skill.value)
  );

  // Loading spinner component for tabs
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-6" data-testid="loading-spinner">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
    </div>
  );

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

  const getSkillLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      required: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      preferred: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      optional: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
    };
    return <Badge className={colors[level] || ""} variant={colors[level] ? undefined : "outline"}>{level}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      lead: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      supervisor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      technician: "",
      helper: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
    };
    return <Badge className={colors[role] || ""} variant={colors[role] ? undefined : "outline"}>{getRoleLabel(role)}</Badge>;
  };

  const getEquipmentStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      reserved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      checked_out: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      returned: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    };
    return <Badge className={colors[status] || ""} variant={colors[status] ? undefined : "outline"}>{status.replace(/_/g, " ")}</Badge>;
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
          <Link href={buildPath(ROUTES.JOB_ACTIVITY, { jobId: job.id })}>
            <Button variant="outline" data-testid="button-activity">
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </Button>
          </Link>
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
          {job.status === "completed" && jobInvoices.length === 0 && (
            <Link href={`/finance?createInvoice=true&jobId=${job.id}&clientId=${job.clientId}&amount=${totalCost > 0 ? Math.round(totalCost * 1.2) : job.quotedAmount || 0}&title=${encodeURIComponent(`Invoice for ${job.title}`)}`}>
              <Button data-testid="button-create-invoice">
                <Receipt className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </Link>
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

        {/* Systems to Test Section */}
        {job.systems && job.systems.length > 0 && (
          <Card className="md:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  <CardTitle>Systems to Test</CardTitle>
                </div>
                <div className="flex gap-2">
                  {jobCheckSheets.length > 0 && (
                    <Badge variant="secondary">{jobCheckSheets.length} completed</Badge>
                  )}
                  <Badge variant="outline">{job.systems.length} system{job.systems.length !== 1 ? "s" : ""}</Badge>
                </div>
              </div>
              <CardDescription>Click to start a check sheet for each system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {job.systems.map((system, index) => {
                  // Find completed check sheets for this system type
                  const completedSheets = jobCheckSheets.filter(cs => 
                    cs.systemType === system.systemType && 
                    (cs.location === system.location || (!cs.location && !system.location))
                  );
                  const hasCompleted = completedSheets.length > 0;
                  const latestSheet = completedSheets[0];
                  
                  return (
                    <Card key={index} className={`p-4 ${hasCompleted ? "border-green-500/50" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{system.systemType.replace(/_/g, " ")}</span>
                            {hasCompleted && (
                              <Badge variant={latestSheet?.overallResult === "pass" ? "default" : "destructive"} className="text-xs">
                                {latestSheet?.overallResult === "pass" ? "Passed" : latestSheet?.overallResult === "fail" ? "Failed" : "Tested"}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">{system.location}</div>
                          {system.notes && (
                            <div className="text-xs text-muted-foreground mt-1">{system.notes}</div>
                          )}
                          {hasCompleted && latestSheet && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Tested: {format(parseISO(latestSheet.testDate), "MMM d, yyyy")}
                            </div>
                          )}
                        </div>
                        <Link href={`/check-sheets?startCheckSheet=true&jobId=${job.id}&systemType=${encodeURIComponent(system.systemType)}&location=${encodeURIComponent(system.location)}&building=${encodeURIComponent(job.siteAddress || "")}`}>
                          <Button size="sm" variant={hasCompleted ? "outline" : "default"} data-testid={`button-start-checksheet-${index}`}>
                            <ClipboardList className="h-4 w-4 mr-1" />
                            {hasCompleted ? "Retest" : "Start"}
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Check Sheets Section (when job has no predefined systems but has check sheets) */}
        {(!job.systems || job.systems.length === 0) && jobCheckSheets.length > 0 && (
          <Card className="md:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  <CardTitle>Completed Check Sheets</CardTitle>
                </div>
                <Badge variant="secondary">{jobCheckSheets.length} check sheet{jobCheckSheets.length !== 1 ? "s" : ""}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {jobCheckSheets.map((sheet) => (
                  <Card key={sheet.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">{sheet.systemType.replace(/_/g, " ")}</span>
                          <Badge variant={sheet.overallResult === "pass" ? "default" : "destructive"} className="text-xs">
                            {sheet.overallResult === "pass" ? "Passed" : sheet.overallResult === "fail" ? "Failed" : "Incomplete"}
                          </Badge>
                        </div>
                        {sheet.location && <div className="text-sm text-muted-foreground truncate">{sheet.location}</div>}
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(sheet.testDate), "MMM d, yyyy")} by {sheet.testerName}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-green-600">{sheet.passCount} pass</span>
                          <span className="text-xs text-red-600">{sheet.failCount} fail</span>
                          <span className="text-xs text-muted-foreground">{sheet.naCount} N/A</span>
                        </div>
                      </div>
                      <Link href={`/check-sheets`}>
                        <Button size="icon" variant="ghost" data-testid={`button-view-checksheet-${sheet.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="md:col-span-2">
          <Tabs defaultValue="team">
            <CardHeader className="pb-0">
              <TabsList className="flex-wrap">
                <TabsTrigger value="team" data-testid="tab-team">
                  <Users className="h-4 w-4 mr-1" />
                  Team ({jobAssignments.length})
                </TabsTrigger>
                <TabsTrigger value="skills" data-testid="tab-skills">
                  <Award className="h-4 w-4 mr-1" />
                  Skills ({jobSkillRequirements.length})
                </TabsTrigger>
                <TabsTrigger value="equipment" data-testid="tab-equipment">
                  <Package className="h-4 w-4 mr-1" />
                  Equipment ({jobEquipmentReservations.length})
                </TabsTrigger>
                <TabsTrigger value="expenses" data-testid="tab-expenses">Expenses ({jobExpenses.length})</TabsTrigger>
                <TabsTrigger value="timesheets" data-testid="tab-timesheets">Time ({jobTimesheets.length})</TabsTrigger>
                <TabsTrigger value="invoices" data-testid="tab-invoices">Invoices ({jobInvoices.length})</TabsTrigger>
                <TabsTrigger value="report" data-testid="tab-report">
                  <FileText className="h-4 w-4 mr-1" />
                  Report
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Team Assignments Tab */}
              <TabsContent value="team" className="mt-0">
                {(assignmentsLoading || staffLoading) ? (
                  <LoadingSpinner />
                ) : (
                <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">Assign staff to this job</p>
                  <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-staff">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign Staff
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign Staff to Job</DialogTitle>
                        <DialogDescription>Select a staff member and their role for this job.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Staff Member</Label>
                          <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                            <SelectTrigger data-testid="select-staff">
                              <SelectValue placeholder="Select staff member" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableStaff.length === 0 ? (
                                <SelectItem value="none" disabled>No available staff</SelectItem>
                              ) : (
                                availableStaff.map(staff => (
                                  <SelectItem key={staff.id} value={staff.id}>
                                    {staff.firstName} {staff.lastName} - {staff.jobTitle || "Staff"}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger data-testid="select-role">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {ASSIGNMENT_ROLES.map(role => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddStaffDialog(false)}>Cancel</Button>
                        <Button 
                          onClick={() => addAssignmentMutation.mutate({ staffId: selectedStaffId, role: selectedRole })}
                          disabled={!selectedStaffId || addAssignmentMutation.isPending}
                          data-testid="button-confirm-assign"
                        >
                          {addAssignmentMutation.isPending ? "Assigning..." : "Assign"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {jobAssignments.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No staff assigned yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobAssignments.map((assignment) => (
                        <TableRow key={assignment.id} data-testid={`row-assignment-${assignment.id}`}>
                          <TableCell className="font-medium">
                            {getStaffName(assignment.staffId)}
                          </TableCell>
                          <TableCell>{getRoleBadge(assignment.role)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{assignment.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeAssignmentMutation.mutate(assignment.id)}
                              disabled={removeAssignmentMutation.isPending}
                              data-testid={`button-remove-assignment-${assignment.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                </>
                )}
              </TabsContent>

              {/* Skills Requirements Tab */}
              <TabsContent value="skills" className="mt-0">
                {skillsLoading ? (
                  <LoadingSpinner />
                ) : (
                <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">Certifications required for this job</p>
                  <Dialog open={showAddSkillDialog} onOpenChange={setShowAddSkillDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-skill">
                        <Shield className="h-4 w-4 mr-2" />
                        Add Requirement
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Skill Requirement</DialogTitle>
                        <DialogDescription>Specify a certification or skill required for this job.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Skill/Certification</Label>
                          <Select value={selectedSkillType} onValueChange={setSelectedSkillType}>
                            <SelectTrigger data-testid="select-skill-type">
                              <SelectValue placeholder="Select certification" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSkills.length === 0 ? (
                                <SelectItem value="none" disabled>All skills already added</SelectItem>
                              ) : (
                                availableSkills.map(skill => (
                                  <SelectItem key={skill.value} value={skill.value}>
                                    {skill.label}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Requirement Level</Label>
                          <Select value={selectedSkillLevel} onValueChange={setSelectedSkillLevel}>
                            <SelectTrigger data-testid="select-skill-level">
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              {SKILL_LEVELS.map(level => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddSkillDialog(false)}>Cancel</Button>
                        <Button 
                          onClick={() => addSkillMutation.mutate({ skillType: selectedSkillType, skillLevel: selectedSkillLevel })}
                          disabled={!selectedSkillType || addSkillMutation.isPending}
                          data-testid="button-confirm-skill"
                        >
                          {addSkillMutation.isPending ? "Adding..." : "Add"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {jobSkillRequirements.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No skill requirements specified</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Certification</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobSkillRequirements.map((skill) => (
                        <TableRow key={skill.id} data-testid={`row-skill-${skill.id}`}>
                          <TableCell className="font-medium">
                            {getSkillLabel(skill.skillType)}
                          </TableCell>
                          <TableCell>{getSkillLevelBadge(skill.skillLevel)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSkillMutation.mutate(skill.id)}
                              disabled={removeSkillMutation.isPending}
                              data-testid={`button-remove-skill-${skill.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                </>
                )}
              </TabsContent>

              {/* Equipment Reservations Tab */}
              <TabsContent value="equipment" className="mt-0">
                {(reservationsLoading || equipmentLoading) ? (
                  <LoadingSpinner />
                ) : (
                <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">Equipment reserved for this job</p>
                  <Dialog open={showAddEquipmentDialog} onOpenChange={setShowAddEquipmentDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-equipment">
                        <Package className="h-4 w-4 mr-2" />
                        Reserve Equipment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reserve Equipment</DialogTitle>
                        <DialogDescription>Select equipment to reserve for this job.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Equipment</Label>
                          <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
                            <SelectTrigger data-testid="select-equipment">
                              <SelectValue placeholder="Select equipment" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableEquipment.length === 0 ? (
                                <SelectItem value="none" disabled>No available equipment</SelectItem>
                              ) : (
                                availableEquipment.map(equip => (
                                  <SelectItem key={equip.id} value={equip.id}>
                                    {equip.name} ({equip.assetTag}) - {equip.category}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddEquipmentDialog(false)}>Cancel</Button>
                        <Button 
                          onClick={() => addEquipmentMutation.mutate(selectedEquipmentId)}
                          disabled={!selectedEquipmentId || addEquipmentMutation.isPending}
                          data-testid="button-confirm-equipment"
                        >
                          {addEquipmentMutation.isPending ? "Reserving..." : "Reserve"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {jobEquipmentReservations.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No equipment reserved</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipment</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobEquipmentReservations.map((reservation) => {
                        const equipDetails = getEquipmentDetails(reservation.equipmentId);
                        return (
                          <TableRow key={reservation.id} data-testid={`row-equipment-${reservation.id}`}>
                            <TableCell>
                              <div className="font-medium">{getEquipmentName(reservation.equipmentId)}</div>
                              <div className="text-xs text-muted-foreground">{equipDetails?.assetTag}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{equipDetails?.category || "N/A"}</Badge>
                            </TableCell>
                            <TableCell>{getEquipmentStatusBadge(reservation.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeEquipmentMutation.mutate(reservation.id)}
                                disabled={removeEquipmentMutation.isPending}
                                data-testid={`button-remove-equipment-${reservation.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
                </>
                )}
              </TabsContent>

              {/* Expenses Tab */}
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

              {/* Timesheets Tab */}
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

              {/* Invoices Tab */}
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

              {/* Report Tab */}
              <TabsContent value="report" className="mt-0 space-y-6">
                {/* Visit Notes Section */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Visit Notes ({jobVisitNotes.length})
                  </h4>
                  {jobVisitNotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No visit notes recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {jobVisitNotes.map(note => (
                        <Card key={note.id} data-testid={`report-note-${note.id}`}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline" className="text-xs">
                                {note.noteType === "site_visit" ? "Site Visit" :
                                 note.noteType === "issue" ? "Issue" :
                                 note.noteType === "general" ? "General" : note.noteType || "Note"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {note.noteDate ? format(parseISO(note.noteDate), "d MMM yyyy") : ""}
                              </span>
                            </div>
                            <p className="text-sm">{note.content}</p>
                            {note.authorName && (
                              <p className="text-xs text-muted-foreground mt-1">— {note.authorName}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assets Requiring Work Section */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    Assets Requiring Work ({assetsRequiringWork.length})
                  </h4>
                  {assetsRequiringWork.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No assets flagged for work</p>
                  ) : (
                    <div className="space-y-2">
                      {assetsRequiringWork.map(item => (
                        <Card key={item.id} className="border-destructive/30" data-testid={`report-asset-work-${item.id}`}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{item.asset?.assetNumber || "Unknown"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.asset?.assetType} • Floor {item.asset?.floor || "N/A"}
                                </p>
                              </div>
                              <Badge variant="destructive" className="text-xs">Requires Work</Badge>
                            </div>
                            {item.requiresWorkReason && (
                              <p className="text-sm text-destructive mt-2 italic">{item.requiresWorkReason}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Create Quote Button */}
                {assetsRequiringWork.length > 0 && (
                  <div className="pt-4 border-t">
                    <Link href={`/finance?createQuote=true&jobId=${id}&prefillAssets=true`}>
                      <Button className="w-full" data-testid="button-create-quote-from-report">
                        <Receipt className="h-4 w-4 mr-2" />
                        Create Quote for Work Required ({assetsRequiringWork.length} items)
                      </Button>
                    </Link>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
