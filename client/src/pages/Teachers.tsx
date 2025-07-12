import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { X, User, BookOpen, GraduationCap, Phone, Mail } from 'lucide-react';

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

export default function Teachers() {
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherWithSpecializations | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: teachers = [], isLoading: loading } = useQuery<TeacherWithSpecializations[]>({
    queryKey: ['/api/teachers'],
  });

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
          bg: 'bg-green-50',
          text: 'text-green-800',
          border: 'border-green-200',
          badge: 'bg-green-100 text-green-800'
        };
      case 'المتوسط':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-800',
          border: 'border-blue-200',
          badge: 'bg-blue-100 text-blue-800'
        };
      case 'الثانوي':
        return {
          bg: 'bg-purple-50',
          text: 'text-purple-800',
          border: 'border-purple-200',
          badge: 'bg-purple-100 text-purple-800'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-800',
          border: 'border-gray-200',
          badge: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { teacherId: number; subject: string; content: string }) => {
      const payload = {
        senderId: user?.id,
        receiverId: user?.id, // For now, same as sender 
        teacherId: data.teacherId,
        subject: data.subject,
        content: data.content
      };
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeacher || !user) {
      return;
    }
    
    const formData = new FormData(e.target as HTMLFormElement);
    const subject = formData.get('subject') as string;
    const content = formData.get('message') as string;
    
    if (!subject.trim() || !content.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    sendMessageMutation.mutate({
      teacherId: selectedTeacher.id,
      subject: subject.trim(),
      content: content.trim(),
    });
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">المعلمون</h2>
      
      {/* Level Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-6 p-3 bg-gray-50 rounded-lg">
        {educationLevels.map((level) => {
          const levelColors = getLevelColors(level.value);
          return (
            <button
              key={level.value}
              onClick={() => setSelectedLevel(level.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedLevel === level.value
                  ? `${levelColors.badge} font-bold`
                  : 'bg-white text-gray-700 hover:bg-gray-100'
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
                    {teacher.imageUrl ? (
                      <img 
                        src={teacher.imageUrl}
                        alt={teacher.name} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        primaryLevel === 'الابتدائي' ? 'bg-green-100' :
                        primaryLevel === 'المتوسط' ? 'bg-blue-100' :
                        primaryLevel === 'الثانوي' ? 'bg-purple-100' :
                        'bg-gray-100'
                      }`}>
                        <User className={`w-8 h-8 ${
                          primaryLevel === 'الابتدائي' ? 'text-green-600' :
                          primaryLevel === 'المتوسط' ? 'text-blue-600' :
                          primaryLevel === 'الثانوي' ? 'text-purple-600' :
                          'text-gray-600'
                        }`} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-reverse space-x-2 mb-2">
                      <h3 className="font-bold text-gray-800 text-lg">
                        {teacher.gender === 'male' ? 'الأستاذ ' : teacher.gender === 'female' ? 'الأستاذة ' : ''}{teacher.name}
                      </h3>
                    </div>
                    
                    {/* Contact Information - Only visible to admins */}
                    {user?.role === 'admin' && (
                      <>
                        <div className="flex items-center space-x-reverse space-x-2 mb-2">
                          <Mail className={`w-4 h-4 ${
                            primaryLevel === 'الابتدائي' ? 'text-green-500' :
                            primaryLevel === 'المتوسط' ? 'text-blue-500' :
                            primaryLevel === 'الثانوي' ? 'text-purple-500' :
                            'text-gray-500'
                          }`} />
                          <span className="text-sm text-gray-600">{teacher.email}</span>
                        </div>
                        
                        {teacher.phone && (
                          <div className="flex items-center space-x-reverse space-x-2 mb-3">
                            <Phone className={`w-4 h-4 ${
                              primaryLevel === 'الابتدائي' ? 'text-green-500' :
                              primaryLevel === 'المتوسط' ? 'text-blue-500' :
                              primaryLevel === 'الثانوي' ? 'text-purple-500' :
                              'text-gray-500'
                            }`} />
                            <span className="text-sm text-gray-600">{teacher.phone}</span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Specializations */}
                    {teacher.specializations.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center space-x-reverse space-x-2 mb-2">
                          <BookOpen className={`w-4 h-4 ${
                            primaryLevel === 'الابتدائي' ? 'text-green-600' :
                            primaryLevel === 'المتوسط' ? 'text-blue-600' :
                            primaryLevel === 'الثانوي' ? 'text-purple-600' :
                            'text-gray-600'
                          }`} />
                          <span className="text-sm font-medium text-gray-700">التخصصات:</span>
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
                                <span className="mr-1 opacity-75">({spec.educationLevel})</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {teacher.specializations.length === 0 && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-500 italic">لم يتم تحديد التخصصات بعد</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Button 
                    className={`w-full text-white ${
                      primaryLevel === 'الابتدائي' ? 'bg-green-600 hover:bg-green-700' :
                      primaryLevel === 'المتوسط' ? 'bg-blue-600 hover:bg-blue-700' :
                      primaryLevel === 'الثانوي' ? 'bg-purple-600 hover:bg-purple-700' :
                      'bg-gray-600 hover:bg-gray-700'
                    }`}
                    onClick={() => {
                      setSelectedTeacher(teacher);
                    }}
                  >
                    إرسال رسالة
                  </Button>
                </div>
              </CardContent>
            </Card>
            );
          })
        ) : (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">
              {selectedLevel === 'all' 
                ? 'لا يوجد معلمين متاحين حالياً' 
                : `لا يوجد معلمين لمستوى ${educationLevels.find(l => l.value === selectedLevel)?.label}`
              }
            </p>
          </div>
        )}
      </div>
      
      {/* Custom Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">إرسال رسالة إلى {selectedTeacher.gender === 'male' ? 'الأستاذ ' : selectedTeacher.gender === 'female' ? 'الأستاذة ' : ''}{selectedTeacher.name}</h2>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Teacher Info in Modal */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-reverse space-x-3">
                {selectedTeacher.profilePicture ? (
                  <img 
                    src={`/uploads/${selectedTeacher.profilePicture}`}
                    alt={selectedTeacher.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedTeacher.specializations.length > 0 ? 
                      (selectedTeacher.specializations[0].educationLevel === 'الابتدائي' ? 'bg-green-100' :
                       selectedTeacher.specializations[0].educationLevel === 'المتوسط' ? 'bg-blue-100' :
                       selectedTeacher.specializations[0].educationLevel === 'الثانوي' ? 'bg-purple-100' :
                       'bg-gray-100') :
                      'bg-gray-100'
                  }`}>
                    <User className={`w-6 h-6 ${
                      selectedTeacher.specializations.length > 0 ? 
                        (selectedTeacher.specializations[0].educationLevel === 'الابتدائي' ? 'text-green-600' :
                         selectedTeacher.specializations[0].educationLevel === 'المتوسط' ? 'text-blue-600' :
                         selectedTeacher.specializations[0].educationLevel === 'الثانوي' ? 'text-purple-600' :
                         'text-gray-600') :
                        'text-gray-600'
                    }`} />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-reverse space-x-2 mb-1">
                    <h3 className="font-medium text-gray-800">
                      {selectedTeacher.gender === 'male' ? 'الأستاذ ' : selectedTeacher.gender === 'female' ? 'الأستاذة ' : ''}{selectedTeacher.name}
                    </h3>
                  </div>
                  {user?.role === 'admin' && (
                    <p className="text-sm text-gray-600">{selectedTeacher.email}</p>
                  )}
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <Label htmlFor="subject">الموضوع</Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="اكتب موضوع الرسالة"
                  required
                />
              </div>
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
    </div>
  );
}
