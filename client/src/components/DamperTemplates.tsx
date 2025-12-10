import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Bookmark, Trash2 } from "lucide-react";
import { DamperTemplate } from "@shared/schema";
import { nanoid } from "nanoid";
import { useToast } from "@/hooks/use-toast";

interface DamperTemplatesProps {
  templates: Record<string, DamperTemplate>;
  onSaveTemplate: (template: DamperTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onApplyTemplate: (template: DamperTemplate) => void;
  currentConfig: {
    damperWidth: number | "";
    damperHeight: number | "";
    systemType: "push" | "pull" | "push-pull" | "";
    location: string;
    shaftId: string;
  };
}

export default function DamperTemplates({
  templates,
  onSaveTemplate,
  onDeleteTemplate,
  onApplyTemplate,
  currentConfig,
}: DamperTemplatesProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const { toast } = useToast();

  const templateList = Object.values(templates).sort(
    (a, b) => b.createdAt - a.createdAt
  );

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the template",
        variant: "destructive",
      });
      return;
    }

    if (
      typeof currentConfig.damperWidth !== "number" ||
      typeof currentConfig.damperHeight !== "number"
    ) {
      toast({
        title: "Dimensions required",
        description: "Please enter damper dimensions before saving a template",
        variant: "destructive",
      });
      return;
    }

    const template: DamperTemplate = {
      id: nanoid(),
      name: templateName.trim(),
      description: templateDescription.trim() || undefined,
      damperWidth: currentConfig.damperWidth,
      damperHeight: currentConfig.damperHeight,
      systemType: currentConfig.systemType,
      location: currentConfig.location || undefined,
      shaftId: currentConfig.shaftId || undefined,
      createdAt: Date.now(),
    };

    onSaveTemplate(template);
    setTemplateName("");
    setTemplateDescription("");
    setIsDialogOpen(false);

    toast({
      title: "Template saved",
      description: `"${template.name}" has been saved`,
    });
  };

  const handleApply = (template: DamperTemplate) => {
    onApplyTemplate(template);
    toast({
      title: "Template applied",
      description: `"${template.name}" configuration loaded`,
    });
  };

  const handleDelete = (template: DamperTemplate) => {
    onDeleteTemplate(template.id);
    toast({
      title: "Template deleted",
      description: `"${template.name}" has been removed`,
    });
  };

  const getGridSizeLabel = (width: number, height: number): string => {
    const maxDim = Math.max(width, height);
    if (maxDim <= 610) return "5×5";
    if (maxDim <= 914) return "6×6";
    return "7×7";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <Bookmark className="h-4 w-4" />
          Damper Templates
        </Label>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              data-testid="button-save-template"
            >
              <Plus className="h-3 w-3 mr-1" />
              Save Current
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save as Template</DialogTitle>
              <DialogDescription>
                Save the current damper configuration for quick reuse
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  placeholder="e.g., Standard 600x600 Extract"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  data-testid="input-template-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-description">
                  Description (optional)
                </Label>
                <Input
                  id="template-description"
                  placeholder="e.g., For standard extract dampers"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  data-testid="input-template-description"
                />
              </div>
              <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                <div className="font-medium">Current Configuration:</div>
                <div>
                  Dimensions:{" "}
                  {typeof currentConfig.damperWidth === "number"
                    ? `${currentConfig.damperWidth} × ${currentConfig.damperHeight} mm`
                    : "Not set"}
                </div>
                <div>
                  System Type:{" "}
                  {currentConfig.systemType || "Not set"}
                </div>
                {currentConfig.location && (
                  <div>Location: {currentConfig.location}</div>
                )}
                {currentConfig.shaftId && (
                  <div>Shaft ID: {currentConfig.shaftId}</div>
                )}
              </div>
              <Button
                onClick={handleSaveTemplate}
                className="w-full"
                data-testid="button-confirm-save-template"
              >
                Save Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templateList.length > 0 ? (
        <div className="grid gap-2">
          {templateList.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-2 border rounded-md bg-card"
              data-testid={`template-${template.id}`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {template.name}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                  <span>
                    {template.damperWidth} × {template.damperHeight} mm
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {getGridSizeLabel(template.damperWidth, template.damperHeight)}
                  </Badge>
                  {template.systemType && (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {template.systemType}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleApply(template)}
                  data-testid={`button-apply-template-${template.id}`}
                >
                  Apply
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(template)}
                  data-testid={`button-delete-template-${template.id}`}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-3">
          No templates saved yet. Configure a damper and save it as a template
          for quick reuse.
        </p>
      )}
    </div>
  );
}
