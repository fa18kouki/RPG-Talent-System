import { Sword, Sparkles, Heart, Target, Zap, ShieldCheck } from "lucide-react";
import type { CharacterClass } from "@shared/schema";

const classIcons: Record<CharacterClass, typeof Sword> = {
  warrior: Sword,
  mage: Sparkles,
  healer: Heart,
  ranger: Target,
  rogue: Zap,
  paladin: ShieldCheck,
};

const classColors: Record<CharacterClass, string> = {
  warrior: "text-red-500 dark:text-red-400",
  mage: "text-blue-500 dark:text-blue-400",
  healer: "text-emerald-500 dark:text-emerald-400",
  ranger: "text-amber-500 dark:text-amber-400",
  rogue: "text-purple-500 dark:text-purple-400",
  paladin: "text-sky-500 dark:text-sky-400",
};

const classBgColors: Record<CharacterClass, string> = {
  warrior: "bg-red-100 dark:bg-red-500/15 border-2 border-red-300 dark:border-red-500/30",
  mage: "bg-blue-100 dark:bg-blue-500/15 border-2 border-blue-300 dark:border-blue-500/30",
  healer: "bg-emerald-100 dark:bg-emerald-500/15 border-2 border-emerald-300 dark:border-emerald-500/30",
  ranger: "bg-amber-100 dark:bg-amber-500/15 border-2 border-amber-300 dark:border-amber-500/30",
  rogue: "bg-purple-100 dark:bg-purple-500/15 border-2 border-purple-300 dark:border-purple-500/30",
  paladin: "bg-sky-100 dark:bg-sky-500/15 border-2 border-sky-300 dark:border-sky-500/30",
};

interface ClassIconProps {
  characterClass: CharacterClass;
  size?: "sm" | "md" | "lg";
  showBg?: boolean;
}

export function ClassIcon({ characterClass, size = "md", showBg = true }: ClassIconProps) {
  const Icon = classIcons[characterClass];
  const sizes = {
    sm: { icon: "h-3.5 w-3.5", container: "h-7 w-7" },
    md: { icon: "h-5 w-5", container: "h-10 w-10" },
    lg: { icon: "h-7 w-7", container: "h-14 w-14" },
  };

  if (!showBg) {
    return <Icon className={`${sizes[size].icon} ${classColors[characterClass]}`} />;
  }

  return (
    <div
      className={`flex items-center justify-center ${sizes[size].container} ${classBgColors[characterClass]}`}
    >
      <Icon className={`${sizes[size].icon} ${classColors[characterClass]}`} />
    </div>
  );
}

export { classColors, classBgColors };
