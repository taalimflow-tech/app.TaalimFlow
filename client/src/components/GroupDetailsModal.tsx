import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface GroupDetailsModalProps {
  group: any;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: number;
  userRole: string;
}

export function GroupDetailsModal({ group, isOpen, onClose, currentUserId, userRole }: GroupDetailsModalProps) {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  // Attendance history query for table
  const { data: attendanceHistory = [] } = useQuery<any[]>({
    queryKey: ['/api/groups', group?.id, 'attendance-history'],
    queryFn: async () => {
      if (!group) return [];
      const response = await apiRequest('GET', `/api/groups/${group.id}/attendance-history`);
      return await response.json();
    },
    enabled: !!group && isOpen
  });

  // Scheduled dates query for attendance table
  const { data: scheduledDatesData } = useQuery<{dates: string[]}>({
    queryKey: ['/api/groups', group?.id, 'scheduled-dates'],
    queryFn: async () => {
      if (!group) return { dates: [] };
      const response = await apiRequest('GET', `/api/groups/${group.id}/scheduled-dates`);
      return await response.json();
    },
    enabled: !!group && isOpen
  });

  // Helper function to group dates by month
  const groupDatesByMonth = (dates: string[]) => {
    const monthGroups: { [key: string]: string[] } = {};
    
    dates.forEach(date => {
      const dateObj = new Date(date);
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      monthGroups[monthKey].push(date);
    });
    
    return monthGroups;
  };

  // Process scheduled dates into monthly groups
  const monthlyGroups = scheduledDatesData?.dates ? groupDatesByMonth(scheduledDatesData.dates) : {};
  const monthKeys = Object.keys(monthlyGroups).sort();
  const currentMonthKey = monthKeys[currentMonthIndex] || '';
  const currentMonthDates = monthlyGroups[currentMonthKey] || [];

  // Set initial month to current month when data loads
  useEffect(() => {
    if (scheduledDatesData?.dates && scheduledDatesData.dates.length > 0) {
      const currentDate = new Date();
      const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const monthlyGroups = groupDatesByMonth(scheduledDatesData.dates);
      const monthKeys = Object.keys(monthlyGroups).sort();
      const currentIndex = monthKeys.findIndex(key => key === currentMonthKey);
      
      if (currentIndex !== -1) {
        setCurrentMonthIndex(currentIndex);
      }
    }
  }, [scheduledDatesData]);

  const getMonthDisplayName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const goToPreviousMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonthIndex < monthKeys.length - 1) {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  };

  // Get payment status for student (default to unpaid if no record exists)
  const getStudentPaymentStatus = (studentId: number) => {
    return { isPaid: false }; // Default placeholder - can be enhanced with actual payment data
  };

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold flex items-center">
                <Calendar className="w-5 h-5 ml-2 text-green-600" />
                إدارة الحضور - {group.nameAr || group.subjectName || group.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {group.description} - {group.educationLevel}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              إغلاق
            </Button>
          </div>
        </div>

        <div className="p-6">
          {group.studentsAssigned && group.studentsAssigned.length > 0 ? (
            <div className="space-y-6">
              {/* Monthly Carousel Attendance View */}
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-800">جدول الحضور الشهري - المواعيد المجدولة</h4>
                  
                  {monthKeys.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousMonth}
                        disabled={currentMonthIndex === 0}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium px-3 py-1 bg-blue-50 rounded-lg text-blue-700">
                          {currentMonthKey ? getMonthDisplayName(currentMonthKey) : ''}
                        </div>
                        <div className="text-xs text-gray-500">
                          {currentMonthIndex + 1} / {monthKeys.length}
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextMonth}
                        disabled={currentMonthIndex === monthKeys.length - 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {scheduledDatesData?.dates && scheduledDatesData.dates.length > 0 ? (
                  monthKeys.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300" dir="rtl">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 text-right font-medium">اسم الطالب</th>
                            <th className="border border-gray-300 p-2 text-center font-medium min-w-[80px]">حالة الدفع</th>
                            {currentMonthDates.map((date) => (
                              <th key={date} className="border border-gray-300 p-2 text-center font-medium min-w-[80px]">
                                <div className="text-xs">
                                  {new Date(date).toLocaleDateString('en-US', { 
                                    day: 'numeric', 
                                    month: 'numeric'
                                  })}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {group.studentsAssigned
                            .filter((student: any) => {
                              // Filter to show only current user's data for students/children
                              if (userRole === 'student' || userRole === 'child') {
                                return student.id === currentUserId;
                              }
                              return true;
                            })
                            .map((student: any) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 p-3 font-medium">
                                <div className="font-medium">{student.name}</div>
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                <span className={`px-3 py-1 rounded text-sm font-medium ${
                                  getStudentPaymentStatus(student.id)?.isPaid
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {getStudentPaymentStatus(student.id)?.isPaid ? '✅' : '❌'}
                                </span>
                              </td>
                              {currentMonthDates.map((date) => {
                                const attendanceRecord = attendanceHistory.find((record: any) => 
                                  record.studentId === student.id && 
                                  record.attendanceDate?.split('T')[0] === date
                                );
                                
                                return (
                                  <td key={date} className="border border-gray-300 p-1 text-center">
                                    <div
                                      className={`w-8 h-8 rounded text-xs font-bold flex items-center justify-center ${
                                        attendanceRecord?.status === 'present' 
                                          ? 'bg-green-500 text-white' 
                                          : attendanceRecord?.status === 'absent'
                                          ? 'bg-red-500 text-white'
                                          : 'bg-gray-200 text-gray-600'
                                      }`}
                                      title={`${student.name} - ${date} - ${
                                        attendanceRecord?.status === 'present' ? 'حاضر' : 
                                        attendanceRecord?.status === 'absent' ? 'غائب' : 'غير مسجل'
                                      }`}
                                    >
                                      {attendanceRecord?.status === 'present' ? '✓' : 
                                       attendanceRecord?.status === 'absent' ? '✗' : '?'}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Monthly Statistics */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-100 rounded-lg p-3 text-center">
                          <h5 className="font-medium text-green-800">حضور الشهر</h5>
                          <p className="text-xl font-bold text-green-900">
                            {Array.isArray(attendanceHistory) ? 
                              attendanceHistory.filter((record: any) => {
                                const recordDate = record.attendanceDate?.split('T')[0];
                                const isCurrentUserRecord = (userRole === 'student' || userRole === 'child') 
                                  ? record.studentId === currentUserId 
                                  : true;
                                return record.status === 'present' && 
                                       currentMonthDates.includes(recordDate) && 
                                       isCurrentUserRecord;
                              }).length : 0}
                          </p>
                        </div>
                        <div className="bg-red-100 rounded-lg p-3 text-center">
                          <h5 className="font-medium text-red-800">غياب الشهر</h5>
                          <p className="text-xl font-bold text-red-900">
                            {Array.isArray(attendanceHistory) ? 
                              attendanceHistory.filter((record: any) => {
                                const recordDate = record.attendanceDate?.split('T')[0];
                                const isCurrentUserRecord = (userRole === 'student' || userRole === 'child') 
                                  ? record.studentId === currentUserId 
                                  : true;
                                return record.status === 'absent' && 
                                       currentMonthDates.includes(recordDate) && 
                                       isCurrentUserRecord;
                              }).length : 0}
                          </p>
                        </div>
                        <div className="bg-blue-100 rounded-lg p-3 text-center">
                          <h5 className="font-medium text-blue-800">نسبة حضور الشهر</h5>
                          <p className="text-xl font-bold text-blue-900">
                            {(() => {
                              if (!Array.isArray(attendanceHistory)) return 0;
                              const monthRecords = attendanceHistory.filter((record: any) => {
                                const recordDate = record.attendanceDate?.split('T')[0];
                                const isCurrentUserRecord = (userRole === 'student' || userRole === 'child') 
                                  ? record.studentId === currentUserId 
                                  : true;
                                return currentMonthDates.includes(recordDate) && isCurrentUserRecord;
                              });
                              const presentCount = monthRecords.filter(record => record.status === 'present').length;
                              return monthRecords.length > 0 ? Math.round((presentCount / monthRecords.length) * 100) : 0;
                            })()}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">لا توجد مواعيد مجدولة متاحة</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">لا توجد حصص مجدولة لهذه المجموعة</p>
                    <p className="text-sm text-gray-500 mt-2">يجب ربط المجموعة بجدول الحصص أولاً</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">لا يوجد طلاب مسجلين في هذه المجموعة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}