"use client";

import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { PdfDropzone } from "@/components/pdf/pdf-dropzone";
import { ProcessingOverlay } from "@/components/pdf/processing-overlay";
import { PageGrid } from "@/components/pdf/page-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePdfStore } from "@/stores/pdf-store";
import { splitPdf, extractPages } from "@/lib/pdf";
import { Scissors, Download } from "lucide-react";

export default function SplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [rangeInput, setRangeInput] = useState("");
  const { pages, processing, setProcessing, setProgress } = usePdfStore();

  const handleFilesAccepted = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    const buffer = await f.arrayBuffer();
    const pdf = await PDFDocument.load(buffer);
    setTotalPages(pdf.getPageCount());
    toast.success(`${f.name} を読み込みました（${pdf.getPageCount()}ページ）`);
  }, []);

  const handleSplitByRange = async () => {
    if (!file || !rangeInput.trim()) return;

    setProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const ranges = rangeInput.split(",").map((r) => {
        const parts = r.trim().split("-");
        const start = parseInt(parts[0]) - 1;
        const end = parts.length > 1 ? parseInt(parts[1]) - 1 : start;
        return { start, end };
      });

      const results = await splitPdf(buffer, ranges);

      for (let i = 0; i < results.length; i++) {
        const blob = new Blob([results[i].buffer as ArrayBuffer], { type: "application/pdf" });
        saveAs(blob, `split_${i + 1}.pdf`);
        setProgress(((i + 1) / results.length) * 100);
      }

      toast.success(`${results.length}件のPDFに分割しました`);
    } catch (error) {
      toast.error("分割に失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const handleExtractSelected = async () => {
    if (!file) return;
    const selectedIndices = pages
      .filter((p) => p.selected)
      .map((p) => p.pageIndex);

    if (selectedIndices.length === 0) {
      toast.error("ページを選択してください");
      return;
    }

    setProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const result = await extractPages(buffer, selectedIndices);
      const blob = new Blob([result.buffer as ArrayBuffer], { type: "application/pdf" });
      saveAs(blob, "extracted.pdf");
      toast.success(`${selectedIndices.length}ページを抽出しました`);
    } catch (error) {
      toast.error("抽出に失敗しました", {
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
          <Scissors className="h-7 w-7 text-primary" />
          PDF分割
        </h1>
        <p className="text-muted-foreground mt-2">
          PDFをページ範囲で分割、または選択したページを抽出します。
        </p>
      </div>

      {!file ? (
        <PdfDropzone onFilesAccepted={handleFilesAccepted} multiple={false} />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              <span className="font-medium">{file.name}</span>
              <span className="text-muted-foreground ml-2">
                ({totalPages}ページ)
              </span>
            </p>
            <Button variant="outline" size="sm" onClick={() => setFile(null)}>
              別のファイルを選択
            </Button>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <Label>ページ範囲で分割</Label>
            <p className="text-xs text-muted-foreground">
              例: 1-3, 4-6, 7-10（カンマ区切りで複数の範囲を指定）
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="1-3, 4-6, 7-10"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
              />
              <Button onClick={handleSplitByRange} disabled={processing}>
                <Scissors className="mr-2 h-4 w-4" />
                分割
              </Button>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label>ページを選択して抽出</Label>
              <span className="text-xs text-muted-foreground">
                {pages.filter((p) => p.selected).length}ページ選択中
              </span>
            </div>
            <PageGrid file={file} />
            <Button
              onClick={handleExtractSelected}
              disabled={processing || pages.filter((p) => p.selected).length === 0}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              選択ページを抽出
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
