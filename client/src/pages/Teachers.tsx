import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Teacher } from '@/types';
import { apiRequest } from '@/lib/queryClient';

export default function Teachers() {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: teachers = [], isLoading: loading } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { teacherId: number; subject: string; content: string }) => {
      const payload = {
        senderId: user?.id,
        receiverId: user?.id, // For now, same as sender 
        teacherId: data.teacherId,
        subject: data.subject,
        content: data.content
      };
      
      console.log('Sending message payload:', payload);
      
      return apiRequest('/api/messages', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data) => {
      console.log('Message sent successfully:', data);
      toast({
        title: "تم إرسال الرسالة بنجاح",
        description: "سيتم الرد عليك في أقرب وقت ممكن",
      });
      setSelectedTeacher(null);
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error: any) => {
      console.error('Error sending message:', error);
      toast({
        title: "خطأ في إرسال الرسالة",
        description: error.message || "حدث خطأ أثناء إرسال الرسالة",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted!');
    console.log('Selected teacher:', selectedTeacher);
    console.log('User:', user);
    
    if (!selectedTeacher || !user) {
      console.log('Missing selectedTeacher or user');
      return;
    }
    
    const formData = new FormData(e.target as HTMLFormElement);
    const subject = formData.get('subject') as string;
    const content = formData.get('message') as string;
    
    console.log('Form data:', { subject, content });
    
    if (!subject.trim() || !content.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Sending message mutation with:', {
      teacherId: selectedTeacher.id,
      subject: subject.trim(),
      content: content.trim(),
    });
    
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">التواصل مع المعلمين</h2>
      
      <div className="space-y-4">
        {teachers.length > 0 ? (
          teachers.map((teacher) => (
            <Card key={teacher.id}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-reverse space-x-3 mb-3">
                  <img 
                    src={teacher.imageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"} 
                    alt={teacher.name} 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{teacher.name}</h3>
                    <p className="text-sm text-gray-600">{teacher.subject}</p>
                  </div>
                  <div className="flex items-center space-x-reverse space-x-1">
                    <div className={`w-2 h-2 rounded-full ${teacher.available ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-xs text-gray-500">{teacher.available ? 'متاح' : 'غير متاح'}</span>
                  </div>
                </div>
                
                <Dialog open={selectedTeacher?.id === teacher.id} onOpenChange={(open) => {
                  if (!open) setSelectedTeacher(null);
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
                      onClick={() => {
                        console.log('Button clicked, setting teacher:', teacher);
                        setSelectedTeacher(teacher);
                      }}
                    >
                      إرسال رسالة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>إرسال رسالة إلى {teacher.name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSendMessage} className="space-y-4">
                      <div>
                        <Label htmlFor={`subject-${teacher.id}`}>الموضوع</Label>
                        <Input
                          id={`subject-${teacher.id}`}
                          name="subject"
                          placeholder="اكتب موضوع الرسالة"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor={`message-${teacher.id}`}>الرسالة</Label>
                        <Textarea
                          id={`message-${teacher.id}`}
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
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">لا يوجد معلمين متاحين حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}
