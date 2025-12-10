import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Report } from "@shared/schema";
import { ImageUpload } from "./ImageUpload";

interface ReportSettingsSectionProps {
  report: Partial<Report>;
  onUpdate: (updates: Partial<Report>) => void;
  defaultOpen?: boolean;
  variant?: 'damper' | 'stairwell';
}

export default function ReportSettingsSection({ 
  report, 
  onUpdate, 
  defaultOpen = true,
  variant = 'damper'
}: ReportSettingsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleChange = (field: keyof Report, value: any) => {
    onUpdate({ [field]: value });
  };

  const defaultTestingStandards = variant === 'stairwell' 
    ? "BS EN 12101-6, BS 5588-4, BS 9999, BS 9991"
    : "BS EN 12101-8:2020, BSRIA BG 49/2024";

  const defaultReportTitle = variant === 'stairwell'
    ? "Stairwell Differential Pressure Testing Report"
    : "Smoke Control Damper Testing Report";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover-elevate">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Settings
              </div>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Project Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Project Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectName" data-testid="label-projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    data-testid="input-projectName"
                    value={report.projectName || ""}
                    onChange={(e) => handleChange("projectName", e.target.value)}
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <Label htmlFor="projectNumber" data-testid="label-projectNumber">Project Number</Label>
                  <Input
                    id="projectNumber"
                    data-testid="input-projectNumber"
                    value={report.projectNumber || ""}
                    onChange={(e) => handleChange("projectNumber", e.target.value)}
                    placeholder="e.g., PRJ-2024-001"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="siteAddress" data-testid="label-siteAddress">Site Address *</Label>
                <Textarea
                  id="siteAddress"
                  data-testid="input-siteAddress"
                  value={report.siteAddress || ""}
                  onChange={(e) => handleChange("siteAddress", e.target.value)}
                  placeholder="Enter full site address"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sitePostcode" data-testid="label-sitePostcode">Postcode</Label>
                  <Input
                    id="sitePostcode"
                    data-testid="input-sitePostcode"
                    value={report.sitePostcode || ""}
                    onChange={(e) => handleChange("sitePostcode", e.target.value)}
                    placeholder="e.g., SW1A 1AA"
                  />
                </div>
                <div>
                  <Label htmlFor="clientName" data-testid="label-clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    data-testid="input-clientName"
                    value={report.clientName || ""}
                    onChange={(e) => handleChange("clientName", e.target.value)}
                    placeholder="Enter client name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mainContractor" data-testid="label-mainContractor">Main Contractor</Label>
                  <Input
                    id="mainContractor"
                    data-testid="input-mainContractor"
                    value={report.mainContractor || ""}
                    onChange={(e) => handleChange("mainContractor", e.target.value)}
                    placeholder="Enter contractor name"
                  />
                </div>
                <div>
                  <Label htmlFor="reportDate" data-testid="label-reportDate">Report Date *</Label>
                  <Input
                    id="reportDate"
                    data-testid="input-reportDate"
                    type="date"
                    value={report.reportDate || ""}
                    onChange={(e) => handleChange("reportDate", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="commissioningDate" data-testid="label-commissioningDate">Commissioning Date</Label>
                <Input
                  id="commissioningDate"
                  data-testid="input-commissioningDate"
                  type="date"
                  value={report.commissioningDate || ""}
                  onChange={(e) => handleChange("commissioningDate", e.target.value)}
                />
              </div>
            </div>

            {/* Scope of Works */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Scope of Works</h3>
              <div>
                <Label htmlFor="systemDescription" data-testid="label-systemDescription">System Description *</Label>
                <Textarea
                  id="systemDescription"
                  data-testid="input-systemDescription"
                  value={report.systemDescription || ""}
                  onChange={(e) => handleChange("systemDescription", e.target.value)}
                  placeholder="Describe the smoke control system being tested..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="testingStandards" data-testid="label-testingStandards">Testing Standards *</Label>
                <Input
                  id="testingStandards"
                  data-testid="input-testingStandards"
                  value={report.testingStandards || defaultTestingStandards}
                  onChange={(e) => handleChange("testingStandards", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="testObjectives" data-testid="label-testObjectives">Test Objectives</Label>
                <Textarea
                  id="testObjectives"
                  data-testid="input-testObjectives"
                  value={report.testObjectives || ""}
                  onChange={(e) => handleChange("testObjectives", e.target.value)}
                  placeholder="e.g., Verify system performance meets design specification..."
                  rows={2}
                />
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Company & Tester Information</h3>
              <div>
                <Label htmlFor="companyName" data-testid="label-companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  data-testid="input-companyName"
                  value={report.companyName || ""}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <Label data-testid="label-companyLogo">Company Logo</Label>
                <ImageUpload
                  value={report.companyLogo}
                  onChange={(imageData: string | undefined) => handleChange("companyLogo", imageData)}
                  label="Upload Logo"
                  testId="companyLogo"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testerCertification" data-testid="label-testerCertification">Tester Certification</Label>
                  <Input
                    id="testerCertification"
                    data-testid="input-testerCertification"
                    value={report.testerCertification || ""}
                    onChange={(e) => handleChange("testerCertification", e.target.value)}
                    placeholder="e.g., BAFE SP203-1"
                  />
                </div>
                <div>
                  <Label htmlFor="supervisorName" data-testid="label-supervisorName">Supervisor Name</Label>
                  <Input
                    id="supervisorName"
                    data-testid="input-supervisorName"
                    value={report.supervisorName || ""}
                    onChange={(e) => handleChange("supervisorName", e.target.value)}
                    placeholder="Enter supervisor name"
                  />
                </div>
              </div>
            </div>

            {/* Report Settings */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Report Options</h3>
              <div>
                <Label htmlFor="reportTitle" data-testid="label-reportTitle">Report Title *</Label>
                <Input
                  id="reportTitle"
                  data-testid="input-reportTitle"
                  value={report.reportTitle || defaultReportTitle}
                  onChange={(e) => handleChange("reportTitle", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="reportType" data-testid="label-reportType">Report Type *</Label>
                <Select 
                  value={report.reportType || "commissioning"}
                  onValueChange={(value) => handleChange("reportType", value)}
                >
                  <SelectTrigger id="reportType" data-testid="select-reportType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commissioning" data-testid="option-commissioning">Initial Commissioning</SelectItem>
                    <SelectItem value="annual_inspection" data-testid="option-annual">Annual Inspection</SelectItem>
                    <SelectItem value="remedial_works" data-testid="option-remedial">Remedial Works</SelectItem>
                    <SelectItem value="final_verification" data-testid="option-final">Final Verification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRepeatVisit"
                  data-testid="checkbox-isRepeatVisit"
                  checked={report.isRepeatVisit || false}
                  onCheckedChange={(checked) => handleChange("isRepeatVisit", checked)}
                />
                <Label htmlFor="isRepeatVisit" className="font-normal">
                  This is a repeat visit (enables trend analysis)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeExecutiveSummary"
                  data-testid="checkbox-includeExecutiveSummary"
                  checked={report.includeExecutiveSummary !== false}
                  onCheckedChange={(checked) => handleChange("includeExecutiveSummary", checked)}
                />
                <Label htmlFor="includeExecutiveSummary" className="font-normal">
                  Include executive summary in PDF
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePassFailSummary"
                  data-testid="checkbox-includePassFailSummary"
                  checked={report.includePassFailSummary !== false}
                  onCheckedChange={(checked) => handleChange("includePassFailSummary", checked)}
                />
                <Label htmlFor="includePassFailSummary" className="font-normal">
                  Include pass/fail summary table
                </Label>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
