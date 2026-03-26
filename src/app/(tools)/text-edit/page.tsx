"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { PdfDropzone } from "@/components/pdf/pdf-dropzone";
import { ProcessingOverlay } from "@/components/pdf/processing-overlay";
import { Button } from "@/components/ui/button";
import { usePdfStore } from "@/stores/pdf-store";
import { addTexts } from "@/lib/pdf";
import { Type, Download, Trash2 } from "lucide-react";
import type { TextAnnotation } from "@/types/pdf";

const PdfTextEditor = dynamic(
  () =>
    import("@/components/pdf/pdf-text-editor").then((mod) => ({
      default: mod.PdfTextEditor,
    })),
  { ssr: false }
);

export default function TextEditPage() {
  const [file, setFile] = useState<File | null>(null);
  const [annotations, setAnnotations] = useState<TextAnnotation[]>([]);
  const { processing, setProcessing, setProgress } = usePdfStore();

  const handleFilesAccepted = useCallback((files: File[]) => {
    setFile(files[0]);
    setAnnotations([]);
    toast.success(`${files[0].name} を読み込みました`);
  }, []);

  const handleAddAnnotation = useCallback(
    (annotation: Omit<TextAnnotation, "id">) => {
      setAnnotations((prev) => [
        ...prev,
        { ...annotation, id: crypto.randomUUID() },
      ]);
    },
    []
  );

  const handleRemoveAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleSave = async () => {
    if (!file || annotations.length === 0) return;

    setProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      setProgress(30);

      const result = await addTexts(buffer, annotations);
      setProgress(90);

      const blob = new Blob([result.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      saveAs(blob, `text_${file.name}`);
      setProgress(100);
      toast.success("テキストを追加しました");
    } catch (error) {
      toast.error("処理に失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <ProcessingOverlay />

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Type className="h-7 w-7 text-primary" />
          テキスト追加
        </h1>
        <p className="text-muted-foreground mt-2">
          PDFの任意の位置にテキストを追加します。ページ上をクリックしてテキストを配置してください。
        </p>
      </div>

      {!file ? (
        <PdfDropzone onFilesAccepted={handleFilesAccepted} multiple={false} />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{file.name}</p>
            <div className="flex items-center gap-2">
              {annotations.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAnnotations([])}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  全削除
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setAnnotations([]);
                }}
              >
                別のファイル
              </Button>
            </div>
          </div>

          <PdfTextEditor
            file={file}
            annotations={annotations}
            onAddAnnotation={handleAddAnnotation}
            onRemoveAnnotation={handleRemoveAnnotation}
          />

          <Button
            size="lg"
            className="w-full"
            onClick={handleSave}
            disabled={processing || annotations.length === 0}
          >
            <Download className="mr-2 h-5 w-5" />
            テキストを追加してダウンロード ({annotations.length}件)
          </Button>
        </div>
      )}
    </div>
  );
}
