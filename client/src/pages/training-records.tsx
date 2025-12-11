import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GraduationCap, Calendar, User, Award } from "lucide-react";
import { format, parseISO, isPast, differenceInDays } from "date-fns";
import type { DbTrainingRecord } from "@shared/schema";

export default function TrainingRecordsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DbTrainingRecord | null>(null);
  const [formData, setFormData] = useState({
    employeeName: "",
    employeeId: "",
    courseName: "",
    courseType: "",
    provider: "",
    completedDate: "",
    expiryDate: "",
    certificateNumber: "",
    status: "scheduled",
    score: "",
    passingScore: "",
    duration: "",
    cost: "",
    reimbursed: false,
    notes: "",
  });

  const { data: trainingRecords = [], isLoading } = useQuery<DbTrainingRecord[]>({
    queryKey: ["/api/training-records", user?.id],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/training-records", { 
      ...data, 
      userId: user?.id,
      score: data.score ? parseFloat(data.score) : null,
      passingScore: data.passingScore ? parseFloat(data.passingScore) : null,
      cost: data.cost ? parseFloat(data.cost) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-records", user?.id] });
      toast({ title: "Training record created successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to create training record", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/training-records/${id}`, {
      ...data,
      score: data.score ? parseFloat(data.score) : null,
      passingScore: data.passingScore ? parseFloat(data.passingScore) : null,
      cost: data.cost ? parseFloat(data.cost) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-records", user?.id] });
      toast({ title: "Training record updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to update training record", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/training-records/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-records", user?.id] });
      toast({ title: "Training record deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete training record", variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({
      employeeName: "", employeeId: "", courseName: "", courseType: "", provider: "",
      completedDate: "", expiryDate: "", certificateNumber: "", status: "scheduled",
      score: "", passingScore: "", duration: "", cost: "", reimbursed: false, notes: "",
    });
    setEditingRecord(null);
  };

  const handleEdit = (record: DbTrainingRecord) => {
    setEditingRecord(record);
    setFormData({
      employeeName: record.employeeName || "",
      employeeId: record.employeeId || "",
      courseName: record.courseName || "",
      courseType: record.courseType || "",
      provider: record.provider || "",
      completedDate: record.completedDate || "",
      expiryDate: record.expiryDate || "",
      certificateNumber: record.certificateNumber || "",
      status: record.status || "scheduled",
      score: record.score?.toString() || "",
      passingScore: record.passingScore?.toString() || "",
      duration: record.duration || "",
      cost: record.cost?.toString() || "",
      reimbursed: record.reimbursed || false,
      notes: record.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.employeeName || !formData.courseName) {
      toast({ title: "Please enter employee name and course name", variant: "destructive" });
      return;
    }
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const colors: Record<string, string> = {
      scheduled: "bg-blue-500/10 text-blue-500",
      in_progress: "bg-yellow-500/10 text-yellow-500",
      completed: "bg-green-500/10 text-green-500",
      expired: "bg-red-500/10 text-red-500",
      failed: "bg-red-500/10 text-red-500",
    };
    return colors[status || "scheduled"] || "bg-muted text-muted-foreground";
  };

  const getExpiryBadge = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const expiry = parseISO(expiryDate);
    const daysUntil = differenceInDays(expiry, new Date());
    
    if (isPast(expiry)) {
      return <Badge className="bg-red-500/10 text-red-500">Expired</Badge>;
    } else if (daysUntil <= 30) {
      return <Badge className="bg-orange-500/10 text-orange-500">Expires in {daysUntil} days</Badge>;
    } else if (daysUntil <= 90) {
      return <Badge className="bg-yellow-500/10 text-yellow-500">Expires in {daysUntil} days</Badge>;
    }
    return null;
  };

  const getCourseTypeBadge = (courseType: string | null) => {
    const colors: Record<string, string> = {
      internal: "bg-purple-500/10 text-purple-500",
      external: "bg-blue-500/10 text-blue-500",
      online: "bg-cyan-500/10 text-cyan-500",
      practical: "bg-green-500/10 text-green-500",
    };
    return colors[courseType || ""] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Training Records</h1>
            <p className="text-muted-foreground">Track employee training and certifications</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-training"><Plus className="w-4 h-4 mr-2" />Add Training Record</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">{editingRecord ? "Edit Training Record" : "Add Training Record"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeName">Employee Name *</Label>
                  <Input id="employeeName" value={formData.employeeName} onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })} data-testid="input-employee-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input id="employeeId" value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} data-testid="input-employee-id" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courseName">Course Name *</Label>
                  <Input id="courseName" value={formData.courseName} onChange={(e) => setFormData({ ...formData, courseName: e.target.value })} data-testid="input-course-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseType">Course Type</Label>
                  <Select value={formData.courseType} onValueChange={(value) => setFormData({ ...formData, courseType: value })}>
                    <SelectTrigger data-testid="select-course-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="external">External</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="practical">Practical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Training Provider</Label>
                  <Input id="provider" value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} data-testid="input-provider" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="completedDate">Completed Date</Label>
                  <Input id="completedDate" type="date" value={formData.completedDate} onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })} data-testid="input-completed-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input id="expiryDate" type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} data-testid="input-expiry-date" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="certificateNumber">Certificate Number</Label>
                  <Input id="certificateNumber" value={formData.certificateNumber} onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })} data-testid="input-certificate-number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Input id="duration" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} data-testid="input-duration" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="score">Score</Label>
                  <Input id="score" type="number" value={formData.score} onChange={(e) => setFormData({ ...formData, score: e.target.value })} data-testid="input-score" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passingScore">Passing Score</Label>
                  <Input id="passingScore" type="number" value={formData.passingScore} onChange={(e) => setFormData({ ...formData, passingScore: e.target.value })} data-testid="input-passing-score" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost (£)</Label>
                  <Input id="cost" type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} data-testid="input-cost" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} data-testid="input-notes" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} data-testid="button-cancel">Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                {editingRecord ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading training records...</div>
      ) : trainingRecords.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No training records yet</h3>
            <p className="text-muted-foreground mb-4">Add training records to track employee development</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trainingRecords.map((record) => (
            <Card key={record.id} data-testid={`card-training-${record.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate" data-testid={`text-course-${record.id}`}>{record.courseName}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <User className="w-4 h-4" />
                      <span className="truncate">{record.employeeName}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(record)} data-testid={`button-edit-${record.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(record.id)} data-testid={`button-delete-${record.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getStatusBadge(record.status)} data-testid={`badge-status-${record.id}`}>
                    {(record.status || "scheduled").replace("_", " ")}
                  </Badge>
                  {record.courseType && (
                    <Badge className={getCourseTypeBadge(record.courseType)}>
                      {record.courseType}
                    </Badge>
                  )}
                  {getExpiryBadge(record.expiryDate)}
                </div>
                
                <div className="space-y-1 text-sm">
                  {record.provider && (
                    <div className="text-muted-foreground">Provider: {record.provider}</div>
                  )}
                  {record.completedDate && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Completed: {format(parseISO(record.completedDate), "dd MMM yyyy")}
                    </div>
                  )}
                  {record.certificateNumber && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Award className="w-4 h-4" />
                      Cert: {record.certificateNumber}
                    </div>
                  )}
                  {record.score !== null && (
                    <div className="text-muted-foreground">
                      Score: {record.score}{record.passingScore ? ` / ${record.passingScore}` : ""}%
                    </div>
                  )}
                </div>
                
                {record.cost !== null && record.cost > 0 && (
                  <div className="text-sm font-medium">
                    Cost: £{record.cost.toFixed(2)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
