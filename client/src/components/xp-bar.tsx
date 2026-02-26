import { Progress } from "@/components/ui/progress";

interface XPBarProps {
  currentXP: number;
  nextLevelXP: number;
  level: number;
  size?: "sm" | "md" | "lg";
}

export function XPBar({ currentXP, nextLevelXP, level, size = "md" }: XPBarProps) {
  const percent = Math.min((currentXP / nextLevelXP) * 100, 100);
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-3.5" };

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">Lv.{level}</span>
        <span className="text-xs text-muted-foreground font-mono">
          {currentXP} / {nextLevelXP} XP
        </span>
      </div>
      <div className={`relative ${heights[size]} rounded-full bg-muted overflow-hidden`}>
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-primary to-chart-1 transition-all duration-700 ease-out"
          style={{ width: `${percent}%` }}
          data-testid="xp-progress-fill"
        />
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent to-white/10"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
