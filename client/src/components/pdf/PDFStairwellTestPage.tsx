import { StairwellPressureTest, LevelMeasurement, PRESSURE_COMPLIANCE } from "@shared/schema";
import { CheckCircle2, XCircle } from "lucide-react";

interface PDFStairwellTestPageProps {
  test: StairwellPressureTest;
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

export default function PDFStairwellTestPage({ test }: PDFStairwellTestPageProps) {
  const isOpenDoorScenario = test.scenario === "single_door_open" || test.scenario === "multiple_doors_open";
  
  const getComplianceRange = () => {
    if (isOpenDoorScenario) {
      return `${"\u2265"} ${PRESSURE_COMPLIANCE.OPEN_DOOR_MIN} Pa`;
    }
    if (test.systemType === "class_a") {
      return `${PRESSURE_COMPLIANCE.CLASS_A_MIN} - ${PRESSURE_COMPLIANCE.CLASS_A_MAX} Pa`;
    }
    return `${PRESSURE_COMPLIANCE.CLASS_B_MIN} - ${PRESSURE_COMPLIANCE.CLASS_B_MAX} Pa`;
  };

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white p-[15mm] flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{test.building}</h2>
          <p className="text-lg text-muted-foreground">{test.stairwellId}</p>
        </div>
        <div className={`px-4 py-2 rounded-md ${test.overallCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <div className="flex items-center gap-2">
            {test.overallCompliant ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-bold text-lg">{test.overallCompliant ? 'PASS' : 'FAIL'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="space-y-1">
          <div className="flex gap-2">
            <span className="font-semibold min-w-[100px]">Test Date:</span>
            <span>{new Date(test.testDate).toLocaleDateString('en-GB')}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold min-w-[100px]">Tester:</span>
            <span>{test.testerName || "-"}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold min-w-[100px]">System Class:</span>
            <span>{getSystemClassLabel(test.systemType)}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex gap-2">
            <span className="font-semibold min-w-[100px]">Scenario:</span>
            <span>{getScenarioLabel(test.scenario)}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold min-w-[100px]">Required:</span>
            <span>{getComplianceRange()}</span>
          </div>
          {test.ambientTemperature && (
            <div className="flex gap-2">
              <span className="font-semibold min-w-[100px]">Ambient Temp:</span>
              <span>{test.ambientTemperature}{"\u00B0"}C</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4 bg-muted/30 p-3 rounded-md">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Average dP</p>
          <p className="text-xl font-bold text-foreground">{test.averageDifferential?.toFixed(1) || "-"} Pa</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Min dP</p>
          <p className="text-xl font-bold text-foreground">{test.minDifferential?.toFixed(1) || "-"} Pa</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Max dP</p>
          <p className="text-xl font-bold text-foreground">{test.maxDifferential?.toFixed(1) || "-"} Pa</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Avg Door Force</p>
          <p className="text-xl font-bold text-foreground">{test.averageDoorForce?.toFixed(0) || "-"} N</p>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-3 text-foreground">Floor Measurements</h3>
        <div className="border border-muted rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2 font-semibold">Floor</th>
                <th className="text-right p-2 font-semibold">Lobby (Pa)</th>
                <th className="text-right p-2 font-semibold">Stairwell (Pa)</th>
                <th className="text-right p-2 font-semibold">Differential (Pa)</th>
                <th className="text-right p-2 font-semibold">Door Force (N)</th>
                <th className="text-left p-2 font-semibold">Door Condition</th>
                <th className="text-center p-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {test.levelMeasurements?.map((level: LevelMeasurement, index: number) => {
                const passed = level.pressureCompliant;
                return (
                  <tr 
                    key={level.id || index} 
                    className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                  >
                    <td className="p-2 font-medium">{level.floorNumber}</td>
                    <td className="p-2 text-right font-mono">
                      {level.lobbyPressure?.toFixed(1) || "-"}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {level.stairwellPressure?.toFixed(1) || "-"}
                    </td>
                    <td className="p-2 text-right font-mono font-semibold">
                      {level.differentialPressure?.toFixed(1) || "-"}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {level.doorOpeningForce ? `${level.doorOpeningForce}${level.hasDoorCloser ? "*" : ""}` : "-"}
                    </td>
                    <td className="p-2 text-xs">
                      {level.doorCondition || "-"}
                    </td>
                    <td className="p-2">
                      <div className="flex justify-center">
                        {passed ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-semibold">PASS</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
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
        <p className="text-xs text-muted-foreground mt-2">* Indicates door with closer fitted (max {PRESSURE_COMPLIANCE.DOOR_FORCE_WITH_CLOSER_MAX}N allowed)</p>
      </div>

      {test.notes && (
        <div className="mt-4 bg-muted/30 p-3 rounded-md">
          <h4 className="font-semibold text-sm mb-1">Notes</h4>
          <p className="text-xs text-muted-foreground whitespace-pre-line">{test.notes}</p>
        </div>
      )}

      <div className="text-center text-xs text-muted-foreground border-t pt-3 mt-4">
      </div>
    </div>
  );
}
