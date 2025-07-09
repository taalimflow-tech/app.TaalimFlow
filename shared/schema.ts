import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // admin, teacher, user
  firebaseUid: text("firebase_uid").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  authorId: integer("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  authorId: integer("author_id").references(() => users.id),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  bio: text("bio"),
  imageUrl: text("image_url"),
  email: text("email").notNull(),
  phone: text("phone"),
  available: boolean("available").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id),
  receiverId: integer("receiver_id").references(() => users.id),
  teacherId: integer("teacher_id").references(() => teachers.id),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const suggestions = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  status: text("status").default("pending"), // pending, reviewed, implemented
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  maxMembers: integer("max_members"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const formations = pgTable("formations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  duration: text("duration").notNull(),
  price: text("price").notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupRegistrations = pgTable("group_registrations", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const formationRegistrations = pgTable("formation_registrations", {
  id: serial("id").primaryKey(),
  formationId: integer("formation_id").references(() => formations.id),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
  role: true,
  firebaseUid: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).pick({
  title: true,
  content: true,
  imageUrl: true,
  authorId: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).pick({
  title: true,
  content: true,
  imageUrl: true,
  authorId: true,
  published: true,
});

export const insertTeacherSchema = createInsertSchema(teachers).pick({
  name: true,
  subject: true,
  bio: true,
  imageUrl: true,
  email: true,
  phone: true,
  available: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  receiverId: true,
  teacherId: true,
  subject: true,
  content: true,
});

export const insertSuggestionSchema = createInsertSchema(suggestions).pick({
  userId: true,
  title: true,
  content: true,
  category: true,
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
  description: true,
  category: true,
  imageUrl: true,
  maxMembers: true,
});

export const insertFormationSchema = createInsertSchema(formations).pick({
  title: true,
  description: true,
  duration: true,
  price: true,
  imageUrl: true,
  category: true,
});

export const insertGroupRegistrationSchema = createInsertSchema(groupRegistrations).pick({
  groupId: true,
  fullName: true,
  phone: true,
  email: true,
});

export const insertFormationRegistrationSchema = createInsertSchema(formationRegistrations).pick({
  formationId: true,
  fullName: true,
  phone: true,
  email: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Suggestion = typeof suggestions.$inferSelect;
export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Formation = typeof formations.$inferSelect;
export type InsertFormation = z.infer<typeof insertFormationSchema>;
export type GroupRegistration = typeof groupRegistrations.$inferSelect;
export type InsertGroupRegistration = z.infer<typeof insertGroupRegistrationSchema>;
export type FormationRegistration = typeof formationRegistrations.$inferSelect;
export type InsertFormationRegistration = z.infer<typeof insertFormationRegistrationSchema>;
