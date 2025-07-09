import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAnnouncementSchema, insertBlogPostSchema, insertTeacherSchema, insertMessageSchema, insertSuggestionSchema, insertGroupSchema, insertFormationSchema, insertGroupRegistrationSchema, insertFormationRegistrationSchema, insertUserSchema, insertAdminSchema, insertTeacherUserSchema, loginSchema } from "@shared/schema";

// Simple session storage for demo (in production, use Redis or database)
let currentUser: any = null;

// Secret keys for admin and teacher registration
const ADMIN_SECRET_KEY = "ADMIN_2024_SECRET_KEY";
const TEACHER_SECRET_KEY = "TEACHER_2024_SECRET_KEY";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.authenticateUser(email, password);
      
      if (user) {
        // Store user session
        currentUser = user;
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      } else {
        res.status(401).json({ error: "بيانات تسجيل الدخول غير صحيحة" });
      }
    } catch (error) {
      res.status(400).json({ error: "بيانات غير صحيحة" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { children: childrenData, ...userData } = req.body;
      const validatedData = insertUserSchema.parse(userData);
      
      // Check if user already exists by email
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "المستخدم موجود بالفعل" });
      }
      
      // Check if phone number already exists
      const existingPhone = await storage.getUserByPhone(validatedData.phone);
      if (existingPhone) {
        return res.status(400).json({ error: "رقم الهاتف مستخدم بالفعل" });
      }
      
      // Create user first
      const user = await storage.createUser(validatedData);
      
      // Create children if provided
      if (childrenData && Array.isArray(childrenData) && childrenData.length > 0) {
        const childrenPromises = childrenData.map(child => 
          storage.createChild({
            parentId: user.id,
            name: child.name,
            educationLevel: child.educationLevel,
            grade: child.grade
          })
        );
        await Promise.all(childrenPromises);
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ error: "بيانات غير صحيحة" });
    }
  });

  // Admin registration with secret key
  app.post("/api/auth/register-admin", async (req, res) => {
    try {
      const validatedData = insertAdminSchema.parse(req.body);
      
      // Verify admin secret key
      if (validatedData.adminKey !== ADMIN_SECRET_KEY) {
        return res.status(403).json({ error: "مفتاح الإدارة غير صحيح" });
      }
      
      // Check if user already exists by email
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "المستخدم موجود بالفعل" });
      }
      
      // Check if phone number already exists
      const existingPhone = await storage.getUserByPhone(validatedData.phone);
      if (existingPhone) {
        return res.status(400).json({ error: "رقم الهاتف مستخدم بالفعل" });
      }
      
      // Create user with admin role
      const { adminKey: _, ...userDataWithoutKey } = validatedData;
      const userWithRole = { ...userDataWithoutKey, role: 'admin' };
      const user = await storage.createUser(userWithRole);
      
      // Remove password from response
      const { password: __, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ error: "بيانات غير صحيحة" });
    }
  });

  // Teacher registration with secret key
  app.post("/api/auth/register-teacher", async (req, res) => {
    try {
      const validatedData = insertTeacherUserSchema.parse(req.body);
      
      // Verify teacher secret key
      if (validatedData.teacherKey !== TEACHER_SECRET_KEY) {
        return res.status(403).json({ error: "مفتاح المعلم غير صحيح" });
      }
      
      // Check if user already exists by email
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "المستخدم موجود بالفعل" });
      }
      
      // Check if phone number already exists
      const existingPhone = await storage.getUserByPhone(validatedData.phone);
      if (existingPhone) {
        return res.status(400).json({ error: "رقم الهاتف مستخدم بالفعل" });
      }
      
      // Create user with teacher role
      const { teacherKey: _, ...userDataWithoutKey } = validatedData;
      const userWithRole = { ...userDataWithoutKey, role: 'teacher' };
      const user = await storage.createUser(userWithRole);
      
      // Create teacher profile in teachers table
      const teacherData = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        subject: "مادة عامة", // Default subject, can be updated later
        available: true
      };
      await storage.createTeacher(teacherData);
      
      // Remove password from response
      const { password: __, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ error: "بيانات غير صحيحة" });
    }
  });

  // Get current user info (for role verification)
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (currentUser) {
        const { password: _, ...userWithoutPassword } = currentUser;
        res.json({ user: userWithoutPassword });
      } else {
        res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    currentUser = null;
    res.json({ message: "تم تسجيل الخروج بنجاح" });
  });

  // Announcement routes
  app.get("/api/announcements", async (req, res) => {
    try {
      const announcements = await storage.getAnnouncements();
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.post("/api/announcements", async (req, res) => {
    try {
      const validatedData = insertAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement(validatedData);
      res.status(201).json(announcement);
    } catch (error) {
      res.status(400).json({ error: "Invalid announcement data" });
    }
  });

  // Blog post routes
  app.get("/api/blog-posts", async (req, res) => {
    try {
      const blogPosts = await storage.getBlogPosts();
      res.json(blogPosts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });

  app.post("/api/blog-posts", async (req, res) => {
    try {
      const validatedData = insertBlogPostSchema.parse(req.body);
      const blogPost = await storage.createBlogPost(validatedData);
      res.status(201).json(blogPost);
    } catch (error) {
      res.status(400).json({ error: "Invalid blog post data" });
    }
  });

  // Teacher routes
  app.get("/api/teachers", async (req, res) => {
    try {
      const teachers = await storage.getTeachers();
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teachers" });
    }
  });

  app.post("/api/teachers", async (req, res) => {
    try {
      const validatedData = insertTeacherSchema.parse(req.body);
      const teacher = await storage.createTeacher(validatedData);
      res.status(201).json(teacher);
    } catch (error) {
      res.status(400).json({ error: "Invalid teacher data" });
    }
  });

  // Message routes
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      console.log('Received message request:', req.body);
      const validatedData = insertMessageSchema.parse(req.body);
      console.log('Validated data:', validatedData);
      const message = await storage.createMessage(validatedData);
      console.log('Created message:', message);
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  // Suggestion routes
  app.get("/api/suggestions", async (req, res) => {
    try {
      const suggestions = await storage.getSuggestions();
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  app.post("/api/suggestions", async (req, res) => {
    try {
      const validatedData = insertSuggestionSchema.parse(req.body);
      const suggestion = await storage.createSuggestion(validatedData);
      res.status(201).json(suggestion);
    } catch (error) {
      res.status(400).json({ error: "Invalid suggestion data" });
    }
  });

  // Group routes
  app.get("/api/groups", async (req, res) => {
    try {
      const groups = await storage.getGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  app.post("/api/groups", async (req, res) => {
    try {
      const validatedData = insertGroupSchema.parse(req.body);
      const group = await storage.createGroup(validatedData);
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ error: "Invalid group data" });
    }
  });

  // Formation routes
  app.get("/api/formations", async (req, res) => {
    try {
      const formations = await storage.getFormations();
      res.json(formations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch formations" });
    }
  });

  app.post("/api/formations", async (req, res) => {
    try {
      const validatedData = insertFormationSchema.parse(req.body);
      const formation = await storage.createFormation(validatedData);
      res.status(201).json(formation);
    } catch (error) {
      res.status(400).json({ error: "Invalid formation data" });
    }
  });

  // Children routes
  app.get("/api/children", async (req, res) => {
    try {
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const children = await storage.getChildrenByParentId(currentUser.id);
      res.json(children);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch children" });
    }
  });

  app.post("/api/children", async (req, res) => {
    try {
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const childData = {
        parentId: currentUser.id,
        name: req.body.name,
        educationLevel: req.body.educationLevel,
        grade: req.body.grade
      };
      
      const child = await storage.createChild(childData);
      res.status(201).json(child);
    } catch (error) {
      res.status(400).json({ error: "Invalid child data" });
    }
  });

  app.delete("/api/children/:id", async (req, res) => {
    try {
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const childId = parseInt(req.params.id);
      await storage.deleteChild(childId);
      res.json({ message: "تم حذف الطفل بنجاح" });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete child" });
    }
  });

  // Registration routes
  app.post("/api/group-registrations", async (req, res) => {
    try {
      const validatedData = insertGroupRegistrationSchema.parse(req.body);
      const registration = await storage.createGroupRegistration(validatedData);
      res.status(201).json(registration);
    } catch (error) {
      res.status(400).json({ error: "Invalid group registration data" });
    }
  });

  app.post("/api/formation-registrations", async (req, res) => {
    try {
      const validatedData = insertFormationRegistrationSchema.parse(req.body);
      const registration = await storage.createFormationRegistration(validatedData);
      res.status(201).json(registration);
    } catch (error) {
      res.status(400).json({ error: "Invalid formation registration data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
