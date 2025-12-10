import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, X, Pencil } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import ImageAnnotator from "./ImageAnnotator";

interface ImageUploadProps {
  label: string;
  value?: string;
  onChange: (imageData: string | undefined) => void;
  testId: string;
}

export function ImageUpload({ label, value, onChange, testId }: ImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const handleCamera = async () => {
    try {
      setIsLoading(true);
      const image = await CapacitorCamera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        if (!image.dataUrl.startsWith('data:')) {
          console.error('Camera returned non-data URL:', image.dataUrl);
          alert('Camera error: Image format not supported. Please try again or use gallery.');
          return;
        }
        onChange(image.dataUrl);
      } else {
        console.error('Camera did not return dataUrl');
        alert('Failed to capture image. Please try again.');
      }
    } catch (error) {
      console.error("Camera error:", error);
      if ((error as any).message !== 'User cancelled photos app') {
        alert('Failed to access camera. Please check permissions.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onChange(dataUrl);
        setIsLoading(false);
      };
      reader.onerror = () => {
        alert('Failed to read image file');
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File read error:", error);
      setIsLoading(false);
    }
  };

  const handleGallery = async () => {
    try {
      setIsLoading(true);
      const image = await CapacitorCamera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      if (image.dataUrl) {
        if (!image.dataUrl.startsWith('data:')) {
          console.error('Gallery returned non-data URL:', image.dataUrl);
          alert('Image format not supported. Please select a different image.');
          return;
        }
        onChange(image.dataUrl);
      } else {
        console.error('Gallery did not return dataUrl');
        alert('Failed to load image. Please try again.');
      }
    } catch (error) {
      console.error("Gallery error:", error);
      if ((error as any).message !== 'User cancelled photos app') {
        alert('Failed to access photo library. Please check permissions.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    onChange(undefined);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      
      {value ? (
        <Card className="relative overflow-hidden">
          <img 
            src={value} 
            alt={label}
            className="w-full h-48 object-cover"
            data-testid={`${testId}-preview`}
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={() => setIsAnnotating(true)}
              data-testid={`${testId}-annotate`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={handleRemove}
              data-testid={`${testId}-remove`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-2">
          {isNative ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleCamera}
                disabled={isLoading}
                className="flex-1 min-w-[140px]"
                data-testid={`${testId}-camera`}
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleGallery}
                disabled={isLoading}
                className="flex-1 min-w-[140px]"
                data-testid={`${testId}-gallery`}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose from Gallery
              </Button>
            </>
          ) : (
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id={testId}
                disabled={isLoading}
                data-testid={`${testId}-input`}
              />
              <label htmlFor={testId} className="block">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(testId)?.click();
                  }}
                  data-testid={`${testId}-upload`}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </label>
            </div>
          )}
        </div>
      )}
      
      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading image...</p>
      )}
      
      {value && (
        <ImageAnnotator
          image={value}
          open={isAnnotating}
          onSave={(annotatedImage) => {
            onChange(annotatedImage);
            setIsAnnotating(false);
          }}
          onCancel={() => setIsAnnotating(false)}
        />
      )}
    </div>
  );
}
