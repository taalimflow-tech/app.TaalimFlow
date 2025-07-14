import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Message } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { MoreVertical, Shield, ShieldOff, AlertTriangle, User, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Report Modal Component
const ReportModal = ({ isOpen, onClose, onReport, userName }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onReport: (reason: string, description: string) => void;
  userName: string;
}) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  
  const handleSubmit = () => {
    if (reason.trim()) {
      onReport(reason, description);
      setReason('');
      setDescription('');
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" dir="rtl">
        <h2 className="text-lg font-bold mb-4">الإبلاغ عن {userName}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">سبب الإبلاغ</label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">اختر السبب</option>
              <option value="spam">رسائل مزعجة</option>
              <option value="harassment">تحرش</option>
              <option value="inappropriate">محتوى غير لائق</option>
              <option value="other">أخرى</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">تفاصيل إضافية (اختياري)</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded-md h-20"
              placeholder="اكتب تفاصيل إضافية..."
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={!reason.trim()}>إبلاغ</Button>
        </div>
      </div>
    </div>
  );
};

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  
  const { data: messages, isLoading } = useQuery({
    queryKey: ['/api/messages/with-user-info'],
    enabled: !!user,
  });

  const { data: blockedUsers } = useQuery({
    queryKey: ['/api/blocked-users'],
    enabled: !!user,
  });

  const blockUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason?: string }) => {
      return await apiRequest('/api/block-user', {
        method: 'POST',
        body: { blockedId: userId, reason }
      });
    },
    onSuccess: () => {
      toast({
        title: "تم حظر المستخدم",
        description: "لن تتمكن من رؤية رسائل هذا المستخدم",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blocked-users'] });
    },
  });

  const unblockUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest('/api/unblock-user', {
        method: 'POST',
        body: { blockedId: userId }
      });
    },
    onSuccess: () => {
      toast({
        title: "تم إلغاء حظر المستخدم",
        description: "يمكنك الآن رؤية رسائل هذا المستخدم",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blocked-users'] });
    },
  });

  const reportUserMutation = useMutation({
    mutationFn: async ({ userId, reason, description }: { userId: number; reason: string; description: string }) => {
      return await apiRequest('/api/report-user', {
        method: 'POST',
        body: { reportedUserId: userId, reason, description }
      });
    },
    onSuccess: () => {
      toast({
        title: "تم الإبلاغ",
        description: "تم إرسال الإبلاغ للمراجعة",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return await apiRequest(`/api/messages/${messageId}/mark-read`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages/with-user-info'] });
    },
  });

  const handleBlockUser = (userId: number) => {
    blockUserMutation.mutate({ userId });
  };

  const handleUnblockUser = (userId: number) => {
    unblockUserMutation.mutate(userId);
  };

  const handleReportUser = (userId: number, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowReportModal(true);
  };

  const handleSubmitReport = (reason: string, description: string) => {
    if (selectedUserId) {
      reportUserMutation.mutate({ userId: selectedUserId, reason, description });
    }
  };

  const handleMarkAsRead = (messageId: number) => {
    markAsReadMutation.mutate(messageId);
  };

  const isUserBlocked = (userId: number): boolean => {
    return blockedUsers?.some((blocked: any) => blocked.blockedId === userId) || false;
  };

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="container mx-auto p-4" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">الرسائل</h1>
      </div>

      {messages && messages.length > 0 ? (
        <div className="space-y-2">
          {messages.map((message: any) => {
            const isMyMessage = message.senderId === user?.id;
            const otherUserId = isMyMessage ? message.receiverId : message.senderId;
            const otherUserName = isMyMessage ? message.receiverName : message.senderName;
            const otherUserProfilePicture = isMyMessage ? message.receiverProfilePicture : message.senderProfilePicture;
            const blocked = isUserBlocked(otherUserId);
            
            return (
              <Card key={message.id} className={`transition-all duration-200 ${
                !message.read && !isMyMessage ? 'border-r-4 border-r-blue-500 bg-blue-50' : ''
              } ${blocked ? 'opacity-50' : ''}`}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Profile Picture */}
                    <div className="flex-shrink-0">
                      {otherUserProfilePicture ? (
                        <img 
                          src={otherUserProfilePicture} 
                          alt={otherUserName} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                    </div>
                    
                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{otherUserName}</span>
                          {blocked && (
                            <Badge variant="destructive" className="text-xs">محظور</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>
                            {formatDistanceToNow(new Date(message.createdAt), { 
                              addSuffix: true, 
                              locale: ar 
                            })}
                          </span>
                          {!message.read && !isMyMessage && (
                            <Badge variant="secondary" className="text-xs">جديد</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <p className="font-medium text-sm mb-1">{message.subject}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{message.content}</p>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {!message.read && !isMyMessage && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleMarkAsRead(message.id)}
                              className="text-xs"
                            >
                              <MessageCircle className="w-3 h-3 mr-1" />
                              تم القراءة
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {blocked ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleUnblockUser(otherUserId)}
                              className="text-xs"
                            >
                              <ShieldOff className="w-3 h-3 mr-1" />
                              إلغاء الحظر
                            </Button>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleBlockUser(otherUserId)}
                                className="text-xs"
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                حظر
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleReportUser(otherUserId, otherUserName)}
                                className="text-xs"
                              >
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                إبلاغ
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">لا توجد رسائل</p>
        </div>
      )}

      <ReportModal 
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReport={handleSubmitReport}
        userName={selectedUserName}
      />
    </div>
  );
}