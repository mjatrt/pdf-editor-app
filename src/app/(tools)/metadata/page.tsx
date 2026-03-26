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
import { getMetadata, setMetadata, type PdfMetadata } from "@/lib/pdf/metadata";
import { FileText, Download, Save } from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MetadataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<PdfMetadata | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [keywords, setKeywords] = useState("");
  const { processing, setProcessing, setProgress } = usePdfStore();

  const handleFilesAccepted = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    try {
      const buffer = await f.arrayBuffer();
      const metadata = await getMetadata(buffer);
      setMeta(metadata);
      setTitle(metadata.title || "");
      setAuthor(metadata.author || "");
      setSubject(metadata.subject || "");
      setKeywords(metadata.keywords?.join(", ") || "");
      toast.success(`${f.name} のメタデータを読み込みました`);
    } catch {
      toast.error("メタデータの読み込みに失敗しました");
    }
  }, []);

  const handleSave = async () => {
    if (!file) return;

    setProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      setProgress(30);

      const result = await setMetadata(buffer, {
        title: title || undefined,
        author: author || undefined,
        subject: subject || undefined,
        keywords: keywords
          ? keywords.split(",").map((k) => k.trim())
          : undefined,
      });
      setProgress(90);

      const blob = new Blob([result.buffer as ArrayBuffer], { type: "application/pdf" });
      saveAs(blob, file.name);
      setProgress(100);
      toast.success("メタデータを更新しました");
    } catch (error) {
      toast.error("保存に失敗しました", {
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
          <FileText className="h-7 w-7 text-primary" />
          メタデータ編集
        </h1>
        <p className="text-muted-foreground mt-2">
          PDFのタイトル、作成者、キーワードなどのメタデータを表示・編集します。
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

          {meta && (
            <div className="rounded-lg border p-4 bg-muted/50">
              <h3 className="text-sm font-medium mb-2">ファイル情報</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">ページ数:</span>
                <span>{meta.pageCount}</span>
                <span className="text-muted-foreground">ファイルサイズ:</span>
                <span>{formatBytes(meta.fileSize)}</span>
                {meta.creator && (
                  <>
                    <span className="text-muted-foreground">作成ツール:</span>
                    <span>{meta.creator}</span>
                  </>
                )}
                {meta.creationDate && (
                  <>
                    <span className="text-muted-foreground">作成日:</span>
                    <span>{meta.creationDate.toLocaleString("ja-JP")}</span>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg border p-4 space-y-4">
            <h3 className="text-sm font-medium">メタデータ編集</h3>
            <div className="space-y-2">
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="PDFのタイトル"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">作成者</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="作成者名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">サブタイトル</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="サブタイトル"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">キーワード</Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="カンマ区切りでキーワードを入力"
              />
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleSave}
            disabled={processing}
          >
            <Download className="mr-2 h-5 w-5" />
            メタデータを更新してダウンロード
          </Button>
        </div>
      )}
    </div>
  );
}
