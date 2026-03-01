import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sparkles, Star, Flame, Crown, CheckCircle2, Trophy,
  FileText, Calendar, Award, ScrollText,
} from "lucide-react";
import { useState } from "react";
import type { Quest, QuestCompletion, QuestAssignment } from "@shared/schema";
import {
  difficultyLabels, skillCategoryLabels,
  questSubmissionTypeLabels,
  type QuestDifficulty, type QuestSubmissionType,
} from "@shared/schema";

type HistoryItem = QuestCompletion & {
  quest: Quest | null;
  assignment: QuestAssignment | null;
};

const difficultyConfig: Record<QuestDifficulty, { icon: typeof Star; color: string; bg: string; border: string }> = {
  easy: { icon: Star, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15", border: "border-emerald-400" },
  normal: { icon: Sparkles, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/15", border: "border-blue-400" },
  hard: { icon: Flame, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/15", border: "border-orange-400" },
  legendary: { icon: Crown, color: "text-amber-500 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-400/15", border: "border-amber-400" },
};

export default function QuestHistory() {
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const { data: history, isLoading } = useQuery<HistoryItem[]>({
    queryKey: ["/api/my/quest-history"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 sm:p-8 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const totalXP = history?.reduce((sum, h) => sum + h.xpEarned, 0) || 0;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-8 max-w-2xl mx-auto w-full">
      {/* Summary Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10 border-2 border-primary">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-bold font-mono">冒険の記録</h1>
          <p className="text-xs text-muted-foreground">
            達成クエスト: {history?.length || 0}件 / 獲得XP: {totalXP}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {history && history.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 border-2 text-center">
            <Award className="h-4 w-4 mx-auto text-chart-4 mb-1" />
            <p className="text-lg font-bold font-mono">{history.length}</p>
            <p className="text-[9px] text-muted-foreground">達成クエスト</p>
          </Card>
          <Card className="p-3 border-2 text-center">
            <Sparkles className="h-4 w-4 mx-auto text-chart-5 mb-1" />
            <p className="text-lg font-bold font-mono">{totalXP}</p>
            <p className="text-[9px] text-muted-foreground">獲得XP</p>
          </Card>
          <Card className="p-3 border-2 text-center">
            <Calendar className="h-4 w-4 mx-auto text-chart-1 mb-1" />
            <p className="text-lg font-bold font-mono">
              {history.length > 0 && history[0].completedAt
                ? new Date(history[0].completedAt).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })
                : "-"
              }
            </p>
            <p className="text-[9px] text-muted-foreground">最終達成日</p>
          </Card>
        </div>
      )}

      {/* History List */}
      {!history || history.length === 0 ? (
        <Card className="p-8 text-center border-2 border-dashed border-muted-foreground/30">
          <ScrollText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">まだクエストの記録がありません</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">クエストを達成すると、ここに記録されます</p>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {history.map((item, index) => {
            if (!item.quest) return null;
            const cfg = difficultyConfig[item.quest.difficulty as QuestDifficulty];
            const DiffIcon = cfg?.icon || Star;

            return (
              <AccordionItem key={item.id} value={item.id} className="border-2 border-border">
                <AccordionTrigger className="px-3 sm:px-4 py-3 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-3 w-full mr-2">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center ${cfg?.bg || "bg-muted"} border-2 ${cfg?.border || "border-border"}`}>
                      <DiffIcon className={`h-4 w-4 ${cfg?.color || "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h3 className="text-sm font-semibold truncate">{item.quest.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {item.completedAt ? new Date(item.completedAt).toLocaleDateString("ja-JP") : ""}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-chart-4">+{item.xpEarned} XP</span>
                      </div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 sm:px-4 pb-3">
                  <div className="space-y-3 pt-1">
                    <p className="text-xs text-muted-foreground">{item.quest.description}</p>

                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-[9px] border-2">
                        {difficultyLabels[item.quest.difficulty as QuestDifficulty]}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] border-2">
                        {skillCategoryLabels[item.quest.skillCategory as keyof typeof skillCategoryLabels]}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] border-2">
                        {questSubmissionTypeLabels[item.quest.submissionType as QuestSubmissionType]}
                      </Badge>
                    </div>

                    {/* Submission Details */}
                    {item.assignment && (
                      <div className="space-y-2 mt-2">
                        {item.assignment.submissionNote && (
                          <div className="bg-muted/50 p-2 border text-xs">
                            <span className="text-[10px] font-mono text-muted-foreground block mb-1">提出コメント:</span>
                            {item.assignment.submissionNote}
                          </div>
                        )}

                        {item.assignment.submissionFiles && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono text-muted-foreground">提出ファイル:</span>
                            {(JSON.parse(item.assignment.submissionFiles) as Array<{ name: string; path: string }>).map((f, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs p-1.5 bg-muted/50 border">
                                <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{f.name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {item.assignment.submissionData && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono text-muted-foreground">フォーム回答:</span>
                            {Object.entries(JSON.parse(item.assignment.submissionData) as Record<string, string>).map(([key, value]) => (
                              <div key={key} className="bg-muted/50 p-2 border">
                                <span className="text-[10px] font-mono text-muted-foreground block">{key}:</span>
                                <span className="text-xs">{value}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {item.assignment.reviewNote && (
                          <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 border border-emerald-200 dark:border-emerald-500/30 text-xs">
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block mb-1">管理者コメント:</span>
                            {item.assignment.reviewNote}
                          </div>
                        )}

                        {item.assignment.submittedAt && (
                          <div className="text-[10px] text-muted-foreground font-mono">
                            提出日時: {new Date(item.assignment.submittedAt).toLocaleString("ja-JP")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
