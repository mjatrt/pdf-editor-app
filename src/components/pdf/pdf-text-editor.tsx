"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, X, Type } from "lucide-react";
import type { TextAnnotation } from "@/types/pdf";

const RENDER_WIDTH = 600;

interface PdfTextEditorProps {
  file: File;
  annotations: TextAnnotation[];
  onAddAnnotation: (annotation: Omit<TextAnnotation, "id">) => void;
  onRemoveAnnotation: (id: string) => void;
}

export function PdfTextEditor({
  file,
  annotations,
  onAddAnnotation,
  onRemoveAnnotation,
}: PdfTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [pageSize, setPageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [inputPos, setInputPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [inputText, setInputText] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [color, setColor] = useState("#000000");
  const [loaded, setLoaded] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ReactPdf, setReactPdf] = useState<any>(null);

  useEffect(() => {
    import("react-pdf").then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
      setReactPdf(mod);
    });
  }, []);

  const handleDocumentLoad = useCallback(
    ({ numPages: total }: { numPages: number }) => {
      setNumPages(total);
      setCurrentPage(0);
      setLoaded(true);
    },
    []
  );

  const handlePageLoad = useCallback(
    (page: { width: number; height: number; originalWidth: number; originalHeight: number }) => {
      setPageSize({
        width: page.width,
        height: page.height,
      });
    },
    []
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!pageSize) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Scale click coordinates to PDF coordinates
      const scale = RENDER_WIDTH / pageSize.width;
      const pdfX = clickX / scale;
      const pdfY = clickY / scale;

      setInputPos({ x: pdfX, y: pdfY });
      setInputText("");
    },
    [pageSize]
  );

  const handleConfirmText = useCallback(() => {
    if (!inputPos || !inputText.trim()) return;

    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return { r, g, b };
    };

    onAddAnnotation({
      pageIndex: currentPage,
      x: inputPos.x,
      y: inputPos.y,
      text: inputText,
      fontSize,
      color: hexToRgb(color),
    });

    setInputPos(null);
    setInputText("");
  }, [inputPos, inputText, fontSize, color, currentPage, onAddAnnotation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleConfirmText();
      } else if (e.key === "Escape") {
        setInputPos(null);
      }
    },
    [handleConfirmText]
  );

  const currentAnnotations = annotations.filter(
    (a) => a.pageIndex === currentPage
  );

  if (!ReactPdf) {
    return <Skeleton className="w-full h-[600px]" />;
  }

  const { Document, Page } = ReactPdf;
  const scale = pageSize ? RENDER_WIDTH / pageSize.width : 1;

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="flex items-center justify-between rounded-lg border p-3 bg-card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Label className="text-xs mr-1">サイズ:</Label>
            <Input
              type="number"
              min={8}
              max={72}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-16 h-7 text-xs"
            />
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-xs mr-1">色:</Label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-7 h-7 rounded border cursor-pointer"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 0}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[60px] text-center">
            {currentPage + 1} / {numPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= numPages - 1}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* PDF Canvas area */}
        <div
          ref={containerRef}
          className="relative border rounded-lg overflow-hidden bg-white cursor-crosshair shrink-0"
          onClick={handleCanvasClick}
          style={{ width: RENDER_WIDTH }}
        >
          <Document
            file={file}
            onLoadSuccess={handleDocumentLoad}
            loading={<Skeleton className="w-[600px] h-[800px]" />}
          >
            <Page
              pageNumber={currentPage + 1}
              width={RENDER_WIDTH}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onLoadSuccess={handlePageLoad}
            />
          </Document>

          {/* Overlay: show placed annotations */}
          {currentAnnotations.map((a) => (
            <div
              key={a.id}
              className="absolute pointer-events-none"
              style={{
                left: a.x * scale,
                top: a.y * scale,
                fontSize: a.fontSize * scale,
                color: `rgb(${Math.round(a.color.r * 255)}, ${Math.round(a.color.g * 255)}, ${Math.round(a.color.b * 255)})`,
                lineHeight: 1,
                whiteSpace: "pre",
              }}
            >
              {a.text}
            </div>
          ))}

          {/* Text input at click position */}
          {inputPos && (
            <div
              className="absolute z-10"
              style={{
                left: inputPos.x * scale,
                top: inputPos.y * scale,
              }}
            >
              <div className="flex items-center gap-1 bg-background border rounded shadow-lg p-1">
                <Input
                  autoFocus
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="テキストを入力..."
                  className="h-7 w-48 text-xs"
                />
                <Button
                  size="sm"
                  className="h-7 px-2"
                  onClick={handleConfirmText}
                  disabled={!inputText.trim()}
                >
                  追加
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-1"
                  onClick={() => setInputPos(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Annotation list */}
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
            <Type className="h-4 w-4" />
            追加テキスト ({annotations.length})
          </h3>
          <ScrollArea className="h-[500px]">
            {annotations.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">
                PDFをクリックしてテキストを追加してください
              </p>
            ) : (
              <div className="space-y-2">
                {annotations.map((a) => (
                  <div
                    key={a.id}
                    className={`flex items-start gap-2 rounded border p-2 text-xs ${
                      a.pageIndex === currentPage
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{a.text}</p>
                      <p className="text-muted-foreground">
                        P.{a.pageIndex + 1} | {a.fontSize}px
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 shrink-0"
                      onClick={() => onRemoveAnnotation(a.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
