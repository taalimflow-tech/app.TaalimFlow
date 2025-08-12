import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Users, 
  Plus, 
  Settings, 
  User,
  Calendar,
  DollarSign,
  GraduationCap,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

type User = {
  id: number;
  role: string;
  schoolId: number;
};

type Group = {
  id: number;
  name: string;
  description: string;
  educationLevel: string;
  grade: string;
  subjectName: string;
  teacherId?: number;
  teacherName?: string;
  studentsAssigned?: any[];
  memberCount: number;
};

type Teacher = {
  id: number;
  name: string;
};

type Student = {
  id: number;
  name: string;
  educationLevel: string;
  grade: string;
};

export default function Groups() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for group creation
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [groupName, setGroupName] = useState<string>('');
  
  // State for filtering existing groups
  const [filterLevel, setFilterLevel] = useState<string>('جميع المستويات');
  const [filterGrade, setFilterGrade] = useState<string>('جميع السنوات');
  
  // State for modals
  const [showCreateForm, setShowCreateForm] = useState<boolean>(true);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [showManageModal, setShowManageModal] = useState<boolean>(false);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: true
  }) as { data: User | undefined };

  // Debug user role
  console.log('User data in Groups:', user);

  // Fetch groups
  const { data: groups = [], isLoading: loadingGroups } = useQuery({
    queryKey: ['/api/groups'],
    enabled: !!user
  }) as { data: Group[], isLoading: boolean };

  // Fetch teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['/api/teachers'],
    enabled: !!user
  }) as { data: Teacher[] };

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ['/api/students'],
    enabled: !!user
  }) as { data: Student[] };

  // Education levels and grades
  const educationLevels = [
    { value: 'الابتدائي', label: 'الابتدائي' },
    { value: 'المتوسط', label: 'المتوسط' },
    { value: 'الثانوي', label: 'الثانوي' }
  ];

  const getGradesForLevel = (level: string) => {
    switch (level) {
      case 'الابتدائي':
        return [
          'السنة الأولى ابتدائي',
          'السنة الثانية ابتدائي', 
          'السنة الثالثة ابتدائي',
          'السنة الرابعة ابتدائي',
          'السنة الخامسة ابتدائي'
        ];
      case 'المتوسط':
        return [
          'السنة الأولى متوسط',
          'السنة الثانية متوسط',
          'السنة الثالثة متوسط', 
          'السنة الرابعة متوسط'
        ];
      case 'الثانوي':
        return [
          'السنة الأولى ثانوي',
          'السنة الثانية ثانوي',
          'السنة الثالثة ثانوي'
        ];
      default:
        return [];
    }
  };

  // Common subjects for each education level
  const getSubjectsForLevel = (level: string) => {
    switch (level) {
      case 'الابتدائي':
        return ['الرياضيات', 'اللغة العربية', 'اللغة الفرنسية', 'العلوم', 'التربية الإسلامية', 'التاريخ والجغرافيا'];
      case 'المتوسط':
        return ['الرياضيات', 'اللغة العربية', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'العلوم الطبيعية', 'التاريخ والجغرافيا', 'التربية الإسلامية', 'الفيزياء'];
      case 'الثانوي':
        return ['الرياضيات', 'الفيزياء', 'الكيمياء', 'علوم الطبيعة والحياة', 'اللغة العربية', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'التاريخ والجغرافيا', 'التربية الإسلامية', 'الفلسفة'];
      default:
        return [];
    }
  };

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: any) => {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      setShowCreateForm(false);
      resetForm();
      toast({
        title: "تم إنشاء المجموعة بنجاح",
        description: "تم إضافة المجموعة الجديدة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء المجموعة",
        variant: "destructive",
      });
    }
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ groupId, data }: { groupId: number, data: any }) => {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      setShowManageModal(false);
      setEditingGroup(null);
      toast({
        title: "تم تحديث المجموعة بنجاح",
        description: "تم حفظ التغييرات",
      });
    },
    onError: () => {
      toast({
        title: "خطأ", 
        description: "فشل في تحديث المجموعة",
        variant: "destructive",
      });
    }
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      toast({
        title: "تم حذف المجموعة",
        description: "تم حذف المجموعة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف المجموعة", 
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setSelectedLevel('');
    setSelectedGrade('');
    setSelectedSubject('');
    setGroupName('');
  };

  const handleCreateGroup = () => {
    if (!selectedLevel || !selectedGrade || !selectedSubject) {
      toast({
        title: "خطأ",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const groupData = {
      name: groupName || `مجموعة ${selectedSubject}`,
      description: `مجموعة ${selectedSubject} - ${selectedGrade}`,
      educationLevel: selectedLevel,
      grade: selectedGrade,
      subjectName: selectedSubject
    };

    createGroupMutation.mutate(groupData);
  };

  const handleManageGroup = (group: Group) => {
    setEditingGroup(group);
    setSelectedTeacher(group.teacherId || null);
    setSelectedStudents(group.studentsAssigned?.map(s => s.id) || []);
    setShowManageModal(true);
  };

  const handleUpdateGroup = () => {
    if (!editingGroup) return;

    const updateData = {
      teacherId: selectedTeacher,
      studentsAssigned: selectedStudents
    };

    updateGroupMutation.mutate({
      groupId: editingGroup.id,
      data: updateData
    });
  };

  const handleDeleteGroup = (group: Group) => {
    if (confirm(`هل أنت متأكد من حذف مجموعة "${group.name}"؟`)) {
      deleteGroupMutation.mutate(group.id);
    }
  };

  // Filter groups based on selected level and grade
  const filteredGroups = groups.filter(group => {
    if (filterLevel !== 'جميع المستويات' && group.educationLevel !== filterLevel) {
      return false;
    }
    if (filterGrade !== 'جميع السنوات' && group.grade !== filterGrade) {
      return false;
    }
    return true;
  });

  // Get badge color based on education level
  const getBadgeColor = (level: string) => {
    switch(level) {
      case 'الابتدائي': return 'bg-green-100 text-green-800';
      case 'المتوسط': return 'bg-blue-100 text-blue-800';
      case 'الثانوي': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get short grade name for badge
  const getShortGrade = (grade: string) => {
    if (grade.includes('الأولى')) return '1';
    if (grade.includes('الثانية')) return '2';
    if (grade.includes('الثالثة')) return '3';
    if (grade.includes('الرابعة')) return '4';
    if (grade.includes('الخامسة')) return '5';
    return grade;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">يرجى تسجيل الدخول أولاً</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">المجموعات التعليمية</h2>
      
      {/* Admin Section: Create New Group */}
      {user?.role === 'admin' && (
        <Card className="mb-8 border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-800">إنشاء مجموعة جديدة</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="border-blue-300 text-blue-600 hover:bg-blue-100"
              >
                {showCreateForm ? 'إخفاء' : 'عرض'}
              </Button>
            </div>
          </CardHeader>
          
          {showCreateForm && (
            <CardContent>
              <div className="space-y-4">
                {/* Step 1: Select Education Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    1. اختر المستوى التعليمي *
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => {
                      setSelectedLevel(e.target.value);
                      setSelectedGrade(''); // Reset grade when level changes
                      setSelectedSubject(''); // Reset subject when level changes
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر المستوى...</option>
                    {educationLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Select Grade */}
                {selectedLevel && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      2. اختر السنة الدراسية *
                    </label>
                    <select
                      value={selectedGrade}
                      onChange={(e) => {
                        setSelectedGrade(e.target.value);
                        setSelectedSubject(''); // Reset subject when grade changes
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">اختر السنة...</option>
                      {getGradesForLevel(selectedLevel).map(grade => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Step 3: Select Subject */}
                {selectedLevel && selectedGrade && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      3. اختر المادة *
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">اختر المادة...</option>
                      {getSubjectsForLevel(selectedLevel).map(subject => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Optional: Custom Group Name */}
                {selectedSubject && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      4. اسم المجموعة (اختياري)
                    </label>
                    <Input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder={`مجموعة ${selectedSubject}`}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      إذا تُرك فارغاً، سيكون الاسم: "مجموعة {selectedSubject}"
                    </p>
                  </div>
                )}

                {/* Create Button */}
                {selectedLevel && selectedGrade && selectedSubject && (
                  <div className="pt-4">
                    <Button
                      onClick={handleCreateGroup}
                      disabled={createGroupMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {createGroupMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء المجموعة'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Filter Section */}
      <Card className="mb-6">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-800">فلترة المجموعات</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filter by Education Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المستوى التعليمي
              </label>
              <select
                value={filterLevel}
                onChange={(e) => {
                  setFilterLevel(e.target.value);
                  setFilterGrade('جميع السنوات'); // Reset grade filter
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="جميع المستويات">جميع المستويات</option>
                {educationLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Grade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                السنة الدراسية
              </label>
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                disabled={filterLevel === 'جميع المستويات'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="جميع السنوات">جميع السنوات</option>
                {filterLevel !== 'جميع المستويات' && getGradesForLevel(filterLevel).map(grade => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Groups Display */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            المجموعات المتاحة ({filteredGroups.length})
          </h3>
        </div>

        {loadingGroups ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">لا توجد مجموعات مطابقة للفلتر المحدد</p>
            {user?.role === 'admin' && (
              <p className="text-sm text-gray-500 mt-2">يمكنك إنشاء مجموعة جديدة من الأعلى</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Level + Year Badge */}
                    <div className="flex justify-start gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getBadgeColor(group.educationLevel)}`}>
                        {group.educationLevel} {getShortGrade(group.grade)}
                      </span>
                    </div>
                    
                    {/* Title */}
                    <h3 className="font-semibold text-gray-800">{group.name}</h3>
                    
                    {/* Subject */}
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">المادة:</span> {group.subjectName}
                    </div>
                    
                    {/* Teacher */}
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">المعلم:</span> {group.teacherName || 'غير محدد'}
                    </div>
                    
                    {/* Student Count */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 ml-1" />
                      <span>{group.memberCount || 0} طالب</span>
                    </div>
                    
                    {/* Action Buttons */}
                    {user?.role === 'admin' && (
                      <div className="space-y-2 pt-2">
                        <Button
                          onClick={() => handleManageGroup(group)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          إدارة المجموعة
                        </Button>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
                          >
                            <Calendar className="w-4 h-4 mr-1" />
                            الحضور
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-purple-500 text-purple-600 hover:bg-purple-50"
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            المالية
                          </Button>
                        </div>
                        
                        <Button
                          onClick={() => handleDeleteGroup(group)}
                          size="sm"
                          variant="outline"
                          className="w-full border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          حذف المجموعة
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Group Management Modal */}
      {showManageModal && editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">إدارة مجموعة: {editingGroup.name}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManageModal(false)}
              >
                إغلاق
              </Button>
            </div>
            
            {/* Group Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>المستوى:</strong> {editingGroup.educationLevel}</div>
                <div><strong>السنة:</strong> {editingGroup.grade}</div>
                <div><strong>المادة:</strong> {editingGroup.subjectName}</div>
                <div><strong>الطلاب:</strong> {editingGroup.memberCount || 0}</div>
              </div>
            </div>

            {/* Teacher Assignment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تعيين معلم
              </label>
              <select
                value={selectedTeacher || ''}
                onChange={(e) => setSelectedTeacher(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر معلم...</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Assignment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تعيين طلاب
              </label>
              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3">
                {students
                  .filter(student => 
                    student.educationLevel === editingGroup.educationLevel &&
                    student.grade === editingGroup.grade
                  )
                  .map(student => (
                    <div key={student.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents([...selectedStudents, student.id]);
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                          }
                        }}
                        className="mr-2"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.educationLevel} - {student.grade}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowManageModal(false)}
                variant="outline"
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleUpdateGroup}
                disabled={updateGroupMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {updateGroupMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}