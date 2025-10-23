import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Trash2, Edit, Download } from "lucide-react";
import type { Test } from "@shared/schema";

interface TestHistoryPanelProps {
  tests: Test[];
  onEdit: (test: Test) => void;
  onDelete: (id: string) => void;
  onExportSingle: (test: Test) => void;
}

export default function TestHistoryPanel({ tests, onEdit, onDelete, onExportSingle }: TestHistoryPanelProps) {
  if (tests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No saved tests yet</p>
            <p className="text-xs mt-1">Complete and save a test to begin</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Test History</span>
          <Badge variant="secondary" data-testid="badge-test-count">
            {tests.length} test{tests.length !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-3">
            {tests.map((test) => (
              <Card key={test.id} className="hover-elevate">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {test.location || "Unknown Location"}
                        {test.floorNumber && ` - ${test.floorNumber}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {test.testDate}
                      </p>
                    </div>
                    <Badge className="shrink-0">
                      {test.average.toFixed(2)} m/s
                    </Badge>
                  </div>
                  
                  {test.shaftId && (
                    <p className="text-xs text-muted-foreground">
                      ID: {test.shaftId}
                    </p>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(test)}
                      className="flex-1"
                      data-testid={`button-edit-${test.id}`}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onExportSingle(test)}
                      data-testid={`button-export-${test.id}`}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(test.id)}
                      data-testid={`button-delete-${test.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
