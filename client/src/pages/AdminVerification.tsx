import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Users, GraduationCap, Clock, Calendar, Trash2 } from 'lucide-react';

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

interface VerifiedChild {
  id: number;
  parentId: number;
  name: string;
  educationLevel: string;
  grade: string;
  verified: boolean;
  verifiedAt: string;
  verifiedBy: number;
  verificationNotes: string;
}

interface VerifiedStudent {
  id: number;
  userId: number;
  educationLevel: string;
  grade: string;
  verified: boolean;
  verifiedAt: string;
  verifiedBy: number;
  verificationNotes: string;
}

export default function AdminVerification() {
  const { user } = useAuth();
  const [unverifiedChildren, setUnverifiedChildren] = useState<UnverifiedChild[]>([]);
  const [unverifiedStudents, setUnverifiedStudents] = useState<UnverifiedStudent[]>([]);
  const [verifiedChildren, setVerifiedChildren] = useState<VerifiedChild[]>([]);
  const [verifiedStudents, setVerifiedStudents] = useState<VerifiedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [selectedItem, setSelectedItem] = useState<{type: string, id: number, data?: any} | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    try {
      const [
        unverifiedChildrenResponse,
        unverifiedStudentsResponse,
        verifiedChildrenResponse,
        verifiedStudentsResponse
      ] = await Promise.all([
        fetch('/api/admin/unverified-children'),
        fetch('/api/admin/unverified-students'),
        fetch('/api/admin/verified-children'),
        fetch('/api/admin/verified-students')
      ]);

      if (unverifiedChildrenResponse.ok) {
        const children = await unverifiedChildrenResponse.json();
        setUnverifiedChildren(children);
      }

      if (unverifiedStudentsResponse.ok) {
        const students = await unverifiedStudentsResponse.json();
        setUnverifiedStudents(students);
      }

      if (verifiedChildrenResponse.ok) {
        const children = await verifiedChildrenResponse.json();
        setVerifiedChildren(children);
      }

      if (verifiedStudentsResponse.ok) {
        const students = await verifiedStudentsResponse.json();
        setVerifiedStudents(students);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب البيانات',
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
          description: `تم التحقق من ${type === 'child' ? 'الطفل' : 'الطالب'} بنجاح`,
        });

        // Refresh data
        await fetchData();
        setVerificationNotes('');
        setSelectedItem(null);
        setShowModal(false);
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

  const handleUndoVerification = async (type: string, id: number) => {
    try {
      const endpoint = type === 'verified-child' ? 'child' : 'student';
      const response = await fetch(`/api/admin/undo-verify-${endpoint}/${id}`, {
        method: 'POST'
      });

      if (response.ok) {
        toast({
          title: "تم بنجاح",
          description: `تم إلغاء التحقق من ${type === 'verified-child' ? 'الطفل' : 'الطالب'}`,
        });
        
        setShowModal(false);
        setSelectedItem(null);
        fetchData();
      } else {
        throw new Error('Failed to undo verification');
      }
    } catch (error) {
      console.error('Error undoing verification:', error);
      toast({
        title: "خطأ",
        description: "فشل في إلغاء التحقق",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">لوحة التحقق من الأطفال والطلاب</h1>
        <p className="text-gray-600">
          راجع وتحقق من الأطفال والطلاب الذين قدموا وثائقهم في المدرسة
        </p>
      </div>

      <Tabs defaultValue="unverified-children" className="w-full">
        <div className="w-full overflow-x-auto">
          <TabsList className="grid w-full grid-cols-4 min-w-[600px]">
            <TabsTrigger value="unverified-children" className="flex flex-col items-center gap-1 p-2 text-center min-h-[60px]">
              <Clock className="w-4 h-4 shrink-0" />
              <span className="text-xs leading-tight">أطفال غير متحقق</span>
              <span className="text-xs opacity-70">({unverifiedChildren.length})</span>
            </TabsTrigger>
            <TabsTrigger value="unverified-students" className="flex flex-col items-center gap-1 p-2 text-center min-h-[60px]">
              <Clock className="w-4 h-4 shrink-0" />
              <span className="text-xs leading-tight">طلاب غير متحقق</span>
              <span className="text-xs opacity-70">({unverifiedStudents.length})</span>
            </TabsTrigger>
            <TabsTrigger value="verified-children" className="flex flex-col items-center gap-1 p-2 text-center min-h-[60px]">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span className="text-xs leading-tight">أطفال متحقق</span>
              <span className="text-xs opacity-70">({verifiedChildren.length})</span>
            </TabsTrigger>
            <TabsTrigger value="verified-students" className="flex flex-col items-center gap-1 p-2 text-center min-h-[60px]">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span className="text-xs leading-tight">طلاب متحقق</span>
              <span className="text-xs opacity-70">({verifiedStudents.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="unverified-children" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                الأطفال غير المتحقق منهم
              </CardTitle>
              <CardDescription>
                قائمة الأطفال الذين يحتاجون للتحقق من وثائقهم
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
                        <p className="text-sm text-gray-600 mt-1">{child.educationLevel} - {child.grade}</p>
                      </div>
                      <Button 
                        onClick={() => {
                          setSelectedItem({type: 'child', id: child.id});
                          setShowModal(true);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        تحقق
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unverified-students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                الطلاب غير المتحقق منهم
              </CardTitle>
              <CardDescription>
                قائمة الطلاب الذين يحتاجون للتحقق من وثائقهم
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
                        <p className="text-sm text-gray-600 mt-1">{student.educationLevel} - {student.grade}</p>
                      </div>
                      <Button 
                        onClick={() => {
                          setSelectedItem({type: 'student', id: student.id});
                          setShowModal(true);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        تحقق
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verified-children" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                الأطفال المتحقق منهم
              </CardTitle>
              <CardDescription>
                قائمة الأطفال الذين تم التحقق من وثائقهم بنجاح
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verifiedChildren.length === 0 ? (
                <div className="text-center py-8">
                  <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد أطفال متحقق منهم بعد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {verifiedChildren.map((child) => (
                    <div key={child.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{child.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{child.educationLevel} - {child.grade}</p>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedItem({type: 'verified-child', id: child.id, data: child});
                          setShowModal(true);
                        }}
                        className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                      >
                        المعلومات
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verified-students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                الطلاب المتحقق منهم
              </CardTitle>
              <CardDescription>
                قائمة الطلاب الذين تم التحقق من وثائقهم بنجاح
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verifiedStudents.length === 0 ? (
                <div className="text-center py-8">
                  <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد طلاب متحقق منهم بعد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {verifiedStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">طالب رقم {student.userId}</h3>
                        <p className="text-sm text-gray-600 mt-1">{student.educationLevel} - {student.grade}</p>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedItem({type: 'verified-student', id: student.id, data: student});
                          setShowModal(true);
                        }}
                        className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                      >
                        المعلومات
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Custom Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              {selectedItem?.type.startsWith('verified') ? (
                // Details modal for verified items
                <div>
                  <h2 className="text-xl font-bold mb-4">
                    تفاصيل التحقق - {selectedItem?.type === 'verified-child' ? 'الطفل' : 'الطالب'}
                  </h2>
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-800">تم التحقق بنجاح</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        تم التحقق من هذا {selectedItem?.type === 'verified-child' ? 'الطفل' : 'الطالب'} وتأكيد صحة البيانات المقدمة.
                      </p>
                    </div>
                    
                    {/* Verification Details */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h3 className="font-semibold mb-3">تفاصيل التحقق</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">
                            <strong>تاريخ التحقق:</strong> {selectedItem?.data?.verifiedAt && new Date(selectedItem.data.verifiedAt).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">
                            <strong>تم التحقق بواسطة:</strong> المدير (ID: {selectedItem?.data?.verifiedBy})
                          </span>
                        </div>
                        {selectedItem?.data?.verificationNotes && (
                          <div className="mt-3">
                            <p className="text-sm font-semibold mb-1">ملاحظات التحقق:</p>
                            <p className="text-sm text-gray-700 bg-white p-2 rounded border">
                              {selectedItem.data.verificationNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowModal(false);
                          setSelectedItem(null);
                        }}
                      >
                        إغلاق
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => selectedItem && handleUndoVerification(selectedItem.type, selectedItem.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        إلغاء التحقق
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Verification modal for unverified items
                <div>
                  <h2 className="text-xl font-bold mb-4">
                    تحقق من {selectedItem?.type === 'child' ? 'الطفل' : 'الطالب'}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="notes">ملاحظات التحقق (اختياري)</Label>
                      <Textarea
                        id="notes"
                        placeholder="أدخل أي ملاحظات حول عملية التحقق..."
                        value={verificationNotes}
                        onChange={(e) => setVerificationNotes(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowModal(false);
                          setVerificationNotes('');
                          setSelectedItem(null);
                        }}
                      >
                        إلغاء
                      </Button>
                      <Button
                        onClick={() => selectedItem && handleVerify(selectedItem.type, selectedItem.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        تأكيد التحقق
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}