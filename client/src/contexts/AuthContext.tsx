import { useState, useEffect, createContext, ReactNode, useContext } from 'react';
import { User } from '@shared/schema';

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
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
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
    
    // Database-only authentication - no Firebase needed
    
    setUser(user);
  };

  const register = async (email: string, password: string, name: string, phone: string, children: any[] = [], role: string = 'user', studentData?: { educationLevel: string, grade: string }) => {
    // First try to create user in our database
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
    
    // Database-only registration - no Firebase needed
    
    const { user } = await response.json();
    setUser(user);
  };

  const logout = async () => {
    try {
      // Database-only logout - no Firebase needed
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
      
      // Get current school context
      const schoolCode = sessionStorage.getItem('schoolCode');
      
      // Redirect to school selection page if we have school context, otherwise to public home
      if (schoolCode) {
        window.location.href = `/school/${schoolCode}`;
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Always clear user state even if logout fails
      setUser(null);
      
      // Fallback redirect
      const schoolCode = sessionStorage.getItem('schoolCode');
      if (schoolCode) {
        window.location.href = `/school/${schoolCode}`;
      } else {
        window.location.href = '/';
      }
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