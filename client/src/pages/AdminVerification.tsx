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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header Section */}
        <div className="mb-6 text-center">
          <div className="relative inline-block">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              لوحة التحقق من الأطفال والطلاب
            </h1>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          </div>
          <p className="text-gray-600 text-sm mt-4 max-w-2xl mx-auto">
            راجع وتحقق من الأطفال والطلاب الذين قدموا وثائقهم في المدرسة بطريقة سهلة ومنظمة
          </p>
        </div>

        <Tabs defaultValue="unverified" className="w-full">
          <div className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl border-0 p-2">
              <TabsTrigger 
                value="unverified" 
                className="flex flex-col items-center gap-2 p-4 text-center min-h-[80px] rounded-lg transition-all duration-300 hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <Clock className="w-6 h-6 shrink-0" />
                <span className="text-sm font-medium leading-tight">غير متحقق منهم</span>
                <span className="text-xs opacity-80 bg-white/20 px-2 py-1 rounded-full">
                  ({unverifiedChildren.length + unverifiedStudents.length})
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="verified" 
                className="flex flex-col items-center gap-2 p-4 text-center min-h-[80px] rounded-lg transition-all duration-300 hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <CheckCircle className="w-6 h-6 shrink-0" />
                <span className="text-sm font-medium leading-tight">متحقق منهم</span>
                <span className="text-xs opacity-80 bg-white/20 px-2 py-1 rounded-full">
                  ({verifiedChildren.length + verifiedStudents.length})
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="unverified" className="space-y-4 mt-2">
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Clock className="w-5 h-5" />
                  </div>
                  الأطفال والطلاب غير المتحقق منهم
                </CardTitle>
                <CardDescription className="text-orange-100 text-sm">
                  قائمة الأطفال والطلاب الذين يحتاجون للتحقق من وثائقهم
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {unverifiedChildren.length === 0 && unverifiedStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="relative">
                      <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4 animate-pulse" />
                      <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
                    </div>
                    <p className="text-gray-600 text-lg">لا توجد أطفال أو طلاب بحاجة للتحقق</p>
                    <p className="text-gray-400 text-sm mt-2">جميع الطلبات قد تم التحقق منها بنجاح</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Unverified Children */}
                    {unverifiedChildren.map((child, index) => (
                      <div 
                        key={`child-${child.id}`} 
                        className="group flex items-center justify-between p-4 bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md">
                              👶 طفل
                            </Badge>
                            <h3 className="font-bold text-lg text-gray-800">{child.name}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                            {child.educationLevel} - {child.grade}
                          </p>
                        </div>
                        <Button 
                          onClick={() => {
                            setSelectedItem({type: 'child', id: child.id});
                            setShowModal(true);
                          }}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                        >
                          ✅ تحقق
                        </Button>
                      </div>
                    ))}
                    
                    {/* Unverified Students */}
                    {unverifiedStudents.map((student, index) => (
                      <div 
                        key={`student-${student.id}`} 
                        className="group flex items-center justify-between p-4 bg-gradient-to-r from-white to-purple-50 border border-purple-200 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in"
                        style={{ animationDelay: `${(unverifiedChildren.length + index) * 100}ms` }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md">
                              🎓 طالب
                            </Badge>
                            <h3 className="font-bold text-lg text-gray-800">طالب رقم {student.userId}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                            {student.educationLevel} - {student.grade}
                          </p>
                        </div>
                        <Button 
                          onClick={() => {
                            setSelectedItem({type: 'student', id: student.id});
                            setShowModal(true);
                          }}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                        >
                          ✅ تحقق
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verified" className="space-y-4 mt-2">
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-white/20 rounded-full">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  الأطفال والطلاب المتحقق منهم
                </CardTitle>
                <CardDescription className="text-green-100 text-sm">
                  قائمة الأطفال والطلاب الذين تم التحقق من وثائقهم بنجاح
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {verifiedChildren.length === 0 && verifiedStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="relative">
                      <XCircle className="w-20 h-20 text-gray-400 mx-auto mb-4 animate-pulse" />
                      <div className="absolute inset-0 bg-gray-400/20 rounded-full blur-xl"></div>
                    </div>
                    <p className="text-gray-600 text-lg">لا توجد أطفال أو طلاب متحقق منهم بعد</p>
                    <p className="text-gray-400 text-sm mt-2">ابدأ بالتحقق من الطلبات المعلقة</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Verified Children */}
                    {verifiedChildren.map((child, index) => (
                      <div 
                        key={`verified-child-${child.id}`} 
                        className="group flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md">
                              👶 طفل
                            </Badge>
                            <h3 className="font-bold text-lg text-gray-800">{child.name}</h3>
                            <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span className="text-xs text-green-700 font-medium">متحقق</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                            {child.educationLevel} - {child.grade}
                          </p>
                        </div>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setSelectedItem({type: 'verified-child', id: child.id, data: child});
                            setShowModal(true);
                          }}
                          className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                        >
                          📋 المعلومات
                        </Button>
                      </div>
                    ))}
                    
                    {/* Verified Students */}
                    {verifiedStudents.map((student, index) => (
                      <div 
                        key={`verified-student-${student.id}`} 
                        className="group flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in"
                        style={{ animationDelay: `${(verifiedChildren.length + index) * 100}ms` }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md">
                              🎓 طالب
                            </Badge>
                            <h3 className="font-bold text-lg text-gray-800">طالب رقم {student.userId}</h3>
                            <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span className="text-xs text-green-700 font-medium">متحقق</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                            {student.educationLevel} - {student.grade}
                          </p>
                        </div>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setSelectedItem({type: 'verified-student', id: student.id, data: student});
                            setShowModal(true);
                          }}
                          className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                        >
                          📋 المعلومات
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border-0 animate-slide-up">
              <div className="p-6">
                {selectedItem?.type.startsWith('verified') ? (
                  // Details modal for verified items
                  <div>
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">تفاصيل التحقق</span>
                      </div>
                      <h2 className="text-2xl font-bold mt-4 text-gray-800">
                        {selectedItem?.type === 'verified-child' ? '👶 الطفل' : '🎓 الطالب'}
                      </h2>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <span className="font-bold text-green-800 text-lg">تم التحقق بنجاح ✅</span>
                        </div>
                        <p className="text-sm text-gray-700">
                          تم التحقق من هذا {selectedItem?.type === 'verified-child' ? 'الطفل' : 'الطالب'} وتأكيد صحة البيانات المقدمة.
                        </p>
                      </div>
                      
                      {/* Verification Details */}
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold mb-4 text-gray-800 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">ℹ️</span>
                          تفاصيل التحقق
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                            <Calendar className="w-5 h-5 text-blue-500" />
                            <span className="text-sm">
                              <strong className="text-gray-800">تاريخ التحقق:</strong> 
                              <span className="text-blue-600 font-medium mr-1">
                                {selectedItem?.data?.verifiedAt && new Date(selectedItem.data.verifiedAt).toLocaleDateString('en-US')}
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                            <Users className="w-5 h-5 text-purple-500" />
                            <span className="text-sm">
                              <strong className="text-gray-800">تم التحقق بواسطة:</strong> 
                              <span className="text-purple-600 font-medium mr-1">المدير (ID: {selectedItem?.data?.verifiedBy})</span>
                            </span>
                          </div>
                          {selectedItem?.data?.verificationNotes && (
                            <div className="mt-4">
                              <p className="text-sm font-bold mb-2 text-gray-800">📝 ملاحظات التحقق:</p>
                              <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border shadow-sm">
                                {selectedItem.data.verificationNotes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-3 justify-end mt-6">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowModal(false);
                            setSelectedItem(null);
                          }}
                          className="bg-gray-50 hover:bg-gray-100 border-gray-200 shadow-sm"
                        >
                          ❌ إغلاق
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => selectedItem && handleUndoVerification(selectedItem.type, selectedItem.id)}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          🗑️ إلغاء التحقق
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Verification modal for unverified items
                  <div>
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full">
                        <Clock className="w-5 h-5" />
                        <span className="font-bold">عملية التحقق</span>
                      </div>
                      <h2 className="text-2xl font-bold mt-4 text-gray-800">
                        تحقق من {selectedItem?.type === 'child' ? '👶 الطفل' : '🎓 الطالب'}
                      </h2>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                        <Label htmlFor="notes" className="flex items-center gap-2 font-bold text-gray-800">
                          <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">📝</span>
                          ملاحظات التحقق (اختياري)
                        </Label>
                        <Textarea
                          id="notes"
                          placeholder="أدخل أي ملاحظات حول عملية التحقق..."
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          className="mt-3 border-blue-200 shadow-sm"
                        />
                      </div>
                      <div className="flex gap-3 justify-end mt-6">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowModal(false);
                            setVerificationNotes('');
                            setSelectedItem(null);
                          }}
                          className="bg-gray-50 hover:bg-gray-100 border-gray-200 shadow-sm"
                        >
                          ❌ إلغاء
                        </Button>
                        <Button
                          onClick={() => selectedItem && handleVerify(selectedItem.type, selectedItem.id)}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          ✅ تأكيد التحقق
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