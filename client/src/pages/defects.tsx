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
import { Plus, Pencil, Trash2, AlertOctagon, Calendar, MapPin, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { DbDefect } from "@shared/schema";

export default function DefectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDefect, setEditingDefect] = useState<DbDefect | null>(null);
  const [formData, setFormData] = useState({
    defectNumber: "",
    siteAddress: "",
    location: "",
    damperRef: "",
    category: "",
    severity: "medium",
    description: "",
    discoveredDate: format(new Date(), "yyyy-MM-dd"),
    discoveredBy: "",
    status: "open",
    resolution: "",
    resolvedDate: "",
    resolvedBy: "",
    estimatedCost: 0,
    notes: "",
  });

  const { data: defects = [], isLoading } = useQuery<DbDefect[]>({
    queryKey: ["/api/defects", user?.id],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/defects", { ...data, userId: user?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/defects", user?.id] });
      toast({ title: "Defect logged successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to log defect", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) => apiRequest("PATCH", `/api/defects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/defects", user?.id] });
      toast({ title: "Defect updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to update defect", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/defects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/defects", user?.id] });
      toast({ title: "Defect deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete defect", variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({
      defectNumber: "", siteAddress: "", location: "", damperRef: "", category: "",
      severity: "medium", description: "", discoveredDate: format(new Date(), "yyyy-MM-dd"),
      discoveredBy: "", status: "open", resolution: "", resolvedDate: "", resolvedBy: "",
      estimatedCost: 0, notes: "",
    });
    setEditingDefect(null);
  };

  const handleEdit = (defect: DbDefect) => {
    setEditingDefect(defect);
    setFormData({
      defectNumber: defect.defectNumber || "",
      siteAddress: defect.siteAddress || "",
      location: defect.location || "",
      damperRef: defect.damperRef || "",
      category: defect.category || "",
      severity: defect.severity || "medium",
      description: defect.description || "",
      discoveredDate: defect.discoveredDate || format(new Date(), "yyyy-MM-dd"),
      discoveredBy: defect.discoveredBy || "",
      status: defect.status || "open",
      resolution: defect.resolution || "",
      resolvedDate: defect.resolvedDate || "",
      resolvedBy: defect.resolvedBy || "",
      estimatedCost: defect.estimatedCost || 0,
      notes: defect.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.defectNumber || !formData.description) {
      toast({ title: "Please enter defect number and description", variant: "destructive" });
      return;
    }
    if (editingDefect) {
      updateMutation.mutate({ id: editingDefect.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getSeverityBadge = (severity: string | null) => {
    const colors: Record<string, string> = {
      critical: "bg-red-500/10 text-red-500",
      high: "bg-orange-500/10 text-orange-500",
      medium: "bg-yellow-500/10 text-yellow-500",
      low: "bg-green-500/10 text-green-500",
    };
    return colors[severity || "medium"] || "bg-muted text-muted-foreground";
  };

  const getStatusBadge = (status: string | null) => {
    const colors: Record<string, string> = {
      open: "bg-red-500/10 text-red-500",
      quoted: "bg-blue-500/10 text-blue-500",
      scheduled: "bg-purple-500/10 text-purple-500",
      in_progress: "bg-yellow-500/10 text-yellow-500",
      resolved: "bg-green-500/10 text-green-500",
      closed: "bg-gray-500/10 text-gray-500",
    };
    return colors[status || "open"] || "bg-muted text-muted-foreground";
  };

  const getCategoryBadge = (category: string | null) => {
    const colors: Record<string, string> = {
      damper: "bg-blue-500/10 text-blue-500",
      actuator: "bg-green-500/10 text-green-500",
      controls: "bg-purple-500/10 text-purple-500",
      ductwork: "bg-orange-500/10 text-orange-500",
      access: "bg-cyan-500/10 text-cyan-500",
      other: "bg-gray-500/10 text-gray-500",
    };
    return colors[category || ""] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <AlertOctagon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Defect Register</h1>
            <p className="text-muted-foreground">Track issues found during inspections</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-defect"><Plus className="w-4 h-4 mr-2" />Log Defect</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">{editingDefect ? "Edit Defect" : "Log Defect"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defectNumber">Defect Number *</Label>
                  <Input id="defectNumber" value={formData.defectNumber} onChange={(e) => setFormData({ ...formData, defectNumber: e.target.value })} placeholder="DEF-001" data-testid="input-defect-number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
                    <SelectTrigger data-testid="select-severity"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteAddress">Site Address</Label>
                <Input id="siteAddress" value={formData.siteAddress} onChange={(e) => setFormData({ ...formData, siteAddress: e.target.value })} data-testid="input-site-address" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location (Floor/Zone)</Label>
                  <Input id="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Floor 3, Zone A" data-testid="input-location" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="damperRef">Damper Reference</Label>
                  <Input id="damperRef" value={formData.damperRef} onChange={(e) => setFormData({ ...formData, damperRef: e.target.value })} placeholder="D-301" data-testid="input-damper-ref" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger data-testid="select-category"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="damper">Damper</SelectItem>
                      <SelectItem value="actuator">Actuator</SelectItem>
                      <SelectItem value="controls">Controls</SelectItem>
                      <SelectItem value="ductwork">Ductwork</SelectItem>
                      <SelectItem value="access">Access</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Describe the defect..." data-testid="input-description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discoveredDate">Discovered Date</Label>
                  <Input id="discoveredDate" type="date" value={formData.discoveredDate} onChange={(e) => setFormData({ ...formData, discoveredDate: e.target.value })} data-testid="input-discovered-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discoveredBy">Discovered By</Label>
                  <Input id="discoveredBy" value={formData.discoveredBy} onChange={(e) => setFormData({ ...formData, discoveredBy: e.target.value })} data-testid="input-discovered-by" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedCost">Estimated Cost (£)</Label>
                  <Input id="estimatedCost" type="number" step="0.01" value={formData.estimatedCost} onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })} data-testid="input-estimated-cost" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution</Label>
                <Textarea id="resolution" value={formData.resolution} onChange={(e) => setFormData({ ...formData, resolution: e.target.value })} rows={2} placeholder="How was this resolved?" data-testid="input-resolution" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="resolvedDate">Resolved Date</Label>
                  <Input id="resolvedDate" type="date" value={formData.resolvedDate} onChange={(e) => setFormData({ ...formData, resolvedDate: e.target.value })} data-testid="input-resolved-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resolvedBy">Resolved By</Label>
                  <Input id="resolvedBy" value={formData.resolvedBy} onChange={(e) => setFormData({ ...formData, resolvedBy: e.target.value })} data-testid="input-resolved-by" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} data-testid="input-notes" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} data-testid="button-cancel">Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                {editingDefect ? "Update" : "Log Defect"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading defects...</div>
      ) : defects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertOctagon className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No defects logged</h3>
            <p className="text-muted-foreground mb-4">Log defects found during inspections to track remediation</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {defects.map((defect) => (
            <Card key={defect.id} data-testid={`card-defect-${defect.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-lg" data-testid={`text-number-${defect.id}`}>{defect.defectNumber}</CardTitle>
                    <div className="flex gap-2">
                      <Badge className={getSeverityBadge(defect.severity)} data-testid={`badge-severity-${defect.id}`}>
                        {defect.severity}
                      </Badge>
                      <Badge className={getStatusBadge(defect.status)} data-testid={`badge-status-${defect.id}`}>
                        {(defect.status || "open").replace("_", " ")}
                      </Badge>
                      {defect.category && (
                        <Badge className={getCategoryBadge(defect.category)}>
                          {defect.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(defect)} data-testid={`button-edit-${defect.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(defect.id)} data-testid={`button-delete-${defect.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3" data-testid={`text-description-${defect.id}`}>{defect.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {defect.siteAddress && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{defect.siteAddress}</span>
                    </div>
                  )}
                  {defect.location && (
                    <span>Location: {defect.location}</span>
                  )}
                  {defect.damperRef && (
                    <span>Damper: {defect.damperRef}</span>
                  )}
                  {defect.discoveredDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{format(parseISO(defect.discoveredDate), "dd MMM yyyy")}</span>
                    </div>
                  )}
                  {defect.discoveredBy && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{defect.discoveredBy}</span>
                    </div>
                  )}
                  {(defect.estimatedCost || 0) > 0 && (
                    <span>Est. Cost: £{defect.estimatedCost?.toFixed(2)}</span>
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
