import { Report } from "@shared/schema";

interface PDFStandardsPageProps {
  report: Partial<Report>;
  minVelocityThreshold: number;
}

export default function PDFStandardsPage({ report, minVelocityThreshold }: PDFStandardsPageProps) {
  return (
    <div className="w-[210mm] h-[297mm] bg-white p-[20mm] flex flex-col">
      {/* Page Title */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Testing Standards & Scope</h2>
        <div className="h-1 w-24 bg-primary" />
      </div>

      <div className="space-y-8 flex-1">
        {/* Applicable Standards */}
        <section>
          <h3 className="text-xl font-semibold mb-4 text-foreground">Applicable Standards</h3>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="font-semibold min-w-[140px]">BS EN 12101-8:2020</span>
              <span className="text-muted-foreground">
                Smoke and heat control systems - Part 8: Specification for smoke control dampers
              </span>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold min-w-[140px]">BSRIA BG 49/2024</span>
              <span className="text-muted-foreground">
                Guidance on the commissioning of smoke control systems in buildings
              </span>
            </div>
            {report.testingStandards && report.testingStandards !== "BS EN 12101-8:2020, BSRIA BG 49/2024" && (
              <div className="flex gap-3">
                <span className="font-semibold min-w-[140px]">Additional:</span>
                <span className="text-muted-foreground">{report.testingStandards}</span>
              </div>
            )}
          </div>
        </section>

        {/* Scope of Works */}
        {report.systemDescription && (
          <section>
            <h3 className="text-xl font-semibold mb-4 text-foreground">Scope of Works</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {report.systemDescription}
            </p>
          </section>
        )}

        {/* Test Objectives */}
        {report.testObjectives && (
          <section>
            <h3 className="text-xl font-semibold mb-4 text-foreground">Test Objectives</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {report.testObjectives}
            </p>
          </section>
        )}

        {/* Testing Methodology */}
        <section>
          <h3 className="text-xl font-semibold mb-4 text-foreground">Testing Methodology</h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Grid Size Requirements</h4>
              <p className="text-muted-foreground leading-relaxed mb-2">
                The number of measurement points is determined by the damper size in accordance with UK regulations:
              </p>
              <ul className="space-y-1 text-muted-foreground ml-6">
                <li>• Dampers ≤ 610mm (24"): 5×5 grid = 25 measurement points</li>
                <li>• Dampers 610-914mm (24-36"): 6×6 grid = 36 measurement points</li>
                <li>• Dampers &gt; 914mm (36"): 7×7 grid = 49 measurement points</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Measurement Procedure</h4>
              <ul className="space-y-1 text-muted-foreground ml-6">
                <li>• Measurements taken at each grid point using calibrated anemometer</li>
                <li>• Damper positioned in fully open position for smoke control mode</li>
                <li>• Readings recorded in metres per second (m/s)</li>
                <li>• Average velocity calculated across all measurement points</li>
                <li>• Visual inspection performed for obstructions and condition</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Pass/Fail Criteria</h4>
              <div className="bg-muted/30 p-4 rounded-md border border-muted">
                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-semibold">Minimum Velocity Threshold:</span> {minVelocityThreshold.toFixed(2)} m/s
                </p>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  Each damper must achieve an average airflow velocity equal to or exceeding the minimum threshold 
                  to be considered as passing the performance test. Results below this threshold indicate potential 
                  issues requiring remedial action.
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Documentation</h4>
              <ul className="space-y-1 text-muted-foreground ml-6">
                <li>• Photographic evidence captured for each damper (open and closed positions)</li>
                <li>• Grid measurement diagrams with individual point readings</li>
                <li>• Pass/fail status recorded for each test</li>
                <li>• Notes on condition and any observed defects</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Report Type Information */}
        {report.reportType && (
          <section>
            <h3 className="text-xl font-semibold mb-4 text-foreground">Report Type</h3>
            <p className="text-sm text-muted-foreground">
              {report.reportType === "commissioning" && "Initial Commissioning Test - First-time verification of system performance"}
              {report.reportType === "annual_inspection" && "Annual Inspection - Regular maintenance verification"}
              {report.reportType === "remedial_works" && "Remedial Works Verification - Post-repair testing"}
              {report.reportType === "final_verification" && "Final Verification - Project completion certification"}
            </p>
            {report.isRepeatVisit && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                This is a repeat visit with comparative analysis to previous year's results.
              </p>
            )}
          </section>
        )}
      </div>

      {/* Footer - page numbers added by PDF generation */}
      <div className="text-center text-xs text-muted-foreground border-t pt-3 mt-auto">
      </div>
    </div>
  );
}
