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
import { Plus, Pencil, Trash2, ShoppingCart, Package, PoundSterling, X } from "lucide-react";
import { format } from "date-fns";
import type { DbPurchaseOrder, DbSupplier } from "@shared/schema";

interface POItem {
  id: string;
  description: string;
  partNumber?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  received?: number;
}

export default function PurchaseOrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<DbPurchaseOrder | null>(null);
  const [formData, setFormData] = useState({
    supplierId: "",
    poNumber: "",
    orderDate: format(new Date(), "yyyy-MM-dd"),
    expectedDeliveryDate: "",
    status: "draft",
    items: [] as POItem[],
    vatRate: 20,
    shippingAddress: "",
    notes: "",
  });
  const [newItem, setNewItem] = useState({ description: "", partNumber: "", quantity: 1, unitPrice: 0 });

  const { data: purchaseOrders = [], isLoading } = useQuery<DbPurchaseOrder[]>({
    queryKey: ["/api/purchase-orders"],
    enabled: !!user?.id,
  });

  const { data: suppliers = [] } = useQuery<DbSupplier[]>({
    queryKey: ["/api/suppliers"],
    enabled: !!user?.id,
  });

  const calculateTotals = (items: POItem[], vatRate: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const vatAmount = subtotal * (vatRate / 100);
    const totalAmount = subtotal + vatAmount;
    return { subtotal, vatAmount, totalAmount };
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const { subtotal, vatAmount, totalAmount } = calculateTotals(data.items, data.vatRate);
      return apiRequest("POST", "/api/purchase-orders", { ...data, subtotal, vatAmount, totalAmount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({ title: "Purchase order created successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to create purchase order", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      const { subtotal, vatAmount, totalAmount } = calculateTotals(data.items, data.vatRate);
      return apiRequest("PATCH", `/api/purchase-orders/${id}`, { ...data, subtotal, vatAmount, totalAmount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({ title: "Purchase order updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to update purchase order", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/purchase-orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({ title: "Purchase order deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete purchase order", variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({
      supplierId: "", poNumber: "", orderDate: format(new Date(), "yyyy-MM-dd"),
      expectedDeliveryDate: "", status: "draft", items: [], vatRate: 20, shippingAddress: "", notes: "",
    });
    setNewItem({ description: "", partNumber: "", quantity: 1, unitPrice: 0 });
    setEditingPO(null);
  };

  const handleEdit = (po: DbPurchaseOrder) => {
    setEditingPO(po);
    setFormData({
      supplierId: po.supplierId || "",
      poNumber: po.poNumber || "",
      orderDate: po.orderDate || format(new Date(), "yyyy-MM-dd"),
      expectedDeliveryDate: po.expectedDeliveryDate || "",
      status: po.status || "draft",
      items: (po.items || []) as POItem[],
      vatRate: po.vatRate || 20,
      shippingAddress: po.shippingAddress || "",
      notes: po.notes || "",
    });
    setIsDialogOpen(true);
  };

  const addItem = () => {
    if (!newItem.description || newItem.quantity <= 0) {
      toast({ title: "Please enter item description and quantity", variant: "destructive" });
      return;
    }
    const item: POItem = {
      id: crypto.randomUUID(),
      description: newItem.description,
      partNumber: newItem.partNumber,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      totalPrice: newItem.quantity * newItem.unitPrice,
    };
    setFormData({ ...formData, items: [...formData.items, item] });
    setNewItem({ description: "", partNumber: "", quantity: 1, unitPrice: 0 });
  };

  const removeItem = (id: string) => {
    setFormData({ ...formData, items: formData.items.filter((item) => item.id !== id) });
  };

  const handleSubmit = () => {
    if (!formData.poNumber) {
      toast({ title: "Please enter a PO number", variant: "destructive" });
      return;
    }
    if (editingPO) {
      updateMutation.mutate({ id: editingPO.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500/10 text-gray-500",
      sent: "bg-blue-500/10 text-blue-500",
      confirmed: "bg-green-500/10 text-green-500",
      partially_received: "bg-yellow-500/10 text-yellow-500",
      received: "bg-emerald-500/10 text-emerald-500",
      cancelled: "bg-red-500/10 text-red-500",
    };
    return colors[status || "draft"] || "bg-muted text-muted-foreground";
  };

  const getSupplierName = (supplierId: string | null) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    return supplier?.name || "Unknown Supplier";
  };

  const { subtotal, vatAmount, totalAmount } = calculateTotals(formData.items, formData.vatRate);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Purchase Orders</h1>
            <p className="text-muted-foreground">Manage supplier orders and procurement</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-po"><Plus className="w-4 h-4 mr-2" />New Purchase Order</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">{editingPO ? "Edit Purchase Order" : "New Purchase Order"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="poNumber">PO Number *</Label>
                  <Input id="poNumber" value={formData.poNumber} onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })} data-testid="input-po-number" />
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
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderDate">Order Date</Label>
                  <Input id="orderDate" type="date" value={formData.orderDate} onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })} data-testid="input-order-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedDeliveryDate">Expected Delivery</Label>
                  <Input id="expectedDeliveryDate" type="date" value={formData.expectedDeliveryDate} onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })} data-testid="input-delivery-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="partially_received">Partially Received</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Order Items</Label>
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-12 gap-2">
                      <Input placeholder="Description" className="col-span-4" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} data-testid="input-item-description" />
                      <Input placeholder="Part #" className="col-span-2" value={newItem.partNumber} onChange={(e) => setNewItem({ ...newItem, partNumber: e.target.value })} data-testid="input-item-part" />
                      <Input type="number" placeholder="Qty" className="col-span-2" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })} data-testid="input-item-qty" />
                      <Input type="number" step="0.01" placeholder="Price" className="col-span-2" value={newItem.unitPrice} onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })} data-testid="input-item-price" />
                      <Button onClick={addItem} className="col-span-2" data-testid="button-add-item"><Plus className="w-4 h-4" /></Button>
                    </div>
                    {formData.items.length > 0 && (
                      <div className="border rounded-md divide-y">
                        {formData.items.map((item) => (
                          <div key={item.id} className="p-2 flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.partNumber && `${item.partNumber} | `}{item.quantity} x £{item.unitPrice.toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">£{item.totalPrice.toFixed(2)}</span>
                              <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} data-testid={`button-remove-item-${item.id}`}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vatRate">VAT Rate (%)</Label>
                  <Input id="vatRate" type="number" value={formData.vatRate} onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) || 0 })} data-testid="input-vat-rate" />
                </div>
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-1 text-sm">
                    <div className="flex justify-between"><span>Subtotal:</span><span>£{subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>VAT ({formData.vatRate}%):</span><span>£{vatAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total:</span><span data-testid="text-total">£{totalAmount.toFixed(2)}</span></div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingAddress">Shipping Address</Label>
                <Textarea id="shippingAddress" value={formData.shippingAddress} onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })} rows={2} data-testid="input-shipping-address" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} data-testid="input-notes" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} data-testid="button-cancel">Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                {editingPO ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading purchase orders...</div>
      ) : purchaseOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No purchase orders yet</h3>
            <p className="text-muted-foreground mb-4">Create your first purchase order to track supplier orders</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {purchaseOrders.map((po) => (
            <Card key={po.id} data-testid={`card-po-${po.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-lg" data-testid={`text-po-number-${po.id}`}>{po.poNumber}</CardTitle>
                    <Badge className={getStatusBadge(po.status)} data-testid={`badge-status-${po.id}`}>
                      {(po.status || "draft").replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(po)} data-testid={`button-edit-${po.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(po.id)} data-testid={`button-delete-${po.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Supplier: {getSupplierName(po.supplierId)}</p>
                    <p className="text-sm text-muted-foreground">
                      Order Date: {po.orderDate}
                      {po.expectedDeliveryDate && ` | Expected: ${po.expectedDeliveryDate}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Items: {((po.items as POItem[]) || []).length}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-2xl font-bold">
                      <PoundSterling className="w-5 h-5" />
                      <span data-testid={`text-amount-${po.id}`}>{(po.totalAmount || 0).toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">inc. VAT</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
