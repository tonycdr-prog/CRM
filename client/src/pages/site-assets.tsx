import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Package, Layers } from "lucide-react";
import type { DbSiteAsset, DbAssetBatch, DbProject, DbVisitType } from "@shared/schema";

const siteAssetFormSchema = z.object({
  assetNumber: z.string().min(1, "Asset number is required"),
  assetType: z.string().default("aov"),
  visitType: z.string().optional(),
  building: z.string().optional(),
  floor: z.string().optional(),
  area: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  installDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  status: z.string().default("active"),
  condition: z.string().default("good"),
  notes: z.string().optional(),
  projectId: z.string().optional(),
});

const bulkAssetFormSchema = z.object({
  batchName: z.string().min(1, "Batch name is required"),
  assetType: z.string().default("aov"),
  visitType: z.string().optional(),
  projectId: z.string().optional(),
  building: z.string().optional(),
  startingFloor: z.string().default("G"),
  startingArea: z.string().optional(),
  numberingPrefix: z.string().default("AOV-"),
  startingNumber: z.number().min(1).default(1),
  numberingFormat: z.string().default("###"),
  quantity: z.number().min(1).max(500).default(10),
  notes: z.string().optional(),
});

type SiteAssetFormValues = z.infer<typeof siteAssetFormSchema>;
type BulkAssetFormValues = z.infer<typeof bulkAssetFormSchema>;

const ASSET_TYPES = [
  { value: "aov", label: "AOV (Automatic Opening Vent)" },
  { value: "smoke_damper", label: "Smoke Control Damper" },
  { value: "control_panel", label: "Control Panel" },
  { value: "detector", label: "Smoke/Heat Detector" },
  { value: "fan", label: "Extract/Supply Fan" },
  { value: "duct", label: "Smoke Duct" },
  { value: "firefighter_switch", label: "Firefighter Switch" },
  { value: "actuator", label: "Actuator" },
  { value: "pressure_sensor", label: "Pressure Sensor" },
  { value: "air_inlet", label: "Air Inlet" },
];

const ASSET_CONDITIONS = [
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
  { value: "critical", label: "Critical" },
];

const ASSET_STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "faulty", label: "Faulty" },
  { value: "replaced", label: "Replaced" },
  { value: "pending_inspection", label: "Pending Inspection" },
];

const NUMBERING_FORMATS = [
  { value: "###", label: "001, 002, 003..." },
  { value: "##", label: "01, 02, 03..." },
  { value: "#", label: "1, 2, 3..." },
];

const ASSET_PREFIXES: Record<string, string> = {
  aov: "AOV-",
  smoke_damper: "SCD-",
  control_panel: "CP-",
  detector: "DET-",
  fan: "FAN-",
  duct: "DCT-",
  firefighter_switch: "FFS-",
  actuator: "ACT-",
  pressure_sensor: "PS-",
  air_inlet: "AIR-",
};

function formatAssetNumber(prefix: string, number: number, format: string): string {
  const digits = format.length;
  return `${prefix}${String(number).padStart(digits, "0")}`;
}

function calculateFloor(startingFloor: string, index: number, quantity: number): string {
  const startNum = startingFloor === "G" ? 0 : startingFloor === "B" ? -1 : parseInt(startingFloor) || 0;
  const floorNum = startNum + Math.floor(index / Math.ceil(quantity / 20));
  if (floorNum === 0) return "G";
  if (floorNum < 0) return `B${Math.abs(floorNum)}`;
  return String(floorNum);
}

