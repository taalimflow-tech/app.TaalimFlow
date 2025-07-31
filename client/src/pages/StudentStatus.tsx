import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, CreditCard, User, Clock, CheckCircle, XCircle, DollarSign, Users, BookOpen, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { GroupDetailsModal } from '@/components/GroupDetailsModal';

interface AttendanceRecord {
  id: number;
  groupId: number;
  groupName: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

interface PaymentRecord {
  id: number;
  groupId: number;
  groupName: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidDate?: string;
  description: string;
}

interface EnrolledGroup {
  id: number;
  name: string;
  nameAr?: string;
  subjectName?: string;
  educationLevel: string;
  teacherId?: number;
  teacherName?: string;
  studentsAssigned?: any[];
  description?: string;
}

interface Child {
  id: number;
  name: string;
  schoolId: number;
  parentId: number;
  educationLevel?: string;
  birthDate?: string;
  gender?: string;
}

export default function StudentStatus() {
  const { user } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<EnrolledGroup | null>(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  // For parent accounts, fetch children first
  const { data: children = [], isLoading: childrenLoading } = useQuery<Child[]>({
    queryKey: ['/api/children'],
    enabled: user?.role === 'parent',
  });

  // Determine which ID to use for fetching data (user ID for students, selected child ID for parents)
  const targetUserId = user?.role === 'parent' ? selectedChildId : user?.id;
  const targetUserType = user?.role === 'parent' ? 'child' : 'student';

  // Fetch attendance records for the target user (student or selected child)
  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useQuery<AttendanceRecord[]>({
    queryKey: [`/api/student/attendance/${targetUserId}`],
    enabled: !!targetUserId,
  });

  // Fetch payment records for the target user (student or selected child)
  const { data: paymentRecords = [], isLoading: paymentsLoading } = useQuery<PaymentRecord[]>({
    queryKey: [`/api/student/payments/${targetUserId}`],
    enabled: !!targetUserId,
  });

  // Fetch enrolled groups for the target user (student or selected child)
  const { data: enrolledGroups = [], isLoading: groupsLoading } = useQuery<EnrolledGroup[]>({
    queryKey: [`/api/student/groups/${targetUserId}`],
    enabled: !!targetUserId,
  });

  // Calculate attendance statistics
  const totalSessions = attendanceRecords.length;
  const presentSessions = attendanceRecords.filter(record => record.status === 'present').length;
  const lateSessions = attendanceRecords.filter(record => record.status === 'late').length;
  const absentSessions = attendanceRecords.filter(record => record.status === 'absent').length;
  const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

  // Calculate payment statistics
  const totalAmount = paymentRecords.reduce((sum, record) => sum + record.amount, 0);
  const paidAmount = paymentRecords.filter(record => record.isPaid).reduce((sum, record) => sum + record.amount, 0);
  const pendingAmount = totalAmount - paidAmount;
  const overduePayments = paymentRecords.filter(record => 
    !record.isPaid && new Date(record.dueDate) < new Date()
  ).length;

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4" />;
      case 'late': return <Clock className="w-4 h-4" />;
      case 'absent': return <XCircle className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getAttendanceStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'حاضر';
      case 'late': return 'متأخر';
      case 'absent': return 'غائب';
      default: return 'غير محدد';
    }
  };

  // Set default child selection for parents
  const handleChildSelection = (childId: string) => {
    setSelectedChildId(parseInt(childId));
  };

  // Auto-select first child for parents if none selected
  if (user?.role === 'parent' && children.length > 0 && !selectedChildId) {
    setSelectedChildId(children[0].id);
  }

