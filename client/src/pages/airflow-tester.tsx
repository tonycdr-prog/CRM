import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, RotateCcw, Gauge } from "lucide-react";
import { toPng } from "html-to-image";
import { useToast } from "@/hooks/use-toast";
import damperImage from "@assets/generated_images/Vertical_smoke_damper_with_louvres_9fd2740b.png";

const POSITION_LABELS = [
  "Position 1 - Top Left",
  "Position 2 - Top Right", 
  "Position 3 - Second Left",
  "Position 4 - Second Right",
  "Position 5 - Third Left",
  "Position 6 - Third Right",
  "Position 7 - Bottom Left",
  "Position 8 - Bottom Right",
];

export default function AirflowTester() {
  const [readings, setReadings] = useState<(number | "")[]>(Array(8).fill(""));
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState<string>("");
  const [floorNumber, setFloorNumber] = useState<string>("");
  const [shaftId, setShaftId] = useState<string>("");
  const [testerName, setTesterName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const captureRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleReadingChange = (index: number, value: string) => {
    const numValue = value === "" ? "" : parseFloat(value);
    const newReadings = [...readings];
    newReadings[index] = numValue;
    setReadings(newReadings);
  };

  const calculateAverage = (): number | null => {
    const validReadings = readings.filter((r): r is number => typeof r === "number" && !isNaN(r));
    if (validReadings.length === 0) return null;
    return validReadings.reduce((sum, r) => sum + r, 0) / validReadings.length;
  };

  const handleClear = () => {
    setReadings(Array(8).fill(""));
    setLocation("");
    setFloorNumber("");
    setShaftId("");
    setTesterName("");
    setNotes("");
    setTestDate(new Date().toISOString().split('T')[0]);
  };

  const handleSaveImage = async () => {
    if (!captureRef.current) return;
    
    try {
      const dataUrl = await toPng(captureRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = `airflow-test-${testDate}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Image saved",
        description: "Airflow test results exported successfully",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate image",
        variant: "destructive",
      });
    }
  };

  const average = calculateAverage();
  const filledCount = readings.filter((r): r is number => typeof r === "number" && !isNaN(r)).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3 pb-6 border-b">
          <Gauge className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-title">
              Airflow Velocity Testing
            </h1>
            <p className="text-sm text-muted-foreground">
              Smoke Control Damper Measurement Tool
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test-date">Test Date</Label>
                <Input
                  id="test-date"
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  data-testid="input-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Building/Location</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="e.g., Building A"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  data-testid="input-location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Floor Number</Label>
                <Input
                  id="floor"
                  type="text"
                  placeholder="e.g., 5th Floor"
                  value={floorNumber}
                  onChange={(e) => setFloorNumber(e.target.value)}
                  data-testid="input-floor"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shaft-id">Shaft/Damper ID</Label>
                <Input
                  id="shaft-id"
                  type="text"
                  placeholder="e.g., SCD-03"
                  value={shaftId}
                  onChange={(e) => setShaftId(e.target.value)}
                  data-testid="input-shaft-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tester">Tester Name</Label>
                <Input
                  id="tester"
                  type="text"
                  placeholder="Your name"
                  value={testerName}
                  onChange={(e) => setTesterName(e.target.value)}
                  data-testid="input-tester"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                type="text"
                placeholder="Any observations or special conditions"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="input-notes"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Velocity Readings (m/s)</CardTitle>
            <p className="text-sm text-muted-foreground">
              {filledCount} of 8 readings entered
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {readings.map((reading, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`reading-${index}`} className="text-sm font-medium">
                    {POSITION_LABELS[index]}
                  </Label>
                  <div className="relative">
                    <Input
                      id={`reading-${index}`}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={reading}
                      onChange={(e) => handleReadingChange(index, e.target.value)}
                      className="pr-12 font-mono"
                      data-testid={`input-reading-${index + 1}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      m/s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div ref={captureRef} className="bg-background p-6 rounded-lg border-2 border-border">
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-semibold mb-2">Smoke Control Damper Test Results</h2>
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p className="font-medium">Date: {testDate}</p>
                {location && <p>Location: {location}</p>}
                {floorNumber && <p>Floor: {floorNumber}</p>}
                {shaftId && <p>Shaft/Damper ID: {shaftId}</p>}
                {testerName && <p>Tested by: {testerName}</p>}
                {notes && <p className="italic mt-2">Notes: {notes}</p>}
              </div>
            </div>

            <div className="relative w-full max-w-2xl mx-auto">
              <img
                src={damperImage}
                alt="Smoke control damper diagram"
                className="w-full h-auto opacity-20"
              />
              
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-4 gap-4 p-8">
                {readings.map((reading, index) => {
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
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleSaveImage}
            disabled={filledCount === 0}
            size="lg"
            className="flex-1 sm:flex-initial"
            data-testid="button-save"
          >
            <Download className="w-4 h-4 mr-2" />
            Save to Images
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            size="lg"
            className="flex-1 sm:flex-initial"
            data-testid="button-clear"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
}
