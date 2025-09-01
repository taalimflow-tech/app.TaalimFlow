import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  Users, 
  Search, 
  BookOpen, 
  ChevronDown, 
  ChevronUp,
  User,
  GraduationCap,
  Clock,
  Calendar,
  Calculator,
  RefreshCw,
  FileText,
  Printer
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Teacher {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  schoolId: number;
  profilePicture?: string;
  verified?: boolean;
  createdAt?: string;
}

interface Group {
  id: number;
  name: string;
  subjectName: string;
  subjectNameAr: string;
  educationLevel: string;
  grade: string;
  teacherId: number;
  studentsAssigned: Array<{
    id: number;
    name: string;
  }>;
}

interface BulkCalculationResult {
  month: string;
  totalTeachers: number;
  totalGroups: number;
  totalSalary: number;
  teacherBreakdown: {
    teacherId: number;
    teacherName: string;
    groupCount: number;
    salary: number;
  }[];
}

export default function TeacherSalaries() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTeacher, setExpandedTeacher] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // State for group payment settings with localStorage persistence
  const [groupPayments, setGroupPayments] = useState<{ [groupId: number]: { amount: string; teacherPercentage: string } }>(() => {
    try {
      const saved = localStorage.getItem('teacherSalariesGroupPayments');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // State for bulk calculation results
  const [bulkResults, setBulkResults] = useState<BulkCalculationResult | null>(null);

  // State for individual teacher calculation results
  const [individualResults, setIndividualResults] = useState<{ [teacherId: number]: number }>({});

  // Fetch teachers
  const { data: teachers = [], isLoading: teachersLoading } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
    enabled: user?.role === 'admin'
  });

  // Fetch all groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
    enabled: user?.role === 'admin'
  });

  // Generate current month dates for filtering
  const getCurrentMonthDates = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    
    const dates = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }
    return dates;
  };

  const currentMonthDates = getCurrentMonthDates(selectedMonth);

  // Fetch attendance history for all groups (we'll process this client-side for each group)
  const { data: allGroupAttendance = {} } = useQuery<{ [groupId: number]: any[] }>({
    queryKey: ['/api/groups/all-attendance', groups.map(g => g.id)],
    queryFn: async () => {
      if (groups.length === 0) return {};
      
      const attendanceData: { [groupId: number]: any[] } = {};
      
      // Fetch attendance for each group
      await Promise.all(
        groups.map(async (group) => {
          try {
            const response = await fetch(`/api/groups/${group.id}/attendance-history`);
            if (response.ok) {
              const data = await response.json();
              attendanceData[group.id] = Array.isArray(data) ? data : [];
            } else {
              attendanceData[group.id] = [];
            }
          } catch (error) {
            console.error(`Error fetching attendance for group ${group.id}:`, error);
            attendanceData[group.id] = [];
          }
        })
      );
      
      return attendanceData;
    },
    enabled: user?.role === 'admin' && groups.length > 0
  });

  // Get scheduled lesson dates for the selected month
  const getScheduledLessonsForMonth = (groupId: number) => {
    // This should get the actual scheduled dates from the group's schedule
    // For now, we'll use the attendance data approach but filter by unique dates only
    const attendance = allGroupAttendance[groupId] || [];
    const uniqueDates = new Set();
    
    attendance.forEach((r: any) => {
      const recordDate = r.attendanceDate?.split('T')[0];
      if (currentMonthDates.includes(recordDate)) {
        uniqueDates.add(recordDate);
      }
    });
    
    return uniqueDates.size;
  };

  // Calculate monthly attendance counts for each group
  const getAttendanceCountsForGroup = (groupId: number) => {
    const attendance = allGroupAttendance[groupId] || [];
    const presentCount = attendance.filter((r: any) => {
      const recordDate = r.attendanceDate?.split('T')[0];
      return r.status === 'present' && currentMonthDates.includes(recordDate);
    }).length;
    
    // Get actual number of scheduled lessons for this month
    const scheduledLessons = getScheduledLessonsForMonth(groupId);
    
    return { present: presentCount, total: scheduledLessons };
  };

  // Handle payment input changes
  const updateGroupPayment = (groupId: number, field: 'amount' | 'teacherPercentage', value: string) => {
    const newPayments = {
      ...groupPayments,
      [groupId]: {
        ...groupPayments[groupId],
        amount: field === 'amount' ? value : groupPayments[groupId]?.amount || '',
        teacherPercentage: field === 'teacherPercentage' ? value : groupPayments[groupId]?.teacherPercentage || ''
      }
    };
    
    setGroupPayments(newPayments);
    
    // Save to localStorage
    try {
      localStorage.setItem('teacherSalariesGroupPayments', JSON.stringify(newPayments));
    } catch (error) {
      console.error('Failed to save group payments to localStorage:', error);
    }
  };

  // Calculate salaries for all teachers
  const calculateAllTeacherSalaries = () => {
    const teacherBreakdown: BulkCalculationResult['teacherBreakdown'] = [];
    let totalSalary = 0;
    let totalGroups = 0;

    filteredTeachers.forEach(teacher => {
      const teacherGroups = getTeacherGroups(teacher.id);
      let teacherSalary = 0;

      teacherGroups.forEach(group => {
        const payment = groupPayments[group.id];
        if (payment?.amount && payment?.teacherPercentage) {
          const amount = parseFloat(payment.amount) || 0;
          const percentage = parseFloat(payment.teacherPercentage) || 0;
          const attendanceCounts = getAttendanceCountsForGroup(group.id);
          
          // Calculate based on: (amount * percentage) / (100 * lessons_count) * total_attendance
          // lessons_count = total possible attendance days for the month
          const lessonsCount = attendanceCounts.total;
          const totalAttendance = attendanceCounts.present;
          const groupSalary = (amount * percentage) / (100 * lessonsCount) * totalAttendance;
          teacherSalary += groupSalary;
        }
      });

      if (teacherSalary > 0) {
        teacherBreakdown.push({
          teacherId: teacher.id,
          teacherName: teacher.name,
          groupCount: teacherGroups.length,
          salary: teacherSalary
        });
        totalSalary += teacherSalary;
      }
      totalGroups += teacherGroups.length;
    });

    // Get month name for display
    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('ar-SA', { 
      year: 'numeric', 
      month: 'long' 
    });

    setBulkResults({
      month: monthName,
      totalTeachers: filteredTeachers.length,
      totalGroups,
      totalSalary,
      teacherBreakdown: teacherBreakdown.sort((a, b) => b.salary - a.salary) // Sort by highest salary
    });
  };

  // Calculate salary for individual teacher
  const calculateIndividualTeacherSalary = (teacherId: number) => {
    console.log('🧮 Calculating salary for teacher:', teacherId);
    const teacherGroups = getTeacherGroups(teacherId);
    console.log('📚 Teacher groups:', teacherGroups);
    let teacherSalary = 0;

    teacherGroups.forEach(group => {
      const payment = groupPayments[group.id];
      console.log(`💰 Payment data for group ${group.id}:`, payment);
      
      if (payment?.amount && payment?.teacherPercentage) {
        const amount = parseFloat(payment.amount) || 0;
        const percentage = parseFloat(payment.teacherPercentage) || 0;
        const attendanceCounts = getAttendanceCountsForGroup(group.id);
        
        console.log(`📊 Group ${group.id} calculation data:`, {
          amount,
          percentage,
          attendanceCounts,
          lessonsCount: attendanceCounts.total,
          totalAttendance: attendanceCounts.present
        });
        
        // Calculate based on: (amount * percentage) / (100 * lessons_count) * total_attendance
        const lessonsCount = attendanceCounts.total;
        const totalAttendance = attendanceCounts.present;
        
        // Add safety check for division by zero
        if (lessonsCount === 0) {
          console.warn(`⚠️ Group ${group.id} has 0 lessons, skipping calculation`);
          return;
        }
        
        const groupSalary = (amount * percentage) / (100 * lessonsCount) * totalAttendance;
        console.log(`💵 Group ${group.id} salary calculation:`, {
          formula: `(${amount} * ${percentage}) / (100 * ${lessonsCount}) * ${totalAttendance}`,
          result: groupSalary
        });
        
        teacherSalary += groupSalary;
      } else {
        console.log(`❌ Group ${group.id} missing payment data:`, { amount: payment?.amount, percentage: payment?.teacherPercentage });
      }
    });

    console.log(`🎯 Final teacher ${teacherId} salary:`, teacherSalary);
    setIndividualResults(prev => ({
      ...prev,
      [teacherId]: teacherSalary
    }));
  };

  // Create payslip function
  const createPayslip = (teacherId: number) => {
    const teacher = teachers?.find(t => t.id === teacherId);
    const salary = individualResults[teacherId];
    
    if (!teacher || salary === undefined) {
      alert('يرجى حساب الأجر أولاً');
      return;
    }

    // Get teacher groups and their details
    const teacherGroups = filteredGroups.filter(group => group.teacherId === teacherId);
    const groupDetails = teacherGroups.map(group => {
      const payment = groupPayments[group.id];
      const counts = getAttendanceCountsForGroup(group.id);
      const scheduledLessons = getScheduledLessonsForMonth(group.id);
      
      return {
        groupName: group.name,
        subject: group.subjectNameAr,
        level: group.educationLevel,
        grade: group.grade,
        students: group.studentsAssigned?.length || 0,
        attendance: counts.present,
        lessons: scheduledLessons,
        amount: payment?.amount || 0,
        percentage: payment?.teacherPercentage || 0
      };
    });

    // Generate payslip content
    const payslipData = {
      teacher: teacher.name,
      month: selectedMonth,
      totalSalary: salary,
      groups: groupDetails,
      generatedAt: new Date().toLocaleDateString('ar-DZ')
    };

    // Store payslip data in localStorage for printing
    localStorage.setItem('currentPayslip', JSON.stringify(payslipData));
    
    // Show success message
    console.log('📄 Payslip created:', payslipData);
    alert(`تم إنشاء كشف الراتب للأستاذ ${teacher.name}\nالراتب الإجمالي: ${salary.toLocaleString()} دج`);
  };

  // Print payslip function
  const printPayslip = (teacherId: number) => {
    const teacher = teachers?.find(t => t.id === teacherId);
    const salary = individualResults[teacherId];
    
    if (!teacher || salary === undefined) {
      alert('يرجى حساب الأجر أولاً');
      return;
    }

    // Create printable HTML content
    const printContent = generatePayslipHTML(teacher, salary, teacherId);
    
    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Generate HTML for payslip printing
  const generatePayslipHTML = (teacher: any, salary: number, teacherId: number) => {
    const teacherGroups = filteredGroups.filter(group => group.teacherId === teacherId);
    const schoolName = JSON.parse(localStorage.getItem('selectedSchool') || '{}').name || 'المدرسة';
    
    const groupRows = teacherGroups.map(group => {
      const payment = groupPayments[group.id];
      const counts = getAttendanceCountsForGroup(group.id);
      const scheduledLessons = getScheduledLessonsForMonth(group.id);
      
      return `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${group.name}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${group.subjectNameAr}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${group.educationLevel}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${counts.present}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${scheduledLessons}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${payment?.amount || 0} دج</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${payment?.teacherPercentage || 0}%</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>كشف راتب - ${teacher.name}</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; }
          .school-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .title { font-size: 20px; margin-bottom: 20px; }
          .info { margin-bottom: 20px; }
          .info-row { margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .total { font-size: 18px; font-weight: bold; margin: 20px 0; text-align: center; }
          .footer { margin-top: 40px; text-align: left; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">${schoolName}</div>
          <div class="title">كشف راتب الأستاذ</div>
        </div>
        
        <div class="info">
          <div class="info-row"><strong>اسم الأستاذ:</strong> ${teacher.name}</div>
          <div class="info-row"><strong>الشهر:</strong> ${selectedMonth}</div>
          <div class="info-row"><strong>تاريخ الإصدار:</strong> ${new Date().toLocaleDateString('ar-DZ')}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>اسم المجموعة</th>
              <th>المادة</th>
              <th>المستوى</th>
              <th>الحضور</th>
              <th>عدد الدروس</th>
              <th>المبلغ</th>
              <th>النسبة</th>
            </tr>
          </thead>
          <tbody>
            ${groupRows}
          </tbody>
        </table>

        <div class="total">
          إجمالي الراتب: ${salary.toLocaleString()} دج
        </div>

        <div class="footer">
          <p>التوقيع: ________________</p>
          <p>التاريخ: ________________</p>
        </div>
      </body>
      </html>
    `;
  };

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (teacher.email && teacher.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get groups assigned to a specific teacher
  const getTeacherGroups = (teacherId: number) => {
    return groups.filter(group => group.teacherId === teacherId);
  };

  // Get total students count for a teacher
  const getTotalStudents = (teacherId: number) => {
    const teacherGroups = getTeacherGroups(teacherId);
    return teacherGroups.reduce((total, group) => total + (group.studentsAssigned?.length || 0), 0);
  };

  // Toggle expanded teacher view
  const toggleTeacherExpansion = (teacherId: number) => {
    setExpandedTeacher(expandedTeacher === teacherId ? null : teacherId);
  };

  // Generate month options for the selector
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JS months are 0-indexed
    
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    // Generate 24 months: 12 months back, current month, 11 months forward
    for (let i = -12; i <= 11; i++) {
      const targetDate = new Date(currentYear, currentMonth - 1 + i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      
      const value = `${year}-${String(month).padStart(2, '0')}`;
      const label = `${arabicMonths[month - 1]} ${year}`;
      options.push({ value, label });
    }
    
    return options;
  };

  const getEducationLevelColor = (level: string) => {
    switch (level) {
      case 'الابتدائي':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'المتوسط':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'الثانوي':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">غير مسموح لك بالوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">أجور الأساتذة</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">إدارة أجور المعلمين ومجموعاتهم المكلفين بها</p>
          </div>
        </div>

        {/* Search and Month Selector */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2 w-full md:w-48">
            <Calendar className="w-4 h-4 text-gray-400" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر الشهر" />
              </SelectTrigger>
              <SelectContent>
                {generateMonthOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="البحث عن معلم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{filteredTeachers.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المعلمين</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{groups.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المجموعات</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {groups.reduce((total, group) => total + (group.studentsAssigned?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي الطلاب</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Calculation Button */}
      <div className="mb-6">
        <Button
          onClick={calculateAllTeacherSalaries}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={filteredTeachers.length === 0 || teachersLoading || groupsLoading}
        >
          <Calculator className="w-4 h-4 mr-2" />
          حساب أجور جميع المعلمين
        </Button>
      </div>

      {/* Bulk Results Display */}
      {bulkResults && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            نتائج حساب الأجور - {bulkResults.month}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المعلمين</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">{bulkResults.totalTeachers}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المجموعات</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">{bulkResults.totalGroups}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الأجور</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">{bulkResults.totalSalary.toLocaleString()} دج</p>
            </div>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {bulkResults.teacherBreakdown.map((result) => (
              <div key={result.teacherId} className="flex justify-between items-center py-2 px-3 bg-white dark:bg-gray-800 rounded border">
                <span className="font-medium">{result.teacherName}</span>
                <div className="text-right">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{result.groupCount} مجموعات - </span>
                  <span className="font-bold text-green-700 dark:text-green-300">{result.salary.toLocaleString()} دج</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teachers List */}
      <div className="space-y-4">
        {teachersLoading || groupsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">لا يوجد معلمين</p>
            </CardContent>
          </Card>
        ) : (
          filteredTeachers.map((teacher) => {
            const teacherGroups = getTeacherGroups(teacher.id);
            const totalStudents = getTotalStudents(teacher.id);
            const isExpanded = expandedTeacher === teacher.id;

            return (
              <Card key={teacher.id} className="border border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Teacher Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {teacher.name.charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {teacher.name}
                          </h3>
                        </div>
                        {teacher.email && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{teacher.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Summary Stats */}
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">المجموعات:</span>
                          <Badge variant="secondary">{teacherGroups.length}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">الطلاب:</span>
                          <Badge variant="secondary">{totalStudents}</Badge>
                        </div>
                      </div>

                      {/* Expand/Collapse Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTeacherExpansion(teacher.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Expanded Content */}
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">

                      {/* Assigned Groups */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          المجموعات المكلف بها ({teacherGroups.length})
                        </h4>
                        
                        {teacherGroups.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">لا توجد مجموعات مكلف بها</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {teacherGroups.map((group) => (
                              <div
                                key={group.id}
                                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                    {group.name}
                                  </h5>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getEducationLevelColor(group.educationLevel)}`}
                                  >
                                    {group.educationLevel}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    <BookOpen className="w-3 h-3 inline mr-1" />
                                    {group.subjectNameAr || group.subjectName}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    <Users className="w-3 h-3 inline mr-1" />
                                    {group.studentsAssigned?.length || 0} طالب
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    <Calendar className="w-3 h-3 inline mr-1" />
                                    الحضور: <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                      {(() => {
                                        const counts = getAttendanceCountsForGroup(group.id);
                                        return `${counts.present}`;
                                      })()}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-1 ml-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      {(() => {
                                        const counts = getAttendanceCountsForGroup(group.id);
                                        return `${counts.total} دروس`;
                                      })()}
                                    </span>
                                  </p>
                                  {group.grade && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      <GraduationCap className="w-3 h-3 inline mr-1" />
                                      {group.grade}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Payment Settings */}
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      المبلغ المدفوع (دج)
                                    </label>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      value={groupPayments[group.id]?.amount || ''}
                                      onChange={(e) => updateGroupPayment(group.id, 'amount', e.target.value)}
                                      className="h-8 text-xs"
                                      min="0"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      نسبة الأستاذ (%)
                                    </label>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      value={groupPayments[group.id]?.teacherPercentage || ''}
                                      onChange={(e) => updateGroupPayment(group.id, 'teacherPercentage', e.target.value)}
                                      className="h-8 text-xs"
                                      min="0"
                                      max="100"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Individual Teacher Calculation Result */}
                      {individualResults[teacher.id] !== undefined && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              إجمالي الأجر لشهر {selectedMonth}:
                            </span>
                            <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                              {individualResults[teacher.id].toLocaleString()} دج
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => calculateIndividualTeacherSalary(teacher.id)}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          حساب الأجر
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => createPayslip(teacher.id)}
                          disabled={individualResults[teacher.id] === undefined}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          إنشاء كشف راتب
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => printPayslip(teacher.id)}
                          disabled={individualResults[teacher.id] === undefined}
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          طباعة
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}