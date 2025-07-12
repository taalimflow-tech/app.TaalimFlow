import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAnnouncementSchema, insertBlogPostSchema, insertTeacherSchema, insertMessageSchema, insertSuggestionSchema, insertGroupSchema, insertFormationSchema, insertGroupRegistrationSchema, insertFormationRegistrationSchema, insertUserSchema, insertAdminSchema, insertTeacherUserSchema, insertStudentSchema, loginSchema, insertTeachingModuleSchema, insertTeacherSpecializationSchema, insertScheduleTableSchema, insertScheduleCellSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

// Simple session storage for demo (in production, use Redis or database)
let currentUser: any = null;

// Secret keys for admin and teacher registration
const ADMIN_SECRET_KEY = "ADMIN_2024_SECRET_KEY";
const TEACHER_SECRET_KEY = "TEACHER_2024_SECRET_KEY";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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
        res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ error: "تأكد من صحة البيانات المدخلة" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { children: childrenData, educationLevel, grade, ...userData } = req.body;
      
      // Validate based on role
      let validatedData;
      if (userData.role === 'student') {
        validatedData = insertStudentSchema.parse({
          ...userData,
          educationLevel,
          grade
        });
      } else {
        validatedData = insertUserSchema.parse(userData);
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
      
      // Create user first
      const { educationLevel: _, grade: __, ...userDataOnly } = validatedData;
      const user = await storage.createUser(userDataOnly);
      
      // Create student record if this is a student
      if (userData.role === 'student' && educationLevel && grade) {
        await storage.createStudent({
          userId: user.id,
          educationLevel,
          grade
        });
      }
      
      // Create children if provided (for parents)
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
      const { password: ___, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "يرجى التأكد من صحة جميع البيانات المطلوبة" });
      } else {
        res.status(400).json({ error: "حدث خطأ في إنشاء الحساب. يرجى المحاولة مرة أخرى" });
      }
    }
  });

  // Admin registration with secret key
  app.post("/api/auth/register-admin", async (req, res) => {
    try {
      const validatedData = insertAdminSchema.parse(req.body);
      
      // Verify admin secret key
      if (validatedData.adminKey !== ADMIN_SECRET_KEY) {
        return res.status(403).json({ error: "مفتاح الإدارة غير صحيح. تأكد من صحة المفتاح السري" });
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
      console.error('Admin registration error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "يرجى التأكد من صحة جميع البيانات المطلوبة" });
      } else {
        res.status(400).json({ error: "حدث خطأ في إنشاء حساب المدير. يرجى المحاولة مرة أخرى" });
      }
    }
  });

  // Teacher registration with secret key
  app.post("/api/auth/register-teacher", async (req, res) => {
    try {
      const validatedData = insertTeacherUserSchema.parse(req.body);
      
      // Verify teacher secret key
      if (validatedData.teacherKey !== TEACHER_SECRET_KEY) {
        return res.status(403).json({ error: "مفتاح المعلم غير صحيح. تأكد من صحة المفتاح السري" });
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
      console.error('Teacher registration error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "يرجى التأكد من صحة جميع البيانات المطلوبة" });
      } else {
        res.status(400).json({ error: "حدث خطأ في إنشاء حساب المعلم. يرجى المحاولة مرة أخرى" });
      }
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

  // Serve static files
  app.use('/uploads', express.static(uploadDir));

  // Profile picture routes
  app.post("/api/profile/picture", async (req, res) => {
    try {
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const { profilePictureUrl } = req.body;
      
      if (!profilePictureUrl) {
        return res.status(400).json({ error: "رابط الصورة مطلوب" });
      }

      const updatedUser = await storage.updateUserProfilePicture(currentUser.id, profilePictureUrl);
      
      // Update current user session
      currentUser = updatedUser;
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Error updating profile picture:', error);
      res.status(500).json({ error: "فشل في تحديث الصورة الشخصية" });
    }
  });

  // File upload endpoint for profile pictures
  app.post("/api/profile/picture/upload", upload.single('profilePicture'), async (req, res) => {
    try {
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "لم يتم رفع أي ملف" });
      }

      // Create URL for the uploaded file
      const fileUrl = `/uploads/${req.file.filename}`;
      
      const updatedUser = await storage.updateUserProfilePicture(currentUser.id, fileUrl);
      
      // Update current user session
      currentUser = updatedUser;
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword, fileUrl });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      res.status(500).json({ error: "فشل في رفع الصورة الشخصية" });
    }
  });

  // User management routes (Admin only)
  app.get("/api/users", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const { search } = req.query;
      let users;
      
      if (search && typeof search === 'string') {
        users = await storage.searchUsers(search);
      } else {
        users = await storage.getAllUsers();
      }
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }
      
      // Get user's children
      const children = await storage.getChildrenByParentId(userId);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json({ ...userWithoutPassword, children });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/users/:id/messages", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const userId = parseInt(req.params.id);
      const messages = await storage.getMessagesByUserId(userId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching user messages:', error);
      res.status(500).json({ error: "Failed to fetch user messages" });
    }
  });

  // Bulk messaging route (Admin only)
  app.post("/api/messages/bulk", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const { receiverIds, subject, content } = req.body;
      
      if (!receiverIds || !Array.isArray(receiverIds) || receiverIds.length === 0) {
        return res.status(400).json({ error: "يجب تحديد المستلمين" });
      }
      
      if (!subject || !content) {
        return res.status(400).json({ error: "العنوان والمحتوى مطلوبان" });
      }
      
      const messages = await storage.createBulkMessage(
        [currentUser.id], // sender
        receiverIds,
        subject,
        content
      );
      
      res.status(201).json({ 
        message: "تم إرسال الرسائل بنجاح",
        count: messages.length,
        messages 
      });
    } catch (error) {
      console.error('Error sending bulk messages:', error);
      res.status(500).json({ error: "Failed to send bulk messages" });
    }
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
      
      // Create notifications for all users about new announcement
      const allUsers = await storage.getAllUsers();
      const nonAdminUsers = allUsers.filter(u => u.role !== 'admin');
      if (nonAdminUsers.length > 0) {
        await storage.createNotificationForUsers(
          nonAdminUsers.map(u => u.id),
          'announcement',
          '📅 إعلان جديد',
          `إعلان جديد: "${announcement.title}"`,
          announcement.id
        );
      }
      
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
      
      // Create notifications for all users about new blog post
      const allUsers = await storage.getAllUsers();
      const nonAdminUsers = allUsers.filter(u => u.role !== 'admin');
      if (nonAdminUsers.length > 0) {
        await storage.createNotificationForUsers(
          nonAdminUsers.map(u => u.id),
          'blog',
          '📚 مقال جديد',
          `تم نشر مقال جديد: "${blogPost.title}"`,
          blogPost.id
        );
      }
      
      res.status(201).json(blogPost);
    } catch (error) {
      res.status(400).json({ error: "Invalid blog post data" });
    }
  });

  app.delete("/api/blog-posts/:id", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteBlogPost(id);
      res.json({ message: "تم حذف المقال بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete blog post" });
    }
  });

  // Teacher routes
  app.get("/api/teachers", async (req, res) => {
    try {
      const teachers = await storage.getTeachersWithSpecializations();
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

  app.delete("/api/teachers/:id", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteTeacher(id);
      res.json({ message: "تم حذف المعلم بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete teacher" });
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
      
      // Create notification for message receiver
      const sender = await storage.getUser(message.senderId);
      await storage.createNotification({
        userId: message.receiverId,
        type: 'message',
        title: '💬 رسالة جديدة',
        message: `رسالة جديدة من ${sender?.name}: "${message.subject}"`,
        relatedId: message.id
      });
      
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
      
      // Create notification for admins about new suggestion
      const allUsers = await storage.getAllUsers();
      const adminUsers = allUsers.filter(u => u.role === 'admin');
      if (adminUsers.length > 0) {
        await storage.createNotificationForUsers(
          adminUsers.map(u => u.id),
          'suggestion',
          '📥 اقتراح جديد',
          `تم تقديم اقتراح جديد: "${suggestion.title}"`,
          suggestion.id
        );
      }
      
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
      
      // Create notifications for all users about new group
      const allUsers = await storage.getAllUsers();
      const nonAdminUsers = allUsers.filter(u => u.role !== 'admin');
      if (nonAdminUsers.length > 0) {
        await storage.createNotificationForUsers(
          nonAdminUsers.map(u => u.id),
          'group_update',
          '👥 مجموعة جديدة',
          `تم إنشاء مجموعة جديدة: "${group.name}"`,
          group.id
        );
      }
      
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ error: "Invalid group data" });
    }
  });

  app.delete("/api/groups/:id", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteGroup(id);
      res.json({ message: "تم حذف المجموعة بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete group" });
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
      
      // Create notifications for all users about new formation
      const allUsers = await storage.getAllUsers();
      const nonAdminUsers = allUsers.filter(u => u.role !== 'admin');
      if (nonAdminUsers.length > 0) {
        await storage.createNotificationForUsers(
          nonAdminUsers.map(u => u.id),
          'formation_update',
          '🎓 تدريب جديد',
          `تم إنشاء تدريب جديد: "${formation.name}"`,
          formation.id
        );
      }
      
      res.status(201).json(formation);
    } catch (error) {
      res.status(400).json({ error: "Invalid formation data" });
    }
  });

  app.delete("/api/formations/:id", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteFormation(id);
      res.json({ message: "تم حذف التكوين بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete formation" });
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

  // Notification routes
  app.get("/api/notifications", async (req, res) => {
    try {
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const notifications = await storage.getNotifications(currentUser.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    try {
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const count = await storage.getUnreadNotificationCount(currentUser.id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    try {
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "تم تحديث الإشعار" });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", async (req, res) => {
    try {
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      await storage.markAllNotificationsAsRead(currentUser.id);
      res.json({ message: "تم تحديث جميع الإشعارات" });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Verification routes (Admin only) - Children and Students only

  app.get("/api/admin/unverified-children", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const unverifiedChildren = await storage.getUnverifiedChildren();
      res.json(unverifiedChildren);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unverified children" });
    }
  });

  app.get("/api/admin/unverified-students", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const unverifiedStudents = await storage.getUnverifiedStudents();
      res.json(unverifiedStudents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unverified students" });
    }
  });

  app.get("/api/admin/verified-children", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const verifiedChildren = await storage.getVerifiedChildren();
      res.json(verifiedChildren);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch verified children" });
    }
  });

  app.get("/api/admin/verified-students", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const verifiedStudents = await storage.getVerifiedStudents();
      res.json(verifiedStudents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch verified students" });
    }
  });

  // Verification endpoints removed for users - only children and students need verification

  app.post("/api/admin/verify-child/:id", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const childId = parseInt(req.params.id);
      const { notes } = req.body;
      
      const verifiedChild = await storage.verifyChild(childId, currentUser.id, notes);
      
      // Create notification for the parent
      await storage.createNotification({
        userId: verifiedChild.parentId,
        type: 'verification',
        title: '✅ تم التحقق من طفلك',
        message: `تم التحقق من بيانات ${verifiedChild.name} بنجاح من قبل الإدارة`,
        relatedId: verifiedChild.id
      });
      
      res.json({ message: "تم التحقق من الطفل بنجاح", child: verifiedChild });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify child" });
    }
  });

  app.post("/api/admin/verify-student/:id", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const studentId = parseInt(req.params.id);
      const { notes } = req.body;
      
      const verifiedStudent = await storage.verifyStudent(studentId, currentUser.id, notes);
      
      // Get user associated with student
      const user = await storage.getUser(verifiedStudent.userId);
      if (user) {
        // Create notification for the student
        await storage.createNotification({
          userId: user.id,
          type: 'verification',
          title: '✅ تم التحقق من حسابك الطلابي',
          message: 'تم التحقق من بياناتك التعليمية بنجاح من قبل الإدارة',
          relatedId: verifiedStudent.id
        });
      }
      
      res.json({ message: "تم التحقق من الطالب بنجاح", student: verifiedStudent });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify student" });
    }
  });

  // Undo verification endpoints
  app.post("/api/admin/undo-verify-child/:id", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const childId = parseInt(req.params.id);
      const child = await storage.undoVerifyChild(childId);
      
      res.json({ message: "تم إلغاء التحقق من الطفل", child });
    } catch (error) {
      res.status(500).json({ error: "Failed to undo child verification" });
    }
  });

  app.post("/api/admin/undo-verify-student/:id", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const studentId = parseInt(req.params.id);
      const student = await storage.undoVerifyStudent(studentId);
      
      res.json({ message: "تم إلغاء التحقق من الطالب", student });
    } catch (error) {
      res.status(500).json({ error: "Failed to undo student verification" });
    }
  });

  // Teaching module routes
  app.get("/api/teaching-modules", async (req, res) => {
    try {
      const modules = await storage.getTeachingModules();
      res.json(modules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teaching modules" });
    }
  });

  app.get("/api/teaching-modules/by-level/:level", async (req, res) => {
    try {
      const level = req.params.level;
      const modules = await storage.getTeachingModulesByLevel(level);
      res.json(modules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teaching modules by level" });
    }
  });

  app.post("/api/admin/teaching-modules", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const moduleData = req.body;
      const module = await storage.createTeachingModule(moduleData);
      res.json(module);
    } catch (error) {
      res.status(500).json({ error: "Failed to create teaching module" });
    }
  });

  app.delete("/api/admin/teaching-modules/:id", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const moduleId = parseInt(req.params.id);
      await storage.deleteTeachingModule(moduleId);
      res.json({ message: "تم حذف المادة التعليمية بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete teaching module" });
    }
  });

  // Teacher specialization routes
  app.get("/api/teacher-specializations/:teacherId", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const specializations = await storage.getTeacherSpecializations(teacherId);
      res.json(specializations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teacher specializations" });
    }
  });

  app.post("/api/teacher-specializations", async (req, res) => {
    try {
      if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) {
        return res.status(403).json({ error: "صلاحيات المعلم أو المدير مطلوبة" });
      }
      
      const specializationData = req.body;
      // Ensure the teacher can only add specializations for themselves unless they are admin
      if (currentUser.role === 'teacher' && specializationData.teacherId !== currentUser.id) {
        return res.status(403).json({ error: "لا يمكنك إضافة تخصصات لمعلم آخر" });
      }
      
      const specialization = await storage.createTeacherSpecialization(specializationData);
      res.json(specialization);
    } catch (error) {
      res.status(500).json({ error: "Failed to create teacher specialization" });
    }
  });

  app.delete("/api/teacher-specializations/:id", async (req, res) => {
    try {
      if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) {
        return res.status(403).json({ error: "صلاحيات المعلم أو المدير مطلوبة" });
      }
      
      const specializationId = parseInt(req.params.id);
      await storage.deleteTeacherSpecialization(specializationId);
      res.json({ message: "تم حذف التخصص بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete teacher specialization" });
    }
  });

  app.get("/api/teachers-by-module/:moduleId", async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      const teachers = await storage.getTeachersByModule(moduleId);
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teachers by module" });
    }
  });

  // Schedule table routes
  app.get("/api/schedule-tables", async (req, res) => {
    try {
      const tables = await storage.getScheduleTables();
      res.json(tables);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedule tables" });
    }
  });

  app.post("/api/schedule-tables", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const tableData = insertScheduleTableSchema.parse(req.body);
      const table = await storage.createScheduleTable(tableData);
      res.json(table);
    } catch (error) {
      res.status(500).json({ error: "Failed to create schedule table" });
    }
  });

  app.put("/api/schedule-tables/:id", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const tableId = parseInt(req.params.id);
      const updates = req.body;
      const table = await storage.updateScheduleTable(tableId, updates);
      res.json(table);
    } catch (error) {
      res.status(500).json({ error: "Failed to update schedule table" });
    }
  });

  app.delete("/api/schedule-tables/:id", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const tableId = parseInt(req.params.id);
      await storage.deleteScheduleTable(tableId);
      res.json({ message: "تم حذف الجدول بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete schedule table" });
    }
  });

  // Schedule cell routes
  app.get("/api/schedule-cells/:tableId", async (req, res) => {
    try {
      const tableId = parseInt(req.params.tableId);
      const cells = await storage.getScheduleCellsWithDetails(tableId);
      res.json(cells);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedule cells" });
    }
  });

  app.post("/api/schedule-cells", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const cellData = insertScheduleCellSchema.parse(req.body);
      const cell = await storage.createScheduleCell(cellData);
      res.json(cell);
    } catch (error) {
      res.status(500).json({ error: "Failed to create schedule cell" });
    }
  });

  app.put("/api/schedule-cells/:id", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const cellId = parseInt(req.params.id);
      const updates = req.body;
      const cell = await storage.updateScheduleCell(cellId, updates);
      res.json(cell);
    } catch (error) {
      res.status(500).json({ error: "Failed to update schedule cell" });
    }
  });

  app.delete("/api/schedule-cells/:id", async (req, res) => {
    try {
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const cellId = parseInt(req.params.id);
      await storage.deleteScheduleCell(cellId);
      res.json({ message: "تم حذف الخلية بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete schedule cell" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
