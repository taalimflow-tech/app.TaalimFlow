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
  Calendar
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

export default function TeacherSalaries() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTeacher, setExpandedTeacher] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

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

  // Fetch attendance counts for the selected month
  const { data: attendanceCounts = {} } = useQuery<{ [groupId: number]: { present: number; total: number } }>({
    queryKey: ['/api/groups/attendance-counts', selectedMonth, groups],
    queryFn: async () => {
      if (groups.length === 0) return {};
      
      const [year, month] = selectedMonth.split('-');
      const response = await apiRequest('/api/groups/attendance-counts', {
        method: 'POST',
        body: JSON.stringify({
          groupIds: groups.map(g => g.id),
          year: parseInt(year),
          month: parseInt(month)
        })
      });
      
      return response;
    },
    enabled: user?.role === 'admin' && groups.length > 0
  });

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
    
    // Generate months for current year and previous year
    for (let year = currentYear; year >= currentYear - 1; year--) {
      const startMonth = year === currentYear ? now.getMonth() + 1 : 12;
      for (let month = startMonth; month >= 1; month--) {
        const value = `${year}-${String(month).padStart(2, '0')}`;
        const arabicMonths = [
          'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
          'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        const label = `${arabicMonths[month - 1]} ${year}`;
        options.push({ value, label });
      }
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
                                    الحضور: {attendanceCounts[group.id]?.present || 0}/{attendanceCounts[group.id]?.total || 0}
                                  </p>
                                  {group.grade && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      <GraduationCap className="w-3 h-3 inline mr-1" />
                                      {group.grade}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="outline" size="sm">
                          <Clock className="w-4 h-4 mr-2" />
                          حساب الأجر
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