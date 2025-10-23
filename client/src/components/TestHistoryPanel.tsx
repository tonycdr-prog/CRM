import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Trash2, Edit, Download, CheckCircle2, XCircle } from "lucide-react";
import type { Test } from "@shared/schema";

interface TestHistoryPanelProps {
  tests: Test[];
  onEdit: (test: Test) => void;
  onDelete: (id: string) => void;
  onExportSingle: (test: Test) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  onDeleteSelected?: () => void;
  minVelocityThreshold?: number;
}

export default function TestHistoryPanel({ 
  tests, 
  onEdit, 
  onDelete, 
  onExportSingle,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onDeleteSelected,
  minVelocityThreshold
}: TestHistoryPanelProps) {
  const hasSelection = selectedIds && selectedIds.size > 0;
  const allSelected = selectedIds && tests.length > 0 && tests.every(test => selectedIds.has(test.id));

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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onToggleSelectAll && (
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => onToggleSelectAll()}
                data-testid="checkbox-select-all"
              />
            )}
            <CardTitle className="text-lg">Test History</CardTitle>
          </div>
          <Badge variant="secondary" data-testid="badge-test-count">
            {tests.length} test{tests.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        {hasSelection && onDeleteSelected && (
          <div className="mt-3">
            <Button
              onClick={onDeleteSelected}
              variant="destructive"
              size="sm"
              className="w-full"
              data-testid="button-delete-selected"
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Delete {selectedIds.size} Selected
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-3">
            {tests.map((test) => (
              <Card key={test.id} className="hover-elevate">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    {onToggleSelect && (
                      <Checkbox
                        checked={selectedIds?.has(test.id) || false}
                        onCheckedChange={() => onToggleSelect(test.id)}
                        data-testid={`checkbox-${test.id}`}
                        className="mt-1"
                      />
                    )}
                    <div className="flex items-start justify-between gap-2 flex-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {test.building || "Unknown Building"}
                          {test.floorNumber && ` - ${test.floorNumber}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {test.testDate}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Badge className="shrink-0">
                          {test.average.toFixed(2)} m/s
                        </Badge>
                        {minVelocityThreshold !== undefined && (
                          test.average >= minVelocityThreshold ? (
                            <Badge className="bg-green-600 hover:bg-green-700 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Pass
                            </Badge>
                          ) : (
                            <Badge className="bg-red-600 hover:bg-red-700 text-xs">
                              <XCircle className="w-3 h-3 mr-1" />
                              Fail
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-0.5">
                    {test.location && (
                      <p className="text-xs text-muted-foreground">
                        Location: {test.location}
                      </p>
                    )}
                    {test.shaftId && (
                      <p className="text-xs text-muted-foreground">
                        Shaft ID: {test.shaftId}
                      </p>
                    )}
                    {test.systemType && (
                      <p className="text-xs text-muted-foreground">
                        System: {test.systemType === "push-pull" ? "Push/Pull" : test.systemType.charAt(0).toUpperCase() + test.systemType.slice(1)}
                      </p>
                    )}
                  </div>
                  
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
