import { useQuery } from '@tanstack/react-query';
import { Calendar, CreditCard, User, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

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

export default function StudentStatus() {
  const { user } = useAuth();

  // Fetch attendance records for the student
  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/student/attendance', user?.id],
    enabled: !!user?.id,
  });

  // Fetch payment records for the student
  const { data: paymentRecords = [], isLoading: paymentsLoading } = useQuery<PaymentRecord[]>({
    queryKey: ['/api/student/payments', user?.id],
    enabled: !!user?.id,
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

  if (attendanceLoading || paymentsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 pb-20 space-y-6" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">حضور ومدفوعات الطالب</h1>
        <p className="text-gray-600">متابعة حالة الحضور والمدفوعات المالية</p>
      </div>

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
    </div>
  );
}