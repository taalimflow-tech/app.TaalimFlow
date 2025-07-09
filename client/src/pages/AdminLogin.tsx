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
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

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
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                مدير
              </TabsTrigger>
              <TabsTrigger value="teacher" className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                معلم
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-4">
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
            </TabsContent>
            
            <TabsContent value="teacher">
              <form onSubmit={handleTeacherLogin} className="space-y-4">
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
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center">
            <a 
              href="/"
              className="text-sm text-gray-600 hover:text-primary underline cursor-pointer"
            >
              العودة لتسجيل دخول الطلاب
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}