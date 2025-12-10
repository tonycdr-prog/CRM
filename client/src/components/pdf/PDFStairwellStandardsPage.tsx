import { Report, PRESSURE_COMPLIANCE } from "@shared/schema";

interface PDFStairwellStandardsPageProps {
  report: Partial<Report>;
}

export default function PDFStairwellStandardsPage({ report }: PDFStairwellStandardsPageProps) {
  return (
    <div className="w-[210mm] h-[297mm] bg-white p-[20mm] flex flex-col">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Testing Standards & Methodology</h2>
        <div className="h-1 w-24 bg-primary" />
      </div>

      <div className="space-y-6 flex-1">
        <section>
          <h3 className="text-xl font-semibold mb-4 text-foreground">Applicable Standards</h3>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="font-semibold min-w-[140px]">BS EN 12101-6:2005</span>
              <span className="text-muted-foreground">
                Smoke and heat control systems - Specification for pressure differential systems
              </span>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold min-w-[140px]">BS 5588-4:1998</span>
              <span className="text-muted-foreground">
                Fire precautions in the design, construction and use of buildings - Code of practice for smoke control
              </span>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold min-w-[140px]">BS 9999:2017</span>
              <span className="text-muted-foreground">
                Fire safety in the design, management and use of buildings - Code of practice
              </span>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold min-w-[140px]">BS 9991:2015</span>
              <span className="text-muted-foreground">
                Fire safety in the design, management and use of residential buildings - Code of practice
              </span>
            </div>
          </div>
        </section>

        {report.systemDescription && (
          <section>
            <h3 className="text-xl font-semibold mb-4 text-foreground">System Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {report.systemDescription}
            </p>
          </section>
        )}

        <section>
          <h3 className="text-xl font-semibold mb-4 text-foreground">System Classifications</h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Class A - Firefighting Stairways</h4>
              <p className="text-muted-foreground leading-relaxed">
                Pressurised stairways designed to provide a protected route for firefighting operations.
                These systems maintain higher pressure differentials to prevent smoke ingress during firefighting activities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Class B - Escape Route Stairways</h4>
              <p className="text-muted-foreground leading-relaxed">
                Pressurised stairways designed primarily for occupant evacuation. These systems maintain
                sufficient pressure to prevent smoke spread while allowing safe egress through doors.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 text-foreground">Pass/Fail Criteria</h3>
          <div className="space-y-4 text-sm">
            <div className="bg-muted/30 p-4 rounded-md border border-muted">
              <h4 className="font-semibold mb-3">Pressure Differential Requirements</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-muted-foreground">Class A (All Doors Closed):</p>
                  <p className="text-foreground">{PRESSURE_COMPLIANCE.CLASS_A_MIN} - {PRESSURE_COMPLIANCE.CLASS_A_MAX} Pa</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Class B (All Doors Closed):</p>
                  <p className="text-foreground">{PRESSURE_COMPLIANCE.CLASS_B_MIN} - {PRESSURE_COMPLIANCE.CLASS_B_MAX} Pa</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Open Door Scenario:</p>
                  <p className="text-foreground">{"\u2265"} {PRESSURE_COMPLIANCE.OPEN_DOOR_MIN} Pa minimum</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Door Opening Force:</p>
                  <p className="text-foreground">{"\u2264"} {PRESSURE_COMPLIANCE.DOOR_FORCE_MAX}N ({"\u2264"} {PRESSURE_COMPLIANCE.DOOR_FORCE_WITH_CLOSER_MAX}N with closer)</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 text-foreground">Testing Methodology</h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Measurement Procedure</h4>
              <ul className="space-y-1 text-muted-foreground ml-6">
                <li>Pressure readings taken at each floor level using calibrated manometer</li>
                <li>Lobby pressure and stairwell pressure recorded separately</li>
                <li>Differential pressure calculated as stairwell minus lobby pressure</li>
                <li>Door opening force measured using calibrated force gauge</li>
                <li>Environmental conditions noted (temperature, wind conditions)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Test Scenarios</h4>
              <ul className="space-y-1 text-muted-foreground ml-6">
                <li>All doors closed - baseline pressure differential test</li>
                <li>Single door open - maintained pressure during normal use</li>
                <li>Multiple doors open - fire scenario simulation</li>
                <li>Fire service override - emergency operation mode</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Documentation</h4>
              <ul className="space-y-1 text-muted-foreground ml-6">
                <li>Floor-by-floor pressure measurements with compliance status</li>
                <li>Door condition and seal integrity observations</li>
                <li>Door opening force measurements</li>
                <li>Overall system compliance determination</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <div className="text-center text-xs text-muted-foreground border-t pt-3 mt-auto">
      </div>
    </div>
  );
}
