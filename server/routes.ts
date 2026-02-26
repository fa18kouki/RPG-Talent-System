import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertQuestSchema, insertQuestCompletionSchema, insertSkillSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/employees", async (_req, res) => {
    const employees = await storage.getEmployees();
    res.json(employees);
  });

  app.get("/api/employees/:id", async (req, res) => {
    const employee = await storage.getEmployee(req.params.id);
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    res.json(employee);
  });

  app.post("/api/employees", async (req, res) => {
    const parsed = insertEmployeeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const employee = await storage.createEmployee(parsed.data);
    res.status(201).json(employee);
  });

  app.get("/api/skills", async (_req, res) => {
    const allSkills = await storage.getSkills();
    res.json(allSkills);
  });

  app.get("/api/employees/:id/skills", async (req, res) => {
    const skills = await storage.getSkillsByEmployee(req.params.id);
    res.json(skills);
  });

  app.post("/api/skills", async (req, res) => {
    const parsed = insertSkillSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const skill = await storage.createSkill(parsed.data);
    res.status(201).json(skill);
  });

  app.get("/api/quests", async (_req, res) => {
    const questList = await storage.getQuests();
    res.json(questList);
  });

  app.post("/api/quests", async (req, res) => {
    const parsed = insertQuestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const quest = await storage.createQuest(parsed.data);
    res.status(201).json(quest);
  });

  app.get("/api/completions", async (_req, res) => {
    const completions = await storage.getCompletions();
    res.json(completions);
  });

  app.get("/api/employees/:id/completions", async (req, res) => {
    const completions = await storage.getCompletionsByEmployee(req.params.id);
    res.json(completions);
  });

  app.post("/api/completions", async (req, res) => {
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
