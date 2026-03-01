import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const characterClasses = [
  "warrior",
  "mage",
  "healer",
  "ranger",
  "rogue",
  "paladin",
] as const;

export type CharacterClass = typeof characterClasses[number];

export const classLabels: Record<CharacterClass, string> = {
  warrior: "ウォリアー",
  mage: "メイジ",
  healer: "ヒーラー",
  ranger: "レンジャー",
  rogue: "ローグ",
  paladin: "パラディン",
};

export const classDescriptions: Record<CharacterClass, string> = {
  warrior: "リーダーシップと実行力に優れた戦士タイプ",
  mage: "知識と分析力に優れた魔法使いタイプ",
  healer: "コミュニケーションとサポートに優れた回復タイプ",
  ranger: "柔軟性と適応力に優れた遊撃タイプ",
  rogue: "創造力と革新力に優れた盗賊タイプ",
  paladin: "統率力とチームワークに優れた聖騎士タイプ",
};

export const questDifficulties = ["easy", "normal", "hard", "legendary"] as const;
export type QuestDifficulty = typeof questDifficulties[number];

export const difficultyLabels: Record<QuestDifficulty, string> = {
  easy: "イージー",
  normal: "ノーマル",
  hard: "ハード",
  legendary: "レジェンダリー",
};

export const difficultyXP: Record<QuestDifficulty, number> = {
  easy: 50,
  normal: 100,
  hard: 200,
  legendary: 500,
};

export const skillCategories = [
  "technical",
  "communication",
  "leadership",
  "creativity",
  "analytics",
] as const;
export type SkillCategory = typeof skillCategories[number];

export const skillCategoryLabels: Record<SkillCategory, string> = {
  technical: "技術力",
  communication: "コミュニケーション",
  leadership: "リーダーシップ",
  creativity: "創造力",
  analytics: "分析力",
};

export const avatarHairStyles = ["short", "long", "ponytail", "spiky", "bald", "bob"] as const;
export type AvatarHairStyle = typeof avatarHairStyles[number];

export const avatarEyeStyles = ["normal", "happy", "cool", "determined"] as const;
export type AvatarEyeStyle = typeof avatarEyeStyles[number];

export const avatarAccessories = ["none", "glasses", "earring", "headband", "crown", "scarf"] as const;
export type AvatarAccessory = typeof avatarAccessories[number];

export const avatarConfigSchema = z.object({
  skinColor: z.string(),
  hairStyle: z.enum(avatarHairStyles),
  hairColor: z.string(),
  eyeStyle: z.enum(avatarEyeStyles),
  outfit: z.enum(characterClasses),
  outfitColor: z.string(),
  accessory: z.enum(avatarAccessories),
});

export type AvatarConfig = z.infer<typeof avatarConfigSchema>;

export const defaultAvatarConfig: AvatarConfig = {
  skinColor: "#F5D6C3",
  hairStyle: "short",
  hairColor: "#4A3728",
  eyeStyle: "normal",
  outfit: "warrior",
  outfitColor: "#DC2626",
  accessory: "none",
};

// --- Quest submission types ---
export const questSubmissionTypes = ["button_only", "file_upload", "form_fill"] as const;
export type QuestSubmissionType = typeof questSubmissionTypes[number];

export const questSubmissionTypeLabels: Record<QuestSubmissionType, string> = {
  button_only: "ボタン申請",
  file_upload: "ファイル提出",
  form_fill: "フォーム入力",
};

// --- Tables ---

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  characterClass: text("character_class").notNull().$type<CharacterClass>(),
  level: integer("level").notNull().default(1),
  currentXP: integer("current_xp").notNull().default(0),
  totalXP: integer("total_xp").notNull().default(0),
  avatarUrl: text("avatar_url"),
  avatarConfig: text("avatar_config"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const skills = pgTable("skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull().$type<SkillCategory>(),
  level: integer("level").notNull().default(1),
  maxLevel: integer("max_level").notNull().default(10),
});

