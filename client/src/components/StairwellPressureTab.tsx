import { useState, useEffect, useMemo, useRef } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save, RotateCcw, CheckCircle, XCircle, AlertTriangle, FileDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  StairwellPressureTest, 
  LevelMeasurement, 
  PRESSURE_COMPLIANCE,
  pressureSystemTypeEnum,
  testScenarioEnum,
  Report
} from "@shared/schema";
import { StorageData, saveStorageData, loadStorageData } from "@/lib/storage";
import { nanoid } from "nanoid";
import { toPng, toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import PDFCoverPage from "@/components/pdf/PDFCoverPage";
import PDFStairwellStandardsPage from "@/components/pdf/PDFStairwellStandardsPage";
import PDFStairwellSummaryTable from "@/components/pdf/PDFStairwellSummaryTable";
import PDFStairwellTestPage from "@/components/pdf/PDFStairwellTestPage";
import ReportSettingsSection from "@/components/ReportSettingsSection";

interface StairwellPressureTabProps {
  storageData: StorageData | null;
  setStorageData: (data: StorageData) => void;
  report?: Partial<Report>;
  onReportUpdate?: (updates: Partial<Report>) => void;
}

const SYSTEM_TYPE_LABELS: Record<string, string> = {
  "class_a": "Class A - Firefighting Shaft (50 Pa)",
  "class_b": "Class B - Protected Escape Route (12.5 Pa)",
  "class_c": "Class C - Smoke Clearance",
  "class_d": "Class D - External Air Curtain",
  "class_e": "Class E - Smoke Control Lobby",
  "class_f": "Class F - Protected Lift Shaft",
};

const SCENARIO_LABELS: Record<string, string> = {
  "doors_closed": "All Doors Closed",
  "single_door_open": "Single Door Open on Fire Floor",
  "multiple_doors_open": "Multiple Doors Open",
  "fire_service_override": "Fire Service Override Mode",
};

const WIND_LABELS: Record<string, string> = {
  "calm": "Calm",
  "light": "Light Breeze",
  "moderate": "Moderate Wind",
  "strong": "Strong Wind",
};

export default function StairwellPressureTab({ storageData, setStorageData, report, onReportUpdate }: StairwellPressureTabProps) {
  const { toast } = useToast();
  const pdfCaptureRef = useRef<HTMLDivElement>(null);
  
  // PDF generation state
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfRenderState, setPdfRenderState] = useState<'cover' | 'standards' | 'summary' | 'test' | null>(null);
  const [pdfCurrentTestIndex, setPdfCurrentTestIndex] = useState<number>(0);
  const [pdfTestsToExport, setPdfTestsToExport] = useState<StairwellPressureTest[]>([]);
  
  // Test form state
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [testTime, setTestTime] = useState<string>("");
  const [testerName, setTesterName] = useState<string>("");
  const [building, setBuilding] = useState<string>("");
  const [stairwellId, setStairwellId] = useState<string>("");
  const [stairwellLocation, setStairwellLocation] = useState<string>("");
  const [systemType, setSystemType] = useState<string>("");
  const [systemDescription, setSystemDescription] = useState<string>("");
  const [scenario, setScenario] = useState<string>("");
  const [scenarioDescription, setScenarioDescription] = useState<string>("");
  const [fanRunning, setFanRunning] = useState<boolean>(true);
  const [fanSpeed, setFanSpeed] = useState<number | "">("");
  const [fanSpeedUnit, setFanSpeedUnit] = useState<string>("");
  const [damperStates, setDamperStates] = useState<string>("");
  const [ambientTemperature, setAmbientTemperature] = useState<number | "">("");
  const [windConditions, setWindConditions] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [recommendations, setRecommendations] = useState<string>("");
  
  // Level measurements
  const [levelMeasurements, setLevelMeasurements] = useState<LevelMeasurement[]>([]);
  
  // Saved tests display
  const [savedStairwellTests, setSavedStairwellTests] = useState<StairwellPressureTest[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load saved tests
  useEffect(() => {
    if (storageData?.stairwellTests) {
      setSavedStairwellTests(Object.values(storageData.stairwellTests));
    }
  }, [storageData]);

  // Get compliance thresholds based on system type
  const getComplianceThresholds = () => {
    if (systemType === "class_a") {
      return {
        minPressure: PRESSURE_COMPLIANCE.CLASS_A_MIN,
        maxPressure: PRESSURE_COMPLIANCE.CLASS_A_MAX,
        nominalPressure: PRESSURE_COMPLIANCE.CLASS_A_NOMINAL,
        label: "50 Pa (45-60 Pa range)"
      };
    } else if (systemType === "class_b") {
      return {
        minPressure: PRESSURE_COMPLIANCE.CLASS_B_MIN,
        maxPressure: PRESSURE_COMPLIANCE.CLASS_B_MAX,
        nominalPressure: PRESSURE_COMPLIANCE.CLASS_B_NOMINAL,
        label: "12.5 Pa (10-25 Pa range)"
      };
    }
    return {
      minPressure: PRESSURE_COMPLIANCE.CLASS_A_MIN,
      maxPressure: PRESSURE_COMPLIANCE.CLASS_A_MAX,
      nominalPressure: PRESSURE_COMPLIANCE.CLASS_A_NOMINAL,
      label: "50 Pa (default)"
    };
  };

  // Check if a level measurement is compliant
  const checkLevelCompliance = (level: LevelMeasurement): { pressure: boolean | undefined, force: boolean | undefined } => {
    const thresholds = getComplianceThresholds();
    
    let pressureCompliant: boolean | undefined;
    if (level.differentialPressure !== undefined && level.differentialPressure !== null) {
      if (scenario === "single_door_open" || scenario === "multiple_doors_open") {
        pressureCompliant = level.differentialPressure >= PRESSURE_COMPLIANCE.OPEN_DOOR_MIN;
      } else {
        pressureCompliant = level.differentialPressure >= thresholds.minPressure && 
                          level.differentialPressure <= thresholds.maxPressure;
      }
    }
    
    let forceCompliant: boolean | undefined;
    if (level.doorOpeningForce !== undefined && level.doorOpeningForce !== null) {
      const maxForce = level.hasDoorCloser 
        ? PRESSURE_COMPLIANCE.DOOR_FORCE_WITH_CLOSER_MAX 
        : PRESSURE_COMPLIANCE.DOOR_FORCE_MAX;
      forceCompliant = level.doorOpeningForce <= maxForce;
    }
    
    return { pressure: pressureCompliant, force: forceCompliant };
  };

  // Calculate summary statistics
  const calculateStatistics = useMemo(() => {
    const pressures = levelMeasurements
      .map(l => l.differentialPressure)
      .filter((p): p is number => p !== undefined && p !== null);
    
    const forces = levelMeasurements
      .map(l => l.doorOpeningForce)
      .filter((f): f is number => f !== undefined && f !== null);
    
    const thresholds = getComplianceThresholds();
    
    const stats = {
      averageDifferential: pressures.length > 0 ? pressures.reduce((a, b) => a + b, 0) / pressures.length : undefined,
      minDifferential: pressures.length > 0 ? Math.min(...pressures) : undefined,
      maxDifferential: pressures.length > 0 ? Math.max(...pressures) : undefined,
      averageDoorForce: forces.length > 0 ? forces.reduce((a, b) => a + b, 0) / forces.length : undefined,
      maxDoorForce: forces.length > 0 ? Math.max(...forces) : undefined,
    };
    
    // Calculate overall compliance
    const pressureReadings = levelMeasurements.filter(l => l.differentialPressure !== undefined);
    const forceReadings = levelMeasurements.filter(l => l.doorOpeningForce !== undefined);
    
    let overallPressureCompliant: boolean | undefined;
    if (pressureReadings.length > 0) {
      overallPressureCompliant = pressureReadings.every(l => {
        const compliance = checkLevelCompliance(l);
        return compliance.pressure === true;
      });
    }
    
    let overallForceCompliant: boolean | undefined;
    if (forceReadings.length > 0) {
      overallForceCompliant = forceReadings.every(l => {
        const compliance = checkLevelCompliance(l);
        return compliance.force === true;
      });
    }
    
    const overallCompliant = 
      (overallPressureCompliant === undefined || overallPressureCompliant) &&
      (overallForceCompliant === undefined || overallForceCompliant);
    
    return { ...stats, overallPressureCompliant, overallForceCompliant, overallCompliant };
  }, [levelMeasurements, systemType, scenario]);

  // Add a new floor/level
  const addLevel = () => {
    const newLevel: LevelMeasurement = {
      id: nanoid(),
      floorNumber: (levelMeasurements.length).toString(),
      floorDescription: "",
      hasDoorCloser: false,
      doorGapStatus: "",
      doorCondition: "",
    };
    setLevelMeasurements([...levelMeasurements, newLevel]);
  };

  // Remove a floor/level
  const removeLevel = (id: string) => {
    setLevelMeasurements(levelMeasurements.filter(l => l.id !== id));
  };

  // Update a level measurement
  const updateLevel = (id: string, field: keyof LevelMeasurement, value: any) => {
    setLevelMeasurements(levelMeasurements.map(l => {
      if (l.id !== id) return l;
      
      const updated = { ...l, [field]: value };
      
      // Auto-calculate differential pressure if both lobby and stairwell are provided
      if (field === "lobbyPressure" || field === "stairwellPressure") {
        if (updated.lobbyPressure !== undefined && updated.stairwellPressure !== undefined) {
          updated.differentialPressure = updated.stairwellPressure - updated.lobbyPressure;
        }
      }
      
      // Update compliance status
      const compliance = checkLevelCompliance(updated);
      updated.pressureCompliant = compliance.pressure;
      updated.forceCompliant = compliance.force;
      
      return updated;
    }));
  };

  // Reset form
  const resetForm = () => {
    setTestDate(new Date().toISOString().split('T')[0]);
    setTestTime("");
    setTesterName("");
    setBuilding("");
    setStairwellId("");
    setStairwellLocation("");
    setSystemType("");
    setSystemDescription("");
    setScenario("");
    setScenarioDescription("");
    setFanRunning(true);
    setFanSpeed("");
    setFanSpeedUnit("");
    setDamperStates("");
    setAmbientTemperature("");
    setWindConditions("");
    setNotes("");
    setRecommendations("");
    setLevelMeasurements([]);
    setEditingId(null);
  };

  // Save test
  const saveTest = () => {
    if (!building || !stairwellId || !testerName) {
      toast({
        title: "Required fields missing",
        description: "Please fill in building, stairwell ID, and tester name",
        variant: "destructive",
      });
      return;
    }
    
    if (levelMeasurements.length === 0) {
      toast({
        title: "No measurements",
        description: "Please add at least one floor measurement",
        variant: "destructive",
      });
      return;
    }
    
    const stats = calculateStatistics;
    
    const test: StairwellPressureTest = {
      id: editingId || nanoid(),
      testDate,
      testTime: testTime || undefined,
      testerName,
      building,
      stairwellId,
      stairwellLocation: stairwellLocation || undefined,
      systemType: (systemType || "") as any,
      systemDescription: systemDescription || undefined,
      applicableStandards: ["BS EN 12101-6"],
      scenario: (scenario || "") as any,
      scenarioDescription: scenarioDescription || undefined,
      fanRunning,
      fanSpeed: typeof fanSpeed === "number" ? fanSpeed : undefined,
      fanSpeedUnit: (fanSpeedUnit || "") as any,
      damperStates: damperStates || undefined,
      levelMeasurements,
      averageDifferential: stats.averageDifferential,
      minDifferential: stats.minDifferential,
      maxDifferential: stats.maxDifferential,
      averageDoorForce: stats.averageDoorForce,
      maxDoorForce: stats.maxDoorForce,
      overallPressureCompliant: stats.overallPressureCompliant,
      overallForceCompliant: stats.overallForceCompliant,
      overallCompliant: stats.overallCompliant,
      ambientTemperature: typeof ambientTemperature === "number" ? ambientTemperature : undefined,
      windConditions: (windConditions || "") as any,
      notes: notes || undefined,
      recommendations: recommendations || undefined,
      createdAt: editingId ? (storageData?.stairwellTests?.[editingId]?.createdAt || Date.now()) : Date.now(),
      updatedAt: editingId ? Date.now() : undefined,
    };
    
    // Save to storage
    const data = storageData || loadStorageData();
    if (!data.stairwellTests) {
      data.stairwellTests = {};
    }
    data.stairwellTests[test.id] = test;
    
    saveStorageData(data);
    setStorageData(data);
    setSavedStairwellTests(Object.values(data.stairwellTests));
    
    toast({
      title: editingId ? "Test updated" : "Test saved",
      description: `Stairwell pressure test for ${building} - ${stairwellId} saved successfully`,
    });
    
    resetForm();
  };

  // Load test for editing
  const loadTestForEditing = (test: StairwellPressureTest) => {
    setEditingId(test.id);
    setTestDate(test.testDate);
    setTestTime(test.testTime || "");
    setTesterName(test.testerName);
    setBuilding(test.building);
    setStairwellId(test.stairwellId);
    setStairwellLocation(test.stairwellLocation || "");
    setSystemType(test.systemType);
    setSystemDescription(test.systemDescription || "");
    setScenario(test.scenario);
    setScenarioDescription(test.scenarioDescription || "");
    setFanRunning(test.fanRunning);
    setFanSpeed(test.fanSpeed || "");
    setFanSpeedUnit(test.fanSpeedUnit);
    setDamperStates(test.damperStates || "");
    setAmbientTemperature(test.ambientTemperature || "");
    setWindConditions(test.windConditions);
    setNotes(test.notes || "");
    setRecommendations(test.recommendations || "");
    setLevelMeasurements(test.levelMeasurements);
  };

  // Delete test
  const deleteTest = (id: string) => {
    const data = storageData || loadStorageData();
    if (data.stairwellTests && data.stairwellTests[id]) {
      delete data.stairwellTests[id];
      saveStorageData(data);
      setStorageData(data);
      setSavedStairwellTests(Object.values(data.stairwellTests));
      
      toast({
        title: "Test deleted",
        description: "Stairwell pressure test removed",
      });
    }
  };

  // Wait for images to load
  const waitForImages = async (element: HTMLElement): Promise<void> => {
    const images = element.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });
    await Promise.all(imagePromises);
  };

  // Generate comprehensive PDF report
  const generateStairwellPDF = async () => {
    if (savedStairwellTests.length === 0) {
      toast({
        title: "No tests to export",
        description: "Save some stairwell pressure tests first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPDF(true);

    try {
      toast({
        title: "Generating PDF...",
        description: "This may take a few moments. Please wait...",
      });

      const testsToExport = savedStairwellTests.sort((a, b) => b.createdAt - a.createdAt);
      
      flushSync(() => {
        setPdfTestsToExport(testsToExport);
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let pageNumber = 1;

      // Helper to capture visible pdfCaptureRef component
      const capturePDFSection = async (usePNG: boolean = false): Promise<string> => {
        if (!pdfCaptureRef.current) {
          throw new Error('PDF capture ref not available');
        }
        
        const originalTop = pdfCaptureRef.current.style.top;
        pdfCaptureRef.current.style.top = '0';
        pdfCaptureRef.current.style.left = '0';
        pdfCaptureRef.current.style.position = 'fixed';
        pdfCaptureRef.current.style.zIndex = '99999';
        
        await new Promise(resolve => requestAnimationFrame(() => 
          requestAnimationFrame(() => setTimeout(resolve, 50))
        ));
        
        let attempts = 0;
        while (attempts < 30) {
          const rect = pdfCaptureRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 30));
          attempts++;
        }
        
        await waitForImages(pdfCaptureRef.current);
        await new Promise(resolve => setTimeout(resolve, usePNG ? 200 : 100));
        
        const dataUrl = usePNG 
          ? await toPng(pdfCaptureRef.current, {
              quality: 1.0,
              pixelRatio: 1.5,
              backgroundColor: '#ffffff',
              skipFonts: true,
              cacheBust: true,
            })
          : await toJpeg(pdfCaptureRef.current, {
              quality: 0.92,
              pixelRatio: 1.5,
              backgroundColor: '#ffffff',
              skipFonts: true,
              cacheBust: true,
            });
        
        pdfCaptureRef.current.style.top = originalTop;
        pdfCaptureRef.current.style.zIndex = '-9999';
        
        return dataUrl;
      };

      // Helper to add full-page image
      const addFullPageImage = (dataUrl: string) => {
        const maxPdfWidth = pageWidth - 20;
        const maxPdfHeight = pageHeight - 20;
        
        const imgProps = pdf.getImageProperties(dataUrl);
        const aspectRatio = imgProps.height / imgProps.width;
        const naturalHeight = maxPdfWidth * aspectRatio;
        
        let finalWidth: number;
        let finalHeight: number;
        
        if (naturalHeight <= maxPdfHeight) {
          finalWidth = maxPdfWidth;
          finalHeight = naturalHeight;
        } else {
          finalHeight = maxPdfHeight;
          finalWidth = maxPdfHeight / aspectRatio;
        }
        
        const xPos = 10 + (maxPdfWidth - finalWidth) / 2;
        const yPos = 10;
        
        const format = dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        pdf.addImage(dataUrl, format, xPos, yPos, finalWidth, finalHeight);
        
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        pageNumber++;
      };

      try {
        // 1. Cover Page
        flushSync(() => {
          setPdfRenderState('cover');
        });
        await new Promise(resolve => setTimeout(resolve, 150));
        const coverDataUrl = await capturePDFSection(true);
        addFullPageImage(coverDataUrl);
        flushSync(() => {
          setPdfRenderState(null);
        });

        // 2. Standards Page
        pdf.addPage();
        flushSync(() => {
          setPdfRenderState('standards');
        });
        const standardsDataUrl = await capturePDFSection();
        addFullPageImage(standardsDataUrl);
        flushSync(() => {
          setPdfRenderState(null);
        });

        // 3. Summary Table
        pdf.addPage();
        flushSync(() => {
          setPdfRenderState('summary');
        });
        const summaryDataUrl = await capturePDFSection();
        addFullPageImage(summaryDataUrl);
        flushSync(() => {
          setPdfRenderState(null);
        });

        // 4. Individual Test Pages
        for (let i = 0; i < testsToExport.length; i++) {
          pdf.addPage();
          flushSync(() => {
            setPdfCurrentTestIndex(i);
            setPdfRenderState('test');
          });
          
          const dataUrl = await capturePDFSection();
          addFullPageImage(dataUrl);
          
          flushSync(() => {
            setPdfRenderState(null);
          });
        }
      } catch (sectionError) {
        console.error('Error capturing PDF section:', sectionError);
        setPdfRenderState(null);
        throw sectionError;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const projectName = report?.projectName ? `_${report.projectName.replace(/\s+/g, '_')}` : '';
      pdf.save(`stairwell_pressure_report${projectName}_${timestamp}.pdf`);

      toast({
        title: "PDF generated successfully",
        description: `Report with ${testsToExport.length} test${testsToExport.length !== 1 ? 's' : ''} exported`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF generation failed",
        description: error instanceof Error ? error.message : "Could not generate PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
      setPdfRenderState(null);
    }
  };

  const thresholds = getComplianceThresholds();

  return (
    <div className="space-y-6">
      {/* Report Settings Section */}
      {onReportUpdate && (
        <ReportSettingsSection
          report={report || {}}
          onUpdate={onReportUpdate}
          variant="stairwell"
        />
      )}

      {/* Header with Standards Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            Stairwell Differential Pressure Testing
          </CardTitle>
          <CardDescription>
            Compliant with BS EN 12101-6, BS 5588-4, BS 9999, and BS 9991 standards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-muted rounded-md">
              <div className="font-medium">Class A (Firefighting)</div>
              <div className="text-muted-foreground">45-60 Pa closed</div>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <div className="font-medium">Class B (Escape Route)</div>
              <div className="text-muted-foreground">10-25 Pa closed</div>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <div className="font-medium">Open Door</div>
              <div className="text-muted-foreground">≥10 Pa minimum</div>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <div className="font-medium">Door Force</div>
              <div className="text-muted-foreground">≤100N (≤140N with closer)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Configuration */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: Test Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Test Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="testDate">Test Date *</Label>
                <Input
                  id="testDate"
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  data-testid="input-stairwell-test-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testTime">Test Time</Label>
                <Input
                  id="testTime"
                  type="time"
                  value={testTime}
                  onChange={(e) => setTestTime(e.target.value)}
                  data-testid="input-stairwell-test-time"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="testerName">Tester Name *</Label>
              <Input
                id="testerName"
                value={testerName}
                onChange={(e) => setTesterName(e.target.value)}
                placeholder="Enter tester name"
                data-testid="input-stairwell-tester-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="building">Building *</Label>
              <Input
                id="building"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="e.g., Tower Block A"
                data-testid="input-stairwell-building"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stairwellId">Stairwell ID *</Label>
                <Input
                  id="stairwellId"
                  value={stairwellId}
                  onChange={(e) => setStairwellId(e.target.value)}
                  placeholder="e.g., Stair 1"
                  data-testid="input-stairwell-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stairwellLocation">Location</Label>
                <Input
                  id="stairwellLocation"
                  value={stairwellLocation}
                  onChange={(e) => setStairwellLocation(e.target.value)}
                  placeholder="e.g., North Core"
                  data-testid="input-stairwell-location"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="systemType">System Classification</Label>
              <Select value={systemType} onValueChange={setSystemType}>
                <SelectTrigger data-testid="select-system-type">
                  <SelectValue placeholder="Select system class" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SYSTEM_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="scenario">Test Scenario</Label>
              <Select value={scenario} onValueChange={setScenario}>
                <SelectTrigger data-testid="select-scenario">
                  <SelectValue placeholder="Select test scenario" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SCENARIO_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: System Status & Environmental */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System & Environmental</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fanRunning"
                checked={fanRunning}
                onCheckedChange={(checked) => setFanRunning(checked as boolean)}
                data-testid="checkbox-fan-running"
              />
              <Label htmlFor="fanRunning">Pressurization Fan Running</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fanSpeed">Fan Speed</Label>
                <Input
                  id="fanSpeed"
                  type="number"
                  value={fanSpeed}
                  onChange={(e) => setFanSpeed(e.target.value ? parseFloat(e.target.value) : "")}
                  placeholder="e.g., 75"
                  data-testid="input-fan-speed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fanSpeedUnit">Unit</Label>
                <Select value={fanSpeedUnit} onValueChange={setFanSpeedUnit}>
                  <SelectTrigger data-testid="select-fan-speed-unit">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">%</SelectItem>
                    <SelectItem value="rpm">RPM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="damperStates">Damper States</Label>
              <Input
                id="damperStates"
                value={damperStates}
                onChange={(e) => setDamperStates(e.target.value)}
                placeholder="e.g., All relief dampers closed"
                data-testid="input-damper-states"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ambientTemperature">Ambient Temp (°C)</Label>
                <Input
                  id="ambientTemperature"
                  type="number"
                  value={ambientTemperature}
                  onChange={(e) => setAmbientTemperature(e.target.value ? parseFloat(e.target.value) : "")}
                  placeholder="e.g., 20"
                  data-testid="input-ambient-temp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="windConditions">Wind Conditions</Label>
                <Select value={windConditions} onValueChange={setWindConditions}>
                  <SelectTrigger data-testid="select-wind-conditions">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(WIND_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="systemDescription">System Description</Label>
              <Textarea
                id="systemDescription"
                value={systemDescription}
                onChange={(e) => setSystemDescription(e.target.value)}
                placeholder="e.g., Mechanical pressurization with roof-mounted centrifugal fan"
                rows={2}
                data-testid="input-system-description"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floor Measurements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Floor-by-Floor Measurements</CardTitle>
            <CardDescription>
              {systemType && `Target: ${thresholds.label}`}
              {scenario && (scenario === "single_door_open" || scenario === "multiple_doors_open") && 
                ` | Open door minimum: ≥10 Pa`}
            </CardDescription>
          </div>
          <Button onClick={addLevel} size="sm" data-testid="button-add-level">
            <Plus className="h-4 w-4 mr-1" />
            Add Floor
          </Button>
        </CardHeader>
        <CardContent>
          {levelMeasurements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No floor measurements added yet. Click "Add Floor" to begin.
            </div>
          ) : (
            <div className="space-y-4">
              {levelMeasurements.map((level, index) => {
                const compliance = checkLevelCompliance(level);
                
                return (
                  <div key={level.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">Floor {level.floorNumber || index}</span>
                        {level.floorDescription && (
                          <span className="text-sm text-muted-foreground">({level.floorDescription})</span>
                        )}
                        <div className="flex gap-1">
                          {compliance.pressure !== undefined && (
                            <Badge 
                              variant={compliance.pressure ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {compliance.pressure ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                              Pressure
                            </Badge>
                          )}
                          {compliance.force !== undefined && (
                            <Badge 
                              variant={compliance.force ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {compliance.force ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                              Force
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeLevel(level.id)}
                        data-testid={`button-remove-level-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Floor Number</Label>
                        <Input
                          value={level.floorNumber}
                          onChange={(e) => updateLevel(level.id, "floorNumber", e.target.value)}
                          placeholder="e.g., G, 1, 2"
                          data-testid={`input-floor-number-${index}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Floor Description</Label>
                        <Input
                          value={level.floorDescription || ""}
                          onChange={(e) => updateLevel(level.id, "floorDescription", e.target.value)}
                          placeholder="e.g., Lobby Level"
                          data-testid={`input-floor-description-${index}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Lobby Pressure (Pa)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={level.lobbyPressure ?? ""}
                          onChange={(e) => updateLevel(level.id, "lobbyPressure", e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="0.0"
                          data-testid={`input-lobby-pressure-${index}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Stairwell Pressure (Pa)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={level.stairwellPressure ?? ""}
                          onChange={(e) => updateLevel(level.id, "stairwellPressure", e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="0.0"
                          data-testid={`input-stairwell-pressure-${index}`}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label>Differential (Pa)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={level.differentialPressure ?? ""}
                          onChange={(e) => updateLevel(level.id, "differentialPressure", e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="Auto-calculated"
                          className={
                            compliance.pressure === true ? "border-green-500" :
                            compliance.pressure === false ? "border-destructive" : ""
                          }
                          data-testid={`input-differential-pressure-${index}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Door Force (N)</Label>
                        <Input
                          type="number"
                          step="1"
                          value={level.doorOpeningForce ?? ""}
                          onChange={(e) => updateLevel(level.id, "doorOpeningForce", e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="≤100N"
                          className={
                            compliance.force === true ? "border-green-500" :
                            compliance.force === false ? "border-destructive" : ""
                          }
                          data-testid={`input-door-force-${index}`}
                        />
                      </div>
                      <div className="space-y-2 flex items-end pb-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`hasCloser-${level.id}`}
                            checked={level.hasDoorCloser}
                            onCheckedChange={(checked) => updateLevel(level.id, "hasDoorCloser", checked)}
                            data-testid={`checkbox-has-closer-${index}`}
                          />
                          <Label htmlFor={`hasCloser-${level.id}`} className="text-sm">Door Closer</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Door Gap</Label>
                        <Select 
                          value={level.doorGapStatus} 
                          onValueChange={(v) => updateLevel(level.id, "doorGapStatus", v)}
                        >
                          <SelectTrigger data-testid={`select-door-gap-${index}`}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sealed">Sealed</SelectItem>
                            <SelectItem value="normal_gap">Normal Gap</SelectItem>
                            <SelectItem value="large_gap">Large Gap</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Door Condition</Label>
                        <Select 
                          value={level.doorCondition} 
                          onValueChange={(v) => updateLevel(level.id, "doorCondition", v)}
                        >
                          <SelectTrigger data-testid={`select-door-condition-${index}`}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Input
                        value={level.notes || ""}
                        onChange={(e) => updateLevel(level.id, "notes", e.target.value)}
                        placeholder="Any observations for this floor"
                        data-testid={`input-level-notes-${index}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary & Compliance */}
      {levelMeasurements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Test Summary
              {calculateStatistics.overallCompliant !== undefined && (
                <Badge variant={calculateStatistics.overallCompliant ? "default" : "destructive"}>
                  {calculateStatistics.overallCompliant ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> PASS</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" /> FAIL</>
                  )}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="p-3 bg-muted rounded-md">
                <div className="text-muted-foreground">Avg Pressure</div>
                <div className="font-mono text-lg">
                  {calculateStatistics.averageDifferential?.toFixed(1) ?? "-"} Pa
                </div>
              </div>
              <div className="p-3 bg-muted rounded-md">
                <div className="text-muted-foreground">Min Pressure</div>
                <div className="font-mono text-lg">
                  {calculateStatistics.minDifferential?.toFixed(1) ?? "-"} Pa
                </div>
              </div>
              <div className="p-3 bg-muted rounded-md">
                <div className="text-muted-foreground">Max Pressure</div>
                <div className="font-mono text-lg">
                  {calculateStatistics.maxDifferential?.toFixed(1) ?? "-"} Pa
                </div>
              </div>
              <div className="p-3 bg-muted rounded-md">
                <div className="text-muted-foreground">Avg Door Force</div>
                <div className="font-mono text-lg">
                  {calculateStatistics.averageDoorForce?.toFixed(0) ?? "-"} N
                </div>
              </div>
              <div className="p-3 bg-muted rounded-md">
                <div className="text-muted-foreground">Max Door Force</div>
                <div className="font-mono text-lg">
                  {calculateStatistics.maxDoorForce?.toFixed(0) ?? "-"} N
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes & Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Test Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations or comments about the test"
              rows={3}
              data-testid="input-test-notes"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recommendations">Recommendations</Label>
            <Textarea
              id="recommendations"
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="Any recommended actions or follow-up work"
              rows={3}
              data-testid="input-recommendations"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={resetForm} data-testid="button-reset-form">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button onClick={saveTest} data-testid="button-save-stairwell-test">
          <Save className="h-4 w-4 mr-2" />
          {editingId ? "Update Test" : "Save Test"}
        </Button>
      </div>

      {/* Saved Tests List */}
      {savedStairwellTests.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">Saved Stairwell Pressure Tests</CardTitle>
            <Button 
              onClick={generateStairwellPDF} 
              disabled={isGeneratingPDF}
              data-testid="button-export-stairwell-pdf"
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              {isGeneratingPDF ? "Generating..." : "Export PDF Report"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedStairwellTests
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((test) => (
                  <div 
                    key={test.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                    data-testid={`stairwell-test-item-${test.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={test.overallCompliant ? "default" : "destructive"}>
                        {test.overallCompliant ? "PASS" : "FAIL"}
                      </Badge>
                      <div>
                        <div className="font-medium">{test.building} - {test.stairwellId}</div>
                        <div className="text-sm text-muted-foreground">
                          {test.testDate} | {test.levelMeasurements.length} floors | 
                          Avg: {test.averageDifferential?.toFixed(1) ?? "-"} Pa
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => loadTestForEditing(test)}
                        data-testid={`button-edit-stairwell-test-${test.id}`}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteTest(test.id)}
                        data-testid={`button-delete-stairwell-test-${test.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden PDF Capture Area */}
      <div
        ref={pdfCaptureRef}
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          zIndex: -9999,
          backgroundColor: '#ffffff',
        }}
      >
        {pdfRenderState === 'cover' && (
          <PDFCoverPage 
            report={{
              ...report,
              reportTitle: report?.reportTitle || "Stairwell Differential Pressure Testing Report",
            }}
            testDateRange={
              pdfTestsToExport.length > 0
                ? {
                    earliest: pdfTestsToExport.reduce((min, t) => t.testDate < min ? t.testDate : min, pdfTestsToExport[0].testDate),
                    latest: pdfTestsToExport.reduce((max, t) => t.testDate > max ? t.testDate : max, pdfTestsToExport[0].testDate),
                  }
                : undefined
            }
          />
        )}
        {pdfRenderState === 'standards' && (
          <PDFStairwellStandardsPage report={report || {}} />
        )}
        {pdfRenderState === 'summary' && (
          <PDFStairwellSummaryTable tests={pdfTestsToExport} />
        )}
        {pdfRenderState === 'test' && pdfTestsToExport[pdfCurrentTestIndex] && (
          <PDFStairwellTestPage test={pdfTestsToExport[pdfCurrentTestIndex]} />
        )}
      </div>
    </div>
  );
}
