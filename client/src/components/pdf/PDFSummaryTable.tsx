import { Test, Damper } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface PDFSummaryTableProps {
  tests: Test[];
  dampers: Record<string, Damper>;
  minVelocityThreshold: number;
}

export default function PDFSummaryTable({ tests, dampers, minVelocityThreshold }: PDFSummaryTableProps) {
  const passCount = tests.filter(t => t.average >= minVelocityThreshold).length;
  const failCount = tests.length - passCount;
  const passRate = tests.length > 0 ? (passCount / tests.length) * 100 : 0;
  const failRate = tests.length > 0 ? (failCount / tests.length) * 100 : 0;

  // Group tests by building for better organization
  const testsByBuilding = tests.reduce((acc, test) => {
    const building = test.building || "Unknown";
    if (!acc[building]) {
      acc[building] = [];
    }
    acc[building].push(test);
    return acc;
  }, {} as Record<string, Test[]>);

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white p-[20mm] flex flex-col">
      {/* Page Title */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-foreground mb-2">Test Summary</h2>
        <div className="h-1 w-24 bg-primary" />
      </div>

      {/* Summary Statistics */}
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

      {/* Test Results Table */}
      <div className="flex-1 overflow-hidden">
        <div className="space-y-6">
          {Object.entries(testsByBuilding).map(([building, buildingTests]) => (
            <div key={building}>
              <h3 className="text-lg font-semibold mb-3 text-foreground">{building}</h3>
              <div className="border border-muted rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-semibold">Location</th>
                      <th className="text-left p-2 font-semibold">Floor</th>
                      <th className="text-left p-2 font-semibold">Damper ID</th>
                      <th className="text-left p-2 font-semibold">System</th>
                      <th className="text-right p-2 font-semibold">Avg (m/s)</th>
                      <th className="text-center p-2 font-semibold">Status</th>
                      <th className="text-left p-2 font-semibold">Visit Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildingTests.map((test, index) => {
                      const passed = test.average >= minVelocityThreshold;
                      return (
                        <tr 
                          key={test.id} 
                          className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                        >
                          <td className="p-2">{test.location}</td>
                          <td className="p-2">{test.floorNumber}</td>
                          <td className="p-2 font-mono text-xs">{test.shaftId}</td>
                          <td className="p-2 text-xs">
                            {test.systemType === "push-pull" ? "Push/Pull" : 
                             test.systemType ? test.systemType.charAt(0).toUpperCase() + test.systemType.slice(1) : "-"}
                          </td>
                          <td className="p-2 text-right font-mono font-semibold">
                            {test.average.toFixed(2)}
                          </td>
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
                          <td className="p-2 text-xs">
                            {test.visitType ? 
                              test.visitType.charAt(0).toUpperCase() + test.visitType.slice(1).replace(/_/g, ' ') 
                              : "-"}
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

      {/* Performance Notes */}
      <div className="mt-8 bg-muted/30 p-4 rounded-md border border-muted">
        <h4 className="font-semibold mb-2 text-sm">Performance Summary</h4>
        <p className="text-xs text-muted-foreground">
          {passRate === 100 && "All dampers passed the minimum velocity threshold requirement. System performance is satisfactory."}
          {passRate >= 90 && passRate < 100 && "Majority of dampers passed. Failed units require attention and remedial action."}
          {passRate >= 70 && passRate < 90 && "Significant number of failures detected. Comprehensive remedial works recommended."}
          {passRate < 70 && "High failure rate indicates systematic issues. Immediate remedial action and system review required."}
        </p>
      </div>

      {/* Footer - page numbers added by PDF generation */}
      <div className="text-center text-xs text-muted-foreground border-t pt-3 mt-6">
      </div>
    </div>
  );
}
