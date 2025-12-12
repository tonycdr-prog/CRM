import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, ClipboardList, FileText, AlertCircle } from "lucide-react";
import type { DbVisitType, DbServiceTemplate } from "@shared/schema";

const visitTypeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  category: z.string().default("smoke_control"),
  regulatoryStandard: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

const serviceTemplateFormSchema = z.object({
  visitTypeId: z.string().min(1, "Visit type is required"),
  name: z.string().min(1, "Name is required"),
  intervalType: z.string().default("weekly"),
  carriedOutBy: z.string().default("competent_person"),
  guidelines: z.string().optional(),
  equipmentRequired: z.string().optional(),
  estimatedDuration: z.number().min(1).default(30),
  regulatoryReference: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

type VisitTypeFormValues = z.infer<typeof visitTypeFormSchema>;
type ServiceTemplateFormValues = z.infer<typeof serviceTemplateFormSchema>;

const DEFAULT_VISIT_TYPES = [
  {
    name: "NSHEV (Natural Smoke & Heat Exhaust)",
    code: "nshev",
    description: "Natural Smoke and Heat Exhaust Ventilation systems using thermal buoyancy for smoke control in staircases and corridors",
    category: "smoke_control",
    regulatoryStandard: "BS EN 12101-2, BS 9999",
  },
  {
    name: "MSHEV (Mechanical Smoke & Heat Exhaust)",
    code: "mshev",
    description: "Mechanical Smoke Ventilation Systems using fans for smoke extraction from specified areas",
    category: "smoke_control",
    regulatoryStandard: "BS EN 12101-3, BS 9999",
  },
  {
    name: "Pressurisation (PDS)",
    code: "pressurisation",
    description: "Pressure Differential Systems using positive pressure to keep specified areas clear of smoke",
    category: "smoke_control",
    regulatoryStandard: "BS EN 12101-6",
  },
  {
    name: "Electro-Pneumatic",
    code: "electro_pneumatic",
    description: "Electro-pneumatic smoke control systems combining electrical and pneumatic actuation",
    category: "smoke_control",
    regulatoryStandard: "BS 7346-8",
  },
  {
    name: "Residential Stair AOV",
    code: "residential_aov",
    description: "Automatic Opening Vents for residential staircase smoke control",
    category: "smoke_control",
    regulatoryStandard: "BS 9991, Approved Document B",
  },
  {
    name: "Car Park Ventilation",
    code: "car_park",
    description: "Mechanical ventilation for car parks including CO monitoring and fire mode smoke extraction",
    category: "ventilation",
    regulatoryStandard: "BS 7346-7, Approved Document B",
  },
];

const SCA_CHECKLIST_ITEMS: Record<string, {daily: string[], weekly: string[], monthly: string[], quarterly: string[], biannual: string[], annual: string[]}> = {
  mshev: {
    daily: [
      "Inspect Smoke Control System status panel for clear indication of normal operation",
      "Check fire alarm system is active",
      "Log any faults and resolve promptly",
    ],
    weekly: [
      "Actuation of the system as per system provider recommendations",
      "Check all Smoke Control status panels and Firefighter's Switches for fault indication",
      "Ensure fans/powered exhaust ventilators operate as normal",
      "Check dampers for triggered zones open and close correctly",
      "Verify natural exhaust ventilators open and smoke curtains move into position",
      "Check if dampers & vents can be seen/heard opening and closing",
      "Verify fans can be heard operating without strange sounds",
      "Check air inlet has opened with exhaust/outlet damper",
      "Verify air movement toward and into smoke shaft via damper",
      "On reset, verify fans turned off and all dampers & vents fully closed",
    ],
    monthly: [
      "Thorough inspection of all rooftop equipment for debris, wear, corrosion, tampering",
      "Check for signs of vermin, overgrown vegetation or combustible materials",
      "Test door hold-open devices by simulating power failure or fire alarm operation",
      "Run fans to ensure duty and standby fans have totalled 20 min run time",
      "Simulate failure of primary power supply and run system on secondary supply for 1 hour",
      "For generator backup: Check fuel tank for 72 hours standby + 3 hours full load",
      "For UPS backup: Check UPS controls for fault indications",
    ],
    quarterly: [
      "Ensure all zones have been independently tested",
      "Ensure all parts of the entire smoke control system have been tested",
      "Verify all fire detection inputs and control interfaces tested",
    ],
    biannual: [
      "Check ATS has been maintained per manufacturer intervals",
      "Review system logbook for recorded observations and regular checks",
      "Check fan operations and runtime on system drives",
      "Verify cause and effects function as per original design",
      "Check power supply transfer from primary to secondary correctly",
      "Review ATS service report dated within last 12 months",
      "Check LV supplies for appropriate protective devices",
      "Verify UPS service report within last 12 months",
      "Check panel batteries are no more than 3 years from manufacture",
      "Replace PLC battery every 2 years unless manufacturer states otherwise",
      "Take and record representative sample of flow rates for smoke dampers",
      "Conduct fan testing per SCA & FMA Guide",
    ],
    annual: [
      "Full commissioning check against system design",
      "Check all cause and effects against fire strategy and specifications",
      "Verify system components function as per original design",
      "Inspect shaft doors/dampers for correct operation and intumescent seals",
      "Check all vents meet functional performance requirements",
      "Verify window vents are higher than 1100mm from floor level",
      "Check rooftop vents open fully",
      "Verify shaft has no unauthorized utility services installed",
      "Check cable installation per ADB, BS 8519, BS 7671 and SCA Guidance",
      "Clean all smoke control ducts and smoke shafts",
      "Joint inspection with other maintenance providers recommended",
      "Check detectors over 10 years old and replace as needed",
    ],
  },
  nshev: {
    daily: [
      "Inspect Smoke Control System status panel for clear indication of normal operation",
      "Check fire alarm system is active",
      "Log any faults and resolve promptly",
    ],
    weekly: [
      "Actuation of the system as per system provider recommendations",
      "Check all Smoke Control status panels and Firefighter's Switches for fault indication",
      "Check dampers for triggered zones open and close correctly",
      "Verify natural exhaust ventilators open",
      "Verify smoke curtains move into position if applicable",
      "Check if dampers & vents can be seen/heard opening and closing",
      "On reset, verify all dampers & vents fully closed",
    ],
    monthly: [
      "Thorough inspection of all AOVs and Control Panels",
      "Check for debris ingress, wear, corrosion, tampering, signs of vermin",
      "Test door hold-open devices by simulating power failure or fire alarm operation",
      "Simulate failure of primary power supply and operate on secondary supply",
      "Check UPS controls for fault indications",
    ],
    quarterly: [
      "Ensure all parts of entire smoke control system have been tested",
      "Verify all fire detection inputs and control interfaces tested",
    ],
    biannual: [
      "Review system logbook for recorded observations and regular checks",
      "Check all cause and effects function as per original design",
      "Check condition of actuators for wear and tear, lubricate where applicable",
      "Check shaft components for visible gaps/damage",
      "Verify power supply transfer from primary to secondary correctly",
      "Check LV supplies for appropriate protective devices",
      "Review UPS service report within last 12 months",
      "Check panel batteries are no more than 3 years from manufacture",
      "Replace PLC battery every 2 years unless manufacturer states otherwise",
    ],
    annual: [
      "Full commissioning check against system design",
      "Check all cause and effects against fire strategy and specifications",
      "Verify system components function as per original design",
      "Check all vents meet functional performance requirements",
      "Verify window vents are higher than 1100mm from floor level",
      "Check rooftop vents open fully",
      "Check cable installation per ADB, BS 8519, BS 7671 and SCA Guidance",
      "Joint inspection with other maintenance providers recommended",
      "Check detectors over 10 years old and replace as needed",
    ],
  },
  pressurisation: {
    daily: [
      "Inspect Smoke Control System status panel for clear indication of normal operation",
      "Check fire alarm system is active",
      "Log any faults and resolve promptly",
    ],
    weekly: [
      "Actuation of the system as per system provider recommendations",
      "Check all Smoke Control status panels and Firefighter's Switches for fault indication",
      "Verify pressure differential readings are within acceptable range",
      "Check fans are operating and producing correct pressure",
      "Verify door release mechanisms operate correctly",
    ],
    monthly: [
      "Check differential pressure gauges/sensors are functioning",
      "Test door hold-open devices by simulating power failure or fire alarm operation",
      "Run pressure system to verify design pressures achieved",
      "Simulate failure of primary power and run on secondary supply",
      "Check UPS/generator controls for fault indications",
    ],
    quarterly: [
      "Ensure all zones have been independently tested",
      "Verify pressure differentials meet BS EN 12101-6 requirements",
      "Check all pressure relief systems operate correctly",
    ],
    biannual: [
      "Review system logbook for recorded observations",
      "Measure and record pressure differentials across all protected areas",
      "Check all cause and effects function as per original design",
      "Verify power supply transfer from primary to secondary",
      "Review ATS/UPS service reports",
      "Check panel batteries condition",
    ],
    annual: [
      "Full commissioning check against system design per BS EN 12101-6",
      "Verify system meets classification requirements (A, B, C, D, E, or F)",
      "Check door opening forces do not exceed 100N",
      "Verify air release paths are clear and functioning",
      "Check cable installation per relevant standards",
      "Joint inspection with other maintenance providers",
    ],
  },
  electro_pneumatic: {
    daily: [
      "Inspect Smoke Control System status panel for normal operation",
      "Check fire alarm system is active",
      "Log any faults and resolve promptly",
    ],
    weekly: [
      "Test system actuation per provider recommendations",
      "Check status panels and Firefighter's Switches for faults",
      "Verify pneumatic actuators operate correctly",
      "Check air compressor/receiver operation and pressure",
      "Verify dampers and vents open and close correctly",
    ],
    monthly: [
      "Inspect all pneumatic lines for leaks or damage",
      "Check compressor oil levels and condition",
      "Drain moisture from air receivers",
      "Test door hold-open devices",
      "Simulate power failure and run on secondary supply",
    ],
    quarterly: [
      "Ensure all zones have been independently tested",
      "Check pneumatic actuator response times",
      "Verify all detection inputs and control interfaces",
    ],
    biannual: [
      "Review system logbook",
      "Check air drier function and filters",
      "Verify cause and effects function as designed",
      "Service compressor per manufacturer requirements",
      "Check all pneumatic fittings and connections",
    ],
    annual: [
      "Full commissioning check against system design",
      "Pressure test all pneumatic lines",
      "Check actuator seals and replace as necessary",
      "Verify system meets BS 7346-8 requirements",
      "Joint inspection with other maintenance providers",
    ],
  },
  residential_aov: {
    daily: [
      "Visual check of AOV status panel for normal operation indication",
      "Check fire alarm interface is active",
      "Log any faults observed",
    ],
    weekly: [
      "Test AOV operation via break glass or test button",
      "Verify AOV opens and closes correctly",
      "Check for any obstruction around AOV",
      "Verify status panel shows correct operation",
    ],
    monthly: [
      "Inspect AOV for debris, damage, or corrosion",
      "Check weather seals are intact",
      "Test door hold-open devices if fitted",
      "Check backup battery status",
    ],
    quarterly: [
      "Test complete system including all zones",
      "Verify fire alarm interface operates correctly",
      "Check all actuators function correctly",
    ],
    biannual: [
      "Check actuator mechanism and lubricate if required",
      "Verify battery backup provides required standby time",
      "Review logbook entries",
      "Check control panel programming",
    ],
    annual: [
      "Full commissioning check per BS 9991",
      "Verify AOV meets Approved Document B requirements",
      "Check free area of ventilation meets design requirements",
      "Inspect all cables and connections",
      "Replace batteries if over 3 years old",
    ],
  },
  car_park: {
    daily: [
      "Inspect ventilation system status panel for normal operation",
      "Check CO monitoring system is active",
      "Log any faults observed",
    ],
    weekly: [
      "Test impulse/jet fans operate on demand",
      "Check extract fans operate correctly",
      "Verify CO sensors display reasonable readings",
      "Check fire mode override functions",
    ],
    monthly: [
      "Test fire mode activation and response",
      "Check fan speeds and direction indicators",
      "Verify damper operations in fire mode",
      "Simulate power failure and test backup systems",
      "Inspect fan units for debris and damage",
    ],
    quarterly: [
      "Full fire scenario test",
      "Verify smoke clearance meets design requirements",
      "Check CO extraction rates achieve design levels",
      "Test all detection inputs",
    ],
    biannual: [
      "Review system logbook and maintenance records",
      "Calibrate CO sensors",
      "Check all fan bearings and motors",
      "Verify fire/smoke damper operations",
      "Review cause and effect documentation",
    ],
    annual: [
      "Full commissioning check per BS 7346-7",
      "Verify system meets Approved Document B requirements",
      "Conduct CFD validation smoke test if required",
      "Check all cables and electrical installations",
      "Joint inspection with fire alarm maintainers",
    ],
  },
};

const INTERVAL_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "3-Monthly",
  biannual: "6-Monthly",
  annual: "Annual",
};

const CARRIED_OUT_BY: Record<string, string> = {
  daily: "Nominated Person",
  weekly: "Competent Person",
  monthly: "Competent Person",
  quarterly: "Competent Person",
  biannual: "Competent Maintainer",
  annual: "Certified SDI Organisation",
};

export default function VisitTypes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("visit-types");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DbVisitType | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<DbServiceTemplate | null>(null);
  const [selectedVisitType, setSelectedVisitType] = useState<DbVisitType | null>(null);
  const [inspectionIntervals, setInspectionIntervals] = useState<Record<string, boolean>>({
    daily: true, weekly: true, monthly: true, quarterly: true, biannual: true, annual: true
  });

  const userId = user?.id || "anonymous";

  const visitTypeForm = useForm<VisitTypeFormValues>({
    resolver: zodResolver(visitTypeFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      category: "smoke_control",
      regulatoryStandard: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  const templateForm = useForm<ServiceTemplateFormValues>({
    resolver: zodResolver(serviceTemplateFormSchema),
    defaultValues: {
      visitTypeId: "",
      name: "",
      intervalType: "weekly",
      carriedOutBy: "competent_person",
      guidelines: "",
      equipmentRequired: "",
      estimatedDuration: 30,
      regulatoryReference: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  const { data: visitTypes = [], isLoading: loadingVisitTypes } = useQuery<DbVisitType[]>({
    queryKey: ["/api/visit-types", userId],
  });

  const { data: serviceTemplates = [], isLoading: loadingTemplates } = useQuery<DbServiceTemplate[]>({
    queryKey: ["/api/service-templates", userId],
  });

  const createVisitTypeMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/visit-types", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visit-types", userId] });
      toast({ title: "Visit type created successfully" });
      setDialogOpen(false);
      visitTypeForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create visit type", variant: "destructive" });
    },
  });

  const updateVisitTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/visit-types/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visit-types", userId] });
      toast({ title: "Visit type updated successfully" });
      setDialogOpen(false);
      visitTypeForm.reset();
      setEditingItem(null);
    },
    onError: () => {
      toast({ title: "Failed to update visit type", variant: "destructive" });
    },
  });

  const deleteVisitTypeMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/visit-types/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visit-types", userId] });
      toast({ title: "Visit type deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete visit type", variant: "destructive" });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/service-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-templates", userId] });
      toast({ title: "Service template created successfully" });
      setTemplateDialogOpen(false);
      templateForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create service template", variant: "destructive" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/service-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-templates", userId] });
      toast({ title: "Service template updated successfully" });
      setTemplateDialogOpen(false);
      templateForm.reset();
      setEditingTemplate(null);
    },
    onError: () => {
      toast({ title: "Failed to update service template", variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/service-templates/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-templates", userId] });
      toast({ title: "Service template deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete service template", variant: "destructive" });
    },
  });

  const handleEdit = (item: DbVisitType) => {
    setEditingItem(item);
    visitTypeForm.reset({
      name: item.name,
      code: item.code,
      description: item.description || "",
      category: item.category || "smoke_control",
      regulatoryStandard: item.regulatoryStandard || "",
      isActive: item.isActive ?? true,
      sortOrder: item.sortOrder ?? 0,
    });
    setInspectionIntervals(item.inspectionIntervals || {daily: true, weekly: true, monthly: true, quarterly: true, biannual: true, annual: true});
    setDialogOpen(true);
  };

  const handleTemplateEdit = (template: DbServiceTemplate) => {
    setEditingTemplate(template);
    templateForm.reset({
      visitTypeId: template.visitTypeId || "",
      name: template.name,
      intervalType: template.intervalType,
      carriedOutBy: template.carriedOutBy || "competent_person",
      guidelines: template.guidelines || "",
      equipmentRequired: template.equipmentRequired || "",
      estimatedDuration: template.estimatedDuration || 30,
      regulatoryReference: template.regulatoryReference || "",
      isActive: template.isActive ?? true,
      sortOrder: template.sortOrder ?? 0,
    });
    setTemplateDialogOpen(true);
  };

  const onVisitTypeSubmit = (values: VisitTypeFormValues) => {
    const data = { ...values, userId, inspectionIntervals };
    if (editingItem) {
      updateVisitTypeMutation.mutate({ id: editingItem.id, data });
    } else {
      createVisitTypeMutation.mutate(data);
    }
  };

  const onTemplateSubmit = (values: ServiceTemplateFormValues) => {
    const data = { ...values, userId, checklistItems: [] };
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleAddDefaultTypes = () => {
    DEFAULT_VISIT_TYPES.forEach((type) => {
      createVisitTypeMutation.mutate({ ...type, userId, isActive: true, sortOrder: 0 });
    });
  };

  const handleGenerateTemplates = (visitType: DbVisitType) => {
    const scaChecklist = SCA_CHECKLIST_ITEMS[visitType.code];
    if (!scaChecklist) {
      toast({ title: "No SCA checklist found for this visit type", variant: "destructive" });
      return;
    }

    const intervals = ["daily", "weekly", "monthly", "quarterly", "biannual", "annual"] as const;
    
    intervals.forEach((interval) => {
      const items = scaChecklist[interval];
      if (items && items.length > 0) {
        const checklistItems = items.map((item, idx) => ({
          id: `${interval}-${idx}`,
          item,
          category: "sca_guidance",
          isMandatory: true,
        }));

        createTemplateMutation.mutate({
          userId,
          visitTypeId: visitType.id,
          name: `${visitType.name} - ${INTERVAL_LABELS[interval]} Inspection`,
          intervalType: interval,
          carriedOutBy: CARRIED_OUT_BY[interval] === "Nominated Person" ? "nominated_person" 
            : CARRIED_OUT_BY[interval] === "Competent Person" ? "competent_person"
            : CARRIED_OUT_BY[interval] === "Competent Maintainer" ? "competent_maintainer"
            : "certified_organisation",
          checklistItems,
          guidelines: `Per SCA Guidance on Maintenance of Smoke Control Equipment`,
          regulatoryReference: visitType.regulatoryStandard,
          isActive: true,
          sortOrder: intervals.indexOf(interval),
        });
      }
    });

    toast({ title: "Service templates generated from SCA guidance" });
  };

  const openNewVisitTypeDialog = () => {
    setEditingItem(null);
    visitTypeForm.reset({
      name: "",
      code: "",
      description: "",
      category: "smoke_control",
      regulatoryStandard: "",
      isActive: true,
      sortOrder: 0,
    });
    setInspectionIntervals({daily: true, weekly: true, monthly: true, quarterly: true, biannual: true, annual: true});
    setDialogOpen(true);
  };

  const openNewTemplateDialog = () => {
    setEditingTemplate(null);
    templateForm.reset({
      visitTypeId: "",
      name: "",
      intervalType: "weekly",
      carriedOutBy: "competent_person",
      guidelines: "",
      equipmentRequired: "",
      estimatedDuration: 30,
      regulatoryReference: "",
      isActive: true,
      sortOrder: 0,
    });
    setTemplateDialogOpen(true);
  };

  const templatesForSelectedType = selectedVisitType 
    ? serviceTemplates.filter(t => t.visitTypeId === selectedVisitType.id)
    : serviceTemplates;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <ClipboardList className="h-6 w-6" />
            Visit Types & Service Templates
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Configure smoke control system types and their inspection templates based on SCA guidance
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList data-testid="tabs-main">
          <TabsTrigger value="visit-types" data-testid="tab-visit-types">Visit Types</TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">Service Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="visit-types" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewVisitTypeDialog} data-testid="button-add-visit-type">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Visit Type
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle data-testid="text-dialog-title">{editingItem ? "Edit Visit Type" : "Add Visit Type"}</DialogTitle>
                  <DialogDescription data-testid="text-dialog-description">
                    Configure a smoke control system type for scheduling visits
                  </DialogDescription>
                </DialogHeader>
                <Form {...visitTypeForm}>
                  <form onSubmit={visitTypeForm.handleSubmit(onVisitTypeSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={visitTypeForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="NSHEV (Natural Smoke & Heat Exhaust)" data-testid="input-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={visitTypeForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="nshev" data-testid="input-code" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={visitTypeForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Description of the system type..." data-testid="input-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={visitTypeForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-category">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="smoke_control">Smoke Control</SelectItem>
                                <SelectItem value="ventilation">Ventilation</SelectItem>
                                <SelectItem value="fire_safety">Fire Safety</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={visitTypeForm.control}
                        name="regulatoryStandard"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Regulatory Standard</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="BS EN 12101-6" data-testid="input-regulatory-standard" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <FormLabel>Inspection Intervals</FormLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(INTERVAL_LABELS).map(([key, label]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              checked={inspectionIntervals[key]}
                              onCheckedChange={(checked) => setInspectionIntervals({
                                ...inspectionIntervals, [key]: !!checked
                              })}
                              data-testid={`checkbox-interval-${key}`}
                            />
                            <span className="text-sm">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createVisitTypeMutation.isPending || updateVisitTypeMutation.isPending}
                        data-testid="button-save"
                      >
                        {editingItem ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {visitTypes.length === 0 && (
              <Button variant="outline" onClick={handleAddDefaultTypes} data-testid="button-add-defaults">
                <AlertCircle className="h-4 w-4 mr-2" />
                Add Default System Types
              </Button>
            )}
          </div>

          {loadingVisitTypes ? (
            <div className="text-center py-8" data-testid="text-loading">Loading visit types...</div>
          ) : visitTypes.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium" data-testid="text-empty-title">No visit types configured</h3>
                <p className="text-muted-foreground mb-4" data-testid="text-empty-description">
                  Add default system types based on SCA guidance or create custom ones
                </p>
                <Button onClick={handleAddDefaultTypes} data-testid="button-add-defaults-empty">
                  Add Default System Types
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visitTypes.map((type) => (
                <Card key={type.id} data-testid={`card-visit-type-${type.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg" data-testid={`text-visit-type-name-${type.id}`}>{type.name}</CardTitle>
                      <Badge variant={type.isActive ? "default" : "secondary"} data-testid={`badge-status-${type.id}`}>
                        {type.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription data-testid={`text-visit-type-code-${type.id}`}>{type.code}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-visit-type-description-${type.id}`}>
                      {type.description}
                    </p>
                    {type.regulatoryStandard && (
                      <div className="flex items-center gap-1 text-xs" data-testid={`text-regulatory-${type.id}`}>
                        <FileText className="h-3 w-3" />
                        <span>{type.regulatoryStandard}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(type.inspectionIntervals || {}).filter(([_, v]) => v).map(([key]) => (
                        <Badge key={key} variant="outline" className="text-xs" data-testid={`badge-interval-${type.id}-${key}`}>
                          {INTERVAL_LABELS[key]}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(type)} data-testid={`button-edit-${type.id}`}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleGenerateTemplates(type)}
                        data-testid={`button-generate-templates-${type.id}`}
                      >
                        <ClipboardList className="h-3 w-3 mr-1" />
                        Generate Templates
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => deleteVisitTypeMutation.mutate(type.id)}
                        data-testid={`button-delete-${type.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select 
              value={selectedVisitType?.id || "all"} 
              onValueChange={(v) => setSelectedVisitType(v === "all" ? null : visitTypes.find(t => t.id === v) || null)}
            >
              <SelectTrigger className="w-[250px]" data-testid="select-filter-visit-type">
                <SelectValue placeholder="Filter by visit type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visit Types</SelectItem>
                {visitTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewTemplateDialog} data-testid="button-add-template">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle data-testid="text-template-dialog-title">{editingTemplate ? "Edit Service Template" : "Add Service Template"}</DialogTitle>
                  <DialogDescription data-testid="text-template-dialog-description">
                    Create an inspection checklist template for a specific visit type and interval
                  </DialogDescription>
                </DialogHeader>
                <Form {...templateForm}>
                  <form onSubmit={templateForm.handleSubmit(onTemplateSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={templateForm.control}
                        name="visitTypeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Visit Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-template-visit-type">
                                  <SelectValue placeholder="Select visit type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {visitTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={templateForm.control}
                        name="intervalType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Interval</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-template-interval">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(INTERVAL_LABELS).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={templateForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="MSHEV - Weekly Inspection" data-testid="input-template-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={templateForm.control}
                        name="carriedOutBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Carried Out By</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-carried-out-by">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="nominated_person">Nominated Person</SelectItem>
                                <SelectItem value="competent_person">Competent Person</SelectItem>
                                <SelectItem value="competent_maintainer">Competent Maintainer</SelectItem>
                                <SelectItem value="certified_organisation">Certified SDI Organisation</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={templateForm.control}
                        name="estimatedDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated Duration (mins)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                                data-testid="input-estimated-duration" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={templateForm.control}
                      name="guidelines"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guidelines</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Additional guidelines for this inspection..." data-testid="input-guidelines" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={templateForm.control}
                      name="equipmentRequired"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipment Required</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Anemometer, multimeter, etc." data-testid="input-equipment-required" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setTemplateDialogOpen(false)} data-testid="button-template-cancel">
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                        data-testid="button-template-save"
                      >
                        {editingTemplate ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {loadingTemplates ? (
            <div className="text-center py-8" data-testid="text-loading-templates">Loading templates...</div>
          ) : templatesForSelectedType.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium" data-testid="text-no-templates">No service templates</h3>
                <p className="text-muted-foreground" data-testid="text-no-templates-description">
                  Generate templates from SCA guidance or create custom ones
                </p>
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Visit Type</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Carried Out By</TableHead>
                  <TableHead>Checklist Items</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templatesForSelectedType.map((template) => {
                  const visitType = visitTypes.find(t => t.id === template.visitTypeId);
                  return (
                    <TableRow key={template.id} data-testid={`row-template-${template.id}`}>
                      <TableCell className="font-medium" data-testid={`text-template-name-${template.id}`}>{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" data-testid={`badge-template-type-${template.id}`}>{visitType?.code || "Unknown"}</Badge>
                      </TableCell>
                      <TableCell data-testid={`text-template-interval-${template.id}`}>{INTERVAL_LABELS[template.intervalType] || template.intervalType}</TableCell>
                      <TableCell className="text-sm" data-testid={`text-carried-out-by-${template.id}`}>{template.carriedOutBy?.replace(/_/g, " ")}</TableCell>
                      <TableCell>
                        <Badge data-testid={`badge-checklist-count-${template.id}`}>{template.checklistItems?.length || 0} items</Badge>
                      </TableCell>
                      <TableCell data-testid={`text-duration-${template.id}`}>{template.estimatedDuration} mins</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleTemplateEdit(template)} data-testid={`button-edit-template-${template.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteTemplateMutation.mutate(template.id)} data-testid={`button-delete-template-${template.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
