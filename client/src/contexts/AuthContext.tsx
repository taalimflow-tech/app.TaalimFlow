import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Temporarily bypass Firebase auth and set loading to false
    // TODO: Fix Firebase configuration
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password: string) => {
    // Temporarily create a mock user for development
    // TODO: Replace with actual authentication
    const mockUser: User = {
      id: '1',
      email: email,
      name: 'مستخدم تجريبي',
      phone: '0555123456',
      role: 'user',
      firebaseUid: '1',
      createdAt: new Date(),
    };
    
    setUser(mockUser);
    setFirebaseUser(null);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const register = async (email: string, password: string, name: string, phone: string, role: string = 'user') => {
    // Temporarily create a mock user for development
    // TODO: Replace with actual authentication
    const mockUser: User = {
      id: '1',
      email: email,
      name: name,
      phone: phone,
      role: role as 'admin' | 'teacher' | 'user',
      firebaseUid: '1',
      createdAt: new Date(),
    };
    
    setUser(mockUser);
    setFirebaseUser(null);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const logout = async () => {
    setUser(null);
    setFirebaseUser(null);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
  };

  const value = {
    user,
    firebaseUser,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
