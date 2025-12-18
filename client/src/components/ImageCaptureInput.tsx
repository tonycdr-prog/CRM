import { compressImage } from "@/lib/image";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState, useMemo } from "react";
import CapturePreviewModal from "@/components/CapturePreviewModal";

interface ImageCaptureInputProps {
  onFileReady: (file: File) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export default function ImageCaptureInput({
  onFileReady,
  disabled,
  className,
  label,
}: ImageCaptureInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const previewUrl = useMemo(
    () => (pendingFile ? URL.createObjectURL(pendingFile) : null),
    [pendingFile]
  );

  async function handlePicked(file: File) {
    let processed: File = file;

    if (file.type.startsWith("image/")) {
      processed = await compressImage(file);
    }

    setPendingFile(processed);
    setPendingType(file.type || processed.type || null);
    setOpen(true);
  }

  function cleanup() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPendingType(null);
  }

  function onConfirm() {
    if (!pendingFile) return;
    cleanup();
    setOpen(false);
    onFileReady(pendingFile);
  }

  function onRetake() {
    cleanup();
    setOpen(false);
    setTimeout(() => inputRef.current?.click(), 100);
  }

  function onClose() {
    cleanup();
    setOpen(false);
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        disabled={disabled}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          await handlePicked(file);
        }}
        className="hidden"
        data-testid="input-camera-capture"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        data-testid="button-camera-capture"
      >
        <Camera className="h-4 w-4 mr-2" />
        {label ?? "Take Photo"}
      </Button>

      <CapturePreviewModal
        open={open}
        previewUrl={previewUrl}
        fileType={pendingType}
        onRetake={onRetake}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    </div>
  );
}
