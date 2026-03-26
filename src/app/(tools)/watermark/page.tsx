"use client";

import { useState, useCallback } from "react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { PdfDropzone } from "@/components/pdf/pdf-dropzone";
import { ProcessingOverlay } from "@/components/pdf/processing-overlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePdfStore } from "@/stores/pdf-store";
import { addWatermark } from "@/lib/pdf";
import { Droplets, Download } from "lucide-react";

export default function WatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(50);
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(-45);
  const { processing, setProcessing, setProgress } = usePdfStore();

  const handleFilesAccepted = useCallback((files: File[]) => {
    setFile(files[0]);
    toast.success(`${files[0].name} を読み込みました`);
  }, []);

  const handleApply = async () => {
    if (!file || !text.trim()) return;

    setProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      setProgress(30);

      const result = await addWatermark(buffer, {
        text,
        fontSize,
        opacity,
        rotation,
        color: { r: 0.5, g: 0.5, b: 0.5 },
      });
      setProgress(90);

      const blob = new Blob([result.buffer as ArrayBuffer], { type: "application/pdf" });
      saveAs(blob, `watermarked_${file.name}`);
      setProgress(100);
      toast.success("ウォーターマークを追加しました");
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProcessingOverlay />

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Droplets className="h-7 w-7 text-primary" />
          透かし追加
        </h1>
        <p className="text-muted-foreground mt-2">
          PDFの全ページにテキストの透かし（ウォーターマーク）を追加します。
        </p>
      </div>

      {!file ? (
        <PdfDropzone onFilesAccepted={handleFilesAccepted} multiple={false} />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{file.name}</p>
            <Button variant="outline" size="sm" onClick={() => setFile(null)}>
              別のファイルを選択
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border p-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="watermark-text">透かしテキスト</Label>
              <Input
                id="watermark-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="CONFIDENTIAL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="font-size">フォントサイズ: {fontSize}</Label>
              <input
                id="font-size"
                type="range"
                min="10"
                max="100"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opacity">透明度: {Math.round(opacity * 100)}%</Label>
              <input
                id="opacity"
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rotation">角度: {rotation}°</Label>
              <input
                id="rotation"
                type="range"
                min="-90"
                max="90"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleApply}
            disabled={processing || !text.trim()}
          >
            <Download className="mr-2 h-5 w-5" />
            透かしを追加してダウンロード
          </Button>
        </div>
      )}
    </div>
  );
}
