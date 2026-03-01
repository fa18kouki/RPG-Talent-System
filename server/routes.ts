import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertQuestSchema, insertQuestCompletionSchema, insertSkillSchema, loginSchema, insertUserSchema, insertQuestAssignmentSchema, avatarConfigSchema, classLabels, skillCategoryLabels, difficultyLabels, type CharacterClass, type Employee, type Quest, type QuestAssignment } from "@shared/schema";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";

// File upload configuration
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, name);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/png",
      "image/jpeg",
      "image/gif",
      "text/plain",
      "text/csv",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

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

  // Serve uploaded files
  app.use("/uploads", requireAuth, (req, res, next) => {
    const filePath = path.join(uploadDir, path.basename(req.path));
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "ファイルが見つかりません" });
    res.sendFile(filePath);
  });

  // === Auth ===

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

  // === Admin Users ===

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
      if (req.body.employeeId !== undefined) updateData.employeeId = req.body.employeeId || null;
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

  // === Employees ===

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

  // === Skills ===

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

  // === Quests ===

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

  // === Completions ===

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

  // === User's own data endpoints ===

  app.get("/api/my/employee", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId!);
      if (!employee) return res.status(404).json({ error: "冒険者データが見つかりません" });
      res.json(employee);
    } catch (err) {
      console.error("Error getting my employee:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/my/quests", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId!);
      if (!employee) return res.status(404).json({ error: "冒険者データが見つかりません" });

      const assignments = await storage.getQuestAssignmentsByEmployee(employee.id);
      const allQuests = await storage.getQuests();
      const questMap = new Map(allQuests.map(q => [q.id, q]));

      const enriched = assignments.map(a => ({
        ...a,
        quest: questMap.get(a.questId) || null,
      }));

      res.json(enriched);
    } catch (err) {
      console.error("Error getting my quests:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Submit quest (button_only)
  app.patch("/api/my/quests/:assignmentId/submit", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId!);
      if (!employee) return res.status(404).json({ error: "冒険者データが見つかりません" });

      const assignment = await storage.getQuestAssignment(req.params.assignmentId);
      if (!assignment || assignment.employeeId !== employee.id) {
        return res.status(404).json({ error: "クエスト割当が見つかりません" });
      }
      if (assignment.status !== "active") {
        return res.status(400).json({ error: "このクエストは既に提出済みです" });
      }

      const quest = await storage.getQuest(assignment.questId);
      if (!quest) return res.status(404).json({ error: "クエストが見つかりません" });

      const note = req.body.note || null;
      const formData = req.body.formData ? JSON.stringify(req.body.formData) : null;

      // button_only: auto-approve → completed immediately
      if (quest.submissionType === "button_only") {
        const updated = await storage.updateQuestAssignment(assignment.id, {
          status: "completed",
          submissionNote: note,
          submittedAt: new Date(),
          completedAt: new Date(),
        });
        await storage.createCompletion({
          questId: assignment.questId,
          employeeId: employee.id,
          xpEarned: quest.xpReward,
        });
        return res.json(updated);
      }

      // file_upload / form_fill: go to pending_review
      const updated = await storage.updateQuestAssignment(assignment.id, {
        status: "pending_review",
        submissionNote: note,
        submissionData: formData,
        submittedAt: new Date(),
      });
      res.json(updated);
    } catch (err) {
      console.error("Error submitting quest:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Upload files for quest submission
  app.post("/api/my/quests/:assignmentId/upload", requireAuth, upload.array("files", 5), async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId!);
      if (!employee) return res.status(404).json({ error: "冒険者データが見つかりません" });

      const assignment = await storage.getQuestAssignment(req.params.assignmentId);
      if (!assignment || assignment.employeeId !== employee.id) {
        return res.status(404).json({ error: "クエスト割当が見つかりません" });
      }
      if (assignment.status !== "active" && assignment.status !== "rejected") {
        return res.status(400).json({ error: "このクエストにはファイルをアップロードできません" });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "ファイルが選択されていません" });
      }

      // Merge with existing files
      const existingFiles: Array<{ name: string; path: string }> = assignment.submissionFiles
        ? JSON.parse(assignment.submissionFiles)
        : [];

      const newFiles = files.map(f => ({
        name: f.originalname,
        path: `/uploads/${f.filename}`,
      }));

      const allFiles = [...existingFiles, ...newFiles];

      const updated = await storage.updateQuestAssignment(assignment.id, {
        submissionFiles: JSON.stringify(allFiles),
      });

      res.json({ files: allFiles, assignment: updated });
    } catch (err) {
      console.error("Error uploading files:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Keep the old complete endpoint for backward compatibility
  app.patch("/api/my/quests/:assignmentId/complete", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId!);
      if (!employee) return res.status(404).json({ error: "冒険者データが見つかりません" });

      const assignment = await storage.getQuestAssignment(req.params.assignmentId);
      if (!assignment || assignment.employeeId !== employee.id) {
        return res.status(404).json({ error: "クエスト割当が見つかりません" });
      }
      if (assignment.status !== "active") {
        return res.status(400).json({ error: "このクエストは完了できません" });
      }

      const quest = await storage.getQuest(assignment.questId);
      if (!quest) return res.status(404).json({ error: "クエストが見つかりません" });

      const completed = await storage.updateQuestAssignment(assignment.id, {
        status: "completed",
        completedAt: new Date(),
      });

      await storage.createCompletion({
        questId: assignment.questId,
        employeeId: employee.id,
        xpEarned: quest.xpReward,
      });

      res.json(completed);
    } catch (err) {
      console.error("Error completing quest:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/my/avatar", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId!);
      if (!employee) return res.status(404).json({ error: "冒険者データが見つかりません" });

      const parsed = avatarConfigSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

      const updated = await storage.updateEmployee(employee.id, {
        avatarConfig: JSON.stringify(parsed.data),
      });
      res.json(updated);
    } catch (err) {
      console.error("Error updating avatar:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // === Admin quest assignment endpoints ===

  app.get("/api/admin/quest-assignments", requireAdmin, async (_req, res) => {
    try {
      const assignments = await storage.getQuestAssignments();
      const allQuests = await storage.getQuests();
      const allEmployees = await storage.getEmployees();
      const questMap = new Map(allQuests.map(q => [q.id, q]));
      const employeeMap = new Map(allEmployees.map(e => [e.id, e]));

      const enriched = assignments.map(a => ({
        ...a,
        quest: questMap.get(a.questId) || null,
        employee: employeeMap.get(a.employeeId) || null,
      }));

      res.json(enriched);
    } catch (err) {
      console.error("Error getting quest assignments:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get pending review assignments for admin
  app.get("/api/admin/pending-reviews", requireAdmin, async (_req, res) => {
    try {
      const assignments = await storage.getPendingReviewAssignments();
      const allQuests = await storage.getQuests();
      const allEmployees = await storage.getEmployees();
      const questMap = new Map(allQuests.map(q => [q.id, q]));
      const employeeMap = new Map(allEmployees.map(e => [e.id, e]));

      const enriched = assignments.map(a => ({
        ...a,
        quest: questMap.get(a.questId) || null,
        employee: employeeMap.get(a.employeeId) || null,
      }));

      res.json(enriched);
    } catch (err) {
      console.error("Error getting pending reviews:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Approve or reject a quest submission
  app.patch("/api/admin/quest-assignments/:id/review", requireAdmin, async (req, res) => {
    try {
      const { action, note } = req.body;
      if (!action || !["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "action は 'approve' または 'reject' を指定してください" });
      }

      const assignment = await storage.getQuestAssignment(req.params.id);
      if (!assignment) return res.status(404).json({ error: "割当が見つかりません" });
      if (assignment.status !== "pending_review") {
        return res.status(400).json({ error: "この割当は承認待ち状態ではありません" });
      }

      if (action === "approve") {
        const quest = await storage.getQuest(assignment.questId);
        const updated = await storage.updateQuestAssignment(assignment.id, {
          status: "approved",
          reviewNote: note || null,
          reviewedBy: req.session.userId!,
          reviewedAt: new Date(),
          completedAt: new Date(),
        });

        // Award XP
        if (quest) {
          await storage.createCompletion({
            questId: assignment.questId,
            employeeId: assignment.employeeId,
            xpEarned: quest.xpReward,
          });
        }

        return res.json(updated);
      }

      // Reject: send back to active so user can resubmit
      const updated = await storage.updateQuestAssignment(assignment.id, {
        status: "rejected",
        reviewNote: note || null,
        reviewedBy: req.session.userId!,
        reviewedAt: new Date(),
      });
      res.json(updated);
    } catch (err) {
      console.error("Error reviewing quest:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/quest-assignments", requireAdmin, async (req, res) => {
    try {
      const parsed = insertQuestAssignmentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

      const quest = await storage.getQuest(parsed.data.questId);
      if (!quest) return res.status(404).json({ error: "クエストが見つかりません" });

      const employee = await storage.getEmployee(parsed.data.employeeId);
      if (!employee) return res.status(404).json({ error: "冒険者が見つかりません" });

      const assignment = await storage.createQuestAssignment(parsed.data);
      res.status(201).json(assignment);
    } catch (err) {
      console.error("Error creating quest assignment:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/quest-assignments/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteQuestAssignment(req.params.id);
      if (!deleted) return res.status(404).json({ error: "割当が見つかりません" });
      res.json({ message: "割当を削除しました" });
    } catch (err) {
      console.error("Error deleting quest assignment:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // === Quest History (detailed completions for user) ===
  app.get("/api/my/quest-history", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId!);
      if (!employee) return res.status(404).json({ error: "冒険者データが見つかりません" });

      const completions = await storage.getCompletionsByEmployee(employee.id);
      const allQuests = await storage.getQuests();
      const questMap = new Map(allQuests.map(q => [q.id, q]));

      // Get all assignments for this employee to include submission details
      const assignments = await storage.getQuestAssignmentsByEmployee(employee.id);
      const completedAssignments = assignments.filter(a => a.status === "completed" || a.status === "approved");

      const history = completions.map(c => {
        const quest = questMap.get(c.questId);
        const assignment = completedAssignments.find(a => a.questId === c.questId);
        return {
          ...c,
          quest: quest || null,
          assignment: assignment || null,
        };
      });

      res.json(history);
    } catch (err) {
      console.error("Error getting quest history:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // === AI Chat ===
  app.get("/api/my/chat", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId!);
      if (!employee) return res.status(404).json({ error: "冒険者データが見つかりません" });

      const messages = await storage.getChatMessagesByEmployee(employee.id);
      res.json(messages);
    } catch (err) {
      console.error("Error getting chat messages:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/my/chat", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId!);
      if (!employee) return res.status(404).json({ error: "冒険者データが見つかりません" });

      const { message } = req.body;
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ error: "メッセージを入力してください" });
      }

      // Save user message
      const userMsg = await storage.createChatMessage({
        employeeId: employee.id,
        role: "user",
        content: message.trim(),
      });

      // Generate AI response
      const assignments = await storage.getQuestAssignmentsByEmployee(employee.id);
      const completions = await storage.getCompletionsByEmployee(employee.id);
      const skills = await storage.getSkillsByEmployee(employee.id);
      const allQuests = await storage.getQuests();
      const questMap = new Map(allQuests.map(q => [q.id, q]));

      const todayMsgCount = await storage.getChatMessageCountToday(employee.id);
      const aiResponse = generateAIResponse(employee, assignments, completions, skills, questMap, message.trim(), todayMsgCount);

      // Award XP for first 3 chat messages per day
      let xpAwarded = 0;
      if (todayMsgCount <= 3) {
        xpAwarded = 10;
        const newTotalXP = employee.totalXP + xpAwarded;
        const { getLevelFromTotalXP } = await import("@shared/schema");
        const levelInfo = getLevelFromTotalXP(newTotalXP);
        await storage.updateEmployee(employee.id, {
          totalXP: newTotalXP,
          currentXP: levelInfo.currentXP,
          level: levelInfo.level,
        } as any);
      }

      const assistantMsg = await storage.createChatMessage({
        employeeId: employee.id,
        role: "assistant",
        content: aiResponse,
        xpAwarded,
      });

      res.json({ userMessage: userMsg, assistantMessage: assistantMsg, xpAwarded });
    } catch (err) {
      console.error("Error in chat:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Resubmit rejected quest (user re-activates)
  app.patch("/api/my/quests/:assignmentId/resubmit", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId!);
      if (!employee) return res.status(404).json({ error: "冒険者データが見つかりません" });

      const assignment = await storage.getQuestAssignment(req.params.assignmentId);
      if (!assignment || assignment.employeeId !== employee.id) {
        return res.status(404).json({ error: "クエスト割当が見つかりません" });
      }
      if (assignment.status !== "rejected") {
        return res.status(400).json({ error: "差戻しされたクエストのみ再提出できます" });
      }

      const updated = await storage.updateQuestAssignment(assignment.id, {
        status: "active",
        reviewNote: null,
        reviewedBy: null,
        reviewedAt: null,
        submittedAt: null,
        submissionNote: null,
        submissionData: null,
        submissionFiles: null,
      });
      res.json(updated);
    } catch (err) {
      console.error("Error resubmitting quest:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}

function generateAIResponse(
  employee: Employee,
  assignments: QuestAssignment[],
  completions: { questId: string; xpEarned: number }[],
  skills: { name: string; category: string; level: number }[],
  questMap: Map<string, Quest>,
  userMessage: string,
  todayMsgCount: number,
): string {
  const className = classLabels[employee.characterClass as CharacterClass] || employee.characterClass;
  const activeQuests = assignments.filter(a => a.status === "active");
  const pendingQuests = assignments.filter(a => a.status === "pending_review");
  const completedCount = completions.length;
  const totalXpEarned = completions.reduce((sum, c) => sum + c.xpEarned, 0);
  const msg = userMessage.toLowerCase();

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "おはようございます" : hour < 18 ? "こんにちは" : "こんばんは";

  // Greeting patterns
  if (msg.match(/おはよう|こんにちは|こんばんは|やあ|ハロー|hello|hi$/i)) {
    const activeQuestNames = activeQuests.slice(0, 2).map(a => {
      const q = questMap.get(a.questId);
      return q ? `「${q.title}」` : "";
    }).filter(Boolean).join("と");

    let greeting = `${timeGreeting}、${employee.name}さん！${className}として今日も冒険を続けましょう！`;
    if (activeQuests.length > 0) {
      greeting += `\n\n現在${activeQuests.length}件のアクティブクエストがあります。`;
      if (activeQuestNames) {
        greeting += `${activeQuestNames}に取り組んでみてはいかがでしょう？`;
      }
    }
    if (todayMsgCount <= 3) {
      greeting += `\n\n💡 会話でXPを獲得できます！（本日あと${Math.max(0, 3 - todayMsgCount)}回）`;
    }
    return greeting;
  }

  // Status / analysis request
  if (msg.match(/ステータス|状態|分析|レベル|今の|自分の|強さ|能力/)) {
    const topSkills = [...skills].sort((a, b) => b.level - a.level).slice(0, 3);
    const skillSummary = topSkills.map(s => `${s.name}(Lv.${s.level})`).join("、");

    let analysis = `📊 **${employee.name}さんのステータス分析**\n\n`;
    analysis += `🎭 クラス: ${className}\n`;
    analysis += `⭐ レベル: ${employee.level}\n`;
    analysis += `✨ 累計XP: ${employee.totalXP}\n`;
    analysis += `🏆 クエスト達成数: ${completedCount}件\n`;
    if (skillSummary) {
      analysis += `\n💪 注目スキル: ${skillSummary}\n`;
    }

    if (employee.level < 5) {
      analysis += `\nまだ冒険の序盤ですね！クエストをこなしてどんどんレベルアップしていきましょう。`;
    } else if (employee.level < 10) {
      analysis += `\n着実に成長しています！この調子でクエストに挑戦し続ければ、もっと強くなれますよ。`;
    } else {
      analysis += `\n素晴らしい成長ですね！ベテラン冒険者としてチームを引っ張っていきましょう。`;
    }

    return analysis;
  }

  // Quest-related questions
  if (msg.match(/クエスト|タスク|やること|何する|何をすれば|おすすめ/)) {
    if (activeQuests.length === 0) {
      return "現在アクティブなクエストはありません。管理者から新しいクエストが割り当てられるのを待ちましょう！\n\nその間、スキルを磨いたり、チームメンバーをサポートしたりするのもいいですね。";
    }

    let response = `📋 **現在のクエスト状況**\n\n`;
    response += `アクティブ: ${activeQuests.length}件\n`;
    if (pendingQuests.length > 0) {
      response += `承認待ち: ${pendingQuests.length}件\n`;
    }
    response += `\n`;

    for (const a of activeQuests) {
      const q = questMap.get(a.questId);
      if (q) {
        const difficulty = difficultyLabels[q.difficulty as keyof typeof difficultyLabels] || q.difficulty;
        response += `⚔️ **${q.title}** (${difficulty} / +${q.xpReward}XP)\n`;
        if (a.dueDate) {
          const due = new Date(a.dueDate);
          const daysLeft = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          response += `   期限: ${due.toLocaleDateString("ja-JP")}`;
          if (daysLeft <= 1) {
            response += ` ⚠️ まもなく期限です！`;
          } else if (daysLeft <= 3) {
            response += ` (残り${daysLeft}日)`;
          }
          response += `\n`;
        }
      }
    }

    response += `\n期限の近いクエストから取り組むのがおすすめです！`;
    return response;
  }

  // Today / what happened
  if (msg.match(/今日|きょう|何があった|何かあった|日報|振り返り/)) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCompletions = completions.filter(c => {
      // We don't have timestamps easily accessible here, so give general advice
      return false;
    });

    let response = `${timeGreeting}、${employee.name}さん！\n\n`;
    response += `📅 **今日の振り返り**\n\n`;

    if (activeQuests.length > 0) {
      response += `現在、${activeQuests.length}件のクエストに取り組み中です。\n`;
      const urgentQuests = activeQuests.filter(a => {
        if (!a.dueDate) return false;
        const daysLeft = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 2;
      });
      if (urgentQuests.length > 0) {
        response += `\n⚠️ 期限が近いクエストが${urgentQuests.length}件あります。優先的に対応しましょう！\n`;
      }
    }

    if (pendingQuests.length > 0) {
      response += `\n⏳ ${pendingQuests.length}件のクエストが承認待ちです。結果を楽しみに待ちましょう！\n`;
    }

    response += `\n💬 何か困っていることや、相談したいことがあれば教えてくださいね。一緒に考えましょう！`;
    return response;
  }

  // Encouragement / motivation
  if (msg.match(/頑張|がんば|疲れ|つかれ|やる気|モチベ|大変|むずかし|難し/)) {
    const encouragements = [
      `${className}としての力は確実に成長していますよ、${employee.name}さん。レベル${employee.level}まで来たのは大きな実績です！`,
      `冒険にはつらい時もありますが、それが成長の証です。${completedCount}件のクエストを乗り越えてきた経験は本物です！`,
      `少し休憩するのも大切な戦略です。回復してからまた挑戦しましょう！${className}の力はいつでも発揮できますよ。`,
    ];
    let response = encouragements[Math.floor(Math.random() * encouragements.length)];
    if (todayMsgCount <= 3) {
      response += `\n\n✨ +10 XP 獲得！会話も冒険の一部です！`;
    }
    return response;
  }

  // Skill questions
  if (msg.match(/スキル|得意|苦手|伸ばし|成長/)) {
    if (skills.length === 0) {
      return "まだスキルが登録されていないようです。クエストを進めていくとスキルが磨かれていきますよ！";
    }

    const topSkills = [...skills].sort((a, b) => b.level - a.level).slice(0, 3);
    const weakSkills = [...skills].sort((a, b) => a.level - b.level).slice(0, 2);

    let response = `🎯 **スキル分析**\n\n`;
    response += `💪 **得意分野:**\n`;
    topSkills.forEach(s => {
      const cat = skillCategoryLabels[s.category as keyof typeof skillCategoryLabels] || s.category;
      response += `  ${s.name} (${cat}) - Lv.${s.level}\n`;
    });

    if (weakSkills.length > 0 && weakSkills[0].level < 5) {
      response += `\n📚 **伸びしろのある分野:**\n`;
      weakSkills.forEach(s => {
        const cat = skillCategoryLabels[s.category as keyof typeof skillCategoryLabels] || s.category;
        response += `  ${s.name} (${cat}) - Lv.${s.level}\n`;
      });
      response += `\nこの分野のクエストに挑戦すると、バランスよく成長できますよ！`;
    }

    return response;
  }

  // Default response
  const defaults = [
    `なるほど！${employee.name}さん、いい視点ですね。${className}らしい考え方です。\n\n今のレベル${employee.level}の実力があれば、きっとうまくいきますよ。何かクエストの相談があれば聞かせてくださいね！`,
    `${employee.name}さん、そうですか！日々の取り組みが冒険者としての成長につながっています。\n\n何か具体的に相談したいことがあれば、「ステータス」「クエスト」「スキル」などと聞いてみてくださいね！`,
    `了解です！${className}の${employee.name}さんなら、きっと素晴らしい成果を出せますよ。\n\n💡ヒント: 「今日」「ステータス」「クエスト」「スキル」などのキーワードで詳しい情報をお伝えできます！`,
  ];

  let response = defaults[Math.floor(Math.random() * defaults.length)];
  if (todayMsgCount <= 3) {
    response += `\n\n✨ +10 XP 獲得！`;
  }
  return response;
}
