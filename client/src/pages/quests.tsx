import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { QuestCard } from "@/components/quest-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ScrollText, Sparkles, Pencil, Upload, FileText, Send } from "lucide-react";
import type { Quest, InsertQuest } from "@shared/schema";
import {
  insertQuestSchema,
  questDifficulties,
  difficultyLabels,
  difficultyXP,
  skillCategories,
  skillCategoryLabels,
  questSubmissionTypes,
  questSubmissionTypeLabels,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Quests() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editQuest, setEditQuest] = useState<Quest | null>(null);
  const { toast } = useToast();

  const { data: quests, isLoading } = useQuery<Quest[]>({
    queryKey: ["/api/quests"],
  });

  const form = useForm<InsertQuest>({
    resolver: zodResolver(insertQuestSchema),
    defaultValues: {
      title: "",
      description: "",
      difficulty: "normal",
      xpReward: 100,
      skillCategory: "technical",
      submissionType: "button_only",
      requiresDeliverables: false,
      isActive: true,
    },
  });

  const difficulty = form.watch("difficulty");
  const submissionType = form.watch("submissionType");

  const createMutation = useMutation({
    mutationFn: async (data: InsertQuest) => {
      const res = await apiRequest("POST", "/api/quests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "クエスト作成完了", description: "新しいクエストがボードに追加されました！" });
    },
    onError: () => {
      toast({ title: "エラー", description: "クエストの作成に失敗しました", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertQuest> }) => {
      const res = await apiRequest("PATCH", `/api/quests/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      closeDialog();
      toast({ title: "クエスト更新完了", description: "クエストが正常に更新されました" });
    },
    onError: () => {
      toast({ title: "エラー", description: "クエストの更新に失敗しました", variant: "destructive" });
    },
  });

  function openEditDialog(quest: Quest) {
    setEditQuest(quest);
    form.reset({
      title: quest.title,
      description: quest.description,
      difficulty: quest.difficulty,
      xpReward: quest.xpReward,
      skillCategory: quest.skillCategory,
      submissionType: quest.submissionType,
      formTemplate: quest.formTemplate || "",
      requiresDeliverables: quest.requiresDeliverables ?? false,
      isActive: quest.isActive,
    });
    setDialogOpen(true);
  }

  function openCreateDialog() {
    setEditQuest(null);
    form.reset({
      title: "",
      description: "",
      difficulty: "normal",
      xpReward: 100,
      skillCategory: "technical",
      submissionType: "button_only",
      requiresDeliverables: false,
      isActive: true,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditQuest(null);
    form.reset();
  }

  function handleSubmit(data: InsertQuest) {
    if (editQuest) {
      updateMutation.mutate({ id: editQuest.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  const activeQuests = quests?.filter((q) => q.isActive) ?? [];
  const inactiveQuests = quests?.filter((q) => !q.isActive) ?? [];

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-quests-title">
              <Sparkles className="h-5 w-5 text-chart-4" />
              クエストボード
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              冒険者が挑戦できるクエストを管理
            </p>
          </div>
          <Button className="pixel-btn" data-testid="button-add-quest" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            クエストを作成
          </Button>
        </div>

        {/* Quest Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editQuest ? "クエストを編集" : "新しいクエストを作成"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
                data-testid="form-add-quest"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>クエスト名</FormLabel>
                      <FormControl>
                        <Input placeholder="技術ドキュメントの整備" className="border-2" data-testid="input-quest-title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>説明</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="クエストの詳細な説明..."
                          className="border-2 min-h-[80px]"
                          data-testid="input-quest-description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>難易度</FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue(
                              "xpReward",
                              difficultyXP[val as keyof typeof difficultyXP]
                            );
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-2" data-testid="select-quest-difficulty">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {questDifficulties.map((d) => (
                              <SelectItem key={d} value={d}>
                                {difficultyLabels[d]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="skillCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>スキルカテゴリ</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-2" data-testid="select-quest-category">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {skillCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {skillCategoryLabels[cat]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="submissionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>完了形式</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "button_only"}>
                        <FormControl>
                          <SelectTrigger className="border-2">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {questSubmissionTypes.map((t) => (
                            <SelectItem key={t} value={t}>
                              {questSubmissionTypeLabels[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">
                        {field.value === "button_only" && "ボタンをクリックするだけで完了します（承認不要）"}
                        {field.value === "file_upload" && "ファイルを提出し、管理者の承認を受けます"}
                        {field.value === "form_fill" && "フォームに入力して提出し、管理者の承認を受けます"}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {submissionType === "form_fill" && (
                  <FormField
                    control={form.control}
                    name="formTemplate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>フォームテンプレート (JSON)</FormLabel>
                        <FormControl>
                          <Textarea
                            className="border-2 text-xs font-mono"
                            placeholder={'[{"label":"成果概要","type":"textarea","required":true}]'}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <p className="text-[10px] text-muted-foreground">
                          例: [{'"label":"項目名","type":"text","required":true'}]
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="xpReward"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>XP報酬</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="border-2"
                          data-testid="input-quest-xp"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requiresDeliverables"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between border-2 border-border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">成果物の提出を必須にする</FormLabel>
                        <p className="text-[10px] text-muted-foreground">
                          有効にすると、ユーザーはファイルまたはコメントなしでは提出できません
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {editQuest && (
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between border-2 border-border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">アクティブ状態</FormLabel>
                          <p className="text-[10px] text-muted-foreground">
                            無効にすると新規割り当てに表示されなくなります
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? true}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
                <Button
                  type="submit"
                  className="w-full pixel-btn"
                  disabled={isPending}
                  data-testid="button-submit-quest"
                >
                  {isPending
                    ? (editQuest ? "更新中..." : "作成中...")
                    : (editQuest ? "クエストを更新" : "クエストを作成")}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="active">
          <TabsList className="border-2 border-border" data-testid="tabs-quest-status">
            <TabsTrigger value="active" data-testid="tab-active-quests">
              アクティブ ({activeQuests.length})
            </TabsTrigger>
            <TabsTrigger value="inactive" data-testid="tab-inactive-quests">
              非アクティブ ({inactiveQuests.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="space-y-3 mt-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4 border-2 border-border">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                </Card>
              ))
            ) : activeQuests.length === 0 ? (
              <Card className="p-12 text-center pixel-box border-2 border-border">
                <ScrollText className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold mt-4">クエストがありません</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  新しいクエストを作成して冒険を開始しましょう
                </p>
              </Card>
            ) : (
              activeQuests.map((quest) => (
                <div key={quest.id} className="relative group">
                  <QuestCard quest={quest} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7"
                    onClick={() => openEditDialog(quest)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    編集
                  </Button>
                </div>
              ))
            )}
          </TabsContent>
          <TabsContent value="inactive" className="space-y-3 mt-4">
            {inactiveQuests.length === 0 ? (
              <Card className="p-8 text-center pixel-box border-2 border-border">
                <p className="text-sm text-muted-foreground">非アクティブなクエストはありません</p>
              </Card>
            ) : (
              inactiveQuests.map((quest) => (
                <div key={quest.id} className="relative group">
                  <QuestCard quest={quest} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7"
                    onClick={() => openEditDialog(quest)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    編集
                  </Button>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
