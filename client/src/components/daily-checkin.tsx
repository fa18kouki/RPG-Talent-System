import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AvatarDisplay } from "@/components/avatar-display";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sun, Moon, Send, CheckCircle2, MessageCircle, Sparkles, Lock,
} from "lucide-react";
import type { Employee, AvatarConfig, DailyChatLog } from "@shared/schema";

interface DailyCheckinStatus {
  date: string;
  morning: DailyChatLog | null;
  evening: DailyChatLog | null;
}

interface DailyCheckinQuestProps {
  employee: Employee;
  avatarConfig: AvatarConfig | null;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export function DailyCheckinQuest({ employee, avatarConfig }: DailyCheckinQuestProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checkinType, setCheckinType] = useState<"morning" | "evening">("morning");
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [turnCount, setTurnCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: status, isLoading } = useQuery<DailyCheckinStatus>({
    queryKey: ["/api/my/daily-checkin/status"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ type, messages }: { type: string; messages: ChatMsg[] }) => {
      const res = await apiRequest("POST", "/api/my/daily-checkin", { type, messages });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my/daily-checkin/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my/employee"] });
      toast({ title: `✨ チェックイン完了！+${data.xpAwarded} XP 獲得！` });
      setDialogOpen(false);
      setChatMessages([]);
      setTurnCount(0);
    },
    onError: () => {
      toast({ title: "保存に失敗しました", variant: "destructive" });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (dialogOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [dialogOpen]);

  function openCheckin(type: "morning" | "evening") {
    setCheckinType(type);
    setChatMessages([]);
    setTurnCount(0);
    setInputValue("");
    setDialogOpen(true);

    // Generate initial AI greeting after dialog opens
    setTimeout(() => {
      fetchAIResponse(type, "", 0);
    }, 300);
  }

  async function fetchAIResponse(type: string, userMsg: string, turn: number) {
    setIsGenerating(true);
    try {
      // We'll use a special endpoint variant or just directly generate
      // For simplicity, we call chat and tag it as daily-checkin
      const res = await apiRequest("POST", "/api/my/chat", {
        message: userMsg || (type === "morning" ? "おはようございます" : "お疲れ様です"),
        dailyCheckin: type,
        turnNumber: turn,
      });
      const data = await res.json();
      if (data.assistantMessage) {
        setChatMessages(prev => [...prev, { role: "assistant", content: data.assistantMessage.content }]);
      }
    } catch {
      // Fallback: generate a local response
      const fallbackResponses: Record<string, string[]> = {
        morning: [
          `おはようございます、${employee.name}さん！今日はどんなことに取り組む予定ですか？`,
          `いい計画ですね！困っていることやサポートが必要なことはありますか？`,
          `ありがとうございます！朝のチェックイン完了です。「記録する」ボタンを押して保存しましょう。`,
        ],
        evening: [
          `お疲れ様です、${employee.name}さん！今日はどうでしたか？`,
          `詳しく教えてくれてありがとうございます！学んだことや明日に活かしたいことはありますか？`,
          `素晴らしい振り返りですね！「記録する」ボタンを押して保存しましょう。`,
        ],
      };
      const responses = fallbackResponses[type] || fallbackResponses.morning;
      const idx = Math.min(turn, responses.length - 1);
      setChatMessages(prev => [...prev, { role: "assistant", content: responses[idx] }]);
    }
    setIsGenerating(false);
  }

  function handleSend() {
    const trimmed = inputValue.trim();
    if (!trimmed || isGenerating) return;

    const newTurn = turnCount + 1;
    setChatMessages(prev => [...prev, { role: "user", content: trimmed }]);
    setInputValue("");
    setTurnCount(newTurn);

    // Get AI response
    fetchAIResponse(checkinType, trimmed, newTurn);
  }

  function handleSave() {
    if (chatMessages.length < 2) return;
    saveMutation.mutate({ type: checkinType, messages: chatMessages });
  }

  const morningDone = !!status?.morning;
  const eveningDone = !!status?.evening;
  const hour = new Date().getHours();
  const canSave = turnCount >= 2 && chatMessages.length >= 4; // At least 2 user messages + 2 AI responses

  return (
    <>
      <Card className="p-3 sm:p-4 border-2 border-primary/50 bg-primary/5 w-full">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold font-mono">デイリー対話クエスト</h2>
          <Badge variant="secondary" className="text-[9px] border-2 ml-auto">
            毎日 / +20 XP
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">
          毎日朝と夜にAIと対話して、計画と振り返りを記録しましょう。
        </p>

        <div className="grid grid-cols-2 gap-2">
          {/* Morning Check-in */}
          <button
            onClick={() => !morningDone && openCheckin("morning")}
            disabled={morningDone}
            className={`flex flex-col items-center gap-1.5 p-3 border-2 transition-all ${
              morningDone
                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 cursor-default"
                : "border-amber-300 bg-amber-50/50 dark:bg-amber-500/10 hover:bg-amber-100/50 dark:hover:bg-amber-500/20 hover:translate-y-[-1px] cursor-pointer"
            }`}
          >
            {morningDone ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Sun className="h-5 w-5 text-amber-500" />
            )}
            <span className="text-xs font-bold font-mono">
              朝の振り返り
            </span>
            <span className={`text-[9px] font-mono ${morningDone ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
              {morningDone ? "完了済み ✓" : "未完了"}
            </span>
          </button>

          {/* Evening Check-in */}
          <button
            onClick={() => !eveningDone && openCheckin("evening")}
            disabled={eveningDone}
            className={`flex flex-col items-center gap-1.5 p-3 border-2 transition-all ${
              eveningDone
                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 cursor-default"
                : "border-indigo-300 bg-indigo-50/50 dark:bg-indigo-500/10 hover:bg-indigo-100/50 dark:hover:bg-indigo-500/20 hover:translate-y-[-1px] cursor-pointer"
            }`}
          >
            {eveningDone ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Moon className="h-5 w-5 text-indigo-500" />
            )}
            <span className="text-xs font-bold font-mono">
              夜の振り返り
            </span>
            <span className={`text-[9px] font-mono ${eveningDone ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}`}>
              {eveningDone ? "完了済み ✓" : "未完了"}
            </span>
          </button>
        </div>

        {morningDone && eveningDone && (
          <div className="mt-3 p-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-center">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              本日のデイリー対話クエスト完了！
            </span>
          </div>
        )}
      </Card>

      {/* Check-in Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setDialogOpen(false); }}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2 border-b-2">
            <DialogTitle className="font-mono text-sm flex items-center gap-2">
              {checkinType === "morning" ? (
                <><Sun className="h-4 w-4 text-amber-500" /> 朝の振り返り</>
              ) : (
                <><Moon className="h-4 w-4 text-indigo-500" /> 夜の振り返り</>
              )}
              <Badge variant="secondary" className="text-[9px] ml-auto">+20 XP</Badge>
            </DialogTitle>
          </DialogHeader>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px] max-h-[400px]">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="shrink-0 mt-1">
                    <AvatarDisplay config={avatarConfig} size={24} />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground border-2 border-primary"
                      : "bg-muted border-2 border-border"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex gap-2 justify-start">
                <div className="shrink-0 mt-1">
                  <AvatarDisplay config={avatarConfig} size={24} />
                </div>
                <div className="bg-muted border-2 border-border p-2.5">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input + Save */}
          <div className="border-t-2 p-3 space-y-2">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="メッセージを入力..."
                className="text-xs h-8 flex-1"
                disabled={isGenerating}
              />
              <Button
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleSend}
                disabled={!inputValue.trim() || isGenerating}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              onClick={handleSave}
              disabled={!canSave || saveMutation.isPending}
              className="w-full pixel-btn text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              {saveMutation.isPending ? "保存中..." : canSave ? "記録する (+20 XP)" : `会話を続けてください (あと${Math.max(0, 2 - turnCount)}回)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
