import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Message } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function Messages() {
  const { user } = useAuth();
  
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
  });

  // Filter messages for the current user/teacher
  const userMessages = messages.filter(message => {
    if (user?.role === 'teacher') {
      // Teachers see messages sent to them
      return message.teacherId && message.teacherId.toString() === user.id.toString();
    } else {
      // Regular users see messages they sent
      return message.senderId && message.senderId.toString() === user?.id.toString();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">الرسائل</h2>
      
      <div className="space-y-4">
        {userMessages.length > 0 ? (
          userMessages.map((message) => (
            <Card key={message.id} className="border-r-4 border-r-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{message.subject}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={message.read ? "secondary" : "default"}>
                      {message.read ? "مقروءة" : "جديدة"}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(message.createdAt), { 
                        addSuffix: true, 
                        locale: ar 
                      })}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{message.content}</p>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    {user?.role === 'teacher' 
                      ? `رسالة من طالب` 
                      : `رسالة إلى المعلم`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">لا توجد رسائل حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}