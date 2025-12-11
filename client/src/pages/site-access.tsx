import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, MapPin, Key, Car, Phone, Building, Trash2, Edit } from "lucide-react";
import type { DbSiteAccessNote } from "@shared/schema";

export default function SiteAccess() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<DbSiteAccessNote | null>(null);
  const [formData, setFormData] = useState({
    siteName: "",
    siteAddress: "",
    parkingInstructions: "",
    accessCode: "",
    keySafeLocation: "",
    keySafeCode: "",
    buildingManagerName: "",
    buildingManagerPhone: "",
    securityContact: "",
    accessHours: "",
    specialRequirements: "",
    inductionRequired: false,
    inductionNotes: "",
  });

  const { data: notes = [], isLoading } = useQuery<DbSiteAccessNote[]>({
    queryKey: ["/api/site-access", user?.id],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/site-access", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-access", user?.id] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Site access note saved" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/site-access/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-access", user?.id] });
      setIsDialogOpen(false);
      setEditingNote(null);
      resetForm();
      toast({ title: "Site access note updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/site-access/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-access", user?.id] });
      toast({ title: "Site access note deleted" });
    },
  });

  const resetForm = () => {
    setFormData({
      siteName: "",
      siteAddress: "",
      parkingInstructions: "",
      accessCode: "",
      keySafeLocation: "",
      keySafeCode: "",
      buildingManagerName: "",
      buildingManagerPhone: "",
      securityContact: "",
      accessHours: "",
      specialRequirements: "",
      inductionRequired: false,
      inductionNotes: "",
    });
  };

  const openEditDialog = (note: DbSiteAccessNote) => {
    setEditingNote(note);
    setFormData({
      siteName: note.siteName,
      siteAddress: note.siteAddress || "",
      parkingInstructions: note.parkingInstructions || "",
      accessCode: note.accessCode || "",
      keySafeLocation: note.keySafeLocation || "",
      keySafeCode: note.keySafeCode || "",
      buildingManagerName: note.buildingManagerName || "",
      buildingManagerPhone: note.buildingManagerPhone || "",
      securityContact: note.securityContact || "",
      accessHours: note.accessHours || "",
      specialRequirements: note.specialRequirements || "",
      inductionRequired: note.inductionRequired || false,
      inductionNotes: note.inductionNotes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData, userId: user?.id };
    if (editingNote) {
      updateMutation.mutate({ id: editingNote.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Site Access Notes</h1>
          <p className="text-muted-foreground">Parking, keys, access codes, and contact details per site</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingNote(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-site-access">
              <Plus className="h-4 w-4 mr-2" />
              Add Site Access
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingNote ? "Edit Site Access" : "Add Site Access Note"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Site Name *</Label>
                  <Input
                    value={formData.siteName}
                    onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                    placeholder="Tower Block A"
                    required
                    data-testid="input-site-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Access Hours</Label>
                  <Input
                    value={formData.accessHours}
                    onChange={(e) => setFormData({ ...formData, accessHours: e.target.value })}
                    placeholder="8am - 6pm Mon-Fri"
                    data-testid="input-access-hours"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Site Address</Label>
                <Input
                  value={formData.siteAddress}
                  onChange={(e) => setFormData({ ...formData, siteAddress: e.target.value })}
                  placeholder="Full address"
                  data-testid="input-site-address"
                />
              </div>
              <div className="space-y-2">
                <Label>Parking Instructions</Label>
                <Textarea
                  value={formData.parkingInstructions}
                  onChange={(e) => setFormData({ ...formData, parkingInstructions: e.target.value })}
                  placeholder="Park in visitor bays on Level -1"
                  rows={2}
                  data-testid="input-parking"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Access Code</Label>
                  <Input
                    value={formData.accessCode}
                    onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                    placeholder="1234"
                    data-testid="input-access-code"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Key Safe Location</Label>
                  <Input
                    value={formData.keySafeLocation}
                    onChange={(e) => setFormData({ ...formData, keySafeLocation: e.target.value })}
                    placeholder="Left of main entrance"
                    data-testid="input-keysafe-location"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Key Safe Code</Label>
                <Input
                  value={formData.keySafeCode}
                  onChange={(e) => setFormData({ ...formData, keySafeCode: e.target.value })}
                  placeholder="5678"
                  data-testid="input-keysafe-code"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Building Manager Name</Label>
                  <Input
                    value={formData.buildingManagerName}
                    onChange={(e) => setFormData({ ...formData, buildingManagerName: e.target.value })}
                    data-testid="input-manager-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Building Manager Phone</Label>
                  <Input
                    value={formData.buildingManagerPhone}
                    onChange={(e) => setFormData({ ...formData, buildingManagerPhone: e.target.value })}
                    data-testid="input-manager-phone"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Security Contact</Label>
                <Input
                  value={formData.securityContact}
                  onChange={(e) => setFormData({ ...formData, securityContact: e.target.value })}
                  placeholder="Security office: 020 1234 5678"
                  data-testid="input-security"
                />
              </div>
              <div className="space-y-2">
                <Label>Special Requirements</Label>
                <Textarea
                  value={formData.specialRequirements}
                  onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                  placeholder="Hard hats required, sign in at reception"
                  rows={2}
                  data-testid="input-requirements"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.inductionRequired}
                  onCheckedChange={(checked) => setFormData({ ...formData, inductionRequired: checked })}
                  data-testid="switch-induction"
                />
                <Label>Site Induction Required</Label>
              </div>
              {formData.inductionRequired && (
                <div className="space-y-2">
                  <Label>Induction Notes</Label>
                  <Textarea
                    value={formData.inductionNotes}
                    onChange={(e) => setFormData({ ...formData, inductionNotes: e.target.value })}
                    placeholder="Contact John at least 48hrs before visit"
                    rows={2}
                    data-testid="input-induction-notes"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-site-access">
                  {editingNote ? "Update" : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              No site access notes yet. Click "Add Site Access" to create one.
            </CardContent>
          </Card>
        ) : (
          notes.map((note) => (
            <Card key={note.id} data-testid={`card-site-access-${note.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {note.siteName}
                    </CardTitle>
                    {note.siteAddress && (
                      <CardDescription className="mt-1">{note.siteAddress}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(note)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(note.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {note.accessHours && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Hours:</span>
                    <span>{note.accessHours}</span>
                  </div>
                )}
                {note.parkingInstructions && (
                  <div className="flex items-start gap-2">
                    <Car className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span>{note.parkingInstructions}</span>
                  </div>
                )}
                {(note.accessCode || note.keySafeCode) && (
                  <div className="flex items-start gap-2">
                    <Key className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                      {note.accessCode && <div>Access: <span className="font-mono">{note.accessCode}</span></div>}
                      {note.keySafeCode && (
                        <div>
                          Key Safe: <span className="font-mono">{note.keySafeCode}</span>
                          {note.keySafeLocation && <span className="text-muted-foreground"> ({note.keySafeLocation})</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {(note.buildingManagerName || note.buildingManagerPhone) && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                      {note.buildingManagerName && <div>{note.buildingManagerName}</div>}
                      {note.buildingManagerPhone && <div className="font-mono">{note.buildingManagerPhone}</div>}
                    </div>
                  </div>
                )}
                {note.inductionRequired && (
                  <div className="flex items-center gap-2 text-yellow-500">
                    <MapPin className="h-4 w-4" />
                    <span>Induction Required</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
