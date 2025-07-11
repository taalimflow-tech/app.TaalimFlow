import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, User, Users, GraduationCap, Clock, Calendar } from 'lucide-react';

interface UnverifiedUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  verified: boolean;
}

interface UnverifiedChild {
  id: number;
  parentId: number;
  name: string;
  educationLevel: string;
  grade: string;
  createdAt: string;
  verified: boolean;
}

interface UnverifiedStudent {
  id: number;
  userId: number;
  educationLevel: string;
  grade: string;
  createdAt: string;
  verified: boolean;
}

export default function AdminVerification() {
  const { user } = useAuth();
  const [unverifiedUsers, setUnverifiedUsers] = useState<UnverifiedUser[]>([]);
  const [unverifiedChildren, setUnverifiedChildren] = useState<UnverifiedChild[]>([]);
  const [unverifiedStudents, setUnverifiedStudents] = useState<UnverifiedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [selectedItem, setSelectedItem] = useState<{type: string, id: number} | null>(null);

  const fetchUnverifiedData = async () => {
    try {
      const [usersResponse, childrenResponse, studentsResponse] = await Promise.all([
        fetch('/api/admin/unverified-users'),
        fetch('/api/admin/unverified-children'),
        fetch('/api/admin/unverified-students')
      ]);

      if (usersResponse.ok) {
        const users = await usersResponse.json();
        setUnverifiedUsers(users);
      }

      if (childrenResponse.ok) {
        const children = await childrenResponse.json();
        setUnverifiedChildren(children);
      }

      if (studentsResponse.ok) {
        const students = await studentsResponse.json();
        setUnverifiedStudents(students);
      }
    } catch (error) {
      console.error('Error fetching unverified data:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب البيانات غير المتحقق منها',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (type: string, id: number) => {
    try {
      const response = await fetch(`/api/admin/verify-${type}/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: verificationNotes }),
      });

      if (response.ok) {
        toast({
          title: 'تم التحقق بنجاح',
          description: `تم التحقق من ${type === 'user' ? 'المستخدم' : type === 'child' ? 'الطفل' : 'الطالب'} بنجاح`,
        });

        // Refresh data
        await fetchUnverifiedData();
        setVerificationNotes('');
        setSelectedItem(null);
      } else {
        const error = await response.json();
        toast({
          title: 'خطأ في التحقق',
          description: error.error || 'فشل في التحقق',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error verifying:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في عملية التحقق',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchUnverifiedData();
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">صلاحيات المدير مطلوبة</CardTitle>
            <CardDescription className="text-center">
              هذه الصفحة متاحة للمدراء فقط
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">لوحة التحقق من المستخدمين</h1>
        <p className="text-gray-600">
          راجع وتحقق من المستخدمين والأطفال والطلاب الذين قدموا وثائقهم
        </p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            المستخدمون ({unverifiedUsers.length})
          </TabsTrigger>
          <TabsTrigger value="children" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            الأطفال ({unverifiedChildren.length})
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            الطلاب ({unverifiedStudents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                المستخدمون غير المتحقق منهم
              </CardTitle>
              <CardDescription>
                قائمة المستخدمين الذين يحتاجون للتحقق من هوياتهم
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unverifiedUsers.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد مستخدمون بحاجة للتحقق</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {unverifiedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <p className="text-gray-600">{user.email}</p>
                        <p className="text-gray-600">{user.phone}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{user.role}</Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                          </div>
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            onClick={() => setSelectedItem({type: 'user', id: user.id})}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            تحقق
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>التحقق من المستخدم</DialogTitle>
                            <DialogDescription>
                              تأكد من صحة بيانات المستخدم قبل التحقق
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="notes">ملاحظات التحقق (اختياري)</Label>
                              <Textarea
                                id="notes"
                                value={verificationNotes}
                                onChange={(e) => setVerificationNotes(e.target.value)}
                                placeholder="أضف ملاحظات حول عملية التحقق..."
                                className="mt-2"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedItem(null);
                                  setVerificationNotes('');
                                }}
                              >
                                إلغاء
                              </Button>
                              <Button
                                onClick={() => handleVerify('user', user.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                تأكيد التحقق
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="children" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                الأطفال غير المتحقق منهم
              </CardTitle>
              <CardDescription>
                قائمة الأطفال الذين يحتاجون للتحقق من بياناتهم التعليمية
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unverifiedChildren.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد أطفال بحاجة للتحقق</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {unverifiedChildren.map((child) => (
                    <div key={child.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{child.name}</h3>
                        <p className="text-gray-600">المستوى التعليمي: {child.educationLevel}</p>
                        <p className="text-gray-600">الصف: {child.grade}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(child.createdAt).toLocaleDateString('ar-SA')}
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            onClick={() => setSelectedItem({type: 'child', id: child.id})}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            تحقق
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>التحقق من الطفل</DialogTitle>
                            <DialogDescription>
                              تأكد من صحة بيانات الطفل التعليمية قبل التحقق
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="notes">ملاحظات التحقق (اختياري)</Label>
                              <Textarea
                                id="notes"
                                value={verificationNotes}
                                onChange={(e) => setVerificationNotes(e.target.value)}
                                placeholder="أضف ملاحظات حول عملية التحقق..."
                                className="mt-2"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedItem(null);
                                  setVerificationNotes('');
                                }}
                              >
                                إلغاء
                              </Button>
                              <Button
                                onClick={() => handleVerify('child', child.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                تأكيد التحقق
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                الطلاب غير المتحقق منهم
              </CardTitle>
              <CardDescription>
                قائمة الطلاب الذين يحتاجون للتحقق من بياناتهم التعليمية
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unverifiedStudents.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد طلاب بحاجة للتحقق</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {unverifiedStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">طالب رقم {student.userId}</h3>
                        <p className="text-gray-600">المستوى التعليمي: {student.educationLevel}</p>
                        <p className="text-gray-600">الصف: {student.grade}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(student.createdAt).toLocaleDateString('ar-SA')}
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            onClick={() => setSelectedItem({type: 'student', id: student.id})}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            تحقق
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>التحقق من الطالب</DialogTitle>
                            <DialogDescription>
                              تأكد من صحة بيانات الطالب التعليمية قبل التحقق
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="notes">ملاحظات التحقق (اختياري)</Label>
                              <Textarea
                                id="notes"
                                value={verificationNotes}
                                onChange={(e) => setVerificationNotes(e.target.value)}
                                placeholder="أضف ملاحظات حول عملية التحقق..."
                                className="mt-2"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedItem(null);
                                  setVerificationNotes('');
                                }}
                              >
                                إلغاء
                              </Button>
                              <Button
                                onClick={() => handleVerify('student', student.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                تأكيد التحقق
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}