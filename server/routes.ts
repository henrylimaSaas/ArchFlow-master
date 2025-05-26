import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { 
  insertOfficeSchema,
  insertUserSchema,
  insertClientSchema,
  insertProjectSchema,
  insertTaskSchema,
  insertTransactionSchema,
  insertProjectFileSchema,
  type ProjectFile,
  insertTaskStatusSchema, // Added for task statuses
  type TaskStatus,        // Added for type usage
} from "@shared/schema";
import upload from './fileUpload';
import fs from 'fs'; // File system module for deleting files
import path from 'path'; // Path module for constructing file paths

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Authentication middleware
async function authenticate(req: any, res: any, next: any) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
}

import { ZodSchema } from "zod";

// Zod Validation Middleware
function validateBody(schema: ZodSchema) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.body = result.data; // Replace body with parsed and possibly transformed data
      next();
    } else {
      res.status(400).json({ 
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors 
      });
    }
  };
}

// RBAC Middleware
function checkRole(allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Forbidden: Role not available" });
    }
    if (req.user.isSuperAdmin) { // Super admin bypasses role checks
        return next();
    }
    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(express.json());

  // Authentication routes
  app.post("/api/auth/register-office", async (req, res) => {
    try {
      const officeData = insertOfficeSchema.parse(req.body.office);
      const userData = insertUserSchema.parse(req.body.user);

      // Check if office email already exists
      const existingOffice = await storage.getOfficeByEmail(officeData.email);
      if (existingOffice) {
        return res.status(400).json({ message: "Office email already exists" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create office
      const office = await storage.createOffice(officeData);

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        officeId: office.id,
        role: "admin",
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      
      res.json({
        token,
        user: { ...user, password: undefined },
        office,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      // Check for super admin credentials from environment variables
      const superAdminUsername = process.env.SUPER_ADMIN_USERNAME;
      const superAdminBcryptHash = process.env.SUPER_ADMIN_BCRYPT_HASH;

      if (superAdminUsername && superAdminBcryptHash && username === superAdminUsername) {
        const isSuperAdminPasswordValid = await bcrypt.compare(password, superAdminBcryptHash);
        
        if (isSuperAdminPasswordValid) {
          // Assign a static, non-zero, unique ID for the superadmin user for JWT subject if needed, 
          // or handle user identification distinctly for superadmin.
          // Using 'superadmin' or a specific negative number like -1 can also differentiate.
          // For this implementation, we'll use 0 as per the original hardcoded logic for userId.
          const token = jwt.sign({ userId: 0, isSuperAdmin: true, role: "superadmin" }, JWT_SECRET);
          return res.json({
            token,
            user: { id: 0, username: superAdminUsername, role: "superadmin" },
            isSuperAdmin: true,
          });
        }
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      
      res.json({
        token,
        user: { ...user, password: undefined },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticate, async (req: any, res) => {
    res.json({ user: { ...req.user, password: undefined } });
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", authenticate, async (req: any, res) => {
    try {
      if (!req.user.officeId) {
        return res.status(400).json({ message: "No office associated" });
      }
      
      const stats = await storage.getDashboardStats(req.user.officeId);
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Client routes
  app.get("/api/clients", authenticate, checkRole(['admin', 'architect', 'intern', 'financial', 'marketing']), async (req: any, res) => {
    try {
      if (!req.user.officeId) {
        return res.status(400).json({ message: "No office associated" });
      }
      
      const clients = await storage.getClientsByOffice(req.user.officeId);
      res.json(clients);
    } catch (error) {
      console.error("Clients fetch error:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", authenticate, checkRole(['admin', 'architect']), async (req: any, res) => {
    try {
      if (!req.user.officeId) {
        return res.status(400).json({ message: "No office associated" });
      }

      const clientData = insertClientSchema.parse({
        ...req.body,
        officeId: req.user.officeId,
      });
      
      const client = await storage.createClient(clientData);
      res.json(client);
    } catch (error) {
      console.error("Client creation error:", error);
      res.status(400).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", authenticate, checkRole(['admin', 'architect']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = insertClientSchema.partial().parse(req.body);
      // TODO: Add officeId check in storage.updateClient to ensure user can update this client
      const client = await storage.updateClient(id, clientData);
      res.json(client);
    } catch (error) {
      console.error("Client update error:", error);
      res.status(400).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", authenticate, checkRole(['admin', 'architect']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      // TODO: Add officeId check in storage.deleteClient
      await storage.deleteClient(id);
      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      console.error("Client deletion error:", error);
      res.status(400).json({ message: "Failed to delete client" });
    }
  });

  // Project routes
  app.get("/api/projects", authenticate, checkRole(['admin', 'architect', 'intern', 'financial', 'marketing']), async (req: any, res) => {
    try {
      if (!req.user.officeId) {
        return res.status(400).json({ message: "No office associated" });
      }
      
      const projects = await storage.getProjectsByOffice(req.user.officeId);
      res.json(projects);
    } catch (error) {
      console.error("Projects fetch error:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", authenticate, checkRole(['admin', 'architect']), validateBody(insertProjectSchema), async (req: any, res) => {
    try {
      if (!req.user.officeId) {
        return res.status(400).json({ message: "No office associated" });
      }

      const projectData = {
        ...req.body, // req.body is now validated and coerced by validateBody middleware
        officeId: req.user.officeId,
      };
      
      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error) {
      console.error("Project creation error:", error);
      res.status(400).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", authenticate, checkRole(['admin', 'architect']), validateBody(insertProjectSchema.partial()), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      // TODO: Add officeId check in storage.updateProject
      const projectData = req.body; // req.body is now validated and coerced
      
      const project = await storage.updateProject(id, projectData);
      res.json(project);
    } catch (error) {
      console.error("Project update error:", error);
      res.status(400).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", authenticate, checkRole(['admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      // TODO: Add officeId check in storage.deleteProject
      // Consider what happens to project files when a project is deleted. Schema sets onDelete: 'cascade' for project_files.projectId
      await storage.deleteProject(id); 
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Project deletion error:", error);
      res.status(400).json({ message: "Failed to delete project" });
    }
  });

  // Project File Routes
  app.post(
    "/api/projects/:projectId/files",
    authenticate,
    checkRole(['admin', 'architect']),
    upload.single('file'), // 'file' is the field name in the form-data
    validateBody(insertProjectFileSchema.omit({ officeId: true, uploadedBy: true, projectId: true})), // Validate other potential fields if any, but main data comes from file and params
    async (req: any, res) => {
      try {
        const projectId = parseInt(req.params.projectId);
        const userId = req.user.id;
        const officeId = req.user.officeId;

        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded." });
        }
        
        // Verify project exists and belongs to the office
        const project = await storage.getProject(projectId);
        if (!project || project.officeId !== officeId) {
          // If file was uploaded, attempt to delete it to prevent orphaned files
          if (req.file.path) fs.unlinkSync(req.file.path);
          return res.status(404).json({ message: "Project not found or not authorized." });
        }

        const fileData: Omit<ProjectFile, 'id' | 'createdAt'> = {
          originalName: req.file.originalname,
          generatedName: req.file.filename,
          filePath: req.file.path,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          projectId: projectId,
          uploadedBy: userId,
          officeId: officeId,
        };
        
        const newFileRecord = await storage.createProjectFile(fileData as any); // Cast as any to satisfy InsertProjectFile if it has more specific optional fields
        res.status(201).json(newFileRecord);
      } catch (error) {
        // If file was uploaded and an error occurs, attempt to delete it
        if (req.file && req.file.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (unlinkError) {
            console.error("Error deleting file after failed db insert:", unlinkError);
          }
        }
        console.error("File upload error:", error);
        if (error.name === 'ZodError') {
             return res.status(400).json({ message: "Validation failed for additional fields", errors: error.flatten().fieldErrors });
        }
        res.status(500).json({ message: "Failed to upload file." });
      }
    }
  );

  app.get(
    "/api/projects/:projectId/files",
    authenticate,
    checkRole(['admin', 'architect', 'intern', 'financial', 'marketing']),
    async (req: any, res) => {
      try {
        const projectId = parseInt(req.params.projectId);
        const officeId = req.user.officeId;

        // Verify project exists and belongs to the office
        const project = await storage.getProject(projectId);
        if (!project || project.officeId !== officeId) {
          return res.status(404).json({ message: "Project not found or not authorized." });
        }

        const files = await storage.getProjectFilesByProjectId(projectId, officeId);
        res.json(files);
      } catch (error) {
        console.error("Error fetching project files:", error);
        res.status(500).json({ message: "Failed to fetch project files." });
      }
    }
  );

  app.get(
    "/api/files/:fileId/download",
    authenticate, 
    // checkRole can be broad if file access is determined by project association & officeId
    checkRole(['admin', 'architect', 'intern', 'financial', 'marketing']),
    async (req: any, res) => {
      try {
        const fileId = parseInt(req.params.fileId);
        const officeId = req.user.officeId;

        const fileRecord = await storage.getProjectFileById(fileId, officeId);

        if (!fileRecord) {
          return res.status(404).json({ message: "File not found or not authorized." });
        }
        
        // Ensure the user has access to the project this file belongs to (optional extra check if needed)
        // const project = await storage.getProject(fileRecord.projectId);
        // if (!project || project.officeId !== officeId) {
        //   return res.status(403).json({ message: "Forbidden: Access to project denied." });
        // }

        const absoluteFilePath = path.resolve(fileRecord.filePath);
        
        // Check if file exists physically
        if (!fs.existsSync(absoluteFilePath)) {
            console.error("Physical file not found:", absoluteFilePath);
            // Optionally, delete the orphaned DB record
            // await storage.deleteProjectFile(fileId, officeId);
            return res.status(404).json({ message: "File not found on server." });
        }

        res.download(absoluteFilePath, fileRecord.originalName, (err) => {
          if (err) {
            console.error("Error downloading file:", err);
            // Avoid sending another response if headers already sent
            if (!res.headersSent) {
              res.status(500).json({ message: "Error downloading file." });
            }
          }
        });
      } catch (error) {
        console.error("Error processing file download:", error);
        if (!res.headersSent) {
          res.status(500).json({ message: "Failed to download file." });
        }
      }
    }
  );

  app.delete(
    "/api/files/:fileId",
    authenticate,
    checkRole(['admin', 'architect']),
    async (req: any, res) => {
      try {
        const fileId = parseInt(req.params.fileId);
        const officeId = req.user.officeId;

        const deleteResult = await storage.deleteProjectFile(fileId, officeId);

        if (!deleteResult.success) {
          return res.status(404).json({ message: "File not found or not authorized for deletion." });
        }

        if (deleteResult.filePath) {
          const absoluteFilePath = path.resolve(deleteResult.filePath);
          if (fs.existsSync(absoluteFilePath)) {
            fs.unlink(absoluteFilePath, (err) => {
              if (err) {
                // Log error but don't fail request as DB record is deleted
                console.error("Error deleting physical file:", err, absoluteFilePath);
              }
            });
          } else {
            console.warn("Physical file not found for deletion:", absoluteFilePath);
          }
        }
        
        res.status(200).json({ message: "File deleted successfully." });
      } catch (error) {
        console.error("Error deleting file:", error);
        res.status(500).json({ message: "Failed to delete file." });
      }
    }
  );

  // Task Status Routes
  app.post(
    "/api/task_statuses",
    authenticate,
    checkRole(['admin', 'architect']),
    validateBody(insertTaskStatusSchema.omit({ officeId: true })), // officeId will be from req.user
    async (req: any, res) => {
      try {
        const officeId = req.user.officeId;
        if (!officeId) {
          return res.status(400).json({ message: "User is not associated with an office." });
        }
        const statusData = { ...req.body, officeId };
        const newTaskStatus = await storage.createTaskStatus(statusData);
        res.status(201).json(newTaskStatus);
      } catch (error) {
        console.error("Task status creation error:", error);
        res.status(500).json({ message: "Failed to create task status." });
      }
    }
  );

  app.get(
    "/api/task_statuses",
    authenticate, // Any authenticated user can get statuses for their office
    async (req: any, res) => {
      try {
        const officeId = req.user.officeId;
        if (!officeId) {
          return res.status(400).json({ message: "User is not associated with an office." });
        }
        const statuses = await storage.getTaskStatusesByOfficeId(officeId);
        res.json(statuses);
      } catch (error) {
        console.error("Error fetching task statuses:", error);
        res.status(500).json({ message: "Failed to fetch task statuses." });
      }
    }
  );
  
  app.put(
    "/api/task_statuses/:statusId",
    authenticate,
    checkRole(['admin', 'architect']),
    validateBody(insertTaskStatusSchema.partial().omit({ officeId: true })), // officeId check is via parameter
    async (req: any, res) => {
      try {
        const statusId = parseInt(req.params.statusId);
        const officeId = req.user.officeId;
        if (!officeId) {
          return res.status(400).json({ message: "User is not associated with an office." });
        }
        const updatedStatus = await storage.updateTaskStatus(statusId, officeId, req.body);
        if (!updatedStatus) {
          return res.status(404).json({ message: "Task status not found or not authorized." });
        }
        res.json(updatedStatus);
      } catch (error) {
        console.error("Task status update error:", error);
        res.status(500).json({ message: "Failed to update task status." });
      }
    }
  );

  app.delete(
    "/api/task_statuses/:statusId",
    authenticate,
    checkRole(['admin', 'architect']),
    async (req: any, res) => {
      try {
        const statusId = parseInt(req.params.statusId);
        const officeId = req.user.officeId;
        if (!officeId) {
          return res.status(400).json({ message: "User is not associated with an office." });
        }
        // Check if status is in use before deleting, or ensure tasks are moved
        // For now, relying on onDelete: 'set null' from schema for tasks.taskStatusId
        const success = await storage.deleteTaskStatus(statusId, officeId);
        if (!success) {
          return res.status(404).json({ message: "Task status not found or not authorized." });
        }
        res.status(200).json({ message: "Task status deleted successfully." });
      } catch (error) {
        console.error("Task status deletion error:", error);
        res.status(500).json({ message: "Failed to delete task status." });
      }
    }
  );
  // TODO: Implement /api/task_statuses/reorder endpoint if needed

  // Task routes
  app.get("/api/tasks", authenticate, checkRole(['admin', 'architect', 'intern', 'financial', 'marketing']), async (req: any, res) => {
    try {
      if (!req.user.officeId) {
        return res.status(400).json({ message: "User is not associated with an office." });
      }
      
      const tasks = await storage.getTasksByOffice(req.user.officeId); // This now joins with task_statuses
      res.json(tasks);
    } catch (error) {
      console.error("Tasks fetch error:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", authenticate, checkRole(['admin', 'architect', 'intern']), validateBody(insertTaskSchema), async (req: any, res) => {
    try {
      const officeId = req.user.officeId;
      if (!officeId) {
        return res.status(400).json({ message: "User is not associated with an office." });
      }

      // Validate taskStatusId if provided
      if (req.body.taskStatusId) {
        const statusExists = await storage.getTaskStatusById(req.body.taskStatusId, officeId);
        if (!statusExists) {
          return res.status(400).json({ message: "Invalid task status ID." });
        }
      } else {
        // Optionally, assign a default status if none provided
        const defaultStatuses = await storage.getTaskStatusesByOfficeId(officeId);
        if (defaultStatuses.length > 0) {
          req.body.taskStatusId = defaultStatuses[0].id; // Assign to the first available status by order
        } else {
          // Handle case where no statuses are defined for the office - this should ideally not happen
          return res.status(400).json({ message: "No task statuses configured for this office. Please create statuses first." });
        }
      }

      const taskData = {
        ...req.body, // req.body is now validated and coerced
        officeId: officeId,
      };
      
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Task creation error:", error);
      res.status(400).json({ message: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", authenticate, checkRole(['admin', 'architect', 'intern']), validateBody(insertTaskSchema.partial()), async (req: any, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const officeId = req.user.officeId;
      if (!officeId) {
        return res.status(400).json({ message: "User is not associated with an office." });
      }

      // Validate taskStatusId if provided in the update
      if (req.body.taskStatusId) {
        const statusExists = await storage.getTaskStatusById(req.body.taskStatusId, officeId);
        if (!statusExists) {
          return res.status(400).json({ message: "Invalid task status ID." });
        }
      }
      
      // TODO: Add officeId check in storage.updateTask or ensure task belongs to user's office
      const taskData = req.body; // req.body is now validated and coerced
      
      const task = await storage.updateTask(taskId, taskData);
      res.json(task);
    } catch (error) {
      console.error("Task update error:", error);
      res.status(400).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", authenticate, checkRole(['admin', 'architect']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      // TODO: Add officeId check in storage.deleteTask
      await storage.deleteTask(id);
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Task deletion error:", error);
      res.status(400).json({ message: "Failed to delete task" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", authenticate, checkRole(['admin', 'financial']), async (req: any, res) => {
    try {
      if (!req.user.officeId) {
        return res.status(400).json({ message: "No office associated" });
      }
      
      const transactions = await storage.getTransactionsByOffice(req.user.officeId);
      res.json(transactions);
    } catch (error) {
      console.error("Transactions fetch error:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", authenticate, checkRole(['admin', 'financial']), validateBody(insertTransactionSchema), async (req: any, res) => {
    try {
      if (!req.user.officeId) {
        return res.status(400).json({ message: "No office associated" });
      }

      const transactionData = {
        ...req.body, // req.body is now validated and coerced
        officeId: req.user.officeId,
      };
      
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      console.error("Transaction creation error:", error);
      res.status(400).json({ message: "Failed to create transaction" });
    }
  });

  app.put("/api/transactions/:id", authenticate, checkRole(['admin', 'financial']), validateBody(insertTransactionSchema.partial()), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      // TODO: Add officeId check in storage.updateTransaction
      const transactionData = req.body; // req.body is now validated and coerced
      
      const transaction = await storage.updateTransaction(id, transactionData);
      res.json(transaction);
    } catch (error) {
      console.error("Transaction update error:", error);
      res.status(400).json({ message: "Failed to update transaction" });
    }
  });

  app.delete("/api/transactions/:id", authenticate, checkRole(['admin', 'financial']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      // TODO: Add officeId check in storage.deleteTransaction
      await storage.deleteTransaction(id);
      res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
      console.error("Transaction deletion error:", error);
      res.status(400).json({ message: "Failed to delete transaction" });
    }
  });

  // Users route for task assignment and team management
  app.get("/api/users", authenticate, checkRole(['admin', 'architect', 'intern', 'financial', 'marketing']), async (req: any, res) => { // Broader access for user listing (e.g., for task assignment dropdowns)
    try {
      if (!req.user.officeId) {
        return res.status(400).json({ message: "No office associated" });
      }
      
      const users = await storage.getUsersByOffice(req.user.officeId);
      res.json(users.map(user => ({ ...user, password: undefined })));
    } catch (error) {
      console.error("Users fetch error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // insertUserSchema requires password. For updates, password should be optional.
  // We'll create a specific schema for user updates if needed, or adjust insertUserSchema for this.
  // For now, user creation (POST) will use insertUserSchema, and PUT will use a partial version.
  // Password hashing is handled in storage.createUser and storage.updateUser.
  const updateUserSchema = insertUserSchema.partial().extend({
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
  });

  app.post("/api/users", authenticate, checkRole(['admin']), validateBody(insertUserSchema), async (req: any, res) => {
    try {
      if (!req.user.officeId) {
        return res.status(400).json({ message: "No office associated" });
      }
      
      const userData = {
        ...req.body, // req.body is now validated
        officeId: req.user.officeId,
      };
      
      // Password hashing is handled by storage.createUser
      const user = await storage.createUser(userData);
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error("User creation error:", error);
      // Check for unique constraint errors (e.g., username or email already exists)
      if (error.message?.includes('duplicate key value violates unique constraint')) {
        if (error.message?.includes('users_username_key')) {
          return res.status(400).json({ message: "Username already exists." });
        }
        if (error.message?.includes('users_email_key')) { // Assuming you add a unique constraint on email
          return res.status(400).json({ message: "Email already exists for this office." });
        }
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", authenticate, checkRole(['admin']), validateBody(updateUserSchema), async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      // TODO: Add officeId check in storage.updateUser to ensure the user being updated is in the admin's office
      const userData = req.body; // req.body is now validated
      
      // Password hashing is handled by storage.updateUser if password is provided
      const user = await storage.updateUser(userId, userData);
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error("User update error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", authenticate, checkRole(['admin']), async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      // TODO: Add officeId check in storage.deleteUser
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("User deletion error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
