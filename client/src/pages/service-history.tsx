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
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, History, Wrench, Clock, PoundSterling } from "lucide-react";

interface ServiceHistoryItem {
  id: string;
  userId: string;
  clientId: string | null;
  jobId: string | null;
  equipmentId: string | null;
  serviceDate: string;
  serviceType: string | null;
  technicianName: string | null;
  description: string;
  workPerformed: string | null;
  partsUsed: string | null;
  partsCost: number | null;
  labourHours: number | null;
  labourCost: number | null;
  totalCost: number | null;
  outcome: string | null;
  nextServiceDue: string | null;
  recommendations: string | null;
  notes: string | null;
  createdAt: string;
}

const defaultFormData = {
  serviceDate: new Date().toISOString().split('T')[0],
  serviceType: "maintenance",
  technicianName: "",
  description: "",
  workPerformed: "",
  partsUsed: "",
  partsCost: "",
  labourHours: "",
  labourCost: "",
  outcome: "completed",
  nextServiceDue: "",
  recommendations: "",
  notes: "",
};

export default function ServiceHistoryPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceHistoryItem | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const { toast } = useToast();

  const userId = "demo-user";

  const { data: historyItems = [], isLoading } = useQuery<ServiceHistoryItem[]>({
    queryKey: ["/api/service-history", userId],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/service-history", { ...data, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-history", userId] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Service record created successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/service-history/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-history", userId] });
      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
      toast({ title: "Service record updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/service-history/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-history", userId] });
      toast({ title: "Service record deleted successfully" });
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingItem(null);
  };

  const handleEdit = (item: ServiceHistoryItem) => {
    setEditingItem(item);
    setFormData({
      serviceDate: item.serviceDate || "",
      serviceType: item.serviceType || "maintenance",
      technicianName: item.technicianName || "",
      description: item.description || "",
      workPerformed: item.workPerformed || "",
      partsUsed: item.partsUsed || "",
      partsCost: item.partsCost?.toString() || "",
      labourHours: item.labourHours?.toString() || "",
      labourCost: item.labourCost?.toString() || "",
      outcome: item.outcome || "completed",
      nextServiceDue: item.nextServiceDue || "",
      recommendations: item.recommendations || "",
      notes: item.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.description || !formData.serviceDate) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    const partsCost = formData.partsCost ? parseFloat(formData.partsCost) : null;
    const labourCost = formData.labourCost ? parseFloat(formData.labourCost) : null;
    const submitData = {
      ...formData,
      partsCost,
      labourHours: formData.labourHours ? parseFloat(formData.labourHours) : null,
      labourCost,
      totalCost: (partsCost || 0) + (labourCost || 0) || null,
    };
    if (editingItem) {
      updateMutation.mutate({ ...submitData, id: editingItem.id });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const getOutcomeBadge = (outcome: string | null) => {
    switch (outcome) {
      case "completed": return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "partial": return <Badge className="bg-amber-100 text-amber-800">Partial</Badge>;
      case "requires_followup": return <Badge className="bg-blue-100 text-blue-800">Follow-up Required</Badge>;
      case "failed": return <Badge variant="destructive">Failed</Badge>;
      default: return null;
    }
  };

  const getTypeBadge = (type: string | null) => {
    switch (type) {
      case "maintenance": return <Badge variant="outline">Maintenance</Badge>;
      case "repair": return <Badge variant="outline" className="text-orange-600">Repair</Badge>;
      case "installation": return <Badge variant="outline" className="text-blue-600">Installation</Badge>;
      case "inspection": return <Badge variant="outline" className="text-purple-600">Inspection</Badge>;
      case "emergency": return <Badge variant="outline" className="text-red-600">Emergency</Badge>;
      default: return null;
    }
  };

  if (isLoading) {
    return <div className="p-6" data-testid="loading-service-history">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6" data-testid="service-history-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title">Service History</h1>
          <p className="text-muted-foreground">Track service and maintenance records</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-service">
              <Plus className="w-4 h-4 mr-2" />
              Add Service Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">{editingItem ? "Edit Service Record" : "Add Service Record"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Service Date *</Label>
                  <Input
                    type="date"
                    value={formData.serviceDate}
                    onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                    data-testid="input-date"
                  />
                </div>
                <div>
                  <Label>Service Type</Label>
                  <Select value={formData.serviceType} onValueChange={(v) => setFormData({ ...formData, serviceType: v })}>
                    <SelectTrigger data-testid="select-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="installation">Installation</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Technician Name</Label>
                <Input
                  value={formData.technicianName}
                  onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                  placeholder="Name of technician"
                  data-testid="input-technician"
                />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Service description"
                  data-testid="input-description"
                />
              </div>
              <div>
                <Label>Work Performed</Label>
                <Textarea
                  value={formData.workPerformed}
                  onChange={(e) => setFormData({ ...formData, workPerformed: e.target.value })}
                  placeholder="Details of work performed"
                  data-testid="input-work"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Parts Used</Label>
                  <Input
                    value={formData.partsUsed}
                    onChange={(e) => setFormData({ ...formData, partsUsed: e.target.value })}
                    placeholder="Parts list"
                    data-testid="input-parts"
                  />
                </div>
                <div>
                  <Label>Parts Cost (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.partsCost}
                    onChange={(e) => setFormData({ ...formData, partsCost: e.target.value })}
                    placeholder="0.00"
                    data-testid="input-parts-cost"
                  />
                </div>
                <div>
                  <Label>Labour Hours</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.labourHours}
                    onChange={(e) => setFormData({ ...formData, labourHours: e.target.value })}
                    placeholder="0"
                    data-testid="input-hours"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Labour Cost (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.labourCost}
                    onChange={(e) => setFormData({ ...formData, labourCost: e.target.value })}
                    placeholder="0.00"
                    data-testid="input-labour-cost"
                  />
                </div>
                <div>
                  <Label>Outcome</Label>
                  <Select value={formData.outcome} onValueChange={(v) => setFormData({ ...formData, outcome: v })}>
                    <SelectTrigger data-testid="select-outcome">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="requires_followup">Requires Follow-up</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Next Service Due</Label>
                <Input
                  type="date"
                  value={formData.nextServiceDue}
                  onChange={(e) => setFormData({ ...formData, nextServiceDue: e.target.value })}
                  data-testid="input-next-service"
                />
              </div>
              <div>
                <Label>Recommendations</Label>
                <Textarea
                  value={formData.recommendations}
                  onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                  placeholder="Recommendations for future work"
                  data-testid="input-recommendations"
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
                  {editingItem ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {historyItems.length === 0 ? (
        <Card data-testid="empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <History className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No service records yet. Add your first record.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {historyItems.map((item) => (
            <Card key={item.id} data-testid={`card-service-${item.id}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate" data-testid={`text-description-${item.id}`}>
                      {item.description}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {getTypeBadge(item.serviceType)}
                      {getOutcomeBadge(item.outcome)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} data-testid={`button-edit-${item.id}`}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)} data-testid={`button-delete-${item.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span data-testid={`text-date-${item.id}`}>{item.serviceDate}</span>
                  </div>
                  {item.technicianName && (
                    <div className="flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-muted-foreground" />
                      <span data-testid={`text-technician-${item.id}`}>{item.technicianName}</span>
                    </div>
                  )}
                  {item.totalCost !== null && item.totalCost > 0 && (
                    <div className="flex items-center gap-1">
                      <PoundSterling className="w-3 h-3 text-muted-foreground" />
                      <span data-testid={`text-cost-${item.id}`}>£{item.totalCost.toFixed(2)}</span>
                    </div>
                  )}
                  {item.nextServiceDue && (
                    <p className="text-muted-foreground" data-testid={`text-next-${item.id}`}>
                      Next service: {item.nextServiceDue}
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