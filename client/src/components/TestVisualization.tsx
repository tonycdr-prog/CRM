import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import damperImage from "@assets/generated_images/Vertical_smoke_damper_with_louvres_9fd2740b.png";

interface TestVisualizationProps {
  test: {
    testDate?: string;
    building?: string;
    location?: string;
    floorNumber?: string;
    shaftId?: string;
    systemType?: "" | "push" | "pull" | "push-pull";
    testerName?: string;
    notes?: string;
    readings: (number | "")[];
    damperWidth?: number;
    damperHeight?: number;
    freeArea?: number;
  };
  average: number | null;
  filledCount: number;
  passFailStatus?: "pass" | "fail" | null;
  threshold?: number;
}

export default function TestVisualization({ test, average, filledCount, passFailStatus, threshold }: TestVisualizationProps) {
  const validReadings = test.readings.filter((r): r is number => typeof r === "number" && !isNaN(r));
  const minValue = validReadings.length > 0 ? Math.min(...validReadings) : null;
  const maxValue = validReadings.length > 0 ? Math.max(...validReadings) : null;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold mb-2">Smoke Control Damper Test Results</h2>
        <div className="text-sm text-muted-foreground space-y-0.5">
          <p className="font-medium">Date: {test.testDate || new Date().toISOString().split('T')[0]}</p>
          {test.building && <p>Building: {test.building}</p>}
          {test.location && <p>Location: {test.location}</p>}
          {test.floorNumber && <p>Floor: {test.floorNumber}</p>}
          {test.shaftId && <p>Shaft/Damper ID: {test.shaftId}</p>}
          {test.systemType && <p>System Type: {test.systemType === "push-pull" ? "Push/Pull" : test.systemType.charAt(0).toUpperCase() + test.systemType.slice(1)}</p>}
          {test.testerName && <p>Tested by: {test.testerName}</p>}
          {test.damperWidth && test.damperHeight && (
            <p>Damper Size: {test.damperWidth} × {test.damperHeight} mm {test.freeArea && `(${test.freeArea.toFixed(4)} m²)`}</p>
          )}
          {test.notes && <p className="italic mt-2">Notes: {test.notes}</p>}
        </div>
      </div>

      <div className="relative w-full max-w-2xl mx-auto">
        <img
          src={damperImage}
          alt="Smoke control damper diagram"
          className="w-full h-auto opacity-20"
        />
        
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-4 gap-4 p-8">
          {test.readings.map((reading, index) => {
            const hasValue = typeof reading === "number" && !isNaN(reading);
            return (
              <div
                key={index}
                className="flex flex-col items-center justify-center"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                    hasValue
                      ? "bg-primary text-primary-foreground border-primary-border"
                      : "bg-muted text-muted-foreground border-muted-border"
                  }`}
                >
                  {index + 1}
                </div>
                {hasValue && (
                  <div className="mt-2 bg-card border border-card-border rounded px-3 py-1">
                    <p className="text-sm font-mono font-semibold text-card-foreground">
                      {reading.toFixed(2)} m/s
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {average !== null && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="pt-6 text-center space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Average Airflow Velocity
              </p>
              <p className="text-4xl font-bold font-mono text-primary" data-testid="text-average">
                {average.toFixed(2)} <span className="text-2xl">m/s</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Calculated from {filledCount} measurement{filledCount !== 1 ? "s" : ""}
              </p>
            </div>
            
            {minValue !== null && maxValue !== null && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/10">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Minimum</p>
                  <p className="text-xl font-semibold font-mono text-card-foreground" data-testid="text-min">
                    {minValue.toFixed(2)} <span className="text-sm">m/s</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Maximum</p>
                  <p className="text-xl font-semibold font-mono text-card-foreground" data-testid="text-max">
                    {maxValue.toFixed(2)} <span className="text-sm">m/s</span>
                  </p>
                </div>
              </div>
            )}
            
            {passFailStatus && threshold !== undefined && (
              <div className="pt-4 border-t border-primary/10">
                <div className="flex items-center justify-center gap-2">
                  {passFailStatus === "pass" ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <Badge className="bg-green-600 hover:bg-green-700" data-testid="badge-pass">
                        PASS
                      </Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <Badge className="bg-red-600 hover:bg-red-700" data-testid="badge-fail">
                        FAIL
                      </Badge>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Threshold: {threshold.toFixed(2)} m/s
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
