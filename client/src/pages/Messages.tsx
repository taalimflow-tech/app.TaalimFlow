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
  const [description, setDescription] = useState('');
  const [firstConfirmation, setFirstConfirmation] = useState(false);
  const [secondConfirmation, setSecondConfirmation] = useState(false);
  
  const handleSubmitReport = () => {
    if (firstConfirmation) {
      onReport('inappropriate', description);
      setDescription('');
      setFirstConfirmation(false);
      setSecondConfirmation(false);
      onClose();
    }
  };
  
  const handleClose = () => {
    setDescription('');
    setFirstConfirmation(false);
    setSecondConfirmation(false);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" dir="rtl">
        <h2 className="text-lg font-bold mb-4">الإبلاغ عن {userName}</h2>
        
        <div className="space-y-4">
          {/* First Confirmation */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800 mb-3">
              هل تريد الإبلاغ عن هذا المستخدم بسبب محتوى غير لائق أو مزعج؟
            </p>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="confirm-inappropriate"
                checked={firstConfirmation}
                onChange={(e) => setFirstConfirmation(e.target.checked)}
                className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
              />
              <label 
                htmlFor="confirm-inappropriate" 
                className="text-sm font-medium cursor-pointer"
              >
                نعم، أؤكد أن هذا المستخدم يرسل محتوى غير لائق أو مزعج
              </label>
            </div>
          </div>
          
          {/* Second Confirmation - Only shows if first is checked */}
          {firstConfirmation && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-800 mb-3">
                هل تريد من المدراء حظر هذا المستخدم نهائياً من التطبيق؟
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="confirm-ban"
                  checked={secondConfirmation}
                  onChange={(e) => setSecondConfirmation(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label 
                  htmlFor="confirm-ban" 
                  className="text-sm font-medium cursor-pointer"
                >
                  نعم، أريد من المدراء حظر هذا المستخدم نهائياً من التطبيق
                </label>
              </div>
              <div className="bg-gray-100 p-2 rounded-lg mt-2">
                <p className="text-xs text-gray-600">
                  تحذير: سيتم إرسال الإبلاغ للمراجعة وقد يؤدي إلى حظر المستخدم من الوصول للتطبيق بالكامل
                </p>
              </div>
            </div>
          )}
          
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
          <Button variant="outline" onClick={handleClose}>إلغاء</Button>
          <Button 
            onClick={handleSubmitReport} 
            disabled={!firstConfirmation}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            إرسال الإبلاغ
          </Button>
        </div>
      </div>
    </div>
  );
};

// Chat History Modal Component
const ChatHistoryModal = ({ isOpen, onClose, userId, userName, userProfilePicture }: { 
  isOpen: boolean; 
  onClose: () => void; 
  userId: number;
  userName: string;
  userProfilePicture: string | null;
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  
  const { data: chatHistory, isLoading } = useQuery({
    queryKey: ['/api/messages/conversation', userId],
    enabled: isOpen && !!userId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      console.log('Sending message with data:', messageData);
      try {
        const response = await apiRequest('POST', '/api/messages', messageData);
        return response.json();
      } catch (error: any) {
        console.error('API request failed:', error);
        console.error('Error details:', error.message);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال الرسالة",
        description: "تم إرسال الرسالة بنجاح",
      });
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversation', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/with-user-info'] });
    },
    onError: (error: any) => {
      console.error('Message send error:', error);
      toast({
        title: "خطأ في إرسال الرسالة",
        description: error.message || "حدث خطأ أثناء إرسال الرسالة",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال رسالة",
        variant: "destructive",
      });
      return;
    }

    console.log('Preparing to send message');
    console.log('User data:', { id: user?.id, schoolId: user?.schoolId });
    console.log('Target user:', userId);
    console.log('Message content:', newMessage);

    const messageData = {
      senderId: user?.id,
      receiverId: userId,
      subject: "رسالة",
      content: newMessage,
      schoolId: user?.schoolId,
    };

    console.log('Final message data being sent:', messageData);
    sendMessageMutation.mutate(messageData);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 h-[80vh] flex flex-col" dir="rtl">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            {userProfilePicture ? (
              <img 
                src={userProfilePicture} 
                alt={userName} 
                className="w-10 h-10 rounded-full object-contain"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold">{userName}</h2>
              <p className="text-sm text-gray-500">محادثة</p>
            </div>
          </div>
          <Button variant="outline" onClick={onClose} className="text-xs">
            إغلاق
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : chatHistory && chatHistory.length > 0 ? (
            <div className="space-y-3">
              {chatHistory.map((message: any) => {
                const isMyMessage = message.senderId === user?.id;
                return (
                  <div key={message.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl p-3 ${
                      isMyMessage 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${isMyMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatDistanceToNow(new Date(message.createdAt), { 
                          addSuffix: true, 
                          locale: ar 
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">لا توجد رسائل في هذه المحادثة</p>
            </div>
          )}
        </div>

        {/* Message Input Section - Messenger Style */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2 items-end">
            <input
              type="text"
              placeholder="اكتب رسالة..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 p-3 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending || !newMessage.trim()}
              className="rounded-full h-10 w-10 p-0"
            >
              {sendMessageMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                "➤"
              )}
            </Button>
          </div>
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
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatUserId, setChatUserId] = useState<number | null>(null);
  const [chatUserName, setChatUserName] = useState<string>('');
  const [chatUserProfilePicture, setChatUserProfilePicture] = useState<string | null>(null);
  
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['/api/messages/with-user-info'],
    enabled: !!user,
  });

  const { data: blockedUsers = [] } = useQuery({
    queryKey: ['/api/blocked-users'],
    enabled: !!user,
  });

  const blockUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason?: string }) => {
      console.log('Blocking user:', { userId, reason });
      return await apiRequest('POST', '/api/block-user', { blockedId: userId, reason });
    },
    onSuccess: () => {
      toast({
        title: "تم حظر المستخدم",
        description: "لن تتمكن من رؤية رسائل هذا المستخدم",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blocked-users'] });
    },
    onError: (error) => {
      console.error('Error blocking user:', error);
      toast({
        title: "خطأ في حظر المستخدم",
        description: error.message || "حدث خطأ أثناء حظر المستخدم",
        variant: "destructive",
      });
    },
  });

  const unblockUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest('POST', '/api/unblock-user', { blockedId: userId });
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
      return await apiRequest('POST', '/api/report-user', { reportedUserId: userId, reason, description });
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
      return await apiRequest('POST', `/api/messages/${messageId}/mark-read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages/with-user-info'] });
    },
  });

  const handleBlockUser = (userId: number) => {
    console.log('handleBlockUser called with userId:', userId);
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

  const handleOpenChatHistory = (userId: number, userName: string, userProfilePicture: string | null) => {
    setChatUserId(userId);
    setChatUserName(userName);
    setChatUserProfilePicture(userProfilePicture);
    setShowChatHistory(true);
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
            const otherUserRole = isMyMessage ? message.receiverRole : message.senderRole;
            const blocked = isUserBlocked(otherUserId);
            
            // Permission check: students and parents cannot block/report teachers or admins
            const canBlockOrReport = () => {
              console.log('canBlockOrReport check:', {
                currentUserRole: user?.role,
                otherUserRole: otherUserRole,
                otherUserId: otherUserId,
                otherUserName: otherUserName,
                hasUserRole: !!user?.role,
                hasOtherUserRole: !!otherUserRole
              });
              
              // DEBUG: Always show buttons for now to debug role issues
              console.log('DEBUG: Always showing buttons for debugging');
              return true;
            };
            
            return (
              <Card key={message.id} className={`transition-all duration-200 cursor-pointer hover:shadow-md ${
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
                          className="w-10 h-10 rounded-full object-contain"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                    </div>
                    
                    {/* Message Content - Clickable */}
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleOpenChatHistory(otherUserId, otherUserName, otherUserProfilePicture)}
                    >
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
                        <p className="text-sm text-gray-600 line-clamp-2">{message.content}</p>
                      </div>
                      

                    </div>
                  </div>
                  
                  {/* Action buttons - Separate row */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      {!message.read && !isMyMessage && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(message.id);
                          }}
                          className="text-xs"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          تم القراءة
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {canBlockOrReport() && (
                        <>
                          {blocked ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnblockUser(otherUserId);
                              }}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBlockUser(otherUserId);
                                }}
                                className="text-xs"
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                حظر
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReportUser(otherUserId, otherUserName);
                                }}
                                className="text-xs"
                              >
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                إبلاغ
                              </Button>
                            </>
                          )}
                        </>
                      )}
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
      
      <ChatHistoryModal
        isOpen={showChatHistory}
        onClose={() => setShowChatHistory(false)}
        userId={chatUserId || 0}
        userName={chatUserName}
        userProfilePicture={chatUserProfilePicture}
      />
    </div>
  );
}