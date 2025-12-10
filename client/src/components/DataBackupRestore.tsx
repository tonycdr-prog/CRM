import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2,
  HardDrive
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportData, importData, getStorageSize, type StorageData } from "@/lib/storage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DataBackupRestoreProps {
  onDataImported: (data: StorageData) => void;
}

export default function DataBackupRestore({ onDataImported }: DataBackupRestoreProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleExport = () => {
    try {
      const jsonData = exportData();
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `airflow-data-backup-${dateStr}.json`;
      
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup created",
        description: `Data exported to ${filename}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Could not create backup file",
        variant: "destructive",
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const text = await file.text();
      const data = importData(text);
      
      onDataImported(data);
      
      const testCount = Object.keys(data.tests).length;
      const stairwellCount = Object.keys(data.stairwellTests).length;
      
      toast({
        title: "Data restored",
        description: `Imported ${testCount} damper test(s) and ${stairwellCount} stairwell test(s)`,
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Could not restore data from file",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const storageSize = getStorageSize();
  const storagePercent = Math.min(100, (storageSize / (5 * 1024 * 1024)) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <HardDrive className="w-4 h-4" />
          Data Backup & Restore
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Local Storage Used</span>
            <span className="font-medium">{formatBytes(storageSize)} / 5 MB</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                storagePercent > 80 
                  ? "bg-red-500" 
                  : storagePercent > 60 
                    ? "bg-amber-500" 
                    : "bg-green-500"
              }`}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
          {storagePercent > 80 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Storage nearly full. Consider exporting a backup.
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex-1"
            data-testid="button-export-backup"
          >
            <Download className="w-3 h-3 mr-1" />
            Export Backup
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={isImporting}
                data-testid="button-import-backup"
              >
                <Upload className="w-3 h-3 mr-1" />
                {isImporting ? "Importing..." : "Restore Backup"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restore from Backup?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will replace all current data with the backup file. 
                  Any unsaved changes will be lost. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleImportClick}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
            data-testid="input-import-file"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Regular backups protect your data from being lost if browser storage is cleared.
        </p>
      </CardContent>
    </Card>
  );
}
