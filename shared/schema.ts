import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  phoneVerified: boolean("phone_verified").default(false), // Phone verification status
  phoneVerificationCode: text("phone_verification_code"), // SMS verification code
  phoneVerificationExpiry: timestamp("phone_verification_expiry"), // Code expiry time
  profilePicture: text("profile_picture"), // URL to profile picture
  role: text("role").notNull().default("user"), // admin, teacher, user, student
  gender: text("gender", { enum: ["male", "female"] }), // Gender field for teachers
  firebaseUid: text("firebase_uid"),
  verified: boolean("verified").default(false), // Manual verification by admin
  verificationNotes: text("verification_notes"), // Admin notes about verification
  verifiedAt: timestamp("verified_at"),
  verifiedBy: integer("verified_by").references(() => users.id), // Admin who verified
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

export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").references(() => users.id),
  name: text("name").notNull(),
  educationLevel: text("education_level").notNull(), // الابتدائي, المتوسط, الثانوي
  grade: text("grade").notNull(), // specific grade within level
  verified: boolean("verified").default(false), // Manual verification by admin
  verificationNotes: text("verification_notes"), // Admin notes about verification
  verifiedAt: timestamp("verified_at"),
  verifiedBy: integer("verified_by").references(() => users.id), // Admin who verified
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  educationLevel: text("education_level").notNull(), // الابتدائي, المتوسط, الثانوي
  grade: text("grade").notNull(), // specific grade within level
  verified: boolean("verified").default(false), // Manual verification by admin
  verificationNotes: text("verification_notes"), // Admin notes about verification
  verifiedAt: timestamp("verified_at"),
  verifiedBy: integer("verified_by").references(() => users.id), // Admin who verified
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'suggestion', 'message', 'blog', 'announcement', 'group_update'
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  relatedId: integer("related_id"), // ID of related entity (suggestion, message, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teachingModules = pgTable("teaching_modules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(), // Arabic name
  educationLevel: text("education_level").notNull(), // الابتدائي، المتوسط، الثانوي
  grade: text("grade"), // Optional - specific grade within level
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teacherSpecializations = pgTable("teacher_specializations", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id), // Reference to teacher user
  moduleId: integer("module_id").references(() => teachingModules.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schedule Tables - Multiple independent schedule tables for different classrooms
export const scheduleTables = pgTable("schedule_tables", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Salle 1", "Salle 2"
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schedule Cells - Individual cells within schedule tables
export const scheduleCells = pgTable("schedule_cells", {
  id: serial("id").primaryKey(),
  scheduleTableId: integer("schedule_table_id").references(() => scheduleTables.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, etc.
  period: integer("period").notNull(), // 1, 2, 3, etc.
  duration: integer("duration").notNull().default(1), // 1=1.5h, 2=3h, 3=4.5h
  startTime: text("start_time"), // HH:MM format (e.g., "08:30")
  endTime: text("end_time"), // HH:MM format (e.g., "10:00")
  educationLevel: text("education_level").notNull(), // 'الابتدائي', 'المتوسط', 'الثانوي'
  subjectId: integer("subject_id").references(() => teachingModules.id),
  teacherId: integer("teacher_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
  phone: true,
  role: true,
}).extend({
  phone: z.string().regex(/^(\+213|0)(5|6|7)[0-9]{8}$/, "رقم هاتف جزائري غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل"),
});

export const insertAdminSchema = insertUserSchema.extend({
  adminKey: z.string().min(1, "مفتاح الإدارة مطلوب"),
});

export const insertTeacherUserSchema = insertUserSchema.extend({
  teacherKey: z.string().min(1, "مفتاح المعلم مطلوب"),
  gender: z.enum(["male", "female"], { required_error: "الجنس مطلوب" }),
});

export const insertStudentSchema = insertUserSchema.extend({
  educationLevel: z.string().min(1, "المستوى التعليمي مطلوب"),
  grade: z.string().min(1, "السنة الدراسية مطلوبة"),
});

export const loginSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
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

export const insertChildSchema = createInsertSchema(children).pick({
  parentId: true,
  name: true,
  educationLevel: true,
  grade: true,
});

export const insertStudentDataSchema = createInsertSchema(students).pick({
  userId: true,
  educationLevel: true,
  grade: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  title: true,
  message: true,
  relatedId: true,
});

export const insertTeachingModuleSchema = createInsertSchema(teachingModules).pick({
  name: true,
  nameAr: true,
  educationLevel: true,
  grade: true,
  description: true,
});

export const insertTeacherSpecializationSchema = createInsertSchema(teacherSpecializations).pick({
  teacherId: true,
  moduleId: true,
});

export const insertScheduleTableSchema = createInsertSchema(scheduleTables).pick({
  name: true,
  description: true,
  isActive: true,
});

export const insertScheduleCellSchema = createInsertSchema(scheduleCells).pick({
  scheduleTableId: true,
  dayOfWeek: true,
  period: true,
  duration: true,
  startTime: true,
  endTime: true,
  educationLevel: true,
  subjectId: true,
  teacherId: true,
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
export type Child = typeof children.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentDataSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type TeachingModule = typeof teachingModules.$inferSelect;
export type InsertTeachingModule = z.infer<typeof insertTeachingModuleSchema>;
export type TeacherSpecialization = typeof teacherSpecializations.$inferSelect;
export type InsertTeacherSpecialization = z.infer<typeof insertTeacherSpecializationSchema>;
export type ScheduleTable = typeof scheduleTables.$inferSelect;
export type InsertScheduleTable = z.infer<typeof insertScheduleTableSchema>;
export type ScheduleCell = typeof scheduleCells.$inferSelect;
export type InsertScheduleCell = z.infer<typeof insertScheduleCellSchema>;
