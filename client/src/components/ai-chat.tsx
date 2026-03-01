import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AvatarDisplay } from "./avatar-display";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageCircle, Send, X, Sparkles, ChevronDown,
} from "lucide-react";
import type { Employee, AvatarConfig, ChatMessage } from "@shared/schema";

interface AIChatProps {
  employee: Employee;
  avatarConfig: AvatarConfig | null;
}

function formatMessageContent(content: string) {
  // Simple markdown-like formatting for bold
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function AIChat({ employee, avatarConfig }: AIChatProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/my/chat"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: isOpen,
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
        toast({ title: `✨ +${data.xpAwarded} XP 獲得！` });
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
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  function handleSend() {
    const trimmed = message.trim();
    if (!trimmed || sendMutation.isPending) return;
    setMessage("");
    sendMutation.mutate(trimmed);
  }

  // Get recent messages (last 50)
  const recentMessages = messages?.slice(-50) || [];

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-primary text-primary-foreground p-0 border-2 border-primary shadow-[4px_4px_0_0_hsl(var(--primary)/0.3)] hover:translate-y-[-2px] hover:shadow-[4px_6px_0_0_hsl(var(--primary)/0.3)] transition-all"
        >
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="relative">
              <AvatarDisplay config={avatarConfig} size={28} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border border-primary-foreground rounded-full animate-pulse" />
            </div>
            <span className="text-xs font-bold font-mono hidden sm:inline">AIチャット</span>
            <MessageCircle className="h-4 w-4 sm:hidden" />
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[340px] sm:w-[380px] max-h-[520px] flex flex-col bg-background border-2 border-border shadow-[6px_6px_0_0_hsl(var(--border))]">
          {/* Header */}
          <div className="flex items-center gap-2 p-3 border-b-2 bg-primary/5">
            <AvatarDisplay config={avatarConfig} size={32} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold font-mono">冒険ナビゲーター</span>
                <Sparkles className="h-3 w-3 text-chart-4" />
              </div>
              <p className="text-[10px] text-muted-foreground">AIアシスタント・会話でXP獲得</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[280px] max-h-[380px]">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-8 w-1/2 ml-auto" />
                <Skeleton className="h-12 w-3/4" />
              </div>
            ) : recentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <AvatarDisplay config={avatarConfig} size={64} />
                <p className="text-sm font-bold mt-3">{employee.name}さん、こんにちは！</p>
                <p className="text-xs text-muted-foreground mt-1">
                  AIナビゲーターです。冒険の相談をしましょう！
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                  {["おはよう", "ステータス", "クエスト", "今日"].map((text) => (
                    <button
                      key={text}
                      onClick={() => {
                        setMessage(text);
                        setTimeout(() => {
                          sendMutation.mutate(text);
                          setMessage("");
                        }, 50);
                      }}
                      className="text-[10px] px-2 py-1 bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors font-mono"
                    >
                      {text}
                    </button>
                  ))}
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
                      {formatMessageContent(msg.content)}
                      {msg.xpAwarded && msg.xpAwarded > 0 && (
                        <div className="mt-1.5 pt-1.5 border-t border-current/20 text-[10px] font-mono opacity-80 flex items-center gap-1">
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
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t-2 p-2.5 flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="メッセージを入力..."
              className="text-xs h-8 flex-1"
              disabled={sendMutation.isPending}
            />
            <Button
              size="icon"
              className="h-8 w-8 shrink-0 pixel-btn"
              onClick={handleSend}
              disabled={!message.trim() || sendMutation.isPending}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
