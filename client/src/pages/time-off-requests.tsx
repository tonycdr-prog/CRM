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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, CalendarDays, Check, X, Clock } from "lucide-react";

interface TimeOffRequest {
  id: string;
  userId: string;
  employeeName: string;
  employeeId: string | null;
  requestType: string | null;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean | null;
  halfDayPeriod: string | null;
  reason: string | null;
  status: string | null;
  approvedBy: string | null;
  approvedDate: string | null;
  rejectionReason: string | null;
  coverArrangements: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  affectsProjects: string | null;
  handoverNotes: string | null;
  notes: string | null;
  createdAt: string;
}

const defaultFormData = {
  employeeName: "",
  employeeId: "",
  requestType: "annual_leave",
  startDate: "",
  endDate: "",
  totalDays: "1",
  isHalfDay: false,
  halfDayPeriod: "",
  reason: "",
  status: "pending",
  approvedBy: "",
  rejectionReason: "",
  coverArrangements: "",
  emergencyContact: "",
  emergencyPhone: "",
  affectsProjects: "",
  handoverNotes: "",
  notes: "",
};

export default function TimeOffRequestsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<TimeOffRequest | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const { toast } = useToast();

  const userId = "demo-user";

  const { data: requests = [], isLoading } = useQuery<TimeOffRequest[]>({
    queryKey: ["/api/time-off-requests", userId],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/time-off-requests", { ...data, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-off-requests", userId] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Time off request created successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/time-off-requests/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-off-requests", userId] });
      setIsDialogOpen(false);
      setEditingRequest(null);
      resetForm();
      toast({ title: "Time off request updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/time-off-requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-off-requests", userId] });
      toast({ title: "Time off request deleted successfully" });
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingRequest(null);
  };

  const handleEdit = (request: TimeOffRequest) => {
    setEditingRequest(request);
    setFormData({
      employeeName: request.employeeName || "",
      employeeId: request.employeeId || "",
      requestType: request.requestType || "annual_leave",
      startDate: request.startDate || "",
      endDate: request.endDate || "",
      totalDays: request.totalDays?.toString() || "1",
      isHalfDay: request.isHalfDay || false,
      halfDayPeriod: request.halfDayPeriod || "",
      reason: request.reason || "",
      status: request.status || "pending",
      approvedBy: request.approvedBy || "",
      rejectionReason: request.rejectionReason || "",
      coverArrangements: request.coverArrangements || "",
      emergencyContact: request.emergencyContact || "",
      emergencyPhone: request.emergencyPhone || "",
      affectsProjects: request.affectsProjects || "",
      handoverNotes: request.handoverNotes || "",
      notes: request.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.employeeName || !formData.startDate || !formData.endDate) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    const submitData = {
      ...formData,
      totalDays: parseFloat(formData.totalDays) || 1,
      approvedDate: formData.status === "approved" ? new Date().toISOString().split('T')[0] : null,
    };
    if (editingRequest) {
      updateMutation.mutate({ ...submitData, id: editingRequest.id });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleQuickAction = (request: TimeOffRequest, newStatus: string) => {
    updateMutation.mutate({
      id: request.id,
      status: newStatus,
      approvedDate: newStatus === "approved" ? new Date().toISOString().split('T')[0] : null,
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending": return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
      case "approved": return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      case "cancelled": return <Badge variant="secondary">Cancelled</Badge>;
      default: return null;
    }
  };

  const getTypeBadge = (type: string | null) => {
    switch (type) {
      case "annual_leave": return <Badge variant="outline">Annual Leave</Badge>;
      case "sick_leave": return <Badge variant="outline" className="text-red-600">Sick Leave</Badge>;
      case "unpaid": return <Badge variant="outline" className="text-gray-600">Unpaid</Badge>;
      case "compassionate": return <Badge variant="outline" className="text-purple-600">Compassionate</Badge>;
      case "training": return <Badge variant="outline" className="text-blue-600">Training</Badge>;
      case "other": return <Badge variant="outline">Other</Badge>;
      default: return null;
    }
  };

  if (isLoading) {
    return <div className="p-6" data-testid="loading-requests">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6" data-testid="time-off-requests-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title">Time Off Requests</h1>
          <p className="text-muted-foreground">Manage employee leave requests</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-request">
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">{editingRequest ? "Edit Request" : "New Time Off Request"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee Name *</Label>
                  <Input
                    value={formData.employeeName}
                    onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                    placeholder="Full name"
                    data-testid="input-employee-name"
                  />
                </div>
                <div>
                  <Label>Employee ID</Label>
                  <Input
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="Employee ID"
                    data-testid="input-employee-id"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Request Type</Label>
                  <Select value={formData.requestType} onValueChange={(v) => setFormData({ ...formData, requestType: v })}>
                    <SelectTrigger data-testid="select-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual_leave">Annual Leave</SelectItem>
                      <SelectItem value="sick_leave">Sick Leave</SelectItem>
                      <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                      <SelectItem value="compassionate">Compassionate Leave</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    data-testid="input-start-date"
                  />
                </div>
                <div>
                  <Label>End Date *</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    data-testid="input-end-date"
                  />
                </div>
                <div>
                  <Label>Total Days</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.totalDays}
                    onChange={(e) => setFormData({ ...formData, totalDays: e.target.value })}
                    placeholder="1"
                    data-testid="input-total-days"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isHalfDay}
                    onCheckedChange={(v) => setFormData({ ...formData, isHalfDay: v })}
                    data-testid="switch-half-day"
                  />
                  <Label>Half Day</Label>
                </div>
                {formData.isHalfDay && (
                  <Select value={formData.halfDayPeriod} onValueChange={(v) => setFormData({ ...formData, halfDayPeriod: v })}>
                    <SelectTrigger className="w-32" data-testid="select-half-day-period">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label>Reason</Label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Reason for time off"
                  data-testid="input-reason"
                />
              </div>
              {formData.status === "approved" && (
                <div>
                  <Label>Approved By</Label>
                  <Input
                    value={formData.approvedBy}
                    onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
                    placeholder="Manager name"
                    data-testid="input-approved-by"
                  />
                </div>
              )}
              {formData.status === "rejected" && (
                <div>
                  <Label>Rejection Reason</Label>
                  <Textarea
                    value={formData.rejectionReason}
                    onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                    placeholder="Reason for rejection"
                    data-testid="input-rejection-reason"
                  />
                </div>
              )}
              <div>
                <Label>Cover Arrangements</Label>
                <Textarea
                  value={formData.coverArrangements}
                  onChange={(e) => setFormData({ ...formData, coverArrangements: e.target.value })}
                  placeholder="Who will cover during absence"
                  data-testid="input-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Emergency Contact</Label>
                  <Input
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="Contact name"
                    data-testid="input-emergency-contact"
                  />
                </div>
                <div>
                  <Label>Emergency Phone</Label>
                  <Input
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    placeholder="Phone number"
                    data-testid="input-emergency-phone"
                  />
                </div>
              </div>
              <div>
                <Label>Handover Notes</Label>
                <Textarea
                  value={formData.handoverNotes}
                  onChange={(e) => setFormData({ ...formData, handoverNotes: e.target.value })}
                  placeholder="Notes for handover"
                  data-testid="input-handover"
                />
              </div>
              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any other notes"
                  data-testid="input-notes"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {editingRequest ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {requests.length === 0 ? (
        <Card data-testid="empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No time off requests yet. Create your first request.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => (
            <Card key={request.id} data-testid={`card-request-${request.id}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate" data-testid={`text-name-${request.id}`}>
                      {request.employeeName}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {getTypeBadge(request.requestType)}
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(request)} data-testid={`button-edit-${request.id}`}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(request.id)} data-testid={`button-delete-${request.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <CalendarDays className="w-3 h-3" />
                    <span data-testid={`text-dates-${request.id}`}>
                      {request.startDate} to {request.endDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span data-testid={`text-days-${request.id}`}>
                      {request.totalDays} day{request.totalDays !== 1 ? 's' : ''}
                      {request.isHalfDay && ` (${request.halfDayPeriod})`}
                    </span>
                  </div>
                  {request.reason && (
                    <p className="text-muted-foreground line-clamp-2" data-testid={`text-reason-${request.id}`}>
                      {request.reason}
                    </p>
                  )}
                  {request.status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleQuickAction(request, "approved")}
                        data-testid={`button-approve-${request.id}`}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleQuickAction(request, "rejected")}
                        data-testid={`button-reject-${request.id}`}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                  {request.approvedBy && (
                    <p className="text-muted-foreground" data-testid={`text-approved-by-${request.id}`}>
                      Approved by: {request.approvedBy}
                    </p>
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