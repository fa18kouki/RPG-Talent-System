import {
  type Employee, type InsertEmployee,
  type Skill, type InsertSkill,
  type Quest, type InsertQuest,
  type QuestCompletion, type InsertQuestCompletion,
  employees, skills, quests, questCompletions,
  getLevelFromTotalXP,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(data: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, data: Partial<InsertEmployee>): Promise<Employee | undefined>;

  getSkills(): Promise<Skill[]>;
  getSkillsByEmployee(employeeId: string): Promise<Skill[]>;
  createSkill(data: InsertSkill): Promise<Skill>;

  getQuests(): Promise<Quest[]>;
  getQuest(id: string): Promise<Quest | undefined>;
  createQuest(data: InsertQuest): Promise<Quest>;

  getCompletions(): Promise<QuestCompletion[]>;
  getCompletionsByEmployee(employeeId: string): Promise<QuestCompletion[]>;
  createCompletion(data: InsertQuestCompletion): Promise<QuestCompletion>;
}

export class DatabaseStorage implements IStorage {
  async getEmployees(): Promise<Employee[]> {
    return db.select().from(employees).orderBy(desc(employees.totalXP));
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [emp] = await db.select().from(employees).where(eq(employees.id, id));
    return emp;
  }

  async createEmployee(data: InsertEmployee): Promise<Employee> {
    const [emp] = await db.insert(employees).values(data).returning();
    return emp;
  }

  async updateEmployee(id: string, data: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [emp] = await db.update(employees).set(data).where(eq(employees.id, id)).returning();
    return emp;
  }

  async getSkills(): Promise<Skill[]> {
    return db.select().from(skills);
  }

  async getSkillsByEmployee(employeeId: string): Promise<Skill[]> {
    return db.select().from(skills).where(eq(skills.employeeId, employeeId));
  }

  async createSkill(data: InsertSkill): Promise<Skill> {
    const [skill] = await db.insert(skills).values(data).returning();
    return skill;
  }

  async getQuests(): Promise<Quest[]> {
    return db.select().from(quests).orderBy(desc(quests.createdAt));
  }

  async getQuest(id: string): Promise<Quest | undefined> {
    const [quest] = await db.select().from(quests).where(eq(quests.id, id));
    return quest;
  }

  async createQuest(data: InsertQuest): Promise<Quest> {
    const [quest] = await db.insert(quests).values(data).returning();
    return quest;
  }

  async getCompletions(): Promise<QuestCompletion[]> {
    return db.select().from(questCompletions).orderBy(desc(questCompletions.completedAt));
  }

  async getCompletionsByEmployee(employeeId: string): Promise<QuestCompletion[]> {
    return db.select().from(questCompletions).where(eq(questCompletions.employeeId, employeeId)).orderBy(desc(questCompletions.completedAt));
  }

  async createCompletion(data: InsertQuestCompletion): Promise<QuestCompletion> {
    const [completion] = await db.insert(questCompletions).values(data).returning();

    const employee = await this.getEmployee(data.employeeId);
    if (employee) {
      const newTotalXP = employee.totalXP + data.xpEarned;
      const levelInfo = getLevelFromTotalXP(newTotalXP);
      await db
        .update(employees)
        .set({
          totalXP: newTotalXP,
          currentXP: levelInfo.currentXP,
          level: levelInfo.level,
        })
        .where(eq(employees.id, data.employeeId));
    }

    return completion;
  }
}

export const storage = new DatabaseStorage();
