import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Wrench, AlertCircle, Trash2 } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import type { DbEquipment } from "@shared/schema";

export default function Equipment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    assetTag: "",
    name: "",
    category: "tool",
    manufacturer: "",
    model: "",
    serialNumber: "",
    purchaseDate: "",
    purchasePrice: "",
    calibrationDue: "",
    maintenanceDue: "",
    location: "",
    notes: "",
  });

  const { data: equipment = [], isLoading } = useQuery<DbEquipment[]>({
    queryKey: ["/api/equipment"],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/equipment", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Equipment added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add equipment", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/equipment/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({ title: "Equipment deleted" });
    },
  });

  const resetForm = () => {
    setFormData({
      assetTag: "",
      name: "",
      category: "tool",
      manufacturer: "",
      model: "",
      serialNumber: "",
      purchaseDate: "",
      purchasePrice: "",
      calibrationDue: "",
      maintenanceDue: "",
      location: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      userId: user?.id,
      purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
    });
  };

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      tool: "bg-blue-500/10 text-blue-500",
      meter: "bg-green-500/10 text-green-500",
      ppe: "bg-yellow-500/10 text-yellow-500",
      vehicle: "bg-purple-500/10 text-purple-500",
      other: "bg-gray-500/10 text-gray-500",
    };
    return <Badge className={styles[category] || styles.other}>{category.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (item: DbEquipment) => {
    if (item.calibrationDue) {
      const daysUntil = differenceInDays(parseISO(item.calibrationDue), new Date());
      if (daysUntil < 0) return <Badge variant="destructive">Calibration Overdue</Badge>;
      if (daysUntil <= 30) return <Badge className="bg-yellow-500/10 text-yellow-500">Calibration Due Soon</Badge>;
    }
    if (item.maintenanceDue) {
      const daysUntil = differenceInDays(parseISO(item.maintenanceDue), new Date());
      if (daysUntil < 0) return <Badge variant="destructive">Maintenance Overdue</Badge>;
      if (daysUntil <= 30) return <Badge className="bg-yellow-500/10 text-yellow-500">Maintenance Due Soon</Badge>;
    }
    return <Badge className="bg-green-500/10 text-green-500">OK</Badge>;
  };

  const overdueCalibrations = equipment.filter(e => 
    e.calibrationDue && differenceInDays(parseISO(e.calibrationDue), new Date()) < 0
  ).length;

  const upcomingCalibrations = equipment.filter(e => 
    e.calibrationDue && differenceInDays(parseISO(e.calibrationDue), new Date()) <= 30 && differenceInDays(parseISO(e.calibrationDue), new Date()) >= 0
  ).length;

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Equipment & Assets</h1>
          <p className="text-muted-foreground">Track tools, meters, and calibration schedules</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-equipment">
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Equipment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Asset Tag *</Label>
                  <Input
                    value={formData.assetTag}
                    onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                    placeholder="TOOL-001"
                    required
                    data-testid="input-asset-tag"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tool">Tool</SelectItem>
                      <SelectItem value="meter">Meter</SelectItem>
                      <SelectItem value="ppe">PPE</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Anemometer"
                  required
                  data-testid="input-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Manufacturer</Label>
                  <Input
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="Testo"
                    data-testid="input-manufacturer"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="405i"
                    data-testid="input-model"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Serial Number</Label>
                  <Input
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    data-testid="input-serial"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Purchase Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    data-testid="input-price"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Calibration Due</Label>
                  <Input
                    type="date"
                    value={formData.calibrationDue}
                    onChange={(e) => setFormData({ ...formData, calibrationDue: e.target.value })}
                    data-testid="input-calibration-due"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maintenance Due</Label>
                  <Input
                    type="date"
                    value={formData.maintenanceDue}
                    onChange={(e) => setFormData({ ...formData, maintenanceDue: e.target.value })}
                    data-testid="input-maintenance-due"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Van 1 / Office"
                  data-testid="input-location"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-equipment">
                  {createMutation.isPending ? "Saving..." : "Save Equipment"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-equipment">{equipment.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Overdue Calibrations</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-overdue-calibrations">{overdueCalibrations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Due This Month</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500" data-testid="text-upcoming-calibrations">{upcomingCalibrations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-value">
              £{equipment.reduce((sum, e) => sum + (e.purchasePrice || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipment List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Tag</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Manufacturer/Model</TableHead>
                <TableHead>Calibration Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No equipment added yet. Click "Add Equipment" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                equipment.map((item) => (
                  <TableRow key={item.id} data-testid={`row-equipment-${item.id}`}>
                    <TableCell className="font-mono font-medium">{item.assetTag}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{getCategoryBadge(item.category || "other")}</TableCell>
                    <TableCell>
                      {item.manufacturer && item.model
                        ? `${item.manufacturer} ${item.model}`
                        : item.manufacturer || item.model || "-"}
                    </TableCell>
                    <TableCell>
                      {item.calibrationDue ? format(parseISO(item.calibrationDue), "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(item)}</TableCell>
                    <TableCell>{item.location || "-"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(item.id)}
                        data-testid={`button-delete-equipment-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
