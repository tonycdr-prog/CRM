import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { AuditTimeline } from "@/features/evidence/audit-timeline";
import { format, parseISO } from "date-fns";
import type { DbFormSubmission } from "@shared/schema";
import { 
  Building2, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Send, 
  Download,
  Upload,
  Trash2,
  Eye,
  Mail,
  ClipboardList,
  Link2,
  Search,
  Filter,
  ArrowUpDown,
  History,
  Loader2
} from "lucide-react";

const HRB_HEIGHT_THRESHOLD = 18;
const HRB_STOREY_THRESHOLD = 7;

interface Building {
  id: string;
  name: string;
  address: string;
  height: number;
  storeys: number;
  isHRB: boolean;
  clientName: string;
}

interface DocumentChecklistItem {
  id: string;
  category: string;
  name: string;
  description: string;
  required: boolean;
  status: "pending" | "requested" | "received" | "verified" | "rejected";
  requestedDate?: string;
  receivedDate?: string;
  verifiedDate?: string;
  notes?: string;
  fileUrl?: string;
}

interface InfoRequest {
  id: string;
  buildingId: string;
  recipientName: string;
  recipientEmail: string;
  documentTypes: string[];
  message: string;
  sentDate: string;
  status: "draft" | "sent" | "partial" | "complete";
  responses: number;
  total: number;
}

const HRB_DOCUMENT_CHECKLIST: Omit<DocumentChecklistItem, "id" | "status">[] = [
  { category: "Design & Construction", name: "As-Built Drawings", description: "Complete set of as-built architectural, structural, and M&E drawings", required: true },
  { category: "Design & Construction", name: "Building Safety Case", description: "Comprehensive safety case demonstrating how building risks are managed", required: true },
  { category: "Design & Construction", name: "Fire Strategy Document", description: "Detailed fire safety strategy including evacuation procedures", required: true },
  { category: "Design & Construction", name: "Structural Calculations", description: "Engineering calculations for structural integrity", required: true },
  { category: "Design & Construction", name: "External Wall System Documentation", description: "Details of external wall construction including cladding and insulation", required: true },
  
  { category: "Fire Safety Systems", name: "Smoke Control System Design", description: "Design documentation for smoke ventilation systems", required: true },
  { category: "Fire Safety Systems", name: "Sprinkler System Design", description: "Sprinkler layout and specifications", required: true },
  { category: "Fire Safety Systems", name: "Fire Alarm System Design", description: "Fire detection and alarm system documentation", required: true },
  { category: "Fire Safety Systems", name: "Emergency Lighting Design", description: "Emergency lighting layout and battery backup specifications", required: true },
  { category: "Fire Safety Systems", name: "Dry/Wet Riser Documentation", description: "Fire fighting shaft and riser system details", required: true },
  
  { category: "Commissioning", name: "Smoke Control Commissioning Certificates", description: "Evidence of smoke ventilation testing and commissioning", required: true },
  { category: "Commissioning", name: "Fire Alarm Commissioning", description: "Fire alarm system testing and handover documentation", required: true },
  { category: "Commissioning", name: "Sprinkler Commissioning", description: "Sprinkler system test certificates", required: true },
  { category: "Commissioning", name: "AOV Test Certificates", description: "Automatic Opening Vent testing records", required: true },
  
  { category: "Maintenance", name: "Service & Maintenance Contracts", description: "Current maintenance agreements for safety systems", required: true },
  { category: "Maintenance", name: "Annual Inspection Reports", description: "Most recent annual inspection reports for all fire safety systems", required: true },
  { category: "Maintenance", name: "Planned Preventive Maintenance Schedule", description: "PPM schedule for all building safety systems", required: true },
  { category: "Maintenance", name: "Defect Log", description: "Register of identified defects and remediation status", required: true },
  
  { category: "Compliance", name: "Fire Risk Assessment", description: "Current FRA compliant with Regulatory Reform (Fire Safety) Order 2005", required: true },
  { category: "Compliance", name: "Building Registration Certificate", description: "Registration confirmation from Building Safety Regulator", required: true },
  { category: "Compliance", name: "Resident Engagement Strategy", description: "Documentation of resident consultation and communication approach", required: false },
  { category: "Compliance", name: "Safety Case Review Records", description: "Evidence of periodic safety case reviews", required: true },
];

