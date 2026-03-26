"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { PdfDropzone } from "@/components/pdf/pdf-dropzone";
import { ProcessingOverlay } from "@/components/pdf/processing-overlay";
import { Button } from "@/components/ui/button";
import { usePdfStore } from "@/stores/pdf-store";
import { applyTextEdits } from "@/lib/pdf";
import { Type, Download, Trash2 } from "lucide-react";
import type { TextAnnotation, TextEdit } from "@/types/pdf";

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
  const [textEdits, setTextEdits] = useState<TextEdit[]>([]);
  const { processing, setProcessing, setProgress } = usePdfStore();

  const handleFilesAccepted = useCallback((files: File[]) => {
    setFile(files[0]);
    setAnnotations([]);
    setTextEdits([]);
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

  const totalChanges = annotations.length + textEdits.length;

  const handleSave = async () => {
    if (!file || totalChanges === 0) return;

    setProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      setProgress(30);

      const result = await applyTextEdits(buffer, textEdits, annotations);
      setProgress(90);

      const blob = new Blob([result.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      saveAs(blob, `edited_${file.name}`);
      setProgress(100);
      toast.success("テキストを編集しました");
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
          テキスト編集
        </h1>
        <p className="text-muted-foreground mt-2">
          PDFの既存テキストを編集したり、任意の位置に新しいテキストを追加できます。
        </p>
      </div>

      {!file ? (
        <PdfDropzone onFilesAccepted={handleFilesAccepted} multiple={false} />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{file.name}</p>
            <div className="flex items-center gap-2">
              {totalChanges > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAnnotations([]);
                    setTextEdits([]);
                  }}
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
                  setTextEdits([]);
                }}
              >
                別のファイル
              </Button>
            </div>
          </div>

          <PdfTextEditor
            file={file}
            annotations={annotations}
            textEdits={textEdits}
            onAddAnnotation={handleAddAnnotation}
            onRemoveAnnotation={handleRemoveAnnotation}
            onTextEditsChange={setTextEdits}
          />

          <Button
            size="lg"
            className="w-full"
            onClick={handleSave}
            disabled={processing || totalChanges === 0}
          >
            <Download className="mr-2 h-5 w-5" />
            テキストを編集してダウンロード ({totalChanges}件)
          </Button>
        </div>
      )}
    </div>
  );
}
