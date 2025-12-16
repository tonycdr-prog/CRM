import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  ClipboardCheck, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Save,
  FileText,
  Gauge,
  Battery,
  ThermometerSun,
  Timer,
  DoorOpen,
  Fan,
  Eye,
  Settings,
  ChevronRight
} from "lucide-react";
import { 
  CHECK_SHEET_SYSTEM_TYPES, 
  CHECK_SHEET_FIELD_CATEGORIES, 
  DEFAULT_TEMPLATE_FIELDS,
  type CheckSheetFieldDefinition,
  type CheckSheetReadingValue,
  type DbCheckSheetReading 
} from "@shared/schema";

interface FormReading {
  fieldId: string;
  value: string | number | boolean | null;
  passFail?: "pass" | "fail" | "na";
  notes?: string;
}

const defaultFormData = {
  systemType: "",
  building: "",
  floor: "",
  location: "",
  systemId: "",
  testerName: "",
  testDate: new Date().toISOString().split("T")[0],
  testTime: "",
  notes: "",
  recommendations: "",
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "fan_readings": return Fan;
    case "door_force": return DoorOpen;
    case "co_readings": return ThermometerSun;
    case "battery": return Battery;
    case "voltages": return Gauge;
    case "timings": return Timer;
    case "pressure": return Gauge;
    case "airflow": return Fan;
    case "control_panel": return Settings;
    case "dampers": return ChevronRight;
    case "visual": return Eye;
    default: return FileText;
  }
};

const getCategoryLabel = (category: string) => {
  const cat = CHECK_SHEET_FIELD_CATEGORIES.find(c => c.value === category);
  return cat?.label || category;
};

