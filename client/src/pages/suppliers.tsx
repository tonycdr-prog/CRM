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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Building2, Phone, Mail, Globe, Star, StarOff } from "lucide-react";
import type { DbSupplier } from "@shared/schema";

export default function SuppliersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<DbSupplier | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    postcode: "",
    website: "",
    category: "",
    accountNumber: "",
    paymentTerms: "",
    taxId: "",
    rating: 0,
    notes: "",
    isPreferred: false,
    isActive: true,
  });

  const { data: suppliers = [], isLoading } = useQuery<DbSupplier[]>({
    queryKey: ["/api/suppliers"],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/suppliers", { ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Supplier created successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to create supplier", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) => apiRequest("PATCH", `/api/suppliers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Supplier updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to update supplier", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Supplier deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete supplier", variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({
      name: "", contactName: "", email: "", phone: "", address: "", postcode: "",
      website: "", category: "", accountNumber: "", paymentTerms: "", taxId: "",
      rating: 0, notes: "", isPreferred: false, isActive: true,
    });
    setEditingSupplier(null);
  };

  const handleEdit = (supplier: DbSupplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || "",
      contactName: supplier.contactName || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      postcode: supplier.postcode || "",
      website: supplier.website || "",
      category: supplier.category || "",
      accountNumber: supplier.accountNumber || "",
      paymentTerms: supplier.paymentTerms || "",
      taxId: supplier.taxId || "",
      rating: supplier.rating || 0,
      notes: supplier.notes || "",
      isPreferred: supplier.isPreferred || false,
      isActive: supplier.isActive !== false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast({ title: "Please enter a supplier name", variant: "destructive" });
      return;
    }
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getCategoryBadge = (category: string | null) => {
    const colors: Record<string, string> = {
      parts: "bg-blue-500/10 text-blue-500",
      equipment: "bg-green-500/10 text-green-500",
      services: "bg-purple-500/10 text-purple-500",
      consumables: "bg-orange-500/10 text-orange-500",
    };
    return colors[category || ""] || "bg-muted text-muted-foreground";
  };

  const renderStars = (rating: number | null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= (rating || 0) ? (
          <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        ) : (
          <StarOff key={i} className="w-4 h-4 text-muted-foreground" />
        )
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Suppliers</h1>
            <p className="text-muted-foreground">Manage your vendors and suppliers</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-supplier"><Plus className="w-4 h-4 mr-2" />Add Supplier</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">{editingSupplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} data-testid="input-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input id="contactName" value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} data-testid="input-contact-name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} data-testid="input-email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} data-testid="input-phone" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} data-testid="input-address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input id="postcode" value={formData.postcode} onChange={(e) => setFormData({ ...formData, postcode: e.target.value })} data-testid="input-postcode" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} data-testid="input-website" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger data-testid="select-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parts">Parts</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="consumables">Consumables</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select value={formData.paymentTerms} onValueChange={(value) => setFormData({ ...formData, paymentTerms: value })}>
                    <SelectTrigger data-testid="select-payment-terms"><SelectValue placeholder="Select terms" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cod">COD</SelectItem>
                      <SelectItem value="net15">Net 15</SelectItem>
                      <SelectItem value="net30">Net 30</SelectItem>
                      <SelectItem value="net60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input id="accountNumber" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} data-testid="input-account-number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">VAT/Tax ID</Label>
                  <Input id="taxId" value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} data-testid="input-tax-id" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setFormData({ ...formData, rating: star })} data-testid={`button-star-${star}`}>
                      {star <= formData.rating ? (
                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="w-6 h-6 text-muted-foreground hover:text-yellow-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} data-testid="input-notes" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch id="isPreferred" checked={formData.isPreferred} onCheckedChange={(checked) => setFormData({ ...formData, isPreferred: checked })} data-testid="switch-preferred" />
                  <Label htmlFor="isPreferred">Preferred Supplier</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} data-testid="switch-active" />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} data-testid="button-cancel">Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                {editingSupplier ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading suppliers...</div>
      ) : suppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No suppliers yet</h3>
            <p className="text-muted-foreground mb-4">Add your first supplier to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className={`${!supplier.isActive ? 'opacity-60' : ''}`} data-testid={`card-supplier-${supplier.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="truncate" data-testid={`text-name-${supplier.id}`}>{supplier.name}</span>
                      {supplier.isPreferred && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                    </CardTitle>
                    {supplier.contactName && (
                      <p className="text-sm text-muted-foreground truncate">{supplier.contactName}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)} data-testid={`button-edit-${supplier.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(supplier.id)} data-testid={`button-delete-${supplier.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {supplier.category && (
                    <Badge className={getCategoryBadge(supplier.category)} data-testid={`badge-category-${supplier.id}`}>
                      {supplier.category}
                    </Badge>
                  )}
                  {!supplier.isActive && <Badge variant="secondary">Inactive</Badge>}
                </div>
                {renderStars(supplier.rating)}
                <div className="space-y-1 text-sm">
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" /><span className="truncate">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" /><span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="w-4 h-4" /><span className="truncate">{supplier.website}</span>
                    </div>
                  )}
                </div>
                {supplier.paymentTerms && (
                  <div className="text-sm text-muted-foreground">
                    Payment: <span className="uppercase">{supplier.paymentTerms}</span>
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