const SAMPLE_BUILDINGS: Building[] = [
  { id: "1", name: "Horizon Tower", address: "100 High Street, London E1 4AB", height: 45, storeys: 15, isHRB: true, clientName: "Metropolitan Housing" },
  { id: "2", name: "Parkview Court", address: "25 Oak Avenue, Manchester M1 2CD", height: 22, storeys: 8, isHRB: true, clientName: "Northern Estates" },
  { id: "3", name: "Riverside House", address: "10 River Lane, Bristol BS1 5EF", height: 12, storeys: 4, isHRB: false, clientName: "Riverside Properties" },
];

export default function GoldenThread() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [buildings, setBuildings] = useState<Building[]>(SAMPLE_BUILDINGS);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [documentChecklist, setDocumentChecklist] = useState<DocumentChecklistItem[]>([]);
  const [infoRequests, setInfoRequests] = useState<InfoRequest[]>([]);
  const [showNewBuildingDialog, setShowNewBuildingDialog] = useState(false);
  const [showInfoRequestDialog, setShowInfoRequestDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("buildings");
  const [submissionSearchQuery, setSubmissionSearchQuery] = useState("");

  const { data: formSubmissions = [], isLoading: isLoadingSubmissions } = useQuery<DbFormSubmission[]>({
    queryKey: ["/api/form-submissions"],
    enabled: !!user?.id,
  });
  
  const [newBuilding, setNewBuilding] = useState({
    name: "",
    address: "",
    height: "",
    storeys: "",
    clientName: "",
  });
  
  const [newInfoRequest, setNewInfoRequest] = useState({
    recipientName: "",
    recipientEmail: "",
    documentTypes: [] as string[],
    message: "",
  });

  useEffect(() => {
    const savedBuildings = localStorage.getItem("goldenThread_buildings");
    const savedChecklist = localStorage.getItem("goldenThread_checklist");
    const savedRequests = localStorage.getItem("goldenThread_requests");
    
    if (savedBuildings) setBuildings(JSON.parse(savedBuildings));
    if (savedChecklist) setDocumentChecklist(JSON.parse(savedChecklist));
    if (savedRequests) setInfoRequests(JSON.parse(savedRequests));
  }, []);

  useEffect(() => {
    localStorage.setItem("goldenThread_buildings", JSON.stringify(buildings));
    localStorage.setItem("goldenThread_checklist", JSON.stringify(documentChecklist));
    localStorage.setItem("goldenThread_requests", JSON.stringify(infoRequests));
  }, [buildings, documentChecklist, infoRequests]);

  const isHRB = (height: number, storeys: number): boolean => {
    return height >= HRB_HEIGHT_THRESHOLD || storeys >= HRB_STOREY_THRESHOLD;
  };

  const generateChecklist = (buildingId: string): DocumentChecklistItem[] => {
    return HRB_DOCUMENT_CHECKLIST.map((item, index) => ({
      ...item,
      id: `${buildingId}-${index}`,
      status: "pending" as const,
    }));
  };

  const handleSelectBuilding = (building: Building) => {
    setSelectedBuilding(building);
    
    const existingChecklist = documentChecklist.filter(d => d.id.startsWith(`${building.id}-`));
    if (existingChecklist.length === 0 && building.isHRB) {
      const newChecklist = generateChecklist(building.id);
      setDocumentChecklist(prev => [...prev, ...newChecklist]);
    }
    setActiveTab("checklist");
  };

  const handleAddBuilding = () => {
    const height = parseFloat(newBuilding.height);
    const storeys = parseInt(newBuilding.storeys);
    
    if (!newBuilding.name || !newBuilding.address) {
      toast({ title: "Missing Information", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    const building: Building = {
      id: Date.now().toString(),
      name: newBuilding.name,
      address: newBuilding.address,
      height: height || 0,
      storeys: storeys || 0,
      isHRB: isHRB(height, storeys),
      clientName: newBuilding.clientName,
    };
    
    setBuildings(prev => [...prev, building]);
    setShowNewBuildingDialog(false);
    setNewBuilding({ name: "", address: "", height: "", storeys: "", clientName: "" });
    
    toast({ 
      title: "Building Added", 
      description: building.isHRB 
        ? "High-Rise Building detected - Document checklist auto-generated" 
        : "Building added successfully" 
    });
    
    if (building.isHRB) {
      handleSelectBuilding(building);
    }
  };

  const handleUpdateDocumentStatus = (docId: string, status: DocumentChecklistItem["status"]) => {
    setDocumentChecklist(prev => prev.map(doc => {
      if (doc.id === docId) {
        return {
          ...doc,
          status,
          ...(status === "requested" && { requestedDate: new Date().toISOString() }),
          ...(status === "received" && { receivedDate: new Date().toISOString() }),
          ...(status === "verified" && { verifiedDate: new Date().toISOString() }),
        };
      }
      return doc;
    }));
    
    toast({ title: "Status Updated", description: `Document status changed to ${status}` });
  };

  const handleSendInfoRequest = () => {
    if (!selectedBuilding || !newInfoRequest.recipientEmail || newInfoRequest.documentTypes.length === 0) {
      toast({ title: "Missing Information", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    const request: InfoRequest = {
      id: Date.now().toString(),
      buildingId: selectedBuilding.id,
      recipientName: newInfoRequest.recipientName,
      recipientEmail: newInfoRequest.recipientEmail,
      documentTypes: newInfoRequest.documentTypes,
      message: newInfoRequest.message,
      sentDate: new Date().toISOString(),
      status: "sent",
      responses: 0,
      total: newInfoRequest.documentTypes.length,
    };
    
    setInfoRequests(prev => [...prev, request]);
    
    newInfoRequest.documentTypes.forEach(docType => {
      const docToUpdate = documentChecklist.find(d => d.name === docType && d.id.startsWith(`${selectedBuilding.id}-`));
      if (docToUpdate) {
        handleUpdateDocumentStatus(docToUpdate.id, "requested");
      }
    });
    
    setShowInfoRequestDialog(false);
    setNewInfoRequest({ recipientName: "", recipientEmail: "", documentTypes: [], message: "" });
    
    toast({ title: "Request Sent", description: `Information request sent to ${newInfoRequest.recipientEmail}` });
  };

  const getStatusBadge = (status: DocumentChecklistItem["status"]) => {
    switch (status) {
      case "pending": return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case "requested": return <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600"><Send className="h-3 w-3" />Requested</Badge>;
      case "received": return <Badge variant="outline" className="gap-1 border-blue-500 text-blue-600"><Download className="h-3 w-3" />Received</Badge>;
      case "verified": return <Badge className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" />Verified</Badge>;
      case "rejected": return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Rejected</Badge>;
    }
  };

  const getBuildingChecklist = () => {
    if (!selectedBuilding) return [];
    return documentChecklist.filter(d => d.id.startsWith(`${selectedBuilding.id}-`));
  };

  const getChecklistStats = () => {
    const checklist = getBuildingChecklist();
    const total = checklist.length;
    const verified = checklist.filter(d => d.status === "verified").length;
    const pending = checklist.filter(d => d.status === "pending").length;
    const inProgress = checklist.filter(d => ["requested", "received"].includes(d.status)).length;
    
    return { total, verified, pending, inProgress, percentage: total > 0 ? Math.round((verified / total) * 100) : 0 };
  };

  const filteredBuildings = buildings.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChecklist = getBuildingChecklist().filter(doc => 
    filterStatus === "all" || doc.status === filterStatus
  );

  const categories = Array.from(new Set(filteredChecklist.map(d => d.category)));

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <Link2 className="h-6 w-6 text-primary" />
              Golden Thread
            </h1>
            <p className="text-muted-foreground">Building document management for Building Safety Act compliance</p>
          </div>
          
          <Dialog open={showNewBuildingDialog} onOpenChange={setShowNewBuildingDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-building">
                <Plus className="h-4 w-4 mr-2" />
                Add Building
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Building</DialogTitle>
                <DialogDescription>
                  Enter building details. Buildings over 18m or 7+ storeys are classified as High-Rise Buildings (HRBs).
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="buildingName">Building Name *</Label>
                  <Input
                    id="buildingName"
                    value={newBuilding.name}
                    onChange={(e) => setNewBuilding(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Tower Block A"
                    data-testid="input-building-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="buildingAddress">Address *</Label>
                  <Input
                    id="buildingAddress"
                    value={newBuilding.address}
                    onChange={(e) => setNewBuilding(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Full address"
                    data-testid="input-building-address"
                  />
                </div>
                
                <div>
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    value={newBuilding.clientName}
                    onChange={(e) => setNewBuilding(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Property management company"
                    data-testid="input-client-name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="buildingHeight">Height (metres)</Label>
                    <Input
                      id="buildingHeight"
                      type="number"
                      value={newBuilding.height}
                      onChange={(e) => setNewBuilding(prev => ({ ...prev, height: e.target.value }))}
                      placeholder="0"
                      data-testid="input-building-height"
                    />
                  </div>
                  <div>
                    <Label htmlFor="buildingStoreys">Number of Storeys</Label>
                    <Input
                      id="buildingStoreys"
                      type="number"
                      value={newBuilding.storeys}
                      onChange={(e) => setNewBuilding(prev => ({ ...prev, storeys: e.target.value }))}
                      placeholder="0"
                      data-testid="input-building-storeys"
                    />
                  </div>
                </div>
                
                {(parseFloat(newBuilding.height) >= HRB_HEIGHT_THRESHOLD || parseInt(newBuilding.storeys) >= HRB_STOREY_THRESHOLD) && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
                    <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      This building qualifies as a High-Rise Building (HRB) under the Building Safety Act
                    </p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewBuildingDialog(false)}>Cancel</Button>
                <Button onClick={handleAddBuilding} data-testid="button-confirm-add-building">Add Building</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="buildings" className="gap-2" data-testid="tab-buildings">
            <Building2 className="h-4 w-4" />
            Buildings
          </TabsTrigger>
          <TabsTrigger value="checklist" className="gap-2" data-testid="tab-checklist" disabled={!selectedBuilding}>
            <ClipboardList className="h-4 w-4" />
            Document Checklist
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2" data-testid="tab-requests">
            <Mail className="h-4 w-4" />
            Information Requests
          </TabsTrigger>
          <TabsTrigger value="submissions" className="gap-2" data-testid="tab-submissions">
            <History className="h-4 w-4" />
            Form Submissions
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2" data-testid="tab-audit">
            <Link2 className="h-4 w-4" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buildings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Registered Buildings</CardTitle>
                  <CardDescription>Select a building to manage its Golden Thread documentation</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search buildings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-buildings"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredBuildings.map((building) => (
                  <Card 
                    key={building.id} 
                    className={`cursor-pointer transition-colors hover-elevate ${selectedBuilding?.id === building.id ? "border-primary" : ""}`}
                    onClick={() => handleSelectBuilding(building)}
                    data-testid={`card-building-${building.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{building.name}</CardTitle>
                        {building.isHRB && (
                          <Badge className="bg-amber-500 text-white">HRB</Badge>
                        )}
                      </div>
                      <CardDescription>{building.address}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Client:</span>
                          <span>{building.clientName || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Height:</span>
                          <span>{building.height}m / {building.storeys} storeys</span>
                        </div>
                        {building.isHRB && (
                          <div className="pt-2 border-t">
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-xs">Building Safety Act applies</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredBuildings.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No buildings found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          {selectedBuilding && (
            <>
              <div className="grid gap-4 md:grid-cols-5">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold" data-testid="text-total-documents">{getChecklistStats().total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Verified</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-verified-documents">{getChecklistStats().verified}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-muted-foreground" data-testid="text-pending-documents">{getChecklistStats().pending}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600" data-testid="text-inprogress-documents">{getChecklistStats().inProgress}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Completion</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold" data-testid="text-completion-percentage">{getChecklistStats().percentage}%</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <CardTitle>{selectedBuilding.name} - Document Checklist</CardTitle>
                      <CardDescription>Track required documentation for Building Safety Act compliance <span className="text-destructive">*</span> = mandatory</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-40" data-testid="select-filter-status">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="requested">Requested</SelectItem>
                          <SelectItem value="received">Received</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Dialog open={showInfoRequestDialog} onOpenChange={setShowInfoRequestDialog}>
                        <DialogTrigger asChild>
                          <Button data-testid="button-request-info">
                            <Send className="h-4 w-4 mr-2" />
                            Request Information
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Request Building Information</DialogTitle>
                            <DialogDescription>
                              Send a request to the client or building manager for missing documentation
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="recipientName">Recipient Name</Label>
                              <Input
                                id="recipientName"
                                value={newInfoRequest.recipientName}
                                onChange={(e) => setNewInfoRequest(prev => ({ ...prev, recipientName: e.target.value }))}
                                placeholder="Building Manager Name"
                                data-testid="input-recipient-name"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="recipientEmail">Recipient Email *</Label>
                              <Input
                                id="recipientEmail"
                                type="email"
                                value={newInfoRequest.recipientEmail}
                                onChange={(e) => setNewInfoRequest(prev => ({ ...prev, recipientEmail: e.target.value }))}
                                placeholder="email@example.com"
                                data-testid="input-recipient-email"
                              />
                            </div>
                            
                            <div>
                              <Label>Documents to Request *</Label>
                              <ScrollArea className="h-48 border rounded-md p-3 mt-2">
                                {getBuildingChecklist().filter(d => d.status === "pending").map((doc) => (
                                  <div key={doc.id} className="flex items-center space-x-2 py-1">
                                    <Checkbox
                                      id={doc.id}
                                      checked={newInfoRequest.documentTypes.includes(doc.name)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setNewInfoRequest(prev => ({ ...prev, documentTypes: [...prev.documentTypes, doc.name] }));
                                        } else {
                                          setNewInfoRequest(prev => ({ ...prev, documentTypes: prev.documentTypes.filter(d => d !== doc.name) }));
                                        }
                                      }}
                                    />
                                    <label htmlFor={doc.id} className="text-sm cursor-pointer">
                                      {doc.name}
                                    </label>
                                  </div>
                                ))}
                              </ScrollArea>
                              <p className="text-xs text-muted-foreground mt-1">
                                {newInfoRequest.documentTypes.length} document(s) selected
                              </p>
                            </div>
                            
                            <div>
                              <Label htmlFor="message">Additional Message</Label>
                              <Textarea
                                id="message"
                                value={newInfoRequest.message}
                                onChange={(e) => setNewInfoRequest(prev => ({ ...prev, message: e.target.value }))}
                                placeholder="Please provide the following documentation for Building Safety Act compliance..."
                                rows={3}
                                data-testid="input-request-message"
                              />
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowInfoRequestDialog(false)}>Cancel</Button>
                            <Button onClick={handleSendInfoRequest} data-testid="button-send-request">
                              <Send className="h-4 w-4 mr-2" />
                              Send Request
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!selectedBuilding.isHRB ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>This building is not classified as a High-Rise Building (HRB)</p>
                      <p className="text-sm">Building Safety Act document requirements do not apply</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {categories.map((category) => (
                        <div key={category}>
                          <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                            {category}
                          </h3>
                          <div className="space-y-2">
                            {filteredChecklist.filter(d => d.category === category).map((doc) => (
                              <div 
                                key={doc.id} 
                                className="flex items-center justify-between p-3 border rounded-md gap-4"
                                data-testid={`doc-item-${doc.id}`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{doc.name}</p>
                                    {doc.required && <span className="text-xs font-medium text-destructive">*</span>}
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate">{doc.description}</p>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(doc.status)}
                                  
                                  <Select 
                                    value={doc.status} 
                                    onValueChange={(value) => handleUpdateDocumentStatus(doc.id, value as DocumentChecklistItem["status"])}
                                  >
                                    <SelectTrigger className="w-32" data-testid={`select-status-${doc.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="requested">Requested</SelectItem>
                                      <SelectItem value="received">Received</SelectItem>
                                      <SelectItem value="verified">Verified</SelectItem>
                                      <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
          
          {!selectedBuilding && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a building from the Buildings tab to view its document checklist</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Information Requests</CardTitle>
              <CardDescription>Track document requests sent to clients and building managers</CardDescription>
            </CardHeader>
            <CardContent>
              {infoRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No information requests sent yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {infoRequests.map((request) => {
                    const building = buildings.find(b => b.id === request.buildingId);
                    return (
                      <div 
                        key={request.id} 
                        className="flex items-center justify-between p-4 border rounded-md gap-4"
                        data-testid={`request-item-${request.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{building?.name || "Unknown Building"}</p>
                            <Badge variant={request.status === "complete" ? "default" : "secondary"}>
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Sent to {request.recipientName || request.recipientEmail} on {new Date(request.sentDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.documentTypes.length} document(s) requested
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {request.responses}/{request.total} received
                          </span>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Form Submission History</CardTitle>
                  <CardDescription>Complete audit trail of all test reports, inspections, and compliance documents</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search submissions..."
                    value={submissionSearchQuery}
                    onChange={(e) => setSubmissionSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-submissions"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSubmissions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : formSubmissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No form submissions recorded yet</p>
                  <p className="text-sm">Test reports and inspection forms will appear here when submitted</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Form Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formSubmissions
                      .filter((sub) => 
                        submissionSearchQuery === "" ||
                        sub.formTitle?.toLowerCase().includes(submissionSearchQuery.toLowerCase()) ||
                        sub.referenceNumber?.toLowerCase().includes(submissionSearchQuery.toLowerCase()) ||
                        sub.formType?.toLowerCase().includes(submissionSearchQuery.toLowerCase()) ||
                        sub.submittedBy?.toLowerCase().includes(submissionSearchQuery.toLowerCase())
                      )
                      .map((submission) => (
                        <TableRow key={submission.id} data-testid={`row-submission-${submission.id}`}>
                          <TableCell className="font-mono text-sm">
                            {submission.referenceNumber || submission.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {submission.formType?.replace(/_/g, " ") || "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {submission.formTitle}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm">{submission.submittedBy}</div>
                              {submission.submittedByRole && (
                                <div className="text-xs text-muted-foreground capitalize">
                                  {submission.submittedByRole.replace(/_/g, " ")}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {submission.submittedAt && format(new Date(submission.submittedAt), "dd MMM yyyy")}
                            <div className="text-xs text-muted-foreground">
                              {submission.submittedAt && format(new Date(submission.submittedAt), "HH:mm")}
                            </div>
                          </TableCell>
                          <TableCell>
                            {submission.status === "approved" ? (
                              <Badge className="bg-green-600 gap-1"><CheckCircle2 className="h-3 w-3" />Approved</Badge>
                            ) : submission.status === "rejected" ? (
                              <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Rejected</Badge>
                            ) : submission.status === "draft" ? (
                              <Badge variant="secondary" className="gap-1"><FileText className="h-3 w-3" />Draft</Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1"><CheckCircle2 className="h-3 w-3" />Submitted</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" data-testid={`button-view-submission-${submission.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {submission.pdfUrl && (
                                <Button variant="ghost" size="icon" data-testid={`button-download-submission-${submission.id}`}>
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submission Statistics</CardTitle>
              <CardDescription>Overview of form submissions for compliance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 border rounded-md">
                  <div className="text-2xl font-bold">{formSubmissions.length}</div>
                  <div className="text-sm text-muted-foreground">Total Submissions</div>
                </div>
                <div className="p-4 border rounded-md">
                  <div className="text-2xl font-bold text-green-600">
                    {formSubmissions.filter(s => s.status === "approved").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Approved</div>
                </div>
                <div className="p-4 border rounded-md">
                  <div className="text-2xl font-bold text-amber-600">
                    {formSubmissions.filter(s => s.status === "submitted").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending Review</div>
                </div>
                <div className="p-4 border rounded-md">
                  <div className="text-2xl font-bold">
                    {Array.from(new Set(formSubmissions.map(s => s.formType))).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Form Types</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="audit" className="space-y-4">
          <AuditTimeline title="Organization audit trail" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
