import { useState, useRef, useEffect, useMemo } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, RotateCcw, Gauge, Save, ArrowRight, FileDown, Search, X, Camera } from "lucide-react";
import { toPng, toJpeg } from "html-to-image";
import { useToast } from "@/hooks/use-toast";
import TestVisualization from "@/components/TestVisualization";
import GroupedTestHistory from "@/components/GroupedTestHistory";
import ReportSettingsSection from "@/components/ReportSettingsSection";
import TrendChart from "@/components/TrendChart";
import { ImageUpload } from "@/components/ImageUpload";
import PDFCoverPage from "@/components/pdf/PDFCoverPage";
import PDFStandardsPage from "@/components/pdf/PDFStandardsPage";
import PDFSummaryTable from "@/components/pdf/PDFSummaryTable";
import PDFTrendPage from "@/components/pdf/PDFTrendPage";
import { testSchema, type Test, type Report, type Damper } from "@shared/schema";
import { loadStorageData, saveStorageData, getOrCreateDamper, generateDamperKey, type StorageData } from "@/lib/storage";
import { getDamperHistory, getDampersWithRepeatVisits, getTestYear, type DamperHistory } from "@/lib/trendAnalysis";
import StairwellPressureTab from "@/components/StairwellPressureTab";
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

const PRESET_NOTES = [
  "Louvers fully open",
  "No obstructions observed",
  "Visual inspection passed",
  "Damper operating normally",
  "Clean condition",
  "Minor dust accumulation",
];

// UK Regulations: Calculate required grid size based on damper dimensions
// Per BS EN 12101-8 and BSRIA BG 49/2024
const calculateRequiredGridSize = (width: number | "", height: number | ""): number => {
  if (typeof width !== "number" || typeof height !== "number") {
    return 5; // Default to 5x5
  }
  
  const maxDimension = Math.max(width, height);
  
  // UK regulations specify:
  // ≤ 610mm (24"): 5x5 = 25 points
  // 610-914mm (24-36"): 6x6 = 36 points
  // > 914mm (36"): 7x7 = 49 points
  
  if (maxDimension <= 610) {
    return 5;
  } else if (maxDimension <= 914) {
    return 6;
  } else {
    return 7;
  }
};

const generatePositionLabels = (gridSize: number): string[] => {
  const labels: string[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      labels.push(`Row ${row + 1}, Col ${col + 1}`);
    }
  }
  return labels;
};

