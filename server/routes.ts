import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAnnouncementSchema, insertBlogPostSchema, insertTeacherSchema, insertMessageSchema, insertSuggestionSchema, insertGroupSchema, insertFormationSchema, insertGroupRegistrationSchema, insertFormationRegistrationSchema, insertUserSchema, insertAdminSchema, insertTeacherUserSchema, insertStudentSchema, loginSchema, insertTeachingModuleSchema, insertTeacherSpecializationSchema, insertScheduleTableSchema, insertScheduleCellSchema, insertBlockedUserSchema, insertUserReportSchema, insertSuperAdminSchema, insertSchoolSchema, schoolSelectionSchema, insertChildSchema, insertStudentDataSchema, insertGroupAttendanceSchema, insertGroupTransactionSchema } from "@shared/schema";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import session from "express-session";

// Extend Express Request interface to include session with our custom properties
declare module 'express-session' {
  interface SessionData {
    schoolId?: number;
    schoolCode?: string;
    userId?: number;
    user?: any;
  }
}
import { SMSService } from "./sms-service";
import { EmailService } from "./email-service";

// Remove global currentUser variable to prevent session bleeding between users
// We'll use req.session.user instead for proper session management

// Secret keys for admin and teacher registration
const ADMIN_SECRET_KEY = "ADMIN_2024_SECRET_KEY";
const TEACHER_SECRET_KEY = "TEACHER_2024_SECRET_KEY";
const SUPER_ADMIN_SECRET_KEY = "SUPER_ADMIN_2024_MASTER_KEY";

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
    const prefix = req.body.type || 'content';
    cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
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
  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-for-development',
    resave: false,
    saveUninitialized: true, // Create session for anonymous users for school selection
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Get school context from session if available
      const schoolId = req.session?.schoolId;
      
      // Authenticate user with optional school context
      const user = await storage.authenticateUser(email, password, schoolId);
      
      if (user) {
        // Check if user is banned
        if (user.banned) {
          return res.status(403).json({ 
            error: "تم حظر حسابك من التطبيق. السبب: " + (user.banReason || "مخالفة شروط الاستخدام")
          });
        }
        
        // Store user session properly
        req.session.user = user;
        req.session.userId = user.id;
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
      
      // Get school from session or request FIRST
      const schoolId = req.session?.schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: "لم يتم تحديد المدرسة. يرجى اختيار مدرسة أولاً" });
      }
      
      // Validate basic user data first
      const validatedUserData = insertUserSchema.parse(userData);
      
      // Check if user already exists by email in this school context
      console.log('Checking for existing user with email:', validatedUserData.email, 'in school:', schoolId);
      const existingUser = await storage.getUserByEmail(validatedUserData.email, schoolId);
      console.log('Existing user found:', existingUser);
      if (existingUser) {
        if (existingUser.banned) {
          return res.status(403).json({ 
            error: "هذا البريد الإلكتروني محظور من التطبيق. السبب: " + (existingUser.banReason || "مخالفة شروط الاستخدام")
          });
        }
        return res.status(400).json({ error: "المستخدم موجود بالفعل" });
      }
      
      // Check if phone number already exists in this school context
      console.log('Checking for existing phone:', validatedUserData.phone, 'in school:', schoolId);
      const existingPhone = await storage.getUserByPhone(validatedUserData.phone, schoolId);
      console.log('Existing phone found:', existingPhone);
      if (existingPhone) {
        if (existingPhone.banned) {
          return res.status(403).json({ 
            error: "هذا الرقم محظور من التطبيق. السبب: " + (existingPhone.banReason || "مخالفة شروط الاستخدام")
          });
        }
        return res.status(400).json({ error: "رقم الهاتف مستخدم بالفعل" });
      }
      
      // Create user first with school context
      const userWithSchool = {
        ...validatedUserData,
        schoolId: schoolId
      };
      const user = await storage.createUser(userWithSchool);
      
      // Create student record if this is a student
      if (userData.role === 'student' && educationLevel && grade) {
        await storage.createStudent({
          userId: user.id,
          gender: studentData?.gender,
          educationLevel,
          grade,
          schoolId: schoolId
        });
      }
      
      // Create children if provided (for parents)
      if (childrenData && Array.isArray(childrenData) && childrenData.length > 0) {
        const childrenPromises = childrenData.map(child => 
          storage.createChild({
            parentId: user.id,
            name: child.name,
            gender: child.gender,
            educationLevel: child.educationLevel,
            grade: child.grade,
            schoolId: schoolId
          })
        );
        await Promise.all(childrenPromises);
      }
      
      // Automatically log in the user after successful registration
      req.session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId
      };
      
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
      
      // Get school from session or request
      const schoolId = req.session?.schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: "لم يتم تحديد المدرسة. يرجى اختيار مدرسة أولاً" });
      }
      
      const currentSchool = await storage.getSchoolById(schoolId);
      if (!currentSchool) {
        return res.status(400).json({ error: "المدرسة غير موجودة" });
      }
      
      if (validatedData.adminKey !== currentSchool.adminKey) {
        return res.status(403).json({ error: "مفتاح الإدارة غير صحيح. تأكد من صحة المفتاح السري للمدرسة" });
      }
      
      // Check if user already exists by email in this school context
      const existingUser = await storage.getUserByEmail(validatedData.email, schoolId);
      if (existingUser) {
        if (existingUser.banned) {
          return res.status(403).json({ 
            error: "هذا البريد الإلكتروني محظور من التطبيق. السبب: " + (existingUser.banReason || "مخالفة شروط الاستخدام")
          });
        }
        return res.status(400).json({ error: "المستخدم موجود بالفعل" });
      }
      
      // Check if phone number already exists in this school context
      const existingPhone = await storage.getUserByPhone(validatedData.phone, schoolId);
      if (existingPhone) {
        if (existingPhone.banned) {
          return res.status(403).json({ 
            error: "هذا الرقم محظور من التطبيق. السبب: " + (existingPhone.banReason || "مخالفة شروط الاستخدام")
          });
        }
        return res.status(400).json({ error: "رقم الهاتف مستخدم بالفعل" });
      }
      
      // Create user with admin role and school context
      const { adminKey: _, ...userDataWithoutKey } = validatedData;
      const userWithRole = { 
        ...userDataWithoutKey, 
        role: 'admin',
        schoolId: currentSchool.id
      };
      const user = await storage.createUser(userWithRole);
      
      // Automatically log in the user after successful registration
      req.session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId
      };
      
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
      
      // Get school from session or request
      const schoolId = req.session?.schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: "لم يتم تحديد المدرسة. يرجى اختيار مدرسة أولاً" });
      }
      
      const currentSchool = await storage.getSchoolById(schoolId);
      if (!currentSchool) {
        return res.status(400).json({ error: "المدرسة غير موجودة" });
      }
      
      if (validatedData.teacherKey !== currentSchool.teacherKey) {
        return res.status(403).json({ error: "مفتاح المعلم غير صحيح. تأكد من صحة المفتاح السري للمدرسة" });
      }
      
      // Check if user already exists by email in this school context
      const existingUser = await storage.getUserByEmail(validatedData.email, schoolId);
      if (existingUser) {
        if (existingUser.banned) {
          return res.status(403).json({ 
            error: "هذا البريد الإلكتروني محظور من التطبيق. السبب: " + (existingUser.banReason || "مخالفة شروط الاستخدام")
          });
        }
        return res.status(400).json({ error: "المستخدم موجود بالفعل" });
      }
      
      // Check if phone number already exists in this school context
      const existingPhone = await storage.getUserByPhone(validatedData.phone, schoolId);
      if (existingPhone) {
        if (existingPhone.banned) {
          return res.status(403).json({ 
            error: "هذا الرقم محظور من التطبيق. السبب: " + (existingPhone.banReason || "مخالفة شروط الاستخدام")
          });
        }
        return res.status(400).json({ error: "رقم الهاتف مستخدم بالفعل" });
      }
      
      // Create user with teacher role and school context
      const { teacherKey: _, ...userDataWithoutKey } = validatedData;
      const userWithRole = { 
        ...userDataWithoutKey, 
        role: 'teacher',
        schoolId: currentSchool.id
      };
      const user = await storage.createUser(userWithRole);
      
      // Create teacher profile in teachers table
      const teacherData = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        subject: "مادة عامة", // Default subject, can be updated later
        available: true,
        schoolId: currentSchool.id
      };
      await storage.createTeacher(teacherData);
      
      // Automatically log in the user after successful registration
      req.session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId
      };
      
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

  // Middleware to check authentication and school access
  const requireAuth = (req: any, res: any, next: any) => {
    const currentUser = req.session.user;
    if (!currentUser) {
      return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
    }
    
    // Attach user to request for easy access in routes
    req.currentUser = currentUser;
    
    // CRITICAL: Users can only access data from their registered school
    // Super admins can access all schools
    if (req.session.user.role !== 'super_admin') {
      if (!req.session.user.schoolId) {
        return res.status(403).json({ 
          error: "المستخدم غير مرتبط بأي مدرسة" 
        });
      }
      
      // For regular users, validate school access by checking the schoolId in the request
      // This prevents cross-school data access completely
      req.userSchoolId = req.session.user.schoolId;
    }
    
    next();
  };

  // Get current user info (for role verification)
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const currentUser = req.session.user;
      // Check if the current user is banned
      const latestUserData = await storage.getUser(req.session.user.id);
      if (latestUserData && latestUserData.banned) {
        req.session.user = null; // Clear the session
        return res.status(403).json({ 
          error: "تم حظر حسابك من التطبيق. السبب: " + (latestUserData.banReason || "مخالفة شروط الاستخدام")
        });
      }
      
      const { password: _, ...userWithoutPassword } = currentUser;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    req.session.user = null;
    req.session.userId = undefined;
    res.json({ message: "تم تسجيل الخروج بنجاح" });
  });

  // Phone verification routes
  app.post("/api/auth/send-verification-code", async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ error: "رقم الهاتف مطلوب" });
      }

      // Validate phone number format
      if (!SMSService.isValidPhoneNumber(phone)) {
        return res.status(400).json({ error: "رقم الهاتف غير صالح. يرجى إدخال رقم جزائري صحيح" });
      }

      // Check if user exists
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }

      // Generate verification code
      const verificationCode = SMSService.generateVerificationCode();
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Format phone number for SMS
      const formattedPhone = SMSService.formatPhoneNumber(phone);

      // Send SMS (this will log if Twilio is not configured)
      const smsResult = await SMSService.sendVerificationCode(formattedPhone, verificationCode);

      // Save verification code to database regardless of SMS success
      await storage.savePhoneVerificationCode(user.id, verificationCode, expiry);

      if (smsResult.success) {
        const responseData: any = { 
          message: "تم إرسال رمز التحقق إلى هاتفك",
          phoneNumber: phone.replace(/\d(?=\d{4})/g, '*') // Hide most digits for security
        };
        
        // Include development code if available (when SMS providers fail)
        if (smsResult.developmentCode) {
          responseData.developmentCode = smsResult.developmentCode;
          responseData.message = "تم إنشاء رمز التحقق (وضع التطوير)";
        }
        
        res.json(responseData);
      } else {
        // Handle different error types
        let errorMessage = "رمز التحقق تم إنشاؤه لكن فشل في إرسال الرسالة";
        
        if (smsResult.error === 'trial_account_restriction') {
          errorMessage = "حساب Twilio تجريبي - يرجى التحقق من رقم الهاتف في لوحة Twilio أولاً";
        } else if (smsResult.error === 'invalid_phone_number') {
          errorMessage = "رقم الهاتف غير صالح أو غير مدعوم";
        } else if (smsResult.error === 'SMS service not configured') {
          errorMessage = "خدمة الرسائل القصيرة غير مفعلة حالياً";
        }

        res.json({ 
          message: errorMessage,
          phoneNumber: phone.replace(/\d(?=\d{4})/g, '*'),
          developmentCode: verificationCode, // Only for development/testing
          smsError: smsResult.error
        });
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      res.status(500).json({ error: "خطأ في إرسال رمز التحقق" });
    }
  });

  // Update phone verification status (for Firebase verification)
  app.post("/api/auth/update-phone-verification", async (req, res) => {
    try {
      const { phone, verified } = req.body;
      
      if (!phone || typeof verified !== 'boolean') {
        return res.status(400).json({ error: "رقم الهاتف وحالة التحقق مطلوبان" });
      }

      // Get user by phone
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }

      // Update phone verification status
      if (verified) {
        await storage.markPhoneAsVerified(user.id);
      }

      res.json({ 
        message: "تم تحديث حالة التحقق بنجاح",
        verified: verified
      });
    } catch (error) {
      console.error('Error updating phone verification:', error);
      res.status(500).json({ error: "خطأ في تحديث حالة التحقق" });
    }
  });

  // Fallback SMS verification route (for when Firebase is not available)
  app.post("/api/auth/verify-phone", async (req, res) => {
    try {
      const { phone, code } = req.body;
      
      if (!phone || !code) {
        return res.status(400).json({ error: "رقم الهاتف ورمز التحقق مطلوبان" });
      }

      // Get user by phone
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }

      // Verify code
      const isValid = await storage.verifyPhoneCode(user.id, code);
      if (!isValid) {
        return res.status(400).json({ error: "رمز التحقق غير صحيح أو منتهي الصلاحية" });
      }

      // Mark phone as verified
      await storage.markPhoneAsVerified(user.id);

      res.json({ 
        message: "تم التحقق من رقم الهاتف بنجاح",
        verified: true
      });
    } catch (error) {
      console.error('Error verifying phone:', error);
      res.status(500).json({ error: "خطأ في التحقق من الهاتف" });
    }
  });

  // Email verification routes
  app.post("/api/auth/send-email-verification", async (req, res) => {
    try {
      const currentUser = req.session.user;
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
      }

      // Validate email format
      if (!EmailService.isValidEmail(email)) {
        return res.status(400).json({ error: "البريد الإلكتروني غير صالح" });
      }

      // Generate verification code
      const verificationCode = EmailService.generateVerificationCode();
      const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

      // Send email verification code
      const emailResult = await EmailService.sendVerificationCode(email, verificationCode);

      // Save verification code to database regardless of email success
      await storage.saveEmailVerificationCode(req.session.user.id, verificationCode, expiry);

      if (emailResult.success) {
        const responseData: any = { 
          message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
          email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Hide middle part for security
        };
        
        // Include development code if available
        if (emailResult.developmentCode) {
          responseData.developmentCode = emailResult.developmentCode;
          responseData.message = "تم إنشاء رمز التحقق (وضع التطوير)";
        }
        
        res.json(responseData);
      } else {
        res.status(500).json({ error: emailResult.error || "حدث خطأ في إرسال الرمز" });
      }
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: "حدث خطأ في الخادم" });
    }
  });

  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const currentUser = req.session.user;
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: "رمز التحقق مطلوب" });
      }

      // Verify the code
      const isValid = await storage.verifyEmailCode(req.session.user.id, code);

      if (isValid) {
        // Mark email as verified
        await storage.markEmailAsVerified(req.session.user.id);
        
        // Update current user session
        req.session.user.emailVerified = true;
        
        res.json({ 
          message: "تم التحقق من البريد الإلكتروني بنجاح",
          verified: true
        });
      } else {
        res.status(400).json({ error: "رمز التحقق غير صحيح أو منتهي الصلاحية" });
      }
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: "حدث خطأ في الخادم" });
    }
  });

  // Serve static files
  app.use('/uploads', express.static(uploadDir));

  // Profile picture routes
  app.post("/api/profile/picture", async (req, res) => {
    try {
      const currentUser = req.session.user;
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const { profilePictureUrl } = req.body;
      
      if (!profilePictureUrl) {
        return res.status(400).json({ error: "رابط الصورة مطلوب" });
      }

      const updatedUser = await storage.updateUserProfilePicture(req.session.user.id, profilePictureUrl);
      
      // Update current user session
      req.session.user = updatedUser;
      
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
      const currentUser = req.session.user;
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "لم يتم رفع أي ملف" });
      }

      // Create URL for the uploaded file
      const fileUrl = `/uploads/${req.file.filename}`;
      
      const updatedUser = await storage.updateUserProfilePicture(req.session.user.id, fileUrl);
      
      // Update current user session
      req.session.user = updatedUser;
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword, fileUrl });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      res.status(500).json({ error: "فشل في رفع الصورة الشخصية" });
    }
  });

  // Content upload endpoint for blogs, groups, formations, and school logos
  app.post("/api/upload-content", upload.fields([
    { name: 'contentImage', maxCount: 1 },
    { name: 'logo', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const currentUser = req.session.user;
      if (!currentUser || (req.session.user.role !== 'admin' && req.session.user.role !== 'super_admin')) {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const file = files?.contentImage?.[0] || files?.logo?.[0];

      if (!file) {
        return res.status(400).json({ error: "لم يتم رفع أي ملف" });
      }

      // Create URL for the uploaded file
      const fileUrl = `/uploads/${file.filename}`;
      
      res.json({ 
        message: "تم رفع الصورة بنجاح", 
        url: fileUrl
      });
    } catch (error) {
      console.error('Error uploading content image:', error);
      res.status(500).json({ error: "فشل في رفع الصورة" });
    }
  });



  // User management routes (Admin only)
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      if (req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      // CRITICAL: Prevent access if admin doesn't belong to a school
      if (!req.session.user.schoolId) {
        return res.status(403).json({ error: "المدير غير مرتبط بمدرسة محددة" });
      }
      
      const { search, educationLevel, subject, assignedTeacher, role } = req.query;
      
      // Build filter object
      const filters = {
        search: search && typeof search === 'string' ? search : undefined,
        educationLevel: educationLevel && typeof educationLevel === 'string' ? educationLevel : undefined,
        subject: subject && typeof subject === 'string' ? parseInt(subject) : undefined,
        assignedTeacher: assignedTeacher && typeof assignedTeacher === 'string' ? parseInt(assignedTeacher) : undefined,
        role: role && typeof role === 'string' ? role : undefined,
      };
      
      // Use new filtered search method with schoolId filtering
      const users = await storage.searchUsersWithFilters({
        ...filters,
        schoolId: req.session.user.schoolId
      });
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      if (req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }
      
      // CRITICAL: Prevent access if admin doesn't belong to a school
      if (!req.session.user.schoolId) {
        return res.status(403).json({ error: "المدير غير مرتبط بمدرسة محددة" });
      }
      
      // CRITICAL: Ensure user belongs to admin's school (multi-tenancy)
      if (user.schoolId !== req.session.user.schoolId) {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذا المستخدم" });
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
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const userId = parseInt(req.params.id);
      // CRITICAL: Verify user belongs to admin's school before accessing messages
      const user = await storage.getUser(userId);
      if (!user || user.schoolId !== req.session.user.schoolId) {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى رسائل هذا المستخدم" });
      }
      
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
      if (!req.session.user || req.session.user.role !== 'admin') {
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
        [req.session.user.id], // sender
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
  app.get("/api/announcements", requireAuth, async (req, res) => {
    try {
      
      const announcements = await storage.getAnnouncementsBySchool(req.session.user.schoolId);
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.post("/api/announcements", async (req, res) => {
    try {
      const currentUser = req.session.user;
      if (!currentUser || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const validatedData = insertAnnouncementSchema.parse(req.body);
      
      // Add schoolId for multi-tenancy
      const announcementData = {
        ...validatedData,
        schoolId: req.session.user.schoolId,
        authorId: req.session.user.id
      };
      
      const announcement = await storage.createAnnouncement(announcementData);
      
      // Create notifications for all users about new announcement
      const allUsers = await storage.getAllUsers(req.session.user.schoolId);
      const nonAdminUsers = allUsers.filter(u => u.role !== 'admin');
      if (nonAdminUsers.length > 0) {
        await storage.createNotificationForUsers(
          nonAdminUsers.map(u => u.id),
          'announcement',
          '📅 إعلان جديد',
          `إعلان جديد: "${announcement.title}"`,
          announcement.id,
          req.session.user.schoolId
        );
      }
      
      res.status(201).json(announcement);
    } catch (error) {
      console.error('Announcement creation error:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Invalid announcement data" });
      }
    }
  });

  // Blog post routes
  app.get("/api/blog-posts", async (req, res) => {
    try {
      const currentUser = req.session.user;
      if (!currentUser) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const blogPosts = await storage.getBlogPostsBySchool(req.session.user.schoolId);
      res.json(blogPosts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });

  app.post("/api/blog-posts", async (req, res) => {
    try {
      const currentUser = req.session.user;
      if (!currentUser || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const validatedData = insertBlogPostSchema.parse(req.body);
      const blogPostData = {
        ...validatedData,
        schoolId: req.session.user.schoolId,
        authorId: req.session.user.id
      };
      const blogPost = await storage.createBlogPost(blogPostData);
      
      // Create notifications for all users about new blog post
      const allUsers = await storage.getAllUsers(req.session.user.schoolId);
      const nonAdminUsers = allUsers.filter(u => u.role !== 'admin');
      if (nonAdminUsers.length > 0) {
        await storage.createNotificationForUsers(
          nonAdminUsers.map(u => u.id),
          'blog',
          '📚 مقال جديد',
          `تم نشر مقال جديد: "${blogPost.title}"`,
          blogPost.id,
          req.session.user.schoolId
        );
      }
      
      res.status(201).json(blogPost);
    } catch (error) {
      res.status(400).json({ error: "Invalid blog post data" });
    }
  });

  app.delete("/api/blog-posts/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteBlogPost(id);
      res.json({ message: "تم حذف المقال بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete blog post" });
    }
  });

  // Public school directory endpoint
  app.get("/api/schools/directory", async (req, res) => {
    try {
      const schools = await storage.getAllActiveSchools();
      res.json({ schools });
    } catch (error) {
      console.error('Error fetching school directory:', error);
      res.status(500).json({ error: "فشل في جلب قائمة المدارس" });
    }
  });

  // Teacher routes
  app.get("/api/teachers", requireAuth, async (req, res) => {
    try {
      
      const teachers = await storage.getTeachersBySchool(req.session.user.schoolId);
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teachers" });
    }
  });

  app.get("/api/teachers-with-specializations", requireAuth, async (req, res) => {
    try {
      const teachers = await storage.getTeachersWithSpecializations(req.session.user.schoolId);
      res.json(teachers);
    } catch (error) {
      console.error('Error fetching teachers with specializations:', error);
      res.status(500).json({ error: "Failed to fetch teachers with specializations" });
    }
  });

  app.post("/api/teachers", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const validatedData = insertTeacherSchema.parse(req.body);
      const teacherData = {
        ...validatedData,
        schoolId: req.session.user.schoolId
      };
      const teacher = await storage.createTeacher(teacherData);
      res.status(201).json(teacher);
    } catch (error) {
      res.status(400).json({ error: "Invalid teacher data" });
    }
  });

  app.delete("/api/teachers/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
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

  // Enhanced messages with user info
  app.get("/api/messages/with-user-info", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const messages = await storage.getMessagesWithUserInfo(req.session.user.id);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages with user info:', error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Get conversation history between current user and another user
  app.get("/api/messages/conversation/:userId", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const otherUserId = parseInt(req.params.userId);
      const conversation = await storage.getConversationBetweenUsers(req.session.user.id, otherUserId);
      res.json(conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Mark message as read
  app.post("/api/messages/:id/mark-read", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const messageId = parseInt(req.params.id);
      await storage.markMessageAsRead(messageId);
      res.json({ message: "تم تحديد الرسالة كمقروءة" });
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  // Block user
  app.post("/api/block-user", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const { blockedId, reason } = req.body;
      
      if (!blockedId) {
        return res.status(400).json({ error: "معرف المستخدم المراد حظره مطلوب" });
      }
      
      if (blockedId === req.session.user.id) {
        return res.status(400).json({ error: "لا يمكنك حظر نفسك" });
      }
      
      const blockedUser = await storage.blockUser(req.session.user.id, blockedId, reason);
      res.json({ message: "تم حظر المستخدم بنجاح", blockedUser });
    } catch (error) {
      console.error('Error blocking user:', error);
      res.status(500).json({ error: "Failed to block user" });
    }
  });

  // Unblock user
  app.post("/api/unblock-user", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const { blockedId } = req.body;
      
      if (!blockedId) {
        return res.status(400).json({ error: "معرف المستخدم المراد إلغاء حظره مطلوب" });
      }
      
      await storage.unblockUser(req.session.user.id, blockedId);
      res.json({ message: "تم إلغاء حظر المستخدم بنجاح" });
    } catch (error) {
      console.error('Error unblocking user:', error);
      res.status(500).json({ error: "Failed to unblock user" });
    }
  });

  // Get blocked users
  app.get("/api/blocked-users", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const blockedUsers = await storage.getBlockedUsers(req.session.user.id);
      res.json(blockedUsers);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      res.status(500).json({ error: "Failed to fetch blocked users" });
    }
  });

  // Report user
  app.post("/api/report-user", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const { reportedUserId, messageId, reason, description } = req.body;
      
      if (!reportedUserId || !reason) {
        return res.status(400).json({ error: "معرف المستخدم المراد الإبلاغ عنه والسبب مطلوبان" });
      }
      
      if (reportedUserId === req.session.user.id) {
        return res.status(400).json({ error: "لا يمكنك الإبلاغ عن نفسك" });
      }
      
      const reportData = {
        reporterId: req.session.user.id,
        reportedUserId,
        messageId,
        reason,
        description
      };
      
      const report = await storage.reportUser(reportData);
      res.json({ message: "تم الإبلاغ بنجاح", report });
    } catch (error) {
      console.error('Error reporting user:', error);
      res.status(500).json({ error: "Failed to report user" });
    }
  });

  // Admin routes for reports and user management
  app.get("/api/admin/reports", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.patch("/api/admin/reports/:id/status", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const reportId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: "حالة الإبلاغ مطلوبة" });
      }
      
      const report = await storage.updateReportStatus(reportId, status);
      res.json({ message: "تم تحديث حالة الإبلاغ", report });
    } catch (error) {
      console.error('Error updating report status:', error);
      res.status(500).json({ error: "Failed to update report status" });
    }
  });

  app.post("/api/admin/ban-user", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const { userId, reason } = req.body;
      
      if (!userId || !reason) {
        return res.status(400).json({ error: "معرف المستخدم وسبب الحظر مطلوبان" });
      }
      
      if (userId === req.session.user.id) {
        return res.status(400).json({ error: "لا يمكنك حظر نفسك" });
      }
      
      const bannedUser = await storage.banUser(userId, reason, req.session.user.id);
      res.json({ message: "تم حظر المستخدم بنجاح", user: bannedUser });
    } catch (error) {
      console.error('Error banning user:', error);
      res.status(500).json({ error: "Failed to ban user" });
    }
  });

  app.post("/api/admin/unban-user", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "معرف المستخدم مطلوب" });
      }
      
      const unbannedUser = await storage.unbanUser(userId);
      res.json({ message: "تم إلغاء حظر المستخدم بنجاح", user: unbannedUser });
    } catch (error) {
      console.error('Error unbanning user:', error);
      res.status(500).json({ error: "Failed to unban user" });
    }
  });

  app.get("/api/admin/banned-users", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const bannedUsers = await storage.getBannedUsers();
      res.json(bannedUsers);
    } catch (error) {
      console.error('Error fetching banned users:', error);
      res.status(500).json({ error: "Failed to fetch banned users" });
    }
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      console.log('Received message request:', req.body);
      const validatedData = insertMessageSchema.parse(req.body);
      console.log('Validated data:', validatedData);
      
      // Check if the sender is blocked by the receiver
      const isBlocked = await storage.isUserBlocked(validatedData.receiverId!, validatedData.senderId!);
      if (isBlocked) {
        return res.status(403).json({ error: "لا يمكنك إرسال رسائل لهذا المستخدم. تم حظرك من قبل المستخدم" });
      }
      
      // Add school context to message
      const messageData = {
        ...validatedData,
        schoolId: req.session.user.schoolId
      };
      
      const message = await storage.createMessage(messageData);
      console.log('Created message:', message);
      
      // Create notification for message receiver
      const sender = await storage.getUser(message.senderId!);
      await storage.createNotification({
        schoolId: req.session.user.schoolId!,
        userId: message.receiverId!,
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
  app.get("/api/suggestions", requireAuth, async (req, res) => {
    try {
      
      // CRITICAL: Prevent access if user doesn't belong to a school
      if (!req.session.user.schoolId) {
        return res.status(403).json({ error: "المستخدم غير مرتبط بمدرسة محددة" });
      }
      
      const suggestions = await storage.getSuggestions(req.session.user.schoolId);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  app.post("/api/suggestions", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      console.log('Suggestion request body:', req.body);
      const validatedData = insertSuggestionSchema.parse(req.body);
      console.log('Validated data:', validatedData);
      const suggestionData = {
        ...validatedData,
        schoolId: req.session.user.schoolId
      };
      console.log('Suggestion data with school:', suggestionData);
      const suggestion = await storage.createSuggestion(suggestionData);
      
      // Create notification for admins about new suggestion
      const allUsers = await storage.getAllUsers(req.session.user.schoolId);
      const adminUsers = allUsers.filter(u => u.role === 'admin');
      if (adminUsers.length > 0) {
        await storage.createNotificationForUsers(
          adminUsers.map(u => u.id),
          'suggestion',
          '📥 اقتراح جديد',
          `تم تقديم اقتراح جديد: "${suggestion.title}"`,
          suggestion.id,
          req.session.user.schoolId
        );
      }
      
      res.status(201).json(suggestion);
    } catch (error) {
      console.error('Suggestion creation error:', error);
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.errors);
        res.status(400).json({ error: "بيانات الاقتراح غير صحيحة: " + error.errors.map(e => e.message).join(', ') });
      } else {
        res.status(400).json({ error: "فشل في إرسال الاقتراح. يرجى المحاولة مرة أخرى" });
      }
    }
  });

  // Group routes
  app.get("/api/groups", requireAuth, async (req, res) => {
    try {
      
      const groups = await storage.getGroupsBySchool(req.session.user.schoolId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  app.post("/api/groups", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const validatedData = insertGroupSchema.parse(req.body);
      const groupData = {
        ...validatedData,
        schoolId: req.session.user.schoolId
      };
      const group = await storage.createGroup(groupData);
      
      // Create notifications for all users about new group
      const allUsers = await storage.getAllUsers(req.session.user.schoolId);
      const nonAdminUsers = allUsers.filter(u => u.role !== 'admin');
      if (nonAdminUsers.length > 0) {
        await storage.createNotificationForUsers(
          nonAdminUsers.map(u => u.id),
          'group_update',
          '👥 مجموعة جديدة',
          `تم إنشاء مجموعة جديدة: "${group.name}"`,
          group.id,
          req.session.user.schoolId
        );
      }
      
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ error: "Invalid group data" });
    }
  });

  app.delete("/api/groups/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteGroup(id);
      res.json({ message: "تم حذف المجموعة بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete group" });
    }
  });

  // Schedule Group Linking routes
  app.get("/api/groups/compatible", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const { subjectId, teacherId, educationLevel } = req.query;
      
      console.log('Compatible groups request params:', {
        subjectId,
        teacherId,
        educationLevel,
        schoolId: req.session.user.schoolId
      });
      
      if (!subjectId || !teacherId || !educationLevel) {
        return res.status(400).json({ error: "معاملات البحث مطلوبة" });
      }

      const compatibleGroups = await storage.getCompatibleGroups(
        parseInt(subjectId as string),
        parseInt(teacherId as string),
        educationLevel as string,
        req.session.user.schoolId
      );
      
      console.log('Found compatible groups:', compatibleGroups);
      res.json(compatibleGroups);
    } catch (error) {
      console.error('Error fetching compatible groups:', error);
      res.status(500).json({ error: "فشل في جلب المجموعات المتوافقة" });
    }
  });

  app.get("/api/schedule-cells/linked-groups/:tableId", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const tableId = parseInt(req.params.tableId);
      const linkedGroups = await storage.getScheduleLinkedGroups(tableId, req.session.user.schoolId);
      
      res.json(linkedGroups);
    } catch (error) {
      console.error('Error fetching linked groups:', error);
      res.status(500).json({ error: "فشل في جلب المجموعات المربوطة" });
    }
  });

  app.post("/api/schedule-cells/:cellId/link-groups", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const cellId = parseInt(req.params.cellId);
      const { groupIds } = req.body;

      if (!Array.isArray(groupIds)) {
        return res.status(400).json({ error: "قائمة المجموعات مطلوبة" });
      }

      await storage.linkGroupsToScheduleCell(cellId, groupIds, req.session.user.schoolId, req.session.user.id);
      
      res.json({ message: "تم ربط المجموعات بالحصة بنجاح" });
    } catch (error) {
      console.error('Error linking groups to schedule cell:', error);
      res.status(500).json({ error: "فشل في ربط المجموعات بالحصة" });
    }
  });

  // Admin group management routes
  app.get("/api/admin/groups", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      // CRITICAL: Prevent access if admin doesn't belong to a school
      if (!req.session.user.schoolId) {
        return res.status(403).json({ error: "المدير غير مرتبط بمدرسة محددة" });
      }
      
      const adminGroups = await storage.getAdminGroups(req.session.user.schoolId);
      res.json(adminGroups);
    } catch (error) {
      console.error("Error in /api/admin/groups:", error);
      res.status(500).json({ error: "Failed to fetch admin groups" });
    }
  });

  app.get("/api/admin/groups/students/:educationLevel/:subjectId", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const educationLevel = req.params.educationLevel;
      const subjectId = parseInt(req.params.subjectId);
      
      const availableStudents = await storage.getAvailableStudentsByLevelAndSubject(educationLevel, subjectId, req.session.user.schoolId);
      res.json(availableStudents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch available students" });
    }
  });

  app.put("/api/admin/groups/:id/assignments", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const groupId = req.params.id === 'null' ? null : parseInt(req.params.id);
      const { studentIds, teacherId, groupData } = req.body;
      
      if (!Array.isArray(studentIds) || typeof teacherId !== 'number') {
        return res.status(400).json({ error: "Invalid assignment data" });
      }
      
      const updatedGroup = await storage.updateGroupAssignments(groupId, studentIds, teacherId, groupData, req.session.user.schoolId, req.session.user.id);
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error updating group assignments:", error);
      res.status(500).json({ error: "Failed to update group assignments" });
    }
  });

  // Delete group route
  app.delete("/api/admin/groups/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const groupId = parseInt(req.params.id);
      
      if (isNaN(groupId)) {
        return res.status(400).json({ error: "معرف المجموعة غير صحيح" });
      }
      
      const deleted = await storage.deleteGroup(groupId, req.session.user.schoolId);
      
      if (deleted) {
        res.json({ success: true, message: "تم حذف المجموعة بنجاح" });
      } else {
        res.status(404).json({ error: "المجموعة غير موجودة" });
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ error: "فشل في حذف المجموعة" });
    }
  });

  // Custom subjects route
  app.post("/api/admin/custom-subjects", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه الصفحة" });
      }
      
      const { name, nameAr, educationLevel, grade } = req.body;
      
      if (!name || !nameAr || !educationLevel) {
        return res.status(400).json({ error: "اسم المادة والمستوى التعليمي مطلوبان" });
      }
      
      // Check if custom subject already exists for the specific education level
      if (educationLevel !== 'جميع المستويات') {
        const existingSubject = await storage.getTeachingModuleByName(nameAr, educationLevel);
        if (existingSubject) {
          return res.status(400).json({ error: "المادة موجودة بالفعل لهذا المستوى" });
        }
      } else {
        // For "جميع المستويات", check if it exists across all levels
        const existingSubject = await storage.getTeachingModuleByNameAllLevels(nameAr);
        if (existingSubject) {
          return res.status(400).json({ error: "المادة موجودة بالفعل" });
        }
      }
      
      let createdSubjects = [];
      
      if (educationLevel === 'جميع المستويات') {
        // Create the subject for all education levels
        const levels = ['الابتدائي', 'المتوسط', 'الثانوي'];
        for (const level of levels) {
          const customSubject = await storage.createCustomSubject({
            name,
            nameAr,
            educationLevel: level,
            grade: grade || undefined,
            description: `مادة مخصصة تم إنشاؤها بواسطة الإدارة - متاحة لجميع المستويات`
          });
          createdSubjects.push(customSubject);
        }
      } else {
        // Create subject for specific education level
        const customSubject = await storage.createCustomSubject({
          name,
          nameAr,
          educationLevel,
          grade: grade || undefined,
          description: `مادة مخصصة تم إنشاؤها بواسطة الإدارة`
        });
        createdSubjects.push(customSubject);
      }
      
      res.status(201).json({ 
        subjects: createdSubjects, 
        message: educationLevel === 'جميع المستويات' 
          ? `تم إنشاء المادة "${nameAr}" لجميع المستويات التعليمية`
          : `تم إنشاء المادة "${nameAr}" للمستوى "${educationLevel}"`
      });
    } catch (error) {
      console.error("Error creating custom subject:", error);
      res.status(500).json({ error: "Failed to create custom subject" });
    }
  });

  // Formation routes
  app.get("/api/formations", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const formations = await storage.getFormationsBySchool(req.session.user.schoolId);
      res.json(formations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch formations" });
    }
  });

  app.post("/api/formations", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const validatedData = insertFormationSchema.parse(req.body);
      const formationData = {
        ...validatedData,
        schoolId: req.session.user.schoolId
      };
      const formation = await storage.createFormation(formationData);
      
      // Create notifications for all users about new formation
      const allUsers = await storage.getAllUsers(req.session.user.schoolId);
      const nonAdminUsers = allUsers.filter(u => u.role !== 'admin');
      if (nonAdminUsers.length > 0) {
        await storage.createNotificationForUsers(
          nonAdminUsers.map(u => u.id),
          'formation_update',
          '🎓 تدريب جديد',
          `تم إنشاء تدريب جديد: "${formation.title}"`,
          formation.id,
          req.session.user.schoolId
        );
      }
      
      res.status(201).json(formation);
    } catch (error) {
      res.status(400).json({ error: "Invalid formation data" });
    }
  });

  app.delete("/api/formations/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
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
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const children = await storage.getChildrenByParentId(req.session.user.id);
      res.json(children);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch children" });
    }
  });

  app.post("/api/children", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const childData = {
        parentId: req.session.user.id,
        name: req.body.name,
        gender: req.body.gender,
        educationLevel: req.body.educationLevel,
        grade: req.body.grade,
        schoolId: req.session.user.schoolId
      };
      
      const child = await storage.createChild(childData);
      res.status(201).json(child);
    } catch (error) {
      res.status(400).json({ error: "Invalid child data" });
    }
  });

  app.delete("/api/children/:id", async (req, res) => {
    try {
      if (!req.session?.user) {
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
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const notifications = await storage.getNotifications(req.session.user.id, req.session.user.schoolId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const count = await storage.getUnreadNotificationCount(req.session.user.id, req.session.user.schoolId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    try {
      if (!req.session?.user) {
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
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      await storage.markAllNotificationsAsRead(req.session.user.id);
      res.json({ message: "تم تحديث جميع الإشعارات" });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Verification routes (Admin only) - Children and Students only

  app.get("/api/admin/unverified-children", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const unverifiedChildren = await storage.getUnverifiedChildren(req.session.user.schoolId);
      res.json(unverifiedChildren);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unverified children" });
    }
  });

  app.get("/api/admin/unverified-students", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const unverifiedStudents = await storage.getUnverifiedStudents(req.session.user.schoolId);
      res.json(unverifiedStudents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unverified students" });
    }
  });

  app.get("/api/admin/verified-children", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const verifiedChildren = await storage.getVerifiedChildren(req.session.user.schoolId);
      res.json(verifiedChildren);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch verified children" });
    }
  });

  app.get("/api/admin/verified-students", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const verifiedStudents = await storage.getVerifiedStudents(req.session.user.schoolId);
      res.json(verifiedStudents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch verified students" });
    }
  });

  // Verification endpoints removed for users - only children and students need verification

  app.post("/api/admin/verify-child/:id", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const childId = parseInt(req.params.id);
      const { notes, educationLevel, selectedSubjects } = req.body;
      
      const verifiedChild = await storage.verifyChild(childId, req.session.user.id, notes, educationLevel, selectedSubjects);
      
      // Create notification for the parent
      await storage.createNotification({
        schoolId: req.session.user.schoolId!,
        userId: verifiedChild.parentId!,
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
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const studentId = parseInt(req.params.id);
      const { notes, educationLevel, selectedSubjects } = req.body;
      
      console.log('Verifying student:', studentId, 'with data:', { notes, educationLevel, selectedSubjects });
      
      const verifiedStudent = await storage.verifyStudent(studentId, req.session.user.id, notes, educationLevel, selectedSubjects);
      console.log('Student verified:', verifiedStudent);
      
      // Get user associated with student
      const user = await storage.getUser(verifiedStudent.userId!);
      if (user) {
        console.log('Creating notification for user:', user.id);
        // Create notification for the student
        await storage.createNotification({
          schoolId: req.session.user.schoolId!,
          userId: user.id,
          type: 'verification',
          title: '✅ تم التحقق من حسابك الطلابي',
          message: 'تم التحقق من بياناتك التعليمية بنجاح من قبل الإدارة',
          relatedId: verifiedStudent.id
        });
      }
      
      res.json({ message: "تم التحقق من الطالب بنجاح", student: verifiedStudent });
    } catch (error) {
      console.error('Error verifying student:', error);
      res.status(500).json({ error: "Failed to verify student" });
    }
  });

  // Undo verification endpoints
  app.post("/api/admin/undo-verify-child/:id", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
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
      if (!req.session?.user || req.session.user.role !== 'admin') {
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
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const modules = await storage.getTeachingModulesBySchool(req.session.user.schoolId);
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
      if (!req.session.user || req.session.user.role !== 'admin') {
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
      if (!req.session.user || req.session.user.role !== 'admin') {
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
      if (!req.session.user || (req.session.user.role !== 'teacher' && req.session.user.role !== 'admin')) {
        return res.status(403).json({ error: "صلاحيات المعلم أو المدير مطلوبة" });
      }
      
      const specializationData = req.body;
      // Ensure the teacher can only add specializations for themselves unless they are admin
      if (req.session.user.role === 'teacher' && specializationData.teacherId !== req.session.user.id) {
        return res.status(403).json({ error: "لا يمكنك إضافة تخصصات لمعلم آخر" });
      }
      
      // Add schoolId to specialization data
      const specializationWithSchool = {
        ...specializationData,
        schoolId: req.session.user.schoolId
      };
      
      const specialization = await storage.createTeacherSpecialization(specializationWithSchool);
      res.json(specialization);
    } catch (error) {
      console.error('Teacher specialization creation error:', error);
      res.status(500).json({ error: "Failed to create teacher specialization" });
    }
  });

  app.delete("/api/teacher-specializations/:id", async (req, res) => {
    try {
      if (!req.session.user || (req.session.user.role !== 'teacher' && req.session.user.role !== 'admin')) {
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
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const teachers = await storage.getTeachers();
      // Filter teachers by school and then by module specialization
      const schoolTeachers = teachers.filter(t => t.schoolId === req.session.user.schoolId);
      const moduleTeachers = await storage.getTeachersByModule(moduleId);
      const filteredTeachers = moduleTeachers.filter(t => 
        schoolTeachers.some(st => st.id === t.id)
      );
      res.json(filteredTeachers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teachers by module" });
    }
  });

  // Schedule table routes
  app.get("/api/schedule-tables", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }
      
      const tables = await storage.getScheduleTablesBySchool(req.session.user.schoolId);
      res.json(tables);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedule tables" });
    }
  });

  app.post("/api/schedule-tables", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      console.log('Creating schedule table for user:', req.session.user.email, 'role:', req.session.user.role);
      console.log('Request body:', req.body);
      
      const tableData = insertScheduleTableSchema.parse(req.body);
      console.log('Validated table data:', tableData);
      
      // Add schoolId for multi-tenancy
      const tableDataWithSchool = {
        ...tableData,
        schoolId: req.session.user.schoolId
      };
      console.log('Table data with schoolId:', tableDataWithSchool);
      
      const table = await storage.createScheduleTable(tableDataWithSchool);
      console.log('Schedule table created successfully:', table);
      res.json(table);
    } catch (error) {
      console.error('Error creating schedule table:', error);
      res.status(500).json({ error: "Failed to create schedule table" });
    }
  });

  app.put("/api/schedule-tables/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
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
      if (!req.session.user || req.session.user.role !== 'admin') {
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
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const cellDataWithSchool = {
        ...req.body,
        schoolId: req.session.user.schoolId
      };
      const cellData = insertScheduleCellSchema.parse(cellDataWithSchool);
      const cell = await storage.createScheduleCell(cellData);
      res.json(cell);
    } catch (error) {
      res.status(500).json({ error: "Failed to create schedule cell" });
    }
  });

  app.put("/api/schedule-cells/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
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
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const cellId = parseInt(req.params.id);
      await storage.deleteScheduleCell(cellId);
      res.json({ message: "تم حذف الخلية بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete schedule cell" });
    }
  });

  // User details route for admin verification
  app.get("/api/users/:id", async (req, res) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }
      
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }
      
      // Return user without sensitive information
      const { password: _, firebaseUid: __, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).json({ error: "Failed to fetch user details" });
    }
  });

  const httpServer = createServer(app);

  // Super Admin Authentication Routes (Hidden Access)
  app.post("/api/auth/super-admin-login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.authenticateUser(email, password);
      
      if (!user || user.role !== "super_admin") {
        return res.status(401).json({ error: "بيانات اعتماد المسؤول العام غير صحيحة" });
      }

      // Check if user is banned
      if (user.banned) {
        return res.status(403).json({ 
          error: `تم حظر حسابك من النظام. السبب: ${user.banReason || 'لم يتم تحديد السبب'}` 
        });
      }

      req.session.user = user;
      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Super admin login error:', error);
      res.status(400).json({ error: "بيانات غير صحيحة" });
    }
  });

  // Super Admin Password Reset Route
  app.post("/api/auth/super-admin-reset-password", async (req, res) => {
    try {
      const { email, newPassword, superAdminKey } = req.body;
      
      // Verify super admin secret key
      if (superAdminKey !== SUPER_ADMIN_SECRET_KEY) {
        return res.status(400).json({ error: "مفتاح المسؤول العام غير صحيح" });
      }

      // Find existing super admin
      const existingUser = await storage.getUserByEmail(email);
      if (!existingUser || existingUser.role !== "super_admin") {
        return res.status(400).json({ error: "حساب المسؤول العام غير موجود" });
      }

      // Hash new password and update
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, existingUser.id));

      res.json({ message: "تم تحديث كلمة المرور بنجاح" });
    } catch (error) {
      console.error('Super admin password reset error:', error);
      res.status(400).json({ error: "فشل في تحديث كلمة المرور" });
    }
  });

  app.post("/api/auth/super-admin-register", async (req, res) => {
    try {
      const data = insertSuperAdminSchema.parse(req.body);
      
      // Verify super admin secret key
      if (data.superAdminKey !== SUPER_ADMIN_SECRET_KEY) {
        return res.status(400).json({ error: "مفتاح المسؤول العام غير صحيح" });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
      }

      // Check if phone already exists
      const existingPhone = await storage.getUserByPhone(data.phone);
      if (existingPhone) {
        return res.status(400).json({ error: "رقم الهاتف مستخدم بالفعل" });
      }

      // Create super admin user (without schoolId)
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      const newUser = await storage.createUser({
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone,
        role: "super_admin",
        schoolId: null, // Super admin doesn't belong to any specific school
      });

      req.session.user = newUser;
      req.session.userId = newUser.id;
      const { password: _, ...userWithoutPassword } = newUser;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Super admin registration error:', error);
      res.status(400).json({ error: "فشل في إنشاء حساب المسؤول العام" });
    }
  });

  // Super Admin School Management Routes
  app.get("/api/super-admin/schools", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "super_admin") {
        return res.status(403).json({ error: "غير مصرح بالوصول - المسؤولين العامين فقط" });
      }

      const schools = await storage.getSchools();
      res.json(schools);
    } catch (error) {
      console.error('Error fetching schools:', error);
      res.status(500).json({ error: "فشل في جلب المدارس" });
    }
  });

  app.post("/api/super-admin/schools", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "super_admin") {
        return res.status(403).json({ error: "غير مصرح بالوصول - المسؤولين العامين فقط" });
      }

      const data = insertSchoolSchema.parse(req.body);
      
      // Check if school code already exists
      const existingSchool = await storage.getSchoolByCode(data.code);
      if (existingSchool) {
        return res.status(400).json({ error: "كود المدرسة مستخدم بالفعل" });
      }

      const newSchool = await storage.createSchool(data);
      res.json(newSchool);
    } catch (error) {
      console.error('Error creating school:', error);
      
      // Handle specific database constraint errors
      if (error && typeof error === 'object' && 'code' in error) {
        if ((error as any).code === '23505') {
          // Unique constraint violation
          if ((error as any).constraint === 'schools_code_unique') {
            return res.status(400).json({ error: "كود المدرسة مستخدم بالفعل، يرجى اختيار كود آخر" });
          }
          if ((error as any).constraint === 'schools_domain_unique') {
            return res.status(400).json({ error: "النطاق مستخدم بالفعل، يرجى اختيار نطاق آخر" });
          }
        }
      }
      
      res.status(400).json({ error: "فشل في إنشاء المدرسة، يرجى التحقق من البيانات المدخلة" });
    }
  });

  app.delete("/api/super-admin/schools/:id", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "super_admin") {
        return res.status(403).json({ error: "غير مصرح بالوصول - المسؤولين العامين فقط" });
      }

      const schoolId = parseInt(req.params.id);
      await storage.deleteSchool(schoolId);
      res.json({ message: "تم حذف المدرسة بنجاح" });
    } catch (error) {
      console.error('Error deleting school:', error);
      res.status(500).json({ error: "فشل في حذف المدرسة" });
    }
  });

  // School Selection Route (for accessing specific school - PUBLIC ROUTE)
  app.post("/api/school/select", async (req, res) => {
    try {
      const { schoolCode } = schoolSelectionSchema.parse(req.body);
      
      const school = await storage.getSchoolByCode(schoolCode);
      if (!school) {
        return res.status(404).json({ error: "المدرسة غير موجودة أو غير مفعلة" });
      }

      // Set school context in session for registration
      req.session.schoolId = school.id;
      req.session.schoolCode = school.code;
      
      res.json({ school });
    } catch (error) {
      console.error('Error selecting school:', error);
      res.status(400).json({ error: "كود المدرسة غير صحيح" });
    }
  });

  // Get school statistics
  app.get("/api/super-admin/schools/:id/stats", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "super_admin") {
        return res.status(403).json({ error: "غير مصرح بالوصول - المسؤولين العامين فقط" });
      }

      const schoolId = parseInt(req.params.id);
      const stats = await storage.getSchoolStatistics(schoolId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching school statistics:', error);
      res.status(500).json({ error: "فشل في جلب إحصائيات المدرسة" });
    }
  });

  // Update school access keys
  app.patch("/api/super-admin/schools/:id/keys", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== "super_admin") {
        return res.status(403).json({ error: "غير مصرح بالوصول - المسؤولين العامين فقط" });
      }

      const schoolId = parseInt(req.params.id);
      const { adminKey, teacherKey } = req.body;

      if (!adminKey || !teacherKey) {
        return res.status(400).json({ error: "مفاتيح الوصول مطلوبة" });
      }

      await storage.updateSchoolKeys(schoolId, adminKey, teacherKey);
      res.json({ message: "تم تحديث مفاتيح الوصول بنجاح" });
    } catch (error) {
      console.error('Error updating school keys:', error);
      res.status(500).json({ error: "فشل في تحديث مفاتيح الوصول" });
    }
  });

  // Group Attendance Routes
  app.get("/api/groups/:groupId/attendance", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة لعرض الحضور" });
      }

      const groupId = parseInt(req.params.groupId);
      const { date } = req.query;
      
      const attendance = await storage.getAttendanceWithStudentDetails(groupId, date as string);
      res.json(attendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ error: "فشل في جلب بيانات الحضور" });
    }
  });

  app.post("/api/groups/:groupId/attendance", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة لتسجيل الحضور" });
      }

      const groupId = parseInt(req.params.groupId);
      const attendanceData = {
        ...req.body,
        groupId,
        attendanceDate: new Date(req.body.attendanceDate),
        markedBy: req.session.user.id,
        schoolId: req.session.user.schoolId
      };
      
      const attendance = await storage.markAttendance(attendanceData);
      res.json(attendance);
    } catch (error) {
      console.error('Error marking attendance:', error);
      res.status(500).json({ error: "فشل في تسجيل الحضور" });
    }
  });

  app.patch("/api/attendance/:id", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة لتعديل الحضور" });
      }

      const attendanceId = parseInt(req.params.id);
      const updates = req.body;
      
      const attendance = await storage.updateAttendance(attendanceId, updates);
      res.json(attendance);
    } catch (error) {
      console.error('Error updating attendance:', error);
      res.status(500).json({ error: "فشل في تحديث الحضور" });
    }
  });

  // Get attendance history for a group
  app.get("/api/groups/:groupId/attendance-history", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const groupId = parseInt(req.params.groupId);
      const attendanceHistory = await storage.getGroupAttendanceHistory(groupId, req.session.user.schoolId);
      res.json(attendanceHistory);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      res.status(500).json({ error: "فشل في جلب سجل الحضور" });
    }
  });

  // Group Schedule Routes (Admin only)
  app.get("/api/groups/:groupId/scheduled-dates", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة لعرض الجدول" });
      }

      const groupId = parseInt(req.params.groupId);
      const schoolId = req.session.user.schoolId;

      if (!schoolId) {
        return res.status(400).json({ error: "معرف المدرسة مطلوب" });
      }

      const scheduledDates = await storage.getGroupScheduledLessonDates(groupId, schoolId);
      res.json({ dates: scheduledDates });
    } catch (error) {
      console.error("Error getting scheduled dates:", error);
      res.status(500).json({ error: "فشل في جلب مواعيد الحصص" });
    }
  });

  app.post("/api/groups/:groupId/assign-schedule", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة لتعيين الجدول" });
      }

      const groupId = parseInt(req.params.groupId);
      const { scheduleCellId } = req.body;
      const schoolId = req.session.user.schoolId;
      const assignedBy = req.session.user.id;

      if (!schoolId) {
        return res.status(400).json({ error: "معرف المدرسة مطلوب" });
      }

      const assignment = await storage.assignGroupToSchedule(groupId, scheduleCellId, schoolId, assignedBy);
      res.json(assignment);
    } catch (error) {
      console.error("Error assigning group to schedule:", error);
      res.status(500).json({ error: "فشل في تعيين الجدول للمجموعة" });
    }
  });

  app.get("/api/groups/:groupId/schedule-assignments", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة لعرض التعيينات" });
      }

      const groupId = parseInt(req.params.groupId);
      const assignments = await storage.getGroupScheduleAssignments(groupId);
      res.json(assignments);
    } catch (error) {
      console.error("Error getting group schedule assignments:", error);
      res.status(500).json({ error: "فشل في جلب تعيينات الجدول" });
    }
  });

  // Group Financial Transaction Routes
  app.get("/api/groups/:groupId/transactions", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const groupId = parseInt(req.params.groupId);
      const { studentId } = req.query;
      
      const transactions = studentId 
        ? await storage.getGroupTransactions(groupId, parseInt(studentId as string))
        : await storage.getTransactionsWithDetails(groupId);
      
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: "فشل في جلب المعاملات المالية" });
    }
  });

  app.post("/api/groups/:groupId/transactions", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const groupId = parseInt(req.params.groupId);
      const transactionData = {
        ...req.body,
        groupId,
        recordedBy: req.session.user.id,
        schoolId: req.session.user.schoolId
      };
      
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ error: "فشل في إنشاء المعاملة المالية" });
    }
  });

  app.patch("/api/transactions/:id", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const transactionId = parseInt(req.params.id);
      const updates = req.body;
      
      const transaction = await storage.updateTransaction(transactionId, updates);
      res.json(transaction);
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({ error: "فشل في تحديث المعاملة المالية" });
    }
  });

  app.get("/api/groups/:groupId/students/:studentId/financial-summary", async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: "صلاحيات المدير مطلوبة" });
      }

      const groupId = parseInt(req.params.groupId);
      const studentId = parseInt(req.params.studentId);
      
      const summary = await storage.getStudentFinancialSummary(groupId, studentId);
      res.json(summary);
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      res.status(500).json({ error: "فشل في جلب الملخص المالي" });
    }
  });

  // Student Payment Status Routes
  app.get('/api/students/:studentId/payment-status/:year/:month', async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const { studentId, year, month } = req.params;
      const schoolId = req.session.user.schoolId;
      
      const paymentStatus = await storage.getStudentPaymentStatus(
        parseInt(studentId),
        parseInt(year),
        parseInt(month),
        schoolId
      );
      
      res.json(paymentStatus || { isPaid: false });
    } catch (error) {
      console.error('Error getting payment status:', error);
      res.status(500).json({ error: 'فشل في جلب حالة الدفع' });
    }
  });

  app.get('/api/groups/:groupId/payment-status/:year/:month', async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ error: "المستخدم غير مسجل دخول" });
      }

      const { groupId, year, month } = req.params;
      const schoolId = req.session.user.schoolId;
      
      // Get group with students
      const group = await storage.getGroupById(parseInt(groupId));
      if (!group || group.schoolId !== schoolId) {
        return res.status(404).json({ error: 'المجموعة غير موجودة' });
      }
      
      // Get students assigned to this group (mixed assignments)
      const groupAssignments = await storage.getGroupAssignments(parseInt(groupId));
      
      // Filter only actual students with user accounts (not children) for payment processing
      const actualStudentIds = groupAssignments
        .filter((assignment: any) => assignment.type === 'student')
        .map((assignment: any) => assignment.id);
      
      // Create default unpaid records for students without payment records
      if (actualStudentIds.length > 0) {
        await storage.createDefaultMonthlyPayments(actualStudentIds, parseInt(year), parseInt(month), schoolId);
      }
      
      // Get payment statuses for actual students only (not children)
      const paymentStatuses = actualStudentIds.length > 0 
        ? await storage.getStudentsPaymentStatusForMonth(
            actualStudentIds,
            parseInt(year),
            parseInt(month),
            schoolId
          )
        : [];
      
      res.json(paymentStatuses);
    } catch (error) {
      console.error('Error getting group payment status:', error);
      res.status(500).json({ error: 'فشل في جلب حالة دفع المجموعة' });
    }
  });

  app.post('/api/students/:studentId/mark-payment', async (req, res) => {
    try {
      if (!req.session?.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'غير مسموح لك بتعديل حالة الدفع' });
      }

      const { studentId } = req.params;
      const { year, month, isPaid, amount, notes } = req.body;
      const schoolId = req.session.user.schoolId;
      const paidBy = req.session.user.id;
      
      const paymentRecord = await storage.markStudentPayment(
        parseInt(studentId),
        parseInt(year),
        parseInt(month),
        isPaid,
        schoolId,
        paidBy,
        amount ? parseFloat(amount) : undefined,
        notes
      );
      
      res.json(paymentRecord);
    } catch (error) {
      console.error('Error marking payment:', error);
      res.status(500).json({ error: 'فشل في تحديث حالة الدفع' });
    }
  });

  // Student status endpoints
  app.get("/api/student/attendance/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const requestingUser = req.session.user;
      
      // Only allow students to view their own data or parents to view their children's data
      if (requestingUser.role === 'student' && requestingUser.id !== userId) {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه البيانات" });
      }
      
      const attendanceRecords = await storage.getStudentAttendanceRecords(userId, requestingUser.schoolId);
      res.json(attendanceRecords);
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      res.status(500).json({ error: "فشل في جلب سجل الحضور" });
    }
  });

  app.get("/api/student/payments/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const requestingUser = req.session.user;
      
      // Only allow students to view their own data or parents to view their children's data
      if (requestingUser.role === 'student' && requestingUser.id !== userId) {
        return res.status(403).json({ error: "غير مسموح لك بالوصول إلى هذه البيانات" });
      }
      
      const paymentRecords = await storage.getStudentPaymentRecords(userId, requestingUser.schoolId);
      res.json(paymentRecords);
    } catch (error) {
      console.error('Error fetching student payments:', error);
      res.status(500).json({ error: "فشل في جلب سجل المدفوعات" });
    }
  });

  return httpServer;
}
