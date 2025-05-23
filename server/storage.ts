import {
  users,
  offices,
  clients,
  projects,
  tasks,
  transactions,
  projectFiles,
  type User,
  type InsertUser,
  type Office,
  type InsertOffice,
  type Client,
  type InsertClient,
  type Project,
  type InsertProject,
  type Task,
  type InsertTask,
  type Transaction,
  type InsertTransaction,
  type ProjectFile,
  type InsertProjectFile,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sum } from "drizzle-orm";

export interface IStorage {
  // Office operations
  createOffice(office: InsertOffice): Promise<Office>;
  getOfficeByEmail(email: string): Promise<Office | undefined>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByOffice(officeId: number): Promise<User[]>;
  
  // Client operations
  getClientsByOffice(officeId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: number): Promise<void>;
  
  // Project operations
  getProjectsByOffice(officeId: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;
  
  // Task operations
  getTasksByOffice(officeId: number): Promise<Task[]>;
  getTasksByProject(projectId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;
  
  // Transaction operations
  getTransactionsByOffice(officeId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction>;
  deleteTransaction(id: number): Promise<void>;
  
  // Dashboard statistics
  getDashboardStats(officeId: number): Promise<{
    activeProjects: number;
    pendingTasks: number;
    monthlyRevenue: string;
    activeClients: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Office operations
  async createOffice(office: InsertOffice): Promise<Office> {
    const [newOffice] = await db
      .insert(offices)
      .values(office)
      .returning();
    return newOffice;
  }

  async getOfficeByEmail(email: string): Promise<Office | undefined> {
    const [office] = await db
      .select()
      .from(offices)
      .where(eq(offices.email, email));
    return office;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(user)
      .returning();
    return newUser;
  }

  async getUsersByOffice(officeId: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.officeId, officeId), eq(users.isActive, true)));
  }

  // Client operations
  async getClientsByOffice(officeId: number): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(eq(clients.officeId, officeId))
      .orderBy(desc(clients.createdAt));
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db
      .insert(clients)
      .values(client)
      .returning();
    return newClient;
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set(client)
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: number): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Project operations
  async getProjectsByOffice(officeId: number): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.officeId, officeId))
      .orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return project;
  }

  async createProject(project: any): Promise<Project> {
    // Convert string dates to Date objects before inserting
    const projectData = {
      ...project,
      startDate: project.startDate ? (typeof project.startDate === 'string' ? new Date(project.startDate) : project.startDate) : null,
      endDate: project.endDate ? (typeof project.endDate === 'string' ? new Date(project.endDate) : project.endDate) : null,
    };
    
    const [newProject] = await db
      .insert(projects)
      .values(projectData)
      .returning();
    return newProject;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set(project)
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Task operations
  async getTasksByOffice(officeId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.officeId, officeId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTasksByProject(projectId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(tasks.createdAt));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values(task)
      .returning();
    return newTask;
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set(task)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Transaction operations
  async getTransactionsByOffice(officeId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.officeId, officeId))
      .orderBy(desc(transactions.date));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set(transaction)
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  // Dashboard statistics
  async getDashboardStats(officeId: number): Promise<{
    activeProjects: number;
    pendingTasks: number;
    monthlyRevenue: string;
    activeClients: number;
  }> {
    // Get active projects count
    const [activeProjectsResult] = await db
      .select({ count: count() })
      .from(projects)
      .where(and(
        eq(projects.officeId, officeId),
        eq(projects.status, "in_progress")
      ));

    // Get pending tasks count
    const [pendingTasksResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(
        eq(tasks.officeId, officeId),
        eq(tasks.status, "todo")
      ));

    // Get monthly revenue (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [monthlyRevenueResult] = await db
      .select({ sum: sum(transactions.amount) })
      .from(transactions)
      .where(and(
        eq(transactions.officeId, officeId),
        eq(transactions.type, "income"),
        eq(transactions.date, startOfMonth)
      ));

    // Get active clients count
    const [activeClientsResult] = await db
      .select({ count: count() })
      .from(clients)
      .where(eq(clients.officeId, officeId));

    return {
      activeProjects: activeProjectsResult.count,
      pendingTasks: pendingTasksResult.count,
      monthlyRevenue: monthlyRevenueResult.sum || "0",
      activeClients: activeClientsResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
