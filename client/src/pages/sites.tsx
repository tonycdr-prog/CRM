import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Building2, 
  MapPin,
  MoreHorizontal,
  Edit,
  Trash2,
  Package,
  Briefcase,
  Phone,
  Mail,
  Wrench,
  Layers,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { SMOKE_CONTROL_SYSTEM_TYPES } from "@shared/schema";

interface Site {
  id: string;
  userId: string | null;
  clientId: string;
  name: string;
  address: string | null;
  postcode: string | null;
  city: string | null;
  systemType: string | null;
  systemDescription: string | null;
  accessNotes: string | null;
  parkingInfo: string | null;
  siteContactName: string | null;
  siteContactPhone: string | null;
  siteContactEmail: string | null;
  notes: string | null;
  status: string | null;
  createdAt: string;
}

interface Client {
  id: string;
  companyName: string;
}

interface SiteAsset {
  id: string;
  assetNumber: string;
  assetType: string;
  location: string | null;
  floor: string | null;
  status: string | null;
}

interface BulkAssetEntry {
  assetNumber: string;
  assetType: string;
  floor: string;
  location: string;
}

const ASSET_TYPES = [
  { value: "aov", label: "AOV" },
  { value: "smoke_damper", label: "Smoke Damper" },
  { value: "fire_damper", label: "Fire Damper" },
  { value: "fan", label: "Fan" },
  { value: "control_panel", label: "Control Panel" },
  { value: "sensor", label: "Sensor" },
  { value: "other", label: "Other" },
];

