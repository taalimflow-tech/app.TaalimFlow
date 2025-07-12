import { users, announcements, blogPosts, teachers, messages, suggestions, groups, formations, groupRegistrations, formationRegistrations, children, students, notifications, teachingModules, teacherSpecializations, type User, type InsertUser, type Announcement, type InsertAnnouncement, type BlogPost, type InsertBlogPost, type Teacher, type InsertTeacher, type Message, type InsertMessage, type Suggestion, type InsertSuggestion, type Group, type InsertGroup, type Formation, type InsertFormation, type GroupRegistration, type InsertGroupRegistration, type FormationRegistration, type InsertFormationRegistration, type Child, type InsertChild, type Student, type InsertStudent, type Notification, type InsertNotification, type TeachingModule, type InsertTeachingModule, type TeacherSpecialization, type InsertTeacherSpecialization } from "@shared/schema";
import { db } from "./db";
import { eq, desc, or, ilike } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(email: string, password: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  searchUsers(query: string): Promise<User[]>;
  updateUserProfilePicture(userId: number, profilePictureUrl: string): Promise<User>;
  
  // Announcement methods
  getAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  
  // Blog post methods
  getBlogPosts(): Promise<BlogPost[]>;
  createBlogPost(blogPost: InsertBlogPost): Promise<BlogPost>;
  deleteBlogPost(id: number): Promise<void>;
  
  // Teacher methods
  getTeachers(): Promise<Teacher[]>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  deleteTeacher(id: number): Promise<void>;
  getTeachersWithSpecializations(): Promise<any[]>;
  
  // Message methods
  getMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByUserId(userId: number): Promise<Message[]>;
  createBulkMessage(senderIds: number[], receiverIds: number[], subject: string, content: string): Promise<Message[]>;
  
  // Suggestion methods
  getSuggestions(): Promise<Suggestion[]>;
  createSuggestion(suggestion: InsertSuggestion): Promise<Suggestion>;
  
  // Group methods
  getGroups(): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  deleteGroup(id: number): Promise<void>;
  
  // Formation methods
  getFormations(): Promise<Formation[]>;
  createFormation(formation: InsertFormation): Promise<Formation>;
  deleteFormation(id: number): Promise<void>;
  
  // Registration methods
  createGroupRegistration(registration: InsertGroupRegistration): Promise<GroupRegistration>;
  createFormationRegistration(registration: InsertFormationRegistration): Promise<FormationRegistration>;
  
  // Children methods
  createChild(child: InsertChild): Promise<Child>;
  getChildrenByParentId(parentId: number): Promise<Child[]>;
  deleteChild(childId: number): Promise<void>;
  
  // Student methods
  createStudent(student: InsertStudent): Promise<Student>;
  getStudentByUserId(userId: number): Promise<Student | undefined>;
  
  // Notification methods
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  createNotificationForUsers(userIds: number[], type: string, title: string, message: string, relatedId?: number): Promise<Notification[]>;
  
  // Verification methods - only for children and students
  verifyChild(childId: number, adminId: number, notes?: string): Promise<Child>;
  verifyStudent(studentId: number, adminId: number, notes?: string): Promise<Student>;
  undoVerifyChild(childId: number): Promise<Child>;
  undoVerifyStudent(studentId: number): Promise<Student>;
  getUnverifiedChildren(): Promise<Child[]>;
  getUnverifiedStudents(): Promise<Student[]>;
  getVerifiedChildren(): Promise<Child[]>;
  getVerifiedStudents(): Promise<Student[]>;
  
  // Teaching module methods
  getTeachingModules(): Promise<TeachingModule[]>;
  getTeachingModulesByLevel(educationLevel: string): Promise<TeachingModule[]>;
  createTeachingModule(module: InsertTeachingModule): Promise<TeachingModule>;
  deleteTeachingModule(id: number): Promise<void>;
  
  // Teacher specialization methods
  getTeacherSpecializations(teacherId: number): Promise<TeacherSpecialization[]>;
  createTeacherSpecialization(specialization: InsertTeacherSpecialization): Promise<TeacherSpecialization>;
  deleteTeacherSpecialization(id: number): Promise<void>;
  getTeachersByModule(moduleId: number): Promise<TeacherSpecialization[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (user && user.password === password) {
      return user;
    }
    return null;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async searchUsers(query: string): Promise<User[]> {
    return await db.select().from(users).where(
      or(
        ilike(users.name, `%${query}%`),
        ilike(users.email, `%${query}%`),
        ilike(users.phone, `%${query}%`)
      )
    ).orderBy(desc(users.createdAt));
  }

  async createChild(insertChild: InsertChild): Promise<Child> {
    const [child] = await db
      .insert(children)
      .values(insertChild)
      .returning();
    return child;
  }

  async getChildrenByParentId(parentId: number): Promise<Child[]> {
    return await db.select().from(children).where(eq(children.parentId, parentId));
  }

  async deleteChild(childId: number): Promise<void> {
    await db.delete(children).where(eq(children.id, childId));
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  async getStudentByUserId(userId: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.userId, userId));
    return student || undefined;
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db
      .insert(announcements)
      .values(insertAnnouncement)
      .returning();
    return announcement;
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }

  async createBlogPost(insertBlogPost: InsertBlogPost): Promise<BlogPost> {
    const [blogPost] = await db
      .insert(blogPosts)
      .values(insertBlogPost)
      .returning();
    return blogPost;
  }

  async deleteBlogPost(id: number): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async getTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers).orderBy(desc(teachers.createdAt));
  }

  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    const [teacher] = await db
      .insert(teachers)
      .values(insertTeacher)
      .returning();
    return teacher;
  }

  async deleteTeacher(id: number): Promise<void> {
    await db.delete(teachers).where(eq(teachers.id, id));
  }

  async getTeachersWithSpecializations(): Promise<any[]> {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        profilePicture: users.profilePicture,
        role: users.role,
        subjectId: teachingModules.id,
        subjectName: teachingModules.name,
        subjectNameAr: teachingModules.nameAr,
        educationLevel: teachingModules.educationLevel,
        grade: teachingModules.grade
      })
      .from(users)
      .leftJoin(teacherSpecializations, eq(users.id, teacherSpecializations.teacherId))
      .leftJoin(teachingModules, eq(teacherSpecializations.moduleId, teachingModules.id))
      .where(eq(users.role, 'teacher'))
      .orderBy(users.name);

    // Group by teacher to consolidate specializations
    const teachersMap = new Map();
    
    result.forEach(row => {
      if (!teachersMap.has(row.id)) {
        teachersMap.set(row.id, {
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          profilePicture: row.profilePicture,
          role: row.role,
          specializations: []
        });
      }
      
      if (row.subjectId) {
        teachersMap.get(row.id).specializations.push({
          id: row.subjectId,
          name: row.subjectName,
          nameAr: row.subjectNameAr,
          educationLevel: row.educationLevel,
          grade: row.grade
        });
      }
    });
    
    return Array.from(teachersMap.values());
  }

  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.createdAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getMessagesByUserId(userId: number): Promise<Message[]> {
    return await db.select().from(messages).where(
      or(
        eq(messages.senderId, userId),
        eq(messages.receiverId, userId)
      )
    ).orderBy(desc(messages.createdAt));
  }

  async createBulkMessage(senderIds: number[], receiverIds: number[], subject: string, content: string): Promise<Message[]> {
    const messagesToInsert = [];
    
    // Get the first available teacher ID for admin messages
    const firstTeacher = await db.select().from(teachers).limit(1);
    const teacherId = firstTeacher.length > 0 ? firstTeacher[0].id : 1; // fallback to ID 1
    
    for (const senderId of senderIds) {
      for (const receiverId of receiverIds) {
        messagesToInsert.push({
          senderId,
          receiverId,
          teacherId, // Use existing teacher ID
          subject,
          content,
          read: false
        });
      }
    }
    
    return await db.insert(messages).values(messagesToInsert).returning();
  }

  async getSuggestions(): Promise<Suggestion[]> {
    return await db.select().from(suggestions).orderBy(desc(suggestions.createdAt));
  }

  async createSuggestion(insertSuggestion: InsertSuggestion): Promise<Suggestion> {
    const [suggestion] = await db
      .insert(suggestions)
      .values(insertSuggestion)
      .returning();
    return suggestion;
  }

  async getGroups(): Promise<Group[]> {
    return await db.select().from(groups).orderBy(desc(groups.createdAt));
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const [group] = await db
      .insert(groups)
      .values(insertGroup)
      .returning();
    return group;
  }

  async deleteGroup(id: number): Promise<void> {
    await db.delete(groups).where(eq(groups.id, id));
  }

  async getFormations(): Promise<Formation[]> {
    return await db.select().from(formations).orderBy(desc(formations.createdAt));
  }

  async createFormation(insertFormation: InsertFormation): Promise<Formation> {
    const [formation] = await db
      .insert(formations)
      .values(insertFormation)
      .returning();
    return formation;
  }

  async deleteFormation(id: number): Promise<void> {
    await db.delete(formations).where(eq(formations.id, id));
  }

  async createGroupRegistration(insertGroupRegistration: InsertGroupRegistration): Promise<GroupRegistration> {
    const [registration] = await db
      .insert(groupRegistrations)
      .values(insertGroupRegistration)
      .returning();
    return registration;
  }

  async createFormationRegistration(insertFormationRegistration: InsertFormationRegistration): Promise<FormationRegistration> {
    const [registration] = await db
      .insert(formationRegistrations)
      .values(insertFormationRegistration)
      .returning();
    return registration;
  }

  async getNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .where(eq(notifications.read, false));
    return result.length;
  }

  async createNotificationForUsers(userIds: number[], type: string, title: string, message: string, relatedId?: number): Promise<Notification[]> {
    const notificationPromises = userIds.map(userId => 
      this.createNotification({
        userId,
        type,
        title,
        message,
        relatedId
      })
    );
    return await Promise.all(notificationPromises);
  }

  // Verification methods - only for children and students

  async verifyChild(childId: number, adminId: number, notes?: string): Promise<Child> {
    const [child] = await db
      .update(children)
      .set({ 
        verified: true, 
        verificationNotes: notes || null,
        verifiedAt: new Date(),
        verifiedBy: adminId
      })
      .where(eq(children.id, childId))
      .returning();
    return child;
  }

  async verifyStudent(studentId: number, adminId: number, notes?: string): Promise<Student> {
    const [student] = await db
      .update(students)
      .set({ 
        verified: true, 
        verificationNotes: notes || null,
        verifiedAt: new Date(),
        verifiedBy: adminId
      })
      .where(eq(students.id, studentId))
      .returning();
    return student;
  }

  async getUnverifiedChildren(): Promise<Child[]> {
    return await db.select().from(children).where(eq(children.verified, false)).orderBy(desc(children.createdAt));
  }

  async getUnverifiedStudents(): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.verified, false)).orderBy(desc(students.createdAt));
  }

  async getVerifiedChildren(): Promise<Child[]> {
    return await db.select().from(children).where(eq(children.verified, true)).orderBy(desc(children.verifiedAt));
  }

  async getVerifiedStudents(): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.verified, true)).orderBy(desc(students.verifiedAt));
  }

  async undoVerifyChild(childId: number): Promise<Child> {
    const [child] = await db
      .update(children)
      .set({
        verified: false,
        verificationNotes: null,
        verifiedAt: null,
        verifiedBy: null
      })
      .where(eq(children.id, childId))
      .returning();
    return child;
  }

  async undoVerifyStudent(studentId: number): Promise<Student> {
    const [student] = await db
      .update(students)
      .set({
        verified: false,
        verificationNotes: null,
        verifiedAt: null,
        verifiedBy: null
      })
      .where(eq(students.id, studentId))
      .returning();
    return student;
  }

  async updateUserProfilePicture(userId: number, profilePictureUrl: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ profilePicture: profilePictureUrl })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Teaching module methods
  async getTeachingModules(): Promise<TeachingModule[]> {
    return await db.select().from(teachingModules).orderBy(desc(teachingModules.createdAt));
  }

  async getTeachingModulesByLevel(educationLevel: string): Promise<TeachingModule[]> {
    return await db
      .select()
      .from(teachingModules)
      .where(eq(teachingModules.educationLevel, educationLevel))
      .orderBy(desc(teachingModules.createdAt));
  }

  async createTeachingModule(insertModule: InsertTeachingModule): Promise<TeachingModule> {
    const [module] = await db
      .insert(teachingModules)
      .values(insertModule)
      .returning();
    return module;
  }

  async deleteTeachingModule(id: number): Promise<void> {
    await db.delete(teachingModules).where(eq(teachingModules.id, id));
  }

  // Teacher specialization methods
  async getTeacherSpecializations(teacherId: number): Promise<TeacherSpecialization[]> {
    return await db
      .select()
      .from(teacherSpecializations)
      .where(eq(teacherSpecializations.teacherId, teacherId))
      .orderBy(desc(teacherSpecializations.createdAt));
  }

  async createTeacherSpecialization(insertSpecialization: InsertTeacherSpecialization): Promise<TeacherSpecialization> {
    const [specialization] = await db
      .insert(teacherSpecializations)
      .values(insertSpecialization)
      .returning();
    return specialization;
  }

  async deleteTeacherSpecialization(id: number): Promise<void> {
    await db.delete(teacherSpecializations).where(eq(teacherSpecializations.id, id));
  }

  async getTeachersByModule(moduleId: number): Promise<TeacherSpecialization[]> {
    return await db
      .select()
      .from(teacherSpecializations)
      .where(eq(teacherSpecializations.moduleId, moduleId))
      .orderBy(desc(teacherSpecializations.createdAt));
  }
}

export const storage = new DatabaseStorage();
