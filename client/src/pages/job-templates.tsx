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
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
  CheckSquare,
  Copy,
  DollarSign
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { nanoid } from "nanoid";

interface JobTemplate {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  jobType: string | null;
  estimatedDuration: number | null;
  defaultPrice: number | null;
  checklist: { id: string; item: string; required: boolean }[];
  equipmentRequired: string[];
  notes: string | null;
  createdAt: string;
}

interface ChecklistItem {
  id: string;
  item: string;
  required: boolean;
}

export default function JobTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<JobTemplate | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    jobType: "testing",
    estimatedDuration: "",
    defaultPrice: "",
    checklist: [] as ChecklistItem[],
    equipmentRequired: [] as string[],
    notes: "",
  });

  const { data: templates = [], isLoading } = useQuery<JobTemplate[]>({
    queryKey: ["/api/job-templates", user?.id],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<JobTemplate>) => {
      return apiRequest("POST", "/api/job-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-templates", user?.id] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Job template created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create job template", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<JobTemplate> }) => {
      return apiRequest("PATCH", `/api/job-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-templates", user?.id] });
      setEditingTemplate(null);
      resetForm();
      toast({ title: "Job template updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update job template", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/job-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-templates", user?.id] });
      toast({ title: "Job template deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete job template", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      jobType: "testing",
      estimatedDuration: "",
      defaultPrice: "",
      checklist: [],
      equipmentRequired: [],
      notes: "",
    });
    setNewChecklistItem("");
  };

  const handleEdit = (template: JobTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      jobType: template.jobType || "testing",
      estimatedDuration: template.estimatedDuration?.toString() || "",
      defaultPrice: template.defaultPrice?.toString() || "",
      checklist: template.checklist || [],
      equipmentRequired: template.equipmentRequired || [],
      notes: template.notes || "",
    });
  };

  const handleSubmit = () => {
    const payload = {
      userId: user?.id,
      name: formData.name,
      description: formData.description || null,
      jobType: formData.jobType,
      estimatedDuration: formData.estimatedDuration ? parseFloat(formData.estimatedDuration) : null,
      defaultPrice: formData.defaultPrice ? parseFloat(formData.defaultPrice) : null,
      checklist: formData.checklist,
      equipmentRequired: formData.equipmentRequired,
      notes: formData.notes || null,
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setFormData(prev => ({
        ...prev,
        checklist: [...prev.checklist, { id: nanoid(), item: newChecklistItem, required: true }]
      }));
      setNewChecklistItem("");
    }
  };

  const removeChecklistItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== id)
    }));
  };

  const duplicateTemplate = (template: JobTemplate) => {
    const payload = {
      userId: user?.id,
      name: `${template.name} (Copy)`,
      description: template.description,
      jobType: template.jobType,
      estimatedDuration: template.estimatedDuration,
      defaultPrice: template.defaultPrice,
      checklist: template.checklist.map(item => ({ ...item, id: nanoid() })),
      equipmentRequired: template.equipmentRequired,
      notes: template.notes,
    };
    createMutation.mutate(payload);
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (template.jobType && template.jobType.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const jobTypes = [
    { value: "testing", label: "Testing" },
    { value: "commissioning", label: "Commissioning" },
    { value: "annual_inspection", label: "Annual Inspection" },
    { value: "reactive", label: "Reactive" },
    { value: "maintenance", label: "Maintenance" },
    { value: "installation", label: "Installation" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Job Templates</h1>
          <p className="text-muted-foreground">Reusable job configurations with checklists</p>
        </div>
        <Dialog open={isCreateDialogOpen || !!editingTemplate} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingTemplate(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-template">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Edit Template" : "Create Job Template"}</DialogTitle>
              <DialogDescription>
                Create a reusable job template with checklist items
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Annual Damper Inspection"
                    data-testid="input-template-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobType">Job Type</Label>
                  <Select value={formData.jobType} onValueChange={(v) => setFormData({ ...formData, jobType: v })}>
                    <SelectTrigger data-testid="select-job-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
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
                  placeholder="Describe the job template..."
                  data-testid="input-template-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Estimated Duration (hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    step="0.5"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                    placeholder="e.g., 2.5"
                    data-testid="input-template-duration"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Default Price (£)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.defaultPrice}
                    onChange={(e) => setFormData({ ...formData, defaultPrice: e.target.value })}
                    placeholder="e.g., 150.00"
                    data-testid="input-template-price"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Checklist Items</Label>
                <div className="flex gap-2">
                  <Input
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    placeholder="Add checklist item..."
                    onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                    data-testid="input-checklist-item"
                  />
                  <Button type="button" onClick={addChecklistItem} size="sm" data-testid="button-add-checklist-item">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1 mt-2">
                  {formData.checklist.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded" data-testid={`checklist-item-${index}`}>
                      <span className="text-sm">{item.item}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChecklistItem(item.id)}
                        data-testid={`button-remove-checklist-${index}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Standard Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes to include on all jobs from this template..."
                  data-testid="input-template-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); setEditingTemplate(null); resetForm(); }} data-testid="button-cancel">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.name || createMutation.isPending || updateMutation.isPending} data-testid="button-save-template">
                {editingTemplate ? "Update" : "Create"} Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">Create your first job template to speed up job creation</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover-elevate" data-testid={`card-template-${template.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      <Badge variant="secondary" className="capitalize">
                        {template.jobType?.replace('_', ' ') || 'General'}
                      </Badge>
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-menu-${template.id}`}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(template)} data-testid={`button-edit-${template.id}`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateTemplate(template)} data-testid={`button-duplicate-${template.id}`}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteMutation.mutate(template.id)}
                        className="text-destructive"
                        data-testid={`button-delete-${template.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {template.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                )}
                <div className="flex flex-wrap gap-3 text-sm">
                  {template.estimatedDuration && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{template.estimatedDuration}h</span>
                    </div>
                  )}
                  {template.defaultPrice && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <span>£{template.defaultPrice.toFixed(2)}</span>
                    </div>
                  )}
                  {template.checklist && template.checklist.length > 0 && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <CheckSquare className="w-4 h-4" />
                      <span>{template.checklist.length} items</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
