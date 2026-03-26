"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { PdfDropzone } from "@/components/pdf/pdf-dropzone";
import { ProcessingOverlay } from "@/components/pdf/processing-overlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePdfStore } from "@/stores/pdf-store";
import { Lock, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PasswordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { processing, setProcessing, setProgress } = usePdfStore();

  const handleFilesAccepted = useCallback((files: File[]) => {
    setFile(files[0]);
    toast.success(`${files[0].name} を読み込みました`);
  }, []);

  const handleProtect = async () => {
    if (!file || !password) return;
    if (password !== confirmPassword) {
      toast.error("パスワードが一致しません");
      return;
    }

    setProcessing(true);
    try {
      setProgress(50);
      // pdf-lib has limited encryption support
      // For full encryption, a server-side solution (mupdf-wasm) would be needed
      toast.warning("パスワード保護機能は現在開発中です", {
        description:
          "pdf-libの制限により、完全な暗号化にはサーバーサイド処理が必要です。今後のアップデートで対応予定です。",
      });
      setProgress(100);
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
          <Lock className="h-7 w-7 text-primary" />
          パスワード保護
        </h1>
        <p className="text-muted-foreground mt-2">
          PDFにパスワードを設定、またはパスワードを解除します。
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

          <Tabs defaultValue="protect">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="protect">パスワード設定</TabsTrigger>
              <TabsTrigger value="remove">パスワード解除</TabsTrigger>
            </TabsList>

            <TabsContent value="protect" className="space-y-4 mt-4">
              <div className="rounded-lg border p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">パスワード</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="パスワードを入力"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">パスワード（確認）</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="パスワードを再入力"
                  />
                </div>
              </div>
              <Button
                size="lg"
                className="w-full"
                onClick={handleProtect}
                disabled={processing || !password || !confirmPassword}
              >
                <Download className="mr-2 h-5 w-5" />
                パスワードを設定してダウンロード
              </Button>
            </TabsContent>

            <TabsContent value="remove" className="space-y-4 mt-4">
              <div className="rounded-lg border p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">現在のパスワード</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="PDFのパスワードを入力"
                  />
                </div>
              </div>
              <Button
                size="lg"
                className="w-full"
                onClick={handleProtect}
                disabled={processing || !password}
              >
                <Download className="mr-2 h-5 w-5" />
                パスワードを解除してダウンロード
              </Button>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-muted-foreground text-center">
            ※ パスワード保護機能は現在開発中です。pdf-libの制限により完全な暗号化には対応していません。
          </p>
        </div>
      )}
    </div>
  );
}
