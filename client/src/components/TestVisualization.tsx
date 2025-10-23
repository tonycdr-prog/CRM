import { Card, CardContent } from "@/components/ui/card";
import damperImage from "@assets/generated_images/Vertical_smoke_damper_with_louvres_9fd2740b.png";
import type { Test } from "@shared/schema";

interface TestVisualizationProps {
  test: Partial<Test> & { readings: (number | "")[] };
  average: number | null;
  filledCount: number;
}

export default function TestVisualization({ test, average, filledCount }: TestVisualizationProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold mb-2">Smoke Control Damper Test Results</h2>
        <div className="text-sm text-muted-foreground space-y-0.5">
          <p className="font-medium">Date: {test.testDate || new Date().toISOString().split('T')[0]}</p>
          {test.location && <p>Location: {test.location}</p>}
          {test.floorNumber && <p>Floor: {test.floorNumber}</p>}
          {test.shaftId && <p>Shaft/Damper ID: {test.shaftId}</p>}
          {test.testerName && <p>Tested by: {test.testerName}</p>}
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
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Average Airflow Velocity
            </p>
            <p className="text-4xl font-bold font-mono text-primary" data-testid="text-average">
              {average.toFixed(2)} <span className="text-2xl">m/s</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Calculated from {filledCount} measurement{filledCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
