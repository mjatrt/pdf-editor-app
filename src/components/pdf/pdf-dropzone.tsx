"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileWarning } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

interface PdfDropzoneProps {
  onFilesAccepted: (files: File[]) => void;
  multiple?: boolean;
  className?: string;
}

export function PdfDropzone({
  onFilesAccepted,
  multiple = true,
  className,
}: PdfDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: unknown[]) => {
      if (rejectedFiles.length > 0) {
        toast.error("無効なファイルがあります", {
          description: "PDFファイル（20MB以下）のみアップロードできます。",
        });
      }
      if (acceptedFiles.length > 0) {
        // Verify magic bytes
        const validFiles: File[] = [];
        const checks = acceptedFiles.map(
          (file) =>
            new Promise<void>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                const arr = new Uint8Array(reader.result as ArrayBuffer);
                const header = String.fromCharCode(...arr.slice(0, 5));
                if (header === "%PDF-") {
                  validFiles.push(file);
                } else {
                  toast.error(`${file.name} は有効なPDFファイルではありません`);
                }
                resolve();
              };
              reader.readAsArrayBuffer(file.slice(0, 5));
            })
        );
        Promise.all(checks).then(() => {
          if (validFiles.length > 0) {
            onFilesAccepted(validFiles);
          }
        });
      }
    },
    [onFilesAccepted]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: { "application/pdf": [".pdf"] },
      multiple,
      maxSize: MAX_FILE_SIZE,
    });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors cursor-pointer",
        isDragActive && !isDragReject && "border-primary bg-primary/5",
        isDragReject && "border-destructive bg-destructive/5",
        !isDragActive && "border-muted-foreground/25 hover:border-primary/50",
        className
      )}
    >
      <input {...getInputProps()} />
      {isDragReject ? (
        <>
          <FileWarning className="h-10 w-10 text-destructive mb-4" />
          <p className="text-sm text-destructive font-medium">
            PDFファイルのみアップロードできます
          </p>
        </>
      ) : (
        <>
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-sm font-medium mb-1">
            {isDragActive
              ? "ここにドロップしてください"
              : "PDFファイルをドラッグ＆ドロップ"}
          </p>
          <p className="text-xs text-muted-foreground">
            またはクリックしてファイルを選択（最大20MB）
          </p>
        </>
      )}
    </div>
  );
}
