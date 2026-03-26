"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X, Type, Pencil } from "lucide-react";
import { extractPageTextItems, pdfToCanvas } from "@/lib/pdf/extract-text";
import type { TextAnnotation, ExtractedTextItem, TextEdit } from "@/types/pdf";

const RENDER_WIDTH = 600;

interface PdfTextEditorProps {
  file: File;
  annotations: TextAnnotation[];
  textEdits: TextEdit[];
  onAddAnnotation: (annotation: Omit<TextAnnotation, "id">) => void;
  onRemoveAnnotation: (id: string) => void;
  onTextEditsChange: (edits: TextEdit[]) => void;
}

export function PdfTextEditor({
  file,
  annotations,
  textEdits,
  onAddAnnotation,
  onRemoveAnnotation,
  onTextEditsChange,
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

  // Edit mode state
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [extractedItems, setExtractedItems] = useState<ExtractedTextItem[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [editingItem, setEditingItem] = useState<ExtractedTextItem | null>(
    null
  );
  const [editText, setEditText] = useState("");
  const [editFontSize, setEditFontSize] = useState(16);
  const [editColor, setEditColor] = useState("#000000");

  const textCacheRef = useRef<Map<number, ExtractedTextItem[]>>(new Map());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ReactPdf, setReactPdf] = useState<any>(null);
  const [pdfjsVersion, setPdfjsVersion] = useState("");

  useEffect(() => {
    import("react-pdf").then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
      setPdfjsVersion(mod.pdfjs.version);
      setReactPdf(mod);
    });
  }, []);

  // Clear cache when file changes
  useEffect(() => {
    textCacheRef.current.clear();
  }, [file]);

  // Extract text when in edit mode
  useEffect(() => {
    if (mode !== "edit") return;

    const cached = textCacheRef.current.get(currentPage);
    if (cached) {
      setExtractedItems(cached);
      return;
    }

    setExtracting(true);
    file
      .arrayBuffer()
      .then((buffer) => extractPageTextItems(buffer, currentPage))
      .then((items) => {
        textCacheRef.current.set(currentPage, items);
        setExtractedItems(items);
      })
      .finally(() => setExtracting(false));
  }, [mode, currentPage]);

  const handleDocumentLoad = useCallback(
    ({ numPages: total }: { numPages: number }) => {
      setNumPages(total);
      setCurrentPage(0);
      setLoaded(true);
    },
    []
  );

  const handlePageLoad = useCallback(
    (page: {
      width: number;
      height: number;
      originalWidth: number;
      originalHeight: number;
    }) => {
      setPageSize({
        width: page.width,
        height: page.height,
      });
    },
    []
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (mode !== "add" || !pageSize) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const scale = RENDER_WIDTH / pageSize.width;
      const pdfX = clickX / scale;
      const pdfY = clickY / scale;

      setInputPos({ x: pdfX, y: pdfY });
      setInputText("");
    },
    [pageSize, mode]
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

  const handleEditItem = useCallback((item: ExtractedTextItem) => {
    // Check if there's already an edit for this item
    setEditingItem(item);
    setEditText(item.text);
    setEditFontSize(Math.round(item.fontSize));
    setEditColor("#000000");
  }, []);

  const handleApplyEdit = useCallback(() => {
    if (!editingItem || !editText.trim()) return;

    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return { r, g, b };
    };

    const padding = 2;
    const newEdit: TextEdit = {
      id: editingItem.id,
      pageIndex: editingItem.pageIndex,
      originalText: editingItem.text,
      newText: editText,
      coverRect: {
        x: editingItem.pdfX - padding,
        y: editingItem.pdfY - padding,
        width: editingItem.pdfWidth + padding * 2,
        height: editingItem.pdfHeight + padding * 2,
      },
      x: editingItem.pdfX,
      y: editingItem.pdfY,
      fontSize: editFontSize,
      color: hexToRgb(editColor),
    };

    // Replace existing edit or add new one
    const existing = textEdits.findIndex((e) => e.id === editingItem.id);
    if (existing >= 0) {
      const updated = [...textEdits];
      updated[existing] = newEdit;
      onTextEditsChange(updated);
    } else {
      onTextEditsChange([...textEdits, newEdit]);
    }

    setEditingItem(null);
  }, [
    editingItem,
    editText,
    editFontSize,
    editColor,
    textEdits,
    onTextEditsChange,
  ]);

  const handleRemoveEdit = useCallback(
    (id: string) => {
      onTextEditsChange(textEdits.filter((e) => e.id !== id));
    },
    [textEdits, onTextEditsChange]
  );

  const currentAnnotations = annotations.filter(
    (a) => a.pageIndex === currentPage
  );
  const currentEdits = textEdits.filter((e) => e.pageIndex === currentPage);

  const documentOptions = useMemo(
    () => ({
      cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjsVersion}/cmaps/`,
      cMapPacked: true,
    }),
    [pdfjsVersion]
  );

  if (!ReactPdf) {
    return <Skeleton className="w-full h-[600px]" />;
  }

  const { Document, Page } = ReactPdf;
  const scale = pageSize ? RENDER_WIDTH / pageSize.width : 1;

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <Tabs
        value={mode}
        onValueChange={(v) => {
          setMode(v as "add" | "edit");
          setInputPos(null);
        }}
      >
        <TabsList>
          <TabsTrigger value="add">
            <Type className="h-3.5 w-3.5 mr-1" />
            テキスト追加
          </TabsTrigger>
          <TabsTrigger value="edit">
            <Pencil className="h-3.5 w-3.5 mr-1" />
            既存テキスト編集
          </TabsTrigger>
        </TabsList>

        {/* Controls bar */}
        <div className="flex items-center justify-between rounded-lg border p-3 bg-card mt-2">
          <TabsContent value="add">
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
          </TabsContent>
          <TabsContent value="edit">
            <p className="text-xs text-muted-foreground">
              {extracting
                ? "テキストを抽出中..."
                : `${extractedItems.length}個のテキストを検出 — クリックして編集`}
            </p>
          </TabsContent>

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
      </Tabs>

      <div className="flex gap-4">
        {/* PDF Canvas area */}
        <div
          ref={containerRef}
          className={`relative border rounded-lg overflow-hidden bg-white shrink-0 ${
            mode === "add" ? "cursor-crosshair" : "cursor-default"
          }`}
          onClick={handleCanvasClick}
          style={{ width: RENDER_WIDTH }}
        >
          <Document
            file={file}
            onLoadSuccess={handleDocumentLoad}
            loading={<Skeleton className="w-[600px] h-[800px]" />}
            options={documentOptions}
          >
            <Page
              pageNumber={currentPage + 1}
              width={RENDER_WIDTH}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onLoadSuccess={handlePageLoad}
            />
          </Document>

          {/* Overlay: show placed annotations (add mode) */}
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

          {/* Overlay: extracted text highlights (edit mode) */}
          {mode === "edit" &&
            pageSize &&
            extractedItems.map((item) => {
              const pos = pdfToCanvas(
                item.pdfX,
                item.pdfY,
                item.pdfHeight,
                pageSize.height,
                scale
              );
              const hasEdit = textEdits.some((e) => e.id === item.id);
              return (
                <div
                  key={item.id}
                  className={`absolute cursor-pointer border transition-colors ${
                    hasEdit
                      ? "bg-green-200/40 border-green-400"
                      : "bg-blue-200/20 border-transparent hover:bg-blue-200/40 hover:border-blue-400"
                  }`}
                  style={{
                    left: pos.canvasX,
                    top: pos.canvasY,
                    width: item.pdfWidth * scale,
                    height: item.pdfHeight * scale,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditItem(item);
                  }}
                />
              );
            })}

          {/* Overlay: edit previews (white rect + new text) */}
          {pageSize &&
            currentEdits.map((edit) => {
              const coverPos = pdfToCanvas(
                edit.coverRect.x,
                edit.coverRect.y,
                edit.coverRect.height,
                pageSize.height,
                scale
              );
              const textPos = pdfToCanvas(
                edit.x,
                edit.y,
                edit.fontSize * 1.2,
                pageSize.height,
                scale
              );
              return (
                <div key={`edit-preview-${edit.id}`}>
                  <div
                    className="absolute bg-white"
                    style={{
                      left: coverPos.canvasX,
                      top: coverPos.canvasY,
                      width: edit.coverRect.width * scale,
                      height: edit.coverRect.height * scale,
                    }}
                  />
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: textPos.canvasX,
                      top: textPos.canvasY,
                      fontSize: edit.fontSize * scale,
                      color: `rgb(${Math.round(edit.color.r * 255)}, ${Math.round(edit.color.g * 255)}, ${Math.round(edit.color.b * 255)})`,
                      lineHeight: 1,
                      whiteSpace: "pre",
                    }}
                  >
                    {edit.newText}
                  </div>
                </div>
              );
            })}

          {/* Text input at click position (add mode) */}
          {inputPos && mode === "add" && (
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

        {/* Sidebar: Annotation/Edit list */}
        <div className="flex-1 min-w-[200px]">
          {mode === "add" ? (
            <>
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
            </>
          ) : (
            <>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Pencil className="h-4 w-4" />
                編集済みテキスト ({textEdits.length})
              </h3>
              <ScrollArea className="h-[500px]">
                {textEdits.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">
                    ハイライトされたテキストをクリックして編集してください
                  </p>
                ) : (
                  <div className="space-y-2">
                    {textEdits.map((e) => (
                      <div
                        key={e.id}
                        className={`flex items-start gap-2 rounded border p-2 text-xs ${
                          e.pageIndex === currentPage
                            ? "border-green-500 bg-green-50"
                            : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-muted-foreground line-through truncate">
                            {e.originalText}
                          </p>
                          <p className="font-medium truncate">{e.newText}</p>
                          <p className="text-muted-foreground">
                            P.{e.pageIndex + 1} | {e.fontSize}px
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 shrink-0"
                          onClick={() => handleRemoveEdit(e.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog
        open={editingItem !== null}
        onOpenChange={(open) => {
          if (!open) setEditingItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>テキストを編集</DialogTitle>
            <DialogDescription>
              元のテキストを置き換えます。フォントはHelveticaに変更されます。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">
                元のテキスト
              </Label>
              <p className="text-sm font-medium mt-1 p-2 bg-muted rounded">
                {editingItem?.text}
              </p>
            </div>
            <div>
              <Label className="text-xs">新しいテキスト</Label>
              <Input
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplyEdit();
                }}
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Label className="text-xs">サイズ:</Label>
                <Input
                  type="number"
                  min={8}
                  max={72}
                  value={editFontSize}
                  onChange={(e) => setEditFontSize(Number(e.target.value))}
                  className="w-16 h-7 text-xs"
                />
              </div>
              <div className="flex items-center gap-1">
                <Label className="text-xs">色:</Label>
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-7 h-7 rounded border cursor-pointer"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              キャンセル
            </Button>
            <Button onClick={handleApplyEdit} disabled={!editText.trim()}>
              適用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
