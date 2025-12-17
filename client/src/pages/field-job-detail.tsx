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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ChevronDown,
  Play,
  Gauge,
  CheckSquare,
  Square,
  X,
  MessageSquare,
  Camera,
  Send,
  ClipboardCheck,
} from "lucide-react";
import { SiGooglemaps, SiApple, SiWaze } from "react-icons/si";
import { format, parseISO } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DbJob, DbSiteAsset, DbJobSiteAsset, DbWorkNote } from "@shared/schema";
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
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  
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
  
  // Visit notes state
  const [showVisitNoteModal, setShowVisitNoteModal] = useState(false);
  const [visitNoteContent, setVisitNoteContent] = useState("");
  const [visitNoteType, setVisitNoteType] = useState<string>("site_visit");
  const [noteAttachments, setNoteAttachments] = useState<{name: string; url: string}[]>([]);
  
  // Requires work modal state
  const [showRequiresWorkModal, setShowRequiresWorkModal] = useState(false);
  const [requiresWorkAssetId, setRequiresWorkAssetId] = useState<string | null>(null);
  const [requiresWorkReason, setRequiresWorkReason] = useState("");

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

  const { data: visitNotes = [] } = useQuery<DbWorkNote[]>({
    queryKey: ["/api/work-notes/by-job", jobId],
    enabled: !!jobId,
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

  const bulkCreateAssetsMutation = useMutation({
    mutationFn: async (assets: BulkAssetEntry[]) => {
      const createdAssetIds: string[] = [];
      for (const asset of assets) {
        const response = await apiRequest("POST", "/api/site-assets", {
          siteId: job?.siteId,
          assetNumber: asset.assetNumber,
          assetType: asset.assetType,
          floor: asset.floor || null,
          location: asset.location || null,
          status: "active",
        });
        const assetData = await response.json();
        if (assetData.id) {
          createdAssetIds.push(assetData.id);
          // Also assign to job
          await apiRequest("POST", "/api/job-site-assets", {
            jobId,
            siteAssetId: assetData.id,
            status: "pending",
          });
        }
      }
      return createdAssetIds;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/detail-with-site", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs-with-sites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-assets"] });
      setShowBulkAddModal(false);
      setBulkAssets([{ assetNumber: "", assetType: "aov", floor: "", location: "" }]);
      toast({ 
        title: "Assets added", 
        description: `${variables.length} assets created and assigned to this job` 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create assets", variant: "destructive" });
    },
  });

  // Visit note mutation
  const createVisitNoteMutation = useMutation({
    mutationFn: async (data: { content: string; noteType: string; attachments: {name: string; url: string}[] }) => {
      return apiRequest("POST", "/api/work-notes", {
        jobId,
        userId: job?.userId || null,
        clientId: job?.clientId || null,
        noteDate: new Date().toISOString().split('T')[0],
        noteType: data.noteType,
        content: data.content,
        authorName: "Field Engineer",
        isInternal: false,
        attachments: data.attachments,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-notes/by-job", jobId] });
      setShowVisitNoteModal(false);
      setVisitNoteContent("");
      setVisitNoteType("site_visit");
      setNoteAttachments([]);
      toast({ title: "Note added", description: "Visit note has been saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save note", variant: "destructive" });
    },
  });

  const handleAddVisitNote = () => {
    if (!visitNoteContent.trim()) return;
    createVisitNoteMutation.mutate({
      content: visitNoteContent.trim(),
      noteType: visitNoteType,
      attachments: noteAttachments,
    });
  };

  const handlePhotoCapture = () => {
    toast({ title: "Coming soon", description: "Photo capture will be available in the mobile app" });
  };

  // Requires work mutation
  const updateRequiresWorkMutation = useMutation({
    mutationFn: async (data: { assignmentId: string; requiresWork: boolean; requiresWorkReason?: string }) => {
      return apiRequest("PATCH", `/api/job-site-assets/${data.assignmentId}`, {
        requiresWork: data.requiresWork,
        requiresWorkReason: data.requiresWorkReason || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/detail-with-site", jobId] });
      setShowRequiresWorkModal(false);
      setRequiresWorkAssetId(null);
      setRequiresWorkReason("");
      toast({ title: "Updated", description: "Asset work requirement has been updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update asset", variant: "destructive" });
    },
  });

  const handleFlagRequiresWork = (assignmentId: string) => {
    setRequiresWorkAssetId(assignmentId);
    setRequiresWorkReason("");
    setShowRequiresWorkModal(true);
  };

  const handleSubmitRequiresWork = () => {
    if (!requiresWorkAssetId) return;
    updateRequiresWorkMutation.mutate({
      assignmentId: requiresWorkAssetId,
      requiresWork: true,
      requiresWorkReason: requiresWorkReason.trim(),
    });
  };

  const handleClearRequiresWork = (assignmentId: string) => {
    updateRequiresWorkMutation.mutate({
      assignmentId,
      requiresWork: false,
      requiresWorkReason: "",
    });
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        data-testid="button-navigate"
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Open in Maps
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `https://maps.google.com/?q=${encodeURIComponent(job.siteAddress || "")}`,
                            "_blank"
                          )
                        }
                        data-testid="menu-google-maps"
                      >
                        <SiGooglemaps className="h-4 w-4 mr-2 text-[#4285F4]" />
                        Google Maps
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `https://maps.apple.com/?q=${encodeURIComponent(job.siteAddress || "")}`,
                            "_blank"
                          )
                        }
                        data-testid="menu-apple-maps"
                      >
                        <SiApple className="h-4 w-4 mr-2" />
                        Apple Maps
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `https://waze.com/ul?q=${encodeURIComponent(job.siteAddress || "")}`,
                            "_blank"
                          )
                        }
                        data-testid="menu-waze"
                      >
                        <SiWaze className="h-4 w-4 mr-2 text-[#33CCFF]" />
                        Waze
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

          {/* Visit Notes Section */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Visit Notes ({visitNotes.length})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVisitNoteModal(true)}
                  data-testid="button-add-visit-note"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {visitNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No visit notes yet. Add notes to document your site visit.
                </p>
              ) : (
                <div className="space-y-3">
                  {visitNotes.map((note) => (
                    <div key={note.id} className="p-3 bg-muted/50 rounded-md" data-testid={`visit-note-${note.id}`}>
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">
                          {note.noteType === "site_visit" ? "Site Visit" :
                           note.noteType === "issue" ? "Issue" :
                           note.noteType === "general" ? "General" : note.noteType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {note.noteDate ? format(parseISO(note.noteDate), "d MMM yyyy") : ""}
                        </span>
                      </div>
                      <p className="text-sm">{note.content}</p>
                      {note.attachments && Array.isArray(note.attachments) && note.attachments.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <Camera className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {note.attachments.length} photo{note.attachments.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                      {note.authorName && (
                        <p className="text-xs text-muted-foreground mt-1">— {note.authorName}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Forms Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Test Forms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Damper Velocity Test - show if job has AOV, smoke_damper, or smoke_shaft systems */}
                {(!job.systems || job.systems.length === 0 || 
                  job.systems.some(s => ["aov", "smoke_damper", "smoke_shaft", "mshev"].includes(s.systemType?.toLowerCase() || ""))) && (
                  <Link href={`/field-testing?jobId=${jobId}&siteId=${job.siteId}`} data-testid="link-damper-test">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover-elevate cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded">
                          <Gauge className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Damper Velocity Test</p>
                          <p className="text-xs text-muted-foreground">Smoke control damper airflow testing</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                )}

                {/* Stairwell Pressure Test - show if job has stairwell or pressurisation systems */}
                {(!job.systems || job.systems.length === 0 || 
                  job.systems.some(s => ["stairwell_pressurisation", "pressurisation", "stairwell"].includes(s.systemType?.toLowerCase() || ""))) && (
                  <Link href={`/field-testing?jobId=${jobId}&siteId=${job.siteId}&tab=stairwell`} data-testid="link-stairwell-test">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover-elevate cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded">
                          <Gauge className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Stairwell Pressure Test</p>
                          <p className="text-xs text-muted-foreground">Differential pressure & door force</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                )}

                {/* Check Sheet Readings - always available */}
                <Link href={`/check-sheet-readings?jobId=${jobId}&siteId=${job.siteId}`} data-testid="link-check-sheet">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover-elevate cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded">
                        <ClipboardCheck className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Check Sheet</p>
                        <p className="text-xs text-muted-foreground">System inspection & readings</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

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
                    {!bulkTestMode && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowBulkAddModal(true)}
                          data-testid="button-bulk-add-assets"
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Bulk Add
                        </Button>
                        {availableAssets.length > 0 && (
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
                              {assignment.requiresWork && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Requires Work
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {asset.floor && <span>Floor {asset.floor}</span>}
                              {asset.location && <span>{asset.location}</span>}
                            </div>
                            {assignment.requiresWork && assignment.requiresWorkReason && (
                              <p className="text-xs text-destructive mt-1 italic">{assignment.requiresWorkReason}</p>
                            )}
                          </div>
                          {!bulkTestMode && (
                            <div className="flex items-center gap-1">
                              {assignment.requiresWork ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClearRequiresWork(assignment.id);
                                  }}
                                  title="Clear requires work flag"
                                  data-testid={`button-clear-work-${asset.id}`}
                                >
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFlagRequiresWork(assignment.id);
                                  }}
                                  title="Flag as requires work"
                                  data-testid={`button-flag-work-${asset.id}`}
                                >
                                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              )}
                              {assignment.status !== "completed" && (
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
                              {assignment.status === "completed" && (
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                              )}
                            </div>
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

      {/* Visit Note Modal */}
      <Dialog open={showVisitNoteModal} onOpenChange={setShowVisitNoteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Add Visit Note
            </DialogTitle>
            <DialogDescription>
              Document observations, issues, or important information from your site visit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Note Type</Label>
              <Select value={visitNoteType} onValueChange={setVisitNoteType}>
                <SelectTrigger data-testid="select-note-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="site_visit">Site Visit</SelectItem>
                  <SelectItem value="issue">Issue Found</SelectItem>
                  <SelectItem value="general">General Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note Content</Label>
              <Textarea
                placeholder="Enter your note..."
                value={visitNoteContent}
                onChange={(e) => setVisitNoteContent(e.target.value)}
                className="min-h-[120px]"
                data-testid="input-note-content"
              />
            </div>
            <div className="space-y-2">
              <Label>Photos</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handlePhotoCapture}
                data-testid="button-add-photo"
              >
                <Camera className="h-4 w-4 mr-2" />
                Add Photo
              </Button>
              {noteAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {noteAttachments.map((att, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {att.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowVisitNoteModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddVisitNote}
              disabled={!visitNoteContent.trim() || createVisitNoteMutation.isPending}
              data-testid="button-save-note"
            >
              <Send className="h-4 w-4 mr-2" />
              {createVisitNoteMutation.isPending ? "Saving..." : "Save Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Requires Work Modal */}
      <Dialog open={showRequiresWorkModal} onOpenChange={setShowRequiresWorkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Flag Asset Requires Work
            </DialogTitle>
            <DialogDescription>
              Describe the issue or work required for this asset. This will be included in the job report for quoting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Issue / Work Required</Label>
              <Textarea
                placeholder="Describe the issue or work needed..."
                value={requiresWorkReason}
                onChange={(e) => setRequiresWorkReason(e.target.value)}
                className="min-h-[100px]"
                data-testid="input-requires-work-reason"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRequiresWorkModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmitRequiresWork}
              disabled={!requiresWorkReason.trim() || updateRequiresWorkMutation.isPending}
              data-testid="button-submit-requires-work"
            >
              {updateRequiresWorkMutation.isPending ? "Saving..." : "Flag as Requires Work"}
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

      {/* Bulk Add Assets Dialog */}
      <Dialog open={showBulkAddModal} onOpenChange={setShowBulkAddModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Add Assets</DialogTitle>
            <DialogDescription>Add multiple assets to {job?.site?.name || "this site"} and assign them to this job</DialogDescription>
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
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBulkAddModal(false);
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
    </div>
  );
}
