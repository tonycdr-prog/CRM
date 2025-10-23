import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, RotateCcw, Gauge, Save, ArrowRight, FileDown } from "lucide-react";
import { toPng } from "html-to-image";
import { useToast } from "@/hooks/use-toast";
import TestVisualization from "@/components/TestVisualization";
import TestHistoryPanel from "@/components/TestHistoryPanel";
import { testSchema, type Test } from "@shared/schema";
import JSZip from "jszip";
import jsPDF from "jspdf";

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

const STORAGE_KEY = "airflow-tests";

export default function AirflowTester() {
  const [readings, setReadings] = useState<(number | "")[]>(Array(8).fill(""));
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState<string>("");
  const [floorNumber, setFloorNumber] = useState<string>("");
  const [shaftId, setShaftId] = useState<string>("");
  const [testerName, setTesterName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [savedTests, setSavedTests] = useState<Test[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const captureRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const rawTests = JSON.parse(stored);
        const validatedTests: Test[] = [];
        
        for (const test of rawTests) {
          try {
            const normalizedReadings: (number | "")[] = Array(8).fill("");
            if (Array.isArray(test.readings)) {
              test.readings.forEach((r: any, i: number) => {
                if (i < 8 && (typeof r === "number" || r === "")) {
                  normalizedReadings[i] = r;
                }
              });
            }
            
            const validatedTest = {
              ...test,
              readings: normalizedReadings,
            };
            
            const parsedTest = testSchema.parse(validatedTest);
            validatedTests.push(parsedTest);
          } catch (validationError) {
            console.error('Skipping invalid test:', validationError);
          }
        }
        
        setSavedTests(validatedTests);
      } catch (error) {
        console.error('Error loading saved tests:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (savedTests.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedTests));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [savedTests]);

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
    setEditingId(null);
  };

  const handleSaveTest = () => {
    const average = calculateAverage();
    if (average === null) {
      toast({
        title: "Cannot save",
        description: "Please enter at least one reading",
        variant: "destructive",
      });
      return;
    }
    
    const normalizedReadings: (number | "")[] = Array.from({ length: 8 }, (_, i) => readings[i] ?? "");
    
    const test: Test = {
      id: editingId || `test-${Date.now()}`,
      testDate,
      location,
      floorNumber,
      shaftId,
      testerName,
      notes,
      readings: normalizedReadings,
      average,
      createdAt: Date.now(),
    };

    if (editingId) {
      setSavedTests(prev => prev.map(t => t.id === editingId ? test : t));
      toast({
        title: "Test updated",
        description: "Your changes have been saved",
      });
    } else {
      setSavedTests(prev => [...prev, test]);
      toast({
        title: "Test saved",
        description: "Test added to history",
      });
    }

    handleClear();
  };

  const handleNextFloor = () => {
    const average = calculateAverage();
    if (average !== null) {
      handleSaveTest();
    }

    const currentFloor = floorNumber.match(/\d+/)?.[0];
    const nextFloorNum = currentFloor ? parseInt(currentFloor) + 1 : "";
    const floorSuffix = floorNumber.match(/[a-zA-Z\s]+$/)?.[0] || "";
    
    setReadings(Array(8).fill(""));
    setFloorNumber(nextFloorNum ? `${nextFloorNum}${floorSuffix}` : "");
    setNotes("");
    setEditingId(null);
  };

  const handleEdit = (test: Test) => {
    setTestDate(test.testDate);
    setLocation(test.location);
    setFloorNumber(test.floorNumber);
    setShaftId(test.shaftId);
    setTesterName(test.testerName);
    setNotes(test.notes);
    setReadings([...test.readings]);
    setEditingId(test.id);

    toast({
      title: "Editing test",
      description: "Make your changes and click Save Test",
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    setSavedTests(prev => prev.filter(t => t.id !== id));
    if (editingId === id) {
      handleClear();
    }
    toast({
      title: "Test deleted",
      description: "Test removed from history",
    });
  };

  const captureTestImage = async (element: HTMLElement): Promise<string> => {
    return await toPng(element, {
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });
  };

  const handleExportSingleImage = async (test: Test) => {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.className = 'bg-background p-6 rounded-lg border-2 border-border';
    document.body.appendChild(tempDiv);

    const { createRoot } = await import('react-dom/client');
    const root = createRoot(tempDiv);
    
    const filledCount = test.readings.filter((r): r is number => typeof r === "number" && !isNaN(r)).length;
    
    await new Promise<void>((resolve) => {
      root.render(
        <div>
          <TestVisualization 
            test={{ ...test, readings: test.readings }}
            average={test.average}
            filledCount={filledCount}
          />
        </div>
      );
      setTimeout(resolve, 500);
    });

    try {
      const dataUrl = await captureTestImage(tempDiv);
      const link = document.createElement('a');
      link.download = `airflow-test-${test.testDate}-${test.floorNumber || 'floor'}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Image exported",
        description: "Test image downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      root.unmount();
      document.body.removeChild(tempDiv);
    }
  };

  const handleExportCurrentImage = async () => {
    if (!captureRef.current) return;
    
    try {
      const dataUrl = await captureTestImage(captureRef.current);
      const link = document.createElement('a');
      link.download = `airflow-test-${testDate}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Image saved",
        description: "Current test exported successfully",
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

  const handleBatchExportImages = async () => {
    if (savedTests.length === 0) {
      toast({
        title: "No tests to export",
        description: "Save some tests first",
        variant: "destructive",
      });
      return;
    }

    const zip = new JSZip();
    const { createRoot } = await import('react-dom/client');

    for (let i = 0; i < savedTests.length; i++) {
      const test = savedTests[i];
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.className = 'bg-background p-6 rounded-lg border-2 border-border';
      document.body.appendChild(tempDiv);

      const root = createRoot(tempDiv);
      
      const filledCount = test.readings.filter((r): r is number => typeof r === "number" && !isNaN(r)).length;
      
      await new Promise<void>((resolve) => {
        root.render(
          <div>
            <TestVisualization 
              test={{ ...test, readings: test.readings }}
              average={test.average}
              filledCount={filledCount}
            />
          </div>
        );
        setTimeout(resolve, 500);
      });

      try {
        const dataUrl = await captureTestImage(tempDiv);
        const base64Data = dataUrl.split(',')[1];
        zip.file(`test-${i + 1}-${test.floorNumber || 'floor'}.png`, base64Data, { base64: true });
      } catch (error) {
        console.error('Error generating image for test:', test.id, error);
      } finally {
        root.unmount();
        document.body.removeChild(tempDiv);
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.download = `airflow-tests-${testDate}.zip`;
    link.href = URL.createObjectURL(blob);
    link.click();

    toast({
      title: "Batch export complete",
      description: `${savedTests.length} tests exported as images`,
    });
  };

  const handleBatchExportPDF = async () => {
    if (savedTests.length === 0) {
      toast({
        title: "No tests to export",
        description: "Save some tests first",
        variant: "destructive",
      });
      return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const { createRoot } = await import('react-dom/client');

    for (let i = 0; i < savedTests.length; i++) {
      const test = savedTests[i];
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.className = 'bg-background p-6 rounded-lg border-2 border-border';
      document.body.appendChild(tempDiv);

      const root = createRoot(tempDiv);
      
      const filledCount = test.readings.filter((r): r is number => typeof r === "number" && !isNaN(r)).length;
      
      await new Promise<void>((resolve) => {
        root.render(
          <div>
            <TestVisualization 
              test={{ ...test, readings: test.readings }}
              average={test.average}
              filledCount={filledCount}
            />
          </div>
        );
        setTimeout(resolve, 500);
      });

      try {
        const dataUrl = await captureTestImage(tempDiv);
        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 10, 10, 190, 0);
      } catch (error) {
        console.error('Error generating PDF page for test:', test.id, error);
      } finally {
        root.unmount();
        document.body.removeChild(tempDiv);
      }
    }

    pdf.save(`airflow-tests-${testDate}.pdf`);

    toast({
      title: "PDF export complete",
      description: `${savedTests.length} tests exported to PDF`,
    });
  };

  const average = calculateAverage();
  const filledCount = readings.filter((r): r is number => typeof r === "number" && !isNaN(r)).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-3 pb-6 border-b mb-6">
          <Gauge className="w-8 h-8 text-primary" />
          <div className="flex-1">
            <h1 className="text-2xl font-semibold" data-testid="text-title">
              Airflow Velocity Testing
            </h1>
            <p className="text-sm text-muted-foreground">
              Smoke Control Damper Measurement Tool
            </p>
          </div>
          {savedTests.length > 0 && (
            <div className="flex gap-2">
              <Button
                onClick={handleBatchExportImages}
                variant="outline"
                data-testid="button-export-all-images"
              >
                <Download className="w-4 h-4 mr-2" />
                Export All Images
              </Button>
              <Button
                onClick={handleBatchExportPDF}
                variant="outline"
                data-testid="button-export-pdf"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {editingId && (
              <Card className="border-primary bg-primary/5">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium text-primary">
                    Editing existing test - make changes and click Save Test
                  </p>
                </CardContent>
              </Card>
            )}

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
              <TestVisualization 
                test={{
                  testDate,
                  location,
                  floorNumber,
                  shaftId,
                  testerName,
                  notes,
                  readings,
                }}
                average={average}
                filledCount={filledCount}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={handleSaveTest}
                disabled={filledCount === 0}
                size="lg"
                data-testid="button-save-test"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingId ? "Update Test" : "Save Test"}
              </Button>
              <Button
                onClick={handleNextFloor}
                disabled={!location && !shaftId && !testerName}
                variant="default"
                size="lg"
                data-testid="button-next-floor"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Next Floor
              </Button>
              <Button
                onClick={handleExportCurrentImage}
                disabled={filledCount === 0}
                variant="outline"
                size="lg"
                data-testid="button-export-current"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Current
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                size="lg"
                data-testid="button-clear"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <TestHistoryPanel 
              tests={savedTests}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onExportSingle={handleExportSingleImage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