export default function SiteAssets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("assets");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<DbSiteAsset | null>(null);
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterAssetType, setFilterAssetType] = useState<string>("all");

  const userId = user?.id || "anonymous";

  const assetForm = useForm<SiteAssetFormValues>({
    resolver: zodResolver(siteAssetFormSchema),
    defaultValues: {
      assetNumber: "",
      assetType: "aov",
      visitType: "none",
      building: "",
      floor: "",
      area: "",
      location: "",
      description: "",
      manufacturer: "",
      model: "",
      serialNumber: "",
      installDate: "",
      warrantyExpiry: "",
      status: "active",
      condition: "good",
      notes: "",
      projectId: "none",
    },
  });

  const bulkForm = useForm<BulkAssetFormValues>({
    resolver: zodResolver(bulkAssetFormSchema),
    defaultValues: {
      batchName: "",
      assetType: "aov",
      visitType: "none",
      projectId: "none",
      building: "",
      startingFloor: "G",
      startingArea: "",
      numberingPrefix: "AOV-",
      startingNumber: 1,
      numberingFormat: "###",
      quantity: 10,
      notes: "",
    },
  });

  const { data: siteAssets = [], isLoading: loadingAssets } = useQuery<DbSiteAsset[]>({
    queryKey: ["/api/site-assets", userId],
  });

  const { data: assetBatches = [], isLoading: loadingBatches } = useQuery<DbAssetBatch[]>({
    queryKey: ["/api/asset-batches", userId],
  });

  const { data: projects = [] } = useQuery<DbProject[]>({
    queryKey: ["/api/projects", userId],
  });

  const { data: visitTypes = [] } = useQuery<DbVisitType[]>({
    queryKey: ["/api/visit-types", userId],
  });

  const createAssetMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/site-assets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-assets", userId] });
      toast({ title: "Asset created successfully" });
      setDialogOpen(false);
      assetForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create asset", variant: "destructive" });
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/site-assets/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-assets", userId] });
      toast({ title: "Asset updated successfully" });
      setDialogOpen(false);
      assetForm.reset();
      setEditingAsset(null);
    },
    onError: () => {
      toast({ title: "Failed to update asset", variant: "destructive" });
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/site-assets/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-assets", userId] });
      toast({ title: "Asset deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete asset", variant: "destructive" });
    },
  });

  const createBulkAssetsMutation = useMutation({
    mutationFn: async (data: BulkAssetFormValues) => {
      const visitType = data.visitType === "none" ? null : data.visitType;
      const projectId = data.projectId === "none" ? null : data.projectId;
      
      const batchResponse = await apiRequest("POST", "/api/asset-batches", {
        userId,
        batchName: data.batchName,
        assetType: data.assetType,
        visitType: visitType || null,
        projectId: projectId || null,
        building: data.building || null,
        startingFloor: data.startingFloor,
        startingArea: data.startingArea || null,
        numberingPrefix: data.numberingPrefix,
        startingNumber: data.startingNumber,
        numberingFormat: data.numberingFormat,
        quantity: data.quantity,
        notes: data.notes || null,
        status: "in_progress",
        createdAssetsCount: 0,
      }) as unknown as DbAssetBatch;

      const assets: any[] = [];
      for (let i = 0; i < data.quantity; i++) {
        const assetNumber = formatAssetNumber(data.numberingPrefix, data.startingNumber + i, data.numberingFormat);
        const floor = calculateFloor(data.startingFloor, i, data.quantity);
        
        assets.push({
          userId,
          projectId: projectId || null,
          assetNumber,
          assetType: data.assetType,
          visitType: visitType || null,
          building: data.building || null,
          floor,
          area: data.startingArea || null,
          status: "active",
          condition: "good",
          batchId: batchResponse.id,
          notes: data.notes || null,
        });
      }

      await apiRequest("POST", "/api/site-assets/bulk", { assets });
      
      await apiRequest("PATCH", `/api/asset-batches/${batchResponse.id}`, {
        status: "completed",
        createdAssetsCount: data.quantity,
      });

      return batchResponse;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-assets", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/asset-batches", userId] });
      toast({ title: `${variables.quantity} assets created successfully` });
      setBulkDialogOpen(false);
      bulkForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create bulk assets", variant: "destructive" });
    },
  });

  const deleteBatchMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/asset-batches/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-batches", userId] });
      toast({ title: "Batch record deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete batch record", variant: "destructive" });
    },
  });

  const handleEdit = (asset: DbSiteAsset) => {
    setEditingAsset(asset);
    assetForm.reset({
      assetNumber: asset.assetNumber,
      assetType: asset.assetType,
      visitType: asset.visitType || "none",
      building: asset.building || "",
      floor: asset.floor || "",
      area: asset.area || "",
      location: asset.location || "",
      description: asset.description || "",
      manufacturer: asset.manufacturer || "",
      model: asset.model || "",
      serialNumber: asset.serialNumber || "",
      installDate: asset.installDate || "",
      warrantyExpiry: asset.warrantyExpiry || "",
      status: asset.status || "active",
      condition: asset.condition || "good",
      notes: asset.notes || "",
      projectId: asset.projectId || "none",
    });
    setDialogOpen(true);
  };

  const onAssetSubmit = (values: SiteAssetFormValues) => {
    const data = { 
      ...values, 
      userId,
      projectId: values.projectId === "none" ? null : values.projectId,
      visitType: values.visitType === "none" ? null : values.visitType,
    };
    if (editingAsset) {
      updateAssetMutation.mutate({ id: editingAsset.id, data });
    } else {
      createAssetMutation.mutate(data);
    }
  };

  const onBulkSubmit = (values: BulkAssetFormValues) => {
    if (values.quantity < 1 || values.quantity > 500) {
      toast({ title: "Quantity must be between 1 and 500", variant: "destructive" });
      return;
    }
    createBulkAssetsMutation.mutate(values);
  };

  const openNewAssetDialog = () => {
    setEditingAsset(null);
    assetForm.reset({
      assetNumber: "",
      assetType: "aov",
      visitType: "none",
      building: "",
      floor: "",
      area: "",
      location: "",
      description: "",
      manufacturer: "",
      model: "",
      serialNumber: "",
      installDate: "",
      warrantyExpiry: "",
      status: "active",
      condition: "good",
      notes: "",
      projectId: "none",
    });
    setDialogOpen(true);
  };

  const openBulkDialog = () => {
    bulkForm.reset({
      batchName: "",
      assetType: "aov",
      visitType: "none",
      projectId: "none",
      building: "",
      startingFloor: "G",
      startingArea: "",
      numberingPrefix: "AOV-",
      startingNumber: 1,
      numberingFormat: "###",
      quantity: 10,
      notes: "",
    });
    setBulkDialogOpen(true);
  };

  const watchedBulkValues = bulkForm.watch();

  const previewAssetNumbers = () => {
    const { numberingPrefix, startingNumber, numberingFormat, quantity } = watchedBulkValues;
    const previews: string[] = [];
    const count = Math.min(quantity || 1, 5);
    for (let i = 0; i < count; i++) {
      previews.push(formatAssetNumber(numberingPrefix || "", (startingNumber || 1) + i, numberingFormat || "###"));
    }
    if ((quantity || 1) > 5) {
      previews.push("...");
      previews.push(formatAssetNumber(numberingPrefix || "", (startingNumber || 1) + (quantity || 1) - 1, numberingFormat || "###"));
    }
    return previews.join(", ");
  };

  const filteredAssets = siteAssets.filter((asset) => {
    if (filterProject !== "all" && asset.projectId !== filterProject) return false;
    if (filterAssetType !== "all" && asset.assetType !== filterAssetType) return false;
    return true;
  });

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "good": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "fair": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "poor": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "critical": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "inactive": return "secondary";
      case "faulty": return "destructive";
      case "replaced": return "outline";
      case "pending_inspection": return "secondary";
      default: return "default";
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Package className="h-6 w-6" />
            Site Assets
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Manage smoke control equipment assets with bulk add support
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList data-testid="tabs-main">
          <TabsTrigger value="assets" data-testid="tab-assets">Assets</TabsTrigger>
          <TabsTrigger value="batches" data-testid="tab-batches">Batch History</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-[200px]" data-testid="select-filter-project">
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterAssetType} onValueChange={setFilterAssetType}>
              <SelectTrigger className="w-[200px]" data-testid="select-filter-asset-type">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ASSET_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1" />

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewAssetDialog} data-testid="button-add-asset">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle data-testid="text-dialog-title">{editingAsset ? "Edit Asset" : "Add Single Asset"}</DialogTitle>
                  <DialogDescription data-testid="text-dialog-description">
                    Add or edit a single smoke control asset
                  </DialogDescription>
                </DialogHeader>
                <Form {...assetForm}>
                  <form onSubmit={assetForm.handleSubmit(onAssetSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={assetForm.control}
                        name="assetNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Asset Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="AOV-001" data-testid="input-asset-number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={assetForm.control}
                        name="assetType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Asset Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-asset-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ASSET_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={assetForm.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-project">
                                  <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No project</SelectItem>
                                {projects.map((project) => (
                                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={assetForm.control}
                        name="visitType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Visit Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-visit-type">
                                  <SelectValue placeholder="Select visit type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Not specified</SelectItem>
                                {visitTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.code}>{type.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={assetForm.control}
                        name="building"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Building</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Block A" data-testid="input-building" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={assetForm.control}
                        name="floor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Floor</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="G, 1, 2, B1..." data-testid="input-floor" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={assetForm.control}
                        name="area"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Area</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Lobby, Corridor..." data-testid="input-area" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={assetForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location Description</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Above flat 12 entrance" data-testid="input-location" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={assetForm.control}
                        name="manufacturer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Manufacturer</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-manufacturer" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={assetForm.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Model</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-model" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={assetForm.control}
                        name="serialNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Serial Number</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-serial-number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={assetForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-status">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ASSET_STATUSES.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={assetForm.control}
                        name="condition"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Condition</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-condition">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ASSET_CONDITIONS.map((c) => (
                                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={assetForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea {...field} data-testid="input-notes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createAssetMutation.isPending || updateAssetMutation.isPending}
                        data-testid="button-save"
                      >
                        {editingAsset ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={openBulkDialog} data-testid="button-bulk-add">
                  <Layers className="h-4 w-4 mr-2" />
                  Bulk Add Assets
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle data-testid="text-bulk-dialog-title">Bulk Add Assets</DialogTitle>
                  <DialogDescription data-testid="text-bulk-dialog-description">
                    Add multiple assets at once with auto-generated asset numbers
                  </DialogDescription>
                </DialogHeader>
                <Form {...bulkForm}>
                  <form onSubmit={bulkForm.handleSubmit(onBulkSubmit)} className="space-y-4">
                    <FormField
                      control={bulkForm.control}
                      name="batchName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Tower Block AOVs - December 2024" data-testid="input-batch-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={bulkForm.control}
                        name="assetType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Asset Type</FormLabel>
                            <Select 
                              onValueChange={(v) => {
                                field.onChange(v);
                                bulkForm.setValue("numberingPrefix", ASSET_PREFIXES[v] || "ASSET-");
                              }} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-bulk-asset-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ASSET_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bulkForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={1} 
                                max={500} 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                data-testid="input-quantity" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={bulkForm.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-bulk-project">
                                  <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No project</SelectItem>
                                {projects.map((project) => (
                                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bulkForm.control}
                        name="visitType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Visit Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-bulk-visit-type">
                                  <SelectValue placeholder="Select visit type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Not specified</SelectItem>
                                {visitTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.code}>{type.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={bulkForm.control}
                        name="building"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Building</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Block A" data-testid="input-bulk-building" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bulkForm.control}
                        name="startingFloor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Starting Floor</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="G, 1, B1..." data-testid="input-starting-floor" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={bulkForm.control}
                      name="startingArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Starting Area</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Corridor, Lobby..." data-testid="input-starting-area" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Numbering Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={bulkForm.control}
                            name="numberingPrefix"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prefix</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="AOV-" data-testid="input-numbering-prefix" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={bulkForm.control}
                            name="startingNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Starting Number</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min={1} 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                    data-testid="input-starting-number" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={bulkForm.control}
                            name="numberingFormat"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Format</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-numbering-format">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {NUMBERING_FORMATS.map((f) => (
                                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="text-sm" data-testid="text-preview-numbers">
                          <span className="font-medium">Preview: </span>
                          <span className="text-muted-foreground">{previewAssetNumbers()}</span>
                        </div>
                      </CardContent>
                    </Card>
                    <FormField
                      control={bulkForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (applied to all assets)</FormLabel>
                          <FormControl>
                            <Textarea {...field} data-testid="input-bulk-notes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setBulkDialogOpen(false)} data-testid="button-bulk-cancel">
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createBulkAssetsMutation.isPending}
                        data-testid="button-bulk-create"
                      >
                        {createBulkAssetsMutation.isPending ? "Creating..." : `Create ${watchedBulkValues.quantity || 10} Assets`}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {loadingAssets ? (
            <div className="text-center py-8" data-testid="text-loading">Loading assets...</div>
          ) : filteredAssets.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium" data-testid="text-empty-title">No assets found</h3>
                <p className="text-muted-foreground mb-4" data-testid="text-empty-description">
                  Add individual assets or use bulk add for multiple assets
                </p>
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Building / Floor</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.id} data-testid={`row-asset-${asset.id}`}>
                    <TableCell className="font-mono font-medium" data-testid={`text-asset-number-${asset.id}`}>{asset.assetNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`badge-asset-type-${asset.id}`}>
                        {ASSET_TYPES.find(t => t.value === asset.assetType)?.label || asset.assetType}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-building-floor-${asset.id}`}>
                      {asset.building && <span>{asset.building}</span>}
                      {asset.floor && <span className="text-muted-foreground"> / Floor {asset.floor}</span>}
                    </TableCell>
                    <TableCell data-testid={`text-area-${asset.id}`}>{asset.area || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(asset.status || "active") as any} data-testid={`badge-status-${asset.id}`}>
                        {asset.status?.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getConditionColor(asset.condition || "good")} data-testid={`badge-condition-${asset.id}`}>
                        {asset.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(asset)} data-testid={`button-edit-${asset.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteAssetMutation.mutate(asset.id)} data-testid={`button-delete-${asset.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          <div className="text-sm text-muted-foreground" data-testid="text-asset-count">
            Showing {filteredAssets.length} of {siteAssets.length} assets
          </div>
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          {loadingBatches ? (
            <div className="text-center py-8" data-testid="text-loading-batches">Loading batch history...</div>
          ) : assetBatches.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium" data-testid="text-no-batches">No batch operations</h3>
                <p className="text-muted-foreground" data-testid="text-no-batches-description">
                  Use bulk add to create multiple assets at once
                </p>
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Name</TableHead>
                  <TableHead>Asset Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Building</TableHead>
                  <TableHead>Numbering</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assetBatches.map((batch) => (
                  <TableRow key={batch.id} data-testid={`row-batch-${batch.id}`}>
                    <TableCell className="font-medium" data-testid={`text-batch-name-${batch.id}`}>{batch.batchName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`badge-batch-type-${batch.id}`}>
                        {ASSET_TYPES.find(t => t.value === batch.assetType)?.label || batch.assetType}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-batch-quantity-${batch.id}`}>{batch.createdAssetsCount || batch.quantity}</TableCell>
                    <TableCell data-testid={`text-batch-building-${batch.id}`}>{batch.building || "-"}</TableCell>
                    <TableCell className="font-mono text-sm" data-testid={`text-batch-numbering-${batch.id}`}>
                      {batch.numberingPrefix}{batch.startingNumber}...
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={batch.status === "completed" ? "default" : batch.status === "failed" ? "destructive" : "secondary"}
                        data-testid={`badge-batch-status-${batch.id}`}
                      >
                        {batch.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" data-testid={`text-batch-created-${batch.id}`}>
                      {batch.createdAt ? new Date(batch.createdAt).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => deleteBatchMutation.mutate(batch.id)} data-testid={`button-delete-batch-${batch.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
