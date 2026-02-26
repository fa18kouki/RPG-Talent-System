import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { XPBar } from "@/components/xp-bar";
import { ClassIcon } from "@/components/class-icon";
import type { Employee, Skill } from "@shared/schema";
import { classLabels, getLevelFromTotalXP, skillCategoryLabels } from "@shared/schema";
import { Link } from "wouter";

interface CharacterCardProps {
  employee: Employee;
  skills?: Skill[];
  compact?: boolean;
}

export function CharacterCard({ employee, skills = [], compact = false }: CharacterCardProps) {
  const { level, currentXP, nextLevelXP } = getLevelFromTotalXP(employee.totalXP);
  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  if (compact) {
    return (
      <Link href={`/employees/${employee.id}`} data-testid={`link-employee-${employee.id}`}>
        <Card className="p-4 hover-elevate cursor-pointer transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background text-[10px] font-bold border border-border">
                {level}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold truncate" data-testid={`text-employee-name-${employee.id}`}>
                  {employee.name}
                </span>
                <ClassIcon characterClass={employee.characterClass} size="sm" showBg={false} />
              </div>
              <p className="text-xs text-muted-foreground truncate">{employee.title}</p>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">
              {classLabels[employee.characterClass]}
            </Badge>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/employees/${employee.id}`} data-testid={`link-employee-card-${employee.id}`}>
      <Card className="p-5 hover-elevate cursor-pointer transition-all duration-200 group">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
              {level}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold truncate" data-testid={`text-name-${employee.id}`}>
                {employee.name}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {classLabels[employee.characterClass]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{employee.title}</p>
            <p className="text-xs text-muted-foreground">{employee.department}</p>
          </div>
          <ClassIcon characterClass={employee.characterClass} size="md" />
        </div>

        <div className="mt-4">
          <XPBar currentXP={currentXP} nextLevelXP={nextLevelXP} level={level} size="sm" />
        </div>

        {skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.slice(0, 4).map((skill) => (
              <div
                key={skill.id}
                className="flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5"
              >
                <span className="text-[11px] text-muted-foreground">{skill.name}</span>
                <span className="text-[10px] font-mono font-semibold text-foreground">
                  Lv.{skill.level}
                </span>
              </div>
            ))}
            {skills.length > 4 && (
              <span className="text-[11px] text-muted-foreground self-center">
                +{skills.length - 4}
              </span>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
}