export default function Sites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>("all");
  const [isBulkAddDialogOpen, setIsBulkAddDialogOpen] = useState(false);
  const [bulkAddSite, setBulkAddSite] = useState<Site | null>(null);
  const [bulkAssets, setBulkAssets] = useState<BulkAssetEntry[]>([
    { assetNumber: "", assetType: "aov", floor: "", location: "" }
  ]);
  const [bulkPrefix, setBulkPrefix] = useState("");
  const [bulkCount, setBulkCount] = useState(1);
  const [bulkDefaultType, setBulkDefaultType] = useState("aov");
  const [bulkDefaultFloor, setBulkDefaultFloor] = useState("");
  const [bulkDefaultLocation, setBulkDefaultLocation] = useState("");

  const [formData, setFormData] = useState({
    clientId: "",
    name: "",
    address: "",
    postcode: "",
    city: "",
    systemType: "",
    systemDescription: "",
    accessNotes: "",
    parkingInfo: "",
    siteContactName: "",
    siteContactPhone: "",
    siteContactEmail: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      clientId: "",
      name: "",
      address: "",
      postcode: "",
      city: "",
      systemType: "",
      systemDescription: "",
      accessNotes: "",
      parkingInfo: "",
      siteContactName: "",
      siteContactPhone: "",
      siteContactEmail: "",
      notes: "",
    });
    setEditingSite(null);
  };

  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ["/api/sites", user?.id],
    enabled: !!user?.id,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", user?.id],
    enabled: !!user?.id,
  });

  const createSiteMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/sites", { ...data, userId: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Site created", description: "The site has been added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create site", variant: "destructive" });
    },
  });

  const updateSiteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return apiRequest("PATCH", `/api/sites/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      setEditingSite(null);
      resetForm();
      toast({ title: "Site updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update site", variant: "destructive" });
    },
  });

  const deleteSiteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/sites/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      toast({ title: "Site deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete site", variant: "destructive" });
    },
  });

  const bulkCreateAssetsMutation = useMutation({
    mutationFn: async (data: { site: Site; assets: BulkAssetEntry[] }) => {
      const validAssets = data.assets.filter(a => a.assetNumber.trim() && a.assetType);
      const promises = validAssets.map(asset =>
        apiRequest("POST", "/api/site-assets", {
          userId: user?.id,
          siteId: data.site.id,
          clientId: data.site.clientId,
          assetNumber: asset.assetNumber.trim(),
          assetType: asset.assetType,
          floor: asset.floor || null,
          location: asset.location || null,
          status: "active",
        })
      );
      return Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-assets/by-site", variables.site.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-assets"] });
      setIsBulkAddDialogOpen(false);
      setBulkAddSite(null);
      resetBulkForm();
      const count = variables.assets.filter(a => a.assetNumber.trim() && a.assetType).length;
      toast({ title: "Assets created", description: `${count} asset(s) added to ${variables.site.name}` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create assets", variant: "destructive" });
    },
  });

  const resetBulkForm = () => {
    setBulkAssets([{ assetNumber: "", assetType: "aov", floor: "", location: "" }]);
    setBulkPrefix("");
    setBulkCount(1);
    setBulkDefaultType("aov");
    setBulkDefaultFloor("");
    setBulkDefaultLocation("");
  };

  const handleGenerateBulkAssets = () => {
    if (!bulkPrefix || bulkCount < 1) return;
    const newAssets: BulkAssetEntry[] = [];
    for (let i = 1; i <= bulkCount; i++) {
      newAssets.push({
        assetNumber: `${bulkPrefix}${i.toString().padStart(2, '0')}`,
        assetType: bulkDefaultType,
        floor: bulkDefaultFloor,
        location: bulkDefaultLocation,
      });
    }
    setBulkAssets(newAssets);
  };

  const handleAddBulkRow = () => {
    setBulkAssets([...bulkAssets, { assetNumber: "", assetType: "aov", floor: "", location: "" }]);
  };

  const handleRemoveBulkRow = (index: number) => {
    if (bulkAssets.length <= 1) return;
    setBulkAssets(bulkAssets.filter((_, i) => i !== index));
  };

  const updateBulkAsset = (index: number, field: keyof BulkAssetEntry, value: string) => {
    setBulkAssets(prev => prev.map((asset, i) => 
      i === index ? { ...asset, [field]: value } : asset
    ));
  };

  const handleBulkAddAssets = () => {
    if (!bulkAddSite) return;
    const validAssets = bulkAssets.filter(a => a.assetNumber.trim() && a.assetType);
    if (validAssets.length === 0) {
      toast({ title: "Error", description: "Please add at least one asset with a number and type", variant: "destructive" });
      return;
    }
    bulkCreateAssetsMutation.mutate({ site: bulkAddSite, assets: bulkAssets });
  };

  const openBulkAddDialog = (site: Site) => {
    setBulkAddSite(site);
    resetBulkForm();
    setIsBulkAddDialogOpen(true);
  };

  const handleCreateSite = () => {
    if (!formData.name || !formData.clientId) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }
    createSiteMutation.mutate(formData);
  };

  const handleUpdateSite = () => {
    if (!editingSite) return;
    updateSiteMutation.mutate({ id: editingSite.id, data: formData });
  };

  const openEditDialog = (site: Site) => {
    setEditingSite(site);
    setFormData({
      clientId: site.clientId,
      name: site.name,
      address: site.address || "",
      postcode: site.postcode || "",
      city: site.city || "",
      systemType: site.systemType || "",
      systemDescription: site.systemDescription || "",
      accessNotes: site.accessNotes || "",
      parkingInfo: site.parkingInfo || "",
      siteContactName: site.siteContactName || "",
      siteContactPhone: site.siteContactPhone || "",
      siteContactEmail: site.siteContactEmail || "",
      notes: site.notes || "",
    });
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.companyName || "Unknown Client";
  };

  const getSystemLabel = (systemType: string | null) => {
    if (!systemType) return null;
    const system = SMOKE_CONTROL_SYSTEM_TYPES.find(s => s.value === systemType);
    return system?.label || systemType;
  };

  const filteredSites = sites.filter(site => {
    const matchesSearch = 
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getClientName(site.clientId).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClient = selectedClientFilter === "all" || site.clientId === selectedClientFilter;
    return matchesSearch && matchesClient;
  });

  const sitesGroupedByClient = filteredSites.reduce((acc, site) => {
    const clientId = site.clientId;
    if (!acc[clientId]) {
      acc[clientId] = [];
    }
    acc[clientId].push(site);
    return acc;
  }, {} as Record<string, Site[]>);

  const handleCreateJob = (site: Site) => {
    setLocation(`/jobs?createJob=true&clientId=${site.clientId}&siteAddress=${encodeURIComponent(site.address || site.name)}`);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Sites</h1>
          <p className="text-sm text-muted-foreground">Manage building locations and their systems</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-site">
          <Plus className="h-4 w-4 mr-2" />
          Add Site
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-sites"
          />
        </div>
        <Select value={selectedClientFilter} onValueChange={setSelectedClientFilter}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-client-filter">
            <SelectValue placeholder="Filter by client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading sites...</div>
      ) : filteredSites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Sites Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? "No sites match your search" : "Add your first site to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-site-empty">
                <Plus className="h-4 w-4 mr-2" />
                Add Site
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4" defaultValue={Object.keys(sitesGroupedByClient)}>
          {Object.entries(sitesGroupedByClient).map(([clientId, clientSites]) => (
            <AccordionItem key={clientId} value={clientId} className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">{getClientName(clientId)}</span>
                  <Badge variant="secondary">{clientSites.length} site{clientSites.length !== 1 ? "s" : ""}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {clientSites.map((site) => (
                    <Card key={site.id} className="overflow-hidden" data-testid={`card-site-${site.id}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold truncate" data-testid={`text-site-name-${site.id}`}>{site.name}</h3>
                              {site.systemType && (
                                <Badge variant="outline" className="shrink-0">
                                  <Wrench className="h-3 w-3 mr-1" />
                                  {getSystemLabel(site.systemType)}
                                </Badge>
                              )}
                            </div>
                            {site.address && (
                              <div className="flex items-start gap-2 text-sm text-muted-foreground mb-1">
                                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>{site.address}{site.city ? `, ${site.city}` : ""}{site.postcode ? ` ${site.postcode}` : ""}</span>
                              </div>
                            )}
                            {site.siteContactName && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4 shrink-0" />
                                <span>{site.siteContactName}{site.siteContactPhone ? ` - ${site.siteContactPhone}` : ""}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/sites/${site.id}`}>
                              <Button variant="outline" size="sm" data-testid={`button-view-site-${site.id}`}>
                                <Package className="h-4 w-4 mr-1" />
                                Assets
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openBulkAddDialog(site)}
                              data-testid={`button-bulk-add-${site.id}`}
                            >
                              <Layers className="h-4 w-4 mr-1" />
                              Bulk Add
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCreateJob(site)}
                              data-testid={`button-create-job-${site.id}`}
                            >
                              <Briefcase className="h-4 w-4 mr-1" />
                              Create Job
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-site-menu-${site.id}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(site)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => deleteSiteMutation.mutate(site.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <Dialog open={isCreateDialogOpen || !!editingSite} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setEditingSite(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSite ? "Edit Site" : "Add New Site"}</DialogTitle>
            <DialogDescription>
              {editingSite ? "Update the site details" : "Add a new building or location"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client *</Label>
                <Select value={formData.clientId} onValueChange={(v) => setFormData(prev => ({ ...prev, clientId: v }))}>
                  <SelectTrigger data-testid="select-site-client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Site Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Tower A, Main Building"
                  data-testid="input-site-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Street address"
                data-testid="input-site-address"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  data-testid="input-site-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  value={formData.postcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, postcode: e.target.value }))}
                  placeholder="Postcode"
                  data-testid="input-site-postcode"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="systemType">System Type</Label>
                <Select value={formData.systemType} onValueChange={(v) => setFormData(prev => ({ ...prev, systemType: v }))}>
                  <SelectTrigger data-testid="select-site-system">
                    <SelectValue placeholder="Select system type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SMOKE_CONTROL_SYSTEM_TYPES.map((system) => (
                      <SelectItem key={system.value} value={system.value}>{system.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="systemDescription">System Description</Label>
                <Input
                  id="systemDescription"
                  value={formData.systemDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, systemDescription: e.target.value }))}
                  placeholder="Additional system info"
                  data-testid="input-site-system-desc"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="siteContactName">Site Contact</Label>
                <Input
                  id="siteContactName"
                  value={formData.siteContactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, siteContactName: e.target.value }))}
                  placeholder="Contact name"
                  data-testid="input-site-contact-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteContactPhone">Phone</Label>
                <Input
                  id="siteContactPhone"
                  value={formData.siteContactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, siteContactPhone: e.target.value }))}
                  placeholder="Phone number"
                  data-testid="input-site-contact-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteContactEmail">Email</Label>
                <Input
                  id="siteContactEmail"
                  value={formData.siteContactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, siteContactEmail: e.target.value }))}
                  placeholder="Email address"
                  data-testid="input-site-contact-email"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accessNotes">Access Notes</Label>
                <Textarea
                  id="accessNotes"
                  value={formData.accessNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, accessNotes: e.target.value }))}
                  placeholder="Key collection, access codes, etc."
                  data-testid="input-site-access-notes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parkingInfo">Parking Info</Label>
                <Textarea
                  id="parkingInfo"
                  value={formData.parkingInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, parkingInfo: e.target.value }))}
                  placeholder="Where to park, restrictions"
                  data-testid="input-site-parking"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about the site"
                data-testid="input-site-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              setEditingSite(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={editingSite ? handleUpdateSite : handleCreateSite}
              disabled={createSiteMutation.isPending || updateSiteMutation.isPending}
              data-testid="button-save-site"
            >
              {editingSite ? "Save Changes" : "Add Site"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkAddDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsBulkAddDialogOpen(false);
          setBulkAddSite(null);
          resetBulkForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Add Assets to {bulkAddSite?.name}</DialogTitle>
            <DialogDescription>
              Add multiple assets at once using sequential numbering or manual entry
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Generate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Prefix</Label>
                    <Input
                      placeholder="e.g., AOV-"
                      value={bulkPrefix}
                      onChange={(e) => setBulkPrefix(e.target.value)}
                      data-testid="input-bulk-prefix"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Count</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={bulkCount}
                      onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
                      data-testid="input-bulk-count"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={bulkDefaultType} onValueChange={setBulkDefaultType}>
                      <SelectTrigger data-testid="select-bulk-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Floor</Label>
                    <Input
                      placeholder="e.g., 1"
                      value={bulkDefaultFloor}
                      onChange={(e) => setBulkDefaultFloor(e.target.value)}
                      data-testid="input-bulk-floor"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Location</Label>
                    <Input
                      placeholder="e.g., Lobby"
                      value={bulkDefaultLocation}
                      onChange={(e) => setBulkDefaultLocation(e.target.value)}
                      data-testid="input-bulk-location"
                    />
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  className="mt-3 w-full"
                  onClick={handleGenerateBulkAssets}
                  disabled={!bulkPrefix || bulkCount < 1}
                  data-testid="button-generate-bulk"
                >
                  Generate {bulkCount} Asset{bulkCount !== 1 ? "s" : ""}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Assets to Add ({bulkAssets.filter(a => a.assetNumber.trim()).length} valid)</Label>
                <Button variant="outline" size="sm" onClick={handleAddBulkRow} data-testid="button-add-row">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Row
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Asset Number *</TableHead>
                      <TableHead className="w-[140px]">Type *</TableHead>
                      <TableHead className="w-[100px]">Floor</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bulkAssets.map((asset, index) => (
                      <TableRow key={index}>
                        <TableCell className="p-2">
                          <Input
                            value={asset.assetNumber}
                            onChange={(e) => updateBulkAsset(index, 'assetNumber', e.target.value)}
                            placeholder="Asset #"
                            className="h-8"
                            data-testid={`input-asset-number-${index}`}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Select value={asset.assetType} onValueChange={(v) => updateBulkAsset(index, 'assetType', v)}>
                            <SelectTrigger className="h-8" data-testid={`select-asset-type-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ASSET_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            value={asset.floor}
                            onChange={(e) => updateBulkAsset(index, 'floor', e.target.value)}
                            placeholder="Floor"
                            className="h-8"
                            data-testid={`input-asset-floor-${index}`}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            value={asset.location}
                            onChange={(e) => updateBulkAsset(index, 'location', e.target.value)}
                            placeholder="Location"
                            className="h-8"
                            data-testid={`input-asset-location-${index}`}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemoveBulkRow(index)}
                            disabled={bulkAssets.length <= 1}
                            data-testid={`button-remove-row-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsBulkAddDialogOpen(false);
              setBulkAddSite(null);
              resetBulkForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkAddAssets}
              disabled={bulkCreateAssetsMutation.isPending || bulkAssets.filter(a => a.assetNumber.trim()).length === 0}
              data-testid="button-confirm-bulk-add"
            >
              {bulkCreateAssetsMutation.isPending ? "Adding..." : `Add ${bulkAssets.filter(a => a.assetNumber.trim()).length} Asset(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
