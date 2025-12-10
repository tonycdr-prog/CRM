import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ClipboardCheck,
  Download,
  RotateCcw
} from "lucide-react";
import { BS_EN_12101_8_CHECKLIST, ComplianceChecklistItem } from "@shared/schema";

interface ComplianceChecklistProps {
  inspectionType: "commissioning" | "annual" | "remedial";
  onComplete?: (items: ComplianceChecklistItem[], notes: string) => void;
}

const INSPECTION_TYPE_STATEMENTS = {
  commissioning: {
    title: "Commissioning Inspection",
    description: "Initial system verification and testing",
    statement: "This commissioning inspection has been conducted in accordance with BS EN 12101-8:2020 and BSRIA BG 49/2024. All smoke control dampers have been verified for correct installation, operation, and performance. The system has been tested under design conditions and found to meet the specified requirements.",
  },
  annual: {
    title: "Annual Inspection",
    description: "Routine maintenance and performance verification",
    statement: "This annual inspection has been conducted in accordance with BS EN 12101-8:2020 maintenance requirements. All smoke control dampers have been tested for correct operation and airflow performance. Any deficiencies identified during this inspection are noted in the recommendations section.",
  },
  remedial: {
    title: "Remedial/Reactive Inspection",
    description: "Investigation following reported fault or incident",
    statement: "This remedial inspection has been conducted following a reported system fault or deficiency. The inspection has identified the cause of the reported issue and verified the effectiveness of any corrective actions taken. The system has been re-tested to confirm compliance with design requirements.",
  },
};

export function ComplianceChecklist({ inspectionType, onComplete }: ComplianceChecklistProps) {
  const [checklistItems, setChecklistItems] = useState<ComplianceChecklistItem[]>(
    BS_EN_12101_8_CHECKLIST.map(item => ({
      ...item,
      checked: false,
      notes: "",
    }))
  );
  const [generalNotes, setGeneralNotes] = useState("");

  const categories = useMemo(() => {
    const cats = new Map<string, ComplianceChecklistItem[]>();
    checklistItems.forEach(item => {
      if (!cats.has(item.category)) {
        cats.set(item.category, []);
      }
      cats.get(item.category)!.push(item);
    });
    return cats;
  }, [checklistItems]);

  const stats = useMemo(() => {
    const total = checklistItems.length;
    const checked = checklistItems.filter(i => i.checked).length;
    const withNotes = checklistItems.filter(i => i.notes.trim()).length;
    return { total, checked, withNotes, percentage: (checked / total) * 100 };
  }, [checklistItems]);

  const toggleItem = (id: string) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const updateItemNotes = (id: string, notes: string) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === id ? { ...item, notes } : item
      )
    );
  };

  const resetChecklist = () => {
    setChecklistItems(
      BS_EN_12101_8_CHECKLIST.map(item => ({
        ...item,
        checked: false,
        notes: "",
      }))
    );
    setGeneralNotes("");
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(checklistItems, generalNotes);
    }
  };

  const inspectionInfo = INSPECTION_TYPE_STATEMENTS[inspectionType];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card data-testid="card-checklist-header">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                {inspectionInfo.title}
              </CardTitle>
              <CardDescription>{inspectionInfo.description}</CardDescription>
            </div>
            <Badge variant={stats.percentage === 100 ? "default" : "secondary"}>
              {stats.checked} / {stats.total} complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={stats.percentage} className="mb-4" />
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Compliance Statement
            </h4>
            <p className="text-sm text-muted-foreground">{inspectionInfo.statement}</p>
          </div>
        </CardContent>
      </Card>

      {/* Checklist by Category */}
      <Card data-testid="card-checklist-items">
        <CardHeader>
          <CardTitle className="text-base">BS EN 12101-8 Checklist</CardTitle>
          <CardDescription>Verify each requirement and add notes where applicable</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full" defaultValue={Array.from(categories.keys())}>
            {Array.from(categories.entries()).map(([category, items]) => {
              const categoryComplete = items.every(i => i.checked);
              const categoryCount = items.filter(i => i.checked).length;
              
              return (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      {categoryComplete ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span>{category}</span>
                      <Badge variant="outline" className="ml-2">
                        {categoryCount}/{items.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {items.map((item) => (
                        <div 
                          key={item.id} 
                          className="space-y-2 p-3 bg-muted/50 rounded-lg"
                          data-testid={`checklist-item-${item.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={item.id}
                              checked={item.checked}
                              onCheckedChange={() => toggleItem(item.id)}
                              data-testid={`checkbox-${item.id}`}
                            />
                            <div className="flex-1">
                              <Label 
                                htmlFor={item.id} 
                                className={`cursor-pointer ${item.checked ? "line-through text-muted-foreground" : ""}`}
                              >
                                {item.requirement}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                Ref: {item.reference}
                              </p>
                            </div>
                          </div>
                          <Textarea
                            placeholder="Add notes if required..."
                            value={item.notes}
                            onChange={(e) => updateItemNotes(item.id, e.target.value)}
                            className="text-sm"
                            rows={2}
                            data-testid={`notes-${item.id}`}
                          />
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* General Notes */}
      <Card data-testid="card-general-notes">
        <CardHeader>
          <CardTitle className="text-base">General Notes & Recommendations</CardTitle>
          <CardDescription>Additional observations and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter any additional notes, observations, or recommendations..."
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            rows={4}
            data-testid="textarea-general-notes"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={resetChecklist}
          data-testid="button-reset-checklist"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button 
          className="flex-1"
          onClick={handleComplete}
          disabled={stats.percentage < 100}
          data-testid="button-complete-checklist"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Complete Checklist
        </Button>
      </div>
    </div>
  );
}

export default ComplianceChecklist;
