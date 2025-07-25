import { useState, useEffect, createContext, ReactNode, useContext } from 'react';
import { User } from '@shared/schema';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone: string, children?: any[], role?: string, studentData?: { educationLevel: string, grade: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const { user } = await response.json();
          setUser(user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // First try to login with our backend
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
    
    const { user } = await response.json();
    
    // If user exists in database but not in Firebase, try Firebase login (optional)
    if (user.firebase_uid) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (firebaseError) {
        // If Firebase login fails but database login worked, continue with database user
        console.log('Firebase login failed, but database login succeeded');
      }
    }
    
    setUser(user);
  };

  const register = async (email: string, password: string, name: string, phone: string, children: any[] = [], role: string = 'user', studentData?: { educationLevel: string, grade: string }) => {
    // First create Firebase user
    const firebaseUser = await createUserWithEmailAndPassword(auth, email, password);
    
    // Then create user in our database
    const requestBody: any = { email, password, name, phone, role };
    
    if (role === 'student' && studentData) {
      requestBody.educationLevel = studentData.educationLevel;
      requestBody.grade = studentData.grade;
    } else if (role === 'user' && children) {
      requestBody.children = children;
    }
    
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'خطأ في إنشاء الحساب');
    }
    
    const { user } = await response.json();
    setUser(user);
  };

  const logout = async () => {
    const currentUserRole = user?.role;
    
    try {
      // Logout from Firebase
      await signOut(auth);
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
      
      // Redirect based on user role
      if (currentUserRole === 'admin' || currentUserRole === 'teacher') {
        window.location.href = '/admin-login';
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Always clear user state even if logout fails
      setUser(null);
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout
    }}>
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