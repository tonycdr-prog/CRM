import { compressImage } from "@/lib/image";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

interface ImageCaptureInputProps {
  onFileReady: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export default function ImageCaptureInput({
  onFileReady,
  disabled,
  className,
}: ImageCaptureInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const compressed = await compressImage(file);
      onFileReady(compressed);
    } else {
      onFileReady(file);
    }

    e.target.value = "";
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        disabled={disabled}
        onChange={onChange}
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
        Take Photo
      </Button>
    </div>
  );
}
