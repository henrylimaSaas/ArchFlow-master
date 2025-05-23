import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, index, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Offices table
export const offices = pgTable("offices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Session storage table (Required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (Updated for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(), // Replit user ID
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").notNull().default("architect"), // architect, intern, financial, marketing, admin
  officeId: integer("office_id").references(() => offices.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  projectType: text("project_type"),
  notes: text("notes"),
  officeId: integer("office_id").references(() => offices.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("planning"), // planning, in_progress, delivered
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  address: text("address"),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  officeId: integer("office_id").references(() => offices.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"), // todo, in_progress, done
  priority: text("priority").notNull().default("medium"), // low, medium, high
  dueDate: timestamp("due_date"),
  assignedTo: integer("assigned_to").references(() => users.id),
  projectId: integer("project_id").references(() => projects.id),
  parentTaskId: integer("parent_task_id").references(() => tasks.id),
  officeId: integer("office_id").references(() => offices.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // income, expense, investment
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  projectId: integer("project_id").references(() => projects.id),
  officeId: integer("office_id").references(() => offices.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Project files table
export const projectFiles = pgTable("project_files", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const officesRelations = relations(offices, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  projects: many(projects),
  tasks: many(tasks),
  transactions: many(transactions),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  office: one(offices, {
    fields: [users.officeId],
    references: [offices.id],
  }),
  assignedTasks: many(tasks),
  uploadedFiles: many(projectFiles),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  office: one(offices, {
    fields: [clients.officeId],
    references: [offices.id],
  }),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  office: one(offices, {
    fields: [projects.officeId],
    references: [offices.id],
  }),
  tasks: many(tasks),
  transactions: many(transactions),
  files: many(projectFiles),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  assignedUser: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  office: one(offices, {
    fields: [tasks.officeId],
    references: [offices.id],
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
  }),
  subtasks: many(tasks),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  project: one(projects, {
    fields: [transactions.projectId],
    references: [projects.id],
  }),
  office: one(offices, {
    fields: [transactions.officeId],
    references: [offices.id],
  }),
}));

export const projectFilesRelations = relations(projectFiles, ({ one }) => ({
  project: one(projects, {
    fields: [projectFiles.projectId],
    references: [projects.id],
  }),
  uploadedByUser: one(users, {
    fields: [projectFiles.uploadedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertOfficeSchema = createInsertSchema(offices).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  }).extend({
  dueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  }).extend({
  date: z.string().transform(val => new Date(val)),
});

export const insertProjectFileSchema = createInsertSchema(projectFiles).omit({
  id: true,
  createdAt: true,
});

// Types
export type Office = typeof offices.$inferSelect;
export type InsertOffice = z.infer<typeof insertOfficeSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type ProjectFile = typeof projectFiles.$inferSelect;
export type InsertProjectFile = z.infer<typeof insertProjectFileSchema>;