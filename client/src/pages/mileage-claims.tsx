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
import { Plus, Pencil, Trash2, Car, MapPin, PoundSterling, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { DbMileageClaim, DbVehicle, DbJob } from "@shared/schema";

const HMRC_CAR_RATE = 0.45;
const HMRC_MOTORCYCLE_RATE = 0.24;
const HMRC_BICYCLE_RATE = 0.20;
const PASSENGER_RATE = 0.05;

export default function MileageClaimsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState<DbMileageClaim | null>(null);
  const [formData, setFormData] = useState({
    claimDate: format(new Date(), "yyyy-MM-dd"),
    startLocation: "",
    endLocation: "",
    purpose: "",
    distanceMiles: 0,
    ratePerMile: HMRC_CAR_RATE,
    vehicleType: "car",
    vehicleId: "",
    jobId: "",
    passengerCount: 0,
    status: "pending",
    notes: "",
  });

  const { data: claims = [], isLoading } = useQuery<DbMileageClaim[]>({
    queryKey: ["/api/mileage-claims"],
    enabled: !!user?.id,
  });

  const { data: vehicles = [] } = useQuery<DbVehicle[]>({
    queryKey: ["/api/vehicles"],
    enabled: !!user?.id,
  });

  const { data: jobs = [] } = useQuery<DbJob[]>({
    queryKey: ["/api/jobs"],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData & { totalAmount: number }) => apiRequest("POST", "/api/mileage-claims", { ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mileage-claims"] });
      toast({ title: "Mileage claim created successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to create mileage claim", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData & { totalAmount: number } }) => apiRequest("PATCH", `/api/mileage-claims/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mileage-claims"] });
      toast({ title: "Mileage claim updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to update mileage claim", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/mileage-claims/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mileage-claims"] });
      toast({ title: "Mileage claim deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete mileage claim", variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({
      claimDate: format(new Date(), "yyyy-MM-dd"), startLocation: "", endLocation: "",
      purpose: "", distanceMiles: 0, ratePerMile: HMRC_CAR_RATE, vehicleType: "car",
      vehicleId: "", jobId: "", passengerCount: 0, status: "pending", notes: "",
    });
    setEditingClaim(null);
  };

  const handleEdit = (claim: DbMileageClaim) => {
    setEditingClaim(claim);
    setFormData({
      claimDate: claim.claimDate || format(new Date(), "yyyy-MM-dd"),
      startLocation: claim.startLocation || "",
      endLocation: claim.endLocation || "",
      purpose: claim.purpose || "",
      distanceMiles: claim.distanceMiles || 0,
      ratePerMile: claim.ratePerMile || HMRC_CAR_RATE,
      vehicleType: claim.vehicleType || "car",
      vehicleId: claim.vehicleId || "",
      jobId: claim.jobId || "",
      passengerCount: claim.passengerCount || 0,
      status: claim.status || "pending",
      notes: claim.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleVehicleTypeChange = (type: string) => {
    let rate = HMRC_CAR_RATE;
    if (type === "motorcycle") rate = HMRC_MOTORCYCLE_RATE;
    if (type === "bicycle") rate = HMRC_BICYCLE_RATE;
    setFormData({ ...formData, vehicleType: type, ratePerMile: rate });
  };

  const calculateTotal = () => {
    const baseAmount = formData.distanceMiles * formData.ratePerMile;
    const passengerAmount = formData.distanceMiles * formData.passengerCount * PASSENGER_RATE;
    return baseAmount + passengerAmount;
  };

  const handleSubmit = () => {
    if (!formData.startLocation || !formData.endLocation || formData.distanceMiles <= 0) {
      toast({ title: "Please enter start/end locations and distance", variant: "destructive" });
      return;
    }
    const totalAmount = calculateTotal();
    if (editingClaim) {
      updateMutation.mutate({ id: editingClaim.id, data: { ...formData, totalAmount } });
    } else {
      createMutation.mutate({ ...formData, totalAmount });
    }
  };

  const getStatusBadge = (status: string | null) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-500",
      approved: "bg-green-500/10 text-green-500",
      rejected: "bg-red-500/10 text-red-500",
      paid: "bg-blue-500/10 text-blue-500",
    };
    return colors[status || "pending"] || "bg-muted text-muted-foreground";
  };

  const getVehicleName = (vehicleId: string | null) => {
    if (!vehicleId) return "";
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registration})` : "";
  };

  const getJobRef = (jobId: string | null) => {
    if (!jobId) return "";
    const job = jobs.find((j) => j.id === jobId);
    return job?.jobNumber || "";
  };

  const totalPending = claims.filter((c) => c.status === "pending").reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  const totalApproved = claims.filter((c) => c.status === "approved").reduce((sum, c) => sum + (c.totalAmount || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Car className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Mileage Claims</h1>
            <p className="text-muted-foreground">HMRC compliant mileage expense tracking</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-claim"><Plus className="w-4 h-4 mr-2" />New Claim</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">{editingClaim ? "Edit Claim" : "New Mileage Claim"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="claimDate">Date</Label>
                  <Input id="claimDate" type="date" value={formData.claimDate} onChange={(e) => setFormData({ ...formData, claimDate: e.target.value })} data-testid="input-claim-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle Type</Label>
                  <Select value={formData.vehicleType} onValueChange={handleVehicleTypeChange}>
                    <SelectTrigger data-testid="select-vehicle-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Car (£0.45/mile)</SelectItem>
                      <SelectItem value="motorcycle">Motorcycle (£0.24/mile)</SelectItem>
                      <SelectItem value="bicycle">Bicycle (£0.20/mile)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startLocation">Start Location *</Label>
                  <Input id="startLocation" value={formData.startLocation} onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })} placeholder="e.g. Office" data-testid="input-start-location" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endLocation">End Location *</Label>
                  <Input id="endLocation" value={formData.endLocation} onChange={(e) => setFormData({ ...formData, endLocation: e.target.value })} placeholder="e.g. Client site" data-testid="input-end-location" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Input id="purpose" value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} placeholder="Reason for journey" data-testid="input-purpose" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="distanceMiles">Distance (miles) *</Label>
                  <Input id="distanceMiles" type="number" step="0.1" value={formData.distanceMiles} onChange={(e) => setFormData({ ...formData, distanceMiles: parseFloat(e.target.value) || 0 })} data-testid="input-distance" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passengerCount">Passengers</Label>
                  <Input id="passengerCount" type="number" value={formData.passengerCount} onChange={(e) => setFormData({ ...formData, passengerCount: parseInt(e.target.value) || 0 })} data-testid="input-passengers" />
                </div>
                <div className="space-y-2">
                  <Label>Total Amount</Label>
                  <div className="h-9 px-3 py-2 border rounded-md bg-muted flex items-center" data-testid="text-total-amount">
                    <PoundSterling className="w-4 h-4 mr-1" />
                    {calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleId">Vehicle</Label>
                  <Select value={formData.vehicleId} onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}>
                    <SelectTrigger data-testid="select-vehicle"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model} ({vehicle.registration})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobId">Related Job</Label>
                  <Select value={formData.jobId} onValueChange={(value) => setFormData({ ...formData, jobId: value })}>
                    <SelectTrigger data-testid="select-job"><SelectValue placeholder="Select job" /></SelectTrigger>
                    <SelectContent>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>{job.jobNumber} - {job.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} data-testid="input-notes" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} data-testid="button-cancel">Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                {editingClaim ? "Update" : "Create Claim"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <PoundSterling className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Claims</p>
                <p className="text-2xl font-bold" data-testid="text-pending-total">£{totalPending.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <PoundSterling className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Approved Claims</p>
                <p className="text-2xl font-bold" data-testid="text-approved-total">£{totalApproved.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">HMRC Rate (Car)</p>
                <p className="text-2xl font-bold">£0.45/mi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading mileage claims...</div>
      ) : claims.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No mileage claims</h3>
            <p className="text-muted-foreground mb-4">Submit your first mileage claim</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {claims.map((claim) => (
            <Card key={claim.id} data-testid={`card-claim-${claim.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <CardTitle className="text-lg" data-testid={`text-route-${claim.id}`}>
                        {claim.startLocation} → {claim.endLocation}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{claim.purpose}</p>
                    </div>
                    <Badge className={getStatusBadge(claim.status)} data-testid={`badge-status-${claim.id}`}>
                      {claim.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold" data-testid={`text-amount-${claim.id}`}>£{(claim.totalAmount || 0).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{claim.distanceMiles} miles</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(claim)} data-testid={`button-edit-${claim.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(claim.id)} data-testid={`button-delete-${claim.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{claim.claimDate && format(parseISO(claim.claimDate), "dd MMM yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Car className="w-4 h-4" />
                    <span className="capitalize">{claim.vehicleType}</span>
                  </div>
                  <span>@£{claim.ratePerMile}/mile</span>
                  {(claim.passengerCount || 0) > 0 && <span>+{claim.passengerCount} passengers</span>}
                  {claim.vehicleId && <span>Vehicle: {getVehicleName(claim.vehicleId)}</span>}
                  {claim.jobId && <span>Job: {getJobRef(claim.jobId)}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
