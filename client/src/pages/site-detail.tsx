import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { ROUTES } from "@/lib/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { WorkspaceShell } from "@/features/workspaces/workspace-shell";
import { RelatedEvidencePanel } from "@/features/workspaces/related-evidence-panel";
import { EntitySummary } from "@/features/entities/entity-summary";
import { 
  ArrowLeft,
  Building2, 
  MapPin,
  Phone,
  Mail,
  Package,
  Plus,
  Search,
  Briefcase,
  Wrench,
  Edit,
  Trash2,
  MoreHorizontal,
  Car,
  Key,
  Info,
  Gauge,
  CheckSquare,
  Square,
  Play,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SMOKE_CONTROL_SYSTEM_TYPES, ASSET_TYPES } from "@shared/schema";

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
  userId: string | null;
  siteId: string | null;
  clientId: string | null;
  assetNumber: string;
  assetType: string;
  location: string | null;
  floor: string | null;
  building: string | null;
  area: string | null;
  description: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  status: string | null;
  condition: string | null;
  lastInspectionDate: string | null;
  nextInspectionDue: string | null;
  notes: string | null;
}

export default function SiteDetail() {
  const [, params] = useRoute("/sites/:id");
  const siteId = params?.id;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddAssetDialogOpen, setIsAddAssetDialogOpen] = useState(false);
  const [isBulkAddDialogOpen, setIsBulkAddDialogOpen] = useState(false);
  const [bulkTestMode, setBulkTestMode] = useState(false);
  const [selectedTestAssets, setSelectedTestAssets] = useState<string[]>([]);
  
  // Bulk add assets state
  interface BulkAssetEntry {
    assetNumber: string;
    assetType: string;
    floor: string;
    location: string;
  }
  const [bulkAssets, setBulkAssets] = useState<BulkAssetEntry[]>([
    { assetNumber: "", assetType: "aov", floor: "", location: "" }
  ]);
  const [bulkAssetDefaults, setBulkAssetDefaults] = useState({
    assetType: "aov",
    prefix: "AOV-",
    startNumber: 1,
    floor: "",
  });

  const [assetForm, setAssetForm] = useState({
    assetNumber: "",
    assetType: "",
    floor: "",
    area: "",
    location: "",
    description: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    notes: "",
  });

  const resetAssetForm = () => {
    setAssetForm({
      assetNumber: "",
      assetType: "",
      floor: "",
      area: "",
      location: "",
      description: "",
      manufacturer: "",
      model: "",
      serialNumber: "",
      notes: "",
    });
  };

  const { data: site, isLoading: siteLoading } = useQuery<Site>({
    queryKey: ["/api/sites/detail", siteId],
    enabled: !!siteId,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: !!user?.id,
  });

  const { data: assets = [], isLoading: assetsLoading } = useQuery<SiteAsset[]>({
    queryKey: ["/api/site-assets/by-site", siteId],
    enabled: !!siteId,
  });

  const createAssetMutation = useMutation({
    mutationFn: async (data: typeof assetForm) => {
      return apiRequest("POST", "/api/site-assets", { 
        ...data, 
        userId: user?.id,
        siteId: siteId,
        clientId: site?.clientId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-assets/by-site", siteId] });
      setIsAddAssetDialogOpen(false);
      resetAssetForm();
      toast({ title: "Asset added", description: "The asset has been added to this site" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create asset", variant: "destructive" });
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/site-assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-assets/by-site", siteId] });
      toast({ title: "Asset deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete asset", variant: "destructive" });
    },
  });

  const bulkCreateAssetsMutation = useMutation({
    mutationFn: async (assets: BulkAssetEntry[]) => {
      const promises = assets.map(asset => 
        apiRequest("POST", "/api/site-assets", {
          userId: user?.id,
          siteId: siteId,
          clientId: site?.clientId,
          assetNumber: asset.assetNumber,
          assetType: asset.assetType,
          floor: asset.floor || null,
          location: asset.location || null,
          status: "active",
        })
      );
      return Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-assets/by-site", siteId] });
      setIsBulkAddDialogOpen(false);
      setBulkAssets([{ assetNumber: "", assetType: "aov", floor: "", location: "" }]);
      toast({ 
        title: "Assets added", 
        description: `${variables.length} assets have been added to this site` 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create assets", variant: "destructive" });
    },
  });

  const handleAddAsset = () => {
    if (!assetForm.assetNumber || !assetForm.assetType) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }
    createAssetMutation.mutate(assetForm);
  };

  const addBulkAssetRow = () => {
    setBulkAssets(prev => [...prev, { 
      assetNumber: "", 
      assetType: bulkAssetDefaults.assetType, 
      floor: bulkAssetDefaults.floor, 
      location: "" 
    }]);
  };

  const removeBulkAssetRow = (index: number) => {
    setBulkAssets(prev => prev.filter((_, i) => i !== index));
  };

  const updateBulkAsset = (index: number, field: keyof BulkAssetEntry, value: string) => {
    setBulkAssets(prev => prev.map((asset, i) => 
      i === index ? { ...asset, [field]: value } : asset
    ));
  };

  const generateBulkAssetNumbers = () => {
    const { prefix, startNumber, assetType, floor } = bulkAssetDefaults;
    const count = bulkAssets.length;
    const newAssets = Array.from({ length: count }, (_, i) => ({
      assetNumber: `${prefix}${String(startNumber + i).padStart(3, '0')}`,
      assetType,
      floor,
      location: "",
    }));
    setBulkAssets(newAssets);
  };

  const handleBulkAddAssets = () => {
    const validAssets = bulkAssets.filter(a => a.assetNumber.trim() && a.assetType);
    const invalidCount = bulkAssets.length - validAssets.length;
    
    if (validAssets.length === 0) {
      toast({ title: "Error", description: "Please add at least one asset with a number and type", variant: "destructive" });
      return;
    }
    
    if (invalidCount > 0) {
      toast({ 
        title: "Note", 
        description: `Skipping ${invalidCount} row(s) with missing asset number or type`,
      });
    }
    
    bulkCreateAssetsMutation.mutate(validAssets);
  };

  const handleCreateJob = () => {
    if (site) {
      setLocation(`/jobs?createJob=true&clientId=${site.clientId}&siteAddress=${encodeURIComponent(site.address || site.name)}`);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.companyName || "Unknown Client";
  };

  const getSystemLabel = (systemType: string | null) => {
    if (!systemType) return "Not set";
    const system = SMOKE_CONTROL_SYSTEM_TYPES.find(s => s.value === systemType);
    return system?.label || systemType;
  };

  const getAssetTypeLabel = (type: string) => {
    const assetType = ASSET_TYPES.find(t => t.value === type);
    return assetType?.label || type;
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.assetNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.assetType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.floor?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-600">Active</Badge>;
      case "faulty":
        return <Badge variant="destructive">Faulty</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "pending_inspection":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pending Inspection</Badge>;
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  const toggleTestAsset = (assetId: string) => {
    setSelectedTestAssets(prev =>
      prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
    );
  };

  const selectAllAssets = () => {
    setSelectedTestAssets(filteredAssets.map(a => a.id));
  };

  const clearTestSelection = () => {
    setSelectedTestAssets([]);
    setBulkTestMode(false);
  };

  const navigateToTesting = (assetIds: string[]) => {
    const selectedAssets = assets.filter(a => assetIds.includes(a.id));
    const testContext = {
      siteId: site?.id,
      siteName: site?.name,
      siteAddress: site?.address,
      building: site?.name,
      assetIds,
      assets: selectedAssets.map(asset => ({
        id: asset.id,
        assetNumber: asset.assetNumber,
        type: asset.assetType,
        floor: asset.floor,
        location: asset.location,
      })),
    };
    sessionStorage.setItem('fieldTestContext', JSON.stringify(testContext));
    setLocation('/field-testing');
  };

  if (siteLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center py-8">Loading site...</div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Site Not Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The site you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/sites">
              <Button>Back to Sites</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rail = (
    <>
      <RelatedEvidencePanel />
      <Card className="border-border/70 bg-card/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Golden Thread</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>Review linked evidence, reports, and defect history.</p>
          <Link href={ROUTES.GOLDEN_THREAD} className="text-primary hover:underline">
            Open Golden Thread
          </Link>
        </CardContent>
      </Card>
    </>
  );

  return (
    <WorkspaceShell
      title={site.name}
      subtitle={getClientName(site.clientId)}
      breadcrumbs={["Sites", site.name]}
      meta={[
        { label: "Status", value: site.status || "Unknown" },
        { label: "System", value: site.systemType ? getSystemLabel(site.systemType) : "Not set" },
        { label: "City", value: site.city || "Not set" },
        { label: "Postcode", value: site.postcode || "Not set" },
      ]}
      rail={rail}
    >
      <EntitySummary
        title={site.name}
        subtitle={site.address || "No address on file"}
        status={site.status || "Unknown"}
        items={[
          { label: "Client", value: getClientName(site.clientId) },
          { label: "System type", value: site.systemType ? getSystemLabel(site.systemType) : "Not set" },
          { label: "Contact", value: site.siteContactName || "Not set" },
          { label: "Phone", value: site.siteContactPhone || "Not set" },
        ]}
      />
      <div className="flex items-center justify-between gap-3">
        <Link href="/sites">
          <Button variant="ghost" size="sm" data-testid="button-back-to-sites">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sites
          </Button>
        </Link>
        <Button onClick={handleCreateJob} data-testid="button-create-job">
          <Briefcase className="h-4 w-4 mr-2" />
          Create Job
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Site Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {site.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-muted-foreground">
                    {site.address}
                    {site.city && `, ${site.city}`}
                    {site.postcode && ` ${site.postcode}`}
                  </p>
                </div>
              </div>
            )}
            {site.siteContactName && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Site Contact</p>
                  <p className="text-muted-foreground">
                    {site.siteContactName}
                    {site.siteContactPhone && ` - ${site.siteContactPhone}`}
                  </p>
                  {site.siteContactEmail && (
                    <p className="text-sm text-muted-foreground">{site.siteContactEmail}</p>
                  )}
                </div>
              </div>
            )}
            {site.systemDescription && (
              <div className="flex items-start gap-3">
                <Wrench className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">System Info</p>
                  <p className="text-muted-foreground">{site.systemDescription}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Access Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {site.accessNotes ? (
              <div>
                <p className="font-medium text-sm">Access Notes</p>
                <p className="text-sm text-muted-foreground">{site.accessNotes}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No access notes</p>
            )}
            {site.parkingInfo && (
              <div className="flex items-start gap-2">
                <Car className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Parking</p>
                  <p className="text-sm text-muted-foreground">{site.parkingInfo}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Site Assets
              <Badge variant="secondary">{assets.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-assets"
                />
              </div>
              {assets.length > 0 && (
                <Button 
                  variant={bulkTestMode ? "default" : "outline"} 
                  onClick={() => {
                    if (bulkTestMode) {
                      clearTestSelection();
                    } else {
                      setBulkTestMode(true);
                    }
                  }} 
                  data-testid="button-bulk-test-mode"
                >
                  <Gauge className="h-4 w-4 mr-2" />
                  {bulkTestMode ? "Cancel" : "Test Assets"}
                </Button>
              )}
              {!bulkTestMode && (
                <>
                  <Button variant="outline" onClick={() => setIsBulkAddDialogOpen(true)} data-testid="button-bulk-add-assets">
                    <Package className="h-4 w-4 mr-2" />
                    Bulk Add
                  </Button>
                  <Button onClick={() => setIsAddAssetDialogOpen(true)} data-testid="button-add-asset">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Bulk Test Controls */}
          {bulkTestMode && (
            <div className="flex items-center justify-between gap-2 mt-3 p-2 bg-primary/10 rounded">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllAssets}
                  data-testid="button-select-all-assets"
                >
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Select All
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedTestAssets.length} selected
                </span>
              </div>
              <Button
                size="sm"
                disabled={selectedTestAssets.length === 0}
                onClick={() => navigateToTesting(selectedTestAssets)}
                data-testid="button-start-testing"
              >
                <Play className="h-4 w-4 mr-1" />
                Start Testing
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {assetsLoading ? (
            <div className="text-center py-8">Loading assets...</div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Assets</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "No assets match your search" : "Add assets to this site to track them"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsAddAssetDialogOpen(true)} data-testid="button-add-asset-empty">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {bulkTestMode && <TableHead className="w-[40px]"></TableHead>}
                    <TableHead>Asset #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => {
                    const isSelected = selectedTestAssets.includes(asset.id);
                    return (
                      <TableRow 
                        key={asset.id} 
                        data-testid={`row-asset-${asset.id}`}
                        className={bulkTestMode && isSelected ? "bg-primary/10" : ""}
                        onClick={bulkTestMode ? () => toggleTestAsset(asset.id) : undefined}
                        style={bulkTestMode ? { cursor: 'pointer' } : undefined}
                      >
                        {bulkTestMode && (
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleTestAsset(asset.id)}
                              data-testid={`checkbox-asset-${asset.id}`}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{asset.assetNumber}</TableCell>
                        <TableCell>{getAssetTypeLabel(asset.assetType)}</TableCell>
                        <TableCell>{asset.floor || "-"}</TableCell>
                        <TableCell>{asset.location || asset.area || "-"}</TableCell>
                        <TableCell>{getStatusBadge(asset.status)}</TableCell>
                        <TableCell>
                          {bulkTestMode ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToTesting([asset.id]);
                              }}
                              data-testid={`button-test-asset-${asset.id}`}
                            >
                              <Gauge className="h-4 w-4" />
                            </Button>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-asset-menu-${asset.id}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => navigateToTesting([asset.id])}
                                >
                                  <Gauge className="h-4 w-4 mr-2" />
                                  Test Asset
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => deleteAssetMutation.mutate(asset.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddAssetDialogOpen} onOpenChange={setIsAddAssetDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Asset</DialogTitle>
            <DialogDescription>Add a new asset to {site.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assetNumber">Asset Number *</Label>
                <Input
                  id="assetNumber"
                  value={assetForm.assetNumber}
                  onChange={(e) => setAssetForm(prev => ({ ...prev, assetNumber: e.target.value }))}
                  placeholder="e.g., AOV-001"
                  data-testid="input-asset-number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assetType">Asset Type *</Label>
                <Select value={assetForm.assetType} onValueChange={(v) => setAssetForm(prev => ({ ...prev, assetType: v }))}>
                  <SelectTrigger data-testid="select-asset-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  value={assetForm.floor}
                  onChange={(e) => setAssetForm(prev => ({ ...prev, floor: e.target.value }))}
                  placeholder="e.g., Ground, Level 1"
                  data-testid="input-asset-floor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  value={assetForm.area}
                  onChange={(e) => setAssetForm(prev => ({ ...prev, area: e.target.value }))}
                  placeholder="e.g., Lobby, Stairwell A"
                  data-testid="input-asset-area"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location Description</Label>
              <Input
                id="location"
                value={assetForm.location}
                onChange={(e) => setAssetForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Above main entrance"
                data-testid="input-asset-location"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={assetForm.manufacturer}
                  onChange={(e) => setAssetForm(prev => ({ ...prev, manufacturer: e.target.value }))}
                  placeholder="Manufacturer name"
                  data-testid="input-asset-manufacturer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={assetForm.model}
                  onChange={(e) => setAssetForm(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="Model number"
                  data-testid="input-asset-model"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={assetForm.notes}
                onChange={(e) => setAssetForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes"
                data-testid="input-asset-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddAssetDialogOpen(false);
              resetAssetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddAsset}
              disabled={createAssetMutation.isPending}
              data-testid="button-save-asset"
            >
              Add Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkAddDialogOpen} onOpenChange={setIsBulkAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Add Assets</DialogTitle>
            <DialogDescription>Add multiple assets to {site.name} at once</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 p-3 rounded-lg space-y-3">
              <p className="text-sm font-medium">Quick Generate</p>
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Prefix</Label>
                  <Input
                    value={bulkAssetDefaults.prefix}
                    onChange={(e) => setBulkAssetDefaults(prev => ({ ...prev, prefix: e.target.value }))}
                    placeholder="AOV-"
                    data-testid="input-bulk-prefix"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Start #</Label>
                  <Input
                    type="number"
                    value={bulkAssetDefaults.startNumber}
                    onChange={(e) => setBulkAssetDefaults(prev => ({ ...prev, startNumber: parseInt(e.target.value) || 1 }))}
                    data-testid="input-bulk-start"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select 
                    value={bulkAssetDefaults.assetType} 
                    onValueChange={(v) => setBulkAssetDefaults(prev => ({ ...prev, assetType: v }))}
                  >
                    <SelectTrigger data-testid="select-bulk-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSET_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Floor</Label>
                  <Input
                    value={bulkAssetDefaults.floor}
                    onChange={(e) => setBulkAssetDefaults(prev => ({ ...prev, floor: e.target.value }))}
                    placeholder="Ground"
                    data-testid="input-bulk-floor"
                  />
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateBulkAssetNumbers}
                data-testid="button-generate-numbers"
              >
                Generate Asset Numbers
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Assets ({bulkAssets.length})</Label>
                <Button variant="outline" size="sm" onClick={addBulkAssetRow} data-testid="button-add-row">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Row
                </Button>
              </div>
              
              <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                {bulkAssets.map((asset, index) => (
                  <div key={index} className="flex items-center gap-2 p-2" data-testid={`row-bulk-asset-${index}`}>
                    <Input
                      placeholder="Asset #"
                      value={asset.assetNumber}
                      onChange={(e) => updateBulkAsset(index, 'assetNumber', e.target.value)}
                      className="flex-1"
                      data-testid={`input-bulk-asset-number-${index}`}
                    />
                    <Select 
                      value={asset.assetType} 
                      onValueChange={(v) => updateBulkAsset(index, 'assetType', v)}
                    >
                      <SelectTrigger className="w-32" data-testid={`select-bulk-asset-type-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Floor"
                      value={asset.floor}
                      onChange={(e) => updateBulkAsset(index, 'floor', e.target.value)}
                      className="w-20"
                      data-testid={`input-bulk-asset-floor-${index}`}
                    />
                    <Input
                      placeholder="Location"
                      value={asset.location}
                      onChange={(e) => updateBulkAsset(index, 'location', e.target.value)}
                      className="flex-1"
                      data-testid={`input-bulk-asset-location-${index}`}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeBulkAssetRow(index)}
                      disabled={bulkAssets.length <= 1}
                      data-testid={`button-remove-row-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsBulkAddDialogOpen(false);
              setBulkAssets([{ assetNumber: "", assetType: "aov", floor: "", location: "" }]);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkAddAssets}
              disabled={bulkCreateAssetsMutation.isPending}
              data-testid="button-confirm-bulk-add"
            >
              Add {bulkAssets.filter(a => a.assetNumber).length} Assets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkspaceShell>
  );
}
