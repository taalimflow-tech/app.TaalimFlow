import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAnnouncementSchema, insertBlogPostSchema, insertTeacherSchema, insertMessageSchema, insertSuggestionSchema, insertGroupSchema, insertFormationSchema, insertGroupRegistrationSchema, insertFormationRegistrationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
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
