import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Teacher } from '@/types';

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'teachers'));
        const teachersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Teacher[];
        setTeachers(teachersData);
      } catch (error) {
        console.error('Error fetching teachers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement message sending to Firebase
    console.log('Sending message to teacher:', selectedTeacher?.id);
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
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
                      onClick={() => setSelectedTeacher(teacher)}
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
                        <Label htmlFor="subject">الموضوع</Label>
                        <Input
                          id="subject"
                          placeholder="اكتب موضوع الرسالة"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="message">الرسالة</Label>
                        <Textarea
                          id="message"
                          placeholder="اكتب رسالتك هنا..."
                          rows={4}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        إرسال الرسالة
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
