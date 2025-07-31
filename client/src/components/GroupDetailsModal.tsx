import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Users, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
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
    return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
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

  const getAttendanceStatus = (studentId: number, date: string) => {
    const record = attendanceHistory.find((r: any) => 
      r.studentId === studentId && r.attendanceDate?.split('T')[0] === date
    );
    return record?.status || null;
  };

  const getAttendanceIcon = (status: string | null) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'late':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <div className="w-4 h-4 bg-gray-200 rounded-full" />;
    }
  };

  const getAttendanceClass = (status: string | null) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 hover:bg-green-200 border-green-300';
      case 'absent':
        return 'bg-red-100 hover:bg-red-200 border-red-300';
      case 'late':
        return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300';
      default:
        return 'bg-gray-100 hover:bg-gray-200 border-gray-300';
    }
  };

  // Filter to show only current user's attendance data
  const currentUserData = group?.studentsAssigned?.filter((student: any) => {
    if (userRole === 'student') {
      return student.id === currentUserId;
    } else if (userRole === 'child') {
      // For children, match by child ID
      return student.id === currentUserId;
    }
    return false;
  });

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold flex items-center">
                <Calendar className="w-5 h-5 ml-2 text-blue-600" />
                تفاصيل المجموعة - {group.nameAr || group.subjectName || group.name}
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
          {scheduledDatesData?.dates && scheduledDatesData.dates.length > 0 ? (
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

                {monthKeys.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300" dir="rtl">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-2 text-right font-medium">اسم الطالب</th>
                          {currentMonthDates.map((date) => (
                            <th key={date} className="border border-gray-300 p-2 text-center font-medium min-w-[60px]">
                              <div className="text-xs">
                                {new Date(date).toLocaleDateString('en-US', { 
                                  month: '2-digit', 
                                  day: '2-digit' 
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(date).toLocaleDateString('ar-SA', { weekday: 'short' })}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(userRole === 'student' ? currentUserData : group.studentsAssigned)?.map((student: any) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 p-2 font-medium">
                              {student.name}
                            </td>
                            {currentMonthDates.map((date) => {
                              const status = getAttendanceStatus(student.id, date);
                              return (
                                <td key={date} className="border border-gray-300 p-1">
                                  <div className={`
                                    w-8 h-8 rounded-full border-2 flex items-center justify-center mx-auto cursor-default
                                    ${getAttendanceClass(status)}
                                  `}>
                                    {getAttendanceIcon(status)}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">لا توجد مواعيد مجدولة متاحة</p>
                  </div>
                )}

                {/* Monthly Statistics */}
                {monthKeys.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-100 rounded-lg p-3 text-center">
                      <h5 className="font-medium text-green-800">حضور الشهر</h5>
                      <p className="text-xl font-bold text-green-900">
                        {Array.isArray(attendanceHistory) ? 
                          attendanceHistory.filter((r: any) => {
                            const recordDate = r.attendanceDate?.split('T')[0];
                            const isCurrentUser = (userRole === 'student' || userRole === 'child') ? r.studentId === currentUserId : true;
                            return r.status === 'present' && currentMonthDates.includes(recordDate) && isCurrentUser;
                          }).length : 0}
                      </p>
                    </div>
                    <div className="bg-red-100 rounded-lg p-3 text-center">
                      <h5 className="font-medium text-red-800">غياب الشهر</h5>
                      <p className="text-xl font-bold text-red-900">
                        {Array.isArray(attendanceHistory) ? 
                          attendanceHistory.filter((r: any) => {
                            const recordDate = r.attendanceDate?.split('T')[0];
                            const isCurrentUser = (userRole === 'student' || userRole === 'child') ? r.studentId === currentUserId : true;
                            return r.status === 'absent' && currentMonthDates.includes(recordDate) && isCurrentUser;
                          }).length : 0}
                      </p>
                    </div>
                    <div className="bg-blue-100 rounded-lg p-3 text-center">
                      <h5 className="font-medium text-blue-800">نسبة حضور الشهر</h5>
                      <p className="text-xl font-bold text-blue-900">
                        {(() => {
                          if (!Array.isArray(attendanceHistory)) return 0;
                          const monthRecords = attendanceHistory.filter((r: any) => {
                            const recordDate = r.attendanceDate?.split('T')[0];
                            const isCurrentUser = (userRole === 'student' || userRole === 'child') ? r.studentId === currentUserId : true;
                            return currentMonthDates.includes(recordDate) && isCurrentUser;
                          });
                          const presentCount = monthRecords.filter((r: any) => r.status === 'present').length;
                          return monthRecords.length > 0 ? Math.round((presentCount / monthRecords.length) * 100) : 0;
                        })()}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">لا توجد حصص مجدولة لهذه المجموعة</p>
              <p className="text-sm text-gray-500 mt-2">يجب ربط المجموعة بجدول الحصص أولاً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}