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

export const questAssignmentStatuses = ["active", "completed"] as const;
export type QuestAssignmentStatus = typeof questAssignmentStatuses[number];

export const questAssignments = pgTable("quest_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questId: varchar("quest_id").notNull(),
  employeeId: varchar("employee_id").notNull(),
  status: text("status").notNull().$type<QuestAssignmentStatus>().default("active"),
  dueDate: timestamp("due_date"),
  assignedAt: timestamp("assigned_at").defaultNow(),
  completedAt: timestamp("completed_at"),
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

export const insertQuestAssignmentSchema = createInsertSchema(questAssignments).omit({
  id: true,
  assignedAt: true,
  completedAt: true,
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
