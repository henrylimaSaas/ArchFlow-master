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
} from "@shared/schema";

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

      // Check for super admin
      if (username === "ArchFy" && password === "152480") {
        const token = jwt.sign({ userId: 0, isSuperAdmin: true }, JWT_SECRET);
        return res.json({
          token,
          user: { id: 0, username: "ArchFy", role: "superadmin" },
          isSuperAdmin: true,
        });
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
  app.get("/api/clients", authenticate, async (req: any, res) => {
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

  app.post("/api/clients", authenticate, async (req: any, res) => {
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

  app.put("/api/clients/:id", authenticate, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = insertClientSchema.partial().parse(req.body);
      
      const client = await storage.updateClient(id, clientData);
      res.json(client);
    } catch (error) {
      console.error("Client update error:", error);
      res.status(400).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", authenticate, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteClient(id);
      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      console.error("Client deletion error:", error);
      res.status(400).json({ message: "Failed to delete client" });
    }
  });

  // Project routes
  app.get("/api/projects", authenticate, async (req: any, res) => {
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

  app.post("/api/projects", authenticate, async (req: any, res) => {
    try {
      if (!req.user.officeId) {
        return res.status(400).json({ message: "No office associated" });
      }

      // Remove validation and convert dates directly
      const projectData = {
        ...req.body,
        officeId: req.user.officeId,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      };
      
      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error) {
      console.error("Project creation error:", error);
      res.status(400).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", authenticate, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const projectData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      };
      
      const project = await storage.updateProject(id, projectData);
      res.json(project);
    } catch (error) {
      console.error("Project update error:", error);
      res.status(400).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", authenticate, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProject(id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Project deletion error:", error);
      res.status(400).json({ message: "Failed to delete project" });
    }
  });

  // Task routes
  app.get("/api/tasks", authenticate, async (req: any, res) => {
    try {
      if (!req.user.officeId) {
        return res.status(400).json({ message: "No office associated" });
      }
      
      const tasks = await storage.getTasksByOffice(req.user.officeId);
      res.json(tasks);
    } catch (error) {
      console.error("Tasks fetch error:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", authenticate, async (req: any, res) => {
    try {
      if (!req.user.officeId) {
        return res.status(400).json({ message: "No office associated" });
      }

      // Remove validation and convert dates directly
      const taskData = {
        ...req.body,
        officeId: req.user.officeId,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      };
      
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Task creation error:", error);
      res.status(400).json({ message: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", authenticate, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const taskData = req.body;
      
      const task = await storage.updateTask(id, taskData);
      res.json(task);
    } catch (error) {
      console.error("Task update error:", error);
      res.status(400).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", authenticate, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTask(id);
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Task deletion error:", error);
      res.status(400).json({ message: "Failed to delete task" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", authenticate, async (req: any, res) => {
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

  app.post("/api/transactions", authenticate, async (req: any, res) => {
    try {
      if (!req.user.officeId) {
        return res.status(400).json({ message: "No office associated" });
      }

      // Convert string dates to Date objects
      const bodyWithDates = {
        ...req.body,
        officeId: req.user.officeId,
        date: req.body.date ? new Date(req.body.date) : new Date(),
      };

      const transactionData = insertTransactionSchema.parse(bodyWithDates);
      
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      console.error("Transaction creation error:", error);
      res.status(400).json({ message: "Failed to create transaction" });
    }
  });

  app.put("/api/transactions/:id", authenticate, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const transactionData = insertTransactionSchema.partial().parse(req.body);
      
      const transaction = await storage.updateTransaction(id, transactionData);
      res.json(transaction);
    } catch (error) {
      console.error("Transaction update error:", error);
      res.status(400).json({ message: "Failed to update transaction" });
    }
  });

  app.delete("/api/transactions/:id", authenticate, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTransaction(id);
      res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
      console.error("Transaction deletion error:", error);
      res.status(400).json({ message: "Failed to delete transaction" });
    }
  });

  // Users route for task assignment
  app.get("/api/users", authenticate, async (req: any, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
