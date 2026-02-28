import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { XPBar } from "@/components/xp-bar";
import { ClassIcon } from "@/components/class-icon";
import { SkillRadar } from "@/components/skill-radar";
import { QuestCard } from "@/components/quest-card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star, Swords } from "lucide-react";
import { Link } from "wouter";
import type { Employee, Skill, Quest, QuestCompletion } from "@shared/schema";
import {
  classLabels,
  classDescriptions,
  getLevelFromTotalXP,
  skillCategoryLabels,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function EmployeeDetail() {
  const [, params] = useRoute("/employees/:id");
  const id = params?.id;
  const { toast } = useToast();

  const { data: employee, isLoading: loadingEmployee } = useQuery<Employee>({
    queryKey: ["/api/employees", id],
    enabled: !!id,
  });

  const { data: skills, isLoading: loadingSkills } = useQuery<Skill[]>({
    queryKey: ["/api/employees", id, "skills"],
    enabled: !!id,
  });

  const { data: quests } = useQuery<Quest[]>({
    queryKey: ["/api/quests"],
  });

  const { data: completions } = useQuery<QuestCompletion[]>({
    queryKey: ["/api/employees", id, "completions"],
    enabled: !!id,
  });

  const completeQuestMutation = useMutation({
    mutationFn: async (questId: string) => {
      const res = await apiRequest("POST", "/api/completions", {
        questId,
        employeeId: id,
        xpEarned: quests?.find((q) => q.id === questId)?.xpReward ?? 0,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees", id, "completions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/completions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "クエスト完了！", description: "経験値を獲得しました" });
    },
    onError: () => {
      toast({ title: "エラー", description: "クエスト完了に失敗しました", variant: "destructive" });
    },
  });

  if (loadingEmployee || loadingSkills) {
    return (
      <div className="h-full overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-32" />
          <Card className="p-6 border-2 border-border">
            <div className="flex items-center gap-6">
              <Skeleton className="h-20 w-20" />
              <div className="space-y-3 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="p-12 text-center pixel-box border-2 border-border">
          <h2 className="text-lg font-semibold">冒険者が見つかりません</h2>
          <p className="text-xs text-muted-foreground mt-1">この冒険者は存在しないか、削除されています</p>
          <Link href="/employees">
            <Button variant="secondary" className="mt-4 pixel-btn" data-testid="button-back-to-employees">
              <ArrowLeft className="h-4 w-4 mr-2" />
              冒険者一覧に戻る
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { level, currentXP, nextLevelXP } = getLevelFromTotalXP(employee.totalXP);
  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const completedQuestIds = new Set(completions?.map((c) => c.questId) ?? []);
  const activeQuests = quests?.filter((q) => q.isActive && !completedQuestIds.has(q.id)) ?? [];

  const skillsByCategory = (skills ?? []).reduce(
    (acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    },
    {} as Record<string, Skill[]>
  );

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Link href="/employees">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            冒険者一覧
          </Button>
        </Link>

        <Card className="p-6 pixel-box border-2 border-border">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20 border-3 border-primary">
                <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground text-[10px] font-mono font-bold border-2 border-primary">
                {level}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold" data-testid="text-employee-detail-name">
                  {employee.name}
                </h1>
                <Badge variant="secondary" className="border-2">{classLabels[employee.characterClass]}</Badge>
                <ClassIcon characterClass={employee.characterClass} size="sm" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">{employee.title} - {employee.department}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 italic">
                {classDescriptions[employee.characterClass]}
              </p>
              <div className="mt-4 max-w-md">
                <XPBar currentXP={currentXP} nextLevelXP={nextLevelXP} level={level} size="lg" />
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-chart-4" />
                  総XP: <span className="font-mono font-bold text-foreground text-[10px]">{employee.totalXP}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Swords className="h-3.5 w-3.5 text-chart-2" />
                  完了: <span className="font-mono font-bold text-foreground text-[10px]">{completions?.length ?? 0}</span>
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">スキルマップ</h2>
            {skills && skills.length > 0 ? (
              <>
                <Card className="p-4 flex items-center justify-center pixel-box border-2 border-border">
                  <SkillRadar skills={skills} size={220} />
                </Card>
                <div className="space-y-3">
                  {Object.entries(skillsByCategory).map(([category, catSkills]) => (
                    <Card key={category} className="p-4 pixel-box border-2 border-border">
                      <h3 className="text-sm font-semibold mb-3">
                        {skillCategoryLabels[category as keyof typeof skillCategoryLabels]}
                      </h3>
                      <div className="space-y-2">
                        {catSkills.map((skill) => (
                          <div key={skill.id} className="flex items-center gap-3" data-testid={`skill-${skill.id}`}>
                            <span className="text-sm flex-1 min-w-0 truncate">{skill.name}</span>
                            <span className="text-[9px] font-mono text-muted-foreground shrink-0">
                              Lv.{skill.level}/{skill.maxLevel}
                            </span>
                            <div className="w-20 shrink-0 h-2 border-2 border-border bg-muted overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${(skill.level / skill.maxLevel) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card className="p-8 text-center pixel-box border-2 border-border">
                <p className="text-sm text-muted-foreground">まだスキルが登録されていません</p>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">受注可能なクエスト</h2>
            {activeQuests.length === 0 ? (
              <Card className="p-8 text-center pixel-box border-2 border-border">
                <p className="text-sm text-muted-foreground">現在受注可能なクエストはありません</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {activeQuests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onAccept={(questId) => completeQuestMutation.mutate(questId)}
                    isAccepting={completeQuestMutation.isPending}
                    employeeId={id}
                  />
                ))}
              </div>
            )}

            {completions && completions.length > 0 && (
              <>
                <h2 className="text-lg font-semibold mt-6">冒険の記録</h2>
                <div className="space-y-2">
                  {completions.map((completion) => {
                    const quest = quests?.find((q) => q.id === completion.questId);
                    return (
                      <Card key={completion.id} className="p-3 pixel-box border-2 border-border" data-testid={`card-history-${completion.id}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{quest?.title ?? "不明"}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {completion.completedAt
                                ? new Date(completion.completedAt).toLocaleDateString("ja-JP")
                                : "日付不明"}
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
