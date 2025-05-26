import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, jsonb, index, pgEnum } from "drizzle-orm/pg-core";
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
// TODO: Evaluate if this table is still required with the current custom JWT authentication.
// If JWTs are stateless and no other server-side session store is in use, this might be removable.
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
  id: serial("id").primaryKey(),
  username: varchar("username").notNull().unique(),
  email: varchar("email").notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
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

// Task Statuses Table (New)
export const taskStatuses = pgTable("task_statuses", {
  id: serial("id").primaryKey(),
  officeId: integer('office_id').references(() => offices.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  color: text('color'), // e.g., hex code or Tailwind color class
  order: integer('status_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  officeIdOrderIdx: index("office_id_order_idx").on(table.officeId, table.order),
  officeIdNameUniqueIdx: index("office_id_name_unique_idx").on(table.officeId, table.name), // To ensure unique status names per office if needed
}));

// Enum Definitions
export const userRoleEnum = pgEnum("user_role_enum", ['admin', 'architect', 'intern', 'financial', 'marketing']);
export const projectStatusEnum = pgEnum("project_status_enum", ['planning', 'in_progress', 'delivered']);
export const taskPriorityEnum = pgEnum("task_priority_enum", ['low', 'medium', 'high']);
export const transactionTypeEnum = pgEnum("transaction_type_enum", ['income', 'expense', 'investment']);

// Notifications Table (New)
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  officeId: integer('office_id').references(() => offices.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  message: text('message').notNull(),
  link: text('link'), // Optional URL path
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIsReadIdx: index("notifications_user_id_is_read_idx").on(table.userId, table.isRead),
  officeIdUserIdIdx: index("notifications_office_id_user_id_idx").on(table.officeId, table.userId),
}));

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
// TODO: Evaluate if this table is still required with the current custom JWT authentication.
// If JWTs are stateless and no other server-side session store is in use, this might be removable.
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
  id: serial("id").primaryKey(),
  username: varchar("username").notNull().unique(),
  email: varchar("email").notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: userRoleEnum("role").notNull().default("architect"), // ENUM Usage
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
  projectType: text("project_type"), // Could be an enum if types are fixed, otherwise text is fine
  notes: text("notes"),
  officeId: integer("office_id").references(() => offices.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: projectStatusEnum("status").notNull().default("planning"), // ENUM Usage
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  address: text("address"),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  officeId: integer("office_id").references(() => offices.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Task Statuses Table (New)
export const taskStatuses = pgTable("task_statuses", {
  id: serial("id").primaryKey(),
  officeId: integer('office_id').references(() => offices.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  color: text('color'), // e.g., hex code or Tailwind color class
  order: integer('status_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  officeIdOrderIdx: index("office_id_order_idx").on(table.officeId, table.order),
  officeIdNameUniqueIdx: index("office_id_name_unique_idx").on(table.officeId, table.name), // To ensure unique status names per office if needed
}));

// Indexes for users table
export const usersOfficeIdIdx = index("users_office_id_idx").on(users.officeId);
export const usersEmailIdx = index("users_email_idx").on(users.email);
export const usersRoleIdx = index("users_role_idx").on(users.role); // Index for enum

// Indexes for clients table
export const clientsOfficeIdIdx = index("clients_office_id_idx").on(clients.officeId);
export const clientsEmailIdx = index("clients_email_idx").on(clients.email); // If email is frequently searched

// Indexes for projects table
export const projectsClientIdIdx = index("projects_client_id_idx").on(projects.clientId);
export const projectsOfficeIdIdx = index("projects_office_id_idx").on(projects.officeId);
export const projectsStatusIdx = index("projects_status_idx").on(projects.status); // Index for enum

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  taskStatusId: integer('task_status_id').references(() => taskStatuses.id, { onDelete: 'set null' }), // Changed from status string
  priority: taskPriorityEnum("priority").notNull().default("medium"), // ENUM Usage
  dueDate: timestamp("due_date"),
  assignedTo: integer("assigned_to").references(() => users.id, { onDelete: 'set null' }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: 'cascade' }),
  parentTaskId: integer("parent_task_id").references(() => tasks.id, { onDelete: 'cascade' }), // Cascade if parent task deleted
  officeId: integer("office_id").references(() => offices.id, { onDelete: 'cascade' }).notNull(), // Cascade if office deleted
  createdAt: timestamp("created_at").defaultNow(),
});

