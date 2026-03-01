import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AvatarDisplay } from "@/components/avatar-display";
import {
  Sun, Moon, FileText, Calendar, Users, MessageCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { Employee, DailyChatLog, AvatarConfig } from "@shared/schema";
import { classLabels, dailyChatTypeLabels, type CharacterClass, type DailyChatType } from "@shared/schema";

type EnrichedReport = DailyChatLog & {
  employee: Employee | null;
};

interface ReportsResponse {
  reports: EnrichedReport[];
  dates: string[];
}

export default function AdminDailyReports() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const { data, isLoading } = useQuery<ReportsResponse>({
    queryKey: ["/api/admin/daily-reports", selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/admin/daily-reports?date=${selectedDate}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const reports = data?.reports || [];
  const dates = data?.dates || [];

  // Group reports by employee
  const byEmployee = new Map<string, { employee: Employee; morning: EnrichedReport | null; evening: EnrichedReport | null }>();
  for (const r of reports) {
    if (!r.employee) continue;
    if (!byEmployee.has(r.employeeId)) {
      byEmployee.set(r.employeeId, { employee: r.employee, morning: null, evening: null });
    }
    const entry = byEmployee.get(r.employeeId)!;
    if (r.type === "morning") entry.morning = r;
    if (r.type === "evening") entry.evening = r;
  }

  function navigateDate(direction: -1 | 1) {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    setSelectedDate(current.toISOString().slice(0, 10));
  }

  const selectedDateFormatted = new Date(selectedDate + "T00:00:00").toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10 border-2 border-primary">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold font-mono">デイリーレポート</h1>
            <p className="text-xs text-muted-foreground">冒険者の毎日の振り返り記録</p>
          </div>
        </div>

        {/* Date Navigation */}
        <Card className="p-3 border-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => navigateDate(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-bold font-mono">{selectedDateFormatted}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => navigateDate(1)}
            disabled={selectedDate >= today}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Card>

        {/* Date quick picker from available dates */}
        {dates.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {dates.slice(0, 7).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`text-[10px] px-2 py-1 border-2 font-mono transition-colors ${
                  d === selectedDate
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border hover:bg-muted"
                }`}
              >
                {new Date(d + "T00:00:00").toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
              </button>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 border-2 text-center">
            <Users className="h-4 w-4 mx-auto text-chart-1 mb-1" />
            <p className="text-lg font-bold font-mono">{byEmployee.size}</p>
            <p className="text-[9px] text-muted-foreground">報告者数</p>
          </Card>
          <Card className="p-3 border-2 text-center">
            <Sun className="h-4 w-4 mx-auto text-amber-500 mb-1" />
            <p className="text-lg font-bold font-mono">
              {reports.filter(r => r.type === "morning").length}
            </p>
            <p className="text-[9px] text-muted-foreground">朝チェックイン</p>
          </Card>
          <Card className="p-3 border-2 text-center">
            <Moon className="h-4 w-4 mx-auto text-indigo-500 mb-1" />
            <p className="text-lg font-bold font-mono">
              {reports.filter(r => r.type === "evening").length}
            </p>
            <p className="text-[9px] text-muted-foreground">夜チェックイン</p>
          </Card>
        </div>

        {/* Reports */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : byEmployee.size === 0 ? (
          <Card className="p-8 text-center border-2 border-dashed border-muted-foreground/30">
            <MessageCircle className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">この日のレポートはありません</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">冒険者がチェックインすると、ここにレポートが表示されます</p>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {Array.from(byEmployee.entries()).map(([empId, { employee, morning, evening }]) => {
              const avatarConfig: AvatarConfig | null = employee.avatarConfig
                ? JSON.parse(employee.avatarConfig)
                : null;
              const className = classLabels[employee.characterClass as CharacterClass] || employee.characterClass;

              return (
                <AccordionItem key={empId} value={empId} className="border-2 border-border">
                  <AccordionTrigger className="px-3 sm:px-4 py-3 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center gap-3 w-full mr-2">
                      <AvatarDisplay config={avatarConfig} size={36} />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold truncate">{employee.name}</span>
                          <Badge variant="secondary" className="text-[9px] border">{className}</Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">Lv.{employee.level}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {morning ? (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono flex items-center gap-0.5">
                              <Sun className="h-2.5 w-2.5" /> 朝 ✓
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
                              <Sun className="h-2.5 w-2.5" /> 朝 -
                            </span>
                          )}
                          {evening ? (
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono flex items-center gap-0.5">
                              <Moon className="h-2.5 w-2.5" /> 夜 ✓
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
                              <Moon className="h-2.5 w-2.5" /> 夜 -
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 sm:px-4 pb-4">
                    <div className="space-y-3">
                      {/* Morning Report */}
                      {morning && (
                        <div className="border-2 border-amber-300/50 bg-amber-50/30 dark:bg-amber-500/5 p-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Sun className="h-3.5 w-3.5 text-amber-500" />
                            <span className="text-xs font-bold font-mono text-amber-700 dark:text-amber-400">
                              朝の振り返り
                            </span>
                            {morning.createdAt && (
                              <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                                {new Date(morning.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                          </div>
                          <div className="text-xs whitespace-pre-wrap leading-relaxed bg-background/50 p-2 border">
                            {morning.summary}
                          </div>
                          {/* Show conversation */}
                          <details className="mt-2">
                            <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground font-mono">
                              会話ログを表示
                            </summary>
                            <div className="mt-2 space-y-1.5">
                              {(JSON.parse(morning.messages) as Array<{ role: string; content: string }>).map((m, i) => (
                                <div key={i} className={`text-[10px] p-1.5 ${m.role === "user" ? "bg-primary/10 border-l-2 border-primary" : "bg-muted border-l-2 border-muted-foreground/30"}`}>
                                  <span className="font-bold font-mono">{m.role === "user" ? "本人" : "AI"}:</span>{" "}
                                  {m.content}
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}

                      {/* Evening Report */}
                      {evening && (
                        <div className="border-2 border-indigo-300/50 bg-indigo-50/30 dark:bg-indigo-500/5 p-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Moon className="h-3.5 w-3.5 text-indigo-500" />
                            <span className="text-xs font-bold font-mono text-indigo-700 dark:text-indigo-400">
                              夜の振り返り
                            </span>
                            {evening.createdAt && (
                              <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                                {new Date(evening.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                          </div>
                          <div className="text-xs whitespace-pre-wrap leading-relaxed bg-background/50 p-2 border">
                            {evening.summary}
                          </div>
                          <details className="mt-2">
                            <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground font-mono">
                              会話ログを表示
                            </summary>
                            <div className="mt-2 space-y-1.5">
                              {(JSON.parse(evening.messages) as Array<{ role: string; content: string }>).map((m, i) => (
                                <div key={i} className={`text-[10px] p-1.5 ${m.role === "user" ? "bg-primary/10 border-l-2 border-primary" : "bg-muted border-l-2 border-muted-foreground/30"}`}>
                                  <span className="font-bold font-mono">{m.role === "user" ? "本人" : "AI"}:</span>{" "}
                                  {m.content}
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}

                      {!morning && !evening && (
                        <p className="text-xs text-muted-foreground text-center py-2">この日のチェックインはありません</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
}
