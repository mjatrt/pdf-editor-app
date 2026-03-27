"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileWarning } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

interface ImageDropzoneProps {
  onFilesAccepted: (files: File[]) => void;
  className?: string;
}

export function ImageDropzone({
  onFilesAccepted,
  className,
}: ImageDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: unknown[]) => {
      if (rejectedFiles.length > 0) {
        toast.error("無効なファイルがあります", {
          description:
            "画像ファイル（JPG, PNG, WebP、20MB以下）のみアップロードできます。",
        });
      }
      if (acceptedFiles.length > 0) {
        onFilesAccepted(acceptedFiles);
      }
    },
    [onFilesAccepted]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
        "image/webp": [".webp"],
      },
      multiple: true,
      maxSize: MAX_FILE_SIZE,
    });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors cursor-pointer",
        isDragActive && !isDragReject && "border-primary bg-primary/5",
        isDragReject && "border-destructive bg-destructive/5",
        !isDragActive &&
          "border-muted-foreground/25 hover:border-primary/50",
        className
      )}
    >
      <input {...getInputProps()} />
      {isDragReject ? (
        <>
          <FileWarning className="h-10 w-10 text-destructive mb-4" />
          <p className="text-sm text-destructive font-medium">
            画像ファイルのみアップロードできます
          </p>
        </>
      ) : (
        <>
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-sm font-medium mb-1">
            {isDragActive
              ? "ここにドロップしてください"
              : "画像ファイルをドラッグ＆ドロップ"}
          </p>
          <p className="text-xs text-muted-foreground">
            またはクリックしてファイルを選択（JPG, PNG, WebP・最大20MB）
          </p>
        </>
      )}
    </div>
  );
}
