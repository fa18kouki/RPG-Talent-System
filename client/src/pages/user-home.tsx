import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarDisplay } from "@/components/avatar-display";
import { AvatarCustomizer } from "@/components/avatar-customizer";
import { XPBar } from "@/components/xp-bar";
import {
  Sparkles, Star, Flame, Crown, CheckCircle2, Clock, Pencil, Scroll,
} from "lucide-react";
import type { Employee, Quest, QuestAssignment, AvatarConfig } from "@shared/schema";
import {
  difficultyLabels, skillCategoryLabels, classLabels,
  xpForLevel, type QuestDifficulty,
} from "@shared/schema";

type EnrichedAssignment = QuestAssignment & { quest: Quest | null };

const difficultyConfig: Record<QuestDifficulty, { icon: typeof Star; color: string; bg: string; border: string }> = {
  easy: { icon: Star, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15", border: "border-emerald-400" },
  normal: { icon: Sparkles, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/15", border: "border-blue-400" },
  hard: { icon: Flame, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/15", border: "border-orange-400" },
  legendary: { icon: Crown, color: "text-amber-500 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-400/15", border: "border-amber-400" },
};

export default function UserHome() {
  const { toast } = useToast();
  const [customizerOpen, setCustomizerOpen] = useState(false);

  const { data: employee, isLoading: empLoading } = useQuery<Employee>({
    queryKey: ["/api/my/employee"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: assignments, isLoading: questsLoading } = useQuery<EnrichedAssignment[]>({
    queryKey: ["/api/my/quests"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const completeMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await apiRequest("PATCH", `/api/my/quests/${assignmentId}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my/quests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my/employee"] });
      toast({ title: "クエスト完了！XPを獲得しました" });
    },
    onError: () => {
      toast({ title: "クエストの完了に失敗しました", variant: "destructive" });
    },
  });

  const avatarConfig: AvatarConfig | null = employee?.avatarConfig
    ? JSON.parse(employee.avatarConfig)
    : null;

  const now = new Date();
  const activeAssignments = assignments?.filter(a => {
    if (a.status !== "active") return false;
    if (a.dueDate && new Date(a.dueDate) < now) return false;
    return true;
  }) || [];

  const completedAssignments = assignments?.filter(a => a.status === "completed") || [];

  if (empLoading) {
    return (
      <div className="flex flex-col items-center gap-6 p-4 sm:p-8 max-w-2xl mx-auto">
        <Skeleton className="w-24 h-24 sm:w-32 sm:h-32" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full max-w-xs" />
        <div className="w-full space-y-3 mt-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <Scroll className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-bold mb-2">冒険者データがありません</h2>
        <p className="text-sm text-muted-foreground">
          管理者にアカウントの紐づけを依頼してください
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 p-4 sm:p-8 max-w-2xl mx-auto w-full">
      {/* Avatar & Profile Section */}
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="relative group">
          <div className="border-2 border-primary p-2 sm:p-3 bg-card shadow-[4px_4px_0_0_hsl(var(--primary)/0.3)]">
            <AvatarDisplay
              config={avatarConfig}
              size={96}
              className="sm:hidden"
              onClick={() => setCustomizerOpen(true)}
            />
            <AvatarDisplay
              config={avatarConfig}
              size={128}
              className="hidden sm:block"
              onClick={() => setCustomizerOpen(true)}
            />
          </div>
          <button
            onClick={() => setCustomizerOpen(true)}
            className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-1.5 border-2 border-background shadow-[2px_2px_0_0_hsl(var(--border))] hover:translate-y-[-1px] transition-transform"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>

        <div className="text-center">
          <h1 className="text-base sm:text-lg font-bold">{employee.name}</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge variant="secondary" className="text-[10px] border-2">
              {classLabels[employee.characterClass as keyof typeof classLabels]}
            </Badge>
            <span className="text-[10px] text-muted-foreground font-mono">
              {employee.title}
            </span>
          </div>
        </div>

        <div className="w-full max-w-xs">
          <XPBar
            currentXP={employee.currentXP}
            nextLevelXP={xpForLevel(employee.level)}
            level={employee.level}
            size="md"
          />
        </div>
      </div>

      {/* Active Quests Section */}
      <div className="w-full">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-chart-4" />
          <h2 className="text-sm font-bold font-mono">
            アクティブクエスト
          </h2>
          {activeAssignments.length > 0 && (
            <Badge variant="outline" className="text-[10px] border-2 ml-auto">
              {activeAssignments.length}件
            </Badge>
          )}
        </div>

        {questsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : activeAssignments.length === 0 ? (
          <Card className="p-6 sm:p-8 text-center border-2 border-dashed border-muted-foreground/30">
            <Scroll className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              現在アクティブなクエストはありません
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              管理者からクエストが割り当てられるのを待ちましょう
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeAssignments.map(a => {
              if (!a.quest) return null;
              const cfg = difficultyConfig[a.quest.difficulty];
              const DiffIcon = cfg.icon;
              const dueDate = a.dueDate ? new Date(a.dueDate) : null;
              const isUrgent = dueDate && (dueDate.getTime() - now.getTime()) < 24 * 60 * 60 * 1000;

              return (
                <Card
                  key={a.id}
                  className={`p-3 sm:p-4 border-2 ${isUrgent ? "border-destructive/50 bg-destructive/5" : "border-border"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center ${cfg.bg} border-2 ${cfg.border}`}>
                      <DiffIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">
                        {a.quest.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {a.quest.description}
                      </p>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary" className="text-[9px] sm:text-[10px] border-2">
                          {difficultyLabels[a.quest.difficulty]}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] sm:text-[10px] border-2">
                          {skillCategoryLabels[a.quest.skillCategory]}
                        </Badge>
                        <span className="text-[9px] font-mono font-bold text-chart-4">
                          +{a.quest.xpReward} XP
                        </span>
                      </div>
                      {dueDate && (
                        <div className={`flex items-center gap-1 mt-1.5 text-[10px] font-mono ${isUrgent ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                          <Clock className="h-3 w-3" />
                          期限: {dueDate.toLocaleDateString("ja-JP")}
                          {isUrgent && " (まもなく!)"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => completeMutation.mutate(a.id)}
                      disabled={completeMutation.isPending}
                      className="pixel-btn text-xs w-full sm:w-auto"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      {completeMutation.isPending ? "処理中..." : "完了する"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Quests Section */}
      {completedAssignments.length > 0 && (
        <div className="w-full">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-bold font-mono">完了済みクエスト</h2>
            <Badge variant="outline" className="text-[10px] border-2 ml-auto">
              {completedAssignments.length}件
            </Badge>
          </div>
          <div className="space-y-2">
            {completedAssignments.slice(0, 5).map(a => (
              <Card key={a.id} className="p-3 border-2 border-border/50 opacity-70">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium truncate block">
                      {a.quest?.title || "不明なクエスト"}
                    </span>
                    {a.completedAt && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(a.completedAt).toLocaleDateString("ja-JP")}
                      </span>
                    )}
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

      <AvatarCustomizer
        open={customizerOpen}
        onOpenChange={setCustomizerOpen}
        currentConfig={avatarConfig}
      />
    </div>
  );
}
