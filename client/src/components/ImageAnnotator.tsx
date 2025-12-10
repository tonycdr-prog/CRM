import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Circle,
  Square,
  ArrowUp,
  Type,
  Undo,
  Trash2,
  Pencil,
  MousePointer2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AnnotationType = "arrow" | "circle" | "rectangle" | "text" | "freehand";

interface Point {
  x: number;
  y: number;
}

interface Annotation {
  id: string;
  type: AnnotationType;
  startPoint: Point;
  endPoint?: Point;
  points?: Point[]; // For freehand
  text?: string;
  color: string;
  strokeWidth: number;
}

interface ImageAnnotatorProps {
  image: string;
  onSave: (annotatedImage: string) => void;
  onCancel: () => void;
  open: boolean;
}

const COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ffffff", // white
  "#000000", // black
];

export function ImageAnnotator({ image, onSave, onCancel, open }: ImageAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<AnnotationType | "select">("arrow");
  const [color, setColor] = useState("#ef4444");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textPosition, setTextPosition] = useState<Point | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load the image
  useEffect(() => {
    if (!image || !open) return;
    
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      
      // Calculate canvas size to fit in dialog while maintaining aspect ratio
      const maxWidth = Math.min(800, window.innerWidth - 100);
      const maxHeight = Math.min(600, window.innerHeight - 300);
      
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }
      
      if (height > maxHeight) {
        const ratio = maxHeight / height;
        height = maxHeight;
        width = width * ratio;
      }
      
      setCanvasSize({ width: Math.round(width), height: Math.round(height) });
      setImageLoaded(true);
    };
    img.src = image;
    
    return () => {
      setImageLoaded(false);
      setAnnotations([]);
    };
  }, [image, open]);

  // Redraw canvas whenever annotations change
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !imageRef.current || !imageLoaded) return;

    // Clear and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    // Draw all annotations
    [...annotations, currentAnnotation].filter(Boolean).forEach((ann) => {
      if (!ann) return;
      drawAnnotation(ctx, ann);
    });
  }, [annotations, currentAnnotation, imageLoaded]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const drawAnnotation = (ctx: CanvasRenderingContext2D, ann: Annotation) => {
    ctx.strokeStyle = ann.color;
    ctx.fillStyle = ann.color;
    ctx.lineWidth = ann.strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (ann.type) {
      case "arrow":
        if (ann.endPoint) {
          drawArrow(ctx, ann.startPoint, ann.endPoint, ann.strokeWidth);
        }
        break;
      case "circle":
        if (ann.endPoint) {
          const radius = Math.hypot(
            ann.endPoint.x - ann.startPoint.x,
            ann.endPoint.y - ann.startPoint.y
          );
          ctx.beginPath();
          ctx.arc(ann.startPoint.x, ann.startPoint.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      case "rectangle":
        if (ann.endPoint) {
          const width = ann.endPoint.x - ann.startPoint.x;
          const height = ann.endPoint.y - ann.startPoint.y;
          ctx.strokeRect(ann.startPoint.x, ann.startPoint.y, width, height);
        }
        break;
      case "text":
        if (ann.text) {
          ctx.font = `${ann.strokeWidth * 6}px sans-serif`;
          ctx.fillText(ann.text, ann.startPoint.x, ann.startPoint.y);
        }
        break;
      case "freehand":
        if (ann.points && ann.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(ann.points[0].x, ann.points[0].y);
          for (let i = 1; i < ann.points.length; i++) {
            ctx.lineTo(ann.points[i].x, ann.points[i].y);
          }
          ctx.stroke();
        }
        break;
    }
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    start: Point,
    end: Point,
    lineWidth: number
  ) => {
    const headLength = Math.max(15, lineWidth * 4);
    const angle = Math.atan2(end.y - start.y, end.x - start.x);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Handle both mouse and touch events
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
      clientY = e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (tool === "select") return;
    
    // Prevent scrolling on touch
    if ('touches' in e) {
      e.preventDefault();
    }
    
    const point = getCanvasPoint(e);
    setIsDrawing(true);

    if (tool === "text") {
      setTextPosition(point);
      return;
    }

    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}`,
      type: tool,
      startPoint: point,
      endPoint: tool === "freehand" ? undefined : point,
      points: tool === "freehand" ? [point] : undefined,
      color,
      strokeWidth,
    };
    setCurrentAnnotation(newAnnotation);
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation || tool === "text") return;
    
    // Prevent scrolling on touch
    if ('touches' in e) {
      e.preventDefault();
    }

    const point = getCanvasPoint(e);

    if (tool === "freehand") {
      setCurrentAnnotation({
        ...currentAnnotation,
        points: [...(currentAnnotation.points || []), point],
      });
    } else {
      setCurrentAnnotation({
        ...currentAnnotation,
        endPoint: point,
      });
    }
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentAnnotation && tool !== "text") {
      // Only save if there's meaningful drawing
      const hasContent =
        tool === "freehand"
          ? (currentAnnotation.points?.length || 0) > 2
          : currentAnnotation.endPoint &&
            (Math.abs(currentAnnotation.endPoint.x - currentAnnotation.startPoint.x) > 5 ||
              Math.abs(currentAnnotation.endPoint.y - currentAnnotation.startPoint.y) > 5);

      if (hasContent) {
        setAnnotations([...annotations, currentAnnotation]);
      }
      setCurrentAnnotation(null);
    }
  };

  const handleTextSubmit = () => {
    if (!textPosition || !textInput.trim()) {
      setTextPosition(null);
      setTextInput("");
      return;
    }

    const textAnnotation: Annotation = {
      id: `ann-${Date.now()}`,
      type: "text",
      startPoint: textPosition,
      text: textInput.trim(),
      color,
      strokeWidth,
    };

    setAnnotations([...annotations, textAnnotation]);
    setTextPosition(null);
    setTextInput("");
    setIsDrawing(false);
  };

  const handleUndo = () => {
    setAnnotations(annotations.slice(0, -1));
  };

  const handleClearAll = () => {
    setAnnotations([]);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Auto-submit any pending text annotation
    if (textPosition && textInput.trim()) {
      const textAnnotation: Annotation = {
        id: `ann-${Date.now()}`,
        type: "text",
        startPoint: textPosition,
        text: textInput.trim(),
        color,
        strokeWidth,
      };
      
      // Redraw canvas with the pending text annotation
      const ctx = canvas.getContext("2d");
      if (ctx && imageRef.current) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
        [...annotations, textAnnotation].forEach((ann) => drawAnnotation(ctx, ann));
      }
    }

    // Get the annotated image as data URL
    const annotatedImage = canvas.toDataURL("image/jpeg", 0.9);
    onSave(annotatedImage);
  };

  const toolButtons = [
    { id: "select" as const, icon: MousePointer2, label: "Select" },
    { id: "arrow" as const, icon: ArrowUp, label: "Arrow" },
    { id: "circle" as const, icon: Circle, label: "Circle" },
    { id: "rectangle" as const, icon: Square, label: "Rectangle" },
    { id: "freehand" as const, icon: Pencil, label: "Freehand" },
    { id: "text" as const, icon: Type, label: "Text" },
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Annotate Image</DialogTitle>
          <DialogDescription>
            Add arrows, shapes, and text to highlight areas of interest
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="flex flex-wrap gap-2 mb-3">
            {toolButtons.map((t) => (
              <Button
                key={t.id}
                size="sm"
                variant={tool === t.id ? "default" : "outline"}
                onClick={() => setTool(t.id)}
                data-testid={`button-tool-${t.id}`}
              >
                <t.icon className="h-4 w-4 mr-1" />
                {t.label}
              </Button>
            ))}
            <div className="flex-1" />
            <Button
              size="sm"
              variant="outline"
              onClick={handleUndo}
              disabled={annotations.length === 0}
              data-testid="button-undo"
            >
              <Undo className="h-4 w-4 mr-1" />
              Undo
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearAll}
              disabled={annotations.length === 0}
              data-testid="button-clear-annotations"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 mb-3 items-center">
            <div className="flex gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-transform",
                    color === c ? "border-primary scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  data-testid={`button-color-${c.replace("#", "")}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 min-w-[150px]">
              <Label className="text-xs whitespace-nowrap">Stroke:</Label>
              <Slider
                value={[strokeWidth]}
                onValueChange={(v) => setStrokeWidth(v[0])}
                min={1}
                max={8}
                step={1}
                className="flex-1"
                data-testid="slider-stroke"
              />
              <span className="text-xs text-muted-foreground w-4">{strokeWidth}</span>
            </div>
          </div>

          <div
            ref={containerRef}
            className="relative bg-muted rounded-lg overflow-hidden flex items-center justify-center"
            style={{ minHeight: 300 }}
          >
            {imageLoaded ? (
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className="cursor-crosshair max-w-full"
                style={{ maxHeight: "60vh" }}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
                data-testid="canvas-annotator"
              />
            ) : (
              <div className="text-muted-foreground">Loading image...</div>
            )}

            {textPosition && (
              <div
                className="absolute bg-background p-2 rounded shadow-lg border"
                style={{
                  left: Math.min(textPosition.x, canvasSize.width - 200),
                  top: Math.min(textPosition.y, canvasSize.height - 50),
                }}
              >
                <div className="flex gap-1">
                  <Input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter text..."
                    className="h-8 w-40"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTextSubmit();
                      if (e.key === "Escape") {
                        setTextPosition(null);
                        setTextInput("");
                      }
                    }}
                    data-testid="input-annotation-text"
                  />
                  <Button
                    size="icon"
                    variant="default"
                    className="h-8 w-8"
                    onClick={handleTextSubmit}
                    data-testid="button-submit-text"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} data-testid="button-cancel-annotate">
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="button-save-annotated">
            Save Annotated Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ImageAnnotator;
