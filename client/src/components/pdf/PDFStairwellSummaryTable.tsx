import { StairwellPressureTest } from "@shared/schema";
import { CheckCircle2, XCircle } from "lucide-react";

interface PDFStairwellSummaryTableProps {
  tests: StairwellPressureTest[];
}

function getSystemClassLabel(systemType: string): string {
  switch (systemType) {
    case "class_a": return "Class A - Firefighting";
    case "class_b": return "Class B - Escape Route";
    case "class_c": return "Class C";
    case "class_d": return "Class D";
    case "class_e": return "Class E";
    case "class_f": return "Class F";
    default: return systemType || "-";
  }
}

function getScenarioLabel(scenario: string): string {
  switch (scenario) {
    case "doors_closed": return "All Doors Closed";
    case "single_door_open": return "Single Door Open";
    case "multiple_doors_open": return "Multiple Doors Open";
    case "fire_service_override": return "Fire Service Override";
    default: return scenario || "-";
  }
}

export default function PDFStairwellSummaryTable({ tests }: PDFStairwellSummaryTableProps) {
  const passCount = tests.filter(t => t.overallCompliant).length;
  const failCount = tests.length - passCount;
  const passRate = tests.length > 0 ? (passCount / tests.length) * 100 : 0;
  const failRate = tests.length > 0 ? (failCount / tests.length) * 100 : 0;

  const testsByBuilding = tests.reduce((acc, test) => {
    const building = test.building || "Unknown";
    if (!acc[building]) {
      acc[building] = [];
    }
    acc[building].push(test);
    return acc;
  }, {} as Record<string, StairwellPressureTest[]>);

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white p-[20mm] flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-foreground mb-2">Stairwell Pressure Test Summary</h2>
        <div className="h-1 w-24 bg-primary" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-card-border rounded-md p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Tests</p>
          <p className="text-3xl font-bold text-foreground">{tests.length}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-4 text-center">
          <p className="text-sm text-green-700 dark:text-green-300 mb-1">Passed</p>
          <p className="text-3xl font-bold text-green-700 dark:text-green-300">{passCount}</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">{passRate.toFixed(1)}%</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-4 text-center">
          <p className="text-sm text-red-700 dark:text-red-300 mb-1">Failed</p>
          <p className="text-3xl font-bold text-red-700 dark:text-red-300">{failCount}</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{failRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="space-y-6">
          {Object.entries(testsByBuilding).map(([building, buildingTests]) => (
            <div key={building}>
              <h3 className="text-lg font-semibold mb-3 text-foreground">{building}</h3>
              <div className="border border-muted rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-semibold">Stairwell</th>
                      <th className="text-left p-2 font-semibold">System Class</th>
                      <th className="text-left p-2 font-semibold">Scenario</th>
                      <th className="text-right p-2 font-semibold">Avg dP (Pa)</th>
                      <th className="text-right p-2 font-semibold">Floors</th>
                      <th className="text-center p-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildingTests.map((test, index) => {
                      const passed = test.overallCompliant;
                      return (
                        <tr 
                          key={test.id} 
                          className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                        >
                          <td className="p-2">{test.stairwellId}</td>
                          <td className="p-2 text-xs">{getSystemClassLabel(test.systemType)}</td>
                          <td className="p-2 text-xs">{getScenarioLabel(test.scenario)}</td>
                          <td className="p-2 text-right font-mono font-semibold">
                            {test.averageDifferential?.toFixed(1) || "-"}
                          </td>
                          <td className="p-2 text-right">{test.levelMeasurements?.length || 0}</td>
                          <td className="p-2">
                            <div className="flex justify-center">
                              {passed ? (
                                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="text-xs font-semibold">PASS</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                  <XCircle className="w-4 h-4" />
                                  <span className="text-xs font-semibold">FAIL</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 bg-muted/30 p-4 rounded-md border border-muted">
        <h4 className="font-semibold mb-2 text-sm">Performance Summary</h4>
        <p className="text-xs text-muted-foreground">
          {passRate === 100 && "All stairwell pressure systems passed compliance requirements. System performance is satisfactory."}
          {passRate >= 90 && passRate < 100 && "Majority of systems passed. Failed systems require attention and remedial action."}
          {passRate >= 70 && passRate < 90 && "Significant number of failures detected. Comprehensive remedial works recommended."}
          {passRate < 70 && "High failure rate indicates systematic issues. Immediate remedial action and system review required."}
        </p>
      </div>

      <div className="text-center text-xs text-muted-foreground border-t pt-3 mt-6">
      </div>
    </div>
  );
}
