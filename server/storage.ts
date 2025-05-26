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
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
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

  // Project File operations
  createProjectFile(data: InsertProjectFile): Promise<ProjectFile>;
  getProjectFilesByProjectId(projectId: number, officeId: number): Promise<ProjectFile[]>;
  getProjectFileById(fileId: number, officeId: number): Promise<ProjectFile | undefined>;
  deleteProjectFile(fileId: number, officeId: number): Promise<{ success: boolean, filePath?: string }>;

  // Task Status operations
  createTaskStatus(data: InsertTaskStatus): Promise<TaskStatus>;
  getTaskStatusesByOfficeId(officeId: number): Promise<TaskStatus[]>;
  getTaskStatusById(statusId: number, officeId: number): Promise<TaskStatus | undefined>;
  updateTaskStatus(statusId: number, officeId: number, data: Partial<InsertTaskStatus>): Promise<TaskStatus | undefined>;
  deleteTaskStatus(statusId: number, officeId: number): Promise<boolean>;
  // TODO: Potentially add reorderTaskStatuses(officeId: number, statuses: { id: number, order: number }[]): Promise<void>;

  // Notification operations
  createDbNotification(data: InsertNotification): Promise<Notification>;
  getNotificationsByUserId(userId: number, officeId: number, filters: { isRead?: boolean; limit?: number; offset?: number }): Promise<{ notifications: Notification[], unreadCount: number, totalCount: number }>;
  markNotificationAsRead(notificationId: number, userId: number, officeId: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number, officeId: number): Promise<{ updatedCount: number }>;
  
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

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    // If password is provided, hash it
    if (userData.password) {
      const bcrypt = require('bcrypt');
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, id));
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

  async createTask(task: any): Promise<Task> {
    // Convert string dates to Date objects before inserting
    const taskData = {
      ...task,
      dueDate: task.dueDate ? (typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate) : null,
    };
    
    const [newTask] = await db
      .insert(tasks)
      .values(taskData)
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

  // Project File operations
  async createProjectFile(data: InsertProjectFile): Promise<ProjectFile> {
    const [newFile] = await db
      .insert(projectFiles)
      .values(data)
      .returning();
    return newFile;
  }

  async getProjectFilesByProjectId(projectId: number, officeId: number): Promise<ProjectFile[]> {
    return await db
      .select()
      .from(projectFiles)
      .where(and(eq(projectFiles.projectId, projectId), eq(projectFiles.officeId, officeId)))
      .orderBy(desc(projectFiles.createdAt));
  }

  async getProjectFileById(fileId: number, officeId: number): Promise<ProjectFile | undefined> {
    const [file] = await db
      .select()
      .from(projectFiles)
      .where(and(eq(projectFiles.id, fileId), eq(projectFiles.officeId, officeId)));
    return file;
  }

  async deleteProjectFile(fileId: number, officeId: number): Promise<{ success: boolean, filePath?: string }> {
    // First, retrieve the file path to return it for physical deletion
    const fileData = await this.getProjectFileById(fileId, officeId);
    if (!fileData) {
      return { success: false }; // File not found or not authorized
    }

    const result = await db
      .delete(projectFiles)
      .where(and(eq(projectFiles.id, fileId), eq(projectFiles.officeId, officeId)))
      .returning();
      
    return { success: result.length > 0, filePath: fileData.filePath };
  }

  // Task Status operations
  async createTaskStatus(data: InsertTaskStatus): Promise<TaskStatus> {
    const [newStatus] = await db
      .insert(taskStatuses)
      .values(data)
      .returning();
    return newStatus;
  }

  async getTaskStatusesByOfficeId(officeId: number): Promise<TaskStatus[]> {
    return await db
      .select()
      .from(taskStatuses)
      .where(eq(taskStatuses.officeId, officeId))
      .orderBy(taskStatuses.order);
  }

  async getTaskStatusById(statusId: number, officeId: number): Promise<TaskStatus | undefined> {
    const [status] = await db
      .select()
      .from(taskStatuses)
      .where(and(eq(taskStatuses.id, statusId), eq(taskStatuses.officeId, officeId)));
    return status;
  }

  async updateTaskStatus(statusId: number, officeId: number, data: Partial<InsertTaskStatus>): Promise<TaskStatus | undefined> {
    const [updatedStatus] = await db
      .update(taskStatuses)
      .set(data)
      .where(and(eq(taskStatuses.id, statusId), eq(taskStatuses.officeId, officeId)))
      .returning();
    return updatedStatus;
  }

  async deleteTaskStatus(statusId: number, officeId: number): Promise<boolean> {
    // Note: The schema sets tasks.taskStatusId to NULL on delete of a status.
    // Additional logic might be needed if tasks in a deleted status should be moved to a default status.
    const result = await db
      .delete(taskStatuses)
      .where(and(eq(taskStatuses.id, statusId), eq(taskStatuses.officeId, officeId)))
      .returning();
    return result.length > 0;
  }

  // Notification operations
  async createDbNotification(data: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(data)
      .returning();
    return newNotification;
  }

  async getNotificationsByUserId(
    userId: number, 
    officeId: number, 
    filters: { isRead?: boolean; limit?: number; offset?: number }
  ): Promise<{ notifications: Notification[], unreadCount: number, totalCount: number }> {
    const { isRead, limit = 20, offset = 0 } = filters;

    const conditions = [
      eq(notifications.userId, userId),
      eq(notifications.officeId, officeId)
    ];
    if (isRead !== undefined) {
      conditions.push(eq(notifications.isRead, isRead));
    }

    const fetchedNotifications = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    const unreadCountResult = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.officeId, officeId),
        eq(notifications.isRead, false)
      ));
      
    const totalCountResult = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.officeId, officeId)
      ));

    return { 
      notifications: fetchedNotifications, 
      unreadCount: unreadCountResult[0]?.count || 0,
      totalCount: totalCountResult[0]?.count || 0
    };
  }

  async markNotificationAsRead(notificationId: number, userId: number, officeId: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, notificationId), 
        eq(notifications.userId, userId), 
        eq(notifications.officeId, officeId)
      ))
      .returning();
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: number, officeId: number): Promise<{ updatedCount: number }> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId), 
        eq(notifications.officeId, officeId),
        eq(notifications.isRead, false) // Only update unread ones
      ))
      .returning({ id: notifications.id }); // Return IDs to count them
    return { updatedCount: result.length };
  }
}

export const storage = new DatabaseStorage();
