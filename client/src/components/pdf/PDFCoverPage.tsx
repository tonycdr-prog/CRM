import { Report } from "@shared/schema";

interface PDFCoverPageProps {
  report: Partial<Report>;
  testDateRange?: {
    earliest: string;
    latest: string;
  };
}

export default function PDFCoverPage({ report, testDateRange }: PDFCoverPageProps) {
  return (
    <div className="w-[210mm] h-[297mm] bg-white p-[20mm] flex flex-col justify-between">
      {/* Header with Logo */}
      <div className="space-y-8">
        {report.companyLogo && (
          <div className="flex justify-center">
            <img 
              src={report.companyLogo} 
              alt="Company Logo" 
              className="max-h-[40mm] max-w-[80mm] object-contain"
            />
          </div>
        )}
        
        {/* Report Title */}
        <div className="text-center space-y-4 pt-8">
          <h1 className="text-4xl font-bold text-foreground">
            {report.reportTitle || "Smoke Control Damper Testing Report"}
          </h1>
          <div className="h-1 w-32 bg-primary mx-auto" />
        </div>
      </div>

      {/* Project Details */}
      <div className="space-y-6">
        <div className="border-t-2 border-b-2 border-muted py-6 space-y-3">
          {report.projectName && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="font-semibold text-muted-foreground">Project:</span>
              <span className="font-medium">{report.projectName}</span>
            </div>
          )}
          
          {report.projectNumber && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="font-semibold text-muted-foreground">Project Number:</span>
              <span className="font-medium">{report.projectNumber}</span>
            </div>
          )}
          
          {report.siteAddress && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="font-semibold text-muted-foreground">Site Address:</span>
              <span className="font-medium">{report.siteAddress}</span>
            </div>
          )}
          
          {report.sitePostcode && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="font-semibold text-muted-foreground">Postcode:</span>
              <span className="font-medium">{report.sitePostcode}</span>
            </div>
          )}
          
          {report.clientName && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="font-semibold text-muted-foreground">Client:</span>
              <span className="font-medium">{report.clientName}</span>
            </div>
          )}
          
          {report.mainContractor && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="font-semibold text-muted-foreground">Main Contractor:</span>
              <span className="font-medium">{report.mainContractor}</span>
            </div>
          )}
        </div>

        {/* Testing Information */}
        <div className="border-b-2 border-muted pb-6 space-y-3">
          {report.reportDate && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="font-semibold text-muted-foreground">Report Date:</span>
              <span className="font-medium">{new Date(report.reportDate).toLocaleDateString('en-GB')}</span>
            </div>
          )}
          
          {testDateRange && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="font-semibold text-muted-foreground">Test Period:</span>
              <span className="font-medium">
                {new Date(testDateRange.earliest).toLocaleDateString('en-GB')} to {new Date(testDateRange.latest).toLocaleDateString('en-GB')}
              </span>
            </div>
          )}
          
          {report.commissioningDate && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="font-semibold text-muted-foreground">Commissioning Date:</span>
              <span className="font-medium">{new Date(report.commissioningDate).toLocaleDateString('en-GB')}</span>
            </div>
          )}
          
          {report.testingStandards && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="font-semibold text-muted-foreground">Standards:</span>
              <span className="font-medium">{report.testingStandards}</span>
            </div>
          )}
        </div>

        {/* Company Information */}
        <div className="space-y-3">
          {report.companyName && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="font-semibold text-muted-foreground">Testing Company:</span>
              <span className="font-medium">{report.companyName}</span>
            </div>
          )}
          
          {report.supervisorName && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="font-semibold text-muted-foreground">Supervisor:</span>
              <span className="font-medium">{report.supervisorName}</span>
            </div>
          )}
          
          {report.testerCertification && (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <span className="font-semibold text-muted-foreground">Certification:</span>
              <span className="font-medium">{report.testerCertification}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground border-t pt-4">
        <p>This report has been prepared in accordance with UK building regulations and testing standards</p>
      </div>
    </div>
  );
}
