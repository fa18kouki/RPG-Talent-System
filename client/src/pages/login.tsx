import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sword, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      {
        onError: (err: Error) => {
          toast({
            title: "ログイン失敗",
            description: err.message.includes("401")
              ? "メールアドレスまたはパスワードが正しくありません"
              : "ログインに失敗しました",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-3 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex items-center justify-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <Sword className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-pixel" data-testid="text-login-title">
            Quest HR
          </CardTitle>
          <p className="text-sm text-muted-foreground font-pixel-body">
            冒険の世界へようこそ！ログインしてください
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-pixel-body text-sm">
                メールアドレス
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@questhr.com"
                required
                data-testid="input-email"
                className="border-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-pixel-body text-sm">
                パスワード
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                required
                data-testid="input-password"
                className="border-2"
              />
            </div>
            <Button
              type="submit"
              className="w-full pixel-btn border-2 font-pixel-body"
              disabled={login.isPending}
              data-testid="button-login"
            >
              {login.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sword className="w-4 h-4 mr-2" />
              )}
              ログイン
            </Button>
          </form>
          <div className="mt-6 p-3 bg-muted border-2 text-xs font-pixel-body space-y-1">
            <p className="font-bold">デモアカウント:</p>
            <p>管理者: admin@questhr.com / admin123</p>
            <p>ユーザー: user@questhr.com / user123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
