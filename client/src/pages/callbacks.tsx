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
import { Plus, Pencil, Trash2, PhoneCall, Calendar, User, Mail, Phone, Clock, CheckCircle2 } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import type { DbCallback, DbClient, DbJob } from "@shared/schema";

export default function CallbacksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCallback, setEditingCallback] = useState<DbCallback | null>(null);
  const [formData, setFormData] = useState({
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    reason: "",
    category: "general",
    priority: "normal",
    requestedDate: format(new Date(), "yyyy-MM-dd"),
    preferredTime: "",
    assignedTo: "",
    clientId: "",
    jobId: "",
    status: "pending",
    attemptCount: 0,
    outcome: "",
    notes: "",
  });

  const { data: callbacks = [], isLoading } = useQuery<DbCallback[]>({
    queryKey: ["/api/callbacks"],
    enabled: !!user?.id,
  });

  const { data: clients = [] } = useQuery<DbClient[]>({
    queryKey: ["/api/clients"],
    enabled: !!user?.id,
  });

  const { data: jobs = [] } = useQuery<DbJob[]>({
    queryKey: ["/api/jobs"],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/callbacks", { ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/callbacks"] });
      toast({ title: "Callback scheduled successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to create callback", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) => apiRequest("PATCH", `/api/callbacks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/callbacks"] });
      toast({ title: "Callback updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to update callback", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/callbacks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/callbacks"] });
      toast({ title: "Callback deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete callback", variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({
      contactName: "", contactPhone: "", contactEmail: "", reason: "", category: "general",
      priority: "normal", requestedDate: format(new Date(), "yyyy-MM-dd"), preferredTime: "",
      assignedTo: "", clientId: "", jobId: "", status: "pending", attemptCount: 0, outcome: "", notes: "",
    });
    setEditingCallback(null);
  };

  const handleEdit = (callback: DbCallback) => {
    setEditingCallback(callback);
    setFormData({
      contactName: callback.contactName || "",
      contactPhone: callback.contactPhone || "",
      contactEmail: callback.contactEmail || "",
      reason: callback.reason || "",
      category: callback.category || "general",
      priority: callback.priority || "normal",
      requestedDate: callback.requestedDate || format(new Date(), "yyyy-MM-dd"),
      preferredTime: callback.preferredTime || "",
      assignedTo: callback.assignedTo || "",
      clientId: callback.clientId || "",
      jobId: callback.jobId || "",
      status: callback.status || "pending",
      attemptCount: callback.attemptCount || 0,
      outcome: callback.outcome || "",
      notes: callback.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.contactName || !formData.reason) {
      toast({ title: "Please enter contact name and reason", variant: "destructive" });
      return;
    }
    if (editingCallback) {
      updateMutation.mutate({ id: editingCallback.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const markComplete = (callback: DbCallback) => {
    updateMutation.mutate({
      id: callback.id,
      data: {
        ...callback,
        contactName: callback.contactName || "",
        contactPhone: callback.contactPhone || "",
        contactEmail: callback.contactEmail || "",
        reason: callback.reason || "",
        category: callback.category || "general",
        priority: callback.priority || "normal",
        requestedDate: callback.requestedDate || "",
        preferredTime: callback.preferredTime || "",
        assignedTo: callback.assignedTo || "",
        clientId: callback.clientId || "",
        jobId: callback.jobId || "",
        status: "completed",
        attemptCount: (callback.attemptCount || 0) + 1,
        outcome: callback.outcome || "",
        notes: callback.notes || "",
      },
    });
  };

  const getStatusBadge = (status: string | null) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-500",
      attempted: "bg-blue-500/10 text-blue-500",
      completed: "bg-green-500/10 text-green-500",
      cancelled: "bg-gray-500/10 text-gray-500",
      escalated: "bg-red-500/10 text-red-500",
    };
    return colors[status || "pending"] || "bg-muted text-muted-foreground";
  };

  const getCategoryBadge = (category: string | null) => {
    const colors: Record<string, string> = {
      general: "bg-gray-500/10 text-gray-500",
      quote_request: "bg-blue-500/10 text-blue-500",
      complaint: "bg-red-500/10 text-red-500",
      warranty: "bg-purple-500/10 text-purple-500",
      booking: "bg-green-500/10 text-green-500",
      emergency: "bg-red-500/10 text-red-600",
    };
    return colors[category || "general"] || "bg-muted text-muted-foreground";
  };

  const getPriorityBadge = (priority: string | null) => {
    const colors: Record<string, string> = {
      low: "bg-gray-500/10 text-gray-500",
      normal: "bg-blue-500/10 text-blue-500",
      high: "bg-orange-500/10 text-orange-500",
      urgent: "bg-red-500/10 text-red-500",
    };
    return colors[priority || "normal"] || "bg-muted text-muted-foreground";
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "";
    const client = clients.find((c) => c.id === clientId);
    return client?.companyName || "";
  };

  const pendingCallbacks = callbacks.filter((c) => c.status === "pending");
  const overdueCallbacks = pendingCallbacks.filter((c) => c.requestedDate && isPast(parseISO(c.requestedDate)));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <PhoneCall className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Callbacks</h1>
            <p className="text-muted-foreground">Customer follow-up and call scheduling</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-callback"><Plus className="w-4 h-4 mr-2" />New Callback</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">{editingCallback ? "Edit Callback" : "Schedule Callback"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name *</Label>
                <Input id="contactName" value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} data-testid="input-contact-name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone Number</Label>
                  <Input id="contactPhone" value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} data-testid="input-phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input id="contactEmail" type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} data-testid="input-email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Textarea id="reason" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} rows={2} placeholder="Why does this person need a callback?" data-testid="input-reason" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger data-testid="select-category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="quote_request">Quote Request</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                      <SelectItem value="warranty">Warranty</SelectItem>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger data-testid="select-priority"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requestedDate">Callback Date</Label>
                  <Input id="requestedDate" type="date" value={formData.requestedDate} onChange={(e) => setFormData({ ...formData, requestedDate: e.target.value })} data-testid="input-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredTime">Preferred Time</Label>
                  <Input id="preferredTime" value={formData.preferredTime} onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })} placeholder="e.g. Morning, 2pm" data-testid="input-time" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client</Label>
                  <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
                    <SelectTrigger data-testid="select-client"><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Input id="assignedTo" value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })} data-testid="input-assigned" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="attempted">Attempted</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="outcome">Outcome</Label>
                <Textarea id="outcome" value={formData.outcome} onChange={(e) => setFormData({ ...formData, outcome: e.target.value })} rows={2} placeholder="Result of the callback..." data-testid="input-outcome" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} data-testid="input-notes" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} data-testid="button-cancel">Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                {editingCallback ? "Update" : "Schedule"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Callbacks</p>
                <p className="text-2xl font-bold" data-testid="text-pending-count">{pendingCallbacks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold" data-testid="text-overdue-count">{overdueCallbacks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold">{callbacks.filter((c) => c.status === "completed" && c.completedDate === format(new Date(), "yyyy-MM-dd")).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading callbacks...</div>
      ) : callbacks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PhoneCall className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No callbacks scheduled</h3>
            <p className="text-muted-foreground mb-4">Schedule your first callback</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {callbacks.map((callback) => {
            const isOverdue = callback.status === "pending" && callback.requestedDate && isPast(parseISO(callback.requestedDate));
            return (
              <Card key={callback.id} className={isOverdue ? "border-red-500/50" : ""} data-testid={`card-callback-${callback.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg" data-testid={`text-contact-${callback.id}`}>{callback.contactName}</CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getStatusBadge(callback.status)} data-testid={`badge-status-${callback.id}`}>
                            {callback.status}
                          </Badge>
                          <Badge className={getCategoryBadge(callback.category)}>
                            {(callback.category || "general").replace("_", " ")}
                          </Badge>
                          {callback.priority !== "normal" && (
                            <Badge className={getPriorityBadge(callback.priority)}>
                              {callback.priority}
                            </Badge>
                          )}
                          {isOverdue && <Badge className="bg-red-500/10 text-red-500">Overdue</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {callback.status === "pending" && (
                        <Button variant="ghost" size="icon" onClick={() => markComplete(callback)} data-testid={`button-complete-${callback.id}`}>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(callback)} data-testid={`button-edit-${callback.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(callback.id)} data-testid={`button-delete-${callback.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-3" data-testid={`text-reason-${callback.id}`}>{callback.reason}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {callback.contactPhone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        <span>{callback.contactPhone}</span>
                      </div>
                    )}
                    {callback.contactEmail && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{callback.contactEmail}</span>
                      </div>
                    )}
                    {callback.requestedDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{format(parseISO(callback.requestedDate), "dd MMM yyyy")}</span>
                        {callback.preferredTime && <span>({callback.preferredTime})</span>}
                      </div>
                    )}
                    {callback.clientId && <span>Client: {getClientName(callback.clientId)}</span>}
                    {callback.assignedTo && <span>Assigned: {callback.assignedTo}</span>}
                    {(callback.attemptCount || 0) > 0 && <span>Attempts: {callback.attemptCount}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
