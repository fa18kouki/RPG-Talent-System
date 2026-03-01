import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarDisplay } from "@/components/avatar-display";
import { SkillRadar } from "@/components/skill-radar";
import { XPBar } from "@/components/xp-bar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users, Search, Heart, Swords, Trophy, Sparkles, Target,
  BookOpen, Quote, X,
} from "lucide-react";
import type { Employee, Skill, AvatarConfig } from "@shared/schema";
import {
  classLabels, classDescriptions, skillCategoryLabels,
  xpForLevel, type CharacterClass, type SkillCategory,
} from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

type ProfileEntry = Employee & {
  skills: Skill[];
  completionCount: number;
};

export default function ProfileDirectory() {
  const [search, setSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<ProfileEntry | null>(null);

  const { data: profiles, isLoading } = useQuery<ProfileEntry[]>({
    queryKey: ["/api/profiles"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const filtered = profiles?.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      classLabels[p.characterClass as CharacterClass]?.toLowerCase().includes(q) ||
      (p.hobbies && p.hobbies.toLowerCase().includes(q)) ||
      (p.specialties && p.specialties.toLowerCase().includes(q))
    );
  }) || [];

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            冒険者名鑑
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            社内メンバーのプロフィールを閲覧できます
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="名前・部署・趣味で検索..."
            className="pl-9 text-xs border-2"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Results count */}
        {!isLoading && (
          <p className="text-[10px] text-muted-foreground font-mono">
            {filtered.length}名の冒険者
          </p>
        )}

        {/* Profile Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4 border-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-16 w-16" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center border-2 border-dashed">
            <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">該当する冒険者が見つかりません</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {filtered.map(profile => {
              const avatarConfig: AvatarConfig | null = profile.avatarConfig
                ? JSON.parse(profile.avatarConfig)
                : null;
              const charClass = profile.characterClass as CharacterClass;
              const parsedHobbies: string[] = profile.hobbies ? JSON.parse(profile.hobbies) : [];
              const parsedSpecialties: string[] = profile.specialties ? JSON.parse(profile.specialties) : [];

              return (
                <Card
                  key={profile.id}
                  className="p-3 sm:p-4 border-2 hover:border-primary/30 transition-colors cursor-pointer group"
                  onClick={() => setSelectedProfile(profile)}
                >
                  <div className="flex items-start gap-3">
                    <div className="border-2 border-border p-1.5 shrink-0 group-hover:border-primary/30 transition-colors">
                      <AvatarDisplay config={avatarConfig} size={64} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold truncate">{profile.name}</h3>
                        <Badge className="text-[9px] bg-primary/10 text-primary border-primary/30 shrink-0">
                          Lv.{profile.level}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="secondary" className="text-[9px] border">
                          {classLabels[charClass]}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground">{profile.department}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono">{profile.title}</p>

                      {/* Quick Tags */}
                      {(parsedHobbies.length > 0 || parsedSpecialties.length > 0) && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {parsedSpecialties.slice(0, 2).map((s, i) => (
                            <Badge key={`s-${i}`} variant="outline" className="text-[8px] border h-4 px-1">
                              {s}
                            </Badge>
                          ))}
                          {parsedHobbies.slice(0, 2).map((h, i) => (
                            <Badge key={`h-${i}`} variant="outline" className="text-[8px] border h-4 px-1 border-rose-200 text-rose-600">
                              {h}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Profile Detail Modal */}
        <Dialog open={!!selectedProfile} onOpenChange={(open) => !open && setSelectedProfile(null)}>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            {selectedProfile && <ProfileDetail profile={selectedProfile} />}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function ProfileDetail({ profile }: { profile: ProfileEntry }) {
  const avatarConfig: AvatarConfig | null = profile.avatarConfig
    ? JSON.parse(profile.avatarConfig)
    : null;
  const charClass = profile.characterClass as CharacterClass;
  const parsedHobbies: string[] = profile.hobbies ? JSON.parse(profile.hobbies) : [];
  const parsedSpecialties: string[] = profile.specialties ? JSON.parse(profile.specialties) : [];

  const categoryScores = (["technical", "communication", "leadership", "creativity", "analytics"] as SkillCategory[]).map(cat => {
    const catSkills = profile.skills.filter(s => s.category === cat);
    if (catSkills.length === 0) return { category: cat, avg: 0 };
    const avg = catSkills.reduce((sum, s) => sum + s.level, 0) / catSkills.length;
    return { category: cat, avg };
  });

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="sr-only">{profile.name}のプロフィール</DialogTitle>
      </DialogHeader>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="border-2 border-primary p-2 shrink-0">
          <AvatarDisplay config={avatarConfig} size={96} />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold truncate">{profile.name}</h2>
            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/30">
              Lv.{profile.level}
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px] border-2">
              {classLabels[charClass]}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{profile.title}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">{profile.department}</p>
          <p className="text-xs text-muted-foreground italic">{classDescriptions[charClass]}</p>
          <div className="max-w-[200px]">
            <XPBar currentXP={profile.currentXP} nextLevelXP={xpForLevel(profile.level)} level={profile.level} size="sm" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1">
          <Trophy className="h-3 w-3 text-chart-4" />
          クエスト達成: {profile.completionCount}
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-chart-4" />
          累計XP: {profile.totalXP}
        </span>
      </div>

      {/* Motto */}
      {profile.motto && (
        <div className="p-2.5 bg-muted/50 border flex items-start gap-2">
          <Quote className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs italic text-muted-foreground">{profile.motto}</p>
        </div>
      )}

      {/* Skill Radar */}
      {profile.skills.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold font-mono flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-primary" />
            スキル
          </h3>
          <div className="flex flex-col items-center">
            <SkillRadar skills={profile.skills} size={200} />
          </div>
          <div className="space-y-1.5">
            {categoryScores.map(({ category, avg }) => (
              <div key={category} className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-muted-foreground w-24 text-right shrink-0">
                  {skillCategoryLabels[category]}
                </span>
                <div className="flex-1 h-2 bg-muted border overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${(avg / 10) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono w-6">{avg.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bio */}
      {profile.bio && (
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold font-mono flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-chart-2" />
            自己紹介
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
        </div>
      )}

      {/* Hobbies & Specialties */}
      <div className="grid grid-cols-2 gap-3">
        {parsedHobbies.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold font-mono flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-rose-500" />
              趣味
            </h3>
            <div className="flex flex-wrap gap-1">
              {parsedHobbies.map((h, i) => (
                <Badge key={i} variant="outline" className="text-[9px] border">
                  {h}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {parsedSpecialties.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold font-mono flex items-center gap-1.5">
              <Swords className="h-3.5 w-3.5 text-chart-4" />
              得意分野
            </h3>
            <div className="flex flex-wrap gap-1">
              {parsedSpecialties.map((s, i) => (
                <Badge key={i} variant="secondary" className="text-[9px] border">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
