"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        toast.error("ログインに失敗しました", {
          description: result.error.message,
        });
      } else {
        toast.success("ログインしました");
        router.push("/dashboard");
      }
    } catch {
      toast.error("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ログイン</CardTitle>
          <CardDescription>
            アカウントにログインしてPDF編集を始めましょう
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="mail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ログイン
            </Button>
          </form>


        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            アカウントをお持ちでない方は{" "}
            <Link href="/register" className="text-primary hover:underline">
              新規登録
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
