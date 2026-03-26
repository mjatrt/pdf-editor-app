"use client";

import { useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { PdfDropzone } from "@/components/pdf/pdf-dropzone";
import { FileList } from "@/components/pdf/file-list";
import { ProcessingOverlay } from "@/components/pdf/processing-overlay";
import { Button } from "@/components/ui/button";
import { usePdfStore } from "@/stores/pdf-store";
import { mergePdfs } from "@/lib/pdf";
import { Combine, Trash2, Download } from "lucide-react";

export default function MergePage() {
  const { files, addFiles, clearFiles, processing, setProcessing, setProgress } =
    usePdfStore();

  const handleFilesAccepted = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles = await Promise.all(
        acceptedFiles.map(async (file) => {
          const buffer = await file.arrayBuffer();
          const pdf = await PDFDocument.load(buffer);
          return {
            id: crypto.randomUUID(),
            file,
            name: file.name,
            size: file.size,
            pageCount: pdf.getPageCount(),
          };
        })
      );
      addFiles(newFiles);
      toast.success(`${newFiles.length}件のファイルを追加しました`);
    },
    [addFiles]
  );

  const handleMerge = async () => {
    if (files.length < 2) {
      toast.error("2つ以上のPDFファイルを追加してください");
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      const buffers: ArrayBuffer[] = [];
      for (let i = 0; i < files.length; i++) {
        buffers.push(await files[i].file.arrayBuffer());
        setProgress(((i + 1) / files.length) * 50);
      }

      const result = await mergePdfs(buffers);
      setProgress(90);

      const blob = new Blob([result.buffer as ArrayBuffer], { type: "application/pdf" });
      saveAs(blob, "merged.pdf");
      setProgress(100);
      toast.success("PDFの結合が完了しました");
    } catch (error) {
      toast.error("結合に失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProcessingOverlay />

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Combine className="h-7 w-7 text-primary" />
          PDF結合
        </h1>
        <p className="text-muted-foreground mt-2">
          複数のPDFファイルを1つに結合します。ドラッグ&ドロップで順序を変更できます。
        </p>
      </div>

      <PdfDropzone onFilesAccepted={handleFilesAccepted} className="mb-6" />

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {files.length}件のファイル
            </p>
            <Button variant="ghost" size="sm" onClick={clearFiles}>
              <Trash2 className="mr-2 h-4 w-4" />
              すべて削除
            </Button>
          </div>

          <FileList />

          <Button
            size="lg"
            className="w-full"
            onClick={handleMerge}
            disabled={files.length < 2 || processing}
          >
            <Download className="mr-2 h-5 w-5" />
            PDFを結合してダウンロード
          </Button>
        </div>
      )}
    </div>
  );
}
