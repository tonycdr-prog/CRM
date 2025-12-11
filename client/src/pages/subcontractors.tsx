import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search,
  Users,
  Phone,
  Mail,
  MapPin,
  Star,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO, differenceInDays } from "date-fns";
import { nanoid } from "nanoid";

interface Subcontractor {
  id: string;
  userId: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  specialty: string | null;
  dayRate: string | null;
  insuranceExpiry: string | null;
  safetyAccreditation: string | null;
  accreditationExpiry: string | null;
  rating: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

export default function Subcontractors() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: subcontractors = [], isLoading } = useQuery<Subcontractor[]>({
    queryKey: ["/api/subcontractors", user?.id],
    enabled: !!user?.id,
  });

  const createSubcontractorMutation = useMutation({
    mutationFn: async (data: Partial<Subcontractor>) => {
      return apiRequest("POST", "/api/subcontractors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcontractors", user?.id] });
      setIsCreateDialogOpen(false);
      toast({ title: "Subcontractor added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add subcontractor", variant: "destructive" });
    },
  });

  const deleteSubcontractorMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/subcontractors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcontractors", user?.id] });
      toast({ title: "Subcontractor deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete subcontractor", variant: "destructive" });
    },
  });

  const filteredSubcontractors = subcontractors.filter((sub) =>
    sub.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSubcontractor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createSubcontractorMutation.mutate({
      id: nanoid(),
      userId: user?.id,
      companyName: formData.get("companyName") as string,
      contactName: formData.get("contactName") as string || null,
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string || null,
      address: formData.get("address") as string || null,
      city: formData.get("city") as string || null,
      postcode: formData.get("postcode") as string || null,
      specialty: formData.get("specialty") as string || null,
      dayRate: formData.get("dayRate") as string || null,
      insuranceExpiry: formData.get("insuranceExpiry") as string || null,
      safetyAccreditation: formData.get("safetyAccreditation") as string || null,
      accreditationExpiry: formData.get("accreditationExpiry") as string || null,
      rating: parseInt(formData.get("rating") as string) || null,
      status: "active",
      notes: formData.get("notes") as string || null,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "preferred":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Preferred</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRatingStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`h-3 w-3 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
          />
        ))}
      </div>
    );
  };

  const getExpiryWarning = (date: string | null, label: string) => {
    if (!date) return null;
    const daysUntil = differenceInDays(parseISO(date), new Date());
    if (daysUntil < 0) {
      return { label, status: "expired", days: Math.abs(daysUntil) };
    } else if (daysUntil <= 30) {
      return { label, status: "warning", days: daysUntil };
    }
    return null;
  };

  const getSubcontractorWarnings = (sub: Subcontractor) => {
    const warnings = [];
    const insurance = getExpiryWarning(sub.insuranceExpiry, "Insurance");
    const accreditation = getExpiryWarning(sub.accreditationExpiry, "Accreditation");
    if (insurance) warnings.push(insurance);
    if (accreditation) warnings.push(accreditation);
    return warnings;
  };

  const getStats = () => {
    const active = subcontractors.filter(s => s.status === "active" || s.status === "preferred").length;
    const preferred = subcontractors.filter(s => s.status === "preferred").length;
    const warnings = subcontractors.reduce((count, s) => count + getSubcontractorWarnings(s).length, 0);
    return { active, preferred, warnings, total: subcontractors.length };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-subcontractors-title">Subcontractors</h1>
          <p className="text-muted-foreground">Manage your approved subcontractor network</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-subcontractor">
              <Plus className="h-4 w-4 mr-2" />
              Add Subcontractor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Subcontractor</DialogTitle>
              <DialogDescription>Enter subcontractor details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubcontractor}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input id="companyName" name="companyName" required data-testid="input-company-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input id="contactName" name="contactName" data-testid="input-contact-name" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" data-testid="input-email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" data-testid="input-phone" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" data-testid="input-address" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" data-testid="input-city" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input id="postcode" name="postcode" data-testid="input-postcode" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Input id="specialty" name="specialty" placeholder="e.g. Smoke Control Systems" data-testid="input-specialty" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dayRate">Day Rate (GBP)</Label>
                    <Input id="dayRate" name="dayRate" type="number" step="0.01" data-testid="input-day-rate" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
                    <Input id="insuranceExpiry" name="insuranceExpiry" type="date" data-testid="input-insurance-expiry" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating (1-5)</Label>
                    <Select name="rating">
                      <SelectTrigger data-testid="select-rating">
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Stars</SelectItem>
                        <SelectItem value="4">4 Stars</SelectItem>
                        <SelectItem value="3">3 Stars</SelectItem>
                        <SelectItem value="2">2 Stars</SelectItem>
                        <SelectItem value="1">1 Star</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="safetyAccreditation">Safety Accreditation</Label>
                    <Input id="safetyAccreditation" name="safetyAccreditation" placeholder="e.g. SafeContractor" data-testid="input-accreditation" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accreditationExpiry">Accreditation Expiry</Label>
                    <Input id="accreditationExpiry" name="accreditationExpiry" type="date" data-testid="input-accreditation-expiry" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={2} data-testid="input-notes" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createSubcontractorMutation.isPending} data-testid="button-save-subcontractor">
                  {createSubcontractorMutation.isPending ? "Saving..." : "Add Subcontractor"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Preferred</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.preferred}</div>
          </CardContent>
        </Card>
        <Card className={stats.warnings > 0 ? "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Expiry Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.warnings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search subcontractors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-subcontractors"
        />
      </div>

      {filteredSubcontractors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No subcontractors found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery ? "Try adjusting your search" : "Add your first subcontractor"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-first-subcontractor">
                <Plus className="h-4 w-4 mr-2" />
                Add Subcontractor
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSubcontractors.map((sub) => {
            const warnings = getSubcontractorWarnings(sub);
            return (
              <Card key={sub.id} data-testid={`card-subcontractor-${sub.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{sub.companyName}</CardTitle>
                      {sub.contactName && (
                        <CardDescription>{sub.contactName}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(sub.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deleteSubcontractorMutation.mutate(sub.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {sub.specialty && (
                      <Badge variant="outline">{sub.specialty}</Badge>
                    )}
                    {sub.rating && (
                      <div className="flex items-center gap-2">
                        {getRatingStars(sub.rating)}
                      </div>
                    )}
                    {sub.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{sub.phone}</span>
                      </div>
                    )}
                    {sub.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{sub.email}</span>
                      </div>
                    )}
                    {sub.city && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{sub.city}</span>
                      </div>
                    )}
                    {sub.dayRate && (
                      <div className="font-medium">£{parseFloat(sub.dayRate).toFixed(2)}/day</div>
                    )}
                  </div>
                  {warnings.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {warnings.map((w, i) => (
                        <Badge 
                          key={i} 
                          variant={w.status === "expired" ? "destructive" : "outline"}
                          className={w.status === "warning" ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100" : ""}
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {w.label} {w.status === "expired" ? `expired ${w.days}d ago` : `expires in ${w.days}d`}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
