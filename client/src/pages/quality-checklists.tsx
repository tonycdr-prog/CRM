import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, ClipboardCheck, CheckCircle, XCircle } from "lucide-react";

interface QualityChecklist {
  id: string;
  userId: string;
  jobId: string | null;
  name: string;
  checklistType: string | null;
  category: string | null;
  completedBy: string | null;
  completedDate: string | null;
  status: string | null;
  items: { item: string; checked: boolean; notes?: string }[] | null;
  overallScore: number | null;
  passThreshold: number | null;
  isPassed: boolean | null;
  supervisorApproval: string | null;
  supervisorDate: string | null;
  nonConformances: string | null;
  correctiveActions: string | null;
  notes: string | null;
  createdAt: string;
}

const defaultFormData = {
  name: "",
  checklistType: "pre_work",
  category: "general",
  completedBy: "",
  completedDate: "",
  status: "pending",
  overallScore: "",
  passThreshold: "80",
  supervisorApproval: "",
  nonConformances: "",
  correctiveActions: "",
  notes: "",
};

export default function QualityChecklistsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<QualityChecklist | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const { toast } = useToast();

  const userId = "demo-user";

  const { data: checklists = [], isLoading } = useQuery<QualityChecklist[]>({
    queryKey: ["/api/quality-checklists"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/quality-checklists", { ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-checklists"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Checklist created successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/quality-checklists/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-checklists"] });
      setIsDialogOpen(false);
      setEditingChecklist(null);
      resetForm();
      toast({ title: "Checklist updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/quality-checklists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-checklists"] });
      toast({ title: "Checklist deleted successfully" });
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingChecklist(null);
  };

  const handleEdit = (checklist: QualityChecklist) => {
    setEditingChecklist(checklist);
    setFormData({
      name: checklist.name || "",
      checklistType: checklist.checklistType || "pre_work",
      category: checklist.category || "general",
      completedBy: checklist.completedBy || "",
      completedDate: checklist.completedDate || "",
      status: checklist.status || "pending",
      overallScore: checklist.overallScore?.toString() || "",
      passThreshold: checklist.passThreshold?.toString() || "80",
      supervisorApproval: checklist.supervisorApproval || "",
      nonConformances: checklist.nonConformances || "",
      correctiveActions: checklist.correctiveActions || "",
      notes: checklist.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast({ title: "Please enter checklist name", variant: "destructive" });
      return;
    }
    const overallScore = formData.overallScore ? parseInt(formData.overallScore) : null;
    const passThreshold = formData.passThreshold ? parseInt(formData.passThreshold) : 80;
    const submitData = {
      ...formData,
      overallScore,
      passThreshold,
      isPassed: overallScore !== null ? overallScore >= passThreshold : null,
    };
    if (editingChecklist) {
      updateMutation.mutate({ ...submitData, id: editingChecklist.id });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">Pending</Badge>;
      case "in_progress": return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "completed": return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "failed": return <Badge variant="destructive">Failed</Badge>;
      default: return null;
    }
  };

  const getTypeBadge = (type: string | null) => {
    switch (type) {
      case "pre_work": return <Badge variant="outline">Pre-Work</Badge>;
      case "in_progress": return <Badge variant="outline">In Progress</Badge>;
      case "completion": return <Badge variant="outline">Completion</Badge>;
      case "handover": return <Badge variant="outline">Handover</Badge>;
      case "safety": return <Badge variant="outline" className="text-red-600">Safety</Badge>;
      default: return null;
    }
  };

  if (isLoading) {
    return <div className="p-6" data-testid="loading-checklists">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6" data-testid="quality-checklists-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title">Quality Checklists</h1>
          <p className="text-muted-foreground">Quality control and inspection checklists</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-checklist">
              <Plus className="w-4 h-4 mr-2" />
              Add Checklist
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">{editingChecklist ? "Edit Checklist" : "Add Checklist"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Checklist Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Pre-Installation Safety Check"
                  data-testid="input-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={formData.checklistType} onValueChange={(v) => setFormData({ ...formData, checklistType: v })}>
                    <SelectTrigger data-testid="select-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pre_work">Pre-Work</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completion">Completion</SelectItem>
                      <SelectItem value="handover">Handover</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="smoke_control">Smoke Control</SelectItem>
                      <SelectItem value="fire_safety">Fire Safety</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="mechanical">Mechanical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Completed By</Label>
                  <Input
                    value={formData.completedBy}
                    onChange={(e) => setFormData({ ...formData, completedBy: e.target.value })}
                    placeholder="Name of person"
                    data-testid="input-completed-by"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Completed Date</Label>
                  <Input
                    type="date"
                    value={formData.completedDate}
                    onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
                    data-testid="input-completed-date"
                  />
                </div>
                <div>
                  <Label>Supervisor Approval</Label>
                  <Input
                    value={formData.supervisorApproval}
                    onChange={(e) => setFormData({ ...formData, supervisorApproval: e.target.value })}
                    placeholder="Supervisor name"
                    data-testid="input-supervisor"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Overall Score (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.overallScore}
                    onChange={(e) => setFormData({ ...formData, overallScore: e.target.value })}
                    placeholder="0-100"
                    data-testid="input-score"
                  />
                </div>
                <div>
                  <Label>Pass Threshold (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.passThreshold}
                    onChange={(e) => setFormData({ ...formData, passThreshold: e.target.value })}
                    placeholder="80"
                    data-testid="input-threshold"
                  />
                </div>
              </div>
              <div>
                <Label>Non-Conformances</Label>
                <Textarea
                  value={formData.nonConformances}
                  onChange={(e) => setFormData({ ...formData, nonConformances: e.target.value })}
                  placeholder="List any non-conformances found"
                  data-testid="input-nonconformances"
                />
              </div>
              <div>
                <Label>Corrective Actions</Label>
                <Textarea
                  value={formData.correctiveActions}
                  onChange={(e) => setFormData({ ...formData, correctiveActions: e.target.value })}
                  placeholder="Actions to address non-conformances"
                  data-testid="input-corrective"
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes"
                  data-testid="input-notes"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {editingChecklist ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {checklists.length === 0 ? (
        <Card data-testid="empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardCheck className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No quality checklists yet. Create your first checklist.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {checklists.map((checklist) => (
            <Card key={checklist.id} data-testid={`card-checklist-${checklist.id}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate" data-testid={`text-name-${checklist.id}`}>
                      {checklist.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {getTypeBadge(checklist.checklistType)}
                      {getStatusBadge(checklist.status)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(checklist)} data-testid={`button-edit-${checklist.id}`}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(checklist.id)} data-testid={`button-delete-${checklist.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {checklist.overallScore !== null && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-muted-foreground">Score</span>
                        <div className="flex items-center gap-1">
                          {checklist.isPassed ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="font-medium" data-testid={`text-score-${checklist.id}`}>{checklist.overallScore}%</span>
                        </div>
                      </div>
                      <Progress value={checklist.overallScore} className="h-2" data-testid={`progress-${checklist.id}`} />
                    </div>
                  )}
                  <div className="text-sm space-y-1">
                    {checklist.completedBy && (
                      <p data-testid={`text-completed-by-${checklist.id}`}>
                        <span className="text-muted-foreground">Completed by:</span> {checklist.completedBy}
                      </p>
                    )}
                    {checklist.completedDate && (
                      <p className="text-muted-foreground" data-testid={`text-date-${checklist.id}`}>
                        {checklist.completedDate}
                      </p>
                    )}
                    {checklist.supervisorApproval && (
                      <p data-testid={`text-supervisor-${checklist.id}`}>
                        <span className="text-muted-foreground">Approved:</span> {checklist.supervisorApproval}
                      </p>
                    )}
                    <p className="text-muted-foreground" data-testid={`text-category-${checklist.id}`}>
                      {checklist.category}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}