import {
  type Employee, type InsertEmployee,
  type Skill, type InsertSkill,
  type Quest, type InsertQuest,
  type QuestCompletion, type InsertQuestCompletion,
  type User, type InsertUser,
  type QuestAssignment, type InsertQuestAssignment,
  employees, skills, quests, questCompletions, users, questAssignments,
  getLevelFromTotalXP,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or } from "drizzle-orm";

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

  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(data: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  getQuestAssignments(): Promise<QuestAssignment[]>;
  getQuestAssignmentsByEmployee(employeeId: string): Promise<QuestAssignment[]>;
  getQuestAssignment(id: string): Promise<QuestAssignment | undefined>;
  createQuestAssignment(data: InsertQuestAssignment): Promise<QuestAssignment>;
  updateQuestAssignment(id: string, data: Partial<QuestAssignment>): Promise<QuestAssignment | undefined>;
  deleteQuestAssignment(id: string): Promise<boolean>;
  getEmployeeByUserId(userId: string): Promise<Employee | undefined>;
  getPendingReviewAssignments(): Promise<QuestAssignment[]>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async getQuestAssignments(): Promise<QuestAssignment[]> {
    return db.select().from(questAssignments).orderBy(desc(questAssignments.assignedAt));
  }

  async getQuestAssignmentsByEmployee(employeeId: string): Promise<QuestAssignment[]> {
    return db.select().from(questAssignments)
      .where(eq(questAssignments.employeeId, employeeId))
      .orderBy(desc(questAssignments.assignedAt));
  }

  async getQuestAssignment(id: string): Promise<QuestAssignment | undefined> {
    const [assignment] = await db.select().from(questAssignments).where(eq(questAssignments.id, id));
    return assignment;
  }

  async createQuestAssignment(data: InsertQuestAssignment): Promise<QuestAssignment> {
    const [assignment] = await db.insert(questAssignments).values(data).returning();
    return assignment;
  }

  async updateQuestAssignment(id: string, data: Partial<QuestAssignment>): Promise<QuestAssignment | undefined> {
    const [assignment] = await db.update(questAssignments)
      .set(data)
      .where(eq(questAssignments.id, id))
      .returning();
    return assignment;
  }

  async deleteQuestAssignment(id: string): Promise<boolean> {
    const result = await db.delete(questAssignments).where(eq(questAssignments.id, id)).returning();
    return result.length > 0;
  }

  async getEmployeeByUserId(userId: string): Promise<Employee | undefined> {
    const user = await this.getUserById(userId);
    if (!user || !user.employeeId) return undefined;
    return this.getEmployee(user.employeeId);
  }

  async getPendingReviewAssignments(): Promise<QuestAssignment[]> {
    return db.select().from(questAssignments)
      .where(eq(questAssignments.status, "pending_review"))
      .orderBy(desc(questAssignments.submittedAt));
  }
}

export const storage = new DatabaseStorage();
