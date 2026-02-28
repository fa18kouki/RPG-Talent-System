interface XPBarProps {
  currentXP: number;
  nextLevelXP: number;
  level: number;
  size?: "sm" | "md" | "lg";
}

export function XPBar({ currentXP, nextLevelXP, level, size = "md" }: XPBarProps) {
  const percent = Math.min((currentXP / nextLevelXP) * 100, 100);
  const heights = { sm: "h-3", md: "h-4", lg: "h-5" };

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono font-bold text-primary">Lv.{level}</span>
        <span className="text-[8px] text-muted-foreground font-mono">
          {currentXP} / {nextLevelXP} XP
        </span>
      </div>
      <div className={`relative ${heights[size]} bg-muted border-2 border-border overflow-hidden`}>
        <div
          className="absolute inset-0 bg-gradient-to-r from-chart-4 via-chart-5 to-primary transition-all duration-500 ease-linear"
          style={{ width: `${percent}%` }}
          data-testid="xp-progress-fill"
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            width: `${percent}%`,
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.3) 4px, rgba(255,255,255,0.3) 8px)',
          }}
        />
      </div>
    </div>
  );
}
