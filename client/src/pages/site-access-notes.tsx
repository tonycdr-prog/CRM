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
  MapPin, 
  Car, 
  Key, 
  Phone,
  Clock,
  AlertTriangle,
  Search
} from "lucide-react";
import type { DbSiteAccessNote, DbClient } from "@shared/schema";

export default function SiteAccessNotes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<DbSiteAccessNote | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    clientId: "",
    siteName: "",
    siteAddress: "",
    parkingInstructions: "",
    accessCode: "",
    keySafeCode: "",
    keySafeLocation: "",
    buildingManagerName: "",
    buildingManagerPhone: "",
    securityContact: "",
    accessHours: "",
    specialRequirements: "",
    inductionRequired: false,
    inductionNotes: "",
  });

  const { data: notes = [], isLoading } = useQuery<DbSiteAccessNote[]>({
    queryKey: ["/api/site-access-notes", user?.id],
    enabled: !!user?.id,
  });

  const { data: clients = [] } = useQuery<DbClient[]>({
    queryKey: ["/api/clients", user?.id],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/site-access-notes", { ...data, userId: user?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-access-notes", user?.id] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Site access note created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) => apiRequest("PATCH", `/api/site-access-notes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-access-notes", user?.id] });
      setIsDialogOpen(false);
      setEditingNote(null);
      resetForm();
      toast({ title: "Site access note updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/site-access-notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-access-notes", user?.id] });
      toast({ title: "Site access note deleted" });
    },
  });

  const resetForm = () => {
    setFormData({
      clientId: "",
      siteName: "",
      siteAddress: "",
      parkingInstructions: "",
      accessCode: "",
      keySafeCode: "",
      keySafeLocation: "",
      buildingManagerName: "",
      buildingManagerPhone: "",
      securityContact: "",
      accessHours: "",
      specialRequirements: "",
      inductionRequired: false,
      inductionNotes: "",
    });
  };

  const handleEdit = (note: DbSiteAccessNote) => {
    setEditingNote(note);
    setFormData({
      clientId: note.clientId || "",
      siteName: note.siteName,
      siteAddress: note.siteAddress || "",
      parkingInstructions: note.parkingInstructions || "",
      accessCode: note.accessCode || "",
      keySafeCode: note.keySafeCode || "",
      keySafeLocation: note.keySafeLocation || "",
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
    if (editingNote) {
      updateMutation.mutate({ id: editingNote.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "No client";
    const client = clients.find(c => c.id === clientId);
    return client?.companyName || "Unknown";
  };

  const filteredNotes = notes.filter(note =>
    note.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.siteAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.buildingManagerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64" data-testid="loading-state">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6" data-testid="page-site-access-notes">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Site Access Notes</h1>
          <p className="text-muted-foreground">Store parking, access codes, contacts, and safety info per site</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingNote(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-note">
              <Plus className="w-4 h-4 mr-2" />
              Add Site Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">{editingNote ? "Edit Site Access Note" : "New Site Access Note"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Client</Label>
                  <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                    <SelectTrigger data-testid="select-client">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Site Name *</Label>
                  <Input value={formData.siteName} onChange={(e) => setFormData({ ...formData, siteName: e.target.value })} required data-testid="input-site-name" />
                </div>
                <div>
                  <Label>Site Address</Label>
                  <Input value={formData.siteAddress} onChange={(e) => setFormData({ ...formData, siteAddress: e.target.value })} data-testid="input-site-address" />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Car className="w-4 h-4" /> Parking & Access</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Parking Instructions</Label>
                    <Textarea value={formData.parkingInstructions} onChange={(e) => setFormData({ ...formData, parkingInstructions: e.target.value })} data-testid="input-parking" />
                  </div>
                  <div>
                    <Label>Access Code</Label>
                    <Input value={formData.accessCode} onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })} data-testid="input-access-code" />
                  </div>
                  <div>
                    <Label>Access Hours</Label>
                    <Input value={formData.accessHours} onChange={(e) => setFormData({ ...formData, accessHours: e.target.value })} placeholder="e.g., 08:00-18:00 Mon-Fri" data-testid="input-access-hours" />
                  </div>
                  <div>
                    <Label>Key Safe Code</Label>
                    <Input value={formData.keySafeCode} onChange={(e) => setFormData({ ...formData, keySafeCode: e.target.value })} data-testid="input-keysafe-code" />
                  </div>
                  <div>
                    <Label>Key Safe Location</Label>
                    <Input value={formData.keySafeLocation} onChange={(e) => setFormData({ ...formData, keySafeLocation: e.target.value })} data-testid="input-keysafe-location" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Phone className="w-4 h-4" /> Site Contacts</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Building Manager Name</Label>
                    <Input value={formData.buildingManagerName} onChange={(e) => setFormData({ ...formData, buildingManagerName: e.target.value })} data-testid="input-manager-name" />
                  </div>
                  <div>
                    <Label>Building Manager Phone</Label>
                    <Input value={formData.buildingManagerPhone} onChange={(e) => setFormData({ ...formData, buildingManagerPhone: e.target.value })} data-testid="input-manager-phone" />
                  </div>
                  <div>
                    <Label>Security Contact</Label>
                    <Input value={formData.securityContact} onChange={(e) => setFormData({ ...formData, securityContact: e.target.value })} data-testid="input-security-contact" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Safety & Induction</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.inductionRequired} onCheckedChange={(v) => setFormData({ ...formData, inductionRequired: v })} data-testid="switch-induction" />
                    <Label>Induction Required</Label>
                  </div>
                  <div className="col-span-2">
                    <Label>Induction Notes</Label>
                    <Textarea value={formData.inductionNotes} onChange={(e) => setFormData({ ...formData, inductionNotes: e.target.value })} data-testid="input-induction-notes" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label>Special Requirements</Label>
                <Textarea value={formData.specialRequirements} onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })} data-testid="input-special-requirements" />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {editingNote ? "Update" : "Create"}
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
            placeholder="Search sites..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Badge variant="secondary" data-testid="badge-count">{filteredNotes.length} sites</Badge>
      </div>

      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground" data-testid="text-empty-state">No site access notes found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredNotes.map((note) => (
            <Card key={note.id} data-testid={`card-note-${note.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2" data-testid={`text-site-name-${note.id}`}>
                      <MapPin className="w-5 h-5" />
                      {note.siteName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{note.siteAddress}</p>
                    <Badge variant="outline" className="mt-2">{getClientName(note.clientId)}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(note)} data-testid={`button-edit-${note.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(note.id)} data-testid={`button-delete-${note.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {note.accessCode && (
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      <span>Access: {note.accessCode}</span>
                    </div>
                  )}
                  {note.keySafeCode && (
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      <span>Key Safe: {note.keySafeCode}</span>
                    </div>
                  )}
                  {note.buildingManagerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{note.buildingManagerPhone}</span>
                    </div>
                  )}
                  {note.accessHours && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{note.accessHours}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  {note.inductionRequired && <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Induction Required</Badge>}
                  {note.specialRequirements && <Badge variant="outline">{note.specialRequirements}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