// Indexes for tasks table
export const tasksOfficeIdIdx = index("tasks_office_id_idx").on(tasks.officeId);
export const tasksProjectIdIdx = index("tasks_project_id_idx").on(tasks.projectId);
export const tasksAssignedToIdx = index("tasks_assigned_to_idx").on(tasks.assignedTo);
export const tasksTaskStatusIdIdx = index("tasks_task_status_id_idx").on(tasks.taskStatusId);
export const tasksPriorityIdx = index("tasks_priority_idx").on(tasks.priority); // Index for enum

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: transactionTypeEnum("type").notNull(), // ENUM Usage
  category: text("category").notNull(), // Remains text as it's user-defined/varied
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: 'cascade' }), // Cascade if project deleted
  officeId: integer("office_id").references(() => offices.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Indexes for transactions table
export const transactionsOfficeIdIdx = index("transactions_office_id_idx").on(transactions.officeId);
export const transactionsProjectIdIdx = index("transactions_project_id_idx").on(transactions.projectId);
export const transactionsDateIdx = index("transactions_date_idx").on(transactions.date);
export const transactionsCategoryIdx = index("transactions_category_idx").on(transactions.category);
export const transactionsTypeIdx = index("transactions_type_idx").on(transactions.type); // Index for enum


// Project files table
export const projectFiles = pgTable("project_files", {
  id: serial("id").primaryKey(),
  originalName: text("original_name").notNull(), // Original name of the file from the client
  generatedName: text("generated_name").notNull().unique(), // Name used for storing the file on the server (ensures uniqueness)
  filePath: text("file_path").notNull(), // Relative path to the file in the storage directory (e.g., 'uploads/project_files/generated_name.pdf')
  fileType: text("file_type").notNull(), // MIME type
  fileSize: integer("file_size"), // File size in bytes
  projectId: integer("project_id").references(() => projects.id, { onDelete: 'cascade' }).notNull(), // Cascade delete if project is deleted
  uploadedBy: integer("uploaded_by").references(() => users.id, { onDelete: 'set null' }), // Set to null if user is deleted
  officeId: integer("office_id").references(() => offices.id, { onDelete: 'cascade' }).notNull(), // Cascade delete if office is deleted
  createdAt: timestamp("created_at").defaultNow(),
});

// Indexes for project_files table
export const projectFilesOfficeIdIdx = index("project_files_office_id_idx").on(projectFiles.officeId);
export const projectFilesProjectIdIdx = index("project_files_project_id_idx").on(projectFiles.projectId);
export const projectFilesUploadedByIdx = index("project_files_uploaded_by_idx").on(projectFiles.uploadedBy);


// Relations
export const officesRelations = relations(offices, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  projects: many(projects),
  tasks: many(tasks),
  taskStatuses: many(taskStatuses),
  transactions: many(transactions),
  notifications: many(notifications), // Relation to notifications
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  office: one(offices, {
    fields: [users.officeId],
    references: [offices.id],
  }),
  assignedTasks: many(tasks, { relationName: "assignedTasks" }),
  uploadedFiles: many(projectFiles),
  notifications: many(notifications), // Relation to notifications
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
  projectFiles: many(projectFiles), // Renamed from 'files' to 'projectFiles' for clarity
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
  taskStatus: one(taskStatuses, { // Added relation to taskStatus
    fields: [tasks.taskStatusId],
    references: [taskStatuses.id],
  }),
  office: one(offices, {
    fields: [tasks.officeId],
    references: [offices.id],
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: "parentTaskRelation" // Explicit relation name for self-referencing
  }),
  subtasks: many(tasks, {relationName: "subTasksRelation"}), // Explicit relation name
}));

