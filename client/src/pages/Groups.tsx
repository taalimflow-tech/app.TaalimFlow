import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Group } from '@shared/schema';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Users, Settings, BookOpen, GraduationCap, ChevronDown, ChevronUp, User, Plus, Calendar, DollarSign, CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';

export default function Groups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: groups = [], isLoading: loading } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
  });

  // Admin group management state
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showAdminGroups, setShowAdminGroups] = useState(false);
  const [selectedAdminGroup, setSelectedAdminGroup] = useState<any>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  
  // New state for hierarchical selection
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);
  
  // Custom subject creation state
  const [showCustomSubjectModal, setShowCustomSubjectModal] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [customSubjectNameAr, setCustomSubjectNameAr] = useState('');
  const [customSubjectLevel, setCustomSubjectLevel] = useState('');
  const [customSubjectGrade, setCustomSubjectGrade] = useState('');
  
  // Existing groups filter state
  const [existingGroupsFilter, setExistingGroupsFilter] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('');
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<any>(null);

  // Group management state
  const [managementView, setManagementView] = useState<'attendance' | 'financial' | null>(null);
  const [managementGroup, setManagementGroup] = useState<Group | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [markingAttendance, setMarkingAttendance] = useState<{ [key: number]: string }>({});
  
  // Financial state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    studentId: '',
    transactionType: 'fee',
    amount: '',
    description: '',
    dueDate: '',
    status: 'pending'
  });

  // Admin data queries
  const { data: adminGroups = [], isLoading: loadingAdminGroups } = useQuery<any[]>({
    queryKey: ['/api/admin/groups'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: teachingModules = [] } = useQuery<any[]>({
    queryKey: ['/api/teaching-modules'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: teachers = [] } = useQuery<any[]>({
    queryKey: ['/api/teachers-with-specializations'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: availableStudents = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/groups/students', selectedAdminGroup?.educationLevel, selectedAdminGroup?.subjectId],
    enabled: !!user && user.role === 'admin' && !!selectedAdminGroup?.educationLevel && !!selectedAdminGroup?.subjectId,
  });

  // Attendance data queries
  const { data: attendanceData = [], refetch: refetchAttendance } = useQuery<any[]>({
    queryKey: ['/api/groups', managementGroup?.id, 'attendance', selectedDate],
    enabled: !!managementGroup && managementView === 'attendance',
  });

  // Financial data queries
  const { data: financialData = [], refetch: refetchFinancial } = useQuery<any[]>({
    queryKey: ['/api/groups', managementGroup?.id, 'transactions'],
    enabled: !!managementGroup && managementView === 'financial',
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await apiRequest('POST', '/api/group-registrations', {
        groupId,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم انضمامك للمجموعة بنجاح' });
      setShowJoinForm(false);
      setSelectedGroup(null);
      queryClient.invalidateQueries({ queryKey: ['/api/group-registrations'] });
    },
    onError: () => {
      toast({ title: 'خطأ في الانضمام للمجموعة', variant: 'destructive' });
    }
  });

  const updateGroupAssignmentsMutation = useMutation({
    mutationFn: async ({ groupId, studentIds, teacherId, groupData }: { groupId: number | null, studentIds: number[], teacherId: number, groupData?: any }) => {
      const response = await apiRequest('PUT', `/api/admin/groups/${groupId || 'null'}/assignments`, {
        studentIds,
        teacherId,
        groupData
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم تحديث تعيينات المجموعة بنجاح' });
      setShowAssignmentModal(false);
      setSelectedAdminGroup(null);
      setSelectedStudents([]);
      setSelectedTeacher(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/groups'] });
    },
    onError: () => {
      toast({ title: 'خطأ في تحديث تعيينات المجموعة', variant: 'destructive' });
    }
  });

  const createCustomSubjectMutation = useMutation({
    mutationFn: async (subjectData: { name: string, nameAr: string, educationLevel: string, grade?: string }) => {
      const response = await apiRequest('POST', '/api/admin/custom-subjects', subjectData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: 'تم إنشاء المادة المخصصة بنجاح',
        description: data.message || 'تم إنشاء المادة بنجاح'
      });
      setShowCustomSubjectModal(false);
      setCustomSubjectName('');
      setCustomSubjectNameAr('');
      setCustomSubjectLevel('');
      setCustomSubjectGrade('');
      // Force cache invalidation for all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teaching-modules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teachers-with-specializations'] });
      // Reset selection to show new subjects
      setSelectedLevel('');
      setSelectedGrade('');
    },
    onError: () => {
      toast({ title: 'خطأ في إنشاء المادة المخصصة', variant: 'destructive' });
    }
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      return apiRequest('DELETE', `/api/admin/groups/${groupId}`);
    },
    onSuccess: () => {
      toast({
        title: "تم حذف المجموعة بنجاح",
        description: "تم حذف المجموعة وجميع التعيينات المرتبطة بها"
      });
      setShowDeleteConfirm(false);
      setGroupToDelete(null);
      // Invalidate admin groups to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/admin/groups'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف المجموعة",
        description: error.response?.data?.error || "حدث خطأ أثناء حذف المجموعة",
        variant: "destructive"
      });
    }
  });

  // Attendance mutations
  const markAttendanceMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', `/api/groups/${managementGroup?.id}/attendance`, data);
    },
    onSuccess: () => {
      refetchAttendance();
      toast({
        title: "تم تسجيل الحضور",
        description: "تم تسجيل حضور الطالب بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تسجيل الحضور",
        description: error.response?.data?.error || "فشل في تسجيل الحضور",
        variant: "destructive",
      });
    },
  });

  // Financial mutations
  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', `/api/groups/${managementGroup?.id}/transactions`, data);
    },
    onSuccess: () => {
      refetchFinancial();
      setShowNewTransactionModal(false);
      setNewTransaction({
        studentId: '',
        transactionType: 'fee',
        amount: '',
        description: '',
        dueDate: '',
        status: 'pending'
      });
      toast({
        title: "تم إنشاء المعاملة",
        description: "تم إنشاء المعاملة المالية بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء المعاملة",
        description: error.response?.data?.error || "فشل في إنشاء المعاملة",
        variant: "destructive",
      });
    },
  });

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGroup) {
      joinGroupMutation.mutate(selectedGroup.id);
    }
  };

  const handleOpenAssignmentModal = (group: any) => {
    setSelectedAdminGroup(group);
    // Extract student IDs from the studentsAssigned array
    const studentIds = (group.studentsAssigned || []).map((student: any) => student.id);
    setSelectedStudents(studentIds);
    setSelectedTeacher(group.teacherId || null);
    setShowAssignmentModal(true);
  };

  const handleUpdateAssignments = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAdminGroup && selectedTeacher) {
      updateGroupAssignmentsMutation.mutate({
        groupId: selectedAdminGroup.id,
        studentIds: selectedStudents,
        teacherId: selectedTeacher,
        groupData: selectedAdminGroup.isPlaceholder ? selectedAdminGroup : undefined
      });
    }
  };

  const handleCreateCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSubjectName && customSubjectNameAr && customSubjectLevel) {
      createCustomSubjectMutation.mutate({
        name: customSubjectName,
        nameAr: customSubjectNameAr,
        educationLevel: customSubjectLevel,
        grade: customSubjectGrade || undefined
      });
    }
  };

  const handleDeleteGroup = (group: any) => {
    setGroupToDelete(group);
    setShowDeleteConfirm(true);
  };

  // Group management handlers
  const openGroupManagement = (group: Group, view: 'attendance' | 'financial') => {
    setManagementGroup(group);
    setManagementView(view);
  };

  const closeGroupManagement = () => {
    setManagementGroup(null);
    setManagementView(null);
  };

  // Attendance handlers
  const handleMarkAttendance = (studentId: number, status: string) => {
    const attendanceData = {
      studentId,
      status,
      attendanceDate: new Date(selectedDate),
      notes: ''
    };
    markAttendanceMutation.mutate(attendanceData);
  };

  // Financial handlers
  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.studentId || !newTransaction.amount || !newTransaction.description) {
      toast({
        title: "بيانات غير مكتملة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const transactionData = {
      ...newTransaction,
      studentId: parseInt(newTransaction.studentId),
      amount: parseInt(newTransaction.amount) * 100, // Convert to cents
      dueDate: newTransaction.dueDate ? new Date(newTransaction.dueDate) : null,
    };
    
    createTransactionMutation.mutate(transactionData);
  };

  const confirmDeleteGroup = () => {
    if (groupToDelete && groupToDelete.id) {
      deleteGroupMutation.mutate(groupToDelete.id);
    }
  };

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const getEducationLevelColor = (level: string) => {
    switch(level) {
      case 'الابتدائي': return 'text-green-600 bg-green-50';
      case 'المتوسط': return 'text-blue-600 bg-blue-50';
      case 'الثانوي': return 'text-purple-600 bg-purple-50';
      case 'جميع المستويات': return 'text-orange-600 bg-orange-50 border border-orange-200';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getFilteredTeachers = (educationLevel: string, subjectId: number) => {
    return teachers.filter(teacher => 
      teacher.specializations.some((spec: any) => 
        spec.educationLevel === educationLevel && spec.id === subjectId
      )
    );
  };

  // Helper function to get available grades for each education level
  const getAvailableGrades = (level: string) => {
    switch (level) {
      case 'الابتدائي':
        return [
          { value: 'السنة الأولى ابتدائي', label: 'السنة الأولى' },
          { value: 'السنة الثانية ابتدائي', label: 'السنة الثانية' },
          { value: 'السنة الثالثة ابتدائي', label: 'السنة الثالثة' },
          { value: 'السنة الرابعة ابتدائي', label: 'السنة الرابعة' },
          { value: 'السنة الخامسة ابتدائي', label: 'السنة الخامسة' },
        ];
      case 'المتوسط':
        return [
          { value: 'السنة الأولى متوسط', label: 'السنة الأولى' },
          { value: 'السنة الثانية متوسط', label: 'السنة الثانية' },
          { value: 'السنة الثالثة متوسط', label: 'السنة الثالثة' },
          { value: 'السنة الرابعة متوسط', label: 'السنة الرابعة' },
        ];
      case 'الثانوي':
        return [
          { value: 'السنة الأولى ثانوي', label: 'السنة الأولى' },
          { value: 'السنة الثانية ثانوي', label: 'السنة الثانية' },
          { value: 'السنة الثالثة ثانوي', label: 'السنة الثالثة' },
        ];
      default:
        return [];
    }
  };

  // Handle level selection
  const handleLevelChange = (level: string) => {
    setSelectedLevel(level);
    setSelectedGrade('');
    setFilteredSubjects([]);
  };

  // Handle grade selection
  const handleGradeChange = (grade: string) => {
    setSelectedGrade(grade);
    
    // Filter subjects based on selected level
    const levelSubjects = adminGroups.filter(group => group.educationLevel === selectedLevel);
    setFilteredSubjects(levelSubjects);
  };

  // Get subject groups for selected level and grade
  const getSubjectGroups = () => {
    if (!selectedLevel) return [];
    
    if (selectedLevel === 'جميع المستويات') {
      // For universal view, show subjects that exist across all education levels
      // Group by subject name and show only subjects that appear in all three levels
      const subjectCounts = {};
      const universalSubjects = [];
      
      // Count how many education levels each subject appears in
      adminGroups.forEach(group => {
        const subjectKey = group.nameAr || group.subjectName;
        if (!subjectCounts[subjectKey]) {
          subjectCounts[subjectKey] = {
            count: 0,
            group: group,
            levels: []
          };
        }
        subjectCounts[subjectKey].count++;
        subjectCounts[subjectKey].levels.push(group.educationLevel);
      });
      
      // Include subjects that appear in all 3 levels (primary, middle, secondary)
      Object.keys(subjectCounts).forEach(subjectKey => {
        const subjectData = subjectCounts[subjectKey];
        if (subjectData.count >= 3) {
          universalSubjects.push({
            ...subjectData.group,
            educationLevel: 'جميع المستويات',
            isUniversal: true
          });
        }
      });
      
      return universalSubjects;
    }
    
    return adminGroups.filter(group => group.educationLevel === selectedLevel);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">المجموعات التعليمية</h2>
      
      {/* Admin Group Management Section */}
      {user?.role === 'admin' && (
        <div className="mb-8">
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-800">إدارة المجموعات الموجودة</h3>
                  <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    للإدارة فقط
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdminGroups(!showAdminGroups)}
                  className="border-blue-300 text-blue-600 hover:bg-blue-100"
                >
                  {showAdminGroups ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showAdminGroups ? 'إخفاء' : 'عرض'}
                </Button>
              </div>
            </CardHeader>
            
            {showAdminGroups && (
              <CardContent className="pt-0">
                {/* Custom Subject Creation Button - Always Visible */}
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-800 mb-1">إنشاء مادة مخصصة</h4>
                      <p className="text-sm text-green-600">أنشئ مواد جديدة خارج المنهج الرسمي</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomSubjectModal(true)}
                      className="border-green-300 text-green-600 hover:bg-green-100"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      إنشاء مادة مخصصة
                    </Button>
                  </div>
                </div>

                {loadingAdminGroups ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : adminGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-blue-400 mb-4" />
                    <p className="text-blue-600">لا توجد مجموعات إدارية حالياً</p>
                    <p className="text-sm text-blue-500 mt-1">يمكنك إنشاء مجموعات جديدة من قسم إدارة المحتوى</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Modern Hierarchical Selection */}
                    <div className="bg-white rounded-lg border p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">اختر المستوى والسنة</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Education Level Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            المستوى التعليمي
                          </label>
                          <select
                            value={selectedLevel}
                            onChange={(e) => handleLevelChange(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">اختر المستوى...</option>
                            <option value="جميع المستويات">جميع المستويات (المواد العامة)</option>
                            <option value="الابتدائي">الابتدائي</option>
                            <option value="المتوسط">المتوسط</option>
                            <option value="الثانوي">الثانوي</option>
                          </select>
                        </div>

                        {/* Grade Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            السنة الدراسية
                          </label>
                          <select
                            value={selectedGrade}
                            onChange={(e) => handleGradeChange(e.target.value)}
                            disabled={!selectedLevel}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          >
                            <option value="">اختر السنة...</option>
                            {getAvailableGrades(selectedLevel).map(grade => (
                              <option key={grade.value} value={grade.value}>
                                {grade.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* Instruction Message */}
                      {selectedLevel && selectedLevel !== 'جميع المستويات' && !selectedGrade && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            الرجاء اختيار السنة الدراسية لعرض المواد المتاحة
                          </p>
                        </div>
                      )}
                      
                      {/* Universal Level Message */}
                      {selectedLevel === 'جميع المستويات' && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            عرض المواد العامة المتاحة لجميع المستويات التعليمية
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Subject Groups Grid */}
                    {((selectedLevel && selectedGrade) || selectedLevel === 'جميع المستويات') && (
                      <div className="bg-white rounded-lg border p-6">
                        <div className="flex items-center mb-4">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getEducationLevelColor(selectedLevel)}`}>
                            <GraduationCap className="w-4 h-4 inline mr-2" />
                            {selectedLevel}
                          </div>
                          {selectedGrade && (
                            <div className="ml-3 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                              {selectedGrade}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">المواد المتاحة</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCustomSubjectModal(true)}
                            className="border-green-300 text-green-600 hover:bg-green-50"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            إنشاء مادة مخصصة
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {getSubjectGroups().map(group => (
                            <div 
                              key={group.id || group.subjectId} 
                              className="border rounded-lg p-4 bg-white shadow-sm"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900">
                                  {group.nameAr || group.subjectName}
                                </h4>
                                <span className={`text-xs px-2 py-1 rounded ${group.isPlaceholder ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                  {group.isPlaceholder ? 'فارغة' : 'نشطة'}
                                </span>
                              </div>
                              
                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  <span>{group.teacherName || 'لا يوجد معلم'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  <span>{group.studentsAssigned?.length || 0} طالب</span>
                                </div>
                              </div>
                              
                              <div className="mt-3 pt-3 border-t space-y-2">
                                <Button
                                  size="sm"
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={() => handleOpenAssignmentModal(group)}
                                >
                                  إدارة المجموعة
                                </Button>
                                
                                {!group.isPlaceholder && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
                                      onClick={() => openGroupManagement(group, 'attendance')}
                                    >
                                      <Calendar className="w-4 h-4 mr-1" />
                                      الحضور
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 border-purple-500 text-purple-600 hover:bg-purple-50"
                                      onClick={() => openGroupManagement(group, 'financial')}
                                    >
                                      <DollarSign className="w-4 h-4 mr-1" />
                                      المالية
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {getSubjectGroups().length === 0 && (
                          <div className="text-center py-8">
                            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600">لا توجد مواد متاحة للمستوى المحدد</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      )}
      
      {/* Admin-Created Groups Section */}
      {user?.role === 'admin' && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Settings className="h-5 w-5 ml-2 text-blue-600" />
              المجموعات الموجودة (مصنفة حسب المستوى)
            </h2>
            
            {/* Education Level Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['الابتدائي', 'المتوسط', 'الثانوي', 'مجموعات مخصصة'].map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    const filterValue = level === 'مجموعات مخصصة' ? 'custom' : level;
                    setExistingGroupsFilter(filterValue);
                    setSelectedYearFilter(''); // Reset year filter when changing education level
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    existingGroupsFilter === (level === 'مجموعات مخصصة' ? 'custom' : level)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-blue-50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* Year Level Filter - Only show for specific education levels */}
            {existingGroupsFilter && existingGroupsFilter !== 'custom' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  فلترة حسب السنة الدراسية
                </label>
                <select
                  value={selectedYearFilter}
                  onChange={(e) => setSelectedYearFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">جميع السنوات</option>
                  {existingGroupsFilter === 'الابتدائي' && (
                    <>
                      <option value="السنة الأولى ابتدائي">السنة الأولى ابتدائي</option>
                      <option value="السنة الثانية ابتدائي">السنة الثانية ابتدائي</option>
                      <option value="السنة الثالثة ابتدائي">السنة الثالثة ابتدائي</option>
                      <option value="السنة الرابعة ابتدائي">السنة الرابعة ابتدائي</option>
                      <option value="السنة الخامسة ابتدائي">السنة الخامسة ابتدائي</option>
                    </>
                  )}
                  {existingGroupsFilter === 'المتوسط' && (
                    <>
                      <option value="السنة الأولى متوسط">السنة الأولى متوسط</option>
                      <option value="السنة الثانية متوسط">السنة الثانية متوسط</option>
                      <option value="السنة الثالثة متوسط">السنة الثالثة متوسط</option>
                      <option value="السنة الرابعة متوسط">السنة الرابعة متوسط</option>
                    </>
                  )}
                  {existingGroupsFilter === 'الثانوي' && (
                    <>
                      <option value="السنة الأولى ثانوي">السنة الأولى ثانوي</option>
                      <option value="السنة الثانية ثانوي">السنة الثانية ثانوي</option>
                      <option value="السنة الثالثة ثانوي">السنة الثالثة ثانوي</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {/* Groups Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {existingGroupsFilter && (() => {
                let filteredGroups = [];
                
                // First filter to only show admin-created groups (not placeholders)
                const adminCreatedGroups = adminGroups.filter(group => !group.isPlaceholder);
                
                if (existingGroupsFilter === 'custom') {
                  // Show custom/other groups from admin groups that don't belong to standard education levels
                  filteredGroups = adminCreatedGroups.filter(group => 
                    group.educationLevel && !['الابتدائي', 'المتوسط', 'الثانوي'].includes(group.educationLevel)
                  );
                } else {
                  // Show admin groups by education level - only admin-created groups
                  filteredGroups = adminCreatedGroups.filter(group => 
                    group.educationLevel === existingGroupsFilter
                  );
                  
                  // Apply year filter if selected
                  if (selectedYearFilter) {
                    filteredGroups = filteredGroups.filter(group => {
                      // Check if any assigned student has the selected grade level
                      return group.studentsAssigned && group.studentsAssigned.some((student: any) => 
                        student.grade === selectedYearFilter
                      );
                    });
                  }
                }

                return filteredGroups.length > 0 ? (
                  filteredGroups.map((group) => (
                    <Card key={group.id || group.name} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base text-gray-800">{group.name}</CardTitle>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              existingGroupsFilter === 'الابتدائي' ? 'bg-green-100 text-green-800' :
                              existingGroupsFilter === 'المتوسط' ? 'bg-blue-100 text-blue-800' :
                              existingGroupsFilter === 'الثانوي' ? 'bg-purple-100 text-purple-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {existingGroupsFilter === 'custom' ? 'مخصص' : existingGroupsFilter}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {group.imageUrl && (
                          <div className="mb-3">
                            <img 
                              src={group.imageUrl} 
                              alt={group.name} 
                              className="w-full h-32 object-cover rounded-lg"
                              style={{ aspectRatio: '16/9' }}
                            />
                          </div>
                        )}
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {group.description || `مجموعة ${group.nameAr || group.subjectName} - ${group.educationLevel}`}
                        </p>
                        
                        {/* Show assigned students' grade levels if available */}
                        {group.studentsAssigned && group.studentsAssigned.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {[...new Set(group.studentsAssigned.map((student: any) => student.grade).filter(Boolean))].map((grade: string) => {
                                // Format the grade display correctly
                                const formatGrade = (gradeStr: string) => {
                                  if (gradeStr.includes('ثانوي')) return gradeStr; // Already formatted correctly
                                  if (gradeStr.includes('متوسط')) return gradeStr; // Already formatted correctly
                                  if (gradeStr.includes('ابتدائي')) return gradeStr; // Already formatted correctly
                                  return gradeStr; // Return as-is for any other format
                                };
                                
                                return (
                                  <span key={grade} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                    {formatGrade(grade)}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <div className="flex items-center">
                            <Users className="h-3 w-3 ml-1" />
                            <span>الطلاب: {group.studentsAssigned?.length || 0}</span>
                          </div>
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {group.nameAr || group.subjectName || 'مادة'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <Button
                            onClick={() => handleOpenAssignmentModal(group)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
                            size="sm"
                          >
                            إدارة المجموعة
                          </Button>
                          
                          {group.id && group.studentsAssigned && group.studentsAssigned.length > 0 && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
                                onClick={() => openGroupManagement(group, 'attendance')}
                              >
                                <Calendar className="w-4 h-4 mr-1" />
                                الحضور
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-purple-500 text-purple-600 hover:bg-purple-50"
                                onClick={() => openGroupManagement(group, 'financial')}
                              >
                                <DollarSign className="w-4 h-4 mr-1" />
                                المالية
                              </Button>
                            </div>
                          )}
                          
                          {group.id && (
                            <Button
                              onClick={() => handleDeleteGroup(group)}
                              variant="outline"
                              className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                              size="sm"
                            >
                              🗑️ حذف المجموعة
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <div className="text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">
                        {existingGroupsFilter === 'custom' 
                          ? 'لا توجد مجموعات مخصصة حالياً'
                          : `لا توجد مجموعات في ${existingGroupsFilter} حالياً`
                        }
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      
      {/* Public Groups are now integrated into the admin section above */}

      {/* Join Group Modal */}
      {showJoinForm && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">الانضمام إلى {selectedGroup.name}</h2>
              <button
                onClick={() => setShowJoinForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  هل تريد الانضمام إلى هذه المجموعة؟
                </p>
                <p className="text-sm text-gray-700 mb-4">
                  <strong>الوصف:</strong> {selectedGroup.description}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setShowJoinForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={joinGroupMutation.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {joinGroupMutation.isPending ? 'جاري الانضمام...' : 'انضم الآن'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Assignment Modal */}
      {showAssignmentModal && selectedAdminGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">إدارة تعيينات المجموعة</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAssignmentModal(false)}
              >
                إغلاق
              </Button>
            </div>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">تفاصيل المجموعة</h4>
              <div className="text-sm text-gray-600">
                <p><strong>الاسم:</strong> {selectedAdminGroup.name}</p>
                <p><strong>المستوى:</strong> {selectedAdminGroup.educationLevel}</p>
                <p><strong>المادة:</strong> {selectedAdminGroup.nameAr || selectedAdminGroup.subjectName}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateAssignments} className="space-y-6">
              {/* Teacher Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اختيار المعلم
                </label>
                <select
                  value={selectedTeacher || ''}
                  onChange={(e) => setSelectedTeacher(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر معلم...</option>
                  {getFilteredTeachers(selectedAdminGroup.educationLevel, selectedAdminGroup.subjectId).map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.specializations.find((s: any) => s.id === selectedAdminGroup.subjectId)?.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Assignment Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Currently Assigned Students */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الطلاب المسجلين حالياً ({selectedStudents.length})
                  </label>
                  <div className="max-h-60 overflow-y-auto border border-green-300 rounded-md p-2 bg-green-50">
                    {selectedStudents.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">لا يوجد طلاب مسجلين في هذه المجموعة</p>
                    ) : (
                      <div className="space-y-2">
                        {availableStudents
                          .filter(student => selectedStudents.includes(student.id))
                          .map(student => (
                            <div key={student.id} className="flex items-center space-x-2 p-2 bg-white rounded border border-green-200">
                              <input
                                type="checkbox"
                                checked={true}
                                onChange={() => toggleStudentSelection(student.id)}
                                className="mr-2 text-green-600"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-green-800">{student.name}</p>
                                <p className="text-sm text-green-600">المستوى: {student.educationLevel}</p>
                              </div>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">مسجل</span>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </div>

                {/* Available Students */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الطلاب المتاحين ({availableStudents.filter(s => !selectedStudents.includes(s.id)).length})
                  </label>
                  <div className="max-h-60 overflow-y-auto border border-blue-300 rounded-md p-2 bg-blue-50">
                    {availableStudents.filter(s => !selectedStudents.includes(s.id)).length === 0 ? (
                      <p className="text-gray-500 text-center py-4">جميع الطلاب المتاحين مسجلين بالفعل</p>
                    ) : (
                      <div className="space-y-2">
                        {availableStudents
                          .filter(student => !selectedStudents.includes(student.id))
                          .map(student => {
                            // Check if student's grade matches the group's education level
                            const isGradeCompatible = (() => {
                              if (!student.grade) return true; // Allow if no grade specified
                              
                              const groupLevel = selectedAdminGroup.educationLevel;
                              const studentGrade = student.grade;
                              
                              if (groupLevel === 'الابتدائي') return studentGrade.includes('ابتدائي');
                              if (groupLevel === 'المتوسط') return studentGrade.includes('متوسط');
                              if (groupLevel === 'الثانوي') return studentGrade.includes('ثانوي');
                              
                              return true; // Default to compatible for custom groups
                            })();
                            
                            return (
                              <div key={student.id} className={`flex items-center space-x-2 p-2 bg-white rounded border hover:bg-blue-50 ${
                                isGradeCompatible ? 'border-blue-200' : 'border-yellow-300 bg-yellow-50'
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={() => toggleStudentSelection(student.id)}
                                  className="mr-2 text-blue-600"
                                />
                                <div className="flex-1">
                                  <p className="font-medium">{student.name}</p>
                                  <p className="text-sm text-gray-600">المستوى: {student.educationLevel}</p>
                                  {student.grade && (
                                    <p className={`text-xs ${isGradeCompatible ? 'text-gray-500' : 'text-yellow-700'}`}>
                                      الصف: {student.grade}
                                    </p>
                                  )}
                                  {!isGradeCompatible && (
                                    <p className="text-xs text-yellow-700 font-medium">⚠️ الصف لا يتطابق مع مستوى المجموعة</p>
                                  )}
                                </div>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  isGradeCompatible ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {isGradeCompatible ? 'متاح' : 'تحذير'}
                                </span>
                              </div>
                            );
                          })
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAssignmentModal(false)}
                  className="mr-2"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={updateGroupAssignmentsMutation.isPending || !selectedTeacher}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateGroupAssignmentsMutation.isPending ? 'جاري التحديث...' : 'حفظ التعيينات'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Subject Creation Modal */}
      {showCustomSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">إنشاء مادة مخصصة</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomSubjectModal(false)}
              >
                إغلاق
              </Button>
            </div>
            
            <form onSubmit={handleCreateCustomSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم المادة (بالإنجليزية) *
                </label>
                <input
                  type="text"
                  value={customSubjectName}
                  onChange={(e) => setCustomSubjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Subject Name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم المادة (بالعربية) *
                </label>
                <input
                  type="text"
                  value={customSubjectNameAr}
                  onChange={(e) => setCustomSubjectNameAr(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اسم المادة"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المستوى التعليمي *
                </label>
                <select
                  value={customSubjectLevel}
                  onChange={(e) => setCustomSubjectLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر المستوى...</option>
                  <option value="جميع المستويات">جميع المستويات</option>
                  <option value="الابتدائي">الابتدائي</option>
                  <option value="المتوسط">المتوسط</option>
                  <option value="الثانوي">الثانوي</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  السنة الدراسية (اختياري)
                </label>
                <select
                  value={customSubjectGrade}
                  onChange={(e) => setCustomSubjectGrade(e.target.value)}
                  disabled={!customSubjectLevel}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">جميع السنوات</option>
                  {customSubjectLevel !== 'جميع المستويات' && getAvailableGrades(customSubjectLevel).map(grade => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCustomSubjectModal(false)}
                  className="mr-2"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={createCustomSubjectMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createCustomSubjectMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء المادة'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && groupToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-800">تأكيد حذف المجموعة</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                هل أنت متأكد من أنك تريد حذف هذه المجموعة؟
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{groupToDelete.name}</p>
                <p className="text-sm text-gray-600">{groupToDelete.educationLevel} - {groupToDelete.nameAr || groupToDelete.subjectName}</p>
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ سيتم حذف جميع الطلاب المسجلين في هذه المجموعة
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={confirmDeleteGroup}
                disabled={deleteGroupMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteGroupMutation.isPending ? 'جاري الحذف...' : 'حذف المجموعة'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Group Management Modal - Attendance */}
      {managementView === 'attendance' && managementGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold flex items-center">
                    <Calendar className="w-5 h-5 ml-2 text-green-600" />
                    إدارة الحضور - {managementGroup.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {managementGroup.description} - {managementGroup.educationLevel}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeGroupManagement}
                >
                  إغلاق
                </Button>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ الحضور
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="p-6">
              {managementGroup.studentsAssigned && managementGroup.studentsAssigned.length > 0 ? (
                <div className="space-y-4">
                  {managementGroup.studentsAssigned.map((student: any) => (
                    <div key={student.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{student.name}</h4>
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={markingAttendance[student.id] === 'present' ? 'default' : 'outline'}
                            className={markingAttendance[student.id] === 'present' ? 'bg-green-600 hover:bg-green-700' : 'border-green-500 text-green-600 hover:bg-green-50'}
                            onClick={() => {
                              setMarkingAttendance(prev => ({ ...prev, [student.id]: 'present' }));
                              handleMarkAttendance(student.id, 'present');
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            حاضر
                          </Button>
                          
                          <Button
                            size="sm"
                            variant={markingAttendance[student.id] === 'absent' ? 'default' : 'outline'}
                            className={markingAttendance[student.id] === 'absent' ? 'bg-red-600 hover:bg-red-700' : 'border-red-500 text-red-600 hover:bg-red-50'}
                            onClick={() => {
                              setMarkingAttendance(prev => ({ ...prev, [student.id]: 'absent' }));
                              handleMarkAttendance(student.id, 'absent');
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            غائب
                          </Button>
                          
                          <Button
                            size="sm"
                            variant={markingAttendance[student.id] === 'late' ? 'default' : 'outline'}
                            className={markingAttendance[student.id] === 'late' ? 'bg-yellow-600 hover:bg-yellow-700' : 'border-yellow-500 text-yellow-600 hover:bg-yellow-50'}
                            onClick={() => {
                              setMarkingAttendance(prev => ({ ...prev, [student.id]: 'late' }));
                              handleMarkAttendance(student.id, 'late');
                            }}
                          >
                            <Clock className="w-4 h-4 mr-1" />
                            متأخر
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">لا يوجد طلاب مسجلين في هذه المجموعة</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Group Management Modal - Financial */}
      {managementView === 'financial' && managementGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold flex items-center">
                    <DollarSign className="w-5 h-5 ml-2 text-purple-600" />
                    الإدارة المالية - {managementGroup.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {managementGroup.description} - {managementGroup.educationLevel}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewTransactionModal(true)}
                    className="border-purple-500 text-purple-600 hover:bg-purple-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    معاملة جديدة
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={closeGroupManagement}
                  >
                    إغلاق
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {managementGroup.studentsAssigned && managementGroup.studentsAssigned.length > 0 ? (
                <div className="space-y-6">
                  {managementGroup.studentsAssigned.map((student: any) => (
                    <div key={student.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium">{student.name}</h4>
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div className="bg-blue-100 rounded p-2">
                            <p className="text-xs text-blue-600">إجمالي الرسوم</p>
                            <p className="font-bold text-blue-800">0 د.ج</p>
                          </div>
                          <div className="bg-green-100 rounded p-2">
                            <p className="text-xs text-green-600">المدفوع</p>
                            <p className="font-bold text-green-800">0 د.ج</p>
                          </div>
                          <div className="bg-yellow-100 rounded p-2">
                            <p className="text-xs text-yellow-600">المعلق</p>
                            <p className="font-bold text-yellow-800">0 د.ج</p>
                          </div>
                          <div className="bg-red-100 rounded p-2">
                            <p className="text-xs text-red-600">المتأخر</p>
                            <p className="font-bold text-red-800">0 د.ج</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-700">المعاملات الأخيرة</h5>
                        <div className="bg-white rounded border p-3">
                          <p className="text-sm text-gray-500 text-center py-2">لا توجد معاملات مالية</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">لا يوجد طلاب مسجلين في هذه المجموعة</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Transaction Modal */}
      {showNewTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center">
                  <CreditCard className="w-5 h-5 ml-2 text-purple-600" />
                  معاملة مالية جديدة
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewTransactionModal(false)}
                >
                  إغلاق
                </Button>
              </div>

              <form onSubmit={handleCreateTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الطالب *
                  </label>
                  <select
                    value={newTransaction.studentId}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, studentId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">اختر الطالب</option>
                    {managementGroup?.studentsAssigned?.map((student: any) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع المعاملة *
                  </label>
                  <select
                    value={newTransaction.transactionType}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, transactionType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="fee">رسوم</option>
                    <option value="payment">دفع</option>
                    <option value="refund">استرداد</option>
                    <option value="discount">خصم</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المبلغ (بالدينار الجزائري) *
                  </label>
                  <input
                    type="number"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الوصف *
                  </label>
                  <textarea
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="وصف المعاملة المالية"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تاريخ الاستحقاق
                  </label>
                  <input
                    type="date"
                    value={newTransaction.dueDate}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الحالة
                  </label>
                  <select
                    value={newTransaction.status}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="pending">معلق</option>
                    <option value="paid">مدفوع</option>
                    <option value="overdue">متأخر</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowNewTransactionModal(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTransactionMutation.isPending}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {createTransactionMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء المعاملة'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}