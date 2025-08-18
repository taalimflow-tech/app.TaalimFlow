import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Users, BookOpen, Clock, Award, Target, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface GroupPerformance {
  id: number;
  name: string;
  subjectName: string;
  teacherName: string;
  totalStudents: number;
  activeStudents: number;
  averageAttendance: number;
  totalRevenue: number;
  averageScore: number;
  completionRate: number;
}

interface PerformanceMetrics {
  totalGroups: number;
  totalStudents: number;
  averageAttendance: number;
  totalRevenue: number;
  topPerformingGroups: GroupPerformance[];
  lowPerformingGroups: GroupPerformance[];
  monthlyTrends: {
    month: number;
    attendance: number;
    revenue: number;
    newStudents: number;
  }[];
}

export default function PerformanceAnalytics() {
  const { user, loading } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('all');

  // Admin access check
  if (!loading && (!user || user.role !== 'admin')) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 text-lg mb-2">صلاحيات المدير مطلوبة</div>
            <div className="text-gray-600">تحتاج إلى صلاحيات المدير للوصول إلى تحليلات الأداء</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: performanceData, isLoading } = useQuery<PerformanceMetrics>({
    queryKey: ['/api/performance-analytics', selectedYear, selectedMonth],
    enabled: !!user && user.role === 'admin'
  });

  const months = [
    { value: 'all', label: 'جميع الأشهر' },
    { value: '1', label: 'يناير' },
    { value: '2', label: 'فبراير' },
    { value: '3', label: 'مارس' },
    { value: '4', label: 'أبريل' },
    { value: '5', label: 'مايو' },
    { value: '6', label: 'يونيو' },
    { value: '7', label: 'يوليو' },
    { value: '8', label: 'أغسطس' },
    { value: '9', label: 'سبتمبر' },
    { value: '10', label: 'أكتوبر' },
    { value: '11', label: 'نوفمبر' },
    { value: '12', label: 'ديسمبر' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  if (loading || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-600">جاري تحميل التحليلات...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تحليلات الأداء</h1>
          <p className="text-gray-600 mt-1">تحليل شامل لأداء المدرسة والمجموعات</p>
        </div>
        
        <div className="flex gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="الشهر" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="السنة" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المجموعات</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData?.totalGroups || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData?.totalStudents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط الحضور</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData?.averageAttendance || 0}%</div>
            <Progress value={performanceData?.averageAttendance || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData?.totalRevenue?.toLocaleString() || 0} دج</div>
          </CardContent>
        </Card>
      </div>

      {/* Top and Low Performing Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              أفضل المجموعات أداءً
            </CardTitle>
            <CardDescription>المجموعات ذات الأداء العالي</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {performanceData?.topPerformingGroups?.slice(0, 5).map((group, index) => (
              <div key={group.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    #{index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-sm text-gray-600">{group.subjectName} - {group.teacherName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{group.averageAttendance}%</p>
                  <p className="text-xs text-gray-500">{group.totalStudents} طالب</p>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">لا توجد بيانات متاحة</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              المجموعات التي تحتاج تحسين
            </CardTitle>
            <CardDescription>المجموعات ذات الأداء المنخفض</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {performanceData?.lowPerformingGroups?.slice(0, 5).map((group, index) => (
              <div key={group.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-orange-100 text-orange-700">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-sm text-gray-600">{group.subjectName} - {group.teacherName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-orange-600">{group.averageAttendance}%</p>
                  <p className="text-xs text-gray-500">{group.totalStudents} طالب</p>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">لا توجد بيانات متاحة</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      {performanceData?.monthlyTrends && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              الاتجاهات الشهرية
            </CardTitle>
            <CardDescription>تطور المؤشرات عبر الأشهر</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {performanceData.monthlyTrends.slice(0, 6).map((trend, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">شهر {trend.month}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">الحضور:</span>
                      <span className="font-medium">{trend.attendance}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">الإيرادات:</span>
                      <span className="font-medium">{trend.revenue?.toLocaleString()} دج</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">طلاب جدد:</span>
                      <span className="font-medium">{trend.newStudents}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}