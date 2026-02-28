import type { Skill } from "@shared/schema";
import { skillCategoryLabels, type SkillCategory } from "@shared/schema";

interface SkillRadarProps {
  skills: Skill[];
  size?: number;
}

export function SkillRadar({ skills, size = 200 }: SkillRadarProps) {
  const categories: SkillCategory[] = ["technical", "communication", "leadership", "creativity", "analytics"];
  const center = size / 2;
  const maxRadius = (size / 2) * 0.75;
  const levels = 10;

  const categoryScores = categories.map((cat) => {
    const catSkills = skills.filter((s) => s.category === cat);
    if (catSkills.length === 0) return 0;
    return catSkills.reduce((sum, s) => sum + s.level, 0) / catSkills.length;
  });

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / categories.length - Math.PI / 2;
    const radius = (value / levels) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const gridLines = [2, 4, 6, 8, 10];

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gridLines.map((level) => {
          const points = categories
            .map((_, i) => getPoint(i, level))
            .map((p) => `${p.x},${p.y}`)
            .join(" ");
          return (
            <polygon
              key={level}
              points={points}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="2"
              opacity={0.5}
              strokeLinejoin="miter"
            />
          );
        })}

        {categories.map((_, i) => {
          const p = getPoint(i, levels);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="hsl(var(--border))"
              strokeWidth="2"
              opacity={0.3}
            />
          );
        })}

        <polygon
          points={categoryScores
            .map((score, i) => getPoint(i, score))
            .map((p) => `${p.x},${p.y}`)
            .join(" ")}
          fill="hsl(var(--primary) / 0.2)"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinejoin="miter"
        />

        {categoryScores.map((score, i) => {
          const p = getPoint(i, score);
          return (
            <rect
              key={i}
              x={p.x - 4}
              y={p.y - 4}
              width="8"
              height="8"
              fill="hsl(var(--primary))"
              stroke="hsl(var(--background))"
              strokeWidth="2"
            />
          );
        })}

        {categories.map((cat, i) => {
          const p = getPoint(i, levels + 2);
          return (
            <text
              key={cat}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[10px] font-medium"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {skillCategoryLabels[cat]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
