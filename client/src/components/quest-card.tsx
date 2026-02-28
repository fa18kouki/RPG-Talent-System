import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Star, Flame, Crown } from "lucide-react";
import type { Quest } from "@shared/schema";
import { difficultyLabels, skillCategoryLabels, type QuestDifficulty } from "@shared/schema";

const difficultyConfig: Record<QuestDifficulty, { icon: typeof Star; color: string; bg: string; borderColor: string }> = {
  easy: { icon: Star, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15", borderColor: "border-emerald-400" },
  normal: { icon: Sparkles, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/15", borderColor: "border-blue-400" },
  hard: { icon: Flame, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/15", borderColor: "border-orange-400" },
  legendary: { icon: Crown, color: "text-amber-500 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-400/15", borderColor: "border-amber-400" },
};

interface QuestCardProps {
  quest: Quest;
  onAccept?: (questId: string) => void;
  isAccepting?: boolean;
  employeeId?: string;
}

export function QuestCard({ quest, onAccept, isAccepting, employeeId }: QuestCardProps) {
  const config = difficultyConfig[quest.difficulty];
  const DiffIcon = config.icon;

  return (
    <Card className="p-4 pixel-box hover-elevate transition-all duration-100 border-2 border-border" data-testid={`card-quest-${quest.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center ${config.bg} border-2 ${config.borderColor}`}>
            <DiffIcon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate" data-testid={`text-quest-title-${quest.id}`}>
              {quest.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {quest.description}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="text-[10px] border-2">
                {difficultyLabels[quest.difficulty]}
              </Badge>
              <Badge variant="outline" className="text-[10px] border-2">
                {skillCategoryLabels[quest.skillCategory]}
              </Badge>
              <span className="text-[9px] font-mono font-bold text-chart-4" data-testid={`text-quest-xp-${quest.id}`}>
                +{quest.xpReward} XP
              </span>
            </div>
          </div>
        </div>
        {onAccept && employeeId && (
          <Button
            size="sm"
            onClick={() => onAccept(quest.id)}
            disabled={isAccepting}
            className="pixel-btn"
            data-testid={`button-accept-quest-${quest.id}`}
          >
            {isAccepting ? "..." : "受注"}
          </Button>
        )}
      </div>
    </Card>
  );
}
