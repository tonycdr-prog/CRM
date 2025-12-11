import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Clock, 
  AlertTriangle,
  Phone,
  Search,
  Timer,
  Shield
} from "lucide-react";
import type { DbSLA, DbClient, DbContract } from "@shared/schema";

export default function SLAs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSLA, setEditingSLA] = useState<DbSLA | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    clientId: "",
    contractId: "",
    name: "",
    description: "",
    priority: "standard",
    responseTimeHours: "4",
    resolutionTimeHours: "24",
    escalationLevel1Hours: "",
    escalationLevel1Contact: "",
    escalationLevel2Hours: "",
    escalationLevel2Contact: "",
    escalationLevel3Hours: "",
    escalationLevel3Contact: "",
    serviceHours: "business",
    businessHoursStart: "09:00",
    businessHoursEnd: "17:00",
    excludeWeekends: true,
    excludeHolidays: true,
    penaltyClause: "",
    penaltyAmount: "",
    isActive: true,
    effectiveFrom: "",
    effectiveTo: "",
    notes: "",
  });

  const { data: slas = [], isLoading } = useQuery<DbSLA[]>({
    queryKey: ["/api/slas", user?.id],
    enabled: !!user?.id,
  });

  const { data: clients = [] } = useQuery<DbClient[]>({
    queryKey: ["/api/clients", user?.id],
    enabled: !!user?.id,
  });

  const { data: contracts = [] } = useQuery<DbContract[]>({
    queryKey: ["/api/contracts", user?.id],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/slas", { 
      ...data, 
      userId: user?.id,
      responseTimeHours: parseInt(data.responseTimeHours),
      resolutionTimeHours: data.resolutionTimeHours ? parseInt(data.resolutionTimeHours) : null,
      escalationLevel1Hours: data.escalationLevel1Hours ? parseInt(data.escalationLevel1Hours) : null,
      escalationLevel2Hours: data.escalationLevel2Hours ? parseInt(data.escalationLevel2Hours) : null,
      escalationLevel3Hours: data.escalationLevel3Hours ? parseInt(data.escalationLevel3Hours) : null,
      penaltyAmount: data.penaltyAmount ? parseFloat(data.penaltyAmount) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slas", user?.id] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "SLA created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) => apiRequest("PATCH", `/api/slas/${id}`, {
      ...data,
      responseTimeHours: parseInt(data.responseTimeHours),
      resolutionTimeHours: data.resolutionTimeHours ? parseInt(data.resolutionTimeHours) : null,
      escalationLevel1Hours: data.escalationLevel1Hours ? parseInt(data.escalationLevel1Hours) : null,
      escalationLevel2Hours: data.escalationLevel2Hours ? parseInt(data.escalationLevel2Hours) : null,
      escalationLevel3Hours: data.escalationLevel3Hours ? parseInt(data.escalationLevel3Hours) : null,
      penaltyAmount: data.penaltyAmount ? parseFloat(data.penaltyAmount) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slas", user?.id] });
      setIsDialogOpen(false);
      setEditingSLA(null);
      resetForm();
      toast({ title: "SLA updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/slas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slas", user?.id] });
      toast({ title: "SLA deleted" });
    },
  });

  const resetForm = () => {
    setFormData({
      clientId: "",
      contractId: "",
      name: "",
      description: "",
      priority: "standard",
      responseTimeHours: "4",
      resolutionTimeHours: "24",
      escalationLevel1Hours: "",
      escalationLevel1Contact: "",
      escalationLevel2Hours: "",
      escalationLevel2Contact: "",
      escalationLevel3Hours: "",
      escalationLevel3Contact: "",
      serviceHours: "business",
      businessHoursStart: "09:00",
      businessHoursEnd: "17:00",
      excludeWeekends: true,
      excludeHolidays: true,
      penaltyClause: "",
      penaltyAmount: "",
      isActive: true,
      effectiveFrom: "",
      effectiveTo: "",
      notes: "",
    });
  };

  const handleEdit = (sla: DbSLA) => {
    setEditingSLA(sla);
    setFormData({
      clientId: sla.clientId || "",
      contractId: sla.contractId || "",
      name: sla.name,
      description: sla.description || "",
      priority: sla.priority || "standard",
      responseTimeHours: String(sla.responseTimeHours),
      resolutionTimeHours: sla.resolutionTimeHours ? String(sla.resolutionTimeHours) : "",
      escalationLevel1Hours: sla.escalationLevel1Hours ? String(sla.escalationLevel1Hours) : "",
      escalationLevel1Contact: sla.escalationLevel1Contact || "",
      escalationLevel2Hours: sla.escalationLevel2Hours ? String(sla.escalationLevel2Hours) : "",
      escalationLevel2Contact: sla.escalationLevel2Contact || "",
      escalationLevel3Hours: sla.escalationLevel3Hours ? String(sla.escalationLevel3Hours) : "",
      escalationLevel3Contact: sla.escalationLevel3Contact || "",
      serviceHours: sla.serviceHours || "business",
      businessHoursStart: sla.businessHoursStart || "09:00",
      businessHoursEnd: sla.businessHoursEnd || "17:00",
      excludeWeekends: sla.excludeWeekends ?? true,
      excludeHolidays: sla.excludeHolidays ?? true,
      penaltyClause: sla.penaltyClause || "",
      penaltyAmount: sla.penaltyAmount ? String(sla.penaltyAmount) : "",
      isActive: sla.isActive ?? true,
      effectiveFrom: sla.effectiveFrom || "",
      effectiveTo: sla.effectiveTo || "",
      notes: sla.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSLA) {
      updateMutation.mutate({ id: editingSLA.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "No client";
    const client = clients.find(c => c.id === clientId);
    return client?.companyName || "Unknown";
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case "emergency": return <Badge variant="destructive">Emergency</Badge>;
      case "urgent": return <Badge className="bg-orange-500">Urgent</Badge>;
      case "standard": return <Badge variant="secondary">Standard</Badge>;
      case "low": return <Badge variant="outline">Low</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const filteredSLAs = slas.filter(sla =>
    sla.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sla.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64" data-testid="loading-state">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-slas">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Service Level Agreements</h1>
          <p className="text-muted-foreground">Define response times, resolution targets, and escalation procedures</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingSLA(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-sla">
              <Plus className="w-4 h-4 mr-2" />
              Add SLA
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">{editingSLA ? "Edit SLA" : "New Service Level Agreement"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>SLA Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required data-testid="input-name" />
                </div>
                <div>
                  <Label>Client</Label>
                  <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                    <SelectTrigger data-testid="select-client">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Contract</Label>
                  <Select value={formData.contractId} onValueChange={(v) => setFormData({ ...formData, contractId: v })}>
                    <SelectTrigger data-testid="select-contract">
                      <SelectValue placeholder="Select contract" />
                    </SelectTrigger>
                    <SelectContent>
                      {contracts.map(contract => (
                        <SelectItem key={contract.id} value={contract.id}>{contract.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({ ...formData, isActive: v })} data-testid="switch-active" />
                  <Label>Active</Label>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} data-testid="input-description" />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Timer className="w-4 h-4" /> Response & Resolution Times</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Response Time (hours) *</Label>
                    <Input type="number" value={formData.responseTimeHours} onChange={(e) => setFormData({ ...formData, responseTimeHours: e.target.value })} required data-testid="input-response-time" />
                  </div>
                  <div>
                    <Label>Resolution Time (hours)</Label>
                    <Input type="number" value={formData.resolutionTimeHours} onChange={(e) => setFormData({ ...formData, resolutionTimeHours: e.target.value })} data-testid="input-resolution-time" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Phone className="w-4 h-4" /> Escalation Levels</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Level 1 (hours)</Label>
                    <Input type="number" value={formData.escalationLevel1Hours} onChange={(e) => setFormData({ ...formData, escalationLevel1Hours: e.target.value })} data-testid="input-esc1-hours" />
                  </div>
                  <div>
                    <Label>Level 1 Contact</Label>
                    <Input value={formData.escalationLevel1Contact} onChange={(e) => setFormData({ ...formData, escalationLevel1Contact: e.target.value })} data-testid="input-esc1-contact" />
                  </div>
                  <div>
                    <Label>Level 2 (hours)</Label>
                    <Input type="number" value={formData.escalationLevel2Hours} onChange={(e) => setFormData({ ...formData, escalationLevel2Hours: e.target.value })} data-testid="input-esc2-hours" />
                  </div>
                  <div>
                    <Label>Level 2 Contact</Label>
                    <Input value={formData.escalationLevel2Contact} onChange={(e) => setFormData({ ...formData, escalationLevel2Contact: e.target.value })} data-testid="input-esc2-contact" />
                  </div>
                  <div>
                    <Label>Level 3 (hours)</Label>
                    <Input type="number" value={formData.escalationLevel3Hours} onChange={(e) => setFormData({ ...formData, escalationLevel3Hours: e.target.value })} data-testid="input-esc3-hours" />
                  </div>
                  <div>
                    <Label>Level 3 Contact</Label>
                    <Input value={formData.escalationLevel3Contact} onChange={(e) => setFormData({ ...formData, escalationLevel3Contact: e.target.value })} data-testid="input-esc3-contact" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Service Hours</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Service Hours</Label>
                    <Select value={formData.serviceHours} onValueChange={(v) => setFormData({ ...formData, serviceHours: v })}>
                      <SelectTrigger data-testid="select-service-hours">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24x7">24x7</SelectItem>
                        <SelectItem value="business">Business Hours</SelectItem>
                        <SelectItem value="extended">Extended Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Start Time</Label>
                    <Input type="time" value={formData.businessHoursStart} onChange={(e) => setFormData({ ...formData, businessHoursStart: e.target.value })} data-testid="input-start-time" />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input type="time" value={formData.businessHoursEnd} onChange={(e) => setFormData({ ...formData, businessHoursEnd: e.target.value })} data-testid="input-end-time" />
                  </div>
                </div>
                <div className="flex gap-6 mt-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.excludeWeekends} onCheckedChange={(v) => setFormData({ ...formData, excludeWeekends: v })} data-testid="switch-weekends" />
                    <Label>Exclude Weekends</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.excludeHolidays} onCheckedChange={(v) => setFormData({ ...formData, excludeHolidays: v })} data-testid="switch-holidays" />
                    <Label>Exclude Holidays</Label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Penalties</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Penalty Clause</Label>
                    <Textarea value={formData.penaltyClause} onChange={(e) => setFormData({ ...formData, penaltyClause: e.target.value })} data-testid="input-penalty-clause" />
                  </div>
                  <div>
                    <Label>Penalty Amount (GBP)</Label>
                    <Input type="number" step="0.01" value={formData.penaltyAmount} onChange={(e) => setFormData({ ...formData, penaltyAmount: e.target.value })} data-testid="input-penalty-amount" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Effective From</Label>
                    <Input type="date" value={formData.effectiveFrom} onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })} data-testid="input-effective-from" />
                  </div>
                  <div>
                    <Label>Effective To</Label>
                    <Input type="date" value={formData.effectiveTo} onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })} data-testid="input-effective-to" />
                  </div>
                  <div className="col-span-2">
                    <Label>Notes</Label>
                    <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} data-testid="input-notes" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {editingSLA ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search SLAs..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Badge variant="secondary" data-testid="badge-count">{filteredSLAs.length} SLAs</Badge>
      </div>

      {filteredSLAs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground" data-testid="text-empty-state">No service level agreements found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSLAs.map((sla) => (
            <Card key={sla.id} data-testid={`card-sla-${sla.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2" data-testid={`text-name-${sla.id}`}>
                      <Shield className="w-5 h-5" />
                      {sla.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{getClientName(sla.clientId)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(sla.priority)}
                    {sla.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(sla)} data-testid={`button-edit-${sla.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(sla.id)} data-testid={`button-delete-${sla.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sla.description && <p className="text-sm mb-3">{sla.description}</p>}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Response: {sla.responseTimeHours}h</span>
                  </div>
                  {sla.resolutionTimeHours && (
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-muted-foreground" />
                      <span>Resolution: {sla.resolutionTimeHours}h</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{sla.serviceHours === "24x7" ? "24/7" : `${sla.businessHoursStart}-${sla.businessHoursEnd}`}</span>
                  </div>
                  {sla.penaltyAmount && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                      <span>Penalty: £{sla.penaltyAmount}</span>
                    </div>
                  )}
                </div>
                {(sla.escalationLevel1Contact || sla.escalationLevel2Contact || sla.escalationLevel3Contact) && (
                  <div className="flex gap-2 mt-3">
                    {sla.escalationLevel1Contact && <Badge variant="outline">L1: {sla.escalationLevel1Contact}</Badge>}
                    {sla.escalationLevel2Contact && <Badge variant="outline">L2: {sla.escalationLevel2Contact}</Badge>}
                    {sla.escalationLevel3Contact && <Badge variant="outline">L3: {sla.escalationLevel3Contact}</Badge>}
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