export default function AirflowTester() {
  // Storage state
  const [storageData, setStorageData] = useState<StorageData | null>(null);
  const [dampers, setDampers] = useState<Record<string, Damper>>({});
  const [savedTests, setSavedTests] = useState<Test[]>([]);
  const [currentReportId, setCurrentReportId] = useState<string>('default-report');
  // Separate report settings for damper and stairwell tabs
  const [damperReport, setDamperReport] = useState<Partial<Report>>({
    reportDate: new Date().toISOString().split('T')[0],
    testingStandards: "BS EN 12101-8:2020, BSRIA BG 49/2024",
    reportTitle: "Smoke Control Damper Testing Report",
    reportType: "commissioning",
    includeExecutiveSummary: true,
    includePassFailSummary: true,
  });
  
  const [stairwellReport, setStairwellReport] = useState<Partial<Report>>({
    reportDate: new Date().toISOString().split('T')[0],
    testingStandards: "BS EN 12101-6:2022, BS 5588-4, BS 9999, BS 9991",
    reportTitle: "Stairwell Differential Pressure Testing Report",
    reportType: "commissioning",
    includeExecutiveSummary: true,
    includePassFailSummary: true,
  });
  
  // Legacy alias for backwards compatibility
  const currentReport = damperReport;
  const setCurrentReport = setDamperReport;
  
  // Test form state
  const [damperWidth, setDamperWidth] = useState<number | "">("");
  const [damperHeight, setDamperHeight] = useState<number | "">("");
  const [gridSize, setGridSize] = useState<number>(5);
  const [readings, setReadings] = useState<(number | "")[]>(Array(25).fill(""));
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [building, setBuilding] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [floorNumber, setFloorNumber] = useState<string>("");
  const [shaftId, setShaftId] = useState<string>("");
  const [systemType, setSystemType] = useState<"push" | "pull" | "push-pull" | "">("");
  const [testerName, setTesterName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [damperOpenImage, setDamperOpenImage] = useState<string | undefined>(undefined);
  const [damperClosedImage, setDamperClosedImage] = useState<string | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState<string>("testing");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterSystemType, setFilterSystemType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "building" | "floor" | "average">("date-desc");
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [minVelocityThreshold, setMinVelocityThreshold] = useState<number>(2.5);
  const [showPassFailConfig, setShowPassFailConfig] = useState<boolean>(false);
  const [showRepeatVisitsOnly, setShowRepeatVisitsOnly] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [pdfRenderState, setPdfRenderState] = useState<'cover' | 'standards' | 'summary' | 'test' | 'trends' | null>(null);
  const [pdfCurrentTestIndex, setPdfCurrentTestIndex] = useState<number>(0);
  const [pdfTestsToExport, setPdfTestsToExport] = useState<Test[]>([]);
  const [pdfDamperHistories, setPdfDamperHistories] = useState<DamperHistory[]>([]);
  
  const captureRef = useRef<HTMLDivElement>(null);
  const pdfCaptureRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Update grid size and readings array when damper dimensions change
  useEffect(() => {
    const newGridSize = calculateRequiredGridSize(damperWidth, damperHeight);
    const requiredPoints = newGridSize * newGridSize;
    
    if (newGridSize !== gridSize) {
      setGridSize(newGridSize);
      
      // Preserve existing readings when resizing
      const currentReadings = [...readings];
      const newReadings = Array(requiredPoints).fill("");
      
      // Copy over existing readings up to the new size
      for (let i = 0; i < Math.min(currentReadings.length, requiredPoints); i++) {
        newReadings[i] = currentReadings[i];
      }
      
      setReadings(newReadings);
      
      if (typeof damperWidth === "number" && typeof damperHeight === "number") {
        toast({
          title: "Grid size updated",
          description: `UK regulations require a ${newGridSize}×${newGridSize} grid (${requiredPoints} points) for this damper size`,
        });
      }
    }
  }, [damperWidth, damperHeight]);

  // Load storage data on mount (auto-migrates legacy data)
  useEffect(() => {
    try {
      const data = loadStorageData();
      setStorageData(data);
      setDampers(data.dampers);
      setSavedTests(Object.values(data.tests));
      
      // Load separate report settings for each tab
      if (data.damperReportSettings) {
        setDamperReport(prev => ({ ...prev, ...data.damperReportSettings }));
      }
      if (data.stairwellReportSettings) {
        setStairwellReport(prev => ({ ...prev, ...data.stairwellReportSettings }));
      }
      
      // Legacy: Load the first report if it exists (for backwards compatibility)
      const reportIds = Object.keys(data.reports);
      if (reportIds.length > 0 && !data.damperReportSettings) {
        const firstReportId = reportIds[0];
        const firstReport = data.reports[firstReportId];
        setCurrentReportId(firstReportId);
        setDamperReport(prev => ({ ...prev, ...firstReport }));
      }
      
      if (Object.keys(data.tests).length > 0) {
        toast({
          title: "Data loaded",
          description: `Loaded ${Object.keys(data.tests).length} test(s) and ${Object.keys(data.dampers).length} damper(s)`,
        });
      }
    } catch (error) {
      console.error('Error loading storage data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load saved data. Starting fresh.",
        variant: "destructive",
      });
    }
  }, []);

  // Save storage data whenever tests, dampers, or report changes
  useEffect(() => {
    if (storageData) {
      try {
        // Preserve all existing reports, only update the current one being edited
        const updatedReports = {
          ...storageData.reports,
          [currentReportId]: {
            id: currentReportId,
            ...(storageData.reports[currentReportId] ?? {}), // Preserve existing fields (empty object if new)
            ...damperReport, // Overlay with current changes
          } as Partial<Report> & {id: string},
        };
        
        const updatedData: StorageData = {
          ...storageData,
          tests: Object.fromEntries(savedTests.map(t => [t.id, t])),
          dampers,
          reports: updatedReports,
          damperReportSettings: damperReport,
          stairwellReportSettings: stairwellReport,
        };
        saveStorageData(updatedData);
        setStorageData(updatedData);
      } catch (error) {
        console.error('Error saving storage data:', error);
      }
    }
  }, [savedTests, dampers, damperReport, stairwellReport, currentReportId]);

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

  const calculateFreeArea = (): number | undefined => {
    if (typeof damperWidth === "number" && typeof damperHeight === "number" && damperWidth > 0 && damperHeight > 0) {
      return (damperWidth * damperHeight) / 1000000;
    }
    return undefined;
  };

  const handleClear = () => {
    const requiredPoints = gridSize * gridSize;
    setReadings(Array(requiredPoints).fill(""));
    setBuilding("");
    setLocation("");
    setFloorNumber("");
    setShaftId("");
    setSystemType("");
    setTesterName("");
    setNotes("");
    setDamperOpenImage(undefined);
    setDamperClosedImage(undefined);
    setDamperWidth("");
    setDamperHeight("");
    setGridSize(5);
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
    
    const freeArea = calculateFreeArea();
    
    // Create test object (damperId will be added after damper creation)
    const testData: Omit<Test, 'damperId'> & { damperId?: string } = {
      id: editingId || `test-${Date.now()}`,
      testDate,
      building,
      location,
      floorNumber,
      shaftId,
      systemType,
      testerName,
      notes,
      readings: [...readings],
      gridSize,
      average,
      damperWidth: typeof damperWidth === "number" ? damperWidth : undefined,
      damperHeight: typeof damperHeight === "number" ? damperHeight : undefined,
      freeArea,
      damperOpenImage,
      damperClosedImage,
      createdAt: editingId ? (savedTests.find(t => t.id === editingId)?.createdAt || Date.now()) : Date.now(),
    };
    
    // Get or create damper entity
    const damper = getOrCreateDamper(testData as Test, dampers);
    
    // Link test to damper
    const test: Test = {
      ...testData,
      damperId: damper.id,
    } as Test;
    
    // Update dampers state if new damper was created
    if (!dampers[damper.id]) {
      setDampers(prev => ({ ...prev, [damper.id]: damper }));
    }

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
      const freeArea = calculateFreeArea();
      
      // Create test object (damperId will be added after damper creation)
      const testData: Omit<Test, 'damperId'> & { damperId?: string } = {
        id: editingId || `test-${Date.now()}`,
        testDate,
        building,
        location,
        floorNumber,
        shaftId,
        systemType,
        testerName,
        notes,
        readings: [...readings],
        gridSize,
        average,
        damperWidth: typeof damperWidth === "number" ? damperWidth : undefined,
        damperHeight: typeof damperHeight === "number" ? damperHeight : undefined,
        freeArea,
        damperOpenImage,
        damperClosedImage,
        createdAt: editingId ? (savedTests.find(t => t.id === editingId)?.createdAt || Date.now()) : Date.now(),
      };
      
      // Get or create damper entity
      const damper = getOrCreateDamper(testData as Test, dampers);
      
      // Link test to damper
      const test: Test = {
        ...testData,
        damperId: damper.id,
      } as Test;
      
      // Update dampers state if new damper was created
      if (!dampers[damper.id]) {
        setDampers(prev => ({ ...prev, [damper.id]: damper }));
      }

      if (editingId) {
        setSavedTests(prev => prev.map(t => t.id === editingId ? test : t));
      } else {
        setSavedTests(prev => [...prev, test]);
      }
      
      toast({
        title: "Test saved",
        description: "Moving to next floor",
      });
    }

    const currentFloor = floorNumber.match(/\d+/)?.[0];
    const nextFloorNum = currentFloor ? parseInt(currentFloor) + 1 : "";
    const floorSuffix = floorNumber.match(/[a-zA-Z\s]+$/)?.[0] || "";
    
    const requiredPoints = gridSize * gridSize;
    setReadings(Array(requiredPoints).fill(""));
    setFloorNumber(nextFloorNum ? `${nextFloorNum}${floorSuffix}` : "");
    setNotes("");
    setEditingId(null);
  };

  const handleEdit = (test: Test) => {
    setTestDate(test.testDate);
    setBuilding(test.building);
    setLocation(test.location);
    setFloorNumber(test.floorNumber);
    setShaftId(test.shaftId);
    setSystemType(test.systemType);
    setTesterName(test.testerName);
    setNotes(test.notes);
    setDamperOpenImage(test.damperOpenImage);
    setDamperClosedImage(test.damperClosedImage);
    setDamperWidth(test.damperWidth ?? "");
    setDamperHeight(test.damperHeight ?? "");
    setGridSize(test.gridSize || Math.sqrt(test.readings.length));
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

  const generateFilename = (test: Test, extension: string): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const building = test.building || 'unknown';
    const floor = test.floorNumber || 'unknown';
    const safe = (str: string) => str.replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 20);
    return `airflow_${safe(building)}_floor-${safe(floor)}_${timestamp}.${extension}`;
  };

  // Helper to wait for all images to load in an element
  const waitForImages = async (element: HTMLElement | null): Promise<void> => {
    if (!element) return;
    const images = element.getElementsByTagName('img');
    const promises = Array.from(images).map(async (img) => {
      if (img.complete && img.naturalWidth > 0) {
        // Image already loaded, but ensure it's decoded
        try {
          await img.decode();
        } catch (e) {
          // Ignore decode errors
        }
        return;
      }
      return new Promise((resolve) => {
        img.addEventListener('load', async () => {
          try {
            await img.decode();
          } catch (e) {
            // Ignore decode errors
          }
          resolve(null);
        });
        img.addEventListener('error', () => resolve(null)); // Resolve even on error to not block
        setTimeout(() => resolve(null), 5000); // Timeout after 5s
      });
    });
    await Promise.all(promises);
  };

  // Helper to wait for DOM render and images to load
  const waitForDOMReady = async (element: HTMLElement | null): Promise<void> => {
    if (!element) throw new Error('Element is null in waitForDOMReady');
    // Wait for React to flush state and render new DOM
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    // Wait for DOM paint
    await new Promise(resolve => requestAnimationFrame(resolve));
    // Reduced time for fonts
    await new Promise(resolve => setTimeout(resolve, 200));
    // Wait for all images to load
    await waitForImages(element);
  };

  const captureTestImage = async (element: HTMLElement | null): Promise<string> => {
    if (!element) throw new Error('Element is null in captureTestImage');
    await waitForDOMReady(element);
    // Use JPEG with optimized quality for smaller file size
    return await toJpeg(element, {
      quality: 0.92,
      pixelRatio: 1.5,
      backgroundColor: '#ffffff',
      skipFonts: true,
      cacheBust: true,
      style: {
        transform: 'none',
      }
    });
  };

  const handleExportSingleImage = async (test: Test) => {
    if (!captureRef.current) {
      toast({
        title: "Export failed",
        description: "Visualization component not ready",
        variant: "destructive",
      });
      return;
    }

    // Store current state to restore later
    const originalReadings = [...readings];
    const originalTestDate = testDate;
    const originalBuilding = building;
    const originalLocation = location;
    const originalFloorNumber = floorNumber;
    const originalShaftId = shaftId;
    const originalSystemType = systemType;
    const originalTesterName = testerName;
    const originalNotes = notes;
    const originalDamperWidth = damperWidth;
    const originalDamperHeight = damperHeight;
    const originalGridSize = gridSize;

    try {
      // Update the visible component with this test's data
      setReadings(test.readings);
      setTestDate(test.testDate);
      setBuilding(test.building);
      setLocation(test.location);
      setFloorNumber(test.floorNumber);
      setShaftId(test.shaftId);
      setSystemType(test.systemType);
      setTesterName(test.testerName);
      setNotes(test.notes);
      setDamperWidth(test.damperWidth || "");
      setDamperHeight(test.damperHeight || "");
      setGridSize(test.gridSize || 5);

      const dataUrl = await captureTestImage(captureRef.current);
      const link = document.createElement('a');
      link.download = generateFilename(test, 'png');
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
      // Restore original state
      setReadings(originalReadings);
      setTestDate(originalTestDate);
      setBuilding(originalBuilding);
      setLocation(originalLocation);
      setFloorNumber(originalFloorNumber);
      setShaftId(originalShaftId);
      setSystemType(originalSystemType);
      setTesterName(originalTesterName);
      setNotes(originalNotes);
      setDamperWidth(originalDamperWidth);
      setDamperHeight(originalDamperHeight);
      setGridSize(originalGridSize);
    }
  };

  const handleExportCurrentImage = async () => {
    if (!captureRef.current) return;
    
    const freeArea = calculateFreeArea();
    
    const currentTest: Test = {
      id: Date.now().toString(),
      testDate,
      building,
      location,
      floorNumber,
      shaftId,
      systemType,
      testerName,
      notes,
      readings,
      gridSize,
      average: calculateAverage() || 0,
      damperWidth: typeof damperWidth === "number" ? damperWidth : undefined,
      damperHeight: typeof damperHeight === "number" ? damperHeight : undefined,
      freeArea,
      createdAt: Date.now(),
    };
    
    try {
      const dataUrl = await captureTestImage(captureRef.current);
      const link = document.createElement('a');
      link.download = generateFilename(currentTest, 'png');
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

    toast({
      title: "Exporting images...",
      description: `Processing ${savedTests.length} test${savedTests.length !== 1 ? 's' : ''}`,
    });

    const zip = new JSZip();

    // Store current state to restore later
    const originalReadings = [...readings];
    const originalTestDate = testDate;
    const originalBuilding = building;
    const originalLocation = location;
    const originalFloorNumber = floorNumber;
    const originalShaftId = shaftId;
    const originalSystemType = systemType;
    const originalTesterName = testerName;
    const originalNotes = notes;
    const originalDamperWidth = damperWidth;
    const originalDamperHeight = damperHeight;
    const originalGridSize = gridSize;

    for (let i = 0; i < savedTests.length; i++) {
      const test = savedTests[i];
      
      // Update the hidden component with this test's data
      setReadings(test.readings);
      setTestDate(test.testDate);
      setBuilding(test.building);
      setLocation(test.location);
      setFloorNumber(test.floorNumber);
      setShaftId(test.shaftId);
      setSystemType(test.systemType);
      setTesterName(test.testerName);
      setNotes(test.notes);
      setDamperWidth(test.damperWidth || "");
      setDamperHeight(test.damperHeight || "");
      setGridSize(test.gridSize || 5);

      // Wait for React to re-render the hidden component
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        const dataUrl = await captureTestImage(captureRef.current!);
        const base64Data = dataUrl.split(',')[1];
        const filename = generateFilename(test, 'png').replace('.png', '');
        zip.file(`${i + 1}_${filename}.png`, base64Data, { base64: true });
      } catch (error) {
        console.error('Error generating image for test:', test.id, error);
      }
    }

    // Restore original state
    setReadings(originalReadings);
    setTestDate(originalTestDate);
    setBuilding(originalBuilding);
    setLocation(originalLocation);
    setFloorNumber(originalFloorNumber);
    setShaftId(originalShaftId);
    setSystemType(originalSystemType);
    setTesterName(originalTesterName);
    setNotes(originalNotes);
    setDamperWidth(originalDamperWidth);
    setDamperHeight(originalDamperHeight);
    setGridSize(originalGridSize);

    const blob = await zip.generateAsync({ type: 'blob' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const link = document.createElement('a');
    link.download = `airflow-tests_batch_${timestamp}.zip`;
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

    // Show progress toast
    toast({
      title: "Generating PDF...",
      description: `Processing ${savedTests.length} test${savedTests.length !== 1 ? 's' : ''}. Please wait...`,
    });

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let successCount = 0;

      // Store current state to restore later
      const originalReadings = [...readings];
      const originalTestDate = testDate;
      const originalBuilding = building;
      const originalLocation = location;
      const originalFloorNumber = floorNumber;
      const originalShaftId = shaftId;
      const originalSystemType = systemType;
      const originalTesterName = testerName;
      const originalNotes = notes;
      const originalDamperWidth = damperWidth;
      const originalDamperHeight = damperHeight;
      const originalGridSize = gridSize;

      for (let i = 0; i < savedTests.length; i++) {
        const test = savedTests[i];
        
        // Update the hidden component with this test's data
        setReadings(test.readings);
        setTestDate(test.testDate);
        setBuilding(test.building);
        setLocation(test.location);
        setFloorNumber(test.floorNumber);
        setShaftId(test.shaftId);
        setSystemType(test.systemType);
        setTesterName(test.testerName);
        setNotes(test.notes);
        setDamperWidth(test.damperWidth || "");
        setDamperHeight(test.damperHeight || "");
        setGridSize(test.gridSize || 5);

        // Wait for React to re-render the hidden component
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
          // Capture the hidden component after it has re-rendered
          const dataUrl = await captureTestImage(captureRef.current!);
          
          if (!dataUrl || dataUrl.length < 100) {
            throw new Error('Failed to capture test visualization');
          }
          
          if (successCount > 0) pdf.addPage();
          
          // Calculate proper image dimensions using getImageProperties
          const imgProps = pdf.getImageProperties(dataUrl);
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const maxPdfWidth = pageWidth - 20; // 10mm margins on each side
          const aspectRatio = imgProps.height / imgProps.width;
          
          // Add test visualization at top - adjust height based on whether images exist
          const hasImages = test.damperOpenImage || test.damperClosedImage;
          
          let finalWidth: number;
          let finalHeight: number;
          
          if (hasImages) {
            // Constrained height to make room for images below
            // Max height 140mm to leave room for damper images (160 + 80 = 240mm total)
            const maxHeight = 140;
            const naturalHeight = maxPdfWidth * aspectRatio;
            
            if (naturalHeight <= maxHeight) {
              // Fits within max height, use full width
              finalWidth = maxPdfWidth;
              finalHeight = naturalHeight;
            } else {
              // Too tall, scale down proportionally
              finalHeight = maxHeight;
              finalWidth = maxHeight / aspectRatio;
            }
          } else {
            // Constrain to page height with margins
            const maxHeight = pageHeight - 20; // 20mm total margins (10mm top + 10mm bottom)
            const naturalHeight = maxPdfWidth * aspectRatio;
            
            if (naturalHeight <= maxHeight) {
              // Fits within max height, use full width
              finalWidth = maxPdfWidth;
              finalHeight = naturalHeight;
            } else {
              // Too tall, scale down proportionally
              finalHeight = maxHeight;
              finalWidth = maxHeight / aspectRatio;
            }
          }
          
          // Center the image horizontally if it's narrower than max width
          const xPos = 10 + (maxPdfWidth - finalWidth) / 2;
          pdf.addImage(dataUrl, 'PNG', xPos, 10, finalWidth, finalHeight);
          successCount++;
          
          // Add damper images side by side below the test if they exist
          if (hasImages) {
            const imageY = 160; // Position below test visualization (140mm test + 20mm spacing)
            const imageWidth = 90; // Width for each image
            const imageHeight = 80; // Height for images
            
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            
            if (test.damperOpenImage) {
              pdf.text('Damper Open Position', 10, imageY - 3);
              try {
                pdf.addImage(test.damperOpenImage, 'JPEG', 10, imageY, imageWidth, imageHeight);
              } catch (imgError) {
                console.error('Error adding open image to PDF:', imgError);
                pdf.setFontSize(8);
                pdf.text('Image error', 10, imageY + 40);
              }
            }
            
            if (test.damperClosedImage) {
              const secondImageX = test.damperOpenImage ? 110 : 10; // Position next to open image or at start
              pdf.text('Damper Closed Position', secondImageX, imageY - 3);
              try {
                pdf.addImage(test.damperClosedImage, 'JPEG', secondImageX, imageY, imageWidth, imageHeight);
              } catch (imgError) {
                console.error('Error adding closed image to PDF:', imgError);
                pdf.setFontSize(8);
                pdf.text('Image error', secondImageX, imageY + 40);
              }
            }
          }
        } catch (error) {
          console.error('Error generating PDF page for test:', test.id, error);
        }
      }

      // Restore original state
      setReadings(originalReadings);
      setTestDate(originalTestDate);
      setBuilding(originalBuilding);
      setLocation(originalLocation);
      setFloorNumber(originalFloorNumber);
      setShaftId(originalShaftId);
      setSystemType(originalSystemType);
      setTesterName(originalTesterName);
      setNotes(originalNotes);
      setDamperWidth(originalDamperWidth);
      setDamperHeight(originalDamperHeight);
      setGridSize(originalGridSize);

      if (successCount === 0) {
        toast({
          title: "Export failed",
          description: "Could not generate any PDF pages",
          variant: "destructive",
        });
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      pdf.save(`airflow-tests_batch_${timestamp}.pdf`);

      toast({
        title: "PDF export complete",
        description: `${successCount} test${successCount !== 1 ? 's' : ''} exported to PDF`,
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Could not generate PDF",
        variant: "destructive",
      });
    }
  };

  const generateComprehensivePDF = async () => {
    // Determine which tests to export
    const testsToCheck = selectedTestIds.size > 0
      ? savedTests.filter(test => selectedTestIds.has(test.id))
      : savedTests;
    
    if (testsToCheck.length === 0) {
      toast({
        title: "No tests available",
        description: selectedTestIds.size > 0 ? "No tests selected for export" : "Save some tests first before generating a comprehensive report",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPDF(true);

    try {
      toast({
        title: "Generating comprehensive PDF...",
        description: "This may take a few moments. Please wait...",
      });

      // FIRST: Calculate which tests to export and set state BEFORE any rendering
      const testsToExport = selectedTestIds.size > 0
        ? savedTests.filter(test => selectedTestIds.has(test.id))
        : savedTests;
      
      // Calculate damper histories for trend analysis
      const damperIds = new Set(testsToExport.map(t => t.damperId).filter(Boolean) as string[]);
      const damperHistories: DamperHistory[] = [];
      damperIds.forEach(damperId => {
        const history = getDamperHistory(damperId, savedTests, dampers, minVelocityThreshold);
        if (history && history.hasMultipleYears) {
          damperHistories.push(history);
        }
      });
      
      // Set state synchronously BEFORE starting any PDF rendering
      flushSync(() => {
        setPdfTestsToExport(testsToExport);
        setPdfDamperHistories(damperHistories);
      });
      
      // Give React time to re-render with the new state before starting captures
      await new Promise(resolve => setTimeout(resolve, 100));

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let pageNumber = 1;

      // Helper to capture visible pdfCaptureRef component - optimized for speed
      const capturePDFSection = async (usePNG: boolean = false): Promise<string> => {
        if (!pdfCaptureRef.current) throw new Error('PDF capture ref not available');
        
        // Temporarily move element on-screen for reliable capture
        const originalTop = pdfCaptureRef.current.style.top;
        pdfCaptureRef.current.style.top = '0';
        pdfCaptureRef.current.style.left = '0';
        pdfCaptureRef.current.style.position = 'fixed';
        pdfCaptureRef.current.style.zIndex = '99999';
        
        // Single consolidated wait for React state flush and render
        await new Promise(resolve => requestAnimationFrame(() => 
          requestAnimationFrame(() => setTimeout(resolve, 50))
        ));
        
        // Wait until the element has actual dimensions (content is rendered)
        let attempts = 0;
        while (attempts < 30) {
          const rect = pdfCaptureRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 30));
          attempts++;
        }
        
        // Wait for images to load
        await waitForImages(pdfCaptureRef.current);
        
        // Final render wait (extra time for cover page with logo)
        await new Promise(resolve => setTimeout(resolve, usePNG ? 200 : 100));
        
        // Use PNG for cover page (better for logos), JPEG for others (smaller size)
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
        
        // Move element back off-screen
        pdfCaptureRef.current.style.top = originalTop;
        pdfCaptureRef.current.style.zIndex = '-9999';
        
        return dataUrl;
      };

      // Helper to add full-page image - auto-detects PNG vs JPEG
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
        
        // Auto-detect format from data URL
        const format = dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        pdf.addImage(dataUrl, format, xPos, yPos, finalWidth, finalHeight);
        
        // Add page number
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        pageNumber++;
      };

      try {
        // 1. Cover Page (use PNG for better logo quality)
        flushSync(() => {
          setPdfRenderState('cover');
        });
        await new Promise(resolve => setTimeout(resolve, 150));
        const coverDataUrl = await capturePDFSection(true); // PNG for logo
        addFullPageImage(coverDataUrl);
        setPdfRenderState(null);

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
      } catch (sectionError) {
        console.error('Error capturing PDF section:', sectionError);
        setPdfRenderState(null);
        throw sectionError;
      }

      // 4. Individual Test Pages
      for (let i = 0; i < testsToExport.length; i++) {
        const test = testsToExport[i];
        
        pdf.addPage();
        // Force synchronous state updates before capture
        flushSync(() => {
          setPdfCurrentTestIndex(i);
          setPdfRenderState('test');
        });
        
        // Capture using the same reliable method
        const dataUrl = await capturePDFSection();

        // Add test visualization - calculate proper dimensions
        const imgProps = pdf.getImageProperties(dataUrl);
        const maxPdfWidth = pageWidth - 20;
        const aspectRatio = imgProps.height / imgProps.width;
        
        const hasImages = test.damperOpenImage || test.damperClosedImage;
        
        let finalWidth: number;
        let finalHeight: number;
        
        if (hasImages) {
          const maxHeight = 140;
          const naturalHeight = maxPdfWidth * aspectRatio;
          
          if (naturalHeight <= maxHeight) {
            finalWidth = maxPdfWidth;
            finalHeight = naturalHeight;
          } else {
            finalHeight = maxHeight;
            finalWidth = maxHeight / aspectRatio;
          }
        } else {
          const maxHeight = pageHeight - 20;
          const naturalHeight = maxPdfWidth * aspectRatio;
          
          if (naturalHeight <= maxHeight) {
            finalWidth = maxPdfWidth;
            finalHeight = naturalHeight;
          } else {
            finalHeight = maxHeight;
            finalWidth = maxHeight / aspectRatio;
          }
        }
        
        const xPos = 10 + (maxPdfWidth - finalWidth) / 2;
        pdf.addImage(dataUrl, 'PNG', xPos, 10, finalWidth, finalHeight);
        
        // Add damper images if they exist
        if (hasImages) {
          const imageY = 160;
          const imageWidth = 90;
          const imageHeight = 80;
          
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          
          if (test.damperOpenImage) {
            pdf.text('Damper Open Position', 10, imageY - 3);
            try {
              pdf.addImage(test.damperOpenImage, 'JPEG', 10, imageY, imageWidth, imageHeight);
            } catch (imgError) {
              console.error('Error adding open image:', imgError);
            }
          }
          
          if (test.damperClosedImage) {
            pdf.text('Damper Closed Position', 110, imageY - 3);
            try {
              pdf.addImage(test.damperClosedImage, 'JPEG', 110, imageY, imageWidth, imageHeight);
            } catch (imgError) {
              console.error('Error adding closed image:', imgError);
            }
          }
        }
        
        // Add page number
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        pageNumber++;
      }

      // 5. Trend Analysis Page (if there are dampers with multiple years)
      if (damperHistories.length > 0) {
        pdf.addPage();
        flushSync(() => {
          setPdfRenderState('trends');
        });
        const trendsDataUrl = await capturePDFSection();
        addFullPageImage(trendsDataUrl);
        flushSync(() => {
          setPdfRenderState(null);
        });
      }

      // Clean up PDF render state
      setPdfRenderState(null);
      setPdfCurrentTestIndex(0);

      // Generate filename and save
      const reportName = currentReport.projectName || 'Smoke_Control_Report';
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${reportName.replace(/[^a-zA-Z0-9-]/g, '_')}_${dateStr}.pdf`;
      
      pdf.save(filename);

      const trendInfo = damperHistories.length > 0 
        ? `, and trends for ${damperHistories.length} damper${damperHistories.length !== 1 ? 's' : ''}` 
        : '';
      
      toast({
        title: "PDF report generated",
        description: `Professional report with cover page, standards, summary, ${testsToExport.length} test page${testsToExport.length !== 1 ? 's' : ''}${trendInfo} exported successfully`,
      });
    } catch (error) {
      console.error('Error generating comprehensive PDF:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Could not generate comprehensive PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
      setPdfRenderState(null);
      setPdfCurrentTestIndex(0);
      setPdfTestsToExport([]);
      setPdfDamperHistories([]);
    }
  };

  const evaluatePassFail = (average: number): "pass" | "fail" => {
    return average >= minVelocityThreshold ? "pass" : "fail";
  };

  const handleAddPresetNote = (presetNote: string) => {
    if (notes) {
      setNotes(notes + "; " + presetNote);
    } else {
      setNotes(presetNote);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedTestIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedTestIds.size === filteredAndSortedTests.length && filteredAndSortedTests.length > 0) {
      setSelectedTestIds(new Set());
    } else {
      setSelectedTestIds(new Set(filteredAndSortedTests.map(t => t.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedTestIds.size === 0) return;
    
    setSavedTests(prev => prev.filter(test => !selectedTestIds.has(test.id)));
    setSelectedTestIds(new Set());
    
    toast({
      title: "Tests deleted",
      description: `${selectedTestIds.size} test${selectedTestIds.size !== 1 ? 's' : ''} removed from history`,
    });
  };

  const filteredAndSortedTests = useMemo(() => {
    let filtered = savedTests.filter(test => {
      const matchesSearch = searchTerm === "" || 
        test.building?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.floorNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.shaftId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSystemType = filterSystemType === "all" || test.systemType === filterSystemType;
      
      return matchesSearch && matchesSystemType;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return b.createdAt - a.createdAt;
        case "date-asc":
          return a.createdAt - b.createdAt;
        case "building":
          return (a.building || "").localeCompare(b.building || "");
        case "floor":
          return (a.floorNumber || "").localeCompare(b.floorNumber || "");
        case "average":
          return b.average - a.average;
        default:
          return 0;
      }
    });
  }, [savedTests, searchTerm, filterSystemType, sortBy]);

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3" data-testid="tabs-main">
            <TabsTrigger value="testing" data-testid="tab-testing">
              Damper Testing
            </TabsTrigger>
            <TabsTrigger value="stairwell" data-testid="tab-stairwell">
              Stairwell Pressure
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              Test History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="testing" className="space-y-6">
            <ReportSettingsSection
              report={currentReport}
              onUpdate={(updates) => setCurrentReport(prev => ({ ...prev, ...updates }))}
              variant="damper"
            />
            
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

            <Card className="border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gauge className="w-5 h-5" />
                  Damper Dimensions (Required First)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  UK regulations (BS EN 12101-8, BSRIA BG 49/2024) require specific test grids based on damper size
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="damper-width">Width (mm)</Label>
                    <Input
                      id="damper-width"
                      type="number"
                      step="1"
                      placeholder="e.g., 1200"
                      value={damperWidth}
                      onChange={(e) => setDamperWidth(e.target.value === "" ? "" : parseFloat(e.target.value))}
                      data-testid="input-damper-width"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="damper-height">Height (mm)</Label>
                    <Input
                      id="damper-height"
                      type="number"
                      step="1"
                      placeholder="e.g., 800"
                      value={damperHeight}
                      onChange={(e) => setDamperHeight(e.target.value === "" ? "" : parseFloat(e.target.value))}
                      data-testid="input-damper-height"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Geometric Free Area (m²)</Label>
                    <div className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm items-center">
                      <span className="font-mono" data-testid="text-free-area">
                        {calculateFreeArea()?.toFixed(4) ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>
                {typeof damperWidth === "number" && typeof damperHeight === "number" && (
                  <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-md">
                    <p className="text-sm font-medium">
                      Required Test Grid: {gridSize} × {gridSize} = {gridSize * gridSize} measurement points
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {gridSize === 5 && "Damper ≤ 610mm: 5×5 grid (25 points)"}
                      {gridSize === 6 && "Damper 610-914mm: 6×6 grid (36 points)"}
                      {gridSize === 7 && "Damper > 914mm: 7×7 grid (49 points)"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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
                    <Label htmlFor="building">Building</Label>
                    <Input
                      id="building"
                      type="text"
                      placeholder="e.g., Building A"
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                      data-testid="input-building"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="e.g., North Wing"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      data-testid="input-location"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <Label htmlFor="system-type">System Type</Label>
                    <select
                      id="system-type"
                      value={systemType}
                      onChange={(e) => setSystemType(e.target.value as "" | "push" | "pull" | "push-pull")}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      data-testid="select-system-type"
                    >
                      <option value="">Not specified</option>
                      <option value="push">Push</option>
                      <option value="pull">Pull</option>
                      <option value="push-pull">Push/Pull</option>
                    </select>
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
                  <div className="flex flex-wrap gap-2 pt-2">
                    {PRESET_NOTES.map((presetNote, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddPresetNote(presetNote)}
                        data-testid={`button-preset-note-${index}`}
                        className="text-xs"
                      >
                        {presetNote}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Damper Images (Optional)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Document the damper condition in open and closed positions
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageUpload
                    label="Damper Open Position"
                    value={damperOpenImage}
                    onChange={setDamperOpenImage}
                    testId="damper-open"
                  />
                  <ImageUpload
                    label="Damper Closed Position"
                    value={damperClosedImage}
                    onChange={setDamperClosedImage}
                    testId="damper-closed"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Velocity Readings (m/s)</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {filledCount} of {gridSize * gridSize} readings entered ({gridSize}×{gridSize} grid)
                </p>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-4 ${gridSize === 5 ? 'grid-cols-2' : gridSize === 6 ? 'grid-cols-3' : 'grid-cols-3'}`}>
                  {readings.map((reading, index) => {
                    const positionLabels = generatePositionLabels(gridSize);
                    return (
                      <div key={index} className="space-y-2">
                        <Label htmlFor={`reading-${index}`} className="text-sm font-medium">
                          {positionLabels[index]}
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
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div ref={captureRef} className="bg-background p-6 rounded-lg border-2 border-border">
              <TestVisualization 
                test={{
                  testDate,
                  building,
                  location,
                  floorNumber,
                  shaftId,
                  systemType,
                  testerName,
                  notes,
                  readings,
                  gridSize,
                  damperWidth: typeof damperWidth === "number" ? damperWidth : undefined,
                  damperHeight: typeof damperHeight === "number" ? damperHeight : undefined,
                  freeArea: calculateFreeArea(),
                }}
                average={average}
                filledCount={filledCount}
                passFailStatus={average !== null ? evaluatePassFail(average) : null}
                threshold={minVelocityThreshold}
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

          <div className="lg:col-span-1 space-y-4">
            {savedTests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Search & Filter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search building, floor, shaft..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-9"
                      data-testid="input-search"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        data-testid="button-clear-search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="filter-system">System Type</Label>
                    <select
                      id="filter-system"
                      value={filterSystemType}
                      onChange={(e) => setFilterSystemType(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      data-testid="select-filter-system"
                    >
                      <option value="all">All Systems</option>
                      <option value="push">Push</option>
                      <option value="pull">Pull</option>
                      <option value="push-pull">Push/Pull</option>
                      <option value="">Not specified</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sort-by">Sort By</Label>
                    <select
                      id="sort-by"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      data-testid="select-sort"
                    >
                      <option value="date-desc">Date (Newest First)</option>
                      <option value="date-asc">Date (Oldest First)</option>
                      <option value="building">Building (A-Z)</option>
                      <option value="floor">Floor Number</option>
                      <option value="average">Average Velocity</option>
                    </select>
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    Showing {filteredAndSortedTests.length} of {savedTests.length} test{savedTests.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {savedTests.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Pass/Fail Criteria</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassFailConfig(!showPassFailConfig)}
                      data-testid="button-toggle-passfail"
                    >
                      {showPassFailConfig ? "Hide" : "Show"}
                    </Button>
                  </div>
                </CardHeader>
                {showPassFailConfig && (
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="min-velocity">Minimum Average Velocity (m/s)</Label>
                      <Input
                        id="min-velocity"
                        type="number"
                        step="0.1"
                        min="0"
                        value={minVelocityThreshold}
                        onChange={(e) => setMinVelocityThreshold(parseFloat(e.target.value) || 0)}
                        data-testid="input-min-velocity"
                      />
                      <p className="text-xs text-muted-foreground">
                        Tests with average velocity below this threshold will be marked as "Fail"
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
            
            <GroupedTestHistory 
              tests={filteredAndSortedTests}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onExportSingle={handleExportSingleImage}
              selectedIds={selectedTestIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onDeleteSelected={handleDeleteSelected}
              minVelocityThreshold={minVelocityThreshold}
            />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stairwell" className="space-y-6">
            <StairwellPressureTab 
              storageData={storageData}
              setStorageData={setStorageData}
              report={stairwellReport}
              onReportUpdate={(updates) => setStairwellReport(prev => ({ ...prev, ...updates }))}
            />
          </TabsContent>

      <TabsContent value="history" className="space-y-6">
        {savedTests.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground" data-testid="text-no-tests">
                No tests saved yet. Create some tests in the Testing tab to see historical trends.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <GroupedTestHistory 
              tests={savedTests}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onExportSingle={handleExportSingleImage}
              selectedIds={selectedTestIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onDeleteSelected={handleDeleteSelected}
              minVelocityThreshold={minVelocityThreshold}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generate Professional Report</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedTestIds.size > 0 
                    ? `Create a professional PDF report for ${selectedTestIds.size} selected test${selectedTestIds.size !== 1 ? 's' : ''}`
                    : "Create a comprehensive PDF report with cover page, standards, summary tables, individual test pages, and trend analysis"}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-2">Report Contents</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                        <li>• Cover page with project details</li>
                        <li>• Testing standards and methodology</li>
                        <li>• Summary table ({selectedTestIds.size > 0 ? selectedTestIds.size : savedTests.length} test{(selectedTestIds.size > 0 ? selectedTestIds.size : savedTests.length) !== 1 ? 's' : ''})</li>
                        <li>• Individual test pages with visualizations</li>
                        {(() => {
                          const testsForReport = selectedTestIds.size > 0
                            ? savedTests.filter(t => selectedTestIds.has(t.id))
                            : savedTests;
                          const damperIds = new Set(testsForReport.map(t => t.damperId).filter((id): id is string => Boolean(id)));
                          const hasTrends = Array.from(damperIds).some(id => {
                            const history = getDamperHistory(id, savedTests, dampers, minVelocityThreshold);
                            return history?.hasMultipleYears;
                          });
                          return hasTrends && <li>• Trend analysis charts for repeat visits</li>;
                        })()}
                      </ul>
                      {selectedTestIds.size > 0 && (
                        <p className="text-xs text-primary mt-2 font-semibold">
                          Only selected tests will be included in the report
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={generateComprehensivePDF}
                        disabled={isGeneratingPDF}
                        data-testid="button-generate-comprehensive-pdf-history"
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        {isGeneratingPDF ? "Generating..." : "Generate Report PDF"}
                      </Button>
                      {isGeneratingPDF && (
                        <p className="text-xs text-muted-foreground">
                          This may take a moment...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold" data-testid="text-history-title">
                  Year-over-Year Trend Analysis
                </h2>
                <p className="text-sm text-muted-foreground">
                  {savedTests.length} test{savedTests.length !== 1 ? 's' : ''} across {Object.keys(dampers).length} damper{Object.keys(dampers).length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="show-repeat-visits" className="text-sm">
                  Show only repeat visits
                </Label>
                <input
                  id="show-repeat-visits"
                  type="checkbox"
                  checked={showRepeatVisitsOnly}
                  onChange={(e) => setShowRepeatVisitsOnly(e.target.checked)}
                  className="rounded border-input"
                  data-testid="checkbox-repeat-visits"
                />
              </div>
            </div>

            {(() => {
              const dampersWithHistory = Object.values(dampers)
                .map(damper => getDamperHistory(damper.id, savedTests, dampers, minVelocityThreshold))
                .filter((history): history is NonNullable<typeof history> => history !== null);
              
              const displayedDampers = showRepeatVisitsOnly
                ? dampersWithHistory.filter(h => h.hasMultipleYears)
                : dampersWithHistory;

              if (displayedDampers.length === 0) {
                return (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground" data-testid="text-no-repeat-visits">
                        {showRepeatVisitsOnly 
                          ? "No dampers with repeat visits yet. Test the same damper in different years to see trends."
                          : "No damper history available."}
                      </p>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <div className="space-y-6">
                  {displayedDampers.map(damperHistory => (
                    <div key={damperHistory.damper.id}>
                      {damperHistory.hasMultipleYears && (
                        <TrendChart 
                          damperHistory={damperHistory}
                          minVelocityThreshold={minVelocityThreshold}
                          testId={damperHistory.damper.id}
                        />
                      )}
                      
                      {!damperHistory.hasMultipleYears && !showRepeatVisitsOnly && (
                        <Card data-testid={`card-single-year-${damperHistory.damper.id}`}>
                          <CardHeader>
                            <CardTitle className="text-lg">
                              {damperHistory.damper.building} - {damperHistory.damper.location} (Shaft {damperHistory.damper.shaftId})
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Single year of data - Test again in a future year to see trends
                            </p>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Year</p>
                                <p className="text-2xl font-bold">
                                  {damperHistory.yearlyData[0].year}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Tests</p>
                                <p className="text-2xl font-bold">
                                  {damperHistory.totalTests}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Avg Velocity</p>
                                <p className="text-2xl font-bold">
                                  {damperHistory.yearlyData[0].averageVelocity.toFixed(2)}
                                  <span className="text-sm font-normal ml-1">m/s</span>
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Pass Rate</p>
                                <p className="text-2xl font-bold">
                                  {((damperHistory.yearlyData[0].passCount / damperHistory.yearlyData[0].tests.length) * 100).toFixed(0)}
                                  <span className="text-sm font-normal ml-1">%</span>
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </TabsContent>
    </Tabs>
      </div>
      
      {/* Hidden capture divs for PDF generation */}
      <div 
        ref={pdfCaptureRef} 
        data-testid="pdf-staging"
        style={{ 
          position: 'absolute', 
          left: '0', 
          top: '-100000px',
          visibility: 'visible',
          pointerEvents: 'none',
          zIndex: -9999,
          backgroundColor: 'white',
          width: '210mm',
          minHeight: '297mm',
          padding: '20px'
        }}
      >
        {pdfRenderState === 'cover' && currentReport && (() => {
          // Calculate test date range for cover page using filtered tests
          const testDateRange = pdfTestsToExport.length > 0 ? {
            earliest: pdfTestsToExport.reduce((min, test) => test.testDate < min ? test.testDate : min, pdfTestsToExport[0].testDate),
            latest: pdfTestsToExport.reduce((max, test) => test.testDate > max ? test.testDate : max, pdfTestsToExport[0].testDate),
          } : undefined;
          
          return <PDFCoverPage report={currentReport} testDateRange={testDateRange} />;
        })()}
        {pdfRenderState === 'standards' && currentReport && (
          <PDFStandardsPage report={currentReport} minVelocityThreshold={minVelocityThreshold} />
        )}
        {pdfRenderState === 'summary' && (
          <PDFSummaryTable 
            tests={pdfTestsToExport} 
            dampers={dampers}
            minVelocityThreshold={minVelocityThreshold}
          />
        )}
        {pdfRenderState === 'trends' && pdfDamperHistories.length > 0 && (
          <PDFTrendPage
            damperHistories={pdfDamperHistories}
            minVelocityThreshold={minVelocityThreshold}
          />
        )}
        {pdfRenderState === 'test' && pdfCurrentTestIndex >= 0 && pdfTestsToExport[pdfCurrentTestIndex] && (() => {
          const test = pdfTestsToExport[pdfCurrentTestIndex];
          const avg = test.average;
          return (
            <TestVisualization 
              test={test}
              average={avg}
              filledCount={test.readings.filter((r): r is number => typeof r === 'number').length}
              passFailStatus={avg >= minVelocityThreshold ? 'pass' : 'fail'}
              threshold={minVelocityThreshold}
            />
          );
        })()}
      </div>
      
      {/* Hidden test visualization for batch exports from any tab */}
      <div 
        ref={captureRef} 
        style={{ 
          position: 'fixed', 
          left: '-9999px', 
          top: '0',
          backgroundColor: 'white',
          padding: '24px',
          minWidth: '800px'
        }}
      >
        <TestVisualization 
          test={{
            testDate,
            building,
            location,
            floorNumber,
            shaftId,
            systemType,
            testerName,
            notes,
            readings,
            gridSize,
            damperWidth: damperWidth || undefined,
            damperHeight: damperHeight || undefined,
            freeArea: calculateFreeArea(),
          }}
          average={calculateAverage()}
          filledCount={readings.filter(r => r !== "").length}
          passFailStatus={(() => {
            const avg = calculateAverage();
            return avg !== null ? evaluatePassFail(avg) : null;
          })()}
          threshold={minVelocityThreshold}
        />
      </div>
    </div>
  );
}
