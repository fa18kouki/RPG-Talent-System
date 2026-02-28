import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ClipboardList, Plus, Trash2, CheckCircle2, Clock, Users, ScrollText,
  Hourglass, ThumbsUp, ThumbsDown, FileText, ExternalLink,
} from "lucide-react";
import type { Quest, Employee, QuestAssignment, QuestSubmissionType } from "@shared/schema";
import {
  difficultyLabels, classLabels,
  questAssignmentStatusLabels, questSubmissionTypeLabels,
} from "@shared/schema";

type EnrichedAssignment = QuestAssignment & {
  quest: Quest | null;
  employee: Employee | null;
};

export default function AdminQuestAssignments() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewDialog, setReviewDialog] = useState<EnrichedAssignment | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [selectedQuestId, setSelectedQuestId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const { data: assignments, isLoading } = useQuery<EnrichedAssignment[]>({
    queryKey: ["/api/admin/quest-assignments"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: quests } = useQuery<Quest[]>({
    queryKey: ["/api/quests"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: { questId: string; employeeId: string; dueDate?: string }) => {
      const body: Record<string, unknown> = {
        questId: data.questId,
        employeeId: data.employeeId,
        status: "active",
      };
      if (data.dueDate) body.dueDate = new Date(data.dueDate).toISOString();
      const res = await apiRequest("POST", "/api/admin/quest-assignments", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quest-assignments"] });
      toast({ title: "クエストを割り当てました" });
      setDialogOpen(false);
      setSelectedQuestId("");
      setSelectedEmployeeId("");
      setDueDate("");
    },
    onError: () => {
      toast({ title: "割り当てに失敗しました", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/quest-assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quest-assignments"] });
      toast({ title: "割当を削除しました" });
    },
    onError: () => {
      toast({ title: "削除に失敗しました", variant: "destructive" });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action, note }: { id: string; action: "approve" | "reject"; note?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/quest-assignments/${id}/review`, { action, note });
      return res.json();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quest-assignments"] });
      toast({ title: vars.action === "approve" ? "承認しました" : "差戻しました" });
      setReviewDialog(null);
      setReviewNote("");
    },
    onError: () => {
      toast({ title: "操作に失敗しました", variant: "destructive" });
    },
  });

  const pendingAssignments = assignments?.filter(a => a.status === "pending_review") || [];
  const activeAssignments = assignments?.filter(a => a.status === "active") || [];
  const rejectedAssignments = assignments?.filter(a => a.status === "rejected") || [];
  const completedAssignments = assignments?.filter(a => a.status === "completed" || a.status === "approved") || [];

  const submissionFiles: Array<{ name: string; path: string }> = reviewDialog?.submissionFiles
    ? JSON.parse(reviewDialog.submissionFiles)
    : [];
  const submissionData: Record<string, string> = reviewDialog?.submissionData
    ? JSON.parse(reviewDialog.submissionData)
    : {};

  return (
    <div className="h-full overflow-auto p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">クエスト割当管理</h1>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="pixel-btn text-xs w-full sm:w-auto">
            <Plus className="h-3.5 w-3.5 mr-1" />
            新規割当
          </Button>
        </div>

        {/* Pending Review - most important */}
        {pendingAssignments.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Hourglass className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold">承認待ち</h2>
              <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-300 ml-auto">
                {pendingAssignments.length}件
              </Badge>
            </div>
            <div className="space-y-3">
              {pendingAssignments.map(a => (
                <Card key={a.id} className="p-3 sm:p-4 border-2 border-amber-400/50 bg-amber-50/30 dark:bg-amber-500/5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold truncate">{a.quest?.title || "不明"}</h3>
                        {a.quest && (
                          <Badge variant="secondary" className="text-[9px]">
                            {questSubmissionTypeLabels[a.quest.submissionType as QuestSubmissionType]}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{a.employee?.name || "不明"}</span>
                        {a.submittedAt && (
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            提出: {new Date(a.submittedAt).toLocaleDateString("ja-JP")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => { setReviewDialog(a); setReviewNote(""); }}
                      className="text-xs shrink-0 w-full sm:w-auto"
                    >
                      確認・承認
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Active */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ScrollText className="h-4 w-4 text-chart-4" />
            <h2 className="text-sm font-bold">アクティブな割当</h2>
            <Badge variant="outline" className="text-[10px] border ml-auto">{activeAssignments.length}件</Badge>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : activeAssignments.length === 0 ? (
            <Card className="p-6 text-center border-2 border-dashed border-muted-foreground/30">
              <p className="text-sm text-muted-foreground">アクティブな割当はありません</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeAssignments.map(a => (
                <Card key={a.id} className="p-3 sm:p-4 border">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold truncate">{a.quest?.title || "不明"}</h3>
                        {a.quest && (
                          <Badge variant="secondary" className="text-[9px]">{difficultyLabels[a.quest.difficulty]}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{a.employee?.name || "不明"}</span>
                        {a.quest && (
                          <span className="text-[9px] font-bold text-chart-4">+{a.quest.xpReward} XP</span>
                        )}
                      </div>
                      {a.dueDate && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          期限: {new Date(a.dueDate).toLocaleDateString("ja-JP")}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(a.id)}
                      disabled={deleteMutation.isPending}
                      className="text-xs shrink-0 w-full sm:w-auto"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      削除
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Rejected */}
        {rejectedAssignments.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ThumbsDown className="h-4 w-4 text-destructive" />
              <h2 className="text-sm font-bold">差戻し済み</h2>
              <Badge variant="outline" className="text-[10px] border ml-auto">{rejectedAssignments.length}件</Badge>
            </div>
            <div className="space-y-2">
              {rejectedAssignments.map(a => (
                <Card key={a.id} className="p-3 border border-destructive/30 opacity-80">
                  <div className="flex items-center gap-3 flex-wrap">
                    <ThumbsDown className="h-4 w-4 text-destructive shrink-0" />
                    <span className="text-xs font-medium truncate">{a.quest?.title || "不明"}</span>
                    <span className="text-[10px] text-muted-foreground">→ {a.employee?.name || "不明"}</span>
                    {a.reviewNote && (
                      <span className="text-[10px] text-destructive ml-auto">理由: {a.reviewNote}</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed */}
        {completedAssignments.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-bold">完了・承認済み</h2>
              <Badge variant="outline" className="text-[10px] border ml-auto">{completedAssignments.length}件</Badge>
            </div>
            <div className="space-y-2">
              {completedAssignments.map(a => (
                <Card key={a.id} className="p-3 border opacity-70">
                  <div className="flex items-center gap-3 flex-wrap">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-medium truncate">{a.quest?.title || "不明"}</span>
                    <span className="text-[10px] text-muted-foreground">→ {a.employee?.name || "不明"}</span>
                    {a.completedAt && (
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(a.completedAt).toLocaleDateString("ja-JP")}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Assignment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>クエスト割当</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label className="text-xs">クエスト</Label>
              <Select value={selectedQuestId} onValueChange={setSelectedQuestId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="クエストを選択..." />
                </SelectTrigger>
                <SelectContent>
                  {quests?.filter(q => q.isActive).map(q => (
                    <SelectItem key={q.id} value={q.id} className="text-xs">
                      {q.title} ({difficultyLabels[q.difficulty]} / +{q.xpReward}XP)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">冒険者</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="冒険者を選択..." />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map(e => (
                    <SelectItem key={e.id} value={e.id} className="text-xs">
                      {e.name} (Lv.{e.level} {classLabels[e.characterClass as keyof typeof classLabels]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">期限 (任意)</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="text-xs" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-xs">キャンセル</Button>
            <Button
              onClick={() => createMutation.mutate({ questId: selectedQuestId, employeeId: selectedEmployeeId, dueDate: dueDate || undefined })}
              disabled={!selectedQuestId || !selectedEmployeeId || createMutation.isPending}
              className="pixel-btn text-xs"
            >
              {createMutation.isPending ? "割当中..." : "割り当てる"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={(open) => !open && setReviewDialog(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>提出内容の確認</DialogTitle>
          </DialogHeader>
          {reviewDialog && (
            <div className="space-y-4 py-2">
              <div>
                <p className="text-sm font-semibold">{reviewDialog.quest?.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  提出者: {reviewDialog.employee?.name} / {reviewDialog.submittedAt && new Date(reviewDialog.submittedAt).toLocaleDateString("ja-JP")}
                </p>
              </div>

              {/* Submission note */}
              {reviewDialog.submissionNote && (
                <div>
                  <Label className="text-xs text-muted-foreground">コメント</Label>
                  <p className="text-sm mt-1 p-2 bg-muted border">{reviewDialog.submissionNote}</p>
                </div>
              )}

              {/* Uploaded files */}
              {submissionFiles.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">添付ファイル</Label>
                  <div className="space-y-1 mt-1">
                    {submissionFiles.map((f, i) => (
                      <a
                        key={i}
                        href={f.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs p-2 bg-muted border hover:bg-muted/80 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{f.name}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Form data */}
              {Object.keys(submissionData).length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">フォーム入力内容</Label>
                  <div className="space-y-2 mt-1">
                    {Object.entries(submissionData).map(([key, val]) => (
                      <div key={key} className="p-2 bg-muted border">
                        <p className="text-[10px] text-muted-foreground font-medium">{key}</p>
                        <p className="text-xs mt-0.5 whitespace-pre-wrap">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs">承認コメント（任意）</Label>
                <Textarea
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  className="text-xs min-h-[60px] mt-1"
                  placeholder="フィードバックを入力..."
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              variant="destructive"
              onClick={() => reviewDialog && reviewMutation.mutate({ id: reviewDialog.id, action: "reject", note: reviewNote || undefined })}
              disabled={reviewMutation.isPending}
              className="text-xs w-full sm:w-auto"
            >
              <ThumbsDown className="h-3.5 w-3.5 mr-1" />
              差戻し
            </Button>
            <Button
              onClick={() => reviewDialog && reviewMutation.mutate({ id: reviewDialog.id, action: "approve", note: reviewNote || undefined })}
              disabled={reviewMutation.isPending}
              className="pixel-btn text-xs w-full sm:w-auto"
            >
              <ThumbsUp className="h-3.5 w-3.5 mr-1" />
              承認する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
