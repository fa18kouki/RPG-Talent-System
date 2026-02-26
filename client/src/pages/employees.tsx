import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CharacterCard } from "@/components/character-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Users } from "lucide-react";
import type { Employee, Skill, InsertEmployee } from "@shared/schema";
import { insertEmployeeSchema, characterClasses, classLabels } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Employees() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: allSkills } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });

  const form = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      name: "",
      title: "",
      department: "",
      characterClass: "warrior",
      level: 1,
      currentXP: 0,
      totalXP: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      const res = await apiRequest("POST", "/api/employees", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "冒険者が登録されました", description: "新しい仲間がギルドに加わりました！" });
    },
    onError: () => {
      toast({ title: "エラー", description: "冒険者の登録に失敗しました", variant: "destructive" });
    },
  });

  const filtered = employees?.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase());
    const matchClass = classFilter === "all" || e.characterClass === classFilter;
    return matchSearch && matchClass;
  });

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-employees-title">
              冒険者一覧
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              ギルドに所属する全冒険者のステータス
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-employee">
                <Plus className="h-4 w-4 mr-2" />
                冒険者を追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新しい冒険者を登録</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
                  className="space-y-4"
                  data-testid="form-add-employee"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>名前</FormLabel>
                        <FormControl>
                          <Input placeholder="山田 太郎" data-testid="input-employee-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>役職</FormLabel>
                        <FormControl>
                          <Input placeholder="シニアエンジニア" data-testid="input-employee-title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>部署</FormLabel>
                        <FormControl>
                          <Input placeholder="開発部" data-testid="input-employee-department" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="characterClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ジョブクラス</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-employee-class">
                              <SelectValue placeholder="クラスを選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {characterClasses.map((cls) => (
                              <SelectItem key={cls} value={cls} data-testid={`option-class-${cls}`}>
                                {classLabels[cls]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-employee"
                  >
                    {createMutation.isPending ? "登録中..." : "冒険者を登録"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="冒険者を検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-employees"
            />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[160px]" data-testid="select-class-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全クラス</SelectItem>
              {characterClasses.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  {classLabels[cls]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filtered?.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold mt-4">冒険者が見つかりません</h3>
            <p className="text-sm text-muted-foreground mt-1">
              検索条件を変更するか、新しい冒険者を登録してください
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered?.map((emp) => {
              const empSkills = allSkills?.filter((s) => s.employeeId === emp.id) ?? [];
              return <CharacterCard key={emp.id} employee={emp} skills={empSkills} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
