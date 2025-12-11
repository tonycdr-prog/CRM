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
import { Plus, Pencil, Trash2, Package, AlertTriangle, MapPin, PoundSterling } from "lucide-react";
import type { DbInventory, DbSupplier } from "@shared/schema";

export default function InventoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DbInventory | null>(null);
  const [formData, setFormData] = useState({
    itemName: "",
    partNumber: "",
    description: "",
    category: "",
    supplierId: "",
    location: "",
    quantityInStock: 0,
    minimumStock: 0,
    reorderPoint: 0,
    reorderQuantity: 0,
    unitCost: 0,
    sellPrice: 0,
    unit: "each",
    notes: "",
  });

  const { data: inventory = [], isLoading } = useQuery<DbInventory[]>({
    queryKey: ["/api/inventory", user?.id],
    enabled: !!user?.id,
  });

  const { data: suppliers = [] } = useQuery<DbSupplier[]>({
    queryKey: ["/api/suppliers", user?.id],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/inventory", { ...data, userId: user?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory", user?.id] });
      toast({ title: "Inventory item created successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to create inventory item", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) => apiRequest("PATCH", `/api/inventory/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory", user?.id] });
      toast({ title: "Inventory item updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to update inventory item", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/inventory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory", user?.id] });
      toast({ title: "Inventory item deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete inventory item", variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({
      itemName: "", partNumber: "", description: "", category: "", supplierId: "",
      location: "", quantityInStock: 0, minimumStock: 0, reorderPoint: 0, reorderQuantity: 0,
      unitCost: 0, sellPrice: 0, unit: "each", notes: "",
    });
    setEditingItem(null);
  };

  const handleEdit = (item: DbInventory) => {
    setEditingItem(item);
    setFormData({
      itemName: item.itemName || "",
      partNumber: item.partNumber || "",
      description: item.description || "",
      category: item.category || "",
      supplierId: item.supplierId || "",
      location: item.location || "",
      quantityInStock: item.quantityInStock || 0,
      minimumStock: item.minimumStock || 0,
      reorderPoint: item.reorderPoint || 0,
      reorderQuantity: item.reorderQuantity || 0,
      unitCost: item.unitCost || 0,
      sellPrice: item.sellPrice || 0,
      unit: item.unit || "each",
      notes: item.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.itemName) {
      toast({ title: "Please enter an item name", variant: "destructive" });
      return;
    }
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getCategoryBadge = (category: string | null) => {
    const colors: Record<string, string> = {
      dampers: "bg-blue-500/10 text-blue-500",
      actuators: "bg-green-500/10 text-green-500",
      controls: "bg-purple-500/10 text-purple-500",
      ductwork: "bg-orange-500/10 text-orange-500",
      fixings: "bg-gray-500/10 text-gray-500",
      consumables: "bg-yellow-500/10 text-yellow-500",
    };
    return colors[category || ""] || "bg-muted text-muted-foreground";
  };

  const getStockStatus = (item: DbInventory) => {
    const qty = item.quantityInStock || 0;
    const reorderPoint = item.reorderPoint || 0;
    const minStock = item.minimumStock || 0;

    if (qty <= minStock) {
      return { color: "bg-red-500/10 text-red-500", text: "Critical" };
    } else if (qty <= reorderPoint) {
      return { color: "bg-orange-500/10 text-orange-500", text: "Low Stock" };
    }
    return { color: "bg-green-500/10 text-green-500", text: "In Stock" };
  };

  const getSupplierName = (supplierId: string | null) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    return supplier?.name || "";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Inventory</h1>
            <p className="text-muted-foreground">Track parts and materials stock levels</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-item"><Plus className="w-4 h-4 mr-2" />Add Item</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">{editingItem ? "Edit Item" : "Add Item"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="itemName">Item Name *</Label>
                  <Input id="itemName" value={formData.itemName} onChange={(e) => setFormData({ ...formData, itemName: e.target.value })} data-testid="input-item-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partNumber">Part Number</Label>
                  <Input id="partNumber" value={formData.partNumber} onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })} data-testid="input-part-number" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} data-testid="input-description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger data-testid="select-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dampers">Dampers</SelectItem>
                      <SelectItem value="actuators">Actuators</SelectItem>
                      <SelectItem value="controls">Controls</SelectItem>
                      <SelectItem value="ductwork">Ductwork</SelectItem>
                      <SelectItem value="fixings">Fixings</SelectItem>
                      <SelectItem value="consumables">Consumables</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Supplier</Label>
                  <Select value={formData.supplierId} onValueChange={(value) => setFormData({ ...formData, supplierId: value })}>
                    <SelectTrigger data-testid="select-supplier"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Storage Location</Label>
                  <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
                    <SelectTrigger data-testid="select-location"><SelectValue placeholder="Select location" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="site">Site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                    <SelectTrigger data-testid="select-unit"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="each">Each</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="pack">Pack</SelectItem>
                      <SelectItem value="metre">Metre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantityInStock">In Stock</Label>
                  <Input id="quantityInStock" type="number" value={formData.quantityInStock} onChange={(e) => setFormData({ ...formData, quantityInStock: parseInt(e.target.value) || 0 })} data-testid="input-quantity" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumStock">Min Stock</Label>
                  <Input id="minimumStock" type="number" value={formData.minimumStock} onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) || 0 })} data-testid="input-min-stock" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderPoint">Reorder At</Label>
                  <Input id="reorderPoint" type="number" value={formData.reorderPoint} onChange={(e) => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) || 0 })} data-testid="input-reorder-point" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderQuantity">Reorder Qty</Label>
                  <Input id="reorderQuantity" type="number" value={formData.reorderQuantity} onChange={(e) => setFormData({ ...formData, reorderQuantity: parseInt(e.target.value) || 0 })} data-testid="input-reorder-qty" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitCost">Unit Cost (£)</Label>
                  <Input id="unitCost" type="number" step="0.01" value={formData.unitCost} onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })} data-testid="input-unit-cost" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellPrice">Sell Price (£)</Label>
                  <Input id="sellPrice" type="number" step="0.01" value={formData.sellPrice} onChange={(e) => setFormData({ ...formData, sellPrice: parseFloat(e.target.value) || 0 })} data-testid="input-sell-price" />
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
                {editingItem ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading inventory...</div>
      ) : inventory.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No inventory items yet</h3>
            <p className="text-muted-foreground mb-4">Add your first inventory item to track stock</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {inventory.map((item) => {
            const stockStatus = getStockStatus(item);
            return (
              <Card key={item.id} data-testid={`card-item-${item.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate" data-testid={`text-name-${item.id}`}>{item.itemName}</CardTitle>
                      {item.partNumber && (
                        <p className="text-sm text-muted-foreground">Part: {item.partNumber}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} data-testid={`button-edit-${item.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)} data-testid={`button-delete-${item.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={stockStatus.color} data-testid={`badge-status-${item.id}`}>
                      {stockStatus.text}
                    </Badge>
                    {item.category && (
                      <Badge className={getCategoryBadge(item.category)}>
                        {item.category}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold" data-testid={`text-quantity-${item.id}`}>
                      {item.quantityInStock} <span className="text-sm font-normal text-muted-foreground">{item.unit}</span>
                    </div>
                    {(item.quantityInStock || 0) <= (item.reorderPoint || 0) && (
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    )}
                  </div>

                  <div className="space-y-1 text-sm">
                    {item.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="capitalize">{item.location}</span>
                      </div>
                    )}
                    {item.supplierId && (
                      <div className="text-muted-foreground">
                        Supplier: {getSupplierName(item.supplierId)}
                      </div>
                    )}
                    {(item.unitCost || 0) > 0 && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <PoundSterling className="w-4 h-4" />
                        <span>{item.unitCost?.toFixed(2)} cost / {item.sellPrice?.toFixed(2) || "-"} sell</span>
                      </div>
                    )}
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
