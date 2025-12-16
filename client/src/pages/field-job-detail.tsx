import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Navigation,
  Mail,
  Building2,
  FileText,
  AlertTriangle,
  Wrench,
  User,
  Package,
  Plus,
  Search,
  Key,
  ChevronRight,
  Play,
  Gauge,
  CheckSquare,
  Square,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DbJob, DbSiteAsset, DbJobSiteAsset } from "@shared/schema";
import { ASSET_TYPES, SMOKE_CONTROL_SYSTEM_TYPES } from "@shared/schema";

interface Client {
  id: string;
  companyName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

interface Contract {
  id: string;
  title: string;
  contractNumber: string | null;
}

interface Site {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postcode: string | null;
  systemType: string | null;
  floors: number | null;
  accessInstructions: string | null;
}

interface JobWithSiteDetail extends DbJob {
  site: Site | null;
  assignedAssets: DbJobSiteAsset[];
  siteAssets: DbSiteAsset[];
}

export default function FieldJobDetail() {
  const [, params] = useRoute("/field-companion/:id");
  const [, setLocation] = useLocation();
  const jobId = params?.id;
  const { toast } = useToast();
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showNoAccessDialog, setShowNoAccessDialog] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showNewAssetModal, setShowNewAssetModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [noAccessReason, setNoAccessReason] = useState("");
  const [assetSearchQuery, setAssetSearchQuery] = useState("");
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetType, setNewAssetType] = useState("");
  const [newAssetFloor, setNewAssetFloor] = useState("");
  const [newAssetLocation, setNewAssetLocation] = useState("");
  const [newAssetAssignToJob, setNewAssetAssignToJob] = useState(true);
  const [bulkTestMode, setBulkTestMode] = useState(false);
  const [selectedTestAssets, setSelectedTestAssets] = useState<string[]>([]);

  const { data: job, isLoading: jobLoading } = useQuery<JobWithSiteDetail>({
    queryKey: ["/api/jobs/detail-with-site", jobId],
    enabled: !!jobId,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const client = clients.find((c) => c.id === job?.clientId);
  const contract = contracts.find((c) => c.id === job?.contractId);

  const updateJobMutation = useMutation({
    mutationFn: async (updates: Partial<DbJob>) => {
      return apiRequest("PATCH", `/api/jobs/${jobId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/detail-with-site", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs-with-sites"] });
    },
  });

  const assignAssetsMutation = useMutation({
    mutationFn: async (assetIds: string[]) => {
      const promises = assetIds.map(assetId =>
        apiRequest("POST", "/api/job-site-assets", {
          jobId,
          siteAssetId: assetId,
          status: "pending",
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/detail-with-site", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs-with-sites"] });
      setShowAssetModal(false);
      setSelectedAssetIds([]);
      setAssetSearchQuery("");
      toast({ title: "Assets assigned", description: `${selectedAssetIds.length} asset(s) added to job` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to assign assets", variant: "destructive" });
    },
  });

  const createAssetMutation = useMutation({
    mutationFn: async (data: { assetNumber: string; assetType: string; floor: string; location: string; assignToJob: boolean }) => {
      const response = await apiRequest("POST", "/api/site-assets", {
        siteId: job?.siteId,
        assetNumber: data.assetNumber,
        assetType: data.assetType || "aov",
        floor: data.floor || null,
        location: data.location || null,
        status: "active",
      });
      
      const assetData = await response.json();
      
      if (data.assignToJob && assetData.id) {
        await apiRequest("POST", "/api/job-site-assets", {
          jobId,
          siteAssetId: assetData.id,
          status: "pending",
        });
      }
      
      return assetData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/detail-with-site", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs-with-sites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-assets"] });
      setShowNewAssetModal(false);
      setNewAssetName("");
      setNewAssetType("");
      setNewAssetFloor("");
      setNewAssetLocation("");
      setNewAssetAssignToJob(true);
      toast({ title: "Asset created", description: "New asset has been added to the site" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create asset", variant: "destructive" });
    },
  });

  const handleCreateAsset = () => {
    if (!newAssetName.trim()) return;
    createAssetMutation.mutate({
      assetNumber: newAssetName.trim(),
      assetType: newAssetType || "aov",
      floor: newAssetFloor,
      location: newAssetLocation,
      assignToJob: newAssetAssignToJob,
    });
  };

  const toggleBulkTestAsset = (assetId: string) => {
    setSelectedTestAssets(prev =>
      prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
    );
  };

  const selectAllForTesting = () => {
    const pendingAssets = (job?.assignedAssets || [])
      .filter(a => a.status !== "completed")
      .map(a => a.siteAssetId);
    setSelectedTestAssets(pendingAssets);
  };

  const clearTestSelection = () => {
    setSelectedTestAssets([]);
    setBulkTestMode(false);
  };

  const navigateToTesting = (assetIds: string[]) => {
    // Store testing context in sessionStorage for the field-testing page
    const testContext = {
      jobId,
      jobNumber: job?.jobNumber,
      siteName: job?.site?.name,
      siteAddress: job?.site?.address,
      building: job?.site?.name,
      assetIds,
      assets: assetIds.map(id => {
        const asset = job?.siteAssets?.find(a => a.id === id);
        return asset ? {
          id: asset.id,
          assetNumber: asset.assetNumber,
          type: asset.assetType,
          floor: asset.floor,
          location: asset.location,
        } : null;
      }).filter(Boolean),
    };
    sessionStorage.setItem('fieldTestContext', JSON.stringify(testContext));
    setLocation('/field-testing');
  };

  const handleStartJob = () => {
    updateJobMutation.mutate(
      { status: "in_progress" },
      {
        onSuccess: () => {
          toast({ title: "Job started", description: "You're now on site" });
        },
      }
    );
  };

  const handleComplete = () => {
    updateJobMutation.mutate(
      {
        status: "completed",
        completionNotes: completionNotes || undefined,
        completedAt: new Date(),
      },
      {
        onSuccess: () => {
          setShowCompleteDialog(false);
          toast({ title: "Job completed!" });
          setLocation("/field-companion");
        },
      }
    );
  };

  const handleNoAccess = () => {
    updateJobMutation.mutate(
      {
        status: "cancelled",
        notes: noAccessReason
          ? `${job?.notes || ""}\n\n[No Access] ${noAccessReason}`
          : job?.notes,
      },
      {
        onSuccess: () => {
          setShowNoAccessDialog(false);
          toast({ title: "No access recorded" });
          setLocation("/field-companion");
        },
      }
    );
  };

  // Get available assets (site assets not yet assigned to this job)
  const assignedAssetIds = new Set((job?.assignedAssets || []).map(a => a.siteAssetId));
  const availableAssets = (job?.siteAssets || []).filter(a => !assignedAssetIds.has(a.id));

  // Filter available assets by search query
  const filteredAvailableAssets = availableAssets.filter(asset => {
    if (!assetSearchQuery) return true;
    const q = assetSearchQuery.toLowerCase();
    return (
      asset.assetNumber?.toLowerCase().includes(q) ||
      asset.assetType?.toLowerCase().includes(q) ||
      asset.location?.toLowerCase().includes(q) ||
      asset.floor?.toLowerCase().includes(q) ||
      asset.manufacturer?.toLowerCase().includes(q)
    );
  });

  const getAssetTypeLabel = (assetType: string | null) => {
    if (!assetType) return null;
    const type = ASSET_TYPES.find(t => t.value === assetType);
    return type?.label || assetType;
  };

  const getSystemLabel = (systemType: string | null) => {
    if (!systemType) return null;
    const system = SMOKE_CONTROL_SYSTEM_TYPES.find(s => s.value === systemType);
    return system?.label || systemType;
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssetIds(prev =>
      prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
    );
  };

  const handleAssignAssets = () => {
    if (selectedAssetIds.length > 0) {
      assignAssetsMutation.mutate(selectedAssetIds);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      scheduled: { variant: "outline", label: "Scheduled" },
      in_progress: { variant: "default", label: "In Progress" },
      completed: { variant: "secondary", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    const config = variants[status || "pending"] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string | null) => {
    if (priority === "urgent") {
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Urgent</Badge>;
    }
    if (priority === "high") {
      return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">High</Badge>;
    }
    return null;
  };

  if (jobLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Job not found</p>
        <Link href="/field-companion">
          <Button variant="outline">Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b p-4">
        <div className="flex items-start gap-3">
          <Link href="/field-companion">
            <Button variant="ghost" size="icon" className="shrink-0" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-lg" data-testid="text-job-number">
                {job.jobNumber}
              </h1>
              {getStatusBadge(job.status)}
              {getPriorityBadge(job.priority)}
            </div>
            <p className="text-muted-foreground mt-1" data-testid="text-job-title">
              {job.title}
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Quick Actions - Most prominent */}
          <Card className="border-2 border-primary/50">
            <CardContent className="p-4 space-y-3">
              {job.status === "scheduled" || job.status === "pending" ? (
                <Button
                  className="w-full h-14 text-lg"
                  onClick={handleStartJob}
                  disabled={updateJobMutation.isPending}
                  data-testid="button-start-job"
                >
                  <PlayCircle className="h-6 w-6 mr-2" />
                  Start Job
                </Button>
              ) : job.status === "in_progress" ? (
                <Button
                  className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
                  onClick={() => setShowCompleteDialog(true)}
                  disabled={updateJobMutation.isPending}
                  data-testid="button-complete-job"
                >
                  <CheckCircle2 className="h-6 w-6 mr-2" />
                  Complete Job
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-2 py-4 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="font-medium">Job Completed</span>
                </div>
              )}

              {job.status !== "completed" && job.status !== "cancelled" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowNoAccessDialog(true)}
                  data-testid="button-no-access"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Report No Access
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Site Information */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Site Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {job.siteAddress && (
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{job.siteAddress}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      window.open(
                        `https://maps.google.com/?q=${encodeURIComponent(job.siteAddress || "")}`,
                        "_blank"
                      )
                    }
                    data-testid="button-navigate"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Open in Maps
                  </Button>
                </div>
              )}

              {job.scheduledDate && (
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(parseISO(job.scheduledDate), "EEE, d MMM yyyy")}
                      {job.scheduledTime && ` at ${job.scheduledTime}`}
                    </p>
                  </div>
                  {job.estimatedDuration && (
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {job.estimatedDuration}h
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Information */}
          {client && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-medium">{client.companyName}</p>
                
                {client.contactName && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{client.contactName}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  {client.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `tel:${client.phone}`}
                      data-testid="button-call-client"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  )}
                  {client.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `mailto:${client.email}`}
                      data-testid="button-email-client"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Systems to service */}
          {job.systems && job.systems.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Systems ({job.systems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {job.systems.map((system, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div>
                        <p className="font-medium text-sm">{system.systemType}</p>
                        {system.location && (
                          <p className="text-xs text-muted-foreground">{system.location}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Site Assets Section */}
          {job.site && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Assets ({job.assignedAssets?.length || 0}/{(job.siteAssets?.length || 0)})
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {job.assignedAssets && job.assignedAssets.length > 0 && (
                      <Button
                        variant={bulkTestMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (bulkTestMode) {
                            clearTestSelection();
                          } else {
                            setBulkTestMode(true);
                          }
                        }}
                        data-testid="button-bulk-test-mode"
                      >
                        <Gauge className="h-4 w-4 mr-1" />
                        {bulkTestMode ? "Cancel" : "Test"}
                      </Button>
                    )}
                    {availableAssets.length > 0 && !bulkTestMode && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAssetModal(true)}
                        data-testid="button-add-assets"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
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
                        onClick={selectAllForTesting}
                        data-testid="button-select-all-tests"
                      >
                        <CheckSquare className="h-4 w-4 mr-1" />
                        Select All Pending
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {selectedTestAssets.length} selected
                      </span>
                    </div>
                    <Button
                      size="sm"
                      disabled={selectedTestAssets.length === 0}
                      onClick={() => navigateToTesting(selectedTestAssets)}
                      data-testid="button-start-bulk-test"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start Testing
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Assigned Assets */}
                {job.assignedAssets && job.assignedAssets.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Assigned to this job</p>
                    {job.assignedAssets.map(assignment => {
                      const asset = job.siteAssets?.find(a => a.id === assignment.siteAssetId);
                      if (!asset) return null;
                      const isSelected = selectedTestAssets.includes(asset.id);
                      return (
                        <div
                          key={assignment.id}
                          className={`flex items-center justify-between p-3 rounded border transition-colors ${
                            bulkTestMode 
                              ? isSelected 
                                ? "bg-primary/10 border-primary/30" 
                                : "bg-muted/50 cursor-pointer"
                              : "bg-muted/50"
                          }`}
                          onClick={bulkTestMode ? () => toggleBulkTestAsset(asset.id) : undefined}
                          data-testid={`asset-assigned-${asset.id}`}
                        >
                          {bulkTestMode && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleBulkTestAsset(asset.id)}
                              className="mr-3"
                              data-testid={`checkbox-test-${asset.id}`}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm truncate">{asset.assetNumber}</span>
                              {asset.assetType && (
                                <Badge variant="outline" className="text-xs">
                                  {getAssetTypeLabel(asset.assetType)}
                                </Badge>
                              )}
                              <Badge
                                variant={assignment.status === "completed" ? "secondary" : "outline"}
                                className="text-xs"
                              >
                                {assignment.status === "completed" ? "Tested" : "Pending"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {asset.floor && <span>Floor {asset.floor}</span>}
                              {asset.location && <span>{asset.location}</span>}
                            </div>
                          </div>
                          {!bulkTestMode && assignment.status !== "completed" && (
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
                          )}
                          {!bulkTestMode && assignment.status === "completed" && (
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">No assets assigned to this job</p>
                    <div className="flex flex-col items-center gap-2">
                      {availableAssets.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => setShowAssetModal(true)}
                          data-testid="button-add-assets-empty"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Assets from Site
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNewAssetModal(true)}
                        data-testid="button-create-new-asset-empty"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Create New Asset
                      </Button>
                    </div>
                  </div>
                )}

                {/* Site info summary */}
                <div className="pt-2 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {job.siteAssets?.length || 0} total assets at {job.site.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewAssetModal(true)}
                    data-testid="button-create-new-asset"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Access Instructions */}
          {job.site?.accessInstructions && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Access Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{job.site.accessInstructions}</p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {(job.notes || job.description) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {job.description && <p className="text-sm mb-2">{job.description}</p>}
                {job.notes && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-sm">{job.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contract info */}
          {contract && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Contract</p>
                <p className="font-medium">{contract.title}</p>
                {contract.contractNumber && (
                  <p className="text-sm text-muted-foreground">#{contract.contractNumber}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Complete Job Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Job</DialogTitle>
            <DialogDescription>
              Add any completion notes before marking this job as complete.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Add completion notes (optional)..."
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={updateJobMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              Complete Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* No Access Dialog */}
      <Dialog open={showNoAccessDialog} onOpenChange={setShowNoAccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report No Access</DialogTitle>
            <DialogDescription>
              Please provide a reason why you couldn't access the site.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describe why access was not possible..."
            value={noAccessReason}
            onChange={(e) => setNoAccessReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNoAccessDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleNoAccess}
              disabled={updateJobMutation.isPending}
            >
              Submit No Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Assets Modal */}
      <Dialog open={showAssetModal} onOpenChange={setShowAssetModal}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Add Assets to Job
            </DialogTitle>
            <DialogDescription>
              Select assets from {job?.site?.name} to add to this job.
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets by name, type, location..."
              value={assetSearchQuery}
              onChange={(e) => setAssetSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-asset-search"
            />
          </div>

          {/* Asset List */}
          <ScrollArea className="flex-1 min-h-0 max-h-[40vh] border rounded-md">
            <div className="p-2 space-y-1">
              {filteredAvailableAssets.length > 0 ? (
                filteredAvailableAssets.map(asset => (
                  <div
                    key={asset.id}
                    className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                      selectedAssetIds.includes(asset.id)
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => toggleAssetSelection(asset.id)}
                    data-testid={`asset-available-${asset.id}`}
                  >
                    <Checkbox
                      checked={selectedAssetIds.includes(asset.id)}
                      onCheckedChange={() => toggleAssetSelection(asset.id)}
                      data-testid={`checkbox-asset-${asset.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{asset.assetNumber}</span>
                        {asset.assetType && (
                          <Badge variant="outline" className="text-xs">
                            {getAssetTypeLabel(asset.assetType)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        {asset.floor && <span>Floor {asset.floor}</span>}
                        {asset.location && <span>{asset.location}</span>}
                        {asset.manufacturer && <span>{asset.manufacturer}</span>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {assetSearchQuery
                    ? "No assets match your search"
                    : "No available assets to add"}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Selection count */}
          {selectedAssetIds.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedAssetIds.length} asset{selectedAssetIds.length !== 1 ? "s" : ""} selected
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAssetModal(false);
                setSelectedAssetIds([]);
                setAssetSearchQuery("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignAssets}
              disabled={selectedAssetIds.length === 0 || assignAssetsMutation.isPending}
              data-testid="button-confirm-add-assets"
            >
              {assignAssetsMutation.isPending ? (
                "Adding..."
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add {selectedAssetIds.length > 0 ? `${selectedAssetIds.length} ` : ""}Asset{selectedAssetIds.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Asset Modal */}
      <Dialog open={showNewAssetModal} onOpenChange={setShowNewAssetModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Add New Asset
            </DialogTitle>
            <DialogDescription>
              Create a new asset at {job?.site?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="asset-name">Asset Name *</Label>
              <Input
                id="asset-name"
                placeholder="e.g., Smoke Damper SD-01"
                value={newAssetName}
                onChange={(e) => setNewAssetName(e.target.value)}
                data-testid="input-new-asset-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset-type">Asset Type</Label>
              <Select value={newAssetType} onValueChange={setNewAssetType}>
                <SelectTrigger data-testid="select-new-asset-type">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="asset-floor">Floor</Label>
                <Input
                  id="asset-floor"
                  placeholder="e.g., Ground, 1, B1"
                  value={newAssetFloor}
                  onChange={(e) => setNewAssetFloor(e.target.value)}
                  data-testid="input-new-asset-floor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-location">Location</Label>
                <Input
                  id="asset-location"
                  placeholder="e.g., Lobby, Stairwell A"
                  value={newAssetLocation}
                  onChange={(e) => setNewAssetLocation(e.target.value)}
                  data-testid="input-new-asset-location"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="assign-to-job"
                checked={newAssetAssignToJob}
                onCheckedChange={(checked) => setNewAssetAssignToJob(checked === true)}
                data-testid="checkbox-assign-to-job"
              />
              <Label htmlFor="assign-to-job" className="text-sm">
                Add to this job for testing
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowNewAssetModal(false);
                setNewAssetName("");
                setNewAssetType("");
                setNewAssetFloor("");
                setNewAssetLocation("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAsset}
              disabled={!newAssetName.trim() || createAssetMutation.isPending}
              data-testid="button-confirm-create-asset"
            >
              {createAssetMutation.isPending ? (
                "Creating..."
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Asset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
