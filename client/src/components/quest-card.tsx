import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Star, Flame, Crown } from "lucide-react";
import type { Quest } from "@shared/schema";
import { difficultyLabels, skillCategoryLabels, type QuestDifficulty } from "@shared/schema";

const difficultyConfig: Record<QuestDifficulty, { icon: typeof Star; color: string; bg: string }> = {
  easy: { icon: Star, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  normal: { icon: Sparkles, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/10" },
  hard: { icon: Flame, color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-500/10" },
  legendary: { icon: Crown, color: "text-amber-400 dark:text-amber-300", bg: "bg-amber-400/10" },
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
    <Card className="p-4 hover-elevate transition-all duration-200" data-testid={`card-quest-${quest.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${config.bg}`}>
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
              <Badge variant="secondary" className="text-xs">
                {difficultyLabels[quest.difficulty]}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {skillCategoryLabels[quest.skillCategory]}
              </Badge>
              <span className="text-xs font-mono font-semibold text-primary" data-testid={`text-quest-xp-${quest.id}`}>
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
            data-testid={`button-accept-quest-${quest.id}`}
          >
            {isAccepting ? "..." : "受注"}
          </Button>
        )}
      </div>
    </Card>
  );
}
