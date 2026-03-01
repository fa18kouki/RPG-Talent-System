import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertQuestSchema, insertQuestCompletionSchema, insertSkillSchema, loginSchema, insertUserSchema, insertQuestAssignmentSchema, avatarConfigSchema, classLabels, skillCategoryLabels, difficultyLabels, dailyChatTypeLabels, type CharacterClass, type DailyChatType, type Employee, type Quest, type QuestAssignment } from "@shared/schema";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

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

  // === Employee Profiles (for directory) ===
  app.get("/api/profiles", requireAuth, async (_req, res) => {
    try {
      const allEmployees = await storage.getEmployees();
      const allSkills = await storage.getSkills();
      const allCompletions = await storage.getCompletions();

      const profiles = allEmployees.map(emp => {
        const empSkills = allSkills.filter(s => s.employeeId === emp.id);
        const empCompletions = allCompletions.filter(c => c.employeeId === emp.id);
        return {
          ...emp,
          skills: empSkills,
          completionCount: empCompletions.length,
        };
      });

      res.json(profiles);
    } catch (err) {
      console.error("Error getting profiles:", err);
      res.status(500).json({ error: "Internal server error" });
    }
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

  app.patch("/api/quests/:id", requireAdmin, async (req, res) => {
    try {
      const existing = await storage.getQuest(req.params.id);
      if (!existing) return res.status(404).json({ error: "クエストが見つかりません" });

      const updateData: Record<string, unknown> = {};
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.difficulty !== undefined) updateData.difficulty = req.body.difficulty;
      if (req.body.xpReward !== undefined) updateData.xpReward = req.body.xpReward;
      if (req.body.skillCategory !== undefined) updateData.skillCategory = req.body.skillCategory;
      if (req.body.submissionType !== undefined) updateData.submissionType = req.body.submissionType;
      if (req.body.formTemplate !== undefined) updateData.formTemplate = req.body.formTemplate;
      if (req.body.requiresDeliverables !== undefined) updateData.requiresDeliverables = req.body.requiresDeliverables;
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

      const updated = await storage.updateQuest(req.params.id, updateData as any);
      res.json(updated);
    } catch (err) {
      console.error("Error updating quest:", err);
      res.status(500).json({ error: "クエストの更新に失敗しました" });
    }
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

  // Update my profile (bio, hobbies, specialties, motto)
  app.patch("/api/my/profile", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId!);
      if (!employee) return res.status(404).json({ error: "冒険者データが見つかりません" });

      const updateData: Record<string, unknown> = {};
      if (req.body.bio !== undefined) updateData.bio = req.body.bio || null;
      if (req.body.hobbies !== undefined) updateData.hobbies = req.body.hobbies ? JSON.stringify(req.body.hobbies) : null;
      if (req.body.specialties !== undefined) updateData.specialties = req.body.specialties ? JSON.stringify(req.body.specialties) : null;
      if (req.body.motto !== undefined) updateData.motto = req.body.motto || null;

      const updated = await storage.updateEmployee(employee.id, updateData as any);
      res.json(updated);
    } catch (err) {
      console.error("Error updating profile:", err);
      res.status(500).json({ error: "プロフィールの更新に失敗しました" });
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

      const userMsg = await storage.createChatMessage({
        employeeId: employee.id,
        role: "user",
        content: message.trim(),
      });

      const assignments = await storage.getQuestAssignmentsByEmployee(employee.id);
      const completions = await storage.getCompletionsByEmployee(employee.id);
      const skills = await storage.getSkillsByEmployee(employee.id);
      const allQuests = await storage.getQuests();
      const questMap = new Map(allQuests.map(q => [q.id, q]));
      const todayMsgCount = await storage.getChatMessageCountToday(employee.id);

      const chatHistory = await storage.getChatMessagesByEmployee(employee.id);
      const recentHistory = chatHistory.slice(-20);

      const aiResponse = await generateAIResponseWithLLM(employee, assignments, completions, skills, questMap, message.trim(), todayMsgCount, recentHistory);

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

  // === Daily Check-in (morning / evening) ===
  app.get("/api/my/daily-checkin/status", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId!);
      if (!employee) return res.status(404).json({ error: "冒険者データが見つかりません" });

      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const morningLog = await storage.getDailyChatLog(employee.id, today, "morning");
      const eveningLog = await storage.getDailyChatLog(employee.id, today, "evening");

      res.json({
        date: today,
        morning: morningLog || null,
        evening: eveningLog || null,
      });
    } catch (err) {
      console.error("Error getting daily checkin status:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/my/daily-checkin", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.session.userId!);
      if (!employee) return res.status(404).json({ error: "冒険者データが見つかりません" });

      const { type, messages: chatMessages } = req.body;
      if (!type || !["morning", "evening"].includes(type)) {
        return res.status(400).json({ error: "typeは 'morning' または 'evening' を指定してください" });
      }
      if (!chatMessages || !Array.isArray(chatMessages) || chatMessages.length < 2) {
        return res.status(400).json({ error: "会話が不足しています" });
      }

      const today = new Date().toISOString().slice(0, 10);
      const existing = await storage.getDailyChatLog(employee.id, today, type);
      if (existing) {
        return res.status(400).json({ error: "本日のチェックインは既に完了しています" });
      }

      // Generate summary from messages
      const assignments = await storage.getQuestAssignmentsByEmployee(employee.id);
      const skills = await storage.getSkillsByEmployee(employee.id);
      const completions = await storage.getCompletionsByEmployee(employee.id);
      const allQuests = await storage.getQuests();
      const questMap = new Map(allQuests.map(q => [q.id, q]));

      const summary = generateDailySummary(employee, chatMessages, type as DailyChatType, assignments, questMap);

      // Award XP for daily check-in (20 XP per check-in)
      const xpAwarded = 20;
      const { getLevelFromTotalXP } = await import("@shared/schema");
      const newTotalXP = employee.totalXP + xpAwarded;
      const levelInfo = getLevelFromTotalXP(newTotalXP);
      await storage.updateEmployee(employee.id, {
        totalXP: newTotalXP,
        currentXP: levelInfo.currentXP,
        level: levelInfo.level,
      } as any);

      const log = await storage.createDailyChatLog({
        employeeId: employee.id,
        date: today,
        type: type as DailyChatType,
        messages: JSON.stringify(chatMessages),
        summary,
        xpAwarded,
      });

      res.json({ log, xpAwarded });
    } catch (err) {
      console.error("Error in daily checkin:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // === Admin Daily Reports ===
  app.get("/api/admin/daily-reports", requireAdmin, async (req, res) => {
    try {
      const dateFilter = typeof req.query.date === "string" ? req.query.date : undefined;
      const allLogs = await storage.getAllDailyChatLogs();
      const allEmployees = await storage.getEmployees();
      const employeeMap = new Map(allEmployees.map(e => [e.id, e]));

      let filteredLogs = allLogs;
      if (dateFilter) {
        filteredLogs = allLogs.filter(l => l.date === dateFilter);
      }

      const enriched = filteredLogs.map(log => ({
        ...log,
        employee: employeeMap.get(log.employeeId) || null,
      }));

      // Also provide a list of unique dates for filtering
      const dates = [...new Set(allLogs.map(l => l.date))].sort().reverse();

      res.json({ reports: enriched, dates });
    } catch (err) {
      console.error("Error getting daily reports:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // === Admin Dashboard Summary ===
  app.get("/api/admin/dashboard-summary", requireAdmin, async (_req, res) => {
    try {
      const assignments = await storage.getQuestAssignments();
      const allQuests = await storage.getQuests();
      const allEmployees = await storage.getEmployees();
      const questMap = new Map(allQuests.map(q => [q.id, q]));
      const employeeMap = new Map(allEmployees.map(e => [e.id, e]));

      const today = new Date().toISOString().slice(0, 10);
      const now = new Date();

      // Completed quests today (daily report)
      const todayCompleted = assignments
        .filter(a => {
          if (a.status !== "completed" && a.status !== "approved") return false;
          if (!a.completedAt) return false;
          return new Date(a.completedAt).toISOString().slice(0, 10) === today;
        })
        .map(a => ({
          ...a,
          quest: questMap.get(a.questId) || null,
          employee: employeeMap.get(a.employeeId) || null,
        }));

      // Overdue assignments (active quests past due date)
      const overdueAssignments = assignments
        .filter(a => {
          if (a.status !== "active") return false;
          if (!a.dueDate) return false;
          return new Date(a.dueDate) < now;
        })
        .map(a => ({
          ...a,
          quest: questMap.get(a.questId) || null,
          employee: employeeMap.get(a.employeeId) || null,
        }));

      // Pending review count
      const pendingReviewCount = assignments.filter(a => a.status === "pending_review").length;

      res.json({
        todayCompleted,
        overdueAssignments,
        pendingReviewCount,
        date: today,
      });
    } catch (err) {
      console.error("Error getting dashboard summary:", err);
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

const geminiAI = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

async function generateAIResponseWithLLM(
  employee: Employee,
  assignments: QuestAssignment[],
  completions: { questId: string; xpEarned: number }[],
  skills: { name: string; category: string; level: number }[],
  questMap: Map<string, Quest>,
  userMessage: string,
  todayMsgCount: number,
  chatHistory: { role: string; content: string }[],
): Promise<string> {
  const className = classLabels[employee.characterClass as CharacterClass] || employee.characterClass;
  const activeQuests = assignments.filter(a => a.status === "active");
  const pendingQuests = assignments.filter(a => a.status === "pending_review");
  const completedCount = completions.length;
  const totalXpEarned = completions.reduce((sum, c) => sum + c.xpEarned, 0);

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "朝" : hour < 18 ? "午後" : "夜";

  const topSkills = [...skills].sort((a, b) => b.level - a.level).slice(0, 5);
  const topSkillsSummary = topSkills.map(s => {
    const cat = skillCategoryLabels[s.category as keyof typeof skillCategoryLabels] || s.category;
    return `${s.name}(${cat}, Lv.${s.level})`;
  }).join("、");

  const activeQuestsSummary = activeQuests.map(a => {
    const q = questMap.get(a.questId);
    if (!q) return null;
    const diff = difficultyLabels[q.difficulty as keyof typeof difficultyLabels] || q.difficulty;
    let info = `「${q.title}」(難易度: ${diff}, 報酬: ${q.xpReward}XP)`;
    if (a.dueDate) {
      const due = new Date(a.dueDate);
      const daysLeft = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      info += ` 期限: ${due.toLocaleDateString("ja-JP")}(残り${daysLeft}日)`;
    }
    return info;
  }).filter(Boolean).join("\n  ");

  const pendingQuestsSummary = pendingQuests.map(a => {
    const q = questMap.get(a.questId);
    return q ? `「${q.title}」` : null;
  }).filter(Boolean).join("、");

  const systemPrompt = `あなたは「冒険ナビゲーター」という名前のAIアシスタントです。RPG風の人材育成システム「Quest HR」の中で、従業員（冒険者）をサポートする役割を持っています。

## あなたの役割
- ユーザーの仕事の悩み、日々の業務内容、困っていることを丁寧に聞き取る
- 上司への報告内容の整理を手伝う
- 仕事のモチベーションを上げるアドバイスをする
- 具体的で実用的なアドバイスを提供する
- RPGの世界観を軽く取り入れつつ、実際の仕事に役立つ会話をする

## 会話のスタイル
- 日本語で親しみやすく、でも丁寧に話す
- ユーザーの話をしっかり聞いて、共感を示す
- 一方的にアドバイスするのではなく、質問を通じて相手の状況を深く理解する
- 悩み相談では、まず気持ちに寄り添ってから具体的な提案をする
- 上司への報告を整理する場合は、要点をまとめて分かりやすく構成する
- 長すぎない返答を心がける（200文字〜400文字程度）

## 聞き取りのポイント
- 「今日はどんな仕事をしましたか？」「何か困っていることはありますか？」など、自然な質問で業務内容を引き出す
- 悩みがあれば「もう少し詳しく教えてもらえますか？」と掘り下げる
- 上司に報告したいことがあれば「どんなポイントを伝えたいですか？」と整理を手伝う
- 抽象的な相談には具体的な行動に落とし込む提案をする

## 現在のユーザー情報
- 名前: ${employee.name}
- クラス: ${className}
- レベル: ${employee.level}
- 累計XP: ${employee.totalXP}
- クエスト達成数: ${completedCount}件
- 時間帯: ${timeOfDay}
${topSkillsSummary ? `- スキル: ${topSkillsSummary}` : "- スキル: まだ登録なし"}
${activeQuestsSummary ? `- 進行中のクエスト:\n  ${activeQuestsSummary}` : "- 進行中のクエスト: なし"}
${pendingQuestsSummary ? `- 承認待ちクエスト: ${pendingQuestsSummary}` : ""}
${todayMsgCount <= 3 ? `- 本日の会話XPボーナス: あと${Math.max(0, 3 - todayMsgCount)}回獲得可能` : ""}

## 注意事項
- ユーザーの個人情報や機密情報を他の人と共有することを提案しない
- 医療・法律に関する専門的なアドバイスは控え、専門家への相談を勧める
- ネガティブな内容でも否定せず、建設的な方向に導く`;

  const contents = [];

  for (const msg of chatHistory.slice(-18)) {
    if (msg.role === "user") {
      contents.push({ role: "user" as const, parts: [{ text: msg.content }] });
    } else if (msg.role === "assistant") {
      contents.push({ role: "model" as const, parts: [{ text: msg.content }] });
    }
  }

  contents.push({ role: "user" as const, parts: [{ text: userMessage }] });

  try {
    const response = await geminiAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        maxOutputTokens: 8192,
        systemInstruction: systemPrompt,
      },
    });

    const text = response.text;
    if (text && text.trim().length > 0) {
      return text.trim();
    }
    return `${employee.name}さん、すみません、うまく返答できませんでした。もう一度お話しいただけますか？`;
  } catch (error) {
    console.error("Gemini API error:", error);
    return `${employee.name}さん、申し訳ありません。AIの応答でエラーが発生しました。しばらくしてからもう一度お試しください。`;
  }
}

function generateDailySummary(
  employee: Employee,
  messages: Array<{ role: string; content: string }>,
  type: DailyChatType,
  assignments: QuestAssignment[],
  questMap: Map<string, Quest>,
): string {
  const className = classLabels[employee.characterClass as CharacterClass] || employee.characterClass;
  const typeLabel = dailyChatTypeLabels[type];
  const userMessages = messages.filter(m => m.role === "user").map(m => m.content);
  const activeQuests = assignments.filter(a => a.status === "active");

  let summary = `【${typeLabel}】${employee.name}（${className} Lv.${employee.level}）\n`;
  summary += `日付: ${new Date().toLocaleDateString("ja-JP")}\n\n`;

  // Extract key points from user messages
  summary += `■ 本人の報告:\n`;
  userMessages.forEach((msg, i) => {
    // Truncate long messages
    const truncated = msg.length > 200 ? msg.slice(0, 200) + "..." : msg;
    summary += `  ${i + 1}. ${truncated}\n`;
  });

  // Add quest context
  if (activeQuests.length > 0) {
    summary += `\n■ 進行中クエスト (${activeQuests.length}件):\n`;
    activeQuests.slice(0, 5).forEach(a => {
      const q = questMap.get(a.questId);
      if (q) {
        summary += `  - ${q.title}`;
        if (a.dueDate) {
          const daysLeft = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          summary += ` (残り${daysLeft}日)`;
        }
        summary += `\n`;
      }
    });
  }

  // Generate observations based on message content
  const allText = userMessages.join(" ").toLowerCase();
  summary += `\n■ AI所見:\n`;

  if (allText.match(/困っ|大変|難し|むずかし|つらい|問題/)) {
    summary += `  - 課題や困難を抱えている様子。フォローアップが必要な可能性あり。\n`;
  }
  if (allText.match(/完了|終わ|できた|達成|成功/)) {
    summary += `  - タスクの進捗や達成感について報告あり。順調に進行中。\n`;
  }
  if (allText.match(/学|勉強|調査|研究|理解/)) {
    summary += `  - 学習・スキルアップに意欲的。成長志向が見られる。\n`;
  }
  if (allText.match(/チーム|協力|相談|ミーティング|会議/)) {
    summary += `  - チーム活動やコラボレーションに関する報告あり。\n`;
  }
  if (!allText.match(/困っ|大変|完了|学|チーム/)) {
    summary += `  - 日常業務の振り返りを実施。特記事項なし。\n`;
  }

  if (type === "morning") {
    summary += `  - 朝の目標設定・計画立てを実施。\n`;
  } else {
    summary += `  - 一日の業務を振り返り、記録を残した。\n`;
  }

  return summary;
}

export function generateDailyCheckinResponse(
  employee: Employee,
  type: DailyChatType,
  assignments: QuestAssignment[],
  questMap: Map<string, Quest>,
  userMessage: string,
  turnNumber: number,
): string {
  const className = classLabels[employee.characterClass as CharacterClass] || employee.characterClass;
  const activeQuests = assignments.filter(a => a.status === "active");

  if (type === "morning") {
    if (turnNumber === 1) {
      let greeting = `おはようございます、${employee.name}さん！${className}の朝が始まりましたね。\n\n`;
      greeting += `今日はどんなことに取り組む予定ですか？目標や予定を教えてください。`;
      if (activeQuests.length > 0) {
        greeting += `\n\n📋 現在のアクティブクエスト:\n`;
        activeQuests.slice(0, 3).forEach(a => {
          const q = questMap.get(a.questId);
          if (q) greeting += `  - ${q.title}\n`;
        });
      }
      return greeting;
    }
    if (turnNumber === 2) {
      return `なるほど、いい計画ですね！\n\n何か困っていることや、サポートが必要なことはありますか？クエストの進捗や、チームメンバーとの協力についても聞かせてください。`;
    }
    if (turnNumber >= 3) {
      return `ありがとうございます！今日の計画がしっかり立てられましたね。\n\n✅ **朝のチェックイン完了！**\n「記録する」ボタンを押して、今日の計画を保存しましょう。夜の振り返りもお忘れなく！\n\n今日も一日、冒険を楽しんでください！ ⚔️`;
    }
  } else {
    // Evening
    if (turnNumber === 1) {
      let greeting = `お疲れ様です、${employee.name}さん！今日一日どうでしたか？\n\n`;
      greeting += `今日やったことや、印象に残ったことを教えてください。`;
      return greeting;
    }
    if (turnNumber === 2) {
      return `詳しく教えてくれてありがとうございます！\n\n今日の中で、特に学んだことや、明日に活かしたいことはありますか？また、困っていることがあれば聞かせてください。`;
    }
    if (turnNumber >= 3) {
      return `素晴らしい振り返りですね、${employee.name}さん！\n\n✅ **夜のチェックイン完了！**\n「記録する」ボタンを押して、今日の振り返りを保存しましょう。\n\nお疲れ様でした。しっかり休んで、明日も冒険を続けましょう！ 🌙`;
    }
  }

  return `ありがとうございます。引き続き、今日のことを教えてください。`;
}
