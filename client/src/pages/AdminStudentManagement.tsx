import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { RoleProtection } from '@/components/RoleProtection';
import { UserPlus, Users, Copy, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Student {
  id: number;
  name: string;
  gender: string;
  educationLevel: string;
  grade: string;
  verified: boolean;
  userId: number | null;
  createdAt: string;
}

export default function AdminStudentManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    educationLevel: '',
    grade: ''
  });

  // Fetch unclaimed students
  const { data: unclaimedStudents, isLoading, refetch } = useQuery<Student[]>({
    queryKey: ['/api/admin/unclaimed-students'],
    enabled: !!user && user.role === 'admin'
  });

  // Pre-register student mutation
  const preRegisterMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/admin/preregister-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to pre-register student');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: '✅ تم التسجيل بنجاح',
        description: `تم تسجيل الطالب ${data.student.name} برقم ${data.student.id}`
      });
      setFormData({ name: '', gender: '', educationLevel: '', grade: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/unclaimed-students'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ خطأ في التسجيل',
        description: error.message || 'فشل في تسجيل الطالب',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.gender || !formData.educationLevel || !formData.grade) {
      toast({
        title: '⚠️ بيانات ناقصة',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }
    preRegisterMutation.mutate(formData);
  };

  const copyStudentId = (studentId: number, studentName: string) => {
    navigator.clipboard.writeText(studentId.toString());
    toast({
      title: '📋 تم النسخ',
      description: `تم نسخ رقم الطالب ${studentName}: ${studentId}`
    });
  };

  const educationLevels = [
    { value: 'ابتدائي', label: 'التعليم الابتدائي' },
    { value: 'متوسط', label: 'التعليم المتوسط' },
    { value: 'ثانوي', label: 'التعليم الثانوي' }
  ];

  const getGrades = (level: string) => {
    switch (level) {
      case 'ابتدائي':
        return ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'];
      case 'متوسط':
        return ['الأولى متوسط', 'الثانية متوسط', 'الثالثة متوسط', 'الرابعة متوسط'];
      case 'ثانوي':
        return ['الأولى ثانوي', 'الثانية ثانوي', 'الثالثة ثانوي'];
      default:
        return [];
    }
  };

  return (
    <RoleProtection allowedRoles={['admin']}>
      <div className="px-4 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <UserPlus className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold text-gray-800">إدارة الطلاب المسبقة</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pre-registration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-600" />
                تسجيل طالب مسبقاً
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">اسم الطالب *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل اسم الطالب الكامل"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="gender">الجنس *</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الجنس" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ذكر">ذكر</SelectItem>
                      <SelectItem value="أنثى">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="educationLevel">المرحلة التعليمية *</Label>
                  <Select 
                    value={formData.educationLevel} 
                    onValueChange={(value) => setFormData({ ...formData, educationLevel: value, grade: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المرحلة التعليمية" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="grade">الصف الدراسي *</Label>
                  <Select 
                    value={formData.grade} 
                    onValueChange={(value) => setFormData({ ...formData, grade: value })}
                    disabled={!formData.educationLevel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الصف الدراسي" />
                    </SelectTrigger>
                    <SelectContent>
                      {getGrades(formData.educationLevel).map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={preRegisterMutation.isPending}
                >
                  {preRegisterMutation.isPending ? 'جاري التسجيل...' : 'تسجيل الطالب'}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">كيفية عمل النظام:</h3>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. قم بتسجيل الطالب هنا مع بياناته الأساسية</li>
                  <li>2. سيحصل الطالب على رقم طلابي فريد</li>
                  <li>3. أعطي الرقم للطالب ليسجل حسابه</li>
                  <li>4. يستخدم الطالب الرقم لربط حسابه</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Unclaimed Students List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                الطلاب غير المربوطين ({unclaimedStudents?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-gray-600">جاري التحميل...</p>
              ) : unclaimedStudents && unclaimedStudents.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {unclaimedStudents.map((student: Student) => (
                    <div key={student.id} className="p-3 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">{student.name}</h4>
                          <p className="text-sm text-gray-600">
                            {student.educationLevel} - {student.grade}
                          </p>
                          <p className="text-sm text-gray-600">
                            {student.gender}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-lg font-bold text-primary">
                            #{student.id}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyStudentId(student.id, student.name)}
                            className="text-xs"
                          >
                            <Copy className="w-3 h-3 ml-1" />
                            نسخ الرقم
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600">لا توجد طلاب غير مربوطين</p>
              )}

              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">إرشادات للطلاب:</h3>
                <p className="text-sm text-green-700">
                  أخبر الطلاب بالذهاب إلى صفحة التسجيل واختيار "ربط حساب طالب موجود" 
                  واستخدام الرقم المعطى لهم
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleProtection>
  );
}