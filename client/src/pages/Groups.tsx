import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Group } from '@shared/schema';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Users, Settings, BookOpen, GraduationCap, ChevronDown, ChevronUp, User } from 'lucide-react';

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

  // Admin data queries
  const { data: adminGroups = [], isLoading: loadingAdminGroups } = useQuery<any[]>({
    queryKey: ['/api/admin/groups'],
    enabled: user?.role === 'admin',
  });

  const { data: teachingModules = [] } = useQuery<any[]>({
    queryKey: ['/api/teaching-modules'],
    enabled: user?.role === 'admin',
  });

  const { data: teachers = [] } = useQuery<any[]>({
    queryKey: ['/api/teachers-with-specializations'],
    enabled: user?.role === 'admin',
  });

  const { data: availableStudents = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/groups/students', selectedAdminGroup?.educationLevel, selectedAdminGroup?.subjectId],
    enabled: user?.role === 'admin' && selectedAdminGroup?.educationLevel && selectedAdminGroup?.subjectId,
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

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGroup) {
      joinGroupMutation.mutate(selectedGroup.id);
    }
  };

  const handleOpenAssignmentModal = (group: any) => {
    setSelectedAdminGroup(group);
    setSelectedStudents(group.studentsAssigned || []);
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
                  <div className="space-y-4">
                    {/* Group by Education Level */}
                    {['الابتدائي', 'المتوسط', 'الثانوي'].map(level => {
                      const levelGroups = adminGroups.filter(g => g.educationLevel === level);
                      if (levelGroups.length === 0) return null;
                      
                      return (
                        <div key={level} className="border rounded-lg p-4 bg-white">
                          <h4 className={`font-semibold mb-3 px-3 py-1 rounded-full inline-block ${getEducationLevelColor(level)}`}>
                            <GraduationCap className="w-4 h-4 inline mr-2" />
                            {level}
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {levelGroups.map(group => (
                              <div key={group.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-medium text-gray-900">{group.name}</h5>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    ID: {group.id}
                                  </span>
                                </div>
                                
                                <div className="text-sm text-gray-600 mb-3">
                                  <div className="flex items-center gap-1 mb-1">
                                    <BookOpen className="w-3 h-3" />
                                    المادة: {group.subjectName || 'غير محددة'}
                                  </div>
                                  <div className="flex items-center gap-1 mb-1">
                                    <User className="w-3 h-3" />
                                    المعلم: {group.teacherName || 'غير مسند'}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    الطلاب: {group.studentsAssigned?.length || 0}
                                  </div>
                                </div>
                                
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenAssignmentModal(group)}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  إدارة التعيينات
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      )}
      
      {/* Public Groups Section */}
      <div className="grid grid-cols-1 gap-4">
        {groups.length > 0 ? (
          groups.map((group) => (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{group.name}</CardTitle>
                <p className="text-sm text-gray-600">{group.category}</p>
              </CardHeader>
              <CardContent>
                {group.imageUrl && (
                  <div className="mb-4">
                    <img 
                      src={group.imageUrl} 
                      alt={group.name} 
                      className="w-full h-48 object-cover rounded-lg"
                      style={{ aspectRatio: '16/9' }}
                    />
                  </div>
                )}
                <p className="text-gray-700 mb-4">{group.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    {group.maxMembers && `أقصى عدد: ${group.maxMembers} عضو`}
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-secondary"
                  onClick={() => {
                    setSelectedGroup(group);
                    setShowJoinForm(true);
                  }}
                >
                  انضم الآن
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">لا توجد مجموعات حالياً</p>
          </div>
        )}
      </div>

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
                <p><strong>المادة:</strong> {selectedAdminGroup.subjectName}</p>
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

              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اختيار الطلاب ({selectedStudents.length} محدد)
                </label>
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {availableStudents.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">لا توجد طلاب متاحين لهذا المستوى والمادة</p>
                  ) : (
                    <div className="space-y-2">
                      {availableStudents.map(student => (
                        <label key={student.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => toggleStudentSelection(student.id)}
                            className="mr-2"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-gray-600">المستوى: {student.educationLevel}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
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
    </div>
  );
}