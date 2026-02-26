import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { CharacterCard } from "@/components/character-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ScrollText, Trophy, TrendingUp } from "lucide-react";
import type { Employee, Skill, Quest, QuestCompletion } from "@shared/schema";
import { getLevelFromTotalXP } from "@shared/schema";

export default function Dashboard() {
  const { data: employees, isLoading: loadingEmployees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: quests, isLoading: loadingQuests } = useQuery<Quest[]>({
    queryKey: ["/api/quests"],
  });

  const { data: completions, isLoading: loadingCompletions } = useQuery<QuestCompletion[]>({
    queryKey: ["/api/completions"],
  });

  const { data: allSkills } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });

  const isLoading = loadingEmployees || loadingQuests || loadingCompletions;

  const stats = [
    {
      label: "冒険者数",
      value: employees?.length ?? 0,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "アクティブクエスト",
      value: quests?.filter((q) => q.isActive).length ?? 0,
      icon: ScrollText,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      label: "完了クエスト",
      value: completions?.length ?? 0,
      icon: Trophy,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
    },
    {
      label: "平均レベル",
      value: employees?.length
        ? Math.round(
            employees.reduce((sum, e) => sum + getLevelFromTotalXP(e.totalXP).level, 0) /
              employees.length
          )
        : 0,
      icon: TrendingUp,
      color: "text-chart-5",
      bg: "bg-chart-5/10",
    },
  ];

  const topEmployees = employees
    ? [...employees].sort((a, b) => b.totalXP - a.totalXP).slice(0, 5)
    : [];

  const recentCompletions = completions
    ? [...completions].sort(
        (a, b) =>
          new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
      ).slice(0, 5)
    : [];

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">
            ダッシュボード
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ギルド全体の冒険者ステータスと活動状況
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <Skeleton className="h-8 w-16 mt-3" />
                  <Skeleton className="h-3 w-24 mt-1" />
                </Card>
              ))
            : stats.map((stat) => (
                <Card key={stat.label} className="p-4" data-testid={`card-stat-${stat.label}`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-md ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </Card>
              ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-chart-4" />
              トップ冒険者
            </h2>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-5">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-14 w-14 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {topEmployees.map((emp, index) => {
                  const empSkills = allSkills?.filter((s) => s.employeeId === emp.id) ?? [];
                  return (
                    <div key={emp.id} className="relative">
                      {index < 3 && (
                        <div className="absolute -left-1 -top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-chart-4 text-[11px] font-bold text-white">
                          {index + 1}
                        </div>
                      )}
                      <CharacterCard employee={emp} skills={empSkills} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-chart-2" />
              最近の冒険
            </h2>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="p-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20 mt-2" />
                  </Card>
                ))}
              </div>
            ) : recentCompletions.length === 0 ? (
              <Card className="p-8 text-center">
                <ScrollText className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">まだクエスト完了がありません</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {recentCompletions.map((completion) => {
                  const quest = quests?.find((q) => q.id === completion.questId);
                  const emp = employees?.find((e) => e.id === completion.employeeId);
                  return (
                    <Card key={completion.id} className="p-3" data-testid={`card-completion-${completion.id}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {emp?.name ?? "不明"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {quest?.title ?? "不明なクエスト"}
                          </p>
                        </div>
                        <span className="text-xs font-mono font-semibold text-primary shrink-0">
                          +{completion.xpEarned} XP
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
