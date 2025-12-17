import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import { Plus, ShieldCheck, FileText, Trash2, Edit, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { DbRiskAssessment } from "@shared/schema";

export default function RiskAssessments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<DbRiskAssessment | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    siteAddress: "",
    assessmentDate: new Date().toISOString().split("T")[0],
    assessedBy: "",
    reviewDate: "",
    methodStatement: "",
    emergencyProcedures: "",
    status: "draft",
  });

  const { data: assessments = [], isLoading } = useQuery<DbRiskAssessment[]>({
    queryKey: ["/api/risk-assessments"],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/risk-assessments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risk-assessments"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Risk assessment created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/risk-assessments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risk-assessments"] });
      setIsDialogOpen(false);
      setEditingAssessment(null);
      resetForm();
      toast({ title: "Risk assessment updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/risk-assessments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risk-assessments"] });
      toast({ title: "Risk assessment deleted" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      siteAddress: "",
      assessmentDate: new Date().toISOString().split("T")[0],
      assessedBy: "",
      reviewDate: "",
      methodStatement: "",
      emergencyProcedures: "",
      status: "draft",
    });
  };

  const openEditDialog = (assessment: DbRiskAssessment) => {
    setEditingAssessment(assessment);
    setFormData({
      title: assessment.title,
      siteAddress: assessment.siteAddress || "",
      assessmentDate: assessment.assessmentDate || "",
      assessedBy: assessment.assessedBy || "",
      reviewDate: assessment.reviewDate || "",
      methodStatement: assessment.methodStatement || "",
      emergencyProcedures: assessment.emergencyProcedures || "",
      status: assessment.status || "draft",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData, userId: user?.id };
    if (editingAssessment) {
      updateMutation.mutate({ id: editingAssessment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-500/10 text-gray-500",
      approved: "bg-blue-500/10 text-blue-500",
      active: "bg-green-500/10 text-green-500",
      expired: "bg-red-500/10 text-red-500",
    };
    return <Badge className={styles[status] || "bg-gray-500/10 text-gray-500"}>{status.toUpperCase()}</Badge>;
  };

  const activeCount = assessments.filter((a) => a.status === "active").length;
  const draftCount = assessments.filter((a) => a.status === "draft").length;

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Risk Assessments</h1>
          <p className="text-muted-foreground">RAMS and method statements for jobs</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingAssessment(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-assessment">
              <Plus className="h-4 w-4 mr-2" />
              New Assessment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAssessment ? "Edit Risk Assessment" : "New Risk Assessment"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Smoke Damper Testing - Tower Block"
                  required
                  data-testid="input-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Site Address</Label>
                <Input
                  value={formData.siteAddress}
                  onChange={(e) => setFormData({ ...formData, siteAddress: e.target.value })}
                  placeholder="Full site address"
                  data-testid="input-site-address"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Assessment Date</Label>
                  <Input
                    type="date"
                    value={formData.assessmentDate}
                    onChange={(e) => setFormData({ ...formData, assessmentDate: e.target.value })}
                    data-testid="input-assessment-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assessed By</Label>
                  <Input
                    value={formData.assessedBy}
                    onChange={(e) => setFormData({ ...formData, assessedBy: e.target.value })}
                    placeholder="Name"
                    data-testid="input-assessed-by"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Review Date</Label>
                  <Input
                    type="date"
                    value={formData.reviewDate}
                    onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                    data-testid="input-review-date"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Method Statement</Label>
                <Textarea
                  value={formData.methodStatement}
                  onChange={(e) => setFormData({ ...formData, methodStatement: e.target.value })}
                  placeholder="Step by step method of work..."
                  rows={5}
                  data-testid="input-method-statement"
                />
              </div>
              <div className="space-y-2">
                <Label>Emergency Procedures</Label>
                <Textarea
                  value={formData.emergencyProcedures}
                  onChange={(e) => setFormData({ ...formData, emergencyProcedures: e.target.value })}
                  placeholder="In case of emergency..."
                  rows={3}
                  data-testid="input-emergency"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-assessment">
                  {editingAssessment ? "Update" : "Create Assessment"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-assessments">{assessments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500" data-testid="text-active-count">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-draft-count">{draftCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assessments.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              No risk assessments yet. Click "New Assessment" to create one.
            </CardContent>
          </Card>
        ) : (
          assessments.map((assessment) => (
            <Card key={assessment.id} data-testid={`card-assessment-${assessment.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{assessment.title}</CardTitle>
                    {assessment.siteAddress && (
                      <CardDescription className="text-sm">{assessment.siteAddress}</CardDescription>
                    )}
                  </div>
                  {getStatusBadge(assessment.status || "draft")}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {assessment.assessmentDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(parseISO(assessment.assessmentDate), "dd/MM/yyyy")}
                    </div>
                  )}
                  {assessment.assessedBy && (
                    <div>By: {assessment.assessedBy}</div>
                  )}
                </div>
                {assessment.methodStatement && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{assessment.methodStatement}</p>
                )}
                <div className="flex justify-end gap-1 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(assessment)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(assessment.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