export const quests = pgTable("quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull().$type<QuestDifficulty>(),
  xpReward: integer("xp_reward").notNull(),
  skillCategory: text("skill_category").notNull().$type<SkillCategory>(),
  submissionType: text("submission_type").notNull().$type<QuestSubmissionType>().default("button_only"),
  formTemplate: text("form_template"), // JSON: [{label, type, required}] for form_fill
  requiresDeliverables: boolean("requires_deliverables").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRoles = ["admin", "user"] as const;
export type UserRole = typeof userRoles[number];

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().$type<UserRole>().default("user"),
  employeeId: varchar("employee_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questCompletions = pgTable("quest_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questId: varchar("quest_id").notNull(),
  employeeId: varchar("employee_id").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
  xpEarned: integer("xp_earned").notNull(),
});

// --- Daily Chat Logs ---
export const dailyChatTypes = ["morning", "evening"] as const;
export type DailyChatType = typeof dailyChatTypes[number];

export const dailyChatTypeLabels: Record<DailyChatType, string> = {
  morning: "朝の振り返り",
  evening: "夜の振り返り",
};

export const dailyChatLogs = pgTable("daily_chat_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  date: text("date").notNull(),               // YYYY-MM-DD
  type: text("type").notNull().$type<DailyChatType>(),
  messages: text("messages").notNull(),        // JSON array of {role, content}
  summary: text("summary").notNull(),          // AI-generated summary for admin
  xpAwarded: integer("xp_awarded").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDailyChatLogSchema = createInsertSchema(dailyChatLogs).omit({
  id: true,
  createdAt: true,
});

export type DailyChatLog = typeof dailyChatLogs.$inferSelect;
export type InsertDailyChatLog = z.infer<typeof insertDailyChatLogSchema>;

export const questAssignmentStatuses = ["active", "pending_review", "approved", "rejected", "completed"] as const;
export type QuestAssignmentStatus = typeof questAssignmentStatuses[number];

export const questAssignmentStatusLabels: Record<QuestAssignmentStatus, string> = {
  active: "進行中",
  pending_review: "承認待ち",
  approved: "承認済み",
  rejected: "差戻し",
  completed: "完了",
};

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  role: text("role").notNull().$type<"user" | "assistant">(),
  content: text("content").notNull(),
  xpAwarded: integer("xp_awarded").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questAssignments = pgTable("quest_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questId: varchar("quest_id").notNull(),
  employeeId: varchar("employee_id").notNull(),
  status: text("status").notNull().$type<QuestAssignmentStatus>().default("active"),
  dueDate: timestamp("due_date"),
  assignedAt: timestamp("assigned_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  // Submission data
  submissionNote: text("submission_note"),
  submissionFiles: text("submission_files"), // JSON array of file paths
  submissionData: text("submission_data"),   // JSON form data for form_fill
  submittedAt: timestamp("submitted_at"),
  // Review data
  reviewNote: text("review_note"),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
});

export const insertQuestSchema = createInsertSchema(quests).omit({
  id: true,
  createdAt: true,
});

export const insertQuestCompletionSchema = createInsertSchema(questCompletions).omit({
  id: true,
  completedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertQuestAssignmentSchema = createInsertSchema(questAssignments).omit({
  id: true,
  assignedAt: true,
  completedAt: true,
  submittedAt: true,
  reviewNote: true,
  reviewedBy: true,
  reviewedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Quest = typeof quests.$inferSelect;
export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type QuestCompletion = typeof questCompletions.$inferSelect;
export type InsertQuestCompletion = z.infer<typeof insertQuestCompletionSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type QuestAssignment = typeof questAssignments.$inferSelect;
export type InsertQuestAssignment = z.infer<typeof insertQuestAssignmentSchema>;

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function getLevelFromTotalXP(totalXP: number): { level: number; currentXP: number; nextLevelXP: number } {
  let level = 1;
  let remaining = totalXP;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return { level, currentXP: remaining, nextLevelXP: xpForLevel(level) };
}
