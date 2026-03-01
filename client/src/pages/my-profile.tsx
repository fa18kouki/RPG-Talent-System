import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarDisplay } from "@/components/avatar-display";
import { AvatarCustomizer } from "@/components/avatar-customizer";
import { XPBar } from "@/components/xp-bar";
import { SkillRadar } from "@/components/skill-radar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Pencil, Trophy, Scroll, Swords, Heart, Sparkles, X, Plus, Save,
  BookOpen, Target, Quote,
} from "lucide-react";
import type { Employee, Skill, AvatarConfig, QuestCompletion } from "@shared/schema";
import {
  classLabels, classDescriptions, skillCategoryLabels,
  xpForLevel, type CharacterClass, type SkillCategory,
} from "@shared/schema";

export default function MyProfile() {
  const { toast } = useToast();
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [bio, setBio] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [motto, setMotto] = useState("");
  const [newHobby, setNewHobby] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("");

  const { data: employee, isLoading: empLoading } = useQuery<Employee>({
    queryKey: ["/api/my/employee"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: skills } = useQuery<Skill[]>({
    queryKey: ["/api/my/skills"],
    queryFn: async () => {
      if (!employee) return [];
      const res = await fetch(`/api/employees/${employee.id}/skills`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!employee,
  });

  const { data: completions } = useQuery<QuestCompletion[]>({
    queryKey: ["/api/my/completions"],
    queryFn: async () => {
      if (!employee) return [];
      const res = await fetch(`/api/employees/${employee.id}/completions`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!employee,
  });

  const profileMutation = useMutation({
    mutationFn: async (data: { bio: string; hobbies: string[]; specialties: string[]; motto: string }) => {
      const res = await apiRequest("PATCH", "/api/my/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my/employee"] });
      setEditOpen(false);
      toast({ title: "プロフィールを更新しました" });
    },
    onError: () => {
      toast({ title: "更新に失敗しました", variant: "destructive" });
    },
  });

  function openEditDialog() {
    setBio(employee?.bio || "");
    setHobbies(employee?.hobbies ? JSON.parse(employee.hobbies) : []);
    setSpecialties(employee?.specialties ? JSON.parse(employee.specialties) : []);
    setMotto(employee?.motto || "");
    setNewHobby("");
    setNewSpecialty("");
    setEditOpen(true);
  }

  function addHobby() {
    const trimmed = newHobby.trim();
    if (trimmed && !hobbies.includes(trimmed)) {
      setHobbies([...hobbies, trimmed]);
      setNewHobby("");
    }
  }

  function addSpecialty() {
    const trimmed = newSpecialty.trim();
    if (trimmed && !specialties.includes(trimmed)) {
      setSpecialties([...specialties, trimmed]);
      setNewSpecialty("");
    }
  }

  if (empLoading) {
    return (
      <div className="flex flex-col items-center gap-6 p-4 sm:p-8 max-w-2xl mx-auto">
        <Skeleton className="w-32 h-32" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full max-w-xs" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <Scroll className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-bold mb-2">冒険者データがありません</h2>
        <p className="text-sm text-muted-foreground">管理者にアカウントの紐づけを依頼してください</p>
      </div>
    );
  }

  const avatarConfig: AvatarConfig | null = employee.avatarConfig
    ? JSON.parse(employee.avatarConfig)
    : null;

  const charClass = employee.characterClass as CharacterClass;
  const employeeSkills = skills || [];
  const completionCount = completions?.length || 0;
  const totalXpEarned = completions?.reduce((sum, c) => sum + c.xpEarned, 0) || 0;
  const parsedHobbies: string[] = employee.hobbies ? JSON.parse(employee.hobbies) : [];
  const parsedSpecialties: string[] = employee.specialties ? JSON.parse(employee.specialties) : [];

  // Skill category summary for stat bars
  const categoryScores = (["technical", "communication", "leadership", "creativity", "analytics"] as SkillCategory[]).map(cat => {
    const catSkills = employeeSkills.filter(s => s.category === cat);
    if (catSkills.length === 0) return { category: cat, avg: 0, count: catSkills.length };
    const avg = catSkills.reduce((sum, s) => sum + s.level, 0) / catSkills.length;
    return { category: cat, avg, count: catSkills.length };
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-8 max-w-2xl mx-auto w-full">
      {/* Profile Header Card */}
      <Card className="p-4 sm:p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="border-2 border-primary p-3 bg-card shadow-[6px_6px_0_0_hsl(var(--primary)/0.3)]">
              <AvatarDisplay config={avatarConfig} size={180} />
            </div>
            <button
              onClick={() => setCustomizerOpen(true)}
              className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-1.5 border-2 border-background shadow-[2px_2px_0_0_hsl(var(--border))] hover:translate-y-[-1px] transition-transform"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </div>

          {/* Basic Info */}
          <div className="flex-1 text-center sm:text-left space-y-2 w-full">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-bold">{employee.name}</h1>
              <Badge className="text-[10px] border-2 bg-primary/10 text-primary border-primary/30">
                Lv.{employee.level}
              </Badge>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <Badge variant="secondary" className="text-[10px] border-2">
                {classLabels[charClass]}
              </Badge>
              <span className="text-[10px] text-muted-foreground font-mono">{employee.title}</span>
              <span className="text-[10px] text-muted-foreground">/ {employee.department}</span>
            </div>
            <p className="text-xs text-muted-foreground italic">
              {classDescriptions[charClass]}
            </p>
            <div className="max-w-xs mx-auto sm:mx-0">
              <XPBar currentXP={employee.currentXP} nextLevelXP={xpForLevel(employee.level)} level={employee.level} size="md" />
            </div>
            {/* Stats Row */}
            <div className="flex items-center justify-center sm:justify-start gap-4 text-[10px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3 text-chart-4" />
                クエスト達成: {completionCount}
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-chart-4" />
                累計XP: {employee.totalXP}
              </span>
            </div>
          </div>
        </div>

        {/* Motto */}
        {employee.motto && (
          <div className="mt-4 p-3 bg-card/50 border-2 border-border/50 flex items-start gap-2">
            <Quote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs italic text-muted-foreground">{employee.motto}</p>
          </div>
        )}
      </Card>

      {/* Edit Profile Button */}
      <Button variant="outline" size="sm" className="self-end text-xs border-2" onClick={openEditDialog}>
        <Pencil className="h-3 w-3 mr-1" />
        プロフィールを編集
      </Button>

      {/* Skill Radar Section */}
      <Card className="p-4 sm:p-6 border-2">
        <h2 className="text-sm font-bold font-mono flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-primary" />
          スキルレーダー
        </h2>
        {employeeSkills.length > 0 ? (
          <div className="flex flex-col items-center gap-4">
            <SkillRadar skills={employeeSkills} size={240} />
            {/* Category Bars */}
            <div className="w-full space-y-2 mt-2">
              {categoryScores.map(({ category, avg, count }) => (
                <div key={category} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground w-28 text-right shrink-0">
                    {skillCategoryLabels[category]}
                  </span>
                  <div className="flex-1 h-3 bg-muted border overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${(avg / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold w-8">{avg.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">まだスキルデータがありません</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">クエストを完了するとスキルが成長します</p>
          </div>
        )}
      </Card>

      {/* Bio Section */}
      <Card className="p-4 sm:p-6 border-2">
        <h2 className="text-sm font-bold font-mono flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-chart-2" />
          自己紹介
        </h2>
        {employee.bio ? (
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{employee.bio}</p>
        ) : (
          <p className="text-xs text-muted-foreground/50 italic">未設定 -「プロフィールを編集」から追加できます</p>
        )}
      </Card>

      {/* Hobbies & Specialties */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-4 border-2">
          <h2 className="text-sm font-bold font-mono flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4 text-rose-500" />
            趣味・興味
          </h2>
          {parsedHobbies.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {parsedHobbies.map((h, i) => (
                <Badge key={i} variant="outline" className="text-[10px] border-2">
                  {h}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/50 italic">未設定</p>
          )}
        </Card>

        <Card className="p-4 border-2">
          <h2 className="text-sm font-bold font-mono flex items-center gap-2 mb-3">
            <Swords className="h-4 w-4 text-chart-4" />
            得意分野
          </h2>
          {parsedSpecialties.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {parsedSpecialties.map((s, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] border-2">
                  {s}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/50 italic">未設定</p>
          )}
        </Card>
      </div>

      <AvatarCustomizer open={customizerOpen} onOpenChange={setCustomizerOpen} currentConfig={avatarConfig} />

      {/* Profile Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-base">プロフィール編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-mono">座右の銘</Label>
              <Input
                value={motto}
                onChange={e => setMotto(e.target.value)}
                className="text-xs"
                placeholder="好きな言葉やモットー..."
                maxLength={100}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-mono">自己紹介</Label>
              <Textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="text-xs min-h-[80px]"
                placeholder="自己紹介を書いてみましょう..."
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground text-right">{bio.length}/500</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono">趣味・興味</Label>
              <div className="flex gap-2">
                <Input
                  value={newHobby}
                  onChange={e => setNewHobby(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addHobby())}
                  className="text-xs flex-1"
                  placeholder="趣味を追加..."
                />
                <Button variant="outline" size="sm" onClick={addHobby} disabled={!newHobby.trim()} className="shrink-0">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {hobbies.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {hobbies.map((h, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] border-2 gap-1 pr-1">
                      {h}
                      <button onClick={() => setHobbies(hobbies.filter((_, j) => j !== i))} className="hover:text-destructive">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono">得意分野</Label>
              <div className="flex gap-2">
                <Input
                  value={newSpecialty}
                  onChange={e => setNewSpecialty(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
                  className="text-xs flex-1"
                  placeholder="得意分野を追加..."
                />
                <Button variant="outline" size="sm" onClick={addSpecialty} disabled={!newSpecialty.trim()} className="shrink-0">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {specialties.map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] border-2 gap-1 pr-1">
                      {s}
                      <button onClick={() => setSpecialties(specialties.filter((_, j) => j !== i))} className="hover:text-destructive">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} className="text-xs">
              キャンセル
            </Button>
            <Button
              onClick={() => profileMutation.mutate({ bio, hobbies, specialties, motto })}
              disabled={profileMutation.isPending}
              className="pixel-btn text-xs"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {profileMutation.isPending ? "保存中..." : "保存する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
