import { storage } from "./storage";
import { db } from "./db";
import { employees, users, questAssignments } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function seedDatabase() {
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length === 0) {
    const adminPassword = await bcrypt.hash("admin123", 10);
    await storage.createUser({
      email: "admin@questhr.com",
      password: adminPassword,
      displayName: "管理者",
      role: "admin",
    });
    const userPassword = await bcrypt.hash("user123", 10);
    await storage.createUser({
      email: "user@questhr.com",
      password: userPassword,
      displayName: "一般ユーザー",
      role: "user",
    });
    console.log("Default users created (admin@questhr.com / admin123, user@questhr.com / user123)");
  }

  // Ensure user→employee link exists even if employees were already seeded
  const existing = await db.select().from(employees).limit(1);
  if (existing.length > 0) {
    // Still ensure user-employee link exists
    const demoUser = await storage.getUserByEmail("user@questhr.com");
    if (demoUser && !demoUser.employeeId) {
      const allEmployees = await storage.getEmployees();
      const tanaka = allEmployees.find(e => e.name === "田中 太郎");
      if (tanaka) {
        await storage.updateUser(demoUser.id, { employeeId: tanaka.id });
        console.log("Linked user@questhr.com to existing employee 田中 太郎");
      }
    }
    return;
  }

  const emp1 = await storage.createEmployee({
    name: "田中 太郎",
    title: "シニアエンジニア",
    department: "開発部",
    characterClass: "mage",
    level: 5,
    currentXP: 120,
    totalXP: 870,
  });

  const emp2 = await storage.createEmployee({
    name: "佐藤 花子",
    title: "プロジェクトマネージャー",
    department: "企画部",
    characterClass: "paladin",
    level: 7,
    currentXP: 80,
    totalXP: 1580,
  });

  const emp3 = await storage.createEmployee({
    name: "鈴木 一郎",
    title: "デザイナー",
    department: "デザイン部",
    characterClass: "rogue",
    level: 3,
    currentXP: 60,
    totalXP: 310,
  });

  const emp4 = await storage.createEmployee({
    name: "山田 美咲",
    title: "チームリーダー",
    department: "営業部",
    characterClass: "warrior",
    level: 6,
    currentXP: 200,
    totalXP: 1200,
  });

  const emp5 = await storage.createEmployee({
    name: "伊藤 健太",
    title: "カスタマーサポート",
    department: "サポート部",
    characterClass: "healer",
    level: 4,
    currentXP: 90,
    totalXP: 540,
  });

  const skillsData = [
    { employeeId: emp1.id, name: "TypeScript", category: "technical" as const, level: 8, maxLevel: 10 },
    { employeeId: emp1.id, name: "データ分析", category: "analytics" as const, level: 6, maxLevel: 10 },
    { employeeId: emp1.id, name: "アーキテクチャ設計", category: "technical" as const, level: 7, maxLevel: 10 },
    { employeeId: emp1.id, name: "技術プレゼン", category: "communication" as const, level: 5, maxLevel: 10 },
    { employeeId: emp1.id, name: "問題解決", category: "creativity" as const, level: 6, maxLevel: 10 },

    { employeeId: emp2.id, name: "チームビルディング", category: "leadership" as const, level: 9, maxLevel: 10 },
    { employeeId: emp2.id, name: "プロジェクト管理", category: "leadership" as const, level: 8, maxLevel: 10 },
    { employeeId: emp2.id, name: "ステークホルダー管理", category: "communication" as const, level: 7, maxLevel: 10 },
    { employeeId: emp2.id, name: "戦略立案", category: "analytics" as const, level: 6, maxLevel: 10 },
    { employeeId: emp2.id, name: "ファシリテーション", category: "communication" as const, level: 8, maxLevel: 10 },

    { employeeId: emp3.id, name: "UI/UXデザイン", category: "creativity" as const, level: 7, maxLevel: 10 },
    { employeeId: emp3.id, name: "Figma", category: "technical" as const, level: 6, maxLevel: 10 },
    { employeeId: emp3.id, name: "ブランディング", category: "creativity" as const, level: 5, maxLevel: 10 },
    { employeeId: emp3.id, name: "ユーザーリサーチ", category: "analytics" as const, level: 4, maxLevel: 10 },

    { employeeId: emp4.id, name: "営業戦略", category: "leadership" as const, level: 7, maxLevel: 10 },
    { employeeId: emp4.id, name: "プレゼンテーション", category: "communication" as const, level: 8, maxLevel: 10 },
    { employeeId: emp4.id, name: "交渉力", category: "communication" as const, level: 7, maxLevel: 10 },
    { employeeId: emp4.id, name: "マーケット分析", category: "analytics" as const, level: 5, maxLevel: 10 },
    { employeeId: emp4.id, name: "目標達成力", category: "leadership" as const, level: 8, maxLevel: 10 },

    { employeeId: emp5.id, name: "傾聴力", category: "communication" as const, level: 8, maxLevel: 10 },
    { employeeId: emp5.id, name: "問題解決", category: "creativity" as const, level: 6, maxLevel: 10 },
    { employeeId: emp5.id, name: "製品知識", category: "technical" as const, level: 5, maxLevel: 10 },
    { employeeId: emp5.id, name: "共感力", category: "communication" as const, level: 7, maxLevel: 10 },
  ];

  for (const skill of skillsData) {
    await storage.createSkill(skill);
  }

  const questsData = [
    {
      title: "コードレビュー修行",
      description: "他のメンバーのコードを3件レビューし、建設的なフィードバックを提供する",
      difficulty: "easy" as const,
      xpReward: 50,
      skillCategory: "technical" as const,
      submissionType: "button_only" as const,
      isActive: true,
    },
    {
      title: "新技術の探索",
      description: "新しいフレームワークやツールを調査し、チームに導入提案書を作成する。PDFまたはWordでレポートを提出してください",
      difficulty: "normal" as const,
      xpReward: 100,
      skillCategory: "technical" as const,
      submissionType: "file_upload" as const,
      isActive: true,
    },
    {
      title: "チーム横断プロジェクト",
      description: "他部署と協力して部門横断的なプロジェクトを完遂する",
      difficulty: "hard" as const,
      xpReward: 200,
      skillCategory: "leadership" as const,
      submissionType: "button_only" as const,
      isActive: true,
    },
    {
      title: "全社プレゼンテーション",
      description: "全社ミーティングでプロジェクト成果を発表し、Q&Aセッションをリードする。発表資料を提出してください",
      difficulty: "hard" as const,
      xpReward: 200,
      skillCategory: "communication" as const,
      submissionType: "file_upload" as const,
      isActive: true,
    },
    {
      title: "イノベーションチャレンジ",
      description: "新しいプロダクトアイデアを企画し、プロトタイプを作成して経営陣にピッチする",
      difficulty: "legendary" as const,
      xpReward: 500,
      skillCategory: "creativity" as const,
      submissionType: "form_fill" as const,
      formTemplate: JSON.stringify([
        { label: "アイデア概要", type: "textarea", required: true },
        { label: "ターゲットユーザー", type: "text", required: true },
        { label: "期待される効果", type: "textarea", required: true },
        { label: "プロトタイプURL", type: "text", required: false },
      ]),
      isActive: true,
    },
    {
      title: "データ分析レポート作成",
      description: "四半期の業績データを分析し、改善提案を含むレポートを作成する",
      difficulty: "normal" as const,
      xpReward: 100,
      skillCategory: "analytics" as const,
      submissionType: "form_fill" as const,
      formTemplate: JSON.stringify([
        { label: "分析対象期間", type: "text", required: true },
        { label: "主な発見", type: "textarea", required: true },
        { label: "改善提案", type: "textarea", required: true },
      ]),
      isActive: true,
    },
    {
      title: "メンタリングプログラム",
      description: "新入社員のメンターとして3ヶ月間指導を行い、成長をサポートする",
      difficulty: "hard" as const,
      xpReward: 200,
      skillCategory: "leadership" as const,
      isActive: true,
    },
    {
      title: "社内勉強会の開催",
      description: "得意分野のテーマで社内勉強会を企画・開催し、知識共有を促進する",
      difficulty: "normal" as const,
      xpReward: 100,
      skillCategory: "communication" as const,
      isActive: true,
    },
  ];

  const createdQuests = [];
  for (const quest of questsData) {
    const q = await storage.createQuest(quest);
    createdQuests.push(q);
  }

  await storage.createCompletion({
    questId: createdQuests[0].id,
    employeeId: emp1.id,
    xpEarned: 50,
  });

  await storage.createCompletion({
    questId: createdQuests[1].id,
    employeeId: emp2.id,
    xpEarned: 100,
  });

  await storage.createCompletion({
    questId: createdQuests[5].id,
    employeeId: emp4.id,
    xpEarned: 100,
  });

  // Link demo user to employee (user@questhr.com → 田中 太郎)
  const demoUser = await storage.getUserByEmail("user@questhr.com");
  if (demoUser) {
    await storage.updateUser(demoUser.id, { employeeId: emp1.id });
    console.log("Linked user@questhr.com to employee 田中 太郎");
  }

  // Create sample quest assignments for the demo user's employee
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);

  await storage.createQuestAssignment({
    questId: createdQuests[1].id, // 新技術の探索
    employeeId: emp1.id,
    status: "active",
    dueDate: nextWeek,
  });

  await storage.createQuestAssignment({
    questId: createdQuests[3].id, // 全社プレゼンテーション
    employeeId: emp1.id,
    status: "active",
    dueDate: nextMonth,
  });

  await storage.createQuestAssignment({
    questId: createdQuests[7].id, // 社内勉強会の開催
    employeeId: emp1.id,
    status: "active",
    dueDate: tomorrow,
  });

  // Assignments for other employees
  await storage.createQuestAssignment({
    questId: createdQuests[2].id, // チーム横断プロジェクト
    employeeId: emp2.id,
    status: "active",
    dueDate: nextMonth,
  });

  await storage.createQuestAssignment({
    questId: createdQuests[4].id, // イノベーションチャレンジ
    employeeId: emp3.id,
    status: "active",
    dueDate: nextMonth,
  });

  console.log("Seed data inserted successfully");
}
