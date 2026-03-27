import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combine,
  Scissors,
  RotateCcw,
  Droplets,
  Lock,
  FileText,
  Type,
  ImageIcon,
} from "lucide-react";

const tools = [
  {
    title: "PDF結合",
    description: "複数のPDFファイルを1つに結合",
    href: "/merge",
    icon: Combine,
  },
  {
    title: "PDF分割",
    description: "PDFを複数のファイルに分割",
    href: "/split",
    icon: Scissors,
  },
  {
    title: "ページ編集",
    description: "ページの削除・回転・並べ替え",
    href: "/edit",
    icon: RotateCcw,
  },
  {
    title: "透かし追加",
    description: "PDFにウォーターマークを追加",
    href: "/watermark",
    icon: Droplets,
  },
  {
    title: "パスワード保護",
    description: "PDFにパスワードを設定",
    href: "/password",
    icon: Lock,
  },
  {
    title: "メタデータ編集",
    description: "PDFのタイトル・作成者を編集",
    href: "/metadata",
    icon: FileText,
  },
  {
    title: "テキスト追加",
    description: "PDFの任意の位置にテキストを追加",
    href: "/text-edit",
    icon: Type,
  },
  {
    title: "画像→PDF",
    description: "画像ファイルをPDFに変換",
    href: "/image-to-pdf",
    icon: ImageIcon,
  },
];

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          ブラウザで簡単
          <span className="text-primary">PDF編集</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          PDFの結合・分割・回転・透かし追加など、すべてブラウザ上で完結。
          ファイルはサーバーに送信されず、安全に処理されます。
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button size="lg" render={<Link href="/merge" />}>
            今すぐ始める
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/register" />}>
            無料で登録
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader>
                <tool.icon className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">{tool.title}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>

      <section className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">安全・高速・無料</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground mb-1">クライアント処理</p>
            <p>PDFはブラウザ内で処理され、サーバーにアップロードされません</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">高速処理</p>
            <p>Web Workerによるバックグラウンド処理で快適に操作</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">完全無料</p>
            <p>基本機能はすべて無料でご利用いただけます</p>
          </div>
        </div>
      </section>
    </div>
  );
}
