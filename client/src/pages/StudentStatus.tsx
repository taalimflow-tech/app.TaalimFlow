import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentStatus() {
  const { user } = useAuth();
  const [currentMonthIndex, setCurrentMonthIndex] = useState(6); // Start with current month

  // Fetch student's groups to get attendance data
  const { data: studentGroups = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/student/${user?.id}/groups`],
    enabled: !!user?.id,
  });

  // Generate months data (6 past + current + 6 future = 13 months)
  const generateMonthsData = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = -6; i <= 6; i++) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      // Aggregate attendance data from all student's groups for this month
      let totalScheduledLessons = 0;
      let totalPresent = 0;
      let totalAbsent = 0;
      let totalLate = 0;
      const monthAttendance: any[] = [];
      
      (studentGroups as any[]).forEach((group: any) => {
        if (group.attendance && Array.isArray(group.attendance)) {
          const groupMonthAttendance = group.attendance.filter((record: any) => {
            const recordDate = new Date(record.attendanceDate);
            return recordDate >= monthStart && recordDate <= monthEnd;
          });
          
          monthAttendance.push(...groupMonthAttendance);
          
          // Count attendance by status
          totalPresent += groupMonthAttendance.filter((r: any) => r.status === 'present').length;
          totalAbsent += groupMonthAttendance.filter((r: any) => r.status === 'absent').length;
          totalLate += groupMonthAttendance.filter((r: any) => r.status === 'late').length;
        }
        
        // Count scheduled lessons for this month from each group
        if (group.scheduledDates && Array.isArray(group.scheduledDates)) {
          const monthScheduled = group.scheduledDates.filter((dateStr: string) => {
            const date = new Date(dateStr);
            return date >= monthStart && date <= monthEnd;
          });
          totalScheduledLessons += monthScheduled.length;
        }
      });
      
      const attendanceRate = totalScheduledLessons > 0 
        ? Math.round((totalPresent / totalScheduledLessons) * 100) 
        : 0;
      
      months.push({
        date: monthDate,
        monthName: monthDate.toLocaleDateString('ar', { 
          month: 'long', 
          year: 'numeric',
          calendar: 'gregory'
        }),
        monthNameEn: monthDate.toLocaleDateString('ar', { 
          month: 'long', 
          year: 'numeric',
          calendar: 'gregory'
        }),
        attendance: monthAttendance,
        stats: {
          totalScheduledLessons,
          totalPresent,
          totalAbsent,
          totalLate,
          attendanceRate
        }
      });
    }
    
    return months;
  };

  const monthsData = generateMonthsData();
  const currentMonth = monthsData[currentMonthIndex] || monthsData[6];

  // Generate mini calendar for current month
  const generateMiniCalendar = (month: any) => {
    if (!month) return [];
    
    const monthStart = new Date(month.date.getFullYear(), month.date.getMonth(), 1);
    const monthEnd = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 0);
    const startDay = monthStart.getDay(); // 0 = Sunday
    const daysInMonth = monthEnd.getDate();
    
    const calendar = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      calendar.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(month.date.getFullYear(), month.date.getMonth(), day);
      const dayStr = dayDate.toISOString().split('T')[0];
      
      // Check if this day has attendance records
      const dayAttendance = month.attendance.filter((r: any) => 
        new Date(r.attendanceDate).toISOString().split('T')[0] === dayStr
      );
      
      let status = 'none';
      if (dayAttendance.length > 0) {
        const presentCount = dayAttendance.filter((r: any) => r.status === 'present').length;
        const absentCount = dayAttendance.filter((r: any) => r.status === 'absent').length;
        const lateCount = dayAttendance.filter((r: any) => r.status === 'late').length;
        
        if (presentCount > 0 && absentCount === 0 && lateCount === 0) status = 'all-present';
        else if (absentCount > 0 && presentCount === 0 && lateCount === 0) status = 'all-absent';
        else if (lateCount > 0) status = 'has-late';
        else status = 'mixed';
      }
      
      calendar.push({ day, status, attendanceCount: dayAttendance.length });
    }
    
    return calendar;
  };

  const miniCalendar = generateMiniCalendar(currentMonth);

  const nextMonth = () => {
    setCurrentMonthIndex(prev => Math.min(prev + 1, monthsData.length - 1));
  };

  const prevMonth = () => {
    setCurrentMonthIndex(prev => Math.max(prev - 1, 0));
  };

  // Get status color for calendar days
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'all-present':
        return 'bg-green-500';
      case 'all-absent':
        return 'bg-red-500';
      case 'has-late':
        return 'bg-yellow-500';
      case 'mixed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">جاري تحميل بيانات الحضور...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Monthly Navigation */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-gray-800">
          {currentMonth?.monthName}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevMonth}
            disabled={currentMonthIndex === 0}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <div className="text-xs text-gray-500">
            {currentMonthIndex + 1} / {monthsData.length}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={nextMonth}
            disabled={currentMonthIndex === monthsData.length - 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Monthly Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{currentMonth?.stats.totalScheduledLessons || 0}</div>
            <p className="text-sm text-gray-600">الحصص المجدولة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{currentMonth?.stats.totalPresent || 0}</div>
            <p className="text-sm text-gray-600">مجموع الحضور</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{currentMonth?.stats.totalAbsent || 0}</div>
            <p className="text-sm text-gray-600">مجموع الغياب</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{currentMonth?.stats.attendanceRate || 0}%</div>
            <p className="text-sm text-gray-600">نسبة الحضور</p>
          </CardContent>
        </Card>
      </div>

      {/* Mini Calendar */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-800 mb-3">تقويم الحضور</h4>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
              <div key={day} className="p-2 font-medium text-gray-600">{day}</div>
            ))}
            {miniCalendar.map((dayInfo, index) => (
              <div key={index} className="p-2 h-8 flex items-center justify-center">
                {dayInfo ? (
                  <div className="relative w-6 h-6 rounded-full flex items-center justify-center text-xs">
                    <span className="relative z-10">{dayInfo.day}</span>
                    {dayInfo.attendanceCount > 0 && (
                      <div className={`absolute inset-0 rounded-full ${
                        dayInfo.status === 'all-present' ? 'bg-green-200' :
                        dayInfo.status === 'all-absent' ? 'bg-red-200' :
                        dayInfo.status === 'has-late' ? 'bg-yellow-200' :
                        'bg-blue-200' // mixed
                      }`} />
                    )}
                  </div>
                ) : (
                  <div className="w-6 h-6" />
                )}
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-200"></div>
              <span>حضور جيد</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-200"></div>
              <span>غياب</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-200"></div>
              <span>تأخير</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-200"></div>
              <span>مختلط</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Groups Summary */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-800 mb-4">مجموعاتي</h4>
          {studentGroups.length === 0 ? (
            <p className="text-center text-gray-500 py-8">لم يتم تسجيلك في أي مجموعة بعد</p>
          ) : (
            <div className="space-y-3">
              {studentGroups.map((group: any) => (
                <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">{group.name}</div>
                      <div className="text-xs text-gray-600">{group.subject} - {group.educationLevel}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Monthly attendance count */}
                    <div className="text-xs text-gray-500">
                      {currentMonth?.attendance.filter((r: any) => r.status === 'present').length || 0} حضور
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}