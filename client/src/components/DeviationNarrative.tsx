import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  CheckCircle2, 
  FileWarning,
  Wrench
} from "lucide-react";
import { FAILURE_REASON_CODES, FailureReasonCode } from "@shared/schema";

interface DeviationNarrativeProps {
  testId: string;
  average: number;
  threshold?: number;
  failureReasonCode?: string;
  failureNarrative?: string;
  correctiveAction?: string;
  onChange: (data: {
    failureReasonCode?: string;
    failureNarrative?: string;
    correctiveAction?: string;
  }) => void;
}

const CORRECTIVE_ACTION_TEMPLATES = [
  "Clean damper blades and verify operation",
  "Check and adjust actuator linkage",
  "Replace actuator - unit seized",
  "Clear obstruction from ductwork",
  "Re-balance system airflow",
  "Replace damper seals",
  "Schedule full damper replacement",
  "Investigate fan performance",
  "No action required - monitoring",
];

export function DeviationNarrative({
  testId,
  average,
  threshold = 1.0,
  failureReasonCode,
  failureNarrative,
  correctiveAction,
  onChange,
}: DeviationNarrativeProps) {
  const isPassing = average >= threshold;
  const [showNarrative, setShowNarrative] = useState(!isPassing || !!failureReasonCode);

  const selectedReason = FAILURE_REASON_CODES.find(r => r.code === failureReasonCode);

  if (isPassing && !showNarrative) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950" data-testid="card-pass-status">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">Test Passed</div>
                <div className="text-sm text-muted-foreground">
                  Average velocity {average.toFixed(2)} m/s meets minimum requirement
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNarrative(true)}
              data-testid="button-add-notes"
            >
              Add Notes
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={!isPassing ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950" : ""}
      data-testid="card-deviation-narrative"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {!isPassing ? (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          ) : (
            <FileWarning className="h-5 w-5 text-muted-foreground" />
          )}
          <CardTitle className="text-base">
            {!isPassing ? "Test Failed - Deviation Narrative Required" : "Additional Notes"}
          </CardTitle>
        </div>
        {!isPassing && (
          <CardDescription>
            Average velocity {average.toFixed(2)} m/s is below the {threshold} m/s threshold
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Failure Reason Code */}
        <div className="space-y-2">
          <Label>Failure Reason</Label>
          <Select 
            value={failureReasonCode || ""} 
            onValueChange={(value) => onChange({ 
              failureReasonCode: value, 
              failureNarrative, 
              correctiveAction 
            })}
          >
            <SelectTrigger data-testid="select-failure-reason">
              <SelectValue placeholder="Select reason..." />
            </SelectTrigger>
            <SelectContent>
              {FAILURE_REASON_CODES.map(reason => (
                <SelectItem key={reason.code} value={reason.code}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {reason.category}
                    </Badge>
                    {reason.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedReason && (
            <Badge variant="secondary" className="mt-1">
              Category: {selectedReason.category}
            </Badge>
          )}
        </div>

        {/* Failure Narrative */}
        <div className="space-y-2">
          <Label>Detailed Narrative</Label>
          <Textarea
            placeholder="Describe the observed condition, symptoms, and any relevant details..."
            value={failureNarrative || ""}
            onChange={(e) => onChange({ 
              failureReasonCode, 
              failureNarrative: e.target.value, 
              correctiveAction 
            })}
            rows={3}
            data-testid="textarea-narrative"
          />
          <p className="text-xs text-muted-foreground">
            This narrative will be included in the test report
          </p>
        </div>

        {/* Corrective Action */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <Label>Recommended Corrective Action</Label>
          </div>
          <Select 
            value={correctiveAction || "custom"} 
            onValueChange={(value) => {
              if (value !== "custom") {
                onChange({ 
                  failureReasonCode, 
                  failureNarrative, 
                  correctiveAction: value 
                });
              }
            }}
          >
            <SelectTrigger data-testid="select-corrective-action">
              <SelectValue placeholder="Select or type custom action..." />
            </SelectTrigger>
            <SelectContent>
              {CORRECTIVE_ACTION_TEMPLATES.map((action, index) => (
                <SelectItem key={index} value={action}>
                  {action}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom action...</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Enter corrective action details..."
            value={correctiveAction || ""}
            onChange={(e) => onChange({ 
              failureReasonCode, 
              failureNarrative, 
              correctiveAction: e.target.value 
            })}
            rows={2}
            data-testid="textarea-corrective-action"
          />
        </div>

        {isPassing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowNarrative(false);
              onChange({ failureReasonCode: undefined, failureNarrative: undefined, correctiveAction: undefined });
            }}
            data-testid="button-clear-notes"
          >
            Clear Notes
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default DeviationNarrative;
