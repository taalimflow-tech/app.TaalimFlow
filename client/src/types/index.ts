export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'teacher' | 'user' | 'student';
  createdAt: Date;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  authorId: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  bio?: string;
  imageUrl?: string;
  email: string;
  phone?: string;
  available: boolean;
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  teacherId: string;
  subject: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

export interface Suggestion {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  status: 'pending' | 'reviewed' | 'implemented';
  createdAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
  maxMembers?: number;
  createdAt: Date;
}

export interface Formation {
  id: string;
  title: string;
  description: string;
  duration: string;
  price: string;
  imageUrl?: string;
  category: string;
  createdAt: Date;
}

export interface GroupRegistration {
  id: string;
  groupId: string;
  fullName: string;
  phone: string;
  email: string;
  createdAt: Date;
}

export interface FormationRegistration {
  id: string;
  formationId: string;
  fullName: string;
  phone: string;
  email: string;
  createdAt: Date;
}
