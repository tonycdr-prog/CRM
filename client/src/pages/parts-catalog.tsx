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
  Package, 
  Search,
  AlertTriangle,
  DollarSign,
  Boxes
} from "lucide-react";
import type { DbPartsCatalog, DbSupplier } from "@shared/schema";

export default function PartsCatalog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<DbPartsCatalog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [formData, setFormData] = useState({
    supplierId: "",
    partNumber: "",
    name: "",
    description: "",
    category: "general",
    manufacturer: "",
    modelNumber: "",
    unitOfMeasure: "each",
    costPrice: "",
    sellPrice: "",
    markupPercent: "",
    stockQuantity: "0",
    minimumStock: "0",
    reorderQuantity: "",
    leadTimeDays: "",
    location: "",
    barcode: "",
    weight: "",
    dimensions: "",
    compatibleWith: "",
    alternativeParts: "",
    warrantyMonths: "",
    isActive: true,
    notes: "",
  });

  const { data: parts = [], isLoading } = useQuery<DbPartsCatalog[]>({
    queryKey: ["/api/parts-catalog", user?.id],
    enabled: !!user?.id,
  });

  const { data: suppliers = [] } = useQuery<DbSupplier[]>({
    queryKey: ["/api/suppliers", user?.id],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/parts-catalog", { 
      ...data, 
      userId: user?.id,
      costPrice: parseFloat(data.costPrice),
      sellPrice: data.sellPrice ? parseFloat(data.sellPrice) : null,
      markupPercent: data.markupPercent ? parseFloat(data.markupPercent) : null,
      stockQuantity: parseInt(data.stockQuantity),
      minimumStock: parseInt(data.minimumStock),
      reorderQuantity: data.reorderQuantity ? parseInt(data.reorderQuantity) : null,
      leadTimeDays: data.leadTimeDays ? parseInt(data.leadTimeDays) : null,
      weight: data.weight ? parseFloat(data.weight) : null,
      warrantyMonths: data.warrantyMonths ? parseInt(data.warrantyMonths) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts-catalog", user?.id] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Part added to catalog" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) => apiRequest("PATCH", `/api/parts-catalog/${id}`, {
      ...data,
      costPrice: parseFloat(data.costPrice),
      sellPrice: data.sellPrice ? parseFloat(data.sellPrice) : null,
      markupPercent: data.markupPercent ? parseFloat(data.markupPercent) : null,
      stockQuantity: parseInt(data.stockQuantity),
      minimumStock: parseInt(data.minimumStock),
      reorderQuantity: data.reorderQuantity ? parseInt(data.reorderQuantity) : null,
      leadTimeDays: data.leadTimeDays ? parseInt(data.leadTimeDays) : null,
      weight: data.weight ? parseFloat(data.weight) : null,
      warrantyMonths: data.warrantyMonths ? parseInt(data.warrantyMonths) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts-catalog", user?.id] });
      setIsDialogOpen(false);
      setEditingPart(null);
      resetForm();
      toast({ title: "Part updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/parts-catalog/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts-catalog", user?.id] });
      toast({ title: "Part deleted" });
    },
  });

  const resetForm = () => {
    setFormData({
      supplierId: "",
      partNumber: "",
      name: "",
      description: "",
      category: "general",
      manufacturer: "",
      modelNumber: "",
      unitOfMeasure: "each",
      costPrice: "",
      sellPrice: "",
      markupPercent: "",
      stockQuantity: "0",
      minimumStock: "0",
      reorderQuantity: "",
      leadTimeDays: "",
      location: "",
      barcode: "",
      weight: "",
      dimensions: "",
      compatibleWith: "",
      alternativeParts: "",
      warrantyMonths: "",
      isActive: true,
      notes: "",
    });
  };

  const handleEdit = (part: DbPartsCatalog) => {
    setEditingPart(part);
    setFormData({
      supplierId: part.supplierId || "",
      partNumber: part.partNumber,
      name: part.name,
      description: part.description || "",
      category: part.category || "general",
      manufacturer: part.manufacturer || "",
      modelNumber: part.modelNumber || "",
      unitOfMeasure: part.unitOfMeasure || "each",
      costPrice: String(part.costPrice),
      sellPrice: part.sellPrice ? String(part.sellPrice) : "",
      markupPercent: part.markupPercent ? String(part.markupPercent) : "",
      stockQuantity: String(part.stockQuantity || 0),
      minimumStock: String(part.minimumStock || 0),
      reorderQuantity: part.reorderQuantity ? String(part.reorderQuantity) : "",
      leadTimeDays: part.leadTimeDays ? String(part.leadTimeDays) : "",
      location: part.location || "",
      barcode: part.barcode || "",
      weight: part.weight ? String(part.weight) : "",
      dimensions: part.dimensions || "",
      compatibleWith: part.compatibleWith || "",
      alternativeParts: part.alternativeParts || "",
      warrantyMonths: part.warrantyMonths ? String(part.warrantyMonths) : "",
      isActive: part.isActive ?? true,
      notes: part.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPart) {
      updateMutation.mutate({ id: editingPart.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId) return "No supplier";
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || "Unknown";
  };

  const isLowStock = (part: DbPartsCatalog) => {
    return (part.stockQuantity || 0) <= (part.minimumStock || 0);
  };

  const filteredParts = parts.filter(part => {
    const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || part.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: parts.length,
    lowStock: parts.filter(isLowStock).length,
    totalValue: parts.reduce((sum, p) => sum + (p.costPrice * (p.stockQuantity || 0)), 0),
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64" data-testid="loading-state">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-parts-catalog">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Parts Catalog</h1>
          <p className="text-muted-foreground">Manage materials and parts with pricing and stock levels</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingPart(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-part">
              <Plus className="w-4 h-4 mr-2" />
              Add Part
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">{editingPart ? "Edit Part" : "Add New Part"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Part Number *</Label>
                  <Input value={formData.partNumber} onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })} required data-testid="input-part-number" />
                </div>
                <div>
                  <Label>Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required data-testid="input-name" />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="damper">Damper</SelectItem>
                      <SelectItem value="motor">Motor</SelectItem>
                      <SelectItem value="sensor">Sensor</SelectItem>
                      <SelectItem value="actuator">Actuator</SelectItem>
                      <SelectItem value="control">Control Panel</SelectItem>
                      <SelectItem value="fastener">Fastener</SelectItem>
                      <SelectItem value="seal">Seal</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Supplier</Label>
                  <Select value={formData.supplierId} onValueChange={(v) => setFormData({ ...formData, supplierId: v })}>
                    <SelectTrigger data-testid="select-supplier">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Manufacturer</Label>
                  <Input value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} data-testid="input-manufacturer" />
                </div>
                <div>
                  <Label>Model Number</Label>
                  <Input value={formData.modelNumber} onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })} data-testid="input-model" />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} data-testid="input-description" />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Pricing</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Cost Price (GBP) *</Label>
                    <Input type="number" step="0.01" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} required data-testid="input-cost" />
                  </div>
                  <div>
                    <Label>Sell Price (GBP)</Label>
                    <Input type="number" step="0.01" value={formData.sellPrice} onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })} data-testid="input-sell" />
                  </div>
                  <div>
                    <Label>Markup %</Label>
                    <Input type="number" step="0.01" value={formData.markupPercent} onChange={(e) => setFormData({ ...formData, markupPercent: e.target.value })} data-testid="input-markup" />
                  </div>
                  <div>
                    <Label>Unit of Measure</Label>
                    <Select value={formData.unitOfMeasure} onValueChange={(v) => setFormData({ ...formData, unitOfMeasure: v })}>
                      <SelectTrigger data-testid="select-unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="each">Each</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="pack">Pack</SelectItem>
                        <SelectItem value="meter">Meter</SelectItem>
                        <SelectItem value="kg">Kilogram</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Boxes className="w-4 h-4" /> Stock & Inventory</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Stock Quantity</Label>
                    <Input type="number" value={formData.stockQuantity} onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })} data-testid="input-stock" />
                  </div>
                  <div>
                    <Label>Minimum Stock</Label>
                    <Input type="number" value={formData.minimumStock} onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })} data-testid="input-min-stock" />
                  </div>
                  <div>
                    <Label>Reorder Qty</Label>
                    <Input type="number" value={formData.reorderQuantity} onChange={(e) => setFormData({ ...formData, reorderQuantity: e.target.value })} data-testid="input-reorder" />
                  </div>
                  <div>
                    <Label>Lead Time (days)</Label>
                    <Input type="number" value={formData.leadTimeDays} onChange={(e) => setFormData({ ...formData, leadTimeDays: e.target.value })} data-testid="input-lead-time" />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Warehouse location" data-testid="input-location" />
                  </div>
                  <div>
                    <Label>Barcode</Label>
                    <Input value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} data-testid="input-barcode" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Additional Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input type="number" step="0.01" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} data-testid="input-weight" />
                  </div>
                  <div>
                    <Label>Dimensions</Label>
                    <Input value={formData.dimensions} onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })} placeholder="L x W x H" data-testid="input-dimensions" />
                  </div>
                  <div>
                    <Label>Compatible With</Label>
                    <Input value={formData.compatibleWith} onChange={(e) => setFormData({ ...formData, compatibleWith: e.target.value })} data-testid="input-compatible" />
                  </div>
                  <div>
                    <Label>Alternative Parts</Label>
                    <Input value={formData.alternativeParts} onChange={(e) => setFormData({ ...formData, alternativeParts: e.target.value })} data-testid="input-alternatives" />
                  </div>
                  <div>
                    <Label>Warranty (months)</Label>
                    <Input type="number" value={formData.warrantyMonths} onChange={(e) => setFormData({ ...formData, warrantyMonths: e.target.value })} data-testid="input-warranty" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({ ...formData, isActive: v })} data-testid="switch-active" />
                    <Label>Active</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} data-testid="input-notes" />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {editingPart ? "Update" : "Add Part"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold" data-testid="stat-total">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Parts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600" data-testid="stat-low-stock">{stats.lowStock}</div>
            <p className="text-sm text-muted-foreground">Low Stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold" data-testid="stat-value">£{stats.totalValue.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Inventory Value</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search parts..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40" data-testid="select-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="damper">Damper</SelectItem>
            <SelectItem value="motor">Motor</SelectItem>
            <SelectItem value="sensor">Sensor</SelectItem>
            <SelectItem value="actuator">Actuator</SelectItem>
            <SelectItem value="control">Control</SelectItem>
            <SelectItem value="fastener">Fastener</SelectItem>
            <SelectItem value="seal">Seal</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary" data-testid="badge-count">{filteredParts.length} parts</Badge>
      </div>

      {filteredParts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground" data-testid="text-empty-state">No parts found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredParts.map((part) => (
            <Card key={part.id} data-testid={`card-part-${part.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2" data-testid={`text-name-${part.id}`}>
                      <Package className="w-5 h-5" />
                      {part.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{part.partNumber} • {getSupplierName(part.supplierId)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{part.category}</Badge>
                    {isLowStock(part) && <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Low Stock</Badge>}
                    {!part.isActive && <Badge variant="outline">Inactive</Badge>}
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(part)} data-testid={`button-edit-${part.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(part.id)} data-testid={`button-delete-${part.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {part.description && <p className="text-sm mb-3">{part.description}</p>}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cost:</span> £{part.costPrice.toFixed(2)}
                  </div>
                  {part.sellPrice && (
                    <div>
                      <span className="text-muted-foreground">Sell:</span> £{part.sellPrice.toFixed(2)}
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Stock:</span> {part.stockQuantity || 0} {part.unitOfMeasure}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Min:</span> {part.minimumStock || 0}
                  </div>
                  {part.manufacturer && (
                    <div>
                      <span className="text-muted-foreground">Mfr:</span> {part.manufacturer}
                    </div>
                  )}
                </div>
                {part.location && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Location: {part.location}
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