  if (attendanceLoading || paymentsLoading || groupsLoading || (user?.role === 'parent' && childrenLoading)) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  // For parents with no children
  if (user?.role === 'parent' && children.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">لا توجد أطفال مسجلين</h2>
            <p className="text-gray-600">يجب تسجيل الأطفال أولاً لعرض حضورهم ومدفوعاتهم</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedChild = children.find(child => child.id === selectedChildId);
  const displayName = user?.role === 'parent' && selectedChild ? selectedChild.name : user?.name;

  return (
    <div className="max-w-6xl mx-auto p-6 pb-20 space-y-6" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {user?.role === 'parent' ? 'حضور ومدفوعات الأطفال' : 'حضور ومدفوعات الطالب'}
        </h1>
        <p className="text-gray-600">متابعة حالة الحضور والمدفوعات المالية</p>
      </div>

      {/* Child Selection for Parents */}
      {user?.role === 'parent' && children.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 ml-2 text-blue-600" />
            اختيار الطفل لعرض بياناته
          </h3>
          <Select value={selectedChildId?.toString()} onValueChange={handleChildSelection}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="اختر الطفل" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id.toString()}>
                  {child.name} {child.educationLevel && `- ${child.educationLevel}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedChild && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">البيانات المعروضة للطفل: {selectedChild.name}</h4>
              {selectedChild.educationLevel && (
                <p className="text-sm text-blue-700 mt-1">المستوى التعليمي: {selectedChild.educationLevel}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Enrolled Groups Section */}
      {enrolledGroups.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <BookOpen className="w-6 h-6 ml-2 text-blue-600" />
            المجموعات المسجل بها
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledGroups.map((group) => {
              // Extract year level from group name or description
              const yearLevel = (() => {
                const groupText = group.name + ' ' + (group.description || '');
                if (groupText.includes('الأولى')) return '1';
                if (groupText.includes('الثانية')) return '2';
                if (groupText.includes('الثالثة')) return '3';
                if (groupText.includes('الرابعة')) return '4';
                if (groupText.includes('الخامسة')) return '5';
                return null;
              })();

              const getBadgeColor = () => {
                switch (group.educationLevel) {
                  case 'الابتدائي': return 'bg-green-100 text-green-800';
                  case 'المتوسط': return 'bg-blue-100 text-blue-800';
                  case 'الثانوي': return 'bg-purple-100 text-purple-800';
                  default: return 'bg-gray-100 text-gray-800';
                }
              };

              const getTeacherName = () => {
                if (group.teacherName) {
                  const [firstName, ...rest] = group.teacherName.split(' ');
                  const isFemaleName = firstName.endsWith('ة');
                  const title = isFemaleName ? 'الأستاذة' : 'الأستاذ';
                  return `${title} ${group.teacherName}`;
                }
                return 'غير محدد';
              };

              return (
                <Card key={group.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Level + Year Badge */}
                      <div className="flex justify-start">
                        <span className={`text-xs px-2 py-1 rounded-full ${getBadgeColor()}`}>
                          {yearLevel ? `${group.educationLevel} ${yearLevel}` : group.educationLevel}
                        </span>
                      </div>
                      
                      {/* Title */}
                      <h3 className="font-semibold text-gray-800">{group.nameAr || group.subjectName || group.name}</h3>
                      
                      {/* Teacher */}
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">المعلم:</span> {getTeacherName()}
                      </div>
                      
                      {/* View Details Button */}
                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedGroup(group);
                            setShowGroupDetails(true);
                          }}
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          عرض الحضور والمدفوعات
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Attendance Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{attendanceRate}%</p>
                <p className="text-gray-600">معدل الحضور</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Sessions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="w-8 h-8 text-green-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
                <p className="text-gray-600">إجمالي الجلسات</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CreditCard className="w-8 h-8 text-orange-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{pendingAmount}</p>
                <p className="text-gray-600">مدفوعات معلقة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Payments */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-red-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{overduePayments}</p>
                <p className="text-gray-600">مدفوعات متأخرة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Calendar className="w-6 h-6 text-blue-600 ml-2" />
              <h2 className="text-xl font-bold">سجل الحضور</h2>
            </div>

            {/* Attendance Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{presentSessions}</p>
                <p className="text-sm text-gray-600">حاضر</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{lateSessions}</p>
                <p className="text-sm text-gray-600">متأخر</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{absentSessions}</p>
                <p className="text-sm text-gray-600">غائب</p>
              </div>
            </div>

            {/* Recent Attendance Records */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {attendanceRecords.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد سجلات حضور متاحة</p>
              ) : (
                attendanceRecords.slice(0, 10).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <div className="flex items-center">
                      {getAttendanceStatusIcon(record.status)}
                      <div className="mr-3">
                        <p className="font-medium">{record.groupName}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(record.date).toLocaleDateString('ar-DZ')}
                        </p>
                      </div>
                    </div>
                    <Badge className={getAttendanceStatusColor(record.status)}>
                      {getAttendanceStatusText(record.status)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payments Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <CreditCard className="w-6 h-6 text-green-600 ml-2" />
              <h2 className="text-xl font-bold">المدفوعات المالية</h2>
            </div>

            {/* Payment Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{paidAmount}</p>
                <p className="text-sm text-gray-600">مدفوع</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{pendingAmount}</p>
                <p className="text-sm text-gray-600">معلق</p>
              </div>
            </div>

            {/* Payment Records */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {paymentRecords.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد سجلات مدفوعات متاحة</p>
              ) : (
                paymentRecords.map((record) => (
                  <div key={record.id} className="p-3 bg-white border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{record.groupName}</p>
                        <p className="text-sm text-gray-600">{record.description}</p>
                      </div>
                      <Badge className={record.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {record.isPaid ? 'مدفوع' : 'غير مدفوع'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>المبلغ: {record.amount} دج</span>
                      <span>
                        الاستحقاق: {new Date(record.dueDate).toLocaleDateString('ar-DZ')}
                      </span>
                    </div>
                    {record.isPaid && record.paidDate && (
                      <p className="text-xs text-green-600 mt-1">
                        تم الدفع في: {new Date(record.paidDate).toLocaleDateString('ar-DZ')}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Group Details Modal */}
      <GroupDetailsModal
        group={selectedGroup}
        isOpen={showGroupDetails}
        onClose={() => {
          setShowGroupDetails(false);
          setSelectedGroup(null);
        }}
        currentUserId={user?.id || 0}
        userRole={user?.role || 'student'}
      />
    </div>
  );
}