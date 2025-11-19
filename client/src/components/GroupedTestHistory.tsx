import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FileText, 
  Trash2, 
  Edit, 
  Download, 
  CheckCircle2, 
  XCircle,
  ChevronDown,
  ChevronRight,
  Calendar,
  Building2
} from "lucide-react";
import type { Test } from "@shared/schema";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface GroupedTestHistoryProps {
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

interface SiteVisit {
  building: string;
  date: string;
  tests: Test[];
}

function groupTestsByVisit(tests: Test[]): SiteVisit[] {
  const groups = new Map<string, Test[]>();
  
  tests.forEach(test => {
    // Normalize building name and date for consistent grouping
    const normalizedBuilding = test.building.trim().toLowerCase();
    const normalizedDate = test.testDate.trim();
    const key = `${normalizedBuilding}|${normalizedDate}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(test);
  });
  
  const siteVisits: SiteVisit[] = [];
  groups.forEach((tests, key) => {
    const [, date] = key.split('|');
    // Use the original building name from the first test (preserves casing for display)
    const building = tests[0].building;
    siteVisits.push({ building, date, tests });
  });
  
  // Sort by date descending (most recent first)
  siteVisits.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });
  
  return siteVisits;
}

export default function GroupedTestHistory({ 
  tests, 
  onEdit, 
  onDelete, 
  onExportSingle,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onDeleteSelected,
  minVelocityThreshold = 2.0
}: GroupedTestHistoryProps) {
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set());
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

  const siteVisits = groupTestsByVisit(tests);

  const toggleVisit = (visitKey: string) => {
    const newExpanded = new Set(expandedVisits);
    if (newExpanded.has(visitKey)) {
      newExpanded.delete(visitKey);
    } else {
      newExpanded.add(visitKey);
    }
    setExpandedVisits(newExpanded);
  };

  const toggleVisitSelection = (visitTests: Test[]) => {
    if (!onToggleSelect) return;
    
    const allVisitTestsSelected = visitTests.every(t => selectedIds?.has(t.id));
    
    // Only toggle tests that need to change state
    visitTests.forEach(test => {
      const isCurrentlySelected = selectedIds?.has(test.id) || false;
      const shouldBeSelected = !allVisitTestsSelected;
      
      // Only toggle if the current state differs from desired state
      if (isCurrentlySelected !== shouldBeSelected) {
        onToggleSelect(test.id);
      }
    });
  };

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
            {siteVisits.map((visit) => {
              const visitKey = `${visit.building}|${visit.date}`;
              const isExpanded = expandedVisits.has(visitKey);
              const passCount = visit.tests.filter(t => t.average >= minVelocityThreshold).length;
              const failCount = visit.tests.length - passCount;
              const allVisitTestsSelected = visit.tests.every(t => selectedIds?.has(t.id));
              const someVisitTestsSelected = visit.tests.some(t => selectedIds?.has(t.id));

              return (
                <Card key={visitKey} className="hover-elevate">
                  <Collapsible
                    open={isExpanded}
                    onOpenChange={() => toggleVisit(visitKey)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-start gap-2">
                        {onToggleSelect && (
                          <Checkbox
                            checked={allVisitTestsSelected}
                            onCheckedChange={() => toggleVisitSelection(visit.tests)}
                            data-testid={`checkbox-visit-${visitKey}`}
                            className="mt-1"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start p-0 h-auto hover:bg-transparent"
                              data-testid={`button-toggle-${visitKey}`}
                            >
                              <div className="flex items-start gap-2 flex-1">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 mt-0.5 shrink-0" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 mt-0.5 shrink-0" />
                                )}
                                <div className="flex-1 text-left">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-semibold text-sm">
                                      {visit.building}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {visit.tests.length} test{visit.tests.length !== 1 ? "s" : ""}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    {visit.date}
                                  </div>
                                </div>
                              </div>
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          {passCount > 0 && (
                            <Badge className="bg-green-600 hover:bg-green-700 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {passCount} Pass
                            </Badge>
                          )}
                          {failCount > 0 && (
                            <Badge className="bg-red-600 hover:bg-red-700 text-xs">
                              <XCircle className="w-3 h-3 mr-1" />
                              {failCount} Fail
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CollapsibleContent>
                      <CardContent className="p-4 pt-0 space-y-2">
                        {visit.tests
                          .sort((a, b) => {
                            // Sort by floor number within the visit
                            const floorA = a.floorNumber || "";
                            const floorB = b.floorNumber || "";
                            return floorA.localeCompare(floorB);
                          })
                          .map((test) => {
                            const passed = test.average >= minVelocityThreshold;
                            return (
                              <Card key={test.id} className="bg-muted/30 border-muted">
                                <CardContent className="p-3 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-sm">
                                        Floor {test.floorNumber}
                                      </p>
                                      <div className="space-y-0.5 mt-1">
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
                                    </div>
                                    <div className="flex flex-col gap-1 shrink-0">
                                      <Badge className="shrink-0">
                                        {test.average.toFixed(2)} m/s
                                      </Badge>
                                      {passed ? (
                                        <Badge className="bg-green-600 hover:bg-green-700 text-xs">
                                          <CheckCircle2 className="w-3 h-3 mr-1" />
                                          Pass
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-red-600 hover:bg-red-700 text-xs">
                                          <XCircle className="w-3 h-3 mr-1" />
                                          Fail
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-2 pt-1">
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
                            );
                          })}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
