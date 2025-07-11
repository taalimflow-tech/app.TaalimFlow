import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useLocation, Link } from 'wouter';
import { Shield, GraduationCap } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Step-by-step flow state
  const [currentStep, setCurrentStep] = useState<'action' | 'userType' | 'form'>('action');
  const [selectedAction, setSelectedAction] = useState<'login' | 'register' | null>(null);
  const [selectedUserType, setSelectedUserType] = useState<'admin' | 'teacher' | null>(null);

  // Clear form fields when switching steps
  const clearForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setSecretKey('');
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      
      // Check user role after login
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const { user } = await response.json();
        if (user.role !== 'admin') {
          toast({ 
            title: 'خطأ في الصلاحيات', 
            description: 'هذا الحساب ليس حساب مدير',
            variant: 'destructive'
          });
          return;
        }
        toast({ title: 'تم تسجيل دخول المدير بنجاح' });
        navigate('/admin');
      }
    } catch (error) {
      toast({ 
        title: 'خطأ في تسجيل الدخول', 
        description: error instanceof Error ? error.message : 'تأكد من صحة بيانات المدير',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      
      // Check user role after login
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const { user } = await response.json();
        if (user.role !== 'teacher') {
          toast({ 
            title: 'خطأ في الصلاحيات', 
            description: 'هذا الحساب ليس حساب معلم',
            variant: 'destructive'
          });
          return;
        }
        toast({ title: 'تم تسجيل دخول المعلم بنجاح' });
        navigate('/');
      }
    } catch (error) {
      toast({ 
        title: 'خطأ في تسجيل الدخول', 
        description: error instanceof Error ? error.message : 'تأكد من صحة بيانات المعلم',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/register-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          email, 
          phone, 
          password, 
          adminKey: secretKey 
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطأ في تسجيل المدير');
      }
      
      toast({ title: 'تم تسجيل المدير بنجاح' });
      clearForm();
      setSelectedAction('login');
      setCurrentStep('userType');
    } catch (error) {
      toast({ 
        title: 'خطأ في تسجيل المدير', 
        description: error instanceof Error ? error.message : 'تأكد من صحة البيانات ومفتاح الإدارة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/register-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          email, 
          phone, 
          password, 
          teacherKey: secretKey 
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطأ في تسجيل المعلم');
      }
      
      toast({ title: 'تم تسجيل المعلم بنجاح' });
      clearForm();
      setSelectedAction('login');
      setCurrentStep('userType');
    } catch (error) {
      toast({ 
        title: 'خطأ في تسجيل المعلم', 
        description: error instanceof Error ? error.message : 'تأكد من صحة البيانات ومفتاح المعلم',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">تسجيل دخول الإدارة</CardTitle>
          <CardDescription>للمديرين والمعلمين فقط</CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Step 1: Choose Action */}
          {currentStep === 'action' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">إدارة النظام</h2>
                <p className="text-gray-600">اختر الإجراء المناسب</p>
              </div>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => {
                    clearForm();
                    setSelectedAction('login');
                    setCurrentStep('userType');
                  }}
                  className="w-full py-6 text-lg"
                  variant="outline"
                >
                  تسجيل الدخول
                </Button>
                
                <Button 
                  onClick={() => {
                    clearForm();
                    setSelectedAction('register');
                    setCurrentStep('userType');
                  }}
                  className="w-full py-6 text-lg"
                >
                  إنشاء حساب جديد
                </Button>
              </div>
              
              <div className="mt-8 pt-6 border-t text-center">
                <a 
                  href="/"
                  className="text-sm text-gray-600 hover:text-primary underline cursor-pointer"
                >
                  العودة لتسجيل دخول الطلاب
                </a>
              </div>
            </div>
          )}

          {/* Step 2: Choose User Type */}
          {currentStep === 'userType' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">اختر نوع الحساب</h2>
                <p className="text-gray-600">حدد نوع المستخدم المناسب</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => {
                    setSelectedUserType('admin');
                    setCurrentStep('form');
                  }}
                  className="p-6 h-auto flex flex-col items-center justify-center space-y-3"
                  variant="outline"
                >
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">مدير</div>
                    <div className="text-sm text-gray-500">إدارة النظام والمحتوى</div>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => {
                    setSelectedUserType('teacher');
                    setCurrentStep('form');
                  }}
                  className="p-6 h-auto flex flex-col items-center justify-center space-y-3"
                  variant="outline"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">معلم</div>
                    <div className="text-sm text-gray-500">إدارة الطلاب والمحاضرات</div>
                  </div>
                </Button>
              </div>
              
              <div className="text-center">
                <Button 
                  onClick={() => {
                    clearForm();
                    setCurrentStep('action');
                  }}
                  variant="ghost"
                  className="text-gray-600"
                >
                  ← رجوع
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Forms */}
          {currentStep === 'form' && (
            <div className="space-y-6">
              {/* Admin Login */}
              {selectedAction === 'login' && selectedUserType === 'admin' && (
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">تسجيل دخول المدير</h2>
                    <p className="text-gray-600">أدخل بيانات حساب المدير</p>
                  </div>
                  
                  <form onSubmit={handleAdminLogin} className="space-y-6">
                    <div>
                      <Label htmlFor="admin-email">البريد الإلكتروني</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@school.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="admin-password">كلمة المرور</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                      <Shield className="w-4 h-4 mr-2" />
                      {loading ? 'جاري تسجيل الدخول...' : 'دخول كمدير'}
                    </Button>
                  </form>
                </div>
              )}

              {/* Teacher Login */}
              {selectedAction === 'login' && selectedUserType === 'teacher' && (
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">تسجيل دخول المعلم</h2>
                    <p className="text-gray-600">أدخل بيانات حساب المعلم</p>
                  </div>
                  
                  <form onSubmit={handleTeacherLogin} className="space-y-6">
                    <div>
                      <Label htmlFor="teacher-email">البريد الإلكتروني</Label>
                      <Input
                        id="teacher-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="teacher@school.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="teacher-password">كلمة المرور</Label>
                      <Input
                        id="teacher-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90" disabled={loading}>
                      <GraduationCap className="w-4 h-4 mr-2" />
                      {loading ? 'جاري تسجيل الدخول...' : 'دخول كمعلم'}
                    </Button>
                  </form>
                </div>
              )}

              {/* Admin Registration */}
              {selectedAction === 'register' && selectedUserType === 'admin' && (
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">إنشاء حساب مدير</h2>
                    <p className="text-gray-600">أدخل بيانات المدير الجديد</p>
                  </div>
                  
                  <form onSubmit={handleAdminRegister} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="admin-reg-name">الاسم الكامل</Label>
                        <Input
                          id="admin-reg-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          placeholder="الاسم الكامل"
                        />
                      </div>
                      <div>
                        <Label htmlFor="admin-reg-phone">رقم الهاتف</Label>
                        <Input
                          id="admin-reg-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          placeholder="0555123456"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="admin-reg-email">البريد الإلكتروني</Label>
                        <Input
                          id="admin-reg-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="admin@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="admin-reg-password">كلمة المرور</Label>
                        <Input
                          id="admin-reg-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="كلمة المرور"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4 border-t pt-4">
                      <Label className="text-base font-medium">الأمان</Label>
                      <div>
                        <Label htmlFor="admin-secret-key">مفتاح الإدارة السري</Label>
                        <Input
                          id="admin-secret-key"
                          type="password"
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                          required
                          placeholder="مفتاح الإدارة السري"
                        />
                      </div>
                    </div>
                    
                    <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90">
                      <Shield className="w-4 h-4 mr-2" />
                      {loading ? 'جاري التسجيل...' : 'تسجيل مدير جديد'}
                    </Button>
                  </form>
                </div>
              )}

              {/* Teacher Registration */}
              {selectedAction === 'register' && selectedUserType === 'teacher' && (
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">إنشاء حساب معلم</h2>
                    <p className="text-gray-600">أدخل بيانات المعلم الجديد</p>
                  </div>
                  
                  <form onSubmit={handleTeacherRegister} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="teacher-reg-name">الاسم الكامل</Label>
                        <Input
                          id="teacher-reg-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          placeholder="الاسم الكامل"
                        />
                      </div>
                      <div>
                        <Label htmlFor="teacher-reg-phone">رقم الهاتف</Label>
                        <Input
                          id="teacher-reg-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          placeholder="0555123456"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="teacher-reg-email">البريد الإلكتروني</Label>
                        <Input
                          id="teacher-reg-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="teacher@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="teacher-reg-password">كلمة المرور</Label>
                        <Input
                          id="teacher-reg-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="كلمة المرور"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4 border-t pt-4">
                      <Label className="text-base font-medium">الأمان</Label>
                      <div>
                        <Label htmlFor="teacher-secret-key">مفتاح المعلم السري</Label>
                        <Input
                          id="teacher-secret-key"
                          type="password"
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                          required
                          placeholder="مفتاح المعلم السري"
                        />
                      </div>
                    </div>
                    
                    <Button type="submit" disabled={loading} className="w-full bg-secondary hover:bg-secondary/90">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      {loading ? 'جاري التسجيل...' : 'تسجيل معلم جديد'}
                    </Button>
                  </form>
                </div>
              )}

              {/* Back Button */}
              <div className="text-center">
                <Button 
                  onClick={() => {
                    clearForm();
                    setCurrentStep('userType');
                  }}
                  variant="ghost"
                  className="text-gray-600"
                >
                  ← رجوع
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}