import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Shield, User as UserIcon, Loader2, Crown } from "lucide-react";
import type { User } from "@shared/schema";

type SafeUser = Omit<User, "password">;

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");

  const { data: users = [], isLoading } = useQuery<SafeUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; displayName: string; role: string }) => {
      const res = await apiRequest("POST", "/api/admin/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setDialogOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewDisplayName("");
      setNewRole("user");
      toast({ title: "ユーザーを作成しました" });
    },
    onError: (err: Error) => {
      toast({ title: "エラー", description: err.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "ユーザーを削除しました" });
    },
    onError: (err: Error) => {
      toast({ title: "エラー", description: err.message, variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "ロールを変更しました" });
    },
    onError: (err: Error) => {
      toast({ title: "エラー", description: err.message, variant: "destructive" });
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate({
      email: newEmail,
      password: newPassword,
      displayName: newDisplayName,
      role: newRole,
    });
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-pixel flex items-center gap-2" data-testid="text-admin-title">
            <Crown className="w-6 h-6 text-amber-500" />
            ユーザー管理
          </h1>
          <p className="text-sm text-muted-foreground font-pixel-body mt-1">
            システムユーザーの管理
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="pixel-btn border-2 font-pixel-body" data-testid="button-add-user">
              <UserPlus className="w-4 h-4 mr-2" />
              新規ユーザー
            </Button>
          </DialogTrigger>
          <DialogContent className="border-3">
            <DialogHeader>
              <DialogTitle className="font-pixel">新規ユーザー作成</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label className="font-pixel-body text-sm">表示名</Label>
                <Input
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="表示名を入力"
                  required
                  data-testid="input-new-displayname"
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-pixel-body text-sm">メールアドレス</Label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  data-testid="input-new-email"
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-pixel-body text-sm">パスワード</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6文字以上"
                  required
                  minLength={6}
                  data-testid="input-new-password"
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-pixel-body text-sm">ロール</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as "admin" | "user")}>
                  <SelectTrigger className="border-2" data-testid="select-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">管理者</SelectItem>
                    <SelectItem value="user">ユーザー</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full pixel-btn border-2 font-pixel-body"
                disabled={createUserMutation.isPending}
                data-testid="button-submit-user"
              >
                {createUserMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                作成
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3">
          {users.map((u) => (
            <Card key={u.id} className="border-2 shadow" data-testid={`card-user-${u.id}`}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 border-2 flex items-center justify-center">
                    {u.role === "admin" ? (
                      <Shield className="w-5 h-5 text-primary" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-pixel-body font-bold text-sm" data-testid={`text-user-name-${u.id}`}>
                      {u.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid={`text-user-email-${u.id}`}>
                      {u.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={u.role}
                    onValueChange={(role) => updateRoleMutation.mutate({ id: u.id, role })}
                    disabled={u.id === currentUser?.id}
                  >
                    <SelectTrigger className="w-28 border-2 text-xs" data-testid={`select-user-role-${u.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">管理者</SelectItem>
                      <SelectItem value="user">ユーザー</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="border-2"
                    onClick={() => {
                      if (confirm("このユーザーを削除しますか？")) {
                        deleteUserMutation.mutate(u.id);
                      }
                    }}
                    disabled={u.id === currentUser?.id}
                    data-testid={`button-delete-user-${u.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
