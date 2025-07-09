import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, Settings, Shield, GraduationCap, Users, Phone, Mail, Save } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('تم تحديث الملف الشخصي بنجاح');
    } catch (error) {
      alert('حدث خطأ أثناء تحديث البيانات');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'teacher':
        return <GraduationCap className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'مدير';
      case 'teacher':
        return 'معلم';
      default:
        return 'طالب';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">يرجى تسجيل الدخول</h2>
          <p className="text-gray-600">تحتاج إلى تسجيل الدخول لعرض الملف الشخصي</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">الملف الشخصي</h2>
          <Badge className={`${getRoleColor(user.role)} flex items-center gap-1`}>
            {getRoleIcon(user.role)}
            {getRoleLabel(user.role)}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500">منذ {new Date(user.createdAt).toLocaleDateString('ar-SA')}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            البيانات الشخصية
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            الإعدادات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                تحديث البيانات الشخصية
              </CardTitle>
              <CardDescription>
                يمكنك تحديث معلوماتك الشخصية من هنا
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="الاسم الكامل"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="البريد الإلكتروني"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="رقم الهاتف"
                    className="mt-1"
                  />
                </div>
                
                <Button type="submit" disabled={loading} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                إعدادات الحساب
              </CardTitle>
              <CardDescription>
                إدارة إعدادات حسابك والأمان
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">معلومات الحساب</h4>
                  <p className="text-sm text-gray-600">عرض معلومات الحساب الأساسية</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <Phone className="w-4 h-4" />
                    {user.phone}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">نوع الحساب</h4>
                  <p className="text-sm text-gray-600">صلاحياتك الحالية في النظام</p>
                </div>
                <Badge className={`${getRoleColor(user.role)} flex items-center gap-1`}>
                  {getRoleIcon(user.role)}
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
              
              <div className="pt-4 border-t">
                <Button 
                  variant="destructive" 
                  onClick={logout}
                  className="w-full"
                >
                  تسجيل الخروج
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}