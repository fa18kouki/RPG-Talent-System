import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AvatarDisplay } from "@/components/avatar-display";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageCircle, Send, Sparkles, Scroll, Zap,
} from "lucide-react";
import type { Employee, AvatarConfig, ChatMessage } from "@shared/schema";
import { classLabels, type CharacterClass } from "@shared/schema";

function formatMessageContent(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function AIChatPage() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: employee } = useQuery<Employee>({
    queryKey: ["/api/my/employee"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/my/chat"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const sendMutation = useMutation({
    mutationFn: async (msg: string) => {
      const res = await apiRequest("POST", "/api/my/chat", { message: msg });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my/chat"] });
      if (data.xpAwarded > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/my/employee"] });
        toast({ title: `+${data.xpAwarded} XP 獲得！` });
      }
    },
    onError: () => {
      toast({ title: "メッセージの送信に失敗しました", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, sendMutation.isPending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSend() {
    const trimmed = message.trim();
    if (!trimmed || sendMutation.isPending) return;
    setMessage("");
    sendMutation.mutate(trimmed);
  }

  const avatarConfig: AvatarConfig | null = employee?.avatarConfig
    ? JSON.parse(employee.avatarConfig)
    : null;

  const recentMessages = messages?.slice(-100) || [];
  const quickActions = ["おはよう", "ステータス", "クエスト", "今日", "スキル", "頑張る"];

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 sm:p-4 border-b-2 bg-card shrink-0">
        {employee && (
          <div className="relative">
            <AvatarDisplay config={avatarConfig} size={40} />
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-background rounded-full" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold font-mono">冒険ナビゲーター</h1>
            <Sparkles className="h-3.5 w-3.5 text-chart-4" />
          </div>
          <p className="text-[10px] text-muted-foreground">
            AIアシスタント — 会話で毎日最大3回XPを獲得できます
          </p>
        </div>
        {employee && (
          <div className="text-right shrink-0">
            <p className="text-[10px] font-mono text-muted-foreground">{employee.name}</p>
            <p className="text-[9px] text-muted-foreground">
              {classLabels[employee.characterClass as CharacterClass]} Lv.{employee.level}
            </p>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-10 w-1/2 ml-auto" />
            <Skeleton className="h-16 w-3/4" />
          </div>
        ) : recentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="border-2 border-primary/30 p-4 mb-4">
              {employee && <AvatarDisplay config={avatarConfig} size={80} />}
            </div>
            <h2 className="text-base font-bold mb-1">
              {employee?.name || "冒険者"}さん、こんにちは！
            </h2>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs">
              冒険ナビゲーターです。ステータス確認、クエストの相談、日々の振り返りなど、何でもお話しください！
            </p>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-3 gap-2 max-w-xs w-full">
              {quickActions.map((text) => (
                <button
                  key={text}
                  onClick={() => {
                    sendMutation.mutate(text);
                  }}
                  className="text-xs px-3 py-2 bg-primary/5 border-2 border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-colors font-mono"
                >
                  {text}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 mt-4 text-[10px] text-muted-foreground">
              <Zap className="h-3 w-3 text-chart-4" />
              会話で1日最大3回、10 XPずつ獲得可能
            </div>
          </div>
        ) : (
          <>
            {recentMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="shrink-0 mt-1">
                    <AvatarDisplay config={avatarConfig} size={28} />
                  </div>
                )}
                <div
                  className={`max-w-[75%] p-3 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground border-2 border-primary"
                      : "bg-muted border-2 border-border"
                  }`}
                >
                  {formatMessageContent(msg.content)}
                  {msg.xpAwarded && msg.xpAwarded > 0 && (
                    <div className="mt-2 pt-2 border-t border-current/20 text-[10px] font-mono opacity-80 flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      +{msg.xpAwarded} XP
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sendMutation.isPending && (
              <div className="flex gap-2 justify-start">
                <div className="shrink-0 mt-1">
                  <AvatarDisplay config={avatarConfig} size={28} />
                </div>
                <div className="bg-muted border-2 border-border p-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick Actions (when messages exist) */}
      {recentMessages.length > 0 && (
        <div className="px-3 sm:px-4 pb-1 flex gap-1.5 overflow-x-auto shrink-0">
          {quickActions.map((text) => (
            <button
              key={text}
              onClick={() => {
                sendMutation.mutate(text);
              }}
              disabled={sendMutation.isPending}
              className="text-[10px] px-2 py-1 bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors font-mono whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {text}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t-2 p-3 sm:p-4 flex gap-2 shrink-0">
        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="メッセージを入力..."
          className="text-xs flex-1 border-2"
          disabled={sendMutation.isPending}
        />
        <Button
          className="pixel-btn shrink-0"
          onClick={handleSend}
          disabled={!message.trim() || sendMutation.isPending}
        >
          <Send className="h-3.5 w-3.5 mr-1" />
          <span className="hidden sm:inline text-xs">送信</span>
        </Button>
      </div>
    </div>
  );
}
