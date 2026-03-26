"use client";

import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { PdfDropzone } from "@/components/pdf/pdf-dropzone";
import { ProcessingOverlay } from "@/components/pdf/processing-overlay";
import { PageGrid } from "@/components/pdf/page-grid";
import { Button } from "@/components/ui/button";
import { usePdfStore } from "@/stores/pdf-store";
import { rotatePages, deletePages, reorderPages } from "@/lib/pdf";
import { RotateCcw, Download, RotateCw, Trash2, CheckSquare, Square } from "lucide-react";

export default function EditPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalBuffer, setOriginalBuffer] = useState<ArrayBuffer | null>(null);
  const {
    pages,
    selectAllPages,
    deselectAllPages,
    processing,
    setProcessing,
    setProgress,
  } = usePdfStore();

  const handleFilesAccepted = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    const buffer = await f.arrayBuffer();
    setOriginalBuffer(buffer);
    toast.success(`${f.name} を読み込みました`);
  }, []);

  const handleSave = async () => {
    if (!originalBuffer) return;

    setProcessing(true);
    try {
      // Apply rotations
      const rotations = pages
        .filter((p) => p.rotation !== 0)
        .map((p) => ({ pageIndex: p.pageIndex, degrees: p.rotation }));

      let result: Uint8Array;

      if (rotations.length > 0) {
        result = await rotatePages(originalBuffer, rotations);
      } else {
        result = new Uint8Array(originalBuffer);
      }

      // Get current page order
      const newOrder = pages.map((p) => p.pageIndex);
      const sourcePdf = await PDFDocument.load(result);
      const totalOriginalPages = sourcePdf.getPageCount();

      // Check if pages were deleted or reordered
      const isDefaultOrder =
        newOrder.length === totalOriginalPages &&
        newOrder.every((v, i) => v === i);

      if (!isDefaultOrder) {
        result = await reorderPages(result.buffer as ArrayBuffer, newOrder);
      }

      setProgress(90);

      const blob = new Blob([result.buffer as ArrayBuffer], { type: "application/pdf" });
      saveAs(blob, `edited_${file?.name || "document.pdf"}`);
      setProgress(100);
      toast.success("PDFの編集が完了しました");
    } catch (error) {
      toast.error("編集の保存に失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const selectedCount = pages.filter((p) => p.selected).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProcessingOverlay />

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <RotateCcw className="h-7 w-7 text-primary" />
          ページ編集
        </h1>
        <p className="text-muted-foreground mt-2">
          ページの回転・削除・並べ替えを行います。サムネイルをクリックして選択してください。
        </p>
      </div>

      {!file ? (
        <PdfDropzone onFilesAccepted={handleFilesAccepted} multiple={false} />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm">
              <span className="font-medium">{file.name}</span>
              <span className="text-muted-foreground ml-2">
                ({pages.length}ページ)
              </span>
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={selectAllPages}>
                <CheckSquare className="mr-1 h-3 w-3" />
                全選択
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAllPages}>
                <Square className="mr-1 h-3 w-3" />
                選択解除
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFile(null)}
              >
                別のファイル
              </Button>
            </div>
          </div>

          {selectedCount > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
              <span className="text-sm text-muted-foreground mr-2">
                {selectedCount}ページ選択中:
              </span>
              <Button variant="secondary" size="sm">
                <RotateCw className="mr-1 h-3 w-3" />
                回転
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-1 h-3 w-3" />
                削除
              </Button>
            </div>
          )}

          <PageGrid file={file} />

          <Button
            size="lg"
            className="w-full"
            onClick={handleSave}
            disabled={processing}
          >
            <Download className="mr-2 h-5 w-5" />
            編集を保存してダウンロード
          </Button>
        </div>
      )}
    </div>
  );
}
