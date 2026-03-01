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
      email: "admin@example.com",
      password: adminPassword,
      displayName: "管理者",
      role: "admin",
    });
    const userPassword = await bcrypt.hash("user123", 10);
    const demoUser = await storage.createUser({
      email: "tanaka@example.com",
      password: userPassword,
      displayName: "田中 太郎",
      role: "user",
    });

    const user2Password = await bcrypt.hash("user123", 10);
    await storage.createUser({
      email: "sato@example.com",
      password: user2Password,
      displayName: "佐藤 花子",
      role: "user",
    });

    const user3Password = await bcrypt.hash("user123", 10);
    await storage.createUser({
      email: "suzuki@example.com",
      password: user3Password,
      displayName: "鈴木 一郎",
      role: "user",
    });

    const user4Password = await bcrypt.hash("user123", 10);
    await storage.createUser({
      email: "yamada@example.com",
      password: user4Password,
      displayName: "山田 美咲",
      role: "user",
    });

    const user5Password = await bcrypt.hash("user123", 10);
    await storage.createUser({
      email: "ito@example.com",
      password: user5Password,
      displayName: "伊藤 健太",
      role: "user",
    });

    const user6Password = await bcrypt.hash("user123", 10);
    await storage.createUser({
      email: "watanabe@example.com",
      password: user6Password,
      displayName: "渡辺 結衣",
      role: "user",
    });

    const user7Password = await bcrypt.hash("user123", 10);
    await storage.createUser({
      email: "nakamura@example.com",
      password: user7Password,
      displayName: "中村 大輔",
      role: "user",
    });

    const user8Password = await bcrypt.hash("user123", 10);
    await storage.createUser({
      email: "kobayashi@example.com",
      password: user8Password,
      displayName: "小林 さくら",
      role: "admin",
    });

    console.log("Default users created (admin@example.com / admin123, tanaka@example.com / user123, etc.)");
  }

  const existing = await db.select().from(employees).limit(1);
  if (existing.length > 0) {
    const demoUser = await storage.getUserByEmail("tanaka@example.com");
    if (demoUser && !demoUser.employeeId) {
      const allEmployees = await storage.getEmployees();
      const tanaka = allEmployees.find(e => e.name === "田中 太郎");
      if (tanaka) {
        await storage.updateUser(demoUser.id, { employeeId: tanaka.id });
        console.log("Linked tanaka@example.com to existing employee 田中 太郎");
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

  const emp6 = await storage.createEmployee({
    name: "渡辺 結衣",
    title: "フロントエンドエンジニア",
    department: "開発部",
    characterClass: "ranger",
    level: 4,
    currentXP: 150,
    totalXP: 600,
  });

  const emp7 = await storage.createEmployee({
    name: "中村 大輔",
    title: "バックエンドエンジニア",
    department: "開発部",
    characterClass: "mage",
    level: 3,
    currentXP: 40,
    totalXP: 290,
  });

  const emp8 = await storage.createEmployee({
    name: "小林 さくら",
    title: "人事マネージャー",
    department: "人事部",
    characterClass: "paladin",
    level: 8,
    currentXP: 250,
    totalXP: 2100,
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

    { employeeId: emp6.id, name: "React", category: "technical" as const, level: 7, maxLevel: 10 },
    { employeeId: emp6.id, name: "CSS/デザインシステム", category: "technical" as const, level: 6, maxLevel: 10 },
    { employeeId: emp6.id, name: "アクセシビリティ", category: "creativity" as const, level: 5, maxLevel: 10 },
    { employeeId: emp6.id, name: "パフォーマンス最適化", category: "analytics" as const, level: 4, maxLevel: 10 },
    { employeeId: emp6.id, name: "コードレビュー", category: "communication" as const, level: 5, maxLevel: 10 },

    { employeeId: emp7.id, name: "Node.js", category: "technical" as const, level: 6, maxLevel: 10 },
    { employeeId: emp7.id, name: "データベース設計", category: "technical" as const, level: 5, maxLevel: 10 },
    { employeeId: emp7.id, name: "API設計", category: "analytics" as const, level: 4, maxLevel: 10 },
    { employeeId: emp7.id, name: "セキュリティ", category: "technical" as const, level: 3, maxLevel: 10 },

    { employeeId: emp8.id, name: "人材育成", category: "leadership" as const, level: 9, maxLevel: 10 },
    { employeeId: emp8.id, name: "組織開発", category: "leadership" as const, level: 8, maxLevel: 10 },
    { employeeId: emp8.id, name: "採用戦略", category: "analytics" as const, level: 7, maxLevel: 10 },
    { employeeId: emp8.id, name: "コーチング", category: "communication" as const, level: 8, maxLevel: 10 },
    { employeeId: emp8.id, name: "制度設計", category: "creativity" as const, level: 6, maxLevel: 10 },
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
    {
      title: "ドキュメント整備",
      description: "担当プロジェクトの技術ドキュメントやWikiを整備し、チームの知識資産を充実させる",
      difficulty: "easy" as const,
      xpReward: 50,
      skillCategory: "technical" as const,
      submissionType: "button_only" as const,
      isActive: true,
    },
    {
      title: "顧客満足度改善プラン",
      description: "顧客アンケート結果を分析し、サービス改善のアクションプランを策定する",
      difficulty: "normal" as const,
      xpReward: 100,
      skillCategory: "analytics" as const,
      submissionType: "form_fill" as const,
      formTemplate: JSON.stringify([
        { label: "現状の課題", type: "textarea", required: true },
        { label: "改善施策", type: "textarea", required: true },
        { label: "KPI目標", type: "text", required: true },
      ]),
      isActive: true,
    },
    {
      title: "新人研修カリキュラム作成",
      description: "次年度の新入社員向け研修カリキュラムを企画・設計する",
      difficulty: "hard" as const,
      xpReward: 200,
      skillCategory: "leadership" as const,
      submissionType: "file_upload" as const,
      isActive: false,
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

  await storage.createCompletion({
    questId: createdQuests[0].id,
    employeeId: emp6.id,
    xpEarned: 50,
  });

  await storage.createCompletion({
    questId: createdQuests[7].id,
    employeeId: emp8.id,
    xpEarned: 100,
  });

  await storage.createCompletion({
    questId: createdQuests[8].id,
    employeeId: emp7.id,
    xpEarned: 50,
  });

  await storage.createCompletion({
    questId: createdQuests[0].id,
    employeeId: emp3.id,
    xpEarned: 50,
  });

  await storage.createCompletion({
    questId: createdQuests[5].id,
    employeeId: emp2.id,
    xpEarned: 100,
  });

  const userLinks = [
    { email: "tanaka@example.com", employeeId: emp1.id },
    { email: "sato@example.com", employeeId: emp2.id },
    { email: "suzuki@example.com", employeeId: emp3.id },
    { email: "yamada@example.com", employeeId: emp4.id },
    { email: "ito@example.com", employeeId: emp5.id },
    { email: "watanabe@example.com", employeeId: emp6.id },
    { email: "nakamura@example.com", employeeId: emp7.id },
    { email: "kobayashi@example.com", employeeId: emp8.id },
  ];

  for (const link of userLinks) {
    const user = await storage.getUserByEmail(link.email);
    if (user) {
      await storage.updateUser(user.id, { employeeId: link.employeeId });
    }
  }
  console.log("Linked all users to their employees");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const threeDays = new Date();
  threeDays.setDate(threeDays.getDate() + 3);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const twoWeeks = new Date();
  twoWeeks.setDate(twoWeeks.getDate() + 14);
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  await storage.createQuestAssignment({
    questId: createdQuests[1].id,
    employeeId: emp1.id,
    status: "active",
    dueDate: nextWeek,
  });

  await storage.createQuestAssignment({
    questId: createdQuests[3].id,
    employeeId: emp1.id,
    status: "active",
    dueDate: nextMonth,
  });

  await storage.createQuestAssignment({
    questId: createdQuests[7].id,
    employeeId: emp1.id,
    status: "pending_review",
    dueDate: tomorrow,
    submittedAt: yesterday,
    submissionNote: "React Hooksについての勉強会を開催しました。参加者15名、満足度4.5/5でした。",
  });

  await storage.createQuestAssignment({
    questId: createdQuests[8].id,
    employeeId: emp1.id,
    status: "approved",
    dueDate: lastWeek,
    submittedAt: lastWeek,
    reviewedAt: yesterday,
    reviewNote: "素晴らしいドキュメントでした。チーム全体の生産性向上に貢献しています。",
  });

  await storage.createQuestAssignment({
    questId: createdQuests[2].id,
    employeeId: emp2.id,
    status: "active",
    dueDate: nextMonth,
  });

  await storage.createQuestAssignment({
    questId: createdQuests[6].id,
    employeeId: emp2.id,
    status: "pending_review",
    dueDate: twoWeeks,
    submittedAt: yesterday,
    submissionNote: "新入社員3名のメンタリングを完了しました。全員が独立してタスクを遂行できるようになりました。",
  });

  await storage.createQuestAssignment({
    questId: createdQuests[4].id,
    employeeId: emp3.id,
    status: "active",
    dueDate: nextMonth,
  });

  await storage.createQuestAssignment({
    questId: createdQuests[8].id,
    employeeId: emp3.id,
    status: "active",
    dueDate: nextWeek,
  });

  await storage.createQuestAssignment({
    questId: createdQuests[9].id,
    employeeId: emp4.id,
    status: "pending_review",
    dueDate: threeDays,
    submittedAt: yesterday,
    submissionNote: "顧客アンケート200件を分析し、3つの重点改善領域を特定しました。",
    submissionData: JSON.stringify({
      "現状の課題": "レスポンス時間が顧客期待値を下回っている。特に初回問い合わせの対応が遅い",
      "改善施策": "チャットボット導入による初期対応の自動化、FAQ充実、サポートチーム増員",
      "KPI目標": "初回応答時間を現在の4時間から1時間以内に短縮",
    }),
  });

  await storage.createQuestAssignment({
    questId: createdQuests[3].id,
    employeeId: emp4.id,
    status: "approved",
    dueDate: lastWeek,
    submittedAt: lastWeek,
    reviewedAt: yesterday,
    reviewNote: "非常に説得力のあるプレゼンでした。経営陣からも高評価です。",
  });

  await storage.createQuestAssignment({
    questId: createdQuests[0].id,
    employeeId: emp5.id,
    status: "active",
    dueDate: threeDays,
  });

  await storage.createQuestAssignment({
    questId: createdQuests[9].id,
    employeeId: emp5.id,
    status: "active",
    dueDate: twoWeeks,
  });

  await storage.createQuestAssignment({
    questId: createdQuests[1].id,
    employeeId: emp6.id,
    status: "pending_review",
    dueDate: nextWeek,
    submittedAt: yesterday,
    submissionNote: "Svelte 5のルーン機能について調査し、Reactとの比較レポートを作成しました。",
  });

  await storage.createQuestAssignment({
    questId: createdQuests[7].id,
    employeeId: emp6.id,
    status: "active",
    dueDate: twoWeeks,
  });

  await storage.createQuestAssignment({
    questId: createdQuests[1].id,
    employeeId: emp7.id,
    status: "active",
    dueDate: nextWeek,
  });

  await storage.createQuestAssignment({
    questId: createdQuests[5].id,
    employeeId: emp7.id,
    status: "rejected",
    dueDate: lastWeek,
    submittedAt: lastWeek,
    reviewedAt: yesterday,
    reviewNote: "分析の深さが不足しています。データソースを増やし、より具体的な改善提案を追加してください。",
    submissionData: JSON.stringify({
      "分析対象期間": "2025年Q4",
      "主な発見": "売上が前年比で横ばい",
      "改善提案": "マーケティング強化",
    }),
  });

  await storage.createQuestAssignment({
    questId: createdQuests[6].id,
    employeeId: emp8.id,
    status: "active",
    dueDate: nextMonth,
  });

  await storage.createQuestAssignment({
    questId: createdQuests[2].id,
    employeeId: emp8.id,
    status: "approved",
    dueDate: lastWeek,
    submittedAt: lastWeek,
    reviewedAt: yesterday,
    reviewNote: "部門間の連携が見事でした。今後のモデルケースとして活用させていただきます。",
  });

  const today = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(yesterday).toISOString().split("T")[0];

  await storage.createDailyChatLog({
    employeeId: emp1.id,
    date: yesterdayStr,
    type: "morning",
    messages: JSON.stringify([
      { role: "user", content: "おはようございます。今日はAPIリファクタリングの続きをやります。" },
      { role: "assistant", content: "おはようございます！APIリファクタリング、着実に進んでいますね。今日のゴールを教えていただけますか？" },
      { role: "user", content: "認証周りのエンドポイントを整理して、テストを書くところまでいきたいです。" },
    ]),
    summary: "APIリファクタリングの継続。認証エンドポイントの整理とテスト作成が今日の目標。",
    xpAwarded: 30,
  });

  await storage.createDailyChatLog({
    employeeId: emp1.id,
    date: yesterdayStr,
    type: "evening",
    messages: JSON.stringify([
      { role: "user", content: "認証のリファクタリングは完了しました。テストも8件書けました。" },
      { role: "assistant", content: "素晴らしい成果ですね！テスト8件は予定通りですか？" },
      { role: "user", content: "予定より多く書けました。明日はエラーハンドリングの統一に取り組みます。" },
    ]),
    summary: "認証リファクタリング完了、テスト8件作成。予定以上の進捗。明日はエラーハンドリング統一に取り組む。",
    xpAwarded: 30,
  });

  await storage.createDailyChatLog({
    employeeId: emp2.id,
    date: yesterdayStr,
    type: "morning",
    messages: JSON.stringify([
      { role: "user", content: "今日は新規プロジェクトのキックオフミーティングがあります。" },
      { role: "assistant", content: "キックオフミーティング、準備は万端ですか？アジェンダのポイントを確認しましょうか？" },
    ]),
    summary: "新規プロジェクトのキックオフミーティング準備。",
    xpAwarded: 20,
  });

  await storage.createDailyChatLog({
    employeeId: emp4.id,
    date: today,
    type: "morning",
    messages: JSON.stringify([
      { role: "user", content: "今日はQ1の営業報告をまとめます。目標達成率は115%です！" },
      { role: "assistant", content: "目標達成率115%は素晴らしいですね！チーム全体の努力の成果ですね。報告書のポイントを整理しましょうか？" },
    ]),
    summary: "Q1営業報告のまとめ。目標達成率115%の好成績。",
    xpAwarded: 20,
  });

  console.log("Seed data inserted successfully");
}
