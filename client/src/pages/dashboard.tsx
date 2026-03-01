import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CharacterCard } from "@/components/character-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ScrollText, Trophy, TrendingUp, Sparkles, AlertTriangle, Clock, CheckCircle2, Hourglass } from "lucide-react";
import type { Employee, Skill, Quest, QuestCompletion, QuestAssignment } from "@shared/schema";
import { getLevelFromTotalXP, difficultyLabels } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

type EnrichedAssignment = QuestAssignment & {
  quest: Quest | null;
  employee: Employee | null;
};

type DashboardSummary = {
  todayCompleted: EnrichedAssignment[];
  overdueAssignments: EnrichedAssignment[];
  pendingReviewCount: number;
  date: string;
};

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

  const { data: dashboardSummary, isLoading: loadingSummary } = useQuery<DashboardSummary>({
    queryKey: ["/api/admin/dashboard-summary"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const isLoading = loadingEmployees || loadingQuests || loadingCompletions;

  const stats = [
    {
      label: "冒険者数",
      value: employees?.length ?? 0,
      icon: Users,
      color: "text-primary",
      bg: "bg-pink-100 dark:bg-primary/15 border-2 border-pink-300 dark:border-primary/30",
    },
    {
      label: "アクティブクエスト",
      value: quests?.filter((q) => q.isActive).length ?? 0,
      icon: ScrollText,
      color: "text-chart-2",
      bg: "bg-emerald-100 dark:bg-chart-2/15 border-2 border-emerald-300 dark:border-chart-2/30",
    },
    {
      label: "完了クエスト",
      value: completions?.length ?? 0,
      icon: Trophy,
      color: "text-chart-4",
      bg: "bg-amber-100 dark:bg-chart-4/15 border-2 border-amber-300 dark:border-chart-4/30",
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
      bg: "bg-orange-100 dark:bg-chart-5/15 border-2 border-orange-300 dark:border-chart-5/30",
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
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-dashboard-title">
            <Sparkles className="h-5 w-5 text-chart-4" />
            ダッシュボード
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            ギルド全体の冒険者ステータスと活動状況
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4 border-2 border-border">
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-8 w-16 mt-3" />
                  <Skeleton className="h-3 w-24 mt-1" />
                </Card>
              ))
            : stats.map((stat) => (
                <Card key={stat.label} className="p-4 pixel-box border-2 border-border" data-testid={`card-stat-${stat.label}`}>
                  <div className={`flex h-10 w-10 items-center justify-center ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold font-mono">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                </Card>
              ))}
        </div>

        {/* Alert Sections: Overdue & Pending Review */}
        {!loadingSummary && dashboardSummary && (
          <>
            {/* Overdue Assignments */}
            {dashboardSummary.overdueAssignments.length > 0 && (
              <Card className="p-4 border-2 border-destructive/50 bg-destructive/5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <h2 className="text-sm font-bold text-destructive">期限超過の割当</h2>
                  <Badge variant="destructive" className="text-[10px] ml-auto">
                    {dashboardSummary.overdueAssignments.length}件
                  </Badge>
                </div>
                <div className="space-y-2">
                  {dashboardSummary.overdueAssignments.map(a => {
                    const dueDate = a.dueDate ? new Date(a.dueDate) : null;
                    const daysOverdue = dueDate
                      ? Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                      : 0;

                    return (
                      <div key={a.id} className="flex items-center gap-3 p-2 bg-background/50 border border-destructive/20">
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold truncate">{a.quest?.title || "不明"}</span>
                            {a.quest && (
                              <Badge variant="secondary" className="text-[9px]">
                                {difficultyLabels[a.quest.difficulty]}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">{a.employee?.name || "不明"}</span>
                            <span className="text-[10px] text-destructive font-bold ml-auto">
                              {daysOverdue > 0 ? `${daysOverdue}日超過` : "本日期限"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Pending Review Summary */}
            {dashboardSummary.pendingReviewCount > 0 && (
              <Card className="p-4 border-2 border-amber-400/50 bg-amber-50/30 dark:bg-amber-500/5">
                <div className="flex items-center gap-2">
                  <Hourglass className="h-5 w-5 text-amber-500" />
                  <h2 className="text-sm font-bold">承認待ちの提出</h2>
                  <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-300 ml-auto">
                    {dashboardSummary.pendingReviewCount}件
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  クエスト割当管理ページで確認・承認してください。
                </p>
              </Card>
            )}
          </>
        )}

        {/* Today's Completed Quests (Daily Report) */}
        {!loadingSummary && dashboardSummary && dashboardSummary.todayCompleted.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-semibold">本日の完了クエスト</h2>
              <Badge variant="outline" className="text-[10px] border-2 ml-auto">
                {dashboardSummary.date} / {dashboardSummary.todayCompleted.length}件
              </Badge>
            </div>
            <div className="space-y-2">
              {dashboardSummary.todayCompleted.map(a => (
                <Card key={a.id} className="p-3 border-2 border-emerald-400/30 bg-emerald-50/30 dark:bg-emerald-500/5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold truncate">{a.quest?.title || "不明"}</span>
                        {a.quest && (
                          <Badge variant="secondary" className="text-[9px]">
                            {difficultyLabels[a.quest.difficulty]}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{a.employee?.name || "不明"}</span>
                        {a.completedAt && (
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {new Date(a.completedAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-chart-4 shrink-0">
                      +{a.quest?.xpReward || 0} XP
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-chart-4" />
              トップ冒険者
            </h2>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-5 border-2 border-border">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-14 w-14" />
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
                        <div className="absolute -left-1 -top-1 z-10 flex h-7 w-7 items-center justify-center bg-chart-4 text-[9px] font-mono font-bold text-white border-2 border-amber-600">
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
                  <Card key={i} className="p-3 border-2 border-border">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20 mt-2" />
                  </Card>
                ))}
              </div>
            ) : recentCompletions.length === 0 ? (
              <Card className="p-8 text-center pixel-box border-2 border-border">
                <ScrollText className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">まだクエスト完了がありません</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {recentCompletions.map((completion) => {
                  const quest = quests?.find((q) => q.id === completion.questId);
                  const emp = employees?.find((e) => e.id === completion.employeeId);
                  return (
                    <Card key={completion.id} className="p-3 pixel-box border-2 border-border" data-testid={`card-completion-${completion.id}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {emp?.name ?? "不明"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {quest?.title ?? "不明なクエスト"}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-chart-4 shrink-0">
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
