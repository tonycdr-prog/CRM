import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, FileText, Copy, CheckCircle, Sparkles, Download } from "lucide-react";

interface DocumentTemplate {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  templateType: string | null;
  category: string | null;
  content: string;
  placeholders: string[] | null;
  headerText: string | null;
  footerText: string | null;
  termsAndConditions: string | null;
  isDefault: boolean | null;
  isActive: boolean | null;
  version: number | null;
  lastUsedDate: string | null;
  usageCount: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const defaultFormData = {
  name: "",
  description: "",
  templateType: "quote",
  category: "general",
  content: "",
  headerText: "",
  footerText: "",
  termsAndConditions: "",
  isDefault: false,
  isActive: true,
  notes: "",
};

// Pre-built starter templates
const STARTER_TEMPLATES = [
  {
    name: "Cover Letter - Site Survey",
    description: "Professional cover letter for site survey documentation",
    templateType: "letter",
    category: "smoke_control",
    content: `Dear {{client_name}},

Re: Smoke Control System Survey - {{site_address}}

Thank you for instructing us to carry out a survey of the smoke control system at the above address.

Please find enclosed our survey report dated {{survey_date}}, which details our findings and recommendations.

If you have any questions regarding this report, please do not hesitate to contact us.

Yours sincerely,

{{engineer_name}}
{{company_name}}`,
    headerText: "{{company_name}} | {{company_address}} | Tel: {{company_phone}}",
    footerText: "Company Registration: {{company_reg}} | VAT: {{vat_number}}",
  },
  {
    name: "Project Quote - Smoke Control",
    description: "Standard quote template for smoke control projects",
    templateType: "quote",
    category: "smoke_control",
    content: `QUOTATION

To: {{client_name}}
Address: {{client_address}}
Date: {{quote_date}}
Quote Ref: {{quote_ref}}
Valid Until: {{valid_until}}

RE: {{project_title}} - {{site_address}}

Following our site survey, we are pleased to submit our quotation for the works detailed below:

SCOPE OF WORKS:
{{scope_of_works}}

PRICE:
Labour and Materials: £{{price_exc_vat}}
VAT (20%): £{{vat_amount}}
TOTAL: £{{total_price}}

PAYMENT TERMS:
{{payment_terms}}

PROGRAMME:
Works can commence within {{lead_time}} of order confirmation.
Estimated duration: {{duration}}

We trust this quotation meets with your approval and look forward to receiving your instructions.`,
    termsAndConditions: `1. This quotation is valid for 30 days from the date shown.
2. Payment terms: 30 days from invoice date.
3. All works carried out in accordance with BS EN 12101 and relevant regulations.
4. Price excludes any remedial works not detailed in the scope.
5. Access to be provided by the client during normal working hours.`,
  },
  {
    name: "Survey Report - Smoke Control",
    description: "Comprehensive survey report template for smoke control systems",
    templateType: "report",
    category: "smoke_control",
    content: `SMOKE CONTROL SYSTEM SURVEY REPORT

Client: {{client_name}}
Site Address: {{site_address}}
Survey Date: {{survey_date}}
Engineer: {{engineer_name}}
Report Ref: {{report_ref}}

1. INTRODUCTION
This report details the findings of our survey of the smoke control system at the above address, carried out on {{survey_date}}.

2. SYSTEM DESCRIPTION
System Type: {{system_type}}
Manufacturer: {{manufacturer}}
Age of System: {{system_age}}
Number of Dampers: {{damper_count}}
Control Panel Location: {{panel_location}}

3. SURVEY FINDINGS
{{survey_findings}}

4. COMPLIANCE STATUS
Current Compliance: {{compliance_status}}
Testing Standard: BS EN 12101-8 / BSRIA BG 49/2024

5. RECOMMENDATIONS
{{recommendations}}

6. PRIORITY ACTIONS
{{priority_actions}}

7. CONCLUSION
{{conclusion}}

Report prepared by: {{engineer_name}}
Qualifications: {{engineer_qualifications}}
Date: {{report_date}}`,
    headerText: "SMOKE CONTROL SURVEY REPORT | {{company_name}}",
    footerText: "This report is confidential and intended for the named recipient only.",
  },
  {
    name: "Service Certificate",
    description: "Completion certificate for smoke control servicing",
    templateType: "certificate",
    category: "smoke_control",
    content: `SERVICE COMPLETION CERTIFICATE

Certificate No: {{certificate_number}}
Date of Issue: {{issue_date}}

This is to certify that:

Site: {{site_address}}
Client: {{client_name}}
System Type: {{system_type}}

Has been serviced and tested in accordance with:
- BS EN 12101-8:2011
- BSRIA BG 49/2024
- Regulatory Reform (Fire Safety) Order 2005

SERVICE DETAILS:
Date of Service: {{service_date}}
Type of Service: {{service_type}}
Job Reference: {{job_reference}}

SYSTEM STATUS:
Overall Condition: {{system_condition}}
Operational Status: {{operational_status}}

TEST RESULTS:
{{test_results}}

ENGINEER DECLARATION:
I confirm that the above system has been inspected and tested, and at the time of this certificate was found to be in {{condition_statement}} condition.

Engineer Name: {{engineer_name}}
Signature: ___________________
Date: {{signature_date}}

Next Service Due: {{next_service_date}}`,
    headerText: "{{company_name}} - SERVICE CERTIFICATE",
    footerText: "Retain this certificate for your records. Next service due: {{next_service_date}}",
  },
  {
    name: "Cover Letter - Annual Service",
    description: "Cover letter for annual maintenance service visits",
    templateType: "letter",
    category: "maintenance",
    content: `Dear {{client_name}},

Re: Annual Smoke Control System Service - {{site_address}}

We are writing to confirm that the annual service of your smoke control system has been completed.

Service Date: {{service_date}}
Engineer: {{engineer_name}}
Job Reference: {{job_reference}}

Please find enclosed:
- Service Completion Certificate
- Test Results Summary
- Recommendations Report (if applicable)

System Status: {{system_status}}

{{additional_comments}}

If you have any questions or require further information, please do not hesitate to contact our office.

Yours sincerely,

{{signatory_name}}
{{company_name}}`,
    headerText: "{{company_name}}",
    footerText: "For queries: {{company_phone}} | {{company_email}}",
  },
];

export default function DocumentTemplatesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const { toast } = useToast();

