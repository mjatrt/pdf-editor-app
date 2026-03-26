"use client";

import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Combine,
  Scissors,
  RotateCcw,
  Droplets,
  FileText,
} from "lucide-react";
import Link from "next/link";

const quickActions = [
  { title: "PDF結合", href: "/merge", icon: Combine },
  { title: "PDF分割", href: "/split", icon: Scissors },
  { title: "ページ編集", href: "/edit", icon: RotateCcw },
  { title: "透かし追加", href: "/watermark", icon: Droplets },
  { title: "メタデータ", href: "/metadata", icon: FileText },
];

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LayoutDashboard className="h-7 w-7 text-primary" />
          ダッシュボード
        </h1>
        {session && (
          <p className="text-muted-foreground mt-2">
            ようこそ、{session.user.name}さん
          </p>
        )}
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-4">クイックアクション</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer text-center">
                  <CardContent className="pt-4 pb-3 px-3">
                    <action.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-xs font-medium">{action.title}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">最近の操作履歴</h2>
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p className="text-sm">まだ操作履歴はありません</p>
              <p className="text-xs mt-1">
                PDFを編集すると、ここに履歴が表示されます
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
