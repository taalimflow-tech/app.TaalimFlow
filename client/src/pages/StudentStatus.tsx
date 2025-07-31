import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentStatus() {
  const { user } = useAuth();
  const [currentMonthIndex, setCurrentMonthIndex] = useState(6); // Start with current month

  // Fetch student's groups to get attendance data
  const { data: studentGroups = [], isLoading } = useQuery({
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
      
      studentGroups.forEach((group: any) => {
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
        monthName: monthDate.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' }),
        monthNameEn: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
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
    <div className="max-w-4xl mx-auto p-6 pb-20 space-y-6" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">سجل الحضور الشخصي</h1>
        <p className="text-gray-600">متابعة حضورك عبر الأشهر</p>
      </div>

      {/* Monthly Attendance Carousel */}
      <Card className="border">
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <button
            onClick={prevMonth}
            disabled={currentMonthIndex === 0}
            className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800">{currentMonth?.monthNameEn}</h3>
            <p className="text-sm text-gray-600">{currentMonth?.monthName}</p>
          </div>
          
          <button
            onClick={nextMonth}
            disabled={currentMonthIndex === monthsData.length - 1}
            className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Statistics Section */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{currentMonth?.stats.totalScheduledLessons || 0}</div>
              <div className="text-sm text-gray-600">حصص مجدولة</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">{currentMonth?.stats.totalPresent || 0}</div>
              <div className="text-sm text-gray-600">حضور</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-red-600">{currentMonth?.stats.totalAbsent || 0}</div>
              <div className="text-sm text-gray-600">غياب</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{currentMonth?.stats.attendanceRate || 0}%</div>
              <div className="text-sm text-gray-600">معدل الحضور</div>
            </div>
          </div>
        </div>

        {/* Mini Calendar */}
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">التقويم الشهري</h4>
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Day headers (Arabic) */}
            {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day, index) => (
              <div key={index} className="text-xs font-medium text-gray-500 p-2 truncate">
                {day.slice(0, 3)}
              </div>
            ))}
            
            {/* Calendar days */}
            {miniCalendar.map((cell, index) => (
              <div key={index} className="aspect-square p-1">
                {cell ? (
                  <div className="relative w-full h-full flex items-center justify-center text-xs font-medium">
                    <span className="relative z-10">{cell.day}</span>
                    {cell.attendanceCount > 0 && (
                      <div className={`absolute inset-0 w-full h-full rounded-full ${getStatusColor(cell.status)} opacity-70`}></div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full"></div>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>حضور كامل</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>غياب</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>تأخير</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>مختلط</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Groups Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            مجموعاتي
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentGroups.length === 0 ? (
            <p className="text-center text-gray-500 py-8">لم يتم تسجيلك في أي مجموعة بعد</p>
          ) : (
            <div className="grid gap-3">
              {studentGroups.map((group: any) => (
                <div key={group.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{group.name}</h3>
                      <p className="text-sm text-gray-600">{group.subject} - {group.educationLevel}</p>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-gray-600">إجمالي الحضور: {group.totalAttendance || 0}</div>
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