import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Course } from '@shared/schema';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Eye, Users, Phone, Mail, Calendar, Plus, Edit, Trash, BookOpen } from 'lucide-react';

export default function Courses() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [selectedCourseForView, setSelectedCourseForView] = useState<Course | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showChildSelectionModal, setShowChildSelectionModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    duration: '',
    price: '',
    courseDate: '',
    courseTime: '',
    educationLevel: '',
    grade: '',
    subjectId: ''
  });

  const { data: courses = [], isLoading: loading } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
    enabled: !!user && !authLoading,
  });

  const { data: children = [] } = useQuery({
    queryKey: ['/api/children'],
    enabled: !!user && !authLoading,
  });

  // Query for course registrations (load for all users to check registration status)
  const { data: courseRegistrations = [], isLoading: registrationsLoading } = useQuery({
    queryKey: ['/api/course-registrations'],
    enabled: !!user && !authLoading,
  });

  // Query for teaching modules/subjects
  const { data: teachingModules = [] } = useQuery({
    queryKey: ['/api/teaching-modules'],
    enabled: !!user && !authLoading,
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/courses', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في إنشاء الدورة');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم إنشاء الدورة بنجاح' });
      setShowCreateForm(false);
      setCourseData({
        title: '',
        description: '',
        duration: '',
        price: '',
        courseDate: '',
        courseTime: '',
        educationLevel: '',
        grade: '',
        subjectId: ''
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'خطأ في إنشاء الدورة', 
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive' 
      });
    }
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/courses/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في تحديث الدورة');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم تحديث الدورة بنجاح' });
      setEditingCourse(null);
      setCourseData({
        title: '',
        description: '',
        duration: '',
        price: '',
        courseDate: '',
        courseTime: '',
        educationLevel: '',
        grade: '',
        subjectId: ''
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'خطأ في تحديث الدورة', 
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive' 
      });
    }
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await apiRequest('DELETE', `/api/courses/${courseId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في حذف الدورة');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم حذف الدورة بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'خطأ في حذف الدورة', 
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive' 
      });
    }
  });

  const joinCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Sending course registration data:', data);
      const response = await apiRequest('POST', '/api/course-registrations', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في التسجيل');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم التسجيل في الدورة بنجاح' });
      setShowJoinForm(false);
      setShowChildSelectionModal(false);
      setSelectedCourse(null);
      setSelectedChild(null);
      queryClient.invalidateQueries({ queryKey: ['/api/course-registrations'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'خطأ في التسجيل في الدورة', 
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive' 
      });
    }
  });

  // Helper function to check if current user is already registered for a course
  const isUserRegistered = (courseId: number) => {
    if (!courseRegistrations || !user?.id) return false;
    console.log('Checking course registration for:', { courseId, userId: user.id });
    console.log('Available course registrations:', courseRegistrations);
    
    const isRegistered = (courseRegistrations as any[])?.some((reg: any) => {
      console.log('Comparing:', { regCourseId: reg.courseId, regUserId: reg.userId, targetCourseId: courseId, targetUserId: user.id });
      return Number(reg.courseId) === Number(courseId) && Number(reg.userId) === Number(user.id) && reg.registrantType === 'self';
    });
    
    console.log('Course registration result:', isRegistered);
    return isRegistered || false;
  };

  // Helper function to check if a child is already registered for a course
  const isChildRegistered = (courseId: number, childId: number) => {
    if (!courseRegistrations || !user?.id) return false;
    
    return (courseRegistrations as any[])?.some((reg: any) => 
      Number(reg.courseId) === Number(courseId) && 
      Number(reg.userId) === Number(user.id) && 
      Number(reg.childId) === Number(childId) &&
      reg.registrantType === 'child'
    );
  };

  const getRegistrationsForCourse = (courseId: number) => {
    return (courseRegistrations as any[])?.filter((reg: any) => reg.courseId === courseId) || [];
  };

  // Helper function to get subject name
  const getSubjectName = (subjectId: number | string | null | undefined) => {
    if (!subjectId || !teachingModules) return null;
    const module = (teachingModules as any[]).find((module: any) => 
      module.id === Number(subjectId)
    );
    return module?.nameAr || null;
  };

  const handleViewRegistrations = (course: Course) => {
    setSelectedCourseForView(course);
    setShowRegistrationsModal(true);
  };

  const handleCreateCourse = () => {
    createCourseMutation.mutate(courseData);
  };

  const handleUpdateCourse = () => {
    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, data: courseData });
    }
  };

  const handleJoinCourse = () => {
    if (selectedCourse && user?.id && user?.name && user?.phone && user?.email) {
      console.log('Using user data for course registration:', {
        courseId: selectedCourse.id,
        userId: user.id,
        registrantType: 'self',
        fullName: user.name,
        phone: user.phone,
        email: user.email
      });
      
      joinCourseMutation.mutate({
        courseId: selectedCourse.id,
        registrantType: 'self',
        fullName: user.name,
        phone: user.phone,
        email: user.email,
        childId: null,
        childName: null,
        childAge: null
      });
    }
  };

  const handleJoinCourseForChild = () => {
    if (selectedCourse && selectedChild && user?.id && user?.phone && user?.email) {
      console.log('Registering child for course:', {
        courseId: selectedCourse.id,
        childId: selectedChild.id,
        childName: selectedChild.name
      });
      
      joinCourseMutation.mutate({
        courseId: selectedCourse.id,
        registrantType: 'child',
        childId: selectedChild.id,
        fullName: selectedChild.name,
        phone: user.phone,
        email: user.email,
        childName: selectedChild.name,
        childAge: selectedChild.age || null
      });
    }
  };

  const handleRegisterClick = (course: Course) => {
    setSelectedCourse(course);
    // Check if user has children to show selection modal
    if (children && Array.isArray(children) && children.length > 0) {
      setShowChildSelectionModal(true);
    } else {
      setShowJoinForm(true);
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseData({
      title: course.title,
      description: course.description,
      duration: course.duration || '',
      price: course.price,
      courseDate: course.courseDate,
      courseTime: course.courseTime,
      educationLevel: course.educationLevel || '',
      grade: course.grade || '',
      subjectId: course.subjectId?.toString() || ''
    });
    setShowCreateForm(true);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">يرجى تسجيل الدخول للوصول إلى الدورات</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              الدورات
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              استكشف الدورات المتاحة وسجل فيها أو سجل أطفالك
            </p>
          </div>
          
          {user.role === 'admin' && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              إضافة دورة جديدة
            </Button>
          )}
        </div>

        {/* Courses Grid */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-right mb-3">{course.title}</CardTitle>
                      
                      {/* Course Info - Static Modern Layout */}
                      <div className="space-y-3">
                        {/* Date and Time in one line */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500 dark:text-gray-400">📅</span>
                            <span className="text-gray-700 dark:text-gray-300">{course.courseDate}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500 dark:text-gray-400">🕒</span>
                            <span className="text-gray-700 dark:text-gray-300">{course.courseTime}</span>
                          </div>
                        </div>
                        
                        {/* Duration */}
                        {course.duration && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">⏱️</span>
                            <span className="text-gray-600 dark:text-gray-400 font-medium">المدة:</span>
                            <span className="text-gray-700 dark:text-gray-300">{course.duration}</span>
                          </div>
                        )}

                        {/* Grade */}
                        {course.grade && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">🎓</span>
                            <span className="text-gray-600 dark:text-gray-400 font-medium">السنة:</span>
                            <span className="text-gray-700 dark:text-gray-300">{course.grade}</span>
                          </div>
                        )}

                        {/* Subject */}
                        {getSubjectName(course.subjectId) && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">📚</span>
                            <span className="text-gray-600 dark:text-gray-400 font-medium">المادة:</span>
                            <span className="text-gray-700 dark:text-gray-300">{getSubjectName(course.subjectId)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {user.role === 'admin' && (
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCourse(course)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCourseMutation.mutate(course.id)}
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 text-right leading-relaxed">
                    {course.description}
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">السعر:</span>
                      <span className="text-primary font-bold text-lg">{course.price}</span>
                    </div>
                  </div>

                  {user.role === 'admin' ? (
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleViewRegistrations(course)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      عرض التسجيلات
                    </Button>
                  ) : (
                    <Button 
                      className={`w-full ${isUserRegistered(course.id) 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-primary to-secondary'
                      }`}
                      disabled={isUserRegistered(course.id)}
                      onClick={() => {
                        if (!isUserRegistered(course.id)) {
                          handleRegisterClick(course);
                        }
                      }}
                    >
                      {isUserRegistered(course.id) ? 'مُسجل بالفعل' : 'سجل الآن'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا توجد دورات متاحة حالياً</p>
          </div>
        )}
      </div>

      {/* Create/Edit Course Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">
                {editingCourse ? 'تعديل الدورة' : 'إضافة دورة جديدة'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCourse(null);
                  setCourseData({
                    title: '',
                    description: '',
                    duration: '',
                    price: '',
                    courseDate: '',
                    courseTime: '',
                    educationLevel: '',
                    grade: '',
                    subjectId: ''
                  });
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان الدورة</Label>
                <Input
                  id="title"
                  value={courseData.title}
                  onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                  placeholder="أدخل عنوان الدورة"
                  className="text-right"
                />
              </div>
              
              <div>
                <Label htmlFor="description">وصف الدورة</Label>
                <textarea
                  id="description"
                  value={courseData.description}
                  onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                  placeholder="أدخل وصف مفصل للدورة"
                  className="w-full p-2 border rounded-lg text-right h-24 resize-none dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              
              <div>
                <Label htmlFor="duration">المدة</Label>
                <Input
                  id="duration"
                  value={courseData.duration}
                  onChange={(e) => setCourseData({ ...courseData, duration: e.target.value })}
                  placeholder="مثال: 3 أشهر أو 12 أسبوع"
                  className="text-right"
                />
              </div>
              
              <div>
                <Label htmlFor="price">السعر</Label>
                <Input
                  id="price"
                  value={courseData.price}
                  onChange={(e) => setCourseData({ ...courseData, price: e.target.value })}
                  placeholder="مثال: 5000 دج"
                  className="text-right"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="courseDate">التاريخ</Label>
                  <Input
                    id="courseDate"
                    type="date"
                    value={courseData.courseDate}
                    onChange={(e) => setCourseData({ ...courseData, courseDate: e.target.value })}
                    className="text-right"
                  />
                </div>
                
                <div>
                  <Label htmlFor="courseTime">الوقت</Label>
                  <Input
                    id="courseTime"
                    type="time"
                    value={courseData.courseTime}
                    onChange={(e) => setCourseData({ ...courseData, courseTime: e.target.value })}
                    className="text-right"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="educationLevel">المستوى التعليمي</Label>
                  <Select
                    value={courseData.educationLevel}
                    onValueChange={(value) => setCourseData({ ...courseData, educationLevel: value, grade: '', subjectId: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المستوى" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="الابتدائي">الابتدائي</SelectItem>
                      <SelectItem value="المتوسط">المتوسط</SelectItem>
                      <SelectItem value="الثانوي">الثانوي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="grade">السنة</Label>
                  <Select
                    value={courseData.grade}
                    onValueChange={(value) => setCourseData({ ...courseData, grade: value, subjectId: '' })}
                    disabled={!courseData.educationLevel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر السنة" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseData.educationLevel === 'الابتدائي' && (
                        <>
                          <SelectItem value="الأولى ابتدائي">الأولى ابتدائي</SelectItem>
                          <SelectItem value="الثانية ابتدائي">الثانية ابتدائي</SelectItem>
                          <SelectItem value="الثالثة ابتدائي">الثالثة ابتدائي</SelectItem>
                          <SelectItem value="الرابعة ابتدائي">الرابعة ابتدائي</SelectItem>
                          <SelectItem value="الخامسة ابتدائي">الخامسة ابتدائي</SelectItem>
                        </>
                      )}
                      {courseData.educationLevel === 'المتوسط' && (
                        <>
                          <SelectItem value="الأولى متوسط">الأولى متوسط</SelectItem>
                          <SelectItem value="الثانية متوسط">الثانية متوسط</SelectItem>
                          <SelectItem value="الثالثة متوسط">الثالثة متوسط</SelectItem>
                          <SelectItem value="الرابعة متوسط">الرابعة متوسط</SelectItem>
                        </>
                      )}
                      {courseData.educationLevel === 'الثانوي' && (
                        <>
                          <SelectItem value="الأولى ثانوي">الأولى ثانوي</SelectItem>
                          <SelectItem value="الثانية ثانوي">الثانية ثانوي</SelectItem>
                          <SelectItem value="الثالثة ثانوي">الثالثة ثانوي</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="subjectId">المادة</Label>
                <Select
                  value={courseData.subjectId}
                  onValueChange={(value) => setCourseData({ ...courseData, subjectId: value })}
                  disabled={!courseData.educationLevel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    {(teachingModules as any[])
                      .filter((module: any) => 
                        module.educationLevel === courseData.educationLevel
                      )
                      .map((module: any) => (
                        <SelectItem key={module.id} value={module.id.toString()}>
                          {module.nameAr}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingCourse(null);
                    setCourseData({
                      title: '',
                      description: '',
                      duration: '',
                      price: '',
                      courseDate: '',
                      courseTime: '',
                      educationLevel: '',
                      grade: '',
                      subjectId: ''
                    });
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={editingCourse ? handleUpdateCourse : handleCreateCourse}
                  disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {(createCourseMutation.isPending || updateCourseMutation.isPending) ? 
                    'جاري المعالجة...' : 
                    editingCourse ? 'تحديث الدورة' : 'إنشاء الدورة'
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Child Selection Modal */}
      {showChildSelectionModal && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">اختر المتدرب</h2>
              <button
                onClick={() => {
                  setShowChildSelectionModal(false);
                  setSelectedCourse(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Self registration option */}
              <Button
                onClick={() => {
                  setShowChildSelectionModal(false);
                  setShowJoinForm(true);
                }}
                disabled={isUserRegistered(selectedCourse.id)}
                className={`w-full text-right ${isUserRegistered(selectedCourse.id) 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isUserRegistered(selectedCourse.id) ? 'أنت مُسجل بالفعل' : 'سجل نفسي'}
              </Button>
              
              {/* Children registration options */}
              {children && Array.isArray(children) && children.length > 0 ? (
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">أو سجل أحد الأطفال:</p>
                  {(children as any[]).map((child: any) => (
                    <Button
                      key={child.id}
                      onClick={() => {
                        setSelectedChild(child);
                        setShowChildSelectionModal(false);
                        handleJoinCourseForChild();
                      }}
                      disabled={isChildRegistered(selectedCourse.id, child.id)}
                      variant="outline"
                      className={`w-full mb-2 text-right ${isChildRegistered(selectedCourse.id, child.id) 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                      }`}
                    >
                      {isChildRegistered(selectedCourse.id, child.id) ? 
                        `${child.name} (مُسجل بالفعل)` : 
                        child.name
                      }
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Join Course Modal (Self Registration) */}
      {showJoinForm && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold dark:text-white">التسجيل في {selectedCourse.title}</h2>
              </div>
              <button
                onClick={() => {
                  setShowJoinForm(false);
                  setSelectedCourse(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong>الوصف:</strong> {selectedCourse.description}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong>السعر:</strong> {selectedCourse.price}
                </p>
                {selectedCourse.duration && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <strong>المدة:</strong> {selectedCourse.duration}
                  </p>
                )}
                {getSubjectName(selectedCourse.subjectId) && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <strong>المادة:</strong> {getSubjectName(selectedCourse.subjectId)}
                  </p>
                )}
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>التاريخ والوقت:</strong> {selectedCourse.courseDate} - {selectedCourse.courseTime}
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2 font-medium">
                  سيتم التسجيل باستخدام بيانات حسابك:
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>الاسم:</strong> {user?.name}<br/>
                  <strong>الهاتف:</strong> {user?.phone}<br/>
                  <strong>البريد:</strong> {user?.email}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    setShowJoinForm(false);
                    setSelectedCourse(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleJoinCourse}
                  disabled={joinCourseMutation.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {joinCourseMutation.isPending ? 'جاري التسجيل...' : 'سجل الآن'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Registrations Modal (Admin Only) */}
      {showRegistrationsModal && selectedCourseForView && user?.role === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                تسجيلات الدورة: {selectedCourseForView.title}
              </h2>
              <button
                onClick={() => {
                  setShowRegistrationsModal(false);
                  setSelectedCourseForView(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>التاريخ:</strong> {selectedCourseForView.courseDate}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>الوقت:</strong> {selectedCourseForView.courseTime}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>السعر:</strong> {selectedCourseForView.price}
                  </p>
                </div>
                <div>
                  {selectedCourseForView.duration && (
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong>المدة:</strong> {selectedCourseForView.duration}
                    </p>
                  )}
                  {selectedCourseForView.educationLevel && (
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong>المستوى:</strong> {selectedCourseForView.educationLevel}
                      {selectedCourseForView.grade && ` - ${selectedCourseForView.grade}`}
                    </p>
                  )}
                  {getSubjectName(selectedCourseForView.subjectId) && (
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong>المادة:</strong> {getSubjectName(selectedCourseForView.subjectId)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[60vh]">
              {registrationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {(() => {
                    const courseRegs = getRegistrationsForCourse(selectedCourseForView.id);
                    return courseRegs.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Users className="w-4 h-4 text-primary" />
                          <span className="font-medium">عدد التسجيلات: {courseRegs.length}</span>
                        </div>
                        
                        <div className="grid gap-4">
                          {courseRegs.map((registration: any) => (
                            <Card key={registration.id} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-gray-500" />
                                  <div>
                                    <p className="font-medium">{registration.fullName}</p>
                                    <p className="text-sm text-gray-500">
                                      {registration.registrantType === 'child' ? 'طفل' : 'مباشر'}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-blue-500" />
                                  <div>
                                    <p className="font-medium">{registration.userName || 'غير محدد'}</p>
                                    <p className="text-sm text-gray-500">اسم المستخدم</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-gray-500" />
                                  <div>
                                    <p className="font-medium">{registration.phone}</p>
                                    <p className="text-sm text-gray-500">رقم الهاتف</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-gray-500" />
                                  <div>
                                    <p className="font-medium">{registration.email}</p>
                                    <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-3 pt-3 border-t flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <p className="text-sm text-gray-500">
                                  تاريخ التسجيل: {new Date(registration.createdAt).toLocaleDateString('en-GB')}
                                </p>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">لا توجد تسجيلات لهذه الدورة حتى الآن</p>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t flex justify-end">
              <Button
                onClick={() => {
                  setShowRegistrationsModal(false);
                  setSelectedCourseForView(null);
                }}
                variant="outline"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}