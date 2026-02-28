import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertQuestSchema, insertQuestCompletionSchema, insertSkillSchema, loginSchema, insertUserSchema, users } from "@shared/schema";
import bcrypt from "bcrypt";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "ログインが必要です" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "ログインが必要です" });
  }
  const user = await storage.getUserById(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "管理者権限が必要です" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "メールアドレスとパスワードを正しく入力してください" });

      const user = await storage.getUserByEmail(parsed.data.email);
      if (!user) return res.status(401).json({ error: "メールアドレスまたはパスワードが正しくありません" });

      const validPassword = await bcrypt.compare(parsed.data.password, user.password);
      if (!validPassword) return res.status(401).json({ error: "メールアドレスまたはパスワードが正しくありません" });

      req.session.regenerate((err) => {
        if (err) return res.status(500).json({ error: "セッションエラー" });
        req.session.userId = user.id;
        req.session.save((err) => {
          if (err) return res.status(500).json({ error: "セッションエラー" });
          const { password, ...safeUser } = user;
          res.json(safeUser);
        });
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "ログインに失敗しました" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "ログアウトに失敗しました" });
      res.clearCookie("connect.sid");
      res.json({ message: "ログアウトしました" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "未認証" });
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ error: "ユーザーが見つかりません" });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    const allUsers = await storage.getUsers();
    const safeUsers = allUsers.map(({ password, ...u }) => u);
    res.json(safeUsers);
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

      const existing = await storage.getUserByEmail(parsed.data.email);
      if (existing) return res.status(400).json({ error: "このメールアドレスは既に登録されています" });

      const hashedPassword = await bcrypt.hash(parsed.data.password, 10);
      const user = await storage.createUser({ ...parsed.data, password: hashedPassword });
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (err) {
      console.error("Create user error:", err);
      res.status(500).json({ error: "ユーザーの作成に失敗しました" });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      if (id === req.session.userId && req.body.role && req.body.role !== "admin") {
        return res.status(400).json({ error: "自分のロールを変更することはできません" });
      }
      const updateData: any = {};
      if (req.body.displayName) updateData.displayName = req.body.displayName;
      if (req.body.email) updateData.email = req.body.email;
      if (req.body.role && ["admin", "user"].includes(req.body.role)) updateData.role = req.body.role;
      if (req.body.password && req.body.password.length >= 6) {
        updateData.password = await bcrypt.hash(req.body.password, 10);
      }
      const user = await storage.updateUser(id, updateData);
      if (!user) return res.status(404).json({ error: "ユーザーが見つかりません" });
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (err) {
      console.error("Update user error:", err);
      res.status(500).json({ error: "ユーザーの更新に失敗しました" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      if (req.session.userId === req.params.id) {
        return res.status(400).json({ error: "自分自身を削除することはできません" });
      }
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) return res.status(404).json({ error: "ユーザーが見つかりません" });
      res.json({ message: "ユーザーを削除しました" });
    } catch (err) {
      console.error("Delete user error:", err);
      res.status(500).json({ error: "ユーザーの削除に失敗しました" });
    }
  });

  app.get("/api/employees", requireAuth, async (_req, res) => {
    const employees = await storage.getEmployees();
    res.json(employees);
  });

  app.get("/api/employees/:id", requireAuth, async (req, res) => {
    const employee = await storage.getEmployee(req.params.id);
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    res.json(employee);
  });

  app.post("/api/employees", requireAdmin, async (req, res) => {
    const parsed = insertEmployeeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const employee = await storage.createEmployee(parsed.data);
    res.status(201).json(employee);
  });

  app.get("/api/skills", requireAuth, async (_req, res) => {
    const allSkills = await storage.getSkills();
    res.json(allSkills);
  });

  app.get("/api/employees/:id/skills", requireAuth, async (req, res) => {
    const skills = await storage.getSkillsByEmployee(req.params.id);
    res.json(skills);
  });

  app.post("/api/skills", requireAdmin, async (req, res) => {
    const parsed = insertSkillSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const skill = await storage.createSkill(parsed.data);
    res.status(201).json(skill);
  });

  app.get("/api/quests", requireAuth, async (_req, res) => {
    const questList = await storage.getQuests();
    res.json(questList);
  });

  app.post("/api/quests", requireAdmin, async (req, res) => {
    const parsed = insertQuestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const quest = await storage.createQuest(parsed.data);
    res.status(201).json(quest);
  });

  app.get("/api/completions", requireAuth, async (_req, res) => {
    const completions = await storage.getCompletions();
    res.json(completions);
  });

  app.get("/api/employees/:id/completions", requireAuth, async (req, res) => {
    const completions = await storage.getCompletionsByEmployee(req.params.id);
    res.json(completions);
  });

  app.post("/api/completions", requireAdmin, async (req, res) => {
    try {
      const parsed = insertQuestCompletionSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

      const quest = await storage.getQuest(parsed.data.questId);
      if (!quest) return res.status(404).json({ error: "Quest not found" });

      const employee = await storage.getEmployee(parsed.data.employeeId);
      if (!employee) return res.status(404).json({ error: "Employee not found" });

      const existingCompletions = await storage.getCompletionsByEmployee(parsed.data.employeeId);
      const alreadyCompleted = existingCompletions.some((c) => c.questId === parsed.data.questId);
      if (alreadyCompleted) return res.status(400).json({ error: "Quest already completed" });

      const completion = await storage.createCompletion({
        ...parsed.data,
        xpEarned: quest.xpReward,
      });
      res.status(201).json(completion);
    } catch (err) {
      console.error("Error creating completion:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
