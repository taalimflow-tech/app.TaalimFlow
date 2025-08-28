import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { X, User, BookOpen, GraduationCap, Phone, Mail, Plus, Trash2, UserPlus } from 'lucide-react';

interface TeacherWithSpecializations {
  id: number;
  name: string;
  email: string;
  phone: string;
  profilePicture?: string;
  role: string;
  gender?: string;
  specializations: {
    id: number;
    name: string;
    nameAr: string;
    educationLevel: string;
    grade: string;
  }[];
}

interface CreateTeacherFormData {
  name: string;
  email: string;
  phone: string;
  bio: string;
  subject: string;
  imageUrl: string;
}

export default function Teachers() {
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherWithSpecializations | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateTeacherFormData>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    subject: '',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSpecializationModal, setShowSpecializationModal] = useState(false);
  const [teacherForSpecialization, setTeacherForSpecialization] = useState<TeacherWithSpecializations | null>(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: teachers = [], isLoading: loading } = useQuery<TeacherWithSpecializations[]>({
    queryKey: ['/api/teachers-with-specializations'],
  });

  // Fetch teaching modules from database
  const { data: teachingModules = [], isLoading: loadingModules } = useQuery<Array<{
    id: number;
    name: string;
    nameAr: string;
    educationLevel: string;
    description?: string;
  }>>({
    queryKey: ['/api/teaching-modules'],
  });

  // Organize teaching modules by education level for dropdown
  const subjectsByLevel = teachingModules.reduce((acc: Record<string, string[]>, module) => {
    const level = module.educationLevel;
    if (!acc[level]) {
      acc[level] = [];
    }
    if (!acc[level].includes(module.nameAr)) {
      acc[level].push(module.nameAr);
    }
    return acc;
  }, {} as Record<string, string[]>);

  // Flatten subjects for dropdown with education level labels
  const allSubjects = Object.entries(subjectsByLevel).flatMap(([level, subjects]) =>
    subjects.map(subject => ({
      value: `${subject} (${level})`,
      label: `${subject} (${level})`,
      subject,
      level
    }))
  );

  // Teacher creation mutation - create user account instead of teacher record
  const createTeacherMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating teacher user with data:', data);
      const response = await fetch('/api/users/create-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // This ensures session cookies are sent
        body: JSON.stringify(data),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${responseText}`);
      }
      
      try {
        return JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }
    },
    onSuccess: () => {
      toast({ title: 'تم إنشاء المعلم بنجاح' });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/teachers-with-specializations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      console.error('Teacher creation error:', error);
      toast({ 
        title: 'خطأ في إنشاء المعلم', 
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive' 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      bio: '',
      subject: '',
      imageUrl: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setShowCreateForm(false);
  };

  // Image upload handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let imageUrl = formData.imageUrl;
      
      if (imageFile) {
        setIsUploading(true);
        console.log('Uploading image...');
        
        const uploadFormData = new FormData();
        uploadFormData.append('contentImage', imageFile);
        
        const uploadResponse = await fetch('/api/upload-content', {
          method: 'POST',
          credentials: 'include', // Add credentials for session
          body: uploadFormData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('فشل في رفع الصورة');
        }
        
        const uploadResult = await uploadResponse.json();
        imageUrl = uploadResult.imageUrl;
        console.log('Image uploaded successfully:', imageUrl);
      }
      
      setIsUploading(false);
      
      const teacherData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        bio: formData.bio || null,
        imageUrl: imageUrl || null,
        specializations: formData.subject ? [formData.subject] : []
      };
      
      console.log('Submitting teacher data:', teacherData);
      createTeacherMutation.mutate(teacherData);
      
    } catch (error) {
      setIsUploading(false);
      console.error('Error in form submission:', error);
      toast({
        title: 'خطأ في رفع الصورة',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive'
      });
    }
  };

  const educationLevels = [
    { value: 'all', label: 'جميع المستويات' },
    { value: 'الابتدائي', label: 'الابتدائي' },
    { value: 'المتوسط', label: 'المتوسط' },
    { value: 'الثانوي', label: 'الثانوي' }
  ];

  const filteredTeachers = selectedLevel === 'all' 
    ? teachers 
    : teachers.filter(teacher => 
        teacher.specializations.some(spec => spec.educationLevel === selectedLevel)
      );

  // Color schemes for different education levels
  const getLevelColors = (educationLevel: string) => {
    switch (educationLevel) {
      case 'الابتدائي':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          text: 'text-green-800 dark:text-green-200',
          border: 'border-green-200 dark:border-green-700',
          badge: 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
        };
      case 'المتوسط':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-800 dark:text-blue-200',
          border: 'border-blue-200 dark:border-blue-700',
          badge: 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
        };
      case 'الثانوي':
        return {
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          text: 'text-purple-800 dark:text-purple-200',
          border: 'border-purple-200 dark:border-purple-700',
          badge: 'bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-700/20',
          text: 'text-gray-800 dark:text-gray-200',
          border: 'border-gray-200 dark:border-gray-700',
          badge: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
        };
    }
  };

  // Helper function to get Arabic label for education level
  const getEducationLevelLabel = (level: string) => {
    // Education levels are already in Arabic in the database, so return as-is
    return level;
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { teacherId: number; subject: string; content: string }) => {
      // Find the teacher and their corresponding user ID
      const teacher = filteredTeachers.find(t => t.id === data.teacherId);
      if (!teacher) {
        throw new Error('Teacher not found');
      }
      
      const payload = {
        senderId: user?.id,
        receiverId: teacher.id, // Teacher's user ID (same as teacher.id in getTeachersWithSpecializations)
        teacherId: null, // Set to null since we're using user-to-user messaging
        subject: data.subject,
        content: data.content,
        schoolId: user?.schoolId // Add required schoolId field
      };
      
      console.log('Sending teacher message with payload:', payload);
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include', // Ensure session cookies are sent
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Teacher message send failed:', errorText);
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم إرسال الرسالة بنجاح",
        description: "سيتم الرد عليك في أقرب وقت ممكن",
      });
      setSelectedTeacher(null);
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إرسال الرسالة",
        description: error.message || "حدث خطأ أثناء إرسال الرسالة",
        variant: "destructive",
      });
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (teacherId: number) => {
      const response = await fetch(`/api/teachers/${teacherId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete teacher');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'تم حذف المعلم بنجاح',
        description: 'تم حذف المعلم من النظام'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teachers-with-specializations'] });
    },
    onError: (error: any) => {
      console.error('Teacher delete error:', error);
      toast({
        title: 'فشل في حذف المعلم',
        description: error?.message || 'حدث خطأ غير متوقع',
        variant: 'destructive'
      });
    }
  });

  // Add Teacher Specialization Mutation
  const addSpecializationMutation = useMutation({
    mutationFn: async (data: { teacherId: number; specialization: string }) => {
      const response = await fetch('/api/teacher-specializations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: data.teacherId,
          specialization: data.specialization
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add specialization');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers-with-specializations'] });
      setShowSpecializationModal(false);
      setTeacherForSpecialization(null);
      setSelectedSpecialization('');
      toast({
        title: "تم إضافة التخصص بنجاح",
        description: "تم حفظ التخصص في قاعدة البيانات.",
      });
    },
    onError: (error: any) => {
      console.error('Error adding specialization:', error);
      toast({
        title: "خطأ في إضافة التخصص",
        description: error.message || "حدث خطأ أثناء إضافة التخصص. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteTeacher = (teacherId: number, teacherName: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المعلم "${teacherName}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      deleteTeacherMutation.mutate(teacherId);
    }
  };

  const handleAddSpecialization = (teacher: TeacherWithSpecializations) => {
    setTeacherForSpecialization(teacher);
    setSelectedSpecialization('');
    setShowSpecializationModal(true);
  };

  const handleSaveSpecialization = () => {
    if (!teacherForSpecialization || !selectedSpecialization) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى اختيار التخصص",
        variant: "destructive",
      });
      return;
    }

    addSpecializationMutation.mutate({
      teacherId: teacherForSpecialization.id,
      specialization: selectedSpecialization
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeacher || !user) {
      return;
    }
    
    const formData = new FormData(e.target as HTMLFormElement);
    const content = formData.get('message') as string;
    
    if (!content.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى كتابة رسالة",
        variant: "destructive",
      });
      return;
    }
    
    sendMessageMutation.mutate({
      teacherId: selectedTeacher.id,
      subject: "رسالة",
      content: content.trim(),
    });
  };

  if (loading || loadingModules) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-3 text-gray-600 dark:text-gray-300">جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">المعلمون</h2>
        {user?.role === 'admin' && (
          <Button 
            onClick={() => setShowCreateForm(true)} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            إضافة معلم جديد
          </Button>
        )}
      </div>
      
      {/* Level Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        {educationLevels.map((level) => {
          const levelColors = getLevelColors(level.value);
          return (
            <button
              key={level.value}
              onClick={() => setSelectedLevel(level.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedLevel === level.value
                  ? `${levelColors.badge} font-bold`
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {level.label}
            </button>
          );
        })}
      </div>
      
      <div className="space-y-4">
        {filteredTeachers.length > 0 ? (
          filteredTeachers.map((teacher) => {
            // Get the primary education level for this teacher
            const primaryLevel = teacher.specializations.length > 0 ? teacher.specializations[0].educationLevel : null;
            const levelColors = primaryLevel ? getLevelColors(primaryLevel) : getLevelColors('default');
            
            return (
              <Card key={teacher.id} className={`hover:shadow-md transition-shadow ${levelColors.bg} ${levelColors.border} border-2`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-reverse space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    {teacher.profilePicture ? (
                      <img 
                        src={teacher.profilePicture}
                        alt={teacher.name} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        primaryLevel === 'الابتدائي' ? 'bg-green-100 dark:bg-green-800' :
                        primaryLevel === 'المتوسط' ? 'bg-blue-100 dark:bg-blue-800' :
                        primaryLevel === 'الثانوي' ? 'bg-purple-100 dark:bg-purple-800' :
                        'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <User className={`w-8 h-8 ${
                          primaryLevel === 'الابتدائي' ? 'text-green-600 dark:text-green-200' :
                          primaryLevel === 'المتوسط' ? 'text-blue-600 dark:text-blue-200' :
                          primaryLevel === 'الثانوي' ? 'text-purple-600 dark:text-purple-200' :
                          'text-gray-600 dark:text-gray-300'
                        }`} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-reverse space-x-2 mb-2">
                      <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg">
                        {teacher.gender === 'male' ? 'الأستاذ ' : teacher.gender === 'female' ? 'الأستاذة ' : ''}{teacher.name}
                      </h3>
                    </div>
                    
                    {/* Contact Information - Only visible to admins */}
                    {user?.role === 'admin' && (
                      <>
                        <div className="flex items-center space-x-reverse space-x-2 mb-2">
                          <Mail className={`w-4 h-4 ${
                            primaryLevel === 'Primary' ? 'text-green-500' :
                            primaryLevel === 'Middle' ? 'text-blue-500' :
                            primaryLevel === 'Secondary' ? 'text-purple-500' :
                            'text-gray-500'
                          }`} />
                          <span className="text-sm text-gray-600 dark:text-gray-300">{teacher.email}</span>
                        </div>
                        
                        {teacher.phone && (
                          <div className="flex items-center space-x-reverse space-x-2 mb-3">
                            <Phone className={`w-4 h-4 ${
                              primaryLevel === 'Primary' ? 'text-green-500' :
                              primaryLevel === 'Middle' ? 'text-blue-500' :
                              primaryLevel === 'Secondary' ? 'text-purple-500' :
                              'text-gray-500'
                            }`} />
                            <span className="text-sm text-gray-600 dark:text-gray-300">{teacher.phone}</span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Specializations */}
                    {teacher.specializations.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center space-x-reverse space-x-2 mb-2">
                          <BookOpen className={`w-4 h-4 ${
                            primaryLevel === 'Primary' ? 'text-green-600' :
                            primaryLevel === 'Middle' ? 'text-blue-600' :
                            primaryLevel === 'Secondary' ? 'text-purple-600' :
                            'text-gray-600'
                          }`} />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">التخصصات:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {teacher.specializations.map((spec, index) => {
                            const colors = getLevelColors(spec.educationLevel);
                            return (
                              <span 
                                key={index}
                                className={`inline-flex items-center px-2 py-1 text-xs ${colors.badge} rounded-full`}
                              >
                                {spec.nameAr}
                                <span className="mr-1 opacity-75">({getEducationLevelLabel(spec.educationLevel)})</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {teacher.specializations.length === 0 && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-500 dark:text-gray-400 italic">لم يتم تحديد التخصصات بعد</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2 space-x-reverse">
                  <Button 
                    className={`flex-1 text-white ${
                      primaryLevel === 'Primary' ? 'bg-green-600 hover:bg-green-700' :
                      primaryLevel === 'Middle' ? 'bg-blue-600 hover:bg-blue-700' :
                      primaryLevel === 'Secondary' ? 'bg-purple-600 hover:bg-purple-700' :
                      'bg-gray-600 hover:bg-gray-700'
                    }`}
                    onClick={() => {
                      setSelectedTeacher(teacher);
                    }}
                  >
                    إرسال رسالة
                  </Button>
                  
                  {user?.role === 'admin' && (
                    <>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="px-3"
                        onClick={() => handleAddSpecialization(teacher)}
                        disabled={addSpecializationMutation.isPending}
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        variant="destructive"
                        size="sm"
                        className="px-3"
                        onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                        disabled={deleteTeacherMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })
        ) : (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {selectedLevel === 'all' 
                ? 'لا يوجد معلمين متاحين حالياً' 
                : `لا يوجد معلمين لمستوى ${educationLevels.find(l => l.value === selectedLevel)?.label}`
              }
            </p>
          </div>
        )}
      </div>
      
      {/* Create Teacher Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold dark:text-white">إضافة معلم جديد</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded dark:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">اسم المعلم</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="اكتب اسم المعلم"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="البريد الإلكتروني للمعلم"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="رقم هاتف المعلم"
                />
              </div>

              {/* Subject Field */}
              <div>
                <Label htmlFor="subject">المادة التخصص</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => setFormData({ ...formData, subject: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المادة التي يدرسها المعلم" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(subjectsByLevel).map(([level, subjects]) => (
                      <div key={level}>
                        <div className="px-2 py-1 text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                          {level}
                        </div>
                        {subjects.map((subject) => (
                          <SelectItem key={`${subject}-${level}`} value={`${subject} (${level})`}>
                            {subject}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="bio">نبذة عن المعلم</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="اكتب نبذة عن المعلم"
                  rows={3}
                />
              </div>
              
              {/* Image Upload */}
              <div>
                <Label htmlFor="image">صورة المعلم (اختياري)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-1"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img src={imagePreview} alt="Preview" className="w-32 h-32 object-contain rounded-lg bg-gray-100" />
                  </div>
                )}
              </div>

              <div className="flex space-x-2 space-x-reverse pt-4">
                <Button
                  type="submit"
                  disabled={createTeacherMutation.isPending || isUploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUploading
                    ? 'جاري رفع الصورة...'
                    : createTeacherMutation.isPending
                      ? 'جاري الإنشاء...'
                      : 'إنشاء المعلم'
                  }
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="text-gray-600"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Custom Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold dark:text-white">إرسال رسالة إلى {selectedTeacher.gender === 'male' ? 'الأستاذ ' : selectedTeacher.gender === 'female' ? 'الأستاذة ' : ''}{selectedTeacher.name}</h2>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded dark:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Teacher Info in Modal */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-reverse space-x-3">
                {selectedTeacher.profilePicture ? (
                  <img 
                    src={selectedTeacher.profilePicture}
                    alt={selectedTeacher.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedTeacher.specializations.length > 0 ? 
                      (selectedTeacher.specializations[0].educationLevel === 'الابتدائي' ? 'bg-green-100 dark:bg-green-800' :
                       selectedTeacher.specializations[0].educationLevel === 'المتوسط' ? 'bg-blue-100 dark:bg-blue-800' :
                       selectedTeacher.specializations[0].educationLevel === 'الثانوي' ? 'bg-purple-100 dark:bg-purple-800' :
                       'bg-gray-100 dark:bg-gray-700') :
                      'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <User className={`w-6 h-6 ${
                      selectedTeacher.specializations.length > 0 ? 
                        (selectedTeacher.specializations[0].educationLevel === 'الابتدائي' ? 'text-green-600 dark:text-green-200' :
                         selectedTeacher.specializations[0].educationLevel === 'المتوسط' ? 'text-blue-600 dark:text-blue-200' :
                         selectedTeacher.specializations[0].educationLevel === 'الثانوي' ? 'text-purple-600 dark:text-purple-200' :
                         'text-gray-600 dark:text-gray-300') :
                        'text-gray-600 dark:text-gray-300'
                    }`} />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-reverse space-x-2 mb-1">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">
                      {selectedTeacher.gender === 'male' ? 'الأستاذ ' : selectedTeacher.gender === 'female' ? 'الأستاذة ' : ''}{selectedTeacher.name}
                    </h3>
                  </div>
                  {user?.role === 'admin' && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">{selectedTeacher.email}</p>
                  )}
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <Label htmlFor="message">الرسالة</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="اكتب رسالتك هنا..."
                  rows={4}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? "جاري الإرسال..." : "إرسال الرسالة"}
              </Button>
            </form>
          </div>
        </div>
      )}
      
      {/* Add Specialization Modal */}
      {showSpecializationModal && teacherForSpecialization && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold dark:text-white">إضافة تخصص للمعلم</h2>
              <button
                onClick={() => setShowSpecializationModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded dark:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Teacher Info */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-reverse space-x-3">
                {teacherForSpecialization.profilePicture ? (
                  <img 
                    src={teacherForSpecialization.profilePicture}
                    alt={teacherForSpecialization.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <User className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">
                    {teacherForSpecialization.gender === 'male' ? 'الأستاذ ' : teacherForSpecialization.gender === 'female' ? 'الأستاذة ' : ''}{teacherForSpecialization.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{teacherForSpecialization.email}</p>
                </div>
              </div>
            </div>

            {/* Subject Selection */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="specialization">اختر التخصص</Label>
                <Select
                  value={selectedSpecialization}
                  onValueChange={setSelectedSpecialization}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المادة التي يدرسها المعلم" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(subjectsByLevel).map(([level, subjects]) => (
                      <div key={level}>
                        <div className="px-2 py-1 text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                          {level}
                        </div>
                        {subjects.map((subject) => (
                          <SelectItem key={`${subject}-${level}`} value={`${subject} (${level})`}>
                            {subject}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex space-x-2 space-x-reverse pt-4">
                <Button
                  onClick={handleSaveSpecialization}
                  disabled={addSpecializationMutation.isPending || !selectedSpecialization}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {addSpecializationMutation.isPending ? 'جاري الحفظ...' : 'حفظ التخصص'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSpecializationModal(false)}
                  className="text-gray-600"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
