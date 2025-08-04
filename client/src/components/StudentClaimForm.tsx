import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

interface StudentClaimFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface StudentInfo {
  available: boolean;
  studentName?: string;
  educationLevel?: string;
  grade?: string;
}

export function StudentClaimForm({ onSuccess, onCancel }: StudentClaimFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'check' | 'claim'>('check');
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  
  const [checkData, setCheckData] = useState({
    studentId: ''
  });
  
  const [claimData, setClaimData] = useState({
    studentId: '',
    email: '',
    password: '',
    name: '',
    phone: '',
    gender: ''
  });

  // Check student ID mutation
  const checkMutation = useMutation({
    mutationFn: async (data: { studentId: string }) => {
      const response = await fetch('/api/auth/check-student-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: parseInt(data.studentId) })
      });
      if (!response.ok) throw new Error('Failed to check student ID');
      return response.json();
    },
    onSuccess: (data) => {
      setStudentInfo(data);
      if (data.available) {
        setClaimData(prev => ({ 
          ...prev, 
          studentId: checkData.studentId,
          name: data.studentName || ''
        }));
        setStep('claim');
        toast({
          title: '✅ رقم الطالب صحيح',
          description: `تم العثور على الطالب: ${data.studentName}`
        });
      } else {
        toast({
          title: '❌ رقم غير صحيح',
          description: 'رقم الطالب غير موجود أو مربوط بحساب آخر',
          variant: 'destructive'
        });
      }
    },
    onError: () => {
      toast({
        title: '❌ خطأ',
        description: 'حدث خطأ في التحقق من رقم الطالب',
        variant: 'destructive'
      });
    }
  });

  // Claim account mutation
  const claimMutation = useMutation({
    mutationFn: async (data: typeof claimData) => {
      const response = await fetch('/api/auth/claim-student-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: parseInt(data.studentId),
          email: data.email,
          password: data.password,
          name: data.name,
          phone: data.phone,
          gender: data.gender
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to claim account');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: '🎉 تم ربط الحساب بنجاح',
        description: `مرحباً ${data.user.name}! تم ربط حسابك بنجاح`
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: '❌ خطأ في ربط الحساب',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleCheckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkData.studentId) {
      toast({
        title: '⚠️ بيانات ناقصة',
        description: 'يرجى إدخال رقم الطالب',
        variant: 'destructive'
      });
      return;
    }
    checkMutation.mutate(checkData);
  };

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimData.email || !claimData.password || !claimData.name || !claimData.phone || !claimData.gender) {
      toast({
        title: '⚠️ بيانات ناقصة',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }
    claimMutation.mutate(claimData);
  };

  if (step === 'check') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            ربط حساب طالب موجود
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCheckSubmit} className="space-y-4">
            <div>
              <Label htmlFor="studentId">رقم الطالب *</Label>
              <Input
                id="studentId"
                type="number"
                value={checkData.studentId}
                onChange={(e) => setCheckData({ studentId: e.target.value })}
                placeholder="أدخل رقم الطالب المعطى لك من الإدارة"
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                احصل على رقم الطالب من إدارة المدرسة
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={checkMutation.isPending}
              >
                {checkMutation.isPending ? 'جاري التحقق...' : 'التحقق من الرقم'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                إلغاء
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">كيفية الحصول على رقم الطالب:</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. اتصل بإدارة المدرسة</li>
              <li>2. أخبرهم أنك تريد ربط حسابك في التطبيق</li>
              <li>3. سيعطونك رقماً خاصاً بك</li>
              <li>4. استخدم هذا الرقم هنا</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          إنشاء حساب الطالب
        </CardTitle>
      </CardHeader>
      <CardContent>
        {studentInfo && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <p className="text-green-800 font-semibold">{studentInfo.studentName}</p>
            <p className="text-green-700 text-sm">
              {studentInfo.educationLevel} - {studentInfo.grade}
            </p>
          </div>
        )}

        <form onSubmit={handleClaimSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">الاسم الكامل *</Label>
            <Input
              id="name"
              value={claimData.name}
              onChange={(e) => setClaimData({ ...claimData, name: e.target.value })}
              placeholder="أدخل اسمك الكامل"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">البريد الإلكتروني *</Label>
            <Input
              id="email"
              type="email"
              value={claimData.email}
              onChange={(e) => setClaimData({ ...claimData, email: e.target.value })}
              placeholder="example@email.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">كلمة المرور *</Label>
            <Input
              id="password"
              type="password"
              value={claimData.password}
              onChange={(e) => setClaimData({ ...claimData, password: e.target.value })}
              placeholder="أدخل كلمة مرور قوية"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">رقم الهاتف *</Label>
            <Input
              id="phone"
              type="tel"
              value={claimData.phone}
              onChange={(e) => setClaimData({ ...claimData, phone: e.target.value })}
              placeholder="05xxxxxxxx"
              required
            />
          </div>

          <div>
            <Label htmlFor="gender">الجنس *</Label>
            <Select value={claimData.gender} onValueChange={(value) => setClaimData({ ...claimData, gender: value })}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الجنس" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ذكر">ذكر</SelectItem>
                <SelectItem value="أنثى">أنثى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={claimMutation.isPending}
            >
              {claimMutation.isPending ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setStep('check')}
            >
              رجوع
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}