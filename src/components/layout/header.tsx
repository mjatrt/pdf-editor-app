"use client";

import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { FileText, LogOut, User, LayoutDashboard } from "lucide-react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between mx-auto px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <FileText className="h-5 w-5 text-primary" />
          PDF Editor
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/merge" className="hover:text-primary transition-colors">
            結合
          </Link>
          <Link href="/split" className="hover:text-primary transition-colors">
            分割
          </Link>
          <Link href="/edit" className="hover:text-primary transition-colors">
            編集
          </Link>
          <Link
            href="/watermark"
            className="hover:text-primary transition-colors"
          >
            透かし
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon" />}
              >
                <User className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  {session.user.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={<Link href="/dashboard" />}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  ダッシュボード
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                ログイン
              </Button>
              <Button size="sm" render={<Link href="/register" />}>
                新規登録
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
