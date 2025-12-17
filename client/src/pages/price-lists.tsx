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
  PoundSterling,
  Tag,
  Percent,
  Search,
  Package
} from "lucide-react";
import type { DbPriceList } from "@shared/schema";

export default function PriceLists() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DbPriceList | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "service",
    description: "",
    unit: "each",
    costPrice: "",
    sellPrice: "",
    marginPercent: "",
    vatRate: "20",
    vatIncluded: false,
    minimumCharge: "",
    discountable: true,
    maxDiscountPercent: "",
    effectiveFrom: "",
    effectiveTo: "",
    supplierRef: "",
    isActive: true,
    sortOrder: "0",
    notes: "",
  });

  const { data: items = [], isLoading } = useQuery<DbPriceList[]>({
    queryKey: ["/api/price-lists"],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const payload = {
        ...data,
        costPrice: data.costPrice ? parseFloat(data.costPrice) : null,
        sellPrice: parseFloat(data.sellPrice),
        marginPercent: data.marginPercent ? parseFloat(data.marginPercent) : null,
        vatRate: parseFloat(data.vatRate),
        minimumCharge: data.minimumCharge ? parseFloat(data.minimumCharge) : null,
        maxDiscountPercent: data.maxDiscountPercent ? parseFloat(data.maxDiscountPercent) : null,
        sortOrder: parseInt(data.sortOrder),
      };
      return apiRequest("POST", "/api/price-lists", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Price list item created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) => {
      const payload = {
        ...data,
        costPrice: data.costPrice ? parseFloat(data.costPrice) : null,
        sellPrice: parseFloat(data.sellPrice),
        marginPercent: data.marginPercent ? parseFloat(data.marginPercent) : null,
        vatRate: parseFloat(data.vatRate),
        minimumCharge: data.minimumCharge ? parseFloat(data.minimumCharge) : null,
        maxDiscountPercent: data.maxDiscountPercent ? parseFloat(data.maxDiscountPercent) : null,
        sortOrder: parseInt(data.sortOrder),
      };
      return apiRequest("PATCH", `/api/price-lists/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
      toast({ title: "Price list item updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/price-lists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      toast({ title: "Price list item deleted" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      category: "service",
      description: "",
      unit: "each",
      costPrice: "",
      sellPrice: "",
      marginPercent: "",
      vatRate: "20",
      vatIncluded: false,
      minimumCharge: "",
      discountable: true,
      maxDiscountPercent: "",
      effectiveFrom: "",
      effectiveTo: "",
      supplierRef: "",
      isActive: true,
      sortOrder: "0",
      notes: "",
    });
  };

  const handleEdit = (item: DbPriceList) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code || "",
      category: item.category || "service",
      description: item.description || "",
      unit: item.unit || "each",
      costPrice: item.costPrice?.toString() || "",
      sellPrice: item.sellPrice.toString(),
      marginPercent: item.marginPercent?.toString() || "",
      vatRate: (item.vatRate || 20).toString(),
      vatIncluded: item.vatIncluded || false,
      minimumCharge: item.minimumCharge?.toString() || "",
      discountable: item.discountable !== false,
      maxDiscountPercent: item.maxDiscountPercent?.toString() || "",
      effectiveFrom: item.effectiveFrom || "",
      effectiveTo: item.effectiveTo || "",
      supplierRef: item.supplierRef || "",
      isActive: item.isActive !== false,
      sortOrder: (item.sortOrder || 0).toString(),
      notes: item.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      service: "Service",
      product: "Product",
      labour: "Labour",
      materials: "Materials",
      call_out: "Call Out",
    };
    return categories[category] || category;
  };

  const getUnitLabel = (unit: string) => {
    const units: Record<string, string> = {
      each: "Each",
      hour: "Hour",
      day: "Day",
      meter: "Meter",
      m2: "m²",
      kg: "kg",
    };
    return units[unit] || unit;
  };

  const calculateMargin = (cost: number | null, sell: number) => {
    if (!cost || cost === 0) return null;
    return ((sell - cost) / sell * 100).toFixed(1);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64" data-testid="loading-state">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-price-lists">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Price Lists</h1>
          <p className="text-muted-foreground">Manage service and product pricing</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingItem(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-item">
              <Plus className="w-4 h-4 mr-2" />
              Add Price Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">{editingItem ? "Edit Price Item" : "Add Price Item"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required data-testid="input-name" />
                </div>
                <div>
                  <Label>Code</Label>
                  <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="SKU / Reference" data-testid="input-code" />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="labour">Labour</SelectItem>
                      <SelectItem value="materials">Materials</SelectItem>
                      <SelectItem value="call_out">Call Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                    <SelectTrigger data-testid="select-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="each">Each</SelectItem>
                      <SelectItem value="hour">Hour</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="meter">Meter</SelectItem>
                      <SelectItem value="m2">m²</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} data-testid="input-description" />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><PoundSterling className="w-4 h-4" /> Pricing</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Cost Price</Label>
                    <Input type="number" step="0.01" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} data-testid="input-cost-price" />
                  </div>
                  <div>
                    <Label>Sell Price *</Label>
                    <Input type="number" step="0.01" value={formData.sellPrice} onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })} required data-testid="input-sell-price" />
                  </div>
                  <div>
                    <Label>Margin %</Label>
                    <Input type="number" step="0.1" value={formData.marginPercent} onChange={(e) => setFormData({ ...formData, marginPercent: e.target.value })} data-testid="input-margin" />
                  </div>
                  <div>
                    <Label>VAT Rate %</Label>
                    <Input type="number" step="0.5" value={formData.vatRate} onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })} data-testid="input-vat-rate" />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch checked={formData.vatIncluded} onCheckedChange={(v) => setFormData({ ...formData, vatIncluded: v })} data-testid="switch-vat-included" />
                    <Label>Price includes VAT</Label>
                  </div>
                  <div>
                    <Label>Minimum Charge</Label>
                    <Input type="number" step="0.01" value={formData.minimumCharge} onChange={(e) => setFormData({ ...formData, minimumCharge: e.target.value })} data-testid="input-min-charge" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Percent className="w-4 h-4" /> Discounts</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.discountable} onCheckedChange={(v) => setFormData({ ...formData, discountable: v })} data-testid="switch-discountable" />
                    <Label>Allow Discounts</Label>
                  </div>
                  <div>
                    <Label>Max Discount %</Label>
                    <Input type="number" step="0.5" value={formData.maxDiscountPercent} onChange={(e) => setFormData({ ...formData, maxDiscountPercent: e.target.value })} disabled={!formData.discountable} data-testid="input-max-discount" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Validity & Reference</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Effective From</Label>
                    <Input type="date" value={formData.effectiveFrom} onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })} data-testid="input-effective-from" />
                  </div>
                  <div>
                    <Label>Effective To</Label>
                    <Input type="date" value={formData.effectiveTo} onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })} data-testid="input-effective-to" />
                  </div>
                  <div>
                    <Label>Supplier Ref</Label>
                    <Input value={formData.supplierRef} onChange={(e) => setFormData({ ...formData, supplierRef: e.target.value })} data-testid="input-supplier-ref" />
                  </div>
                  <div>
                    <Label>Sort Order</Label>
                    <Input type="number" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })} data-testid="input-sort-order" />
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
                  {editingItem ? "Update" : "Create"}
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
            placeholder="Search price list..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40" data-testid="select-filter-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="service">Service</SelectItem>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="labour">Labour</SelectItem>
            <SelectItem value="materials">Materials</SelectItem>
            <SelectItem value="call_out">Call Out</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary" data-testid="badge-count">{filteredItems.length} items</Badge>
      </div>

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground" data-testid="text-empty-state">No price list items found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} data-testid={`card-item-${item.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg" data-testid={`text-name-${item.id}`}>{item.name}</CardTitle>
                      {item.code && <Badge variant="outline">{item.code}</Badge>}
                      {!item.isActive && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold" data-testid={`text-price-${item.id}`}>£{item.sellPrice.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">per {getUnitLabel(item.unit || "each")}</p>
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
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm">
                  <Badge variant="outline"><Tag className="w-3 h-3 mr-1" /> {getCategoryLabel(item.category || "service")}</Badge>
                  {item.costPrice && (
                    <span className="text-muted-foreground">Cost: £{item.costPrice.toFixed(2)}</span>
                  )}
                  {item.costPrice && (
                    <span className="text-muted-foreground">Margin: {calculateMargin(item.costPrice, item.sellPrice)}%</span>
                  )}
                  <span className="text-muted-foreground">VAT: {item.vatRate}%{item.vatIncluded ? " (incl)" : ""}</span>
                  {item.discountable && item.maxDiscountPercent && (
                    <span className="text-muted-foreground">Max discount: {item.maxDiscountPercent}%</span>
                  )}
                  {!item.discountable && (
                    <Badge variant="secondary">No discounts</Badge>
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
