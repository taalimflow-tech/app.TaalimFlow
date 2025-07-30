import { schools, users, announcements, blogPosts, teachers, messages, suggestions, groups, formations, groupRegistrations, groupUserAssignments, formationRegistrations, children, students, notifications, teachingModules, teacherSpecializations, scheduleTables, scheduleCells, blockedUsers, userReports, groupAttendance, groupTransactions, groupScheduleAssignments, studentMonthlyPayments, type School, type InsertSchool, type User, type InsertUser, type Announcement, type InsertAnnouncement, type BlogPost, type InsertBlogPost, type Teacher, type InsertTeacher, type Message, type InsertMessage, type Suggestion, type InsertSuggestion, type Group, type InsertGroup, type Formation, type InsertFormation, type GroupRegistration, type InsertGroupRegistration, type GroupUserAssignment, type InsertGroupUserAssignment, type FormationRegistration, type InsertFormationRegistration, type Child, type InsertChild, type Student, type InsertStudent, type Notification, type InsertNotification, type TeachingModule, type InsertTeachingModule, type TeacherSpecialization, type InsertTeacherSpecialization, type ScheduleTable, type InsertScheduleTable, type ScheduleCell, type InsertScheduleCell, type BlockedUser, type InsertBlockedUser, type UserReport, type InsertUserReport, type GroupAttendance, type InsertGroupAttendance, type GroupTransaction, type InsertGroupTransaction, type StudentMonthlyPayment, type InsertStudentMonthlyPayment } from "@shared/schema";
import { db } from "./db";
import { eq, desc, or, ilike, and, aliasedTable, sql, asc, like, SQL, inArray } from "drizzle-orm";

export interface IStorage {
  // School methods (for multi-tenancy)
  getSchools(): Promise<School[]>;
  getAllActiveSchools(): Promise<School[]>;
  getSchoolByCode(code: string): Promise<School | undefined>;
  getSchoolById(id: number): Promise<School | undefined>;
  createSchool(school: InsertSchool): Promise<School>;
  updateSchool(id: number, updates: Partial<InsertSchool>): Promise<School>;
  deleteSchool(id: number): Promise<void>;
  getSchoolStatistics(schoolId: number): Promise<any>;
  updateSchoolKeys(schoolId: number, adminKey: string, teacherKey: string): Promise<void>;