  const userId = "demo-user";

  const { data: templates = [], isLoading } = useQuery<DocumentTemplate[]>({
    queryKey: ["/api/document-templates", userId],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/document-templates", { ...data, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/document-templates", userId] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Template created successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData & { id: string }) => apiRequest("PATCH", `/api/document-templates/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/document-templates", userId] });
      setIsDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
      toast({ title: "Template updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/document-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/document-templates", userId] });
      toast({ title: "Template deleted successfully" });
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingTemplate(null);
  };

  const useStarterTemplate = (template: typeof STARTER_TEMPLATES[0]) => {
    setFormData({
      name: template.name,
      description: template.description || "",
      templateType: template.templateType,
      category: template.category,
      content: template.content,
      headerText: template.headerText || "",
      footerText: template.footerText || "",
      termsAndConditions: template.termsAndConditions || "",
      isDefault: false,
      isActive: true,
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name || "",
      description: template.description || "",
      templateType: template.templateType || "quote",
      category: template.category || "general",
      content: template.content || "",
      headerText: template.headerText || "",
      footerText: template.footerText || "",
      termsAndConditions: template.termsAndConditions || "",
      isDefault: template.isDefault || false,
      isActive: template.isActive !== false,
      notes: template.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.content) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    if (editingTemplate) {
      updateMutation.mutate({ ...formData, id: editingTemplate.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getTypeColor = (type: string | null) => {
    switch (type) {
      case "quote": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "invoice": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "contract": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "report": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "letter": return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      case "certificate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return <div className="p-6" data-testid="loading-templates">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6" data-testid="document-templates-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title">Document Templates</h1>
          <p className="text-muted-foreground">Reusable templates for quotes, contracts, and reports</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-template">
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">{editingTemplate ? "Edit Template" : "Add Template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Template Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter template name"
                    data-testid="input-name"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={formData.templateType} onValueChange={(v) => setFormData({ ...formData, templateType: v })}>
                    <SelectTrigger data-testid="select-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quote">Quote</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="smoke_control">Smoke Control</SelectItem>
                      <SelectItem value="fire_safety">Fire Safety</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.isDefault}
                      onCheckedChange={(v) => setFormData({ ...formData, isDefault: v })}
                      data-testid="switch-default"
                    />
                    <Label>Default</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
                      data-testid="switch-active"
                    />
                    <Label>Active</Label>
                  </div>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Template description"
                  data-testid="input-description"
                />
              </div>
              <div>
                <Label>Content *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Template content with placeholders like {{client_name}}, {{date}}, etc."
                  rows={6}
                  data-testid="input-content"
                />
              </div>
              <div>
                <Label>Header Text</Label>
                <Textarea
                  value={formData.headerText}
                  onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                  placeholder="Header text for documents"
                  rows={2}
                  data-testid="input-header"
                />
              </div>
              <div>
                <Label>Footer Text</Label>
                <Textarea
                  value={formData.footerText}
                  onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                  placeholder="Footer text for documents"
                  rows={2}
                  data-testid="input-footer"
                />
              </div>
              <div>
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={formData.termsAndConditions}
                  onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                  placeholder="Standard terms and conditions"
                  rows={3}
                  data-testid="input-terms"
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Internal notes"
                  data-testid="input-notes"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {editingTemplate ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Starter Templates Section */}
      <Card data-testid="card-starter-templates">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Starter Templates
          </CardTitle>
          <p className="text-sm text-muted-foreground">Pre-built templates for common smoke control documents</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {STARTER_TEMPLATES.map((template, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => useStarterTemplate(template)}
                data-testid={`button-starter-${index}`}
              >
                <Download className="h-3 w-3 mr-1" />
                {template.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {templates.length === 0 ? (
        <Card data-testid="empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No document templates yet. Use a starter template or create your own.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} data-testid={`card-template-${template.id}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate" data-testid={`text-name-${template.id}`}>{template.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge className={getTypeColor(template.templateType)} data-testid={`badge-type-${template.id}`}>
                        {template.templateType}
                      </Badge>
                      {template.isDefault && (
                        <Badge variant="outline" className="text-xs" data-testid={`badge-default-${template.id}`}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Default
                        </Badge>
                      )}
                      {!template.isActive && (
                        <Badge variant="secondary" data-testid={`badge-inactive-${template.id}`}>Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(template)} data-testid={`button-edit-${template.id}`}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(template.id)} data-testid={`button-delete-${template.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2" data-testid={`text-description-${template.id}`}>
                    {template.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span data-testid={`text-category-${template.id}`}>{template.category}</span>
                  <div className="flex items-center gap-1">
                    <Copy className="w-3 h-3" />
                    <span data-testid={`text-usage-${template.id}`}>{template.usageCount || 0} uses</span>
                  </div>
                </div>
                {template.version && template.version > 1 && (
                  <p className="text-xs text-muted-foreground mt-1" data-testid={`text-version-${template.id}`}>
                    Version {template.version}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}