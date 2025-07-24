import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Schools table for multi-tenancy
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // URL-friendly school identifier
  domain: text("domain"), // Optional custom domain
  location: text("location"), // Wilaya location (Algerian province)
  adminKey: text("admin_key").notNull(), // Secret key for admin registration
  teacherKey: text("teacher_key").notNull(), // Secret key for teacher registration
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#3b82f6"), // Hex color for branding
  secondaryColor: text("secondary_color").default("#1e40af"),
  settings: jsonb("settings"), // Additional school-specific settings
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users: any = pgTable("users", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id), // null for super admin
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  phoneVerified: boolean("phone_verified").default(false), // Phone verification status
  phoneVerificationCode: text("phone_verification_code"), // SMS verification code
  phoneVerificationExpiry: timestamp("phone_verification_expiry"), // Code expiry time
  emailVerified: boolean("email_verified").default(false), // Email verification status
  emailVerificationCode: text("email_verification_code"), // Email verification code
  emailVerificationExpiry: timestamp("email_verification_expiry"), // Code expiry time
  profilePicture: text("profile_picture"), // URL to profile picture
  role: text("role").notNull().default("user"), // super_admin, admin, teacher, user, student
  gender: text("gender", { enum: ["male", "female"] }), // Gender field for teachers
  firebaseUid: text("firebase_uid"),
  verified: boolean("verified").default(false), // Manual verification by admin
  verificationNotes: text("verification_notes"), // Admin notes about verification
  verifiedAt: timestamp("verified_at"),
  verifiedBy: integer("verified_by").references(() => users.id), // Admin who verified
  banned: boolean("banned").default(false), // User ban status
  banReason: text("ban_reason"), // Reason for ban
  bannedAt: timestamp("banned_at"), // When user was banned
  bannedBy: integer("banned_by").references(() => users.id), // Admin who banned the user
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  authorId: integer("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
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
  schoolId: integer("school_id").references(() => schools.id).notNull(),
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
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  senderId: integer("sender_id").references(() => users.id),
  receiverId: integer("receiver_id").references(() => users.id),
  teacherId: integer("teacher_id").references(() => teachers.id),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blockedUsers = pgTable("blocked_users", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  blockerId: integer("blocker_id").references(() => users.id).notNull(),
  blockedId: integer("blocked_id").references(() => users.id).notNull(),
  reason: text("reason"), // Optional reason for blocking
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userReports = pgTable("user_reports", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  reporterId: integer("reporter_id").references(() => users.id).notNull(),
  reportedUserId: integer("reported_user_id").references(() => users.id).notNull(),
  messageId: integer("message_id").references(() => messages.id), // Optional - if reporting specific message
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").default("pending"), // pending, reviewed, resolved
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const suggestions = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  status: text("status").default("pending"), // pending, reviewed, implemented
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  maxMembers: integer("max_members"),
  educationLevel: text("education_level"), // الابتدائي, المتوسط, الثانوي
  subjectId: integer("subject_id").references(() => teachingModules.id), // Subject/module
  teacherId: integer("teacher_id").references(() => users.id), // Assigned teacher
  studentsAssigned: integer("students_assigned").array(), // Array of student user IDs
  isAdminManaged: boolean("is_admin_managed").default(false), // Admin-managed vs public groups
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const formations = pgTable("formations", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
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
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  groupId: integer("group_id").references(() => groups.id),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User assignments to groups (for internal students/users)
export const groupUserAssignments = pgTable("group_user_assignments", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  groupId: integer("group_id").references(() => groups.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  assignedBy: integer("assigned_by").references(() => users.id), // Admin who made the assignment
});

export const formationRegistrations = pgTable("formation_registrations", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  formationId: integer("formation_id").references(() => formations.id),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  parentId: integer("parent_id").references(() => users.id),
  name: text("name").notNull(),
  educationLevel: text("education_level").notNull(), // الابتدائي, المتوسط, الثانوي
  grade: text("grade").notNull(), // specific grade within level
  selectedSubjects: text("selected_subjects").array(), // Array of subject IDs they want to study
  verified: boolean("verified").default(false), // Manual verification by admin
  verificationNotes: text("verification_notes"), // Admin notes about verification
  verifiedAt: timestamp("verified_at"),
  verifiedBy: integer("verified_by").references(() => users.id), // Admin who verified
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  educationLevel: text("education_level").notNull(), // الابتدائي, المتوسط, الثانوي
  grade: text("grade").notNull(), // specific grade within level
  selectedSubjects: text("selected_subjects").array(), // Array of subject IDs they want to study
  verified: boolean("verified").default(false), // Manual verification by admin
  verificationNotes: text("verification_notes"), // Admin notes about verification
  verifiedAt: timestamp("verified_at"),
  verifiedBy: integer("verified_by").references(() => users.id), // Admin who verified
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
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
  schoolId: integer("school_id").references(() => schools.id), // null for global subjects
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(), // Arabic name
  educationLevel: text("education_level").notNull(), // الابتدائي، المتوسط، الثانوي
  grade: text("grade"), // Optional - specific grade within level
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teacherSpecializations = pgTable("teacher_specializations", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id), // Reference to teacher user
  moduleId: integer("module_id").references(() => teachingModules.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schedule Tables - Multiple independent schedule tables for different classrooms
export const scheduleTables = pgTable("schedule_tables", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  name: text("name").notNull(), // e.g., "Salle 1", "Salle 2"
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schedule Cells - Individual cells within schedule tables
export const scheduleCells = pgTable("schedule_cells", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
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
}).extend({
  teacherId: z.number().optional().nullable(), // Make teacherId optional and nullable
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

export const insertGroupUserAssignmentSchema = createInsertSchema(groupUserAssignments).pick({
  groupId: true,
  userId: true,
  assignedBy: true,
});

// School-related schemas
export const insertSchoolSchema = createInsertSchema(schools).pick({
  name: true,
  code: true,
  domain: true,
  logoUrl: true,
  primaryColor: true,
  secondaryColor: true,
  settings: true,
});

export const schoolSelectionSchema = z.object({
  schoolCode: z.string().min(1, "كود المدرسة مطلوب"),
});

// Super admin schema
export const insertSuperAdminSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل"),
  name: z.string().min(1, "الاسم مطلوب"),
  phone: z.string().min(8, "رقم الهاتف يجب أن يكون على الأقل 8 أرقام").max(20, "رقم الهاتف طويل جداً"), // Flexible phone validation for super admins
  superAdminKey: z.string().min(1, "مفتاح المسؤول العام مطلوب"),
});

// Additional multi-tenancy types
export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type InsertSuperAdmin = z.infer<typeof insertSuperAdminSchema>;
export type SchoolSelection = z.infer<typeof schoolSelectionSchema>;

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

export const insertBlockedUserSchema = createInsertSchema(blockedUsers).pick({
  blockerId: true,
  blockedId: true,
  reason: true,
});

export const insertUserReportSchema = createInsertSchema(userReports).pick({
  reporterId: true,
  reportedUserId: true,
  messageId: true,
  reason: true,
  description: true,
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
export type GroupUserAssignment = typeof groupUserAssignments.$inferSelect;
export type InsertGroupUserAssignment = z.infer<typeof insertGroupUserAssignmentSchema>;
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
export type BlockedUser = typeof blockedUsers.$inferSelect;
export type InsertBlockedUser = z.infer<typeof insertBlockedUserSchema>;
export type UserReport = typeof userReports.$inferSelect;
export type InsertUserReport = z.infer<typeof insertUserReportSchema>;
