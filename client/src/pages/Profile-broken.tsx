import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Settings, Shield, GraduationCap, Users, Phone, Mail, Save, Plus, Trash2, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Child {
  id: number;
  name: string;
  educationLevel: string;
  grade: string;
  parentId: number;
  createdAt: string;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChild, setNewChild] = useState({
    name: '',
    educationLevel: '',
    grade: ''
  });
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const educationLevels = {
    'الابتدائي': [
      '5 سنوات',
      'السنة الأولى ابتدائي',
      'السنة الثانية ابتدائي',
      'السنة الثالثة ابتدائي',
      'السنة الرابعة ابتدائي',
      'السنة الخامسة ابتدائي'
    ],
    'المتوسط': [
      'السنة الأولى متوسط',
      'السنة الثانية متوسط',
      'السنة الثالثة متوسط',
      'السنة الرابعة متوسط'
    ],
    'الثانوي': [
      'السنة الأولى ثانوي',
      'السنة الثانية ثانوي',
      'السنة الثالثة ثانوي'
    ]
  };

  // Fetch children data
  const { data: children = [], isLoading: childrenLoading } = useQuery<Child[]>({
    queryKey: ['/api/children'],
    enabled: !!user,
  });

  // Add child mutation
  const addChildMutation = useMutation({
    mutationFn: async (childData: typeof newChild) => {
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(childData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add child');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      setNewChild({ name: '', educationLevel: '', grade: '' });
      setShowAddChild(false);
      toast({ title: 'تم إضافة الطفل بنجاح' });
    },
    onError: () => {
      toast({ 
        title: 'خطأ في إضافة الطفل', 
        variant: 'destructive' 
      });
    }
  });

  // Delete child mutation
  const deleteChildMutation = useMutation({
    mutationFn: async (childId: number) => {
      const response = await fetch(`/api/children/${childId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete child');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      toast({ title: 'تم حذف الطفل بنجاح' });
    },
    onError: () => {
      toast({ 
        title: 'خطأ في حذف الطفل', 
        variant: 'destructive' 
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: 'تم تحديث الملف الشخصي بنجاح' });
    } catch (error) {
      toast({ title: 'حدث خطأ أثناء تحديث البيانات', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newChild.name || !newChild.educationLevel || !newChild.grade) {
      toast({ title: 'يرجى ملء جميع الحقول', variant: 'destructive' });
      return;
    }

    if (children.length >= 5) {
      toast({ title: 'لا يمكن إضافة أكثر من 5 أطفال', variant: 'destructive' });
      return;
    }

    addChildMutation.mutate(newChild);
  };

  const handleDeleteChild = (childId: number) => {
    if (window.confirm('هل أنت متأكد من حذف بيانات هذا الطفل؟')) {
      deleteChildMutation.mutate(childId);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'teacher':
        return <GraduationCap className="w-4 h-4" />;
      case 'student':
        return <User className="w-4 h-4" />;
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
      case 'student':
        return 'طالب';
      default:
        return 'ولي أمر';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-purple-100 text-purple-800';
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
            <p className="text-sm text-gray-500">منذ {new Date(user.createdAt).toLocaleDateString('en-US')}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={`grid w-full ${user.role === 'student' ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            الملف الشخصي
          </TabsTrigger>
          {user.role !== 'student' && (
            <TabsTrigger value="children" className="flex items-center gap-2">
              <Baby className="w-4 h-4" />
              الأطفال
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                تحديث البيانات الشخصية
              </CardTitle>
              <CardDescription>
                يمكنك تحديث معلوماتك الشخصية من هنا
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    الاسم الكامل
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل اسمك الكامل"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="أدخل بريدك الإلكتروني"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    رقم الهاتف
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="أدخل رقم هاتفك"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'جاري التحديث...' : 'تحديث البيانات'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {user.role !== 'student' && (
          <TabsContent value="children" className="space-y-4">
            <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Baby className="w-5 h-5" />
                    إدارة الأطفال
                  </CardTitle>
                  <CardDescription>
                    عرض وإدارة بيانات الأطفال المسجلين
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setShowAddChild(true)}
                  disabled={children.length >= 5}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  إضافة طفل
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {childrenLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">جاري تحميل البيانات...</p>
                </div>
              ) : children.length === 0 ? (
                <div className="text-center py-8">
                  <Baby className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">لا يوجد أطفال مسجلين</h3>
                  <p className="text-sm text-gray-500 mb-4">يمكنك إضافة بيانات الأطفال من هنا</p>
                  <Button onClick={() => setShowAddChild(true)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    إضافة الطفل الأول
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {children.map((child) => (
                    <div key={child.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                          <Baby className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{child.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Badge variant="secondary">{child.educationLevel}</Badge>
                            <span>{child.grade}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteChild(child.id)}
                        className="text-red-500 hover:text-red-700"
                        disabled={deleteChildMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 text-xs text-gray-500">
                عدد الأطفال المسجلين: {children.length} / 5
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Child Modal */}
      {showAddChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">إضافة طفل جديد</h2>
              <button
                onClick={() => setShowAddChild(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddChild} className="space-y-4">
              <div>
                <Label htmlFor="child-name">اسم الطفل</Label>
                <Input
                  id="child-name"
                  type="text"
                  value={newChild.name}
                  onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                  placeholder="أدخل اسم الطفل"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="child-level">المرحلة التعليمية</Label>
                <Select
                  value={newChild.educationLevel}
                  onValueChange={(value) => setNewChild({ ...newChild, educationLevel: value, grade: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المرحلة التعليمية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="الابتدائي">الابتدائي</SelectItem>
                    <SelectItem value="المتوسط">المتوسط</SelectItem>
                    <SelectItem value="الثانوي">الثانوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newChild.educationLevel && (
                <div>
                  <Label htmlFor="child-grade">السنة الدراسية</Label>
                  <Select
                    value={newChild.grade}
                    onValueChange={(value) => setNewChild({ ...newChild, grade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر السنة الدراسية" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationLevels[newChild.educationLevel as keyof typeof educationLevels]?.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddChild(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={addChildMutation.isPending}
                >
                  {addChildMutation.isPending ? 'جاري الإضافة...' : 'إضافة الطفل'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}