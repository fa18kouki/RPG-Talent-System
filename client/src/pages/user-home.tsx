import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarDisplay } from "@/components/avatar-display";
import { AvatarCustomizer } from "@/components/avatar-customizer";
import { XPBar } from "@/components/xp-bar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { DailyCheckinQuest } from "@/components/daily-checkin";
import {
  Sparkles, Star, Flame, Crown, CheckCircle2, Clock, Pencil, Scroll,
  Upload, FileText, Send, RotateCcw, AlertTriangle, Hourglass, ThumbsUp, ThumbsDown,
  ShieldAlert,
} from "lucide-react";
import type { Employee, Quest, QuestAssignment, AvatarConfig, QuestSubmissionType, QuestAssignmentStatus } from "@shared/schema";
import {
  difficultyLabels, skillCategoryLabels, classLabels,
  questSubmissionTypeLabels, questAssignmentStatusLabels,
  xpForLevel, type QuestDifficulty,
} from "@shared/schema";

type EnrichedAssignment = QuestAssignment & { quest: Quest | null };

const difficultyConfig: Record<QuestDifficulty, { icon: typeof Star; color: string; bg: string; border: string }> = {
  easy: { icon: Star, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15", border: "border-emerald-400" },
  normal: { icon: Sparkles, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/15", border: "border-blue-400" },
  hard: { icon: Flame, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/15", border: "border-orange-400" },
  legendary: { icon: Crown, color: "text-amber-500 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-400/15", border: "border-amber-400" },
};

const statusConfig: Record<QuestAssignmentStatus, { color: string; bgColor: string }> = {
  active: { color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-500/15" },
  pending_review: { color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-500/15" },
  approved: { color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-500/15" },
  rejected: { color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-500/15" },
  completed: { color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-500/15" },
};

export default function UserHome() {
  const { toast } = useToast();
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [submitDialog, setSubmitDialog] = useState<EnrichedAssignment | null>(null);
  const [submitNote, setSubmitNote] = useState("");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; path: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirmation popup state
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    assignmentId: string;
    note?: string;
    formData?: Record<string, string>;
    quest: Quest | null;
    isButtonOnly: boolean;
  } | null>(null);

  const { data: employee, isLoading: empLoading } = useQuery<Employee>({
    queryKey: ["/api/my/employee"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: assignments, isLoading: questsLoading } = useQuery<EnrichedAssignment[]>({
    queryKey: ["/api/my/quests"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const submitMutation = useMutation({
    mutationFn: async ({ assignmentId, note, formData }: { assignmentId: string; note?: string; formData?: Record<string, string> }) => {
      const res = await apiRequest("PATCH", `/api/my/quests/${assignmentId}/submit`, { note, formData });
      return res.json();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my/quests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my/employee"] });
      const isButtonOnly = confirmTarget?.isButtonOnly;
      if (isButtonOnly) {
        toast({ title: "クエスト完了！XPを獲得しました" });
      } else {
        toast({ title: "クエストを提出しました。管理者の承認をお待ちください" });
      }
      closeSubmitDialog();
      setConfirmDialog(false);
      setConfirmTarget(null);
    },
    onError: () => {
      toast({ title: "提出に失敗しました", variant: "destructive" });
      setConfirmDialog(false);
      setConfirmTarget(null);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ assignmentId, files }: { assignmentId: string; files: FileList }) => {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append("files", f));
      const res = await fetch(`/api/my/quests/${assignmentId}/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: (data) => {
      setUploadedFiles(data.files);
      toast({ title: "ファイルをアップロードしました" });
    },
    onError: () => {
      toast({ title: "アップロードに失敗しました", variant: "destructive" });
    },
  });

  const resubmitMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await apiRequest("PATCH", `/api/my/quests/${assignmentId}/resubmit`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my/quests"] });
      toast({ title: "再提出可能になりました" });
    },
    onError: () => {
      toast({ title: "再提出に失敗しました", variant: "destructive" });
    },
  });

  function openSubmitDialog(a: EnrichedAssignment) {
    setSubmitDialog(a);
    setSubmitNote("");
    setFormValues({});
    const existing: Array<{ name: string; path: string }> = a.submissionFiles
      ? JSON.parse(a.submissionFiles)
      : [];
    setUploadedFiles(existing);
  }

  function closeSubmitDialog() {
    setSubmitDialog(null);
    setSubmitNote("");
    setFormValues({});
    setUploadedFiles([]);
  }

  // Show confirmation popup before actual submission
  function requestSubmit(assignmentId: string, quest: Quest | null, isButtonOnly: boolean, note?: string, formData?: Record<string, string>) {
    setConfirmTarget({
      assignmentId,
      note,
      formData,
      quest,
      isButtonOnly,
    });
    setConfirmDialog(true);
  }

  function executeSubmit() {
    if (!confirmTarget) return;
    submitMutation.mutate({
      assignmentId: confirmTarget.assignmentId,
      note: confirmTarget.note,
      formData: confirmTarget.formData,
    });
  }

  const avatarConfig: AvatarConfig | null = employee?.avatarConfig
    ? JSON.parse(employee.avatarConfig)
    : null;

  const now = new Date();
  const activeAssignments = assignments?.filter(a => a.status === "active") || [];
  const pendingAssignments = assignments?.filter(a => a.status === "pending_review") || [];
  const rejectedAssignments = assignments?.filter(a => a.status === "rejected") || [];
  const completedAssignments = assignments?.filter(a => a.status === "completed" || a.status === "approved") || [];

  if (empLoading) {
    return (
      <div className="flex flex-col items-center gap-6 p-4 sm:p-8 max-w-2xl mx-auto">
        <Skeleton className="w-24 h-24 sm:w-32 sm:h-32" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full max-w-xs" />
        <div className="w-full space-y-3 mt-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <Scroll className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-bold mb-2">冒険者データがありません</h2>
        <p className="text-sm text-muted-foreground">
          管理者にアカウントの紐づけを依頼してください
        </p>
      </div>
    );
  }

  const formTemplate: Array<{ label: string; type: string; required: boolean }> =
    submitDialog?.quest?.formTemplate ? JSON.parse(submitDialog.quest.formTemplate) : [];

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 p-4 sm:p-8 max-w-2xl mx-auto w-full">
      {/* Avatar & Profile */}
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="relative group">
          <div className="border-2 border-primary p-3 sm:p-4 bg-card shadow-[6px_6px_0_0_hsl(var(--primary)/0.3)]">
            <AvatarDisplay
              config={avatarConfig}
              size={160}
              className="sm:hidden"
              onClick={() => setCustomizerOpen(true)}
            />
            <AvatarDisplay
              config={avatarConfig}
              size={220}
              className="hidden sm:block"
              onClick={() => setCustomizerOpen(true)}
            />
          </div>
          <button
            onClick={() => setCustomizerOpen(true)}
            className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-1.5 border-2 border-background shadow-[2px_2px_0_0_hsl(var(--border))] hover:translate-y-[-1px] transition-transform"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
        <div className="text-center">
          <h1 className="text-base sm:text-lg font-bold">{employee.name}</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge variant="secondary" className="text-[10px] border-2">
              {classLabels[employee.characterClass as keyof typeof classLabels]}
            </Badge>
            <span className="text-[10px] text-muted-foreground font-mono">{employee.title}</span>
          </div>
        </div>
        <div className="w-full max-w-xs">
          <XPBar currentXP={employee.currentXP} nextLevelXP={xpForLevel(employee.level)} level={employee.level} size="md" />
        </div>
      </div>

      {/* Daily Check-in Quest (always visible) */}
      <DailyCheckinQuest employee={employee} avatarConfig={avatarConfig} />

      {/* Rejected (needs attention) */}
      {rejectedAssignments.length > 0 && (
        <div className="w-full">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h2 className="text-sm font-bold font-mono">差戻しクエスト</h2>
            <Badge variant="destructive" className="text-[10px] ml-auto">{rejectedAssignments.length}件</Badge>
          </div>
          <div className="space-y-3">
            {rejectedAssignments.map(a => {
              if (!a.quest) return null;
              return (
                <Card key={a.id} className="p-3 sm:p-4 border-2 border-destructive/50 bg-destructive/5">
                  <h3 className="text-sm font-semibold">{a.quest.title}</h3>
                  {a.reviewNote && (
                    <p className="text-xs text-destructive mt-1 bg-destructive/10 p-2 border border-destructive/20">
                      管理者コメント: {a.reviewNote}
                    </p>
                  )}
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resubmitMutation.mutate(a.id)}
                      disabled={resubmitMutation.isPending}
                      className="text-xs w-full sm:w-auto"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      再提出する
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Review */}
      {pendingAssignments.length > 0 && (
        <div className="w-full">
          <div className="flex items-center gap-2 mb-3">
            <Hourglass className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold font-mono">承認待ち</h2>
            <Badge variant="outline" className="text-[10px] border-2 ml-auto">{pendingAssignments.length}件</Badge>
          </div>
          <div className="space-y-3">
            {pendingAssignments.map(a => {
              if (!a.quest) return null;
              return (
                <Card key={a.id} className="p-3 sm:p-4 border-2 border-amber-400/50 bg-amber-50/50 dark:bg-amber-500/5">
                  <div className="flex items-center gap-2">
                    <Hourglass className="h-4 w-4 text-amber-500 shrink-0" />
                    <h3 className="text-sm font-semibold truncate">{a.quest.title}</h3>
                    <Badge className="text-[9px] bg-amber-100 text-amber-700 border-amber-300 ml-auto">承認待ち</Badge>
                  </div>
                  {a.submittedAt && (
                    <p className="text-[10px] text-muted-foreground font-mono mt-1">
                      提出日: {new Date(a.submittedAt).toLocaleDateString("ja-JP")}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Quests */}
      <div className="w-full">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-chart-4" />
          <h2 className="text-sm font-bold font-mono">アクティブクエスト</h2>
          {activeAssignments.length > 0 && (
            <Badge variant="outline" className="text-[10px] border-2 ml-auto">{activeAssignments.length}件</Badge>
          )}
        </div>

        {questsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : activeAssignments.length === 0 ? (
          <Card className="p-6 sm:p-8 text-center border-2 border-dashed border-muted-foreground/30">
            <Scroll className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">現在アクティブなクエストはありません</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">管理者からクエストが割り当てられるのを待ちましょう</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeAssignments.map(a => {
              if (!a.quest) return null;
              const cfg = difficultyConfig[a.quest.difficulty];
              const DiffIcon = cfg.icon;
              const dueDate = a.dueDate ? new Date(a.dueDate) : null;
              const isUrgent = dueDate && (dueDate.getTime() - now.getTime()) < 24 * 60 * 60 * 1000;
              const subType = a.quest.submissionType as QuestSubmissionType;

              return (
                <Card key={a.id} className={`p-3 sm:p-4 border-2 ${isUrgent ? "border-destructive/50 bg-destructive/5" : "border-border"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center ${cfg.bg} border-2 ${cfg.border}`}>
                      <DiffIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">{a.quest.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.quest.description}</p>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary" className="text-[9px] sm:text-[10px] border-2">
                          {difficultyLabels[a.quest.difficulty]}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] sm:text-[10px] border-2">
                          {skillCategoryLabels[a.quest.skillCategory]}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] sm:text-[10px] border-2">
                          {subType === "file_upload" && <Upload className="h-2.5 w-2.5 mr-0.5" />}
                          {subType === "form_fill" && <FileText className="h-2.5 w-2.5 mr-0.5" />}
                          {subType === "button_only" && <Send className="h-2.5 w-2.5 mr-0.5" />}
                          {questSubmissionTypeLabels[subType]}
                        </Badge>
                        {a.quest.requiresDeliverables && (
                          <Badge variant="outline" className="text-[9px] sm:text-[10px] border-2 border-orange-300 text-orange-600">
                            <ShieldAlert className="h-2.5 w-2.5 mr-0.5" />
                            成果物必須
                          </Badge>
                        )}
                        <span className="text-[9px] font-mono font-bold text-chart-4">+{a.quest.xpReward} XP</span>
                      </div>
                      {dueDate && (
                        <div className={`flex items-center gap-1 mt-1.5 text-[10px] font-mono ${isUrgent ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                          <Clock className="h-3 w-3" />
                          期限: {dueDate.toLocaleDateString("ja-JP")}
                          {isUrgent && " (まもなく!)"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => subType === "button_only"
                        ? requestSubmit(a.id, a.quest, true)
                        : openSubmitDialog(a)
                      }
                      disabled={submitMutation.isPending}
                      className="pixel-btn text-xs w-full sm:w-auto"
                    >
                      {subType === "button_only" && <><CheckCircle2 className="h-3.5 w-3.5 mr-1" />完了する</>}
                      {subType === "file_upload" && <><Upload className="h-3.5 w-3.5 mr-1" />ファイルを提出</>}
                      {subType === "form_fill" && <><FileText className="h-3.5 w-3.5 mr-1" />フォームに入力</>}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed */}
      {completedAssignments.length > 0 && (
        <div className="w-full">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-bold font-mono">完了済みクエスト</h2>
            <Badge variant="outline" className="text-[10px] border-2 ml-auto">{completedAssignments.length}件</Badge>
          </div>
          <div className="space-y-2">
            {completedAssignments.slice(0, 5).map(a => (
              <Card key={a.id} className="p-3 border-2 border-border/50 opacity-70">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium truncate block">{a.quest?.title || "不明"}</span>
                    {a.completedAt && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(a.completedAt).toLocaleDateString("ja-JP")}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-chart-4 shrink-0">
                    +{a.quest?.xpReward || 0} XP
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <AvatarCustomizer open={customizerOpen} onOpenChange={setCustomizerOpen} currentConfig={avatarConfig} />

      {/* Submit Dialog (file_upload / form_fill) */}
      <Dialog open={!!submitDialog} onOpenChange={(open) => !open && closeSubmitDialog()}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-base">
              {submitDialog?.quest?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {submitDialog?.quest?.submissionType === "file_upload" && (
              <div className="space-y-2">
                <Label className="text-xs font-mono flex items-center gap-1">
                  成果物ファイル
                  {submitDialog.quest.requiresDeliverables && (
                    <span className="text-destructive">*</span>
                  )}
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.txt,.csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0 && submitDialog) {
                      uploadMutation.mutate({ assignmentId: submitDialog.id, files: e.target.files });
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                >
                  <Upload className="h-3.5 w-3.5 mr-1" />
                  {uploadMutation.isPending ? "アップロード中..." : "ファイルを選択"}
                </Button>
                {uploadedFiles.length > 0 && (
                  <div className="space-y-1">
                    {uploadedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs p-2 bg-muted border">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {submitDialog?.quest?.submissionType === "form_fill" && formTemplate.length > 0 && (
              <div className="space-y-3">
                {formTemplate.map((field, i) => (
                  <div key={i} className="space-y-1">
                    <Label className="text-xs font-mono">
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        value={formValues[field.label] || ""}
                        onChange={e => setFormValues(v => ({ ...v, [field.label]: e.target.value }))}
                        className="text-xs min-h-[80px]"
                        placeholder={`${field.label}を入力...`}
                      />
                    ) : (
                      <Input
                        type={field.type || "text"}
                        value={formValues[field.label] || ""}
                        onChange={e => setFormValues(v => ({ ...v, [field.label]: e.target.value }))}
                        className="text-xs"
                        placeholder={`${field.label}を入力...`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-mono flex items-center gap-1">
                コメント
                {submitDialog?.quest?.requiresDeliverables &&
                 submitDialog?.quest?.submissionType !== "file_upload" &&
                 submitDialog?.quest?.submissionType !== "form_fill"
                  ? <span className="text-destructive">*</span>
                  : <span className="text-muted-foreground">（任意）</span>
                }
              </Label>
              <Textarea
                value={submitNote}
                onChange={e => setSubmitNote(e.target.value)}
                className="text-xs min-h-[60px]"
                placeholder="補足コメントがあれば入力..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeSubmitDialog} className="text-xs">
              キャンセル
            </Button>
            <Button
              onClick={() => {
                if (!submitDialog) return;
                const quest = submitDialog.quest;

                // Validate deliverables requirement
                if (quest?.requiresDeliverables) {
                  if (quest.submissionType === "file_upload" && uploadedFiles.length === 0) {
                    toast({ title: "成果物ファイルを添付してください", variant: "destructive" });
                    return;
                  }
                  if (quest.submissionType === "form_fill") {
                    const requiredFields = formTemplate.filter(f => f.required);
                    const missing = requiredFields.filter(f => !formValues[f.label]?.trim());
                    if (missing.length > 0) {
                      toast({ title: `必須項目「${missing[0].label}」を入力してください`, variant: "destructive" });
                      return;
                    }
                  }
                }

                // Show confirmation popup instead of direct submit
                requestSubmit(
                  submitDialog.id,
                  quest,
                  false,
                  submitNote || undefined,
                  Object.keys(formValues).length > 0 ? formValues : undefined,
                );
              }}
              disabled={submitMutation.isPending}
              className="pixel-btn text-xs"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              {submitMutation.isPending ? "提出中..." : "提出する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation AlertDialog - "この内容で間違いありませんか？" */}
      <AlertDialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              提出内容の確認
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p className="text-sm font-medium text-foreground">
                  この内容で間違いありませんか？
                </p>
                {confirmTarget && (
                  <div className="bg-muted p-3 border space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">クエスト: </span>
                      <span className="font-medium">{confirmTarget.quest?.title || "不明"}</span>
                    </div>
                    {confirmTarget.isButtonOnly ? (
                      <div className="text-muted-foreground">
                        ボタン完了型のクエストを完了します。XPが即座に付与されます。
                      </div>
                    ) : (
                      <>
                        {confirmTarget.note && (
                          <div>
                            <span className="text-muted-foreground">コメント: </span>
                            <span>{confirmTarget.note}</span>
                          </div>
                        )}
                        {uploadedFiles.length > 0 && (
                          <div>
                            <span className="text-muted-foreground">添付ファイル: </span>
                            <span>{uploadedFiles.map(f => f.name).join(", ")}</span>
                          </div>
                        )}
                        {confirmTarget.formData && Object.keys(confirmTarget.formData).length > 0 && (
                          <div className="space-y-1">
                            <span className="text-muted-foreground">フォーム入力:</span>
                            {Object.entries(confirmTarget.formData).map(([key, val]) => (
                              <div key={key} className="pl-2">
                                <span className="text-muted-foreground">{key}: </span>
                                <span>{val}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-muted-foreground pt-1 border-t">
                          提出後、管理者の承認をお待ちいただきます。
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs" onClick={() => { setConfirmDialog(false); setConfirmTarget(null); }}>
              戻る
            </AlertDialogCancel>
            <AlertDialogAction
              className="pixel-btn text-xs"
              onClick={executeSubmit}
              disabled={submitMutation.isPending}
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              {submitMutation.isPending ? "提出中..." : "確定して提出"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
