"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { cn } from "@/lib/utils";
import { RotateCw, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PageThumbnailProps {
  file: File | string;
  pageNumber: number;
  rotation?: number;
  selected?: boolean;
  showControls?: boolean;
  onClick?: () => void;
  onRotate?: () => void;
  onDelete?: () => void;
  dragHandleProps?: Record<string, unknown>;
}

export function PageThumbnail({
  file,
  pageNumber,
  rotation = 0,
  selected = false,
  showControls = true,
  onClick,
  onRotate,
  onDelete,
  dragHandleProps,
}: PageThumbnailProps) {
  const [loading, setLoading] = useState(true);

  return (
    <div
      className={cn(
        "group relative flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-colors cursor-pointer",
        selected
          ? "border-primary bg-primary/5"
          : "border-transparent hover:border-muted-foreground/30"
      )}
      onClick={onClick}
    >
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      <div className="relative overflow-hidden rounded bg-white shadow-sm">
        {loading && <Skeleton className="w-[120px] h-[170px]" />}
        <Document
          file={file}
          loading={null}
          onLoadSuccess={() => setLoading(false)}
        >
          <Page
            pageNumber={pageNumber}
            width={120}
            rotate={rotation}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>

      <span className="text-xs text-muted-foreground">{pageNumber}</span>

      {showControls && (
        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onRotate && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="secondary"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRotate();
                    }}
                  />
                }
              >
                <RotateCw className="h-3 w-3" />
              </TooltipTrigger>
              <TooltipContent>90度回転</TooltipContent>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="destructive"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  />
                }
              >
                <Trash2 className="h-3 w-3" />
              </TooltipTrigger>
              <TooltipContent>ページを削除</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}
