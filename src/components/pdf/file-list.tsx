"use client";

import { FileText, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePdfStore } from "@/stores/pdf-store";
import { Badge } from "@/components/ui/badge";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileList() {
  const { files, removeFile } = usePdfStore();

  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      {files.map((file, index) => (
        <div
          key={file.id}
          className="flex items-center gap-3 rounded-lg border p-3 bg-card"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
              {file.pageCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {file.pageCount}ページ
                </Badge>
              )}
            </div>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            #{index + 1}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => removeFile(file.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
