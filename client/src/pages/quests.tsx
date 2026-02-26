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
import { QuestCard } from "@/components/quest-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ScrollText } from "lucide-react";
import type { Quest, InsertQuest } from "@shared/schema";
import {
  insertQuestSchema,
  questDifficulties,
  difficultyLabels,
  difficultyXP,
  skillCategories,
  skillCategoryLabels,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Quests() {
  const [dialogOpen, setDialogOpen] = useState(false);
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
      isActive: true,
    },
  });

  const difficulty = form.watch("difficulty");

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

  const activeQuests = quests?.filter((q) => q.isActive) ?? [];
  const inactiveQuests = quests?.filter((q) => !q.isActive) ?? [];

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-quests-title">
              クエストボード
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              冒険者が挑戦できるクエストを管理
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-quest">
                <Plus className="h-4 w-4 mr-2" />
                クエストを作成
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新しいクエストを作成</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
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
                          <Input placeholder="技術ドキュメントの整備" data-testid="input-quest-title" {...field} />
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
                              <SelectTrigger data-testid="select-quest-difficulty">
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
                              <SelectTrigger data-testid="select-quest-category">
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
                    name="xpReward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>XP報酬</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            data-testid="input-quest-xp"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-quest"
                  >
                    {createMutation.isPending ? "作成中..." : "クエストを作成"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="active">
          <TabsList data-testid="tabs-quest-status">
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
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                </Card>
              ))
            ) : activeQuests.length === 0 ? (
              <Card className="p-12 text-center">
                <ScrollText className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold mt-4">クエストがありません</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  新しいクエストを作成して冒険を開始しましょう
                </p>
              </Card>
            ) : (
              activeQuests.map((quest) => <QuestCard key={quest.id} quest={quest} />)
            )}
          </TabsContent>
          <TabsContent value="inactive" className="space-y-3 mt-4">
            {inactiveQuests.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-sm text-muted-foreground">非アクティブなクエストはありません</p>
              </Card>
            ) : (
              inactiveQuests.map((quest) => <QuestCard key={quest.id} quest={quest} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