export default function CheckSheetReadingsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<DbCheckSheetReading | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [readings, setReadings] = useState<FormReading[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [lastDraftSave, setLastDraftSave] = useState<Date | null>(null);
  const { toast } = useToast();

  const userId = "test-user-shared";

  const { data: checkSheetReadings = [], isLoading } = useQuery<DbCheckSheetReading[]>({
    queryKey: ["/api/check-sheet-readings", userId],
  });

  const fields = formData.systemType ? (DEFAULT_TEMPLATE_FIELDS[formData.systemType] || []) : [];

  // Reset readings whenever systemType changes
  const initializeReadingsForSystemType = useCallback((systemType: string) => {
    const templateFields = DEFAULT_TEMPLATE_FIELDS[systemType] || [];
    setReadings(templateFields.map(field => ({
      fieldId: field.id,
      value: field.fieldType === "boolean" ? false : field.fieldType === "pass_fail" ? null : "",
      passFail: undefined,
      notes: "",
    })));
  }, []);

  // Handle system type change - always reset fields
  const handleSystemTypeChange = useCallback((newSystemType: string) => {
    setFormData(prev => ({ ...prev, systemType: newSystemType }));
    if (!editingReading) {
      initializeReadingsForSystemType(newSystemType);
    }
  }, [editingReading, initializeReadingsForSystemType]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/check-sheet-readings", { ...data, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/check-sheet-readings", userId] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Check sheet saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save check sheet", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/check-sheet-readings/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/check-sheet-readings", userId] });
      setIsDialogOpen(false);
      setEditingReading(null);
      resetForm();
      toast({ title: "Check sheet updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update check sheet", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/check-sheet-readings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/check-sheet-readings", userId] });
      toast({ title: "Check sheet deleted" });
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setReadings([]);
    setEditingReading(null);
    setActiveCategory("all");
  };

  const handleEdit = (reading: DbCheckSheetReading) => {
    setEditingReading(reading);
    setFormData({
      systemType: reading.systemType || "",
      building: reading.building || "",
      floor: reading.floor || "",
      location: reading.location || "",
      systemId: reading.systemId || "",
      testerName: reading.testerName || "",
      testDate: reading.testDate || new Date().toISOString().split("T")[0],
      testTime: reading.testTime || "",
      notes: reading.notes || "",
      recommendations: reading.recommendations || "",
    });
    setReadings((reading.readings as FormReading[]) || []);
    setIsDialogOpen(true);
  };

  const updateReading = useCallback((fieldId: string, key: keyof FormReading, value: any) => {
    setReadings(prev => prev.map(r => {
      if (r.fieldId !== fieldId) return r;
      const updated = { ...r, [key]: value };
      // Recalculate passFail whenever value changes
      if (key === "value") {
        const field = fields.find(f => f.id === fieldId);
        updated.passFail = calculatePassFail(field, value);
      }
      return updated;
    }));
  }, [fields]);

  const calculatePassFail = (field: CheckSheetFieldDefinition | undefined, value: any): "pass" | "fail" | "na" => {
    if (!field) return "na";
    if (value === null || value === "" || value === undefined) return "na";
    
    if (field.fieldType === "pass_fail") {
      if (value === true || value === "pass") return "pass";
      if (value === false || value === "fail") return "fail";
      return "na";
    }
    
    if (field.fieldType === "number") {
      const numValue = typeof value === "number" ? value : parseFloat(value);
      if (isNaN(numValue)) return "na";
      
      // Check thresholds - failThreshold is the upper limit, passThreshold is the lower limit
      const hasPassThreshold = field.passThreshold !== undefined;
      const hasFailThreshold = field.failThreshold !== undefined;
      
      if (hasFailThreshold && numValue > field.failThreshold!) return "fail";
      if (hasPassThreshold && numValue < field.passThreshold!) return "fail";
      
      // If value is within acceptable range or no thresholds defined, it passes
      return "pass";
    }
    
    // For text and other types, consider them passed if they have a value
    if (field.fieldType === "text" || field.fieldType === "boolean" || field.fieldType === "select") {
      return "pass";
    }
    
    return "na";
  };

  const handleSubmit = (status: "draft" | "complete") => {
    if (!formData.systemType) {
      toast({ title: "Please select a system type", variant: "destructive" });
      return;
    }
    if (!formData.testerName) {
      toast({ title: "Please enter tester name", variant: "destructive" });
      return;
    }

    const processedReadings = readings.map(r => {
      const field = fields.find(f => f.id === r.fieldId);
      return {
        ...r,
        passFail: field ? calculatePassFail(field, r.value) : "na",
      };
    });

    const passCount = processedReadings.filter(r => r.passFail === "pass").length;
    const failCount = processedReadings.filter(r => r.passFail === "fail").length;
    const naCount = processedReadings.filter(r => r.passFail === "na").length;
    const overallResult = failCount > 0 ? "fail" : passCount > 0 ? "pass" : "incomplete";

    const submitData = {
      ...formData,
      readings: processedReadings,
      status,
      passCount,
      failCount,
      naCount,
      overallResult,
    };

    if (editingReading) {
      updateMutation.mutate({ ...submitData, id: editingReading.id });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const saveDraft = useCallback(() => {
    if (!formData.systemType || readings.length === 0) return;
    setIsDraftSaving(true);
    const draftKey = `checksheet_draft_${userId}`;
    localStorage.setItem(draftKey, JSON.stringify({ formData, readings, savedAt: new Date().toISOString() }));
    setLastDraftSave(new Date());
    setIsDraftSaving(false);
  }, [formData, readings, userId]);

  useEffect(() => {
    if (formData.systemType && readings.length > 0 && !editingReading) {
      const timer = setTimeout(saveDraft, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, readings, saveDraft, editingReading]);

  useEffect(() => {
    const draftKey = `checksheet_draft_${userId}`;
    const draft = localStorage.getItem(draftKey);
    if (draft && !editingReading) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.formData && parsed.readings) {
          setFormData(parsed.formData);
          setReadings(parsed.readings);
          toast({ title: "Draft restored", description: "Your previous work has been restored" });
        }
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
    }
  }, [userId, editingReading, toast]);

  const clearDraft = () => {
    const draftKey = `checksheet_draft_${userId}`;
    localStorage.removeItem(draftKey);
    resetForm();
    toast({ title: "Draft cleared" });
  };

  const getStatusBadge = (status: string | null, overallResult: string | null) => {
    if (status === "draft") {
      return <Badge variant="secondary">Draft</Badge>;
    }
    switch (overallResult) {
      case "pass": return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Passed</Badge>;
      case "fail": return <Badge variant="destructive">Failed</Badge>;
      case "incomplete": return <Badge variant="outline">Incomplete</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getSystemLabel = (systemType: string | null) => {
    const system = CHECK_SHEET_SYSTEM_TYPES.find(s => s.value === systemType);
    return system?.label || systemType || "Unknown";
  };

  const categorizedFields = fields.reduce((acc, field) => {
    const cat = field.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(field);
    return acc;
  }, {} as Record<string, CheckSheetFieldDefinition[]>);

  const visibleCategories = activeCategory === "all" 
    ? Object.keys(categorizedFields) 
    : [activeCategory];

  const completedCount = readings.filter(r => r.value !== null && r.value !== "").length;
  const progressPercent = fields.length > 0 ? (completedCount / fields.length) * 100 : 0;

  if (isLoading) {
    return <div className="p-6" data-testid="loading-check-sheets">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6" data-testid="check-sheet-readings-page">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title">Check Sheet Readings</h1>
          <p className="text-muted-foreground">System-specific commissioning and testing check sheets</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-reading">
              <Plus className="w-4 h-4 mr-2" />
              New Check Sheet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">
                {editingReading ? "Edit Check Sheet" : "New Check Sheet Reading"}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="setup" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="setup" data-testid="tab-setup">Setup</TabsTrigger>
                <TabsTrigger value="readings" data-testid="tab-readings" disabled={!formData.systemType}>
                  Readings
                </TabsTrigger>
                <TabsTrigger value="summary" data-testid="tab-summary" disabled={!formData.systemType}>
                  Summary
                </TabsTrigger>
              </TabsList>

              <TabsContent value="setup" className="flex-1 overflow-auto space-y-4 p-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>System Type *</Label>
                    <Select 
                      value={formData.systemType} 
                      onValueChange={handleSystemTypeChange}
                    >
                      <SelectTrigger data-testid="select-system-type">
                        <SelectValue placeholder="Select system type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CHECK_SHEET_SYSTEM_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Building</Label>
                    <Input
                      value={formData.building}
                      onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                      placeholder="e.g., Tower A"
                      data-testid="input-building"
                    />
                  </div>
                  <div>
                    <Label>Floor</Label>
                    <Input
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      placeholder="e.g., Level 5"
                      data-testid="input-floor"
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Plant Room 3"
                      data-testid="input-location"
                    />
                  </div>
                  <div>
                    <Label>System ID</Label>
                    <Input
                      value={formData.systemId}
                      onChange={(e) => setFormData({ ...formData, systemId: e.target.value })}
                      placeholder="e.g., PRESS-01"
                      data-testid="input-system-id"
                    />
                  </div>
                  <div>
                    <Label>Tester Name *</Label>
                    <Input
                      value={formData.testerName}
                      onChange={(e) => setFormData({ ...formData, testerName: e.target.value })}
                      placeholder="Enter your name"
                      data-testid="input-tester-name"
                    />
                  </div>
                  <div>
                    <Label>Test Date</Label>
                    <Input
                      type="date"
                      value={formData.testDate}
                      onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                      data-testid="input-test-date"
                    />
                  </div>
                  <div>
                    <Label>Test Time</Label>
                    <Input
                      type="time"
                      value={formData.testTime}
                      onChange={(e) => setFormData({ ...formData, testTime: e.target.value })}
                      data-testid="input-test-time"
                    />
                  </div>
                </div>
                
                {formData.systemType && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4" />
                        Template Fields: {fields.length} items
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(categorizedFields).map(cat => {
                          const Icon = getCategoryIcon(cat);
                          return (
                            <Badge key={cat} variant="outline" className="flex items-center gap-1">
                              <Icon className="w-3 h-3" />
                              {getCategoryLabel(cat)} ({categorizedFields[cat].length})
                            </Badge>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="readings" className="flex-1 overflow-auto flex flex-col p-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <Progress value={progressPercent} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {completedCount} of {fields.length} fields completed ({Math.round(progressPercent)}%)
                    </p>
                  </div>
                  <Select value={activeCategory} onValueChange={setActiveCategory}>
                    <SelectTrigger className="w-48" data-testid="select-category-filter">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Object.keys(categorizedFields).map(cat => (
                        <SelectItem key={cat} value={cat}>{getCategoryLabel(cat)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-6 pr-4">
                    {visibleCategories.map(category => (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
                          {(() => {
                            const Icon = getCategoryIcon(category);
                            return <Icon className="w-4 h-4 text-muted-foreground" />;
                          })()}
                          <h3 className="font-semibold">{getCategoryLabel(category)}</h3>
                          <Separator className="flex-1" />
                        </div>
                        
                        <div className="grid gap-4">
                          {(categorizedFields[category] || []).map(field => {
                            const reading = readings.find(r => r.fieldId === field.id);
                            const value = reading?.value ?? "";
                            const passFail = reading?.passFail;
                            
                            return (
                              <Card key={field.id} className={`${
                                passFail === "fail" ? "border-red-500" : 
                                passFail === "pass" ? "border-green-500" : ""
                              }`}>
                                <CardContent className="py-3 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <Label className="font-medium">
                                        {field.name}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                      </Label>
                                      {field.description && (
                                        <p className="text-xs text-muted-foreground">{field.description}</p>
                                      )}
                                      {field.unit && (
                                        <p className="text-xs text-muted-foreground">Unit: {field.unit}</p>
                                      )}
                                      {(field.passThreshold !== undefined || field.failThreshold !== undefined) && (
                                        <p className="text-xs text-muted-foreground">
                                          {field.passThreshold !== undefined && `Min: ${field.passThreshold}${field.unit || ""}`}
                                          {field.passThreshold !== undefined && field.failThreshold !== undefined && " | "}
                                          {field.failThreshold !== undefined && `Max: ${field.failThreshold}${field.unit || ""}`}
                                        </p>
                                      )}
                                    </div>
                                    {passFail && (
                                      <div>
                                        {passFail === "pass" && <CheckCircle className="w-5 h-5 text-green-500" />}
                                        {passFail === "fail" && <XCircle className="w-5 h-5 text-red-500" />}
                                        {passFail === "na" && <AlertCircle className="w-5 h-5 text-muted-foreground" />}
                                      </div>
                                    )}
                                  </div>

                                  {field.fieldType === "pass_fail" && (
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={value === true ? "default" : "outline"}
                                        className={value === true ? "bg-green-600 hover:bg-green-700" : ""}
                                        onClick={() => updateReading(field.id, "value", true)}
                                        data-testid={`button-pass-${field.id}`}
                                      >
                                        <CheckCircle className="w-4 h-4 mr-1" /> Pass
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={value === false ? "default" : "outline"}
                                        className={value === false ? "bg-red-600 hover:bg-red-700" : ""}
                                        onClick={() => updateReading(field.id, "value", false)}
                                        data-testid={`button-fail-${field.id}`}
                                      >
                                        <XCircle className="w-4 h-4 mr-1" /> Fail
                                      </Button>
                                    </div>
                                  )}

                                  {field.fieldType === "number" && (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={value as number}
                                        onChange={(e) => updateReading(field.id, "value", e.target.value ? parseFloat(e.target.value) : "")}
                                        className="w-32"
                                        data-testid={`input-${field.id}`}
                                      />
                                      {field.unit && <span className="text-sm text-muted-foreground">{field.unit}</span>}
                                    </div>
                                  )}

                                  {field.fieldType === "text" && (
                                    <Input
                                      value={value as string}
                                      onChange={(e) => updateReading(field.id, "value", e.target.value)}
                                      data-testid={`input-${field.id}`}
                                    />
                                  )}

                                  {field.fieldType === "boolean" && (
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={value as boolean}
                                        onCheckedChange={(checked) => updateReading(field.id, "value", checked)}
                                        data-testid={`switch-${field.id}`}
                                      />
                                      <span className="text-sm">{value ? "Yes" : "No"}</span>
                                    </div>
                                  )}

                                  {field.fieldType === "select" && field.options && (
                                    <Select 
                                      value={value as string} 
                                      onValueChange={(v) => updateReading(field.id, "value", v)}
                                    >
                                      <SelectTrigger data-testid={`select-${field.id}`}>
                                        <SelectValue placeholder="Select..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {field.options.map(opt => (
                                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}

                                  <Input
                                    placeholder="Notes (optional)"
                                    value={reading?.notes || ""}
                                    onChange={(e) => updateReading(field.id, "notes", e.target.value)}
                                    className="text-sm"
                                    data-testid={`input-notes-${field.id}`}
                                  />
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="summary" className="flex-1 overflow-auto space-y-4 p-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Test Summary</CardTitle>
                    <CardDescription>Review your readings before submission</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {readings.filter(r => calculatePassFail(
                            fields.find(f => f.id === r.fieldId)!, 
                            r.value
                          ) === "pass").length}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">Passed</p>
                      </div>
                      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {readings.filter(r => calculatePassFail(
                            fields.find(f => f.id === r.fieldId)!, 
                            r.value
                          ) === "fail").length}
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400">Failed</p>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <p className="text-2xl font-bold text-muted-foreground">
                          {readings.filter(r => calculatePassFail(
                            fields.find(f => f.id === r.fieldId)!, 
                            r.value
                          ) === "na").length}
                        </p>
                        <p className="text-sm text-muted-foreground">N/A</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>General Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any additional notes about this test..."
                        data-testid="textarea-notes"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Recommendations</Label>
                      <Textarea
                        value={formData.recommendations}
                        onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                        placeholder="Any recommendations or follow-up actions required..."
                        data-testid="textarea-recommendations"
                      />
                    </div>
                  </CardContent>
                </Card>

                {lastDraftSave && (
                  <p className="text-xs text-muted-foreground text-center">
                    Draft auto-saved at {lastDraftSave.toLocaleTimeString()}
                  </p>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex-shrink-0 gap-2 pt-4 border-t">
              {formData.systemType && !editingReading && (
                <Button variant="ghost" onClick={clearDraft} data-testid="button-clear-draft">
                  Clear Draft
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => handleSubmit("draft")}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-draft"
              >
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>
              <Button 
                onClick={() => handleSubmit("complete")}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit"
              >
                {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Submit Check Sheet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {checkSheetReadings.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No check sheets yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first check sheet to start documenting system readings
          </p>
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-empty-state-add">
            <Plus className="w-4 h-4 mr-2" />
            New Check Sheet
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {checkSheetReadings.map((reading) => (
            <Card key={reading.id} className="hover-elevate" data-testid={`card-reading-${reading.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{getSystemLabel(reading.systemType)}</CardTitle>
                    <CardDescription>
                      {reading.building && `${reading.building}`}
                      {reading.floor && ` - ${reading.floor}`}
                      {reading.location && ` - ${reading.location}`}
                    </CardDescription>
                  </div>
                  {getStatusBadge(reading.status, reading.overallResult)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{reading.testerName}</span>
                  <span>{reading.testDate}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" /> {reading.passCount || 0}
                  </span>
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <XCircle className="w-4 h-4" /> {reading.failCount || 0}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <AlertCircle className="w-4 h-4" /> {reading.naCount || 0}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEdit(reading)}
                    data-testid={`button-edit-${reading.id}`}
                  >
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deleteMutation.mutate(reading.id)}
                    data-testid={`button-delete-${reading.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
