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

  // Check if user has admin privileges
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="bg-white shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-red-700">صلاحيات المدير مطلوبة</CardTitle>
              <CardDescription className="text-gray-600">
                يجب أن تكون مديراً للوصول إلى هذه الصفحة
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                هذه الصفحة مخصصة للمدراء فقط لإدارة التحقق من الأطفال والطلاب
              </p>
              <Button 
                onClick={() => window.location.href = '/'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                العودة إلى الصفحة الرئيسية
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            لوحة التحقق من الأطفال والطلاب
          </h1>
          <p className="text-gray-600 text-sm">
            راجع وتحقق من الأطفال والطلاب الذين قدموا وثائقهم في المدرسة
          </p>
        </div>

        <Tabs defaultValue="unverified" className="w-full">
          <div className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200 rounded-lg">
              <TabsTrigger 
                value="unverified" 
                className="flex items-center gap-2 p-3 text-sm font-medium text-gray-700 data-[state=active]:bg-orange-600 data-[state=active]:text-white"
              >
                <Clock className="w-4 h-4" />
                غير متحقق منهم ({unverifiedChildren.length + unverifiedStudents.length})
              </TabsTrigger>
              <TabsTrigger 
                value="verified" 
                className="flex items-center gap-2 p-3 text-sm font-medium text-gray-700 data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                <CheckCircle className="w-4 h-4" />
                متحقق منهم ({verifiedChildren.length + verifiedStudents.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="unverified" className="space-y-4 mt-2">
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardHeader className="pb-3 bg-gray-50 border-b border-gray-200" dir="rtl">
                <CardTitle className="flex items-center gap-2 text-sm text-gray-900">
                  <Clock className="w-4 h-4 text-orange-600" />
                  الأطفال والطلاب غير المتحقق منهم
                </CardTitle>
                <CardDescription className="text-gray-600 text-xs">
                  قائمة الأطفال والطلاب الذين يحتاجون للتحقق من وثائقهم
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {unverifiedChildren.length === 0 && unverifiedStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">لا توجد أطفال أو طلاب بحاجة للتحقق</p>
                    <p className="text-gray-400 text-sm mt-2">جميع الطلبات قد تم التحقق منها بنجاح</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Unverified Children */}
                    {unverifiedChildren.map((child) => (
                      <div 
                        key={`child-${child.id}`} 
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-blue-100 text-blue-800 text-xs border border-blue-300">
                              طفل
                            </Badge>
                            <h3 className="font-medium text-gray-900">{child.name}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {child.educationLevel} - {child.grade}
                          </p>
                        </div>
                        <Button 
                          onClick={() => {
                            setSelectedItem({type: 'child', id: child.id});
                            setShowModal(true);
                          }}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                        >
                          تحقق
                        </Button>
                      </div>
                    ))}
                    
                    {/* Unverified Students */}
                    {unverifiedStudents.map((student) => (
                      <div 
                        key={`student-${student.id}`} 
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-purple-100 text-purple-800 text-xs border border-purple-300">
                              طالب
                            </Badge>
                            <h3 className="font-medium text-gray-900">طالب رقم {student.userId}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {student.educationLevel} - {student.grade}
                          </p>
                        </div>
                        <Button 
                          onClick={() => {
                            setSelectedItem({type: 'student', id: student.id});
                            setShowModal(true);
                          }}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
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

          <TabsContent value="verified" className="space-y-4 mt-2">
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardHeader className="pb-3 bg-gray-50 border-b border-gray-200" dir="rtl">
                <CardTitle className="flex items-center gap-2 text-sm text-gray-900">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  الأطفال والطلاب المتحقق منهم
                </CardTitle>
                <CardDescription className="text-gray-600 text-xs">
                  قائمة الأطفال والطلاب الذين تم التحقق من وثائقهم بنجاح
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {verifiedChildren.length === 0 && verifiedStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">لا توجد أطفال أو طلاب متحقق منهم بعد</p>
                    <p className="text-gray-400 text-sm mt-2">ابدأ بالتحقق من الطلبات المعلقة</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Verified Children */}
                    {verifiedChildren.map((child) => (
                      <div 
                        key={`verified-child-${child.id}`} 
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-blue-100 text-blue-800 text-xs border border-blue-300">
                              طفل
                            </Badge>
                            <h3 className="font-medium text-gray-900">{child.name}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {child.educationLevel} - {child.grade}
                          </p>
                        </div>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedItem({type: 'verified-child', id: child.id, data: child});
                            setShowModal(true);
                          }}
                          className="text-xs"
                        >
                          تفاصيل
                        </Button>
                      </div>
                    ))}
                    
                    {/* Verified Students */}
                    {verifiedStudents.map((student) => (
                      <div 
                        key={`verified-student-${student.id}`} 
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-purple-100 text-purple-800 text-xs border border-purple-300">
                              طالب
                            </Badge>
                            <h3 className="font-medium text-gray-900">طالب رقم {student.userId}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {student.educationLevel} - {student.grade}
                          </p>
                        </div>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedItem({type: 'verified-student', id: student.id, data: student});
                            setShowModal(true);
                          }}
                          className="text-xs"
                        >
                          تفاصيل
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-lg border border-gray-200">
              <div className="p-6">
                {selectedItem?.type.startsWith('verified') ? (
                  // Details modal for verified items
                  <div>
                    <div className="text-center mb-6" dir="rtl">
                      <div className="inline-flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-semibold text-sm">تفاصيل التحقق</span>
                      </div>
                      <h2 className="text-base font-bold mt-4 text-gray-900">
                        {selectedItem?.type === 'verified-child' ? 'الطفل' : 'الطالب'}
                      </h2>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200" dir="rtl">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-800 text-sm">تم التحقق بنجاح</span>
                        </div>
                        <p className="text-xs text-gray-700">
                          تم التحقق من هذا {selectedItem?.type === 'verified-child' ? 'الطفل' : 'الطالب'} وتأكيد صحة البيانات المقدمة.
                        </p>
                      </div>
                      
                      {/* Verification Details */}
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200" dir="rtl">
                        <h3 className="font-semibold mb-4 text-gray-900 text-sm">
                          تفاصيل التحقق
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                            <Calendar className="w-5 h-5 text-blue-500" />
                            <span className="text-sm">
                              <strong className="text-gray-900">تاريخ التحقق:</strong> 
                              <span className="text-gray-700 mr-1">
                                {selectedItem?.data?.verifiedAt && new Date(selectedItem.data.verifiedAt).toLocaleDateString('en-US')}
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                            <Users className="w-5 h-5 text-purple-500" />
                            <span className="text-sm">
                              <strong className="text-gray-900">تم التحقق بواسطة:</strong> 
                              <span className="text-gray-700 mr-1">المدير (ID: {selectedItem?.data?.verifiedBy})</span>
                            </span>
                          </div>
                          {selectedItem?.data?.verificationNotes && (
                            <div className="mt-4">
                              <p className="text-sm font-semibold mb-2 text-gray-900">ملاحظات التحقق:</p>
                              <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                                {selectedItem.data.verificationNotes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-3 justify-end pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowModal(false);
                            setSelectedItem(null);
                          }}
                          className="bg-white hover:bg-gray-50 border-gray-300"
                        >
                          إغلاق
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => selectedItem && handleUndoVerification(selectedItem.type, selectedItem.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
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
                    <div className="text-center mb-6" dir="rtl">
                      <div className="inline-flex items-center gap-2 bg-orange-600 text-white px-3 py-1 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold text-sm">عملية التحقق</span>
                      </div>
                      <h2 className="text-base font-bold mt-4 text-gray-900">
                        تحقق من {selectedItem?.type === 'child' ? 'الطفل' : 'الطالب'}
                      </h2>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200" dir="rtl">
                        <Label htmlFor="notes" className="text-xs font-semibold text-gray-900 block mb-2">
                          ملاحظات التحقق (اختياري)
                        </Label>
                        <Textarea
                          id="notes"
                          placeholder="أدخل أي ملاحظات حول عملية التحقق..."
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          className="mt-2 border-gray-300 text-sm"
                        />
                      </div>
                      <div className="flex gap-3 justify-end pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowModal(false);
                            setVerificationNotes('');
                            setSelectedItem(null);
                          }}
                          className="bg-white hover:bg-gray-50 border-gray-300"
                        >
                          إلغاء
                        </Button>
                        <Button
                          onClick={() => selectedItem && handleVerify(selectedItem.type, selectedItem.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
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
    </div>
  );
}