  // User methods (with schoolId context)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string, schoolId?: number): Promise<User | undefined>;
  getUserByPhone(phone: string, schoolId?: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(email: string, password: string, schoolId?: number): Promise<User | null>;
  getAllUsers(schoolId?: number): Promise<User[]>;
  searchUsers(query: string, schoolId?: number): Promise<User[]>;
  searchUsersWithFilters(filters: {
    search?: string;
    educationLevel?: string;
    subject?: number;
    assignedTeacher?: number;
    role?: string;
    schoolId?: number;
  }): Promise<User[]>;
  updateUserProfilePicture(userId: number, profilePictureUrl: string): Promise<User>;
  
  // Phone verification methods
  savePhoneVerificationCode(userId: number, code: string, expiry: Date): Promise<void>;
  verifyPhoneCode(userId: number, code: string): Promise<boolean>;
  markPhoneAsVerified(userId: number): Promise<void>;
  
  // Email verification methods
  saveEmailVerificationCode(userId: number, code: string, expiry: Date): Promise<void>;
  verifyEmailCode(userId: number, code: string): Promise<boolean>;
  markEmailAsVerified(userId: number): Promise<void>;
  
  // Announcement methods
  getAnnouncements(): Promise<Announcement[]>;
  getAnnouncementsBySchool(schoolId: number): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  
  // Blog post methods
  getBlogPosts(): Promise<BlogPost[]>;
  getBlogPostsBySchool(schoolId: number): Promise<BlogPost[]>;
  createBlogPost(blogPost: InsertBlogPost): Promise<BlogPost>;
  deleteBlogPost(id: number): Promise<void>;
  
  // Teacher methods
  getTeachers(): Promise<Teacher[]>;
  getTeachersBySchool(schoolId: number): Promise<Teacher[]>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  deleteTeacher(id: number): Promise<void>;
  getTeachersWithSpecializations(schoolId: number): Promise<any[]>;
  
  // Message methods
  getMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByUserId(userId: number): Promise<Message[]>;
  createBulkMessage(senderIds: number[], receiverIds: number[], subject: string, content: string): Promise<Message[]>;
  
  // Suggestion methods
  getSuggestions(schoolId?: number): Promise<any[]>;
  createSuggestion(suggestion: InsertSuggestion): Promise<Suggestion>;
  
  // Group methods
  getGroups(): Promise<Group[]>;
  getGroupsBySchool(schoolId: number): Promise<Group[]>;
  getGroupById(id: number): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  deleteGroup(id: number): Promise<void>;
  
  // Admin group management methods
  getAdminGroups(schoolId?: number): Promise<any[]>;
  updateGroupAssignments(groupId: number | null, studentIds: number[], teacherId: number, groupData?: any, schoolId?: number): Promise<Group>;
  getAvailableStudentsByLevelAndSubject(educationLevel: string, subjectId: number): Promise<any[]>;
  
  // Formation methods
  getFormations(): Promise<Formation[]>;
  getFormationsBySchool(schoolId: number): Promise<Formation[]>;
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
  verifyChild(childId: number, adminId: number, notes?: string, educationLevel?: string, selectedSubjects?: string[]): Promise<Child>;
  verifyStudent(studentId: number, adminId: number, notes?: string, educationLevel?: string, selectedSubjects?: string[]): Promise<Student>;
  undoVerifyChild(childId: number): Promise<Child>;
  undoVerifyStudent(studentId: number): Promise<Student>;
  getUnverifiedChildren(schoolId: number): Promise<Child[]>;
  getUnverifiedStudents(schoolId: number): Promise<Student[]>;
  getVerifiedChildren(schoolId: number): Promise<Child[]>;
  getVerifiedStudents(schoolId: number): Promise<Student[]>;
  
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
  
  // Schedule table methods
  getScheduleTables(): Promise<ScheduleTable[]>;
  getScheduleTablesBySchool(schoolId: number): Promise<ScheduleTable[]>;
  getScheduleTable(id: number): Promise<ScheduleTable | undefined>;
  createScheduleTable(table: InsertScheduleTable): Promise<ScheduleTable>;
  updateScheduleTable(id: number, updates: Partial<InsertScheduleTable>): Promise<ScheduleTable>;
  deleteScheduleTable(id: number): Promise<void>;
  
  // Schedule cell methods
  getScheduleCells(scheduleTableId: number): Promise<ScheduleCell[]>;
  getScheduleCell(id: number): Promise<ScheduleCell | undefined>;
  createScheduleCell(cell: InsertScheduleCell): Promise<ScheduleCell>;
  updateScheduleCell(id: number, updates: Partial<InsertScheduleCell>): Promise<ScheduleCell>;
  deleteScheduleCell(id: number): Promise<void>;
  getScheduleCellsWithDetails(scheduleTableId: number): Promise<any[]>;
  
  // User blocking methods
  blockUser(blockerId: number, blockedId: number, reason?: string): Promise<BlockedUser>;
  unblockUser(blockerId: number, blockedId: number): Promise<void>;
  isUserBlocked(blockerId: number, blockedId: number): Promise<boolean>;
  getBlockedUsers(userId: number): Promise<BlockedUser[]>;
  
  // User reporting methods
  reportUser(report: InsertUserReport): Promise<UserReport>;
  getUserReports(userId: number): Promise<UserReport[]>;
  
  // Admin reporting methods
  getAllReports(): Promise<any[]>;
  updateReportStatus(reportId: number, status: string): Promise<UserReport>;
  
  // User banning methods
  banUser(userId: number, reason: string, bannedBy: number): Promise<User>;
  unbanUser(userId: number): Promise<User>;
  getBannedUsers(): Promise<User[]>;
  
  // Enhanced message methods
  getMessagesWithUserInfo(userId: number): Promise<any[]>;
  markMessageAsRead(messageId: number): Promise<void>;
  getConversationBetweenUsers(userId1: number, userId2: number): Promise<any[]>;

  // Group Attendance interface methods
  getGroupAttendance(groupId: number, date?: string): Promise<GroupAttendance[]>;
  markAttendance(attendance: InsertGroupAttendance): Promise<GroupAttendance>;
  updateAttendance(id: number, updates: Partial<InsertGroupAttendance>): Promise<GroupAttendance>;
  getAttendanceWithStudentDetails(groupId: number, date?: string): Promise<any[]>;
  getGroupAttendanceHistory(groupId: number, schoolId: number): Promise<any[]>;

  // Group Financial Transaction interface methods
  getGroupTransactions(groupId: number, studentId?: number): Promise<GroupTransaction[]>;
  createTransaction(transaction: InsertGroupTransaction): Promise<GroupTransaction>;
  updateTransaction(id: number, updates: Partial<InsertGroupTransaction>): Promise<GroupTransaction>;
  getTransactionsWithDetails(groupId: number): Promise<any[]>;
  getStudentFinancialSummary(groupId: number, studentId: number): Promise<any>;
  
  // Group Schedule interface methods
  getGroupScheduledLessonDates(groupId: number, schoolId: number): Promise<string[]>;
  assignGroupToSchedule(groupId: number, scheduleCellId: number, schoolId: number, assignedBy: number): Promise<any>;
  getGroupScheduleAssignments(groupId: number): Promise<any[]>;
  getCompatibleGroups(subjectId: number, teacherId: number, educationLevel: string, schoolId: number): Promise<any[]>;
  getScheduleLinkedGroups(tableId: number, schoolId: number): Promise<any[]>;
  linkGroupsToScheduleCell(cellId: number, groupIds: number[], schoolId: number, assignedBy: number): Promise<void>;

  // Student Monthly Payment interface methods
  getStudentPaymentStatus(studentId: number, year: number, month: number, schoolId: number): Promise<StudentMonthlyPayment | undefined>;
  getStudentsPaymentStatusForMonth(studentIds: number[], year: number, month: number, schoolId: number): Promise<StudentMonthlyPayment[]>;
  markStudentPayment(studentId: number, year: number, month: number, isPaid: boolean, schoolId: number, paidBy: number, amount?: number, notes?: string): Promise<StudentMonthlyPayment>;
  createDefaultMonthlyPayments(studentIds: number[], year: number, month: number, schoolId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // School methods implementation
  async getSchools(): Promise<School[]> {
    return await db.select().from(schools).where(eq(schools.active, true)).orderBy(desc(schools.createdAt));
  }

  async getAllActiveSchools(): Promise<School[]> {
    // Get all active schools with user count
    const schoolsList = await db.select().from(schools).where(eq(schools.active, true)).orderBy(desc(schools.createdAt));
    
    // Add user count for each school
    const schoolsWithUserCount = await Promise.all(
      schoolsList.map(async (school) => {
        const userCount = await db.select().from(users).where(eq(users.schoolId, school.id));
        return {
          ...school,
          userCount: userCount.length
        };
      })
    );
    
    return schoolsWithUserCount;
  }

  async getSchoolByCode(code: string): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(and(eq(schools.code, code), eq(schools.active, true)));
    return school || undefined;
  }

  async getSchoolById(id: number): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.id, id));
    return school || undefined;
  }

  async createSchool(school: InsertSchool): Promise<School> {
    const [newSchool] = await db.insert(schools).values(school).returning();
    return newSchool;
  }

  async updateSchool(id: number, updates: Partial<InsertSchool>): Promise<School> {
    const [updatedSchool] = await db
      .update(schools)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schools.id, id))
      .returning();
    return updatedSchool;
  }

  async deleteSchool(id: number): Promise<void> {
    // Delete all related data in the correct order (foreign key dependencies)
    await db.delete(notifications).where(eq(notifications.schoolId, id));
    await db.delete(userReports).where(eq(userReports.schoolId, id));
    await db.delete(scheduleCells).where(eq(scheduleCells.schoolId, id));
    await db.delete(scheduleTables).where(eq(scheduleTables.schoolId, id));
    await db.delete(formationRegistrations).where(eq(formationRegistrations.schoolId, id));
    await db.delete(groupRegistrations).where(eq(groupRegistrations.schoolId, id));
    await db.delete(groupUserAssignments).where(eq(groupUserAssignments.schoolId, id));
    await db.delete(messages).where(eq(messages.schoolId, id));
    await db.delete(suggestions).where(eq(suggestions.schoolId, id));
    await db.delete(children).where(eq(children.schoolId, id));
    await db.delete(students).where(eq(students.schoolId, id));
    await db.delete(teacherSpecializations).where(eq(teacherSpecializations.schoolId, id));
    await db.delete(teachers).where(eq(teachers.schoolId, id));
    await db.delete(formations).where(eq(formations.schoolId, id));
    await db.delete(groups).where(eq(groups.schoolId, id));
    await db.delete(blogPosts).where(eq(blogPosts.schoolId, id));
    await db.delete(announcements).where(eq(announcements.schoolId, id));
    await db.delete(teachingModules).where(eq(teachingModules.schoolId, id));
    await db.delete(blockedUsers).where(eq(blockedUsers.schoolId, id));
    await db.delete(users).where(eq(users.schoolId, id));
    
    // Finally delete the school itself
    await db.delete(schools).where(eq(schools.id, id));
  }
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user || undefined;
  }

  async getUserByEmail(email: string, schoolId?: number): Promise<User | undefined> {
    let query = db.select().from(users);
    
    if (schoolId) {
      query = query.where(and(eq(users.email, email), eq(users.schoolId, schoolId)));
    } else {
      query = query.where(eq(users.email, email));
    }
    
    const users_found = await query;
    return users_found[0] || undefined;
  }

  async getUserByPhone(phone: string, schoolId?: number): Promise<User | undefined> {
    let query = db.select().from(users);
    
    if (schoolId) {
      query = query.where(and(eq(users.phone, phone), eq(users.schoolId, schoolId)));
    } else {
      query = query.where(eq(users.phone, phone));
    }
    
    const users_found = await query.orderBy(desc(users.id));
    return users_found[0] || undefined;
  }

  async authenticateUser(email: string, password: string, schoolId?: number): Promise<User | null> {
    const bcrypt = await import('bcrypt');
    
    let query = db.select().from(users);
    if (schoolId) {
      query = query.where(and(eq(users.email, email), eq(users.schoolId, schoolId)));
    } else {
      query = query.where(eq(users.email, email));
    }
    
    const users_found = await query;
    let user = users_found[0];
    
    if (user) {
      console.log('Found user:', user.email);
      console.log('Password starts with $2b:', user.password.startsWith('$2b$'));
      
      // Check if password is already hashed
      if (user.password.startsWith('$2b$')) {
        // Use bcrypt comparison for hashed passwords
        const isValid = await bcrypt.compare(password, user.password);
        console.log('Bcrypt comparison result:', isValid);
        return isValid ? user : null;
      } else {
        // Legacy plain text password comparison
        console.log('Using plain text comparison');
        const isValid = user.password === password;
        console.log('Plain text comparison result:', isValid);
        
        // If plain text matches, hash and update the password
        if (isValid) {
          const hashedPassword = await bcrypt.hash(password, 10);
          await db.update(users)
            .set({ password: hashedPassword })
            .where(eq(users.id, user.id));
          console.log('Updated password to hashed version');
        }
        
        return isValid ? user : null;
      }
    }
    
    console.log('No user found with email:', email);
    return null;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const userWithHashedPassword = { ...insertUser, password: hashedPassword };
    
    const [user] = await db
      .insert(users)
      .values(userWithHashedPassword)
      .returning();
    return user;
  }

  async getAllUsers(schoolId?: number): Promise<User[]> {
    if (schoolId) {
      return await db.select().from(users)
        .where(eq(users.schoolId, schoolId))
        .orderBy(desc(users.createdAt));
    }
    // If no schoolId provided, return empty array for security
    console.warn('getAllUsers called without schoolId - returning empty array for security');
    return [];
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

  async searchUsersWithFilters(filters: {
    search?: string;
    educationLevel?: string;
    subject?: number;
    assignedTeacher?: number;
    role?: string;
    schoolId?: number;
  }): Promise<User[]> {
    let query = db.select({
      id: users.id,
      email: users.email,
      password: users.password,
      name: users.name,
      phone: users.phone,
      phoneVerified: users.phoneVerified,
      phoneVerificationCode: users.phoneVerificationCode,
      phoneVerificationExpiry: users.phoneVerificationExpiry,
      emailVerified: users.emailVerified,
      emailVerificationCode: users.emailVerificationCode,
      emailVerificationExpiry: users.emailVerificationExpiry,
      profilePicture: users.profilePicture,
      role: users.role,
      gender: users.gender,
      firebaseUid: users.firebaseUid,
      verified: users.verified,
      verificationNotes: users.verificationNotes,
      verifiedAt: users.verifiedAt,
      verifiedBy: users.verifiedBy,
      banned: users.banned,
      banReason: users.banReason,
      bannedAt: users.bannedAt,
      bannedBy: users.bannedBy,
      createdAt: users.createdAt,
      student: students,
    })
    .from(users)
    .leftJoin(students, eq(users.id, students.userId))
    .leftJoin(children, eq(users.id, children.parentId));

    const conditions = [];

    // CRITICAL: School ID filter for multi-tenancy data isolation
    if (filters.schoolId) {
      conditions.push(eq(users.schoolId, filters.schoolId));
    }

    // Search filter
    if (filters.search) {
      conditions.push(
        or(
          ilike(users.name, `%${filters.search}%`),
          ilike(users.email, `%${filters.search}%`),
          ilike(users.phone, `%${filters.search}%`)
        )
      );
    }

    // Role filter
    if (filters.role) {
      conditions.push(eq(users.role, filters.role));
    }

    // Education level filter (applies to students and children)
    if (filters.educationLevel) {
      conditions.push(
        or(
          eq(students.educationLevel, filters.educationLevel),
          eq(children.educationLevel, filters.educationLevel)
        )
      );
    }

    // Subject filter (for teacher assignments)
    if (filters.subject) {
      query = query
        .leftJoin(teacherSpecializations, eq(users.id, teacherSpecializations.teacherId))
        .leftJoin(teachingModules, eq(teacherSpecializations.moduleId, teachingModules.id));
      conditions.push(eq(teachingModules.id, filters.subject));
    }

    // Assigned teacher filter (for schedule assignments)
    if (filters.assignedTeacher) {
      query = query
        .leftJoin(scheduleCells, eq(users.id, scheduleCells.teacherId));
      conditions.push(eq(scheduleCells.teacherId, filters.assignedTeacher));
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Execute query and remove duplicates
    const results = await query.orderBy(desc(users.createdAt));
    const uniqueUsers = results.reduce((acc, user) => {
      if (!acc.find(u => u.id === user.id)) {
        acc.push(user);
      }
      return acc;
    }, [] as any[]);

    return uniqueUsers;
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

  async getAnnouncementsBySchool(schoolId: number): Promise<Announcement[]> {
    return await db.select().from(announcements)
      .where(eq(announcements.schoolId, schoolId))
      .orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db
      .insert(announcements)
      .values([insertAnnouncement])
      .returning();
    return announcement;
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }

  async getBlogPostsBySchool(schoolId: number): Promise<BlogPost[]> {
    return await db.select().from(blogPosts)
      .where(eq(blogPosts.schoolId, schoolId))
      .orderBy(desc(blogPosts.createdAt));
  }

  async createBlogPost(insertBlogPost: InsertBlogPost): Promise<BlogPost> {
    const [blogPost] = await db
      .insert(blogPosts)
      .values([insertBlogPost])
      .returning();
    return blogPost;
  }

  async deleteBlogPost(id: number): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async getTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers).orderBy(desc(teachers.createdAt));
  }

  async getTeachersBySchool(schoolId: number): Promise<Teacher[]> {
    return await db.select().from(teachers)
      .where(eq(teachers.schoolId, schoolId))
      .orderBy(desc(teachers.createdAt));
  }

  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    const [teacher] = await db
      .insert(teachers)
      .values([insertTeacher])
      .returning();
    return teacher;
  }

  async deleteTeacher(id: number): Promise<void> {
    await db.delete(teachers).where(eq(teachers.id, id));
  }

  async getTeachersWithSpecializations(schoolId: number): Promise<any[]> {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        profilePicture: users.profilePicture,
        role: users.role,
        gender: users.gender,
        subjectId: teachingModules.id,
        subjectName: teachingModules.name,
        subjectNameAr: teachingModules.nameAr,
        educationLevel: teachingModules.educationLevel,
        grade: teachingModules.grade
      })
      .from(users)
      .leftJoin(teacherSpecializations, eq(users.id, teacherSpecializations.teacherId))
      .leftJoin(teachingModules, eq(teacherSpecializations.moduleId, teachingModules.id))
      .where(and(eq(users.role, 'teacher'), eq(users.schoolId, schoolId)))
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
          gender: row.gender,
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
      .values([insertMessage])
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

  async getSuggestions(schoolId?: number): Promise<any[]> {
    if (!schoolId) {
      console.warn('getSuggestions called without schoolId - returning empty array for security');
      return [];
    }
    
    return await db
      .select({
        id: suggestions.id,
        userId: suggestions.userId,
        title: suggestions.title,
        content: suggestions.content,
        category: suggestions.category,
        status: suggestions.status,
        createdAt: suggestions.createdAt,
        userName: users.name,
      })
      .from(suggestions)
      .leftJoin(users, eq(suggestions.userId, users.id))
      .where(and(
        eq(suggestions.schoolId, schoolId),
        eq(users.schoolId, schoolId)
      ))
      .orderBy(desc(suggestions.createdAt));
  }

  async createSuggestion(insertSuggestion: InsertSuggestion): Promise<Suggestion> {
    const [suggestion] = await db
      .insert(suggestions)
      .values([insertSuggestion])
      .returning();
    return suggestion;
  }

  async getGroups(): Promise<Group[]> {
    return await db.select().from(groups).orderBy(desc(groups.createdAt));
  }

  async getGroupsBySchool(schoolId: number): Promise<Group[]> {
    return await db.select().from(groups)
      .where(eq(groups.schoolId, schoolId))
      .orderBy(desc(groups.createdAt));
  }

  async getGroupById(id: number): Promise<Group | undefined> {
    const result = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
    return result[0];
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const [group] = await db
      .insert(groups)
      .values([insertGroup])
      .returning();
    return group;
  }

  async deleteGroup(id: number): Promise<void> {
    await db.delete(groups).where(eq(groups.id, id));
  }

  // Admin group management methods
  async getAdminGroups(schoolId?: number): Promise<any[]> {
    try {
      if (!schoolId) {
        console.warn('getAdminGroups called without schoolId - returning empty array for security');
        return [];
      }
      
      // Get teaching modules - filter by school if provided
      const allModules = await db.select().from(teachingModules)
        .where(or(eq(teachingModules.schoolId, schoolId), eq(teachingModules.schoolId, null)))
        .orderBy(teachingModules.educationLevel, teachingModules.name);
      
      // Generate all possible groups based on education levels and subjects
      const allPossibleGroups = [];
      
      for (const module of allModules) {
        // Check if there are existing groups for this module
        let existingGroupsQuery = db
          .select({
            id: groups.id,
            name: groups.name,
            description: groups.description,
            category: groups.category,
            educationLevel: groups.educationLevel,
            subjectId: groups.subjectId,
            teacherId: groups.teacherId,
            subjectName: teachingModules.name,
            nameAr: teachingModules.nameAr,
            teacherName: users.name,
            createdAt: groups.createdAt
          })
          .from(groups)
          .leftJoin(teachingModules, eq(groups.subjectId, teachingModules.id))
          .leftJoin(users, eq(groups.teacherId, users.id));
        
        if (schoolId) {
          existingGroupsQuery = existingGroupsQuery.where(and(
            eq(groups.educationLevel, module.educationLevel),
            eq(groups.subjectId, module.id),
            eq(groups.schoolId, schoolId)
          ));
        } else {
          existingGroupsQuery = existingGroupsQuery.where(and(
            eq(groups.educationLevel, module.educationLevel),
            eq(groups.subjectId, module.id)
          ));
        }
        
        const existingGroups = await existingGroupsQuery;
        
        if (existingGroups.length === 0) {
          // Create a placeholder group for this subject
          allPossibleGroups.push({
            id: null,
            name: `مجموعة ${module.nameAr || module.name}`,
            description: `مجموعة تعليمية لمادة ${module.nameAr || module.name}`,
            category: 'دراسية',
            educationLevel: module.educationLevel,
            subjectId: module.id,
            teacherId: null,
            subjectName: module.name,
            nameAr: module.nameAr,
            teacherName: null,
            createdAt: null,
            studentsAssigned: [],
            isPlaceholder: true
          });
        } else {
          // Add existing groups with their assigned students
          for (const group of existingGroups) {
            // Get assigned students for this group
            const assignedStudents = await db
              .select({
                id: users.id,
                name: users.name,
                educationLevel: students.educationLevel,
                grade: students.grade
              })
              .from(groupUserAssignments)
              .leftJoin(users, eq(groupUserAssignments.userId, users.id))
              .leftJoin(students, eq(users.id, students.userId))
              .where(eq(groupUserAssignments.groupId, group.id));

            allPossibleGroups.push({
              ...group,
              studentsAssigned: assignedStudents,
              isPlaceholder: false
            });
          }
        }
      }

      return allPossibleGroups;
    } catch (error) {
      console.error('Error in getAdminGroups:', error);
      throw error;
    }
  }

  async updateGroupAssignments(groupId: number | null, studentIds: number[], teacherId: number, groupData?: any, schoolId?: number, adminId?: number): Promise<Group> {
    let actualGroupId = groupId;
    
    // If groupId is null, create a new group first
    if (!groupId && groupData && schoolId) {
      const [newGroup] = await db
        .insert(groups)
        .values({
          schoolId: schoolId,
          name: groupData.name,
          description: groupData.description,
          category: groupData.category,
          educationLevel: groupData.educationLevel,
          subjectId: groupData.subjectId,
          teacherId: teacherId,
          isAdminManaged: true
        })
        .returning();
      actualGroupId = newGroup.id;
    } else if (actualGroupId) {
      // Update existing group's teacher
      await db
        .update(groups)
        .set({ teacherId })
        .where(eq(groups.id, actualGroupId));
    }

    if (actualGroupId) {
      // Remove existing student assignments
      await db.delete(groupUserAssignments).where(eq(groupUserAssignments.groupId, actualGroupId));

      // Add new student assignments
      if (studentIds.length > 0) {
        const assignments = studentIds.map(studentId => ({
          schoolId: schoolId!,
          groupId: actualGroupId,
          userId: studentId,
          assignedBy: adminId || null // Use actual admin ID
        }));
        await db.insert(groupUserAssignments).values(assignments);
      }

      // Return the updated group
      const [updatedGroup] = await db.select().from(groups).where(eq(groups.id, actualGroupId));
      return updatedGroup;
    }

    throw new Error('Failed to create or update group');
  }

  async getAvailableStudentsByLevelAndSubject(educationLevel: string, subjectId: number): Promise<any[]> {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        educationLevel: students.educationLevel,
        grade: students.grade
      })
      .from(users)
      .leftJoin(students, eq(users.id, students.userId))
      .where(
        and(
          eq(users.role, 'student'),
          eq(students.educationLevel, educationLevel)
        )
      )
      .orderBy(users.name);

    return result;
  }

  async deleteGroup(groupId: number, schoolId: number): Promise<boolean> {
    try {
      // Delete in correct order to respect foreign key constraints
      
      // 1. Delete group attendance records
      await db.delete(groupAttendance).where(eq(groupAttendance.groupId, groupId));
      
      // 2. Delete group financial transactions
      await db.delete(groupTransactions).where(eq(groupTransactions.groupId, groupId));
      
      // 3. Delete group schedule assignments
      await db.delete(groupScheduleAssignments).where(eq(groupScheduleAssignments.groupId, groupId));
      
      // 4. Delete group registrations
      await db.delete(groupRegistrations).where(eq(groupRegistrations.groupId, groupId));
      
      // 5. Delete group user assignments
      await db.delete(groupUserAssignments).where(eq(groupUserAssignments.groupId, groupId));
      
      // 6. Finally delete the group itself
      const result = await db
        .delete(groups)
        .where(and(eq(groups.id, groupId), eq(groups.schoolId, schoolId)))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }

  async getFormations(): Promise<Formation[]> {
    return await db.select().from(formations).orderBy(desc(formations.createdAt));
  }

  async getFormationsBySchool(schoolId: number): Promise<Formation[]> {
    return await db.select().from(formations)
      .where(eq(formations.schoolId, schoolId))
      .orderBy(desc(formations.createdAt));
  }

  async createFormation(insertFormation: InsertFormation): Promise<Formation> {
    const [formation] = await db
      .insert(formations)
      .values([insertFormation])
      .returning();
    return formation;
  }

  async deleteFormation(id: number): Promise<void> {
    await db.delete(formations).where(eq(formations.id, id));
  }

  async createGroupRegistration(insertGroupRegistration: InsertGroupRegistration): Promise<GroupRegistration> {
    const [registration] = await db
      .insert(groupRegistrations)
      .values([insertGroupRegistration])
      .returning();
    return registration;
  }

  async createFormationRegistration(insertFormationRegistration: InsertFormationRegistration): Promise<FormationRegistration> {
    const [registration] = await db
      .insert(formationRegistrations)
      .values([insertFormationRegistration])
      .returning();
    return registration;
  }

  async getNotifications(userId: number, schoolId?: number): Promise<Notification[]> {
    if (!schoolId) {
      console.warn('getNotifications called without schoolId - returning empty array for security');
      return [];
    }
    
    return await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.schoolId, schoolId)
      ))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values([insertNotification])
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

  async getUnreadNotificationCount(userId: number, schoolId?: number): Promise<number> {
    if (!schoolId) {
      console.warn('getUnreadNotificationCount called without schoolId - returning 0 for security');
      return 0;
    }
    
    const result = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.schoolId, schoolId),
        eq(notifications.read, false)
      ));
    return result.length;
  }

  async createNotificationForUsers(userIds: number[], type: string, title: string, message: string, relatedId?: number, schoolId?: number): Promise<Notification[]> {
    if (!schoolId) {
      console.warn('createNotificationForUsers called without schoolId - skipping notification creation for security');
      return [];
    }
    
    const notificationPromises = userIds.map(userId => 
      this.createNotification({
        userId,
        type,
        title,
        message,
        relatedId,
        schoolId
      })
    );
    return await Promise.all(notificationPromises);
  }

  // Verification methods - only for children and students

  async verifyChild(childId: number, adminId: number, notes?: string, educationLevel?: string, selectedSubjects?: string[]): Promise<Child> {
    const updateData: any = {
      verified: true, 
      verificationNotes: notes || null,
      verifiedAt: new Date(),
      verifiedBy: adminId
    };
    
    if (educationLevel) {
      updateData.educationLevel = educationLevel;
    }
    
    if (selectedSubjects && selectedSubjects.length > 0) {
      updateData.subjects = selectedSubjects;
    }
    
    const [child] = await db
      .update(children)
      .set(updateData)
      .where(eq(children.id, childId))
      .returning();
    return child;
  }

  async verifyStudent(studentId: number, adminId: number, notes?: string, educationLevel?: string, selectedSubjects?: string[]): Promise<Student> {
    const updateData: any = {
      verified: true, 
      verificationNotes: notes || null,
      verifiedAt: new Date(),
      verifiedBy: adminId
    };
    
    if (educationLevel) {
      updateData.educationLevel = educationLevel;
    }
    
    if (selectedSubjects && selectedSubjects.length > 0) {
      updateData.selectedSubjects = selectedSubjects;
    }
    
    const [student] = await db
      .update(students)
      .set(updateData)
      .where(eq(students.id, studentId))
      .returning();
    return student;
  }

  async getUnverifiedChildren(schoolId: number): Promise<Child[]> {
    return await db.select().from(children).where(and(eq(children.verified, false), eq(children.schoolId, schoolId))).orderBy(desc(children.createdAt));
  }

  async getUnverifiedStudents(schoolId: number): Promise<any[]> {
    return await db
      .select({
        id: students.id,
        userId: students.userId,
        educationLevel: students.educationLevel,
        grade: students.grade,
        createdAt: students.createdAt,
        verified: students.verified,
        name: users.name
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .where(and(eq(students.verified, false), eq(users.role, 'student'), eq(students.schoolId, schoolId)))
      .orderBy(desc(students.createdAt));
  }

  async getVerifiedChildren(schoolId: number): Promise<any[]> {
    return await db
      .select({
        id: children.id,
        parentId: children.parentId,
        name: children.name,
        educationLevel: children.educationLevel,
        grade: children.grade,
        verified: children.verified,
        verifiedAt: children.verifiedAt,
        verifiedBy: children.verifiedBy,
        verificationNotes: children.verificationNotes,
        selectedSubjects: children.selectedSubjects,
        createdAt: children.createdAt,
        schoolId: children.schoolId
      })
      .from(children)
      .where(and(eq(children.verified, true), eq(children.schoolId, schoolId)))
      .orderBy(desc(children.verifiedAt));
  }

  async getVerifiedStudents(schoolId: number): Promise<any[]> {
    return await db
      .select({
        id: students.id,
        userId: students.userId,
        educationLevel: students.educationLevel,
        grade: students.grade,
        verified: students.verified,
        verifiedAt: students.verifiedAt,
        verifiedBy: students.verifiedBy,
        verificationNotes: students.verificationNotes,
        selectedSubjects: students.selectedSubjects,
        name: users.name
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .where(and(eq(students.verified, true), eq(users.role, 'student'), eq(students.schoolId, schoolId)))
      .orderBy(desc(students.verifiedAt));
  }

  async undoVerifyChild(childId: number): Promise<Child> {
    const [child] = await db
      .update(children)
      .set({
        verified: false,
        verificationNotes: null,
        verifiedAt: null,
        verifiedBy: null,
        selectedSubjects: null
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
        verifiedBy: null,
        selectedSubjects: null
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

  // Phone verification methods
  async savePhoneVerificationCode(userId: number, code: string, expiry: Date): Promise<void> {
    await db
      .update(users)
      .set({ 
        phoneVerificationCode: code,
        phoneVerificationExpiry: expiry
      })
      .where(eq(users.id, userId));
  }

  async verifyPhoneCode(userId: number, code: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user || !user.phoneVerificationCode || !user.phoneVerificationExpiry) {
      return false;
    }

    // Check if code matches and is not expired
    const isCodeValid = user.phoneVerificationCode === code;
    const isNotExpired = user.phoneVerificationExpiry > new Date();
    
    return isCodeValid && isNotExpired;
  }

  async markPhoneAsVerified(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        phoneVerified: true,
        phoneVerificationCode: null,
        phoneVerificationExpiry: null
      })
      .where(eq(users.id, userId));
  }

  async saveEmailVerificationCode(userId: number, code: string, expiry: Date): Promise<void> {
    await db
      .update(users)
      .set({ emailVerificationCode: code, emailVerificationExpiry: expiry })
      .where(eq(users.id, userId));
  }

  async verifyEmailCode(userId: number, code: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.emailVerificationCode || !user.emailVerificationExpiry) {
      return false;
    }

    const now = new Date();
    if (now > user.emailVerificationExpiry) {
      return false; // Code expired
    }

    return user.emailVerificationCode === code.trim();
  }

  async markEmailAsVerified(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ emailVerified: true, emailVerificationCode: null, emailVerificationExpiry: null })
      .where(eq(users.id, userId));
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

  async getTeachingModulesBySchool(schoolId: number): Promise<TeachingModule[]> {
    return await db
      .select()
      .from(teachingModules)
      .where(or(eq(teachingModules.schoolId, schoolId), eq(teachingModules.schoolId, null)))
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

  // Schedule table methods
  async getScheduleTables(): Promise<ScheduleTable[]> {
    return await db.select().from(scheduleTables).orderBy(desc(scheduleTables.createdAt));
  }

  async getScheduleTablesBySchool(schoolId: number): Promise<ScheduleTable[]> {
    return await db.select().from(scheduleTables)
      .where(eq(scheduleTables.schoolId, schoolId))
      .orderBy(desc(scheduleTables.createdAt));
  }

  async getScheduleTable(id: number): Promise<ScheduleTable | undefined> {
    const [table] = await db.select().from(scheduleTables).where(eq(scheduleTables.id, id));
    return table;
  }

  async createScheduleTable(insertTable: InsertScheduleTable): Promise<ScheduleTable> {
    const [table] = await db
      .insert(scheduleTables)
      .values(insertTable)
      .returning();
    return table;
  }

  async updateScheduleTable(id: number, updates: Partial<InsertScheduleTable>): Promise<ScheduleTable> {
    const [table] = await db
      .update(scheduleTables)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(scheduleTables.id, id))
      .returning();
    return table;
  }

  async deleteScheduleTable(id: number): Promise<void> {
    await db.delete(scheduleTables).where(eq(scheduleTables.id, id));
  }

  // Schedule cell methods
  async getScheduleCells(scheduleTableId: number): Promise<ScheduleCell[]> {
    return await db
      .select()
      .from(scheduleCells)
      .where(eq(scheduleCells.scheduleTableId, scheduleTableId))
      .orderBy(scheduleCells.dayOfWeek, scheduleCells.period);
  }

  async getScheduleCell(id: number): Promise<ScheduleCell | undefined> {
    const [cell] = await db.select().from(scheduleCells).where(eq(scheduleCells.id, id));
    return cell;
  }

  async createScheduleCell(insertCell: InsertScheduleCell): Promise<ScheduleCell> {
    const [cell] = await db
      .insert(scheduleCells)
      .values(insertCell)
      .returning();
    return cell;
  }

  async updateScheduleCell(id: number, updates: Partial<InsertScheduleCell>): Promise<ScheduleCell> {
    const [cell] = await db
      .update(scheduleCells)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(scheduleCells.id, id))
      .returning();
    return cell;
  }

  async deleteScheduleCell(id: number): Promise<void> {
    await db.delete(scheduleCells).where(eq(scheduleCells.id, id));
  }

  // Group Attendance methods
  async getGroupAttendance(groupId: number, date?: string): Promise<GroupAttendance[]> {
    const query = db
      .select()
      .from(groupAttendance)
      .where(eq(groupAttendance.groupId, groupId));
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      return await query
        .where(and(
          eq(groupAttendance.groupId, groupId),
          and(
            sql`${groupAttendance.attendanceDate} >= ${startOfDay}`,
            sql`${groupAttendance.attendanceDate} <= ${endOfDay}`
          )
        ))
        .orderBy(desc(groupAttendance.attendanceDate));
    }
    
    return await query.orderBy(desc(groupAttendance.attendanceDate));
  }

  async markAttendance(attendance: InsertGroupAttendance): Promise<GroupAttendance> {
    // Check if attendance record already exists for this student on this date
    const attendanceDateStart = new Date(attendance.attendanceDate);
    attendanceDateStart.setHours(0, 0, 0, 0);
    const attendanceDateEnd = new Date(attendance.attendanceDate);
    attendanceDateEnd.setHours(23, 59, 59, 999);

    const existing = await db
      .select()
      .from(groupAttendance)
      .where(and(
        eq(groupAttendance.groupId, attendance.groupId),
        eq(groupAttendance.studentId, attendance.studentId),
        and(
          sql`${groupAttendance.attendanceDate} >= ${attendanceDateStart}`,
          sql`${groupAttendance.attendanceDate} <= ${attendanceDateEnd}`
        )
      ))
      .limit(1);

    if (existing.length > 0) {
      // Update existing record
      const [result] = await db
        .update(groupAttendance)
        .set({ 
          status: attendance.status,
          notes: attendance.notes,
          markedBy: attendance.markedBy,
          updatedAt: new Date()
        })
        .where(eq(groupAttendance.id, existing[0].id))
        .returning();
      return result;
    } else {
      // Create new record
      const [result] = await db
        .insert(groupAttendance)
        .values(attendance)
        .returning();
      return result;
    }
  }

  async updateAttendance(id: number, updates: Partial<InsertGroupAttendance>): Promise<GroupAttendance> {
    const [result] = await db
      .update(groupAttendance)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(groupAttendance.id, id))
      .returning();
    return result;
  }

  async getAttendanceWithStudentDetails(groupId: number, date?: string): Promise<any[]> {
    const query = db
      .select({
        id: groupAttendance.id,
        attendanceDate: groupAttendance.attendanceDate,
        status: groupAttendance.status,
        notes: groupAttendance.notes,
        student: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        markedBy: {
          id: sql`marker.id`,
          name: sql`marker.name`,
        },
        createdAt: groupAttendance.createdAt,
        updatedAt: groupAttendance.updatedAt,
      })
      .from(groupAttendance)
      .leftJoin(users, eq(groupAttendance.studentId, users.id))
      .leftJoin(aliasedTable(users, 'marker'), eq(groupAttendance.markedBy, sql`marker.id`))
      .where(eq(groupAttendance.groupId, groupId));

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      return await query
        .where(and(
          eq(groupAttendance.groupId, groupId),
          and(
            sql`${groupAttendance.attendanceDate} >= ${startOfDay}`,
            sql`${groupAttendance.attendanceDate} <= ${endOfDay}`
          )
        ))
        .orderBy(desc(groupAttendance.attendanceDate));
    }
    
    return await query.orderBy(desc(groupAttendance.attendanceDate));
  }

  async getGroupAttendanceHistory(groupId: number, schoolId: number): Promise<any[]> {
    return await db
      .select({
        id: groupAttendance.id,
        studentId: groupAttendance.studentId,
        studentName: users.name,
        status: groupAttendance.status,
        attendanceDate: groupAttendance.attendanceDate,
        createdAt: groupAttendance.createdAt,
      })
      .from(groupAttendance)
      .leftJoin(users, eq(groupAttendance.studentId, users.id))
      .where(and(
        eq(groupAttendance.groupId, groupId),
        eq(groupAttendance.schoolId, schoolId)
      ))
      .orderBy(desc(groupAttendance.attendanceDate), desc(groupAttendance.createdAt));
  }

  // Group Financial Transaction methods
  async getGroupTransactions(groupId: number, studentId?: number): Promise<GroupTransaction[]> {
    let query = db
      .select()
      .from(groupTransactions)
      .where(eq(groupTransactions.groupId, groupId));
    
    if (studentId) {
      query = query.where(and(
        eq(groupTransactions.groupId, groupId),
        eq(groupTransactions.studentId, studentId)
      ));
    }
    
    return await query.orderBy(desc(groupTransactions.createdAt));
  }

  async createTransaction(transaction: InsertGroupTransaction): Promise<GroupTransaction> {
    const [result] = await db
      .insert(groupTransactions)
      .values(transaction)
      .returning();
    return result;
  }

  async updateTransaction(id: number, updates: Partial<InsertGroupTransaction>): Promise<GroupTransaction> {
    const [result] = await db
      .update(groupTransactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(groupTransactions.id, id))
      .returning();
    return result;
  }

  async getTransactionsWithDetails(groupId: number): Promise<any[]> {
    return await db
      .select({
        id: groupTransactions.id,
        transactionType: groupTransactions.transactionType,
        amount: groupTransactions.amount,
        currency: groupTransactions.currency,
        description: groupTransactions.description,
        dueDate: groupTransactions.dueDate,
        paidDate: groupTransactions.paidDate,
        paymentMethod: groupTransactions.paymentMethod,
        status: groupTransactions.status,
        notes: groupTransactions.notes,
        student: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        recordedBy: {
          id: sql`recorder.id`,
          name: sql`recorder.name`,
        },
        createdAt: groupTransactions.createdAt,
        updatedAt: groupTransactions.updatedAt,
      })
      .from(groupTransactions)
      .leftJoin(users, eq(groupTransactions.studentId, users.id))
      .leftJoin(aliasedTable(users, 'recorder'), eq(groupTransactions.recordedBy, sql`recorder.id`))
      .where(eq(groupTransactions.groupId, groupId))
      .orderBy(desc(groupTransactions.createdAt));
  }

  async getStudentFinancialSummary(groupId: number, studentId: number): Promise<any> {
    const transactions = await db
      .select()
      .from(groupTransactions)
      .where(and(
        eq(groupTransactions.groupId, groupId),
        eq(groupTransactions.studentId, studentId)
      ));
    
    const totalFees = transactions
      .filter(t => t.transactionType === 'fee')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalPaid = transactions
      .filter(t => t.transactionType === 'payment' && t.status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const pendingAmount = transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const overdueAmount = transactions
      .filter(t => t.status === 'overdue')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalFees,
      totalPaid,
      balance: totalFees - totalPaid,
      pendingAmount,
      overdueAmount,
      transactionCount: transactions.length
    };
  }

  async getScheduleCellsWithDetails(scheduleTableId: number): Promise<any[]> {
    return await db
      .select({
        id: scheduleCells.id,
        dayOfWeek: scheduleCells.dayOfWeek,
        period: scheduleCells.period,
        duration: scheduleCells.duration,
        startTime: scheduleCells.startTime,
        endTime: scheduleCells.endTime,
        educationLevel: scheduleCells.educationLevel,
        grade: scheduleCells.grade,
        gender: scheduleCells.gender,
        subject: {
          id: teachingModules.id,
          name: teachingModules.name,
          nameAr: teachingModules.nameAr,
          educationLevel: teachingModules.educationLevel,
        },
        teacher: {
          id: users.id,
          name: users.name,
          gender: users.gender,
        },
        createdAt: scheduleCells.createdAt,
        updatedAt: scheduleCells.updatedAt,
      })
      .from(scheduleCells)
      .leftJoin(teachingModules, eq(scheduleCells.subjectId, teachingModules.id))
      .leftJoin(users, eq(scheduleCells.teacherId, users.id))
      .where(eq(scheduleCells.scheduleTableId, scheduleTableId))
      .orderBy(scheduleCells.dayOfWeek, scheduleCells.period);
  }

  // User blocking methods
  async blockUser(blockerId: number, blockedId: number, reason?: string): Promise<BlockedUser> {
    const [blockedUser] = await db
      .insert(blockedUsers)
      .values({ blockerId, blockedId, reason })
      .returning();
    return blockedUser;
  }

  async unblockUser(blockerId: number, blockedId: number): Promise<void> {
    await db
      .delete(blockedUsers)
      .where(
        and(eq(blockedUsers.blockerId, blockerId), eq(blockedUsers.blockedId, blockedId))
      );
  }

  async isUserBlocked(blockerId: number, blockedId: number): Promise<boolean> {
    const [blocked] = await db
      .select()
      .from(blockedUsers)
      .where(
        and(eq(blockedUsers.blockerId, blockerId), eq(blockedUsers.blockedId, blockedId))
      );
    return !!blocked;
  }

  async getBlockedUsers(userId: number): Promise<BlockedUser[]> {
    return await db
      .select()
      .from(blockedUsers)
      .where(eq(blockedUsers.blockerId, userId))
      .orderBy(desc(blockedUsers.createdAt));
  }

  // User reporting methods
  async reportUser(insertReport: InsertUserReport): Promise<UserReport> {
    const [report] = await db
      .insert(userReports)
      .values(insertReport)
      .returning();
    return report;
  }

  async getUserReports(userId: number): Promise<UserReport[]> {
    return await db
      .select()
      .from(userReports)
      .where(eq(userReports.reporterId, userId))
      .orderBy(desc(userReports.createdAt));
  }

  // Admin reporting methods
  async getAllReports(): Promise<any[]> {
    const reporterAlias = aliasedTable(users, 'reporter');
    const reportedAlias = aliasedTable(users, 'reported');
    
    return await db
      .select({
        id: userReports.id,
        reporterId: userReports.reporterId,
        reportedUserId: userReports.reportedUserId,
        messageId: userReports.messageId,
        reason: userReports.reason,
        description: userReports.description,
        status: userReports.status,
        createdAt: userReports.createdAt,
        reporterName: reporterAlias.name,
        reportedUserName: reportedAlias.name,
      })
      .from(userReports)
      .leftJoin(reporterAlias, eq(userReports.reporterId, reporterAlias.id))
      .leftJoin(reportedAlias, eq(userReports.reportedUserId, reportedAlias.id))
      .orderBy(desc(userReports.createdAt));
  }

  async updateReportStatus(reportId: number, status: string): Promise<UserReport> {
    const [report] = await db
      .update(userReports)
      .set({ status })
      .where(eq(userReports.id, reportId))
      .returning();
    return report;
  }

  // User banning methods
  async banUser(userId: number, reason: string, bannedBy: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        banned: true, 
        banReason: reason, 
        bannedAt: new Date(),
        bannedBy 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async unbanUser(userId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        banned: false, 
        banReason: null, 
        bannedAt: null,
        bannedBy: null 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getBannedUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.banned, true))
      .orderBy(desc(users.bannedAt));
  }

  // Enhanced message methods - Get last message from each conversation
  async getMessagesWithUserInfo(userId: number): Promise<any[]> {
    const result = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        teacherId: messages.teacherId,
        subject: messages.subject,
        content: messages.content,
        read: messages.read,
        createdAt: messages.createdAt,
        senderName: users.name,
        senderProfilePicture: users.profilePicture,
        senderEmail: users.email,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(desc(messages.createdAt));

    // Get additional user info for receivers
    const messagesWithCompleteInfo = await Promise.all(
      result.map(async (message) => {
        const receiver = await this.getUser(message.receiverId);
        return {
          ...message,
          receiverName: receiver?.name,
          receiverProfilePicture: receiver?.profilePicture,
        };
      })
    );

    // Group messages by conversation partner and get only the latest message from each
    const conversationMap = new Map<number, any>();
    
    messagesWithCompleteInfo.forEach(message => {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, message);
      }
    });

    return Array.from(conversationMap.values());
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(eq(messages.id, messageId));
  }

  async getConversationBetweenUsers(userId1: number, userId2: number): Promise<any[]> {
    const result = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        teacherId: messages.teacherId,
        subject: messages.subject,
        content: messages.content,
        read: messages.read,
        createdAt: messages.createdAt,
        senderName: users.name,
        senderProfilePicture: users.profilePicture,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(messages.createdAt); // Chronological order for chat history

    return result;
  }

  // Teaching modules/custom subjects methods
  async getTeachingModuleByName(nameAr: string, educationLevel: string): Promise<any | undefined> {
    const [module] = await db
      .select()
      .from(teachingModules)
      .where(and(eq(teachingModules.nameAr, nameAr), eq(teachingModules.educationLevel, educationLevel)));
    return module;
  }

  async getTeachingModuleByNameAllLevels(nameAr: string): Promise<any | undefined> {
    const [module] = await db
      .select()
      .from(teachingModules)
      .where(eq(teachingModules.nameAr, nameAr))
      .limit(1);
    return module;
  }

  async createCustomSubject(subjectData: { name: string, nameAr: string, educationLevel: string, grade?: string, description?: string }) {
    const [customSubject] = await db
      .insert(teachingModules)
      .values({
        name: subjectData.name,
        nameAr: subjectData.nameAr,
        educationLevel: subjectData.educationLevel,
        grade: subjectData.grade,
        description: subjectData.description
      })
      .returning();
    return customSubject;
  }

  // School statistics and management methods
  async getSchoolStatistics(schoolId: number): Promise<any> {
    try {
      // Get user counts by role
      const userCounts = await db
        .select({
          role: users.role,
          count: sql<number>`count(*)`
        })
        .from(users)
        .where(eq(users.schoolId, schoolId))
        .groupBy(users.role);

      // Get children count
      const [childrenCount] = await db
        .select({
          count: sql<number>`count(*)`
        })
        .from(children)
        .leftJoin(users, eq(children.parentId, users.id))
        .where(eq(users.schoolId, schoolId));

      // Get announcements count
      const [announcementsCount] = await db
        .select({
          count: sql<number>`count(*)`
        })
        .from(announcements)
        .where(eq(announcements.schoolId, schoolId));

      // Get blog posts count
      const [blogPostsCount] = await db
        .select({
          count: sql<number>`count(*)`
        })
        .from(blogPosts)
        .where(eq(blogPosts.schoolId, schoolId));

      // Get groups count
      const [groupsCount] = await db
        .select({
          count: sql<number>`count(*)`
        })
        .from(groups)
        .where(eq(groups.schoolId, schoolId));

      // Get formations count
      const [formationsCount] = await db
        .select({
          count: sql<number>`count(*)`
        })
        .from(formations)
        .where(eq(formations.schoolId, schoolId));

      // Process user counts into a readable format
      const stats = {
        totalUsers: 0,
        admins: 0,
        teachers: 0,
        students: 0,
        parents: 0,
        children: childrenCount?.count || 0,
        announcements: announcementsCount?.count || 0,
        blogPosts: blogPostsCount?.count || 0,
        groups: groupsCount?.count || 0,
        formations: formationsCount?.count || 0
      };

      userCounts.forEach(roleCount => {
        const count = parseInt(roleCount.count.toString()) || 0;
        stats.totalUsers += count;
        switch (roleCount.role) {
          case 'admin':
            stats.admins = count;
            break;
          case 'teacher':
            stats.teachers = count;
            break;
          case 'student':
            stats.students = count;
            break;
          case 'user':
            stats.parents = count;
            break;
        }
      });

      // Ensure all stats are proper integers
      return {
        totalUsers: parseInt(stats.totalUsers.toString()) || 0,
        admins: parseInt(stats.admins.toString()) || 0,
        teachers: parseInt(stats.teachers.toString()) || 0,
        students: parseInt(stats.students.toString()) || 0,
        parents: parseInt(stats.parents.toString()) || 0,
        children: parseInt(stats.children.toString()) || 0,
        announcements: parseInt(stats.announcements.toString()) || 0,
        blogPosts: parseInt(stats.blogPosts.toString()) || 0,
        groups: parseInt(stats.groups.toString()) || 0,
        formations: parseInt(stats.formations.toString()) || 0
      };
    } catch (error) {
      console.error('Error getting school statistics:', error);
      throw error;
    }
  }

  async updateSchoolKeys(schoolId: number, adminKey: string, teacherKey: string): Promise<void> {
    await db
      .update(schools)
      .set({
        adminKey,
        teacherKey
      })
      .where(eq(schools.id, schoolId));
  }

  // Group Schedule methods implementation
  async getGroupScheduledLessonDates(groupId: number, schoolId: number): Promise<string[]> {
    try {
      // Get all schedule assignments for this group
      const assignments = await db
        .select({
          scheduleCellId: groupScheduleAssignments.scheduleCellId,
          dayOfWeek: scheduleCells.dayOfWeek,
          startTime: scheduleCells.startTime,
          endTime: scheduleCells.endTime
        })
        .from(groupScheduleAssignments)
        .leftJoin(scheduleCells, eq(groupScheduleAssignments.scheduleCellId, scheduleCells.id))
        .where(
          and(
            eq(groupScheduleAssignments.groupId, groupId),
            eq(groupScheduleAssignments.schoolId, schoolId),
            eq(groupScheduleAssignments.isActive, true)
          )
        );

      // Generate dates for the next 2 years based on scheduled days
      const dates: string[] = [];
      const today = new Date();
      const startOfWeek = new Date(today);
      
      // Adjust for Friday-first week (Friday = 0, Saturday = 1, ..., Thursday = 6)
      // Find the most recent Friday to start from
      const daysSinceFriday = (today.getDay() + 2) % 7; // Convert to Friday-first mapping
      startOfWeek.setDate(today.getDate() - daysSinceFriday);

      for (let week = 0; week < 104; week++) { // 2 years = 104 weeks
        for (const assignment of assignments) {
          if (assignment.dayOfWeek !== null) {
            const lessonDate = new Date(startOfWeek);
            lessonDate.setDate(startOfWeek.getDate() + (week * 7) + assignment.dayOfWeek);
            
            // Only include future dates
            if (lessonDate >= today) {
              dates.push(lessonDate.toISOString().split('T')[0]);
            }
          }
        }
      }

      return dates.sort();
    } catch (error) {
      console.error('Error getting group scheduled lesson dates:', error);
      return [];
    }
  }

  async assignGroupToSchedule(groupId: number, scheduleCellId: number, schoolId: number, assignedBy: number): Promise<any> {
    try {
      const [assignment] = await db
        .insert(groupScheduleAssignments)
        .values({
          groupId,
          scheduleCellId,
          schoolId,
          assignedBy
        })
        .returning();

      return assignment;
    } catch (error) {
      console.error('Error assigning group to schedule:', error);
      throw error;
    }
  }

  async getGroupScheduleAssignments(groupId: number): Promise<any[]> {
    try {
      return await db
        .select({
          id: groupScheduleAssignments.id,
          scheduleCellId: groupScheduleAssignments.scheduleCellId,
          isActive: groupScheduleAssignments.isActive,
          createdAt: groupScheduleAssignments.createdAt,
          dayOfWeek: scheduleCells.dayOfWeek,
          period: scheduleCells.period,
          startTime: scheduleCells.startTime,
          endTime: scheduleCells.endTime,
          educationLevel: scheduleCells.educationLevel,
          tableName: scheduleTables.name
        })
        .from(groupScheduleAssignments)
        .leftJoin(scheduleCells, eq(groupScheduleAssignments.scheduleCellId, scheduleCells.id))
        .leftJoin(scheduleTables, eq(scheduleCells.scheduleTableId, scheduleTables.id))
        .where(eq(groupScheduleAssignments.groupId, groupId))
        .orderBy(scheduleCells.dayOfWeek, scheduleCells.period);
    } catch (error) {
      console.error('Error getting group schedule assignments:', error);
      return [];
    }
  }

  async getCompatibleGroups(subjectId: number, teacherId: number, educationLevel: string, schoolId: number): Promise<any[]> {
    try {
      return await db
        .select({
          id: groups.id,
          name: groups.name,
          educationLevel: groups.educationLevel,
          subjectId: groups.subjectId,
          teacherId: groups.teacherId,
          studentsCount: sql<number>`count(distinct ${groupUserAssignments.userId})::int`
        })
        .from(groups)
        .leftJoin(groupUserAssignments, eq(groups.id, groupUserAssignments.groupId))
        .where(and(
          eq(groups.schoolId, schoolId),
          eq(groups.subjectId, subjectId),
          eq(groups.teacherId, teacherId),
          eq(groups.educationLevel, educationLevel)
        ))
        .groupBy(groups.id, groups.name, groups.educationLevel, groups.subjectId, groups.teacherId)
        .orderBy(groups.name);
    } catch (error) {
      console.error('Error getting compatible groups:', error);
      return [];
    }
  }

  async getScheduleLinkedGroups(tableId: number, schoolId: number): Promise<any[]> {
    try {
      return await db
        .select({
          id: groupScheduleAssignments.id,
          groupId: groupScheduleAssignments.groupId,
          scheduleCellId: groupScheduleAssignments.scheduleCellId,
          groupName: groups.name,
          isActive: groupScheduleAssignments.isActive,
          createdAt: groupScheduleAssignments.createdAt
        })
        .from(groupScheduleAssignments)
        .leftJoin(groups, eq(groupScheduleAssignments.groupId, groups.id))
        .leftJoin(scheduleCells, eq(groupScheduleAssignments.scheduleCellId, scheduleCells.id))
        .where(and(
          eq(groupScheduleAssignments.schoolId, schoolId),
          eq(scheduleCells.scheduleTableId, tableId),
          eq(groupScheduleAssignments.isActive, true)
        ))
        .orderBy(groups.name);
    } catch (error) {
      console.error('Error getting schedule linked groups:', error);
      return [];
    }
  }

  async linkGroupsToScheduleCell(cellId: number, groupIds: number[], schoolId: number, assignedBy: number): Promise<void> {
    try {
      // First, remove all existing assignments for this cell
      await db
        .delete(groupScheduleAssignments)
        .where(and(
          eq(groupScheduleAssignments.scheduleCellId, cellId),
          eq(groupScheduleAssignments.schoolId, schoolId)
        ));

      // Then, add new assignments if groupIds is not empty
      if (groupIds.length > 0) {
        const assignments = groupIds.map(groupId => ({
          groupId,
          scheduleCellId: cellId,
          schoolId,
          assignedBy,
          isActive: true
        }));

        await db
          .insert(groupScheduleAssignments)
          .values(assignments);
      }
    } catch (error) {
      console.error('Error linking groups to schedule cell:', error);
      throw error;
    }
  }

  // Student Monthly Payment methods implementation
  async getStudentPaymentStatus(studentId: number, year: number, month: number, schoolId: number): Promise<StudentMonthlyPayment | undefined> {
    try {
      const [payment] = await db
        .select()
        .from(studentMonthlyPayments)
        .where(and(
          eq(studentMonthlyPayments.studentId, studentId),
          eq(studentMonthlyPayments.year, year),
          eq(studentMonthlyPayments.month, month),
          eq(studentMonthlyPayments.schoolId, schoolId)
        ));
      return payment || undefined;
    } catch (error) {
      console.error('Error getting student payment status:', error);
      return undefined;
    }
  }

  async getStudentsPaymentStatusForMonth(studentIds: number[], year: number, month: number, schoolId: number): Promise<StudentMonthlyPayment[]> {
    try {
      if (studentIds.length === 0) return [];
      
      return await db
        .select()
        .from(studentMonthlyPayments)
        .where(and(
          inArray(studentMonthlyPayments.studentId, studentIds),
          eq(studentMonthlyPayments.year, year),
          eq(studentMonthlyPayments.month, month),
          eq(studentMonthlyPayments.schoolId, schoolId)
        ));
    } catch (error) {
      console.error('Error getting students payment status:', error);
      return [];
    }
  }

  async markStudentPayment(studentId: number, year: number, month: number, isPaid: boolean, schoolId: number, paidBy: number, amount?: number, notes?: string): Promise<StudentMonthlyPayment> {
    try {
      // Check if payment record exists
      const existingPayment = await this.getStudentPaymentStatus(studentId, year, month, schoolId);
      
      if (existingPayment) {
        // Update existing record
        const [updatedPayment] = await db
          .update(studentMonthlyPayments)
          .set({
            isPaid,
            amount: amount ? amount.toString() : existingPayment.amount,
            paidAt: isPaid ? new Date() : null,
            paidBy: isPaid ? paidBy : null,
            notes,
            updatedAt: new Date()
          })
          .where(eq(studentMonthlyPayments.id, existingPayment.id))
          .returning();
        return updatedPayment;
      } else {
        // Create new record
        const [newPayment] = await db
          .insert(studentMonthlyPayments)
          .values({
            studentId,
            year,
            month,
            isPaid,
            amount: amount ? amount.toString() : null,
            paidAt: isPaid ? new Date() : null,
            paidBy: isPaid ? paidBy : null,
            notes,
            schoolId
          })
          .returning();
        return newPayment;
      }
    } catch (error) {
      console.error('Error marking student payment:', error);
      throw error;
    }
  }

  async createDefaultMonthlyPayments(studentIds: number[], year: number, month: number, schoolId: number): Promise<void> {
    try {
      if (studentIds.length === 0) return;
      
      // Get existing payments to avoid duplicates
      const existingPayments = await this.getStudentsPaymentStatusForMonth(studentIds, year, month, schoolId);
      const existingStudentIds = existingPayments.map(p => p.studentId);
      
      // Filter out students who already have payment records
      const newStudentIds = studentIds.filter(id => !existingStudentIds.includes(id));
      
      if (newStudentIds.length === 0) return;
      
      // Create default unpaid records for new students
      const defaultPayments = newStudentIds.map(studentId => ({
        studentId,
        year,
        month,
        isPaid: false,
        schoolId
      }));
      
      await db.insert(studentMonthlyPayments).values(defaultPayments);
    } catch (error) {
      console.error('Error creating default monthly payments:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
