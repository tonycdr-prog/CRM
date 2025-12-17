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
  Car,
  Calendar,
  Fuel,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle,
  Wrench
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO, differenceInDays } from "date-fns";
import { nanoid } from "nanoid";

interface Vehicle {
  id: string;
  userId: string;
  registration: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  fuelType: string | null;
  currentMileage: number | null;
  motExpiry: string | null;
  taxExpiry: string | null;
  insuranceExpiry: string | null;
  serviceDate: string | null;
  nextServiceMileage: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

export default function Vehicles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
    enabled: !!user?.id,
  });

  const createVehicleMutation = useMutation({
    mutationFn: async (data: Partial<Vehicle>) => {
      return apiRequest("POST", "/api/vehicles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Vehicle added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add vehicle", variant: "destructive" });
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: "Vehicle deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete vehicle", variant: "destructive" });
    },
  });

  const filteredVehicles = vehicles.filter((vehicle) =>
    vehicle.registration.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateVehicle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createVehicleMutation.mutate({
      id: nanoid(),
      userId: user?.id,
      registration: formData.get("registration") as string,
      make: formData.get("make") as string,
      model: formData.get("model") as string,
      year: parseInt(formData.get("year") as string) || null,
      color: formData.get("color") as string || null,
      fuelType: formData.get("fuelType") as string || null,
      currentMileage: parseInt(formData.get("currentMileage") as string) || null,
      motExpiry: formData.get("motExpiry") as string || null,
      taxExpiry: formData.get("taxExpiry") as string || null,
      insuranceExpiry: formData.get("insuranceExpiry") as string || null,
      serviceDate: formData.get("serviceDate") as string || null,
      nextServiceMileage: parseInt(formData.get("nextServiceMileage") as string) || null,
      status: "active",
      notes: formData.get("notes") as string || null,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Active</Badge>;
      case "maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Maintenance</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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

  const getVehicleWarnings = (vehicle: Vehicle) => {
    const warnings = [];
    const mot = getExpiryWarning(vehicle.motExpiry, "MOT");
    const tax = getExpiryWarning(vehicle.taxExpiry, "Tax");
    const insurance = getExpiryWarning(vehicle.insuranceExpiry, "Insurance");
    if (mot) warnings.push(mot);
    if (tax) warnings.push(tax);
    if (insurance) warnings.push(insurance);
    return warnings;
  };

  const getVehicleStats = () => {
    const active = vehicles.filter(v => v.status === "active").length;
    const total = vehicles.length;
    const warnings = vehicles.reduce((count, v) => count + getVehicleWarnings(v).length, 0);
    const totalMileage = vehicles.reduce((sum, v) => sum + (v.currentMileage || 0), 0);
    return { active, total, warnings, totalMileage };
  };

  const stats = getVehicleStats();

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
          <h1 className="text-2xl font-bold" data-testid="text-vehicles-title">Vehicles</h1>
          <p className="text-muted-foreground">Manage fleet vehicles and maintenance</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-vehicle">
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Vehicle</DialogTitle>
              <DialogDescription>Enter the vehicle details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateVehicle}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="registration">Registration *</Label>
                    <Input id="registration" name="registration" required placeholder="AB12 CDE" data-testid="input-registration" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input id="year" name="year" type="number" min="1900" max="2030" data-testid="input-year" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="make">Make *</Label>
                    <Input id="make" name="make" required placeholder="Ford" data-testid="input-make" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model *</Label>
                    <Input id="model" name="model" required placeholder="Transit" data-testid="input-model" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Colour</Label>
                    <Input id="color" name="color" data-testid="input-color" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fuelType">Fuel Type</Label>
                    <Select name="fuelType" defaultValue="diesel">
                      <SelectTrigger data-testid="select-fuel-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="petrol">Petrol</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentMileage">Current Mileage</Label>
                  <Input id="currentMileage" name="currentMileage" type="number" data-testid="input-mileage" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="motExpiry">MOT Expiry</Label>
                    <Input id="motExpiry" name="motExpiry" type="date" data-testid="input-mot-expiry" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxExpiry">Tax Expiry</Label>
                    <Input id="taxExpiry" name="taxExpiry" type="date" data-testid="input-tax-expiry" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
                    <Input id="insuranceExpiry" name="insuranceExpiry" type="date" data-testid="input-insurance-expiry" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceDate">Last Service Date</Label>
                    <Input id="serviceDate" name="serviceDate" type="date" data-testid="input-service-date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextServiceMileage">Next Service Mileage</Label>
                    <Input id="nextServiceMileage" name="nextServiceMileage" type="number" data-testid="input-next-service" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={2} data-testid="input-vehicle-notes" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createVehicleMutation.isPending} data-testid="button-save-vehicle">
                  {createVehicleMutation.isPending ? "Saving..." : "Add Vehicle"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Fleet</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className={stats.warnings > 0 ? "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.warnings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Mileage</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMileage.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vehicles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-md"
          data-testid="input-search-vehicles"
        />
      </div>

      {filteredVehicles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No vehicles found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery ? "Try adjusting your search" : "Add your first vehicle to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-first-vehicle">
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((vehicle) => {
            const warnings = getVehicleWarnings(vehicle);
            return (
              <Card key={vehicle.id} data-testid={`card-vehicle-${vehicle.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{vehicle.registration}</CardTitle>
                      <CardDescription>{vehicle.make} {vehicle.model} {vehicle.year && `(${vehicle.year})`}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(vehicle.status)}
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
                          <DropdownMenuItem>
                            <Wrench className="h-4 w-4 mr-2" />
                            Log Service
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deleteVehicleMutation.mutate(vehicle.id)}
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
                    {vehicle.currentMileage && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Fuel className="h-4 w-4" />
                        <span>{vehicle.currentMileage.toLocaleString()} miles</span>
                      </div>
                    )}
                    {vehicle.motExpiry && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>MOT: {format(parseISO(vehicle.motExpiry), "MMM d, yyyy")}</span>
                      </div>
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
