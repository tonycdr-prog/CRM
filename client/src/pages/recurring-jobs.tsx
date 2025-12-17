import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  RefreshCw,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Pause,
  Play,
  Building2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, addDays, parseISO } from "date-fns";

interface RecurringJob {
  id: string;
  userId: string;
  templateId: string | null;
  clientId: string | null;
  name: string;
  description: string | null;
  frequency: string;
  interval: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  monthOfYear: number | null;
  startDate: string;
  endDate: string | null;
  nextDueDate: string | null;
  lastGeneratedDate: string | null;
  siteAddress: string | null;
  assignedTechnician: string | null;
  priority: string;
  autoCreateDays: number;
  isActive: boolean;
  jobsGenerated: number;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  id: string;
  companyName: string;
}

export default function RecurringJobs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<RecurringJob | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    frequency: "monthly",
    interval: 1,
    dayOfWeek: 1,
    dayOfMonth: 1,
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: "",
    siteAddress: "",
    assignedTechnician: "",
    priority: "medium",
    autoCreateDays: 14,
    isActive: true,
    clientId: "",
  });

  const { data: recurringJobs = [], isLoading } = useQuery<RecurringJob[]>({
    queryKey: ["/api/recurring-jobs"],
    enabled: !!user?.id,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<RecurringJob>) => {
      return apiRequest("POST", "/api/recurring-jobs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-jobs"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Recurring job created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create recurring job", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RecurringJob> }) => {
      return apiRequest("PATCH", `/api/recurring-jobs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-jobs"] });
      setEditingJob(null);
      resetForm();
      toast({ title: "Recurring job updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update recurring job", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/recurring-jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-jobs"] });
      toast({ title: "Recurring job deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete recurring job", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      frequency: "monthly",
      interval: 1,
      dayOfWeek: 1,
      dayOfMonth: 1,
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: "",
      siteAddress: "",
      assignedTechnician: "",
      priority: "medium",
      autoCreateDays: 14,
      isActive: true,
      clientId: "",
    });
  };

  const handleEdit = (job: RecurringJob) => {
    setEditingJob(job);
    setFormData({
      name: job.name,
      description: job.description || "",
      frequency: job.frequency,
      interval: job.interval,
      dayOfWeek: job.dayOfWeek || 1,
      dayOfMonth: job.dayOfMonth || 1,
      startDate: job.startDate,
      endDate: job.endDate || "",
      siteAddress: job.siteAddress || "",
      assignedTechnician: job.assignedTechnician || "",
      priority: job.priority,
      autoCreateDays: job.autoCreateDays,
      isActive: job.isActive,
      clientId: job.clientId || "",
    });
  };

  const calculateNextDueDate = (startDate: string, frequency: string, interval: number) => {
    const start = parseISO(startDate);
    const today = new Date();
    let next = start;
    
    while (next <= today) {
      switch (frequency) {
        case 'daily':
          next = addDays(next, interval);
          break;
        case 'weekly':
          next = addDays(next, 7 * interval);
          break;
        case 'monthly':
          next = new Date(next.setMonth(next.getMonth() + interval));
          break;
        case 'quarterly':
          next = new Date(next.setMonth(next.getMonth() + 3 * interval));
          break;
        case 'biannually':
          next = new Date(next.setMonth(next.getMonth() + 6 * interval));
          break;
        case 'annually':
          next = new Date(next.setFullYear(next.getFullYear() + interval));
          break;
        default:
          next = addDays(next, 30 * interval);
      }
    }
    return format(next, 'yyyy-MM-dd');
  };

  const handleSubmit = () => {
    const nextDue = calculateNextDueDate(formData.startDate, formData.frequency, formData.interval);
    
    const payload = {
      userId: user?.id,
      name: formData.name,
      description: formData.description || null,
      frequency: formData.frequency,
      interval: formData.interval,
      dayOfWeek: formData.frequency === 'weekly' ? formData.dayOfWeek : null,
      dayOfMonth: ['monthly', 'quarterly', 'biannually', 'annually'].includes(formData.frequency) ? formData.dayOfMonth : null,
      startDate: formData.startDate,
      endDate: formData.endDate || null,
      nextDueDate: nextDue,
      siteAddress: formData.siteAddress || null,
      assignedTechnician: formData.assignedTechnician || null,
      priority: formData.priority,
      autoCreateDays: formData.autoCreateDays,
      isActive: formData.isActive,
      clientId: formData.clientId || null,
    };

    if (editingJob) {
      updateMutation.mutate({ id: editingJob.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleActive = (job: RecurringJob) => {
    updateMutation.mutate({ id: job.id, data: { isActive: !job.isActive } });
  };

  const filteredJobs = recurringJobs.filter(job =>
    job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.siteAddress && job.siteAddress.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const frequencies = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "biannually", label: "Every 6 Months" },
    { value: "annually", label: "Annually" },
  ];

  const priorities = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Recurring Jobs</h1>
          <p className="text-muted-foreground">Schedule automatic job creation on repeating intervals</p>
        </div>
        <Dialog open={isCreateDialogOpen || !!editingJob} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingJob(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-recurring">
              <Plus className="w-4 h-4 mr-2" />
              Create Recurring Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingJob ? "Edit Recurring Job" : "Create Recurring Job"}</DialogTitle>
              <DialogDescription>
                Set up a job that automatically repeats at specified intervals
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Job Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Annual Damper Inspection"
                    data-testid="input-job-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                    <SelectTrigger data-testid="select-client">
                      <SelectValue placeholder="Select client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the recurring job..."
                  data-testid="input-job-description"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                    <SelectTrigger data-testid="select-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencies.map(freq => (
                        <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interval">Every</Label>
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    value={formData.interval}
                    onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) || 1 })}
                    data-testid="input-interval"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    data-testid="input-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    data-testid="input-end-date"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteAddress">Site Address</Label>
                <Input
                  id="siteAddress"
                  value={formData.siteAddress}
                  onChange={(e) => setFormData({ ...formData, siteAddress: e.target.value })}
                  placeholder="Enter site address..."
                  data-testid="input-site-address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="technician">Assigned Technician</Label>
                  <Input
                    id="technician"
                    value={formData.assignedTechnician}
                    onChange={(e) => setFormData({ ...formData, assignedTechnician: e.target.value })}
                    placeholder="Technician name..."
                    data-testid="input-technician"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="autoCreate">Auto-Create Days Before</Label>
                  <Input
                    id="autoCreate"
                    type="number"
                    min="1"
                    value={formData.autoCreateDays}
                    onChange={(e) => setFormData({ ...formData, autoCreateDays: parseInt(e.target.value) || 14 })}
                    data-testid="input-auto-create-days"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  data-testid="switch-active"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); setEditingJob(null); resetForm(); }} data-testid="button-cancel">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.name || createMutation.isPending || updateMutation.isPending} data-testid="button-save-recurring">
                {editingJob ? "Update" : "Create"} Recurring Job
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search recurring jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading recurring jobs...</div>
      ) : filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No recurring jobs found</h3>
            <p className="text-muted-foreground mb-4">Set up recurring jobs to automate your scheduling</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Next Due</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id} data-testid={`row-recurring-${job.id}`}>
                  <TableCell>
                    <div className="font-medium">{job.name}</div>
                    {job.assignedTechnician && (
                      <div className="text-sm text-muted-foreground">{job.assignedTechnician}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-muted-foreground" />
                      <span className="capitalize">
                        Every {job.interval > 1 ? `${job.interval} ` : ''}{job.frequency.replace('ly', job.interval > 1 ? 's' : '')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {job.nextDueDate ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{format(parseISO(job.nextDueDate), 'dd MMM yyyy')}</span>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {job.siteAddress ? (
                      <div className="flex items-center gap-2 max-w-[200px]">
                        <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{job.siteAddress}</span>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(job.priority) as any} className="capitalize">
                      {job.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={job.isActive ? 'default' : 'secondary'}>
                      {job.isActive ? 'Active' : 'Paused'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{job.jobsGenerated}</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-menu-${job.id}`}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(job)} data-testid={`button-edit-${job.id}`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleActive(job)} data-testid={`button-toggle-${job.id}`}>
                          {job.isActive ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Resume
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteMutation.mutate(job.id)}
                          className="text-destructive"
                          data-testid={`button-delete-${job.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
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
