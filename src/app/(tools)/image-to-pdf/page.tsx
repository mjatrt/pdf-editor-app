"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { ImageDropzone } from "@/components/pdf/image-dropzone";
import { Button } from "@/components/ui/button";
import { imagesToPdf } from "@/lib/pdf/image-to-pdf";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import {
  ArrowUp,
  ArrowDown,
  X,
  Download,
  Image as ImageIcon,
} from "lucide-react";

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export default function ImageToPdfPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [fitToA4, setFitToA4] = useState(true);
  const [processing, setProcessing] = useState(false);

  const handleFilesAccepted = useCallback((files: File[]) => {
    const newItems: ImageItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newItems]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const moveImage = useCallback((index: number, direction: -1 | 1) => {
    setImages((prev) => {
      const newArr = [...prev];
      const target = index + direction;
      if (target < 0 || target >= newArr.length) return prev;
      [newArr[index], newArr[target]] = [newArr[target], newArr[index]];
      return newArr;
    });
  }, []);

  const handleConvert = async () => {
    if (images.length === 0) return;
    setProcessing(true);
    try {
      const imageDataList = await Promise.all(
        images.map(async (img) => ({
          data: await img.file.arrayBuffer(),
          type: img.file.type,
        }))
      );
      const pdfBytes = await imagesToPdf(imageDataList, { fitToA4 });
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      saveAs(blob, "images.pdf");
      toast.success("PDFを作成しました");
    } catch (err) {
      console.error(err);
      toast.error("PDF変換に失敗しました");
    } finally {
      setProcessing(false);
    }
  };

  const clearAll = () => {
    for (const img of images) {
      URL.revokeObjectURL(img.previewUrl);
    }
    setImages([]);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">画像→PDF変換</h1>
        <p className="text-muted-foreground">
          画像ファイル（JPG, PNG,
          WebP）をアップロードしてPDFとして保存できます。複数画像は1つのPDFにまとめられます。
        </p>
      </div>

      <ImageDropzone
        onFilesAccepted={handleFilesAccepted}
        className="mb-6"
      />

      {images.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {images.length}枚の画像
            </p>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="pageSize"
                  checked={fitToA4}
                  onChange={() => setFitToA4(true)}
                />
                A4にフィット
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="pageSize"
                  checked={!fitToA4}
                  onChange={() => setFitToA4(false)}
                />
                画像サイズに合わせる
              </label>
              <Button variant="outline" size="sm" onClick={clearAll}>
                すべて削除
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
            {images.map((img, index) => (
              <div
                key={img.id}
                className="relative group rounded-lg border bg-muted/30 overflow-hidden"
              >
                <div className="aspect-[3/4] relative">
                  <Image
                    src={img.previewUrl}
                    alt={img.file.name}
                    fill
                    className="object-contain p-1"
                    unoptimized
                  />
                </div>
                <div className="p-2">
                  <p className="text-xs truncate" title={img.file.name}>
                    {img.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {index + 1}ページ目
                  </p>
                </div>
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => moveImage(index, -1)}
                    disabled={index === 0}
                    className="p-1 rounded bg-background/80 hover:bg-background disabled:opacity-30"
                    title="上に移動"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => moveImage(index, 1)}
                    disabled={index === images.length - 1}
                    className="p-1 rounded bg-background/80 hover:bg-background disabled:opacity-30"
                    title="下に移動"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => removeImage(img.id)}
                    className="p-1 rounded bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                    title="削除"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleConvert}
              disabled={processing}
            >
              {processing ? (
                "変換中..."
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  PDFとしてダウンロード
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {images.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>画像をアップロードするとここにプレビューが表示されます</p>
        </div>
      )}
    </div>
  );
}
