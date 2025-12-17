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
import { Plus, Edit, Trash2, Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface Warranty {
  id: string;
  userId: string;
  clientId: string | null;
  jobId: string | null;
  equipmentDescription: string;
  manufacturer: string | null;
  modelNumber: string | null;
  serialNumber: string | null;
  installationDate: string;
  warrantyStartDate: string;
  warrantyEndDate: string;
  warrantyType: string | null;
  warrantyProvider: string | null;
  coverageDetails: string | null;
  exclusions: string | null;
  claimProcess: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  referenceNumber: string | null;
  purchasePrice: number | null;
  warrantyCost: number | null;
  claimsCount: number | null;
  lastClaimDate: string | null;
  status: string | null;
  documentPath: string | null;
  reminderDays: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const defaultFormData = {
  equipmentDescription: "",
  manufacturer: "",
  modelNumber: "",
  serialNumber: "",
  installationDate: "",
  warrantyStartDate: "",
  warrantyEndDate: "",
  warrantyType: "standard",
  warrantyProvider: "",
  coverageDetails: "",
  exclusions: "",
  claimProcess: "",
  contactPhone: "",
  contactEmail: "",
  referenceNumber: "",
  purchasePrice: "",
  warrantyCost: "",
  status: "active",
  reminderDays: "30",
  notes: "",
};

export default function WarrantiesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const { toast } = useToast();

  const userId = "demo-user";

  const { data: warranties = [], isLoading } = useQuery<Warranty[]>({
    queryKey: ["/api/warranties"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/warranties", { ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warranties"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Warranty created successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/warranties/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warranties"] });
      setIsDialogOpen(false);
      setEditingWarranty(null);
      resetForm();
      toast({ title: "Warranty updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/warranties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warranties"] });
      toast({ title: "Warranty deleted successfully" });
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingWarranty(null);
  };

  const handleEdit = (warranty: Warranty) => {
    setEditingWarranty(warranty);
    setFormData({
      equipmentDescription: warranty.equipmentDescription || "",
      manufacturer: warranty.manufacturer || "",
      modelNumber: warranty.modelNumber || "",
      serialNumber: warranty.serialNumber || "",
      installationDate: warranty.installationDate || "",
      warrantyStartDate: warranty.warrantyStartDate || "",
      warrantyEndDate: warranty.warrantyEndDate || "",
      warrantyType: warranty.warrantyType || "standard",
      warrantyProvider: warranty.warrantyProvider || "",
      coverageDetails: warranty.coverageDetails || "",
      exclusions: warranty.exclusions || "",
      claimProcess: warranty.claimProcess || "",
      contactPhone: warranty.contactPhone || "",
      contactEmail: warranty.contactEmail || "",
      referenceNumber: warranty.referenceNumber || "",
      purchasePrice: warranty.purchasePrice?.toString() || "",
      warrantyCost: warranty.warrantyCost?.toString() || "",
      status: warranty.status || "active",
      reminderDays: warranty.reminderDays?.toString() || "30",
      notes: warranty.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.equipmentDescription || !formData.warrantyStartDate || !formData.warrantyEndDate || !formData.installationDate) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    const submitData = {
      ...formData,
      purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
      warrantyCost: formData.warrantyCost ? parseFloat(formData.warrantyCost) : null,
      reminderDays: formData.reminderDays ? parseInt(formData.reminderDays) : 30,
    };
    if (editingWarranty) {
      updateMutation.mutate({ ...submitData, id: editingWarranty.id });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const getStatusBadge = (warranty: Warranty) => {
    const endDate = new Date(warranty.warrantyEndDate);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (warranty.status === "void") {
      return <Badge variant="secondary" data-testid={`badge-status-${warranty.id}`}>Void</Badge>;
    }
    if (warranty.status === "claimed") {
      return <Badge className="bg-purple-100 text-purple-800" data-testid={`badge-status-${warranty.id}`}>Claimed</Badge>;
    }
    if (daysRemaining < 0) {
      return <Badge variant="destructive" data-testid={`badge-status-${warranty.id}`}>Expired</Badge>;
    }
    if (daysRemaining <= 30) {
      return (
        <Badge className="bg-amber-100 text-amber-800" data-testid={`badge-status-${warranty.id}`}>
          <AlertTriangle className="w-3 h-3 mr-1" />
          {daysRemaining} days
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-100 text-green-800" data-testid={`badge-status-${warranty.id}`}>
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="p-6" data-testid="loading-warranties">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6" data-testid="warranties-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title">Warranty Tracking</h1>
          <p className="text-muted-foreground">Track equipment warranties and expiration dates</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-warranty">
              <Plus className="w-4 h-4 mr-2" />
              Add Warranty
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">{editingWarranty ? "Edit Warranty" : "Add Warranty"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Equipment Description *</Label>
                <Input
                  value={formData.equipmentDescription}
                  onChange={(e) => setFormData({ ...formData, equipmentDescription: e.target.value })}
                  placeholder="e.g., Smoke Control Damper - Floor 5"
                  data-testid="input-equipment"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Manufacturer</Label>
                  <Input
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="Manufacturer name"
                    data-testid="input-manufacturer"
                  />
                </div>
                <div>
                  <Label>Model Number</Label>
                  <Input
                    value={formData.modelNumber}
                    onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                    placeholder="Model number"
                    data-testid="input-model"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Serial Number</Label>
                  <Input
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="Serial number"
                    data-testid="input-serial"
                  />
                </div>
                <div>
                  <Label>Reference Number</Label>
                  <Input
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    placeholder="Warranty reference"
                    data-testid="input-reference"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Installation Date *</Label>
                  <Input
                    type="date"
                    value={formData.installationDate}
                    onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                    data-testid="input-installation-date"
                  />
                </div>
                <div>
                  <Label>Warranty Start *</Label>
                  <Input
                    type="date"
                    value={formData.warrantyStartDate}
                    onChange={(e) => setFormData({ ...formData, warrantyStartDate: e.target.value })}
                    data-testid="input-start-date"
                  />
                </div>
                <div>
                  <Label>Warranty End *</Label>
                  <Input
                    type="date"
                    value={formData.warrantyEndDate}
                    onChange={(e) => setFormData({ ...formData, warrantyEndDate: e.target.value })}
                    data-testid="input-end-date"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Warranty Type</Label>
                  <Select value={formData.warrantyType} onValueChange={(v) => setFormData({ ...formData, warrantyType: v })}>
                    <SelectTrigger data-testid="select-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="extended">Extended</SelectItem>
                      <SelectItem value="manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="parts_only">Parts Only</SelectItem>
                      <SelectItem value="labour_only">Labour Only</SelectItem>
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="claimed">Claimed</SelectItem>
                      <SelectItem value="void">Void</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Warranty Provider</Label>
                  <Input
                    value={formData.warrantyProvider}
                    onChange={(e) => setFormData({ ...formData, warrantyProvider: e.target.value })}
                    placeholder="Provider name"
                    data-testid="input-provider"
                  />
                </div>
                <div>
                  <Label>Reminder Days Before Expiry</Label>
                  <Input
                    type="number"
                    value={formData.reminderDays}
                    onChange={(e) => setFormData({ ...formData, reminderDays: e.target.value })}
                    placeholder="30"
                    data-testid="input-reminder"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="Support phone"
                    data-testid="input-phone"
                  />
                </div>
                <div>
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="Support email"
                    data-testid="input-email"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Purchase Price (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    placeholder="0.00"
                    data-testid="input-purchase-price"
                  />
                </div>
                <div>
                  <Label>Warranty Cost (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.warrantyCost}
                    onChange={(e) => setFormData({ ...formData, warrantyCost: e.target.value })}
                    placeholder="0.00"
                    data-testid="input-warranty-cost"
                  />
                </div>
              </div>
              <div>
                <Label>Coverage Details</Label>
                <Textarea
                  value={formData.coverageDetails}
                  onChange={(e) => setFormData({ ...formData, coverageDetails: e.target.value })}
                  placeholder="What is covered under this warranty"
                  data-testid="input-coverage"
                />
              </div>
              <div>
                <Label>Exclusions</Label>
                <Textarea
                  value={formData.exclusions}
                  onChange={(e) => setFormData({ ...formData, exclusions: e.target.value })}
                  placeholder="What is not covered"
                  data-testid="input-exclusions"
                />
              </div>
              <div>
                <Label>Claim Process</Label>
                <Textarea
                  value={formData.claimProcess}
                  onChange={(e) => setFormData({ ...formData, claimProcess: e.target.value })}
                  placeholder="How to make a warranty claim"
                  data-testid="input-claim-process"
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
                  {editingWarranty ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {warranties.length === 0 ? (
        <Card data-testid="empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No warranties tracked yet. Add your first warranty.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {warranties.map((warranty) => (
            <Card key={warranty.id} data-testid={`card-warranty-${warranty.id}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate" data-testid={`text-equipment-${warranty.id}`}>
                      {warranty.equipmentDescription}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {getStatusBadge(warranty)}
                      <Badge variant="outline" data-testid={`badge-type-${warranty.id}`}>{warranty.warrantyType}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(warranty)} data-testid={`button-edit-${warranty.id}`}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(warranty.id)} data-testid={`button-delete-${warranty.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {warranty.manufacturer && (
                    <p data-testid={`text-manufacturer-${warranty.id}`}>
                      <span className="text-muted-foreground">Manufacturer:</span> {warranty.manufacturer}
                    </p>
                  )}
                  {warranty.serialNumber && (
                    <p data-testid={`text-serial-${warranty.id}`}>
                      <span className="text-muted-foreground">Serial:</span> {warranty.serialNumber}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span data-testid={`text-dates-${warranty.id}`}>
                      {warranty.warrantyStartDate} to {warranty.warrantyEndDate}
                    </span>
                  </div>
                  {warranty.warrantyProvider && (
                    <p data-testid={`text-provider-${warranty.id}`}>
                      <span className="text-muted-foreground">Provider:</span> {warranty.warrantyProvider}
                    </p>
                  )}
                  {warranty.claimsCount !== null && warranty.claimsCount > 0 && (
                    <p className="text-muted-foreground" data-testid={`text-claims-${warranty.id}`}>
                      {warranty.claimsCount} claim(s) made
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