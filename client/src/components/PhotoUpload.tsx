import { useState, useRef } from "react";
import { Upload, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PhotoUploadProps {
  projectId: number;
  onUploadComplete?: (fileUrl: string, fileName: string, fileKey: string) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export function PhotoUpload({
  projectId,
  onUploadComplete,
  maxFiles = 10,
  maxSizeMB = 50,
}: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; url: string; key: string; status: "success" | "error" }>
  >([]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    // Validate file count
    if (files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate file sizes
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > maxSizeMB * 1024 * 1024) {
      toast.error(`Total file size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    setIsUploading(true);

    for (const file of files) {
      try {
        // Read file as base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          const fileData = e.target?.result as string;
          const base64Data = fileData.split(",")[1];

          // Generate unique file key
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(7);
          const fileKey = `projects/${projectId}/photos/${timestamp}-${randomSuffix}-${file.name}`;

          try {
            // Upload to S3 via API
            const uploadResponse = await fetch("/api/trpc/photos.uploadFile", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                projectId,
                fileName: file.name,
                fileKey,
                mimeType: file.type,
                fileData: base64Data,
              }),
            });

            if (!uploadResponse.ok) {
              throw new Error("Upload failed");
            }

            const result = await uploadResponse.json();
            const fileUrl = result.result.url;

            setUploadedFiles((prev) => [
              ...prev,
              { name: file.name, url: fileUrl, key: fileKey, status: "success" },
            ]);

            if (onUploadComplete) {
              onUploadComplete(fileUrl, file.name, fileKey);
            }

            toast.success(`${file.name} uploaded successfully`);
          } catch (error) {
            setUploadedFiles((prev) => [
              ...prev,
              { name: file.name, url: "", key: "", status: "error" },
            ]);
            toast.error(`Failed to upload ${file.name}`);
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        toast.error(`Error processing ${file.name}`);
      }
    }

    setIsUploading(false);
  };

  return (
    <div className="space-y-4">
      {/* Drag and drop area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-border bg-muted/30 hover:border-blue-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">
              Drag photos here or click to select
            </p>
            <p className="text-sm text-muted-foreground">
              PNG, JPG, GIF up to {maxSizeMB}MB
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Select Files"}
          </Button>
        </div>
      </div>

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Uploaded Photos</h3>
          <div className="grid gap-2">
            {uploadedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {file.status === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    {file.status === "success" && (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline truncate block"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUploadedFiles((prev) =>
                      prev.filter((_, i) => i !== idx)
                    );
                  }}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
