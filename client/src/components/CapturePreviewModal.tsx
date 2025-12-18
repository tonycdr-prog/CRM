import { Button } from "@/components/ui/button";

interface CapturePreviewModalProps {
  open: boolean;
  previewUrl: string | null;
  fileType: string | null;
  onRetake: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function CapturePreviewModal({
  open,
  previewUrl,
  fileType,
  onRetake,
  onConfirm,
  onClose,
}: CapturePreviewModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg w-full max-w-md p-4 space-y-3">
        <div className="font-semibold">Preview</div>

        <div className="border rounded-md overflow-hidden">
          {fileType?.startsWith("image/") && previewUrl ? (
            <img
              src={previewUrl}
              alt="preview"
              className="w-full h-auto"
              data-testid="img-capture-preview"
            />
          ) : (
            <div className="p-6 text-sm text-muted-foreground">
              No preview available
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={onRetake}
            data-testid="button-capture-retake"
          >
            Retake
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-capture-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            data-testid="button-capture-confirm"
          >
            Use this
          </Button>
        </div>
      </div>
    </div>
  );
}
