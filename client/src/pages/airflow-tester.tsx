import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, RotateCcw, Gauge, Save, ArrowRight, FileDown, Search, X, Camera } from "lucide-react";
import { toPng } from "html-to-image";
import { useToast } from "@/hooks/use-toast";
import TestVisualization from "@/components/TestVisualization";
import TestHistoryPanel from "@/components/TestHistoryPanel";
import { ImageUpload } from "@/components/ImageUpload";
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
  const [savedTests, setSavedTests] = useState<Test[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterSystemType, setFilterSystemType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "building" | "floor" | "average">("date-desc");
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [minVelocityThreshold, setMinVelocityThreshold] = useState<number>(2.5);
  const [showPassFailConfig, setShowPassFailConfig] = useState<boolean>(false);
  
  const captureRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const rawTests = JSON.parse(stored);
        const validatedTests: Test[] = [];
        
        for (const test of rawTests) {
          try {
            // Determine expected array size (legacy 8-point or new grid-based)
            let expectedSize = test.readings?.length || 25;
            if (![8, 25, 36, 49].includes(expectedSize)) {
              expectedSize = 25; // Default to 5x5 grid
            }
            
            const normalizedReadings: (number | "")[] = Array(expectedSize).fill("");
            if (Array.isArray(test.readings)) {
              test.readings.forEach((r: any, i: number) => {
                if (i < expectedSize && (typeof r === "number" || r === "")) {
                  normalizedReadings[i] = r;
                }
              });
            }
            
            const isLegacyTest = !('building' in test);
            
            const validatedTest = {
              ...test,
              readings: normalizedReadings,
              gridSize: test.gridSize || Math.sqrt(expectedSize),
              building: isLegacyTest ? (test.location || "") : (test.building ?? ""),
              location: isLegacyTest ? "" : (test.location ?? ""),
              systemType: test.systemType ?? "",
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
    
    const test: Test = {
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
      const freeArea = calculateFreeArea();
      
      const test: Test = {
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
        createdAt: Date.now(),
      };

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

  const captureTestImage = async (element: HTMLElement): Promise<string> => {
    return await toPng(element, {
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      skipFonts: false,
      cacheBust: true,
      style: {
        transform: 'none',
      }
    });
  };

  const handleExportSingleImage = async (test: Test) => {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '800px';
    tempDiv.style.minHeight = '600px';
    tempDiv.style.zIndex = '-1000';
    tempDiv.style.opacity = '1';
    tempDiv.style.visibility = 'visible';
    tempDiv.className = 'bg-background p-6 rounded-lg border-2 border-border';
    document.body.appendChild(tempDiv);

    const { createRoot } = await import('react-dom/client');
    const root = createRoot(tempDiv);
    
    const filledCount = test.readings.filter((r): r is number => typeof r === "number" && !isNaN(r)).length;
    
    await new Promise<void>((resolve) => {
      root.render(
        <div>
          <TestVisualization 
            test={test}
            average={test.average}
            filledCount={filledCount}
            passFailStatus={evaluatePassFail(test.average)}
            threshold={minVelocityThreshold}
          />
        </div>
      );
      setTimeout(resolve, 2000);
    });

    try {
      const dataUrl = await captureTestImage(tempDiv);
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
      root.unmount();
      document.body.removeChild(tempDiv);
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

    const zip = new JSZip();
    const { createRoot } = await import('react-dom/client');

    for (let i = 0; i < savedTests.length; i++) {
      const test = savedTests[i];
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px';
      tempDiv.style.minHeight = '600px';
      tempDiv.style.zIndex = '-1000';
      tempDiv.style.opacity = '1';
      tempDiv.style.visibility = 'visible';
      tempDiv.className = 'bg-background p-6 rounded-lg border-2 border-border';
      document.body.appendChild(tempDiv);

      const root = createRoot(tempDiv);
      
      const filledCount = test.readings.filter((r): r is number => typeof r === "number" && !isNaN(r)).length;
      
      await new Promise<void>((resolve) => {
        root.render(
          <div>
            <TestVisualization 
              test={test}
              average={test.average}
              filledCount={filledCount}
              passFailStatus={evaluatePassFail(test.average)}
              threshold={minVelocityThreshold}
            />
          </div>
        );
        setTimeout(resolve, 2000);
      });

      try {
        const dataUrl = await captureTestImage(tempDiv);
        const base64Data = dataUrl.split(',')[1];
        const filename = generateFilename(test, 'png').replace('.png', '');
        zip.file(`${i + 1}_${filename}.png`, base64Data, { base64: true });
      } catch (error) {
        console.error('Error generating image for test:', test.id, error);
      } finally {
        root.unmount();
        document.body.removeChild(tempDiv);
      }
    }

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

    if (!captureRef.current) {
      toast({
        title: "Export failed",
        description: "Visualization component not ready",
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
        
        // Wait for React to render the changes
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
          // Capture the visible component
          const dataUrl = await captureTestImage(captureRef.current!);
          
          if (!dataUrl || dataUrl.length < 100) {
            throw new Error('Failed to capture test visualization');
          }
          
          if (successCount > 0) pdf.addPage();
          
          // Calculate proper image dimensions using getImageProperties
          const imgProps = pdf.getImageProperties(dataUrl);
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pdfWidth = pageWidth - 20; // 10mm margins on each side
          const aspectRatio = imgProps.height / imgProps.width;
          const calculatedHeight = pdfWidth * aspectRatio;
          
          // Add test visualization at top - adjust height based on whether images exist
          const hasImages = test.damperOpenImage || test.damperClosedImage;
          
          if (hasImages) {
            // Constrained height to make room for images below
            pdf.addImage(dataUrl, 'PNG', 10, 10, pdfWidth, 140);
          } else {
            // Use calculated height to maintain aspect ratio
            pdf.addImage(dataUrl, 'PNG', 10, 10, pdfWidth, calculatedHeight);
          }
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
            
            <TestHistoryPanel 
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
      </div>
    </div>
  );
}
