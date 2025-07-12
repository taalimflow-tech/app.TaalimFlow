import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Plus, FileText, Users, BookOpen, X, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface CreateFormData {
  title: string;
  content: string;
  description: string;
  subject: string;
  category: string;
  duration: string;
  price: string;
  maxMembers: string;
  name: string;
  bio: string;
  email: string;
  phone: string;
}

export default function AdminContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  const [activeTab, setActiveTab] = useState<'blog' | 'group' | 'formation' | 'teacher'>('blog');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateFormData>({
    title: '',
    content: '',
    description: '',
    subject: '',
    category: '',
    duration: '',
    price: '',
    maxMembers: '',
    name: '',
    bio: '',
    email: '',
    phone: ''
  });

  // Blog creation mutation
  const createBlogMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/blog-posts', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم إنشاء المقال بنجاح' });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts'] });
    },
    onError: () => {
      toast({ title: 'خطأ في إنشاء المقال', variant: 'destructive' });
    }
  });

  // Group creation mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/groups', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم إنشاء المجموعة بنجاح' });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
    },
    onError: () => {
      toast({ title: 'خطأ في إنشاء المجموعة', variant: 'destructive' });
    }
  });

  // Formation creation mutation
  const createFormationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/formations', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم إنشاء التكوين بنجاح' });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/formations'] });
    },
    onError: () => {
      toast({ title: 'خطأ في إنشاء التكوين', variant: 'destructive' });
    }
  });

  // Teacher creation mutation
  const createTeacherMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/teachers', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم إنشاء المعلم بنجاح' });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
    },
    onError: () => {
      toast({ title: 'خطأ في إنشاء المعلم', variant: 'destructive' });
    }
  });

  // Delete mutations
  const deleteBlogMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/blog-posts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم حذف المقال بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts'] });
    },
    onError: () => {
      toast({ title: 'خطأ في حذف المقال', variant: 'destructive' });
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/groups/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم حذف المجموعة بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
    },
    onError: () => {
      toast({ title: 'خطأ في حذف المجموعة', variant: 'destructive' });
    }
  });

  const deleteFormationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/formations/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم حذف التكوين بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['/api/formations'] });
    },
    onError: () => {
      toast({ title: 'خطأ في حذف التكوين', variant: 'destructive' });
    }
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/teachers/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم حذف المعلم بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
    },
    onError: () => {
      toast({ title: 'خطأ في حذف المعلم', variant: 'destructive' });
    }
  });

  // Fetch existing content
  const { data: blogPosts = [] } = useQuery({
    queryKey: ['/api/blog-posts'],
    enabled: activeTab === 'blog'
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['/api/groups'],
    enabled: activeTab === 'group'
  });

  const { data: formations = [] } = useQuery({
    queryKey: ['/api/formations'],
    enabled: activeTab === 'formation'
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['/api/teachers'],
    enabled: activeTab === 'teacher'
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      description: '',
      subject: '',
      category: '',
      duration: '',
      price: '',
      maxMembers: '',
      name: '',
      bio: '',
      email: '',
      phone: ''
    });
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'blog') {
      createBlogMutation.mutate({
        title: formData.title,
        content: formData.content,
        authorId: user?.id,
        published: true
      });
    } else if (activeTab === 'group') {
      createGroupMutation.mutate({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        maxMembers: formData.maxMembers ? parseInt(formData.maxMembers) : null
      });
    } else if (activeTab === 'formation') {
      createFormationMutation.mutate({
        title: formData.title,
        description: formData.description,
        duration: formData.duration,
        price: formData.price,
        category: formData.category
      });
    } else if (activeTab === 'teacher') {
      createTeacherMutation.mutate({
        name: formData.name,
        subject: formData.subject,
        bio: formData.bio,
        email: formData.email,
        phone: formData.phone,
        available: true
      });
    }
  };

  const tabs = [
    { id: 'blog', label: 'المقالات', icon: FileText },
    { id: 'group', label: 'المجموعات', icon: Users },
    { id: 'formation', label: 'التكوينات', icon: BookOpen },
    { id: 'teacher', label: 'المعلمين', icon: Users }
  ];

  if (user?.role !== 'admin') {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">غير مسموح لك بالوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/admin')}
            variant="outline"
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            إدارة المستخدمين
          </Button>
          <h2 className="text-2xl font-bold text-gray-800">إدارة المحتوى</h2>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          إضافة جديد
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 space-x-reverse px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-100 text-purple-700 border border-purple-300'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {activeTab === 'blog' && 'إنشاء مقال جديد'}
              {activeTab === 'group' && 'إنشاء مجموعة جديدة'}
              {activeTab === 'formation' && 'إنشاء تكوين جديد'}
              {activeTab === 'teacher' && 'إضافة معلم جديد'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Blog Fields */}
              {activeTab === 'blog' && (
                <>
                  <div>
                    <Label htmlFor="title">عنوان المقال</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="اكتب عنوان المقال"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">محتوى المقال</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="اكتب محتوى المقال"
                      rows={8}
                      required
                    />
                  </div>
                </>
              )}

              {/* Group Fields */}
              {activeTab === 'group' && (
                <>
                  <div>
                    <Label htmlFor="name">اسم المجموعة</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="اكتب اسم المجموعة"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">وصف المجموعة</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="اكتب وصف المجموعة"
                      rows={4}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">الفئة</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="فئة المجموعة"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxMembers">أقصى عدد أعضاء</Label>
                    <Input
                      id="maxMembers"
                      type="number"
                      value={formData.maxMembers}
                      onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                      placeholder="أقصى عدد أعضاء (اختياري)"
                    />
                  </div>
                </>
              )}

              {/* Formation Fields */}
              {activeTab === 'formation' && (
                <>
                  <div>
                    <Label htmlFor="title">عنوان التكوين</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="اكتب عنوان التكوين"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">وصف التكوين</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="اكتب وصف التكوين"
                      rows={4}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">مدة التكوين</Label>
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="مثال: 3 أشهر"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">السعر</Label>
                    <Input
                      id="price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="مثال: 15000 دج"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">الفئة</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="فئة التكوين"
                      required
                    />
                  </div>
                </>
              )}

              {/* Teacher Fields */}
              {activeTab === 'teacher' && (
                <>
                  <div>
                    <Label htmlFor="name">اسم المعلم</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="اكتب اسم المعلم"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">المادة</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="المادة التي يدرسها"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="البريد الإلكتروني للمعلم"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="رقم هاتف المعلم"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">نبذة عن المعلم</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="اكتب نبذة عن المعلم"
                      rows={3}
                    />
                  </div>
                </>
              )}

              <div className="flex space-x-2 space-x-reverse pt-4">
                <Button
                  type="submit"
                  disabled={
                    createBlogMutation.isPending ||
                    createGroupMutation.isPending ||
                    createFormationMutation.isPending ||
                    createTeacherMutation.isPending
                  }
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {(createBlogMutation.isPending || createGroupMutation.isPending || 
                    createFormationMutation.isPending || createTeacherMutation.isPending)
                    ? 'جاري الإنشاء...'
                    : 'إنشاء'
                  }
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="text-gray-600"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Content List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'blog' && `المقالات الموجودة (${blogPosts.length})`}
            {activeTab === 'group' && `المجموعات الموجودة (${groups.length})`}
            {activeTab === 'formation' && `التكوينات الموجودة (${formations.length})`}
            {activeTab === 'teacher' && `المعلمين الموجودين (${teachers.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Blog Posts List */}
            {activeTab === 'blog' && (
              <>
                {blogPosts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">لا توجد مقالات</p>
                ) : (
                  blogPosts.map((post: any) => (
                    <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{post.title}</h4>
                        <p className="text-sm text-gray-600 mt-1 truncate">{post.content}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(post.createdAt).toLocaleDateString('en-US')}
                        </p>
                      </div>
                      <Button
                        onClick={() => deleteBlogMutation.mutate(post.id)}
                        disabled={deleteBlogMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Groups List */}
            {activeTab === 'group' && (
              <>
                {groups.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">لا توجد مجموعات</p>
                ) : (
                  groups.map((group: any) => (
                    <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{group.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                        <div className="flex gap-4 mt-1">
                          <span className="text-xs text-gray-500">الفئة: {group.category}</span>
                          {group.maxMembers && (
                            <span className="text-xs text-gray-500">أقصى عدد: {group.maxMembers}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteGroupMutation.mutate(group.id)}
                        disabled={deleteGroupMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Formations List */}
            {activeTab === 'formation' && (
              <>
                {formations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">لا توجد تكوينات</p>
                ) : (
                  formations.map((formation: any) => (
                    <div key={formation.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{formation.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{formation.description}</p>
                        <div className="flex gap-4 mt-1">
                          <span className="text-xs text-gray-500">المدة: {formation.duration}</span>
                          <span className="text-xs text-gray-500">السعر: {formation.price}</span>
                          <span className="text-xs text-gray-500">الفئة: {formation.category}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteFormationMutation.mutate(formation.id)}
                        disabled={deleteFormationMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Teachers List */}
            {activeTab === 'teacher' && (
              <>
                {teachers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">لا يوجد معلمين</p>
                ) : (
                  teachers.map((teacher: any) => (
                    <div key={teacher.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{teacher.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">المادة: {teacher.subject}</p>
                        <div className="flex gap-4 mt-1">
                          {teacher.email && (
                            <span className="text-xs text-gray-500">البريد: {teacher.email}</span>
                          )}
                          {teacher.phone && (
                            <span className="text-xs text-gray-500">الهاتف: {teacher.phone}</span>
                          )}
                        </div>
                        {teacher.bio && (
                          <p className="text-xs text-gray-500 mt-1 truncate">{teacher.bio}</p>
                        )}
                      </div>
                      <Button
                        onClick={() => deleteTeacherMutation.mutate(teacher.id)}
                        disabled={deleteTeacherMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-purple-800 mb-2">تعليمات:</h3>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• يمكنك إنشاء مقالات جديدة في المدونة</li>
            <li>• إضافة مجموعات تعليمية للطلاب</li>
            <li>• إنشاء تكوينات مهنية</li>
            <li>• إضافة معلمين جدد</li>
            <li>• حذف أي محتوى غير مرغوب فيه باستخدام زر الحذف</li>
            <li>• إنشاء تكوينات ودورات تدريبية</li>
            <li>• إضافة معلمين جدد للمنصة</li>
            <li>• جميع المحتوى سيظهر للمستخدمين فور إنشائه</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}