// Task Statuses Relations (New)
export const taskStatusesRelations = relations(taskStatuses, ({ one, many }) => ({
  office: one(offices, {
    fields: [taskStatuses.officeId],
    references: [offices.id],
  }),
  tasks: many(tasks),
}));

// Notification Relations (New)
export const notificationsRelations = relations(notifications, ({ one }) => ({
  office: one(offices, {
    fields: [notifications.officeId],
    references: [offices.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
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
  office: one(offices, { // Added relation to office
    fields: [projectFiles.officeId],
    references: [offices.id],
  }),
}));

// Schemas para validação
export const insertOfficeSchema = createInsertSchema(offices).omit({
  id: true,
  createdAt: true,
});
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects, {
  startDate: z.coerce.date().optional().nullable(), // Allow optional and null
  endDate: z.coerce.date().optional().nullable(),   // Allow optional and null
}).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks, {
  dueDate: z.coerce.date().optional().nullable(),
  taskStatusId: z.number().int().positive().optional().nullable(), // taskStatusId is an int
}).omit({
  id: true,
  createdAt: true,
});

// Zod schema for task_statuses (New)
export const insertTaskStatusSchema = createInsertSchema(taskStatuses, {
  officeId: z.number().int().positive(),
  name: z.string().min(1, "Status name cannot be empty"),
  color: z.string().optional(),
  order: z.number().int().default(0),
}).omit({
  id: true,
  createdAt: true,
});
export const selectTaskStatusSchema = createInsertSchema(taskStatuses);

// Zod schemas for notifications (New)
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true, // isRead defaults to false and is not set by client on create
});
export const selectNotificationSchema = createInsertSchema(notifications);


export const insertTransactionSchema = createInsertSchema(transactions, {
  date: z.coerce.date(), // Date is not optional for transactions in the table
  amount: z.coerce.number().positive("Amount must be positive"), // Ensure amount is positive
}).omit({
  id: true,
  createdAt: true,
});

export const insertProjectFileSchema = createInsertSchema(projectFiles, {
  fileSize: z.coerce.number().optional(), // Ensure fileSize is treated as a number
}).omit({
  id: true,
  createdAt: true,
  // generatedName and filePath will be set by the server, not client
  generatedName: true, 
  filePath: true,
});

// Types
export type Office = typeof offices.$inferSelect;
export type InsertOffice = z.infer<typeof insertOfficeSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Project = typeof projects.$inferSelect;
// Explicitly define InsertProject to ensure correct type after coercion for API usage
export type InsertProject = Omit<z.infer<typeof insertProjectSchema>, 'startDate' | 'endDate'> & {
  startDate?: Date | null;
  endDate?: Date | null;
};

export type Task = typeof tasks.$inferSelect & { 
  // Potentially include status details when fetching tasks later
  status?: { name: string; color: string | null } 
};
// Explicitly define InsertTask for clarity
export type InsertTask = Omit<z.infer<typeof insertTaskSchema>, 'dueDate' | 'taskStatusId'> & {
  dueDate?: Date | null;
  taskStatusId?: number | null;
};

// Types for TaskStatus (New)
export type TaskStatus = typeof taskStatuses.$inferSelect;
export type InsertTaskStatus = z.infer<typeof insertTaskStatusSchema>;

// Types for Notifications (New)
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Transaction = typeof transactions.$inferSelect;
// Explicitly define InsertTransaction for clarity
export type InsertTransaction = Omit<z.infer<typeof insertTransactionSchema>, 'date' | 'amount'> & {
  date: Date;
  amount: number;
};

export type ProjectFile = typeof projectFiles.$inferSelect;
export type InsertProjectFile = z.infer<typeof insertProjectFileSchema>;