import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, X, Check, CheckCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  relatedId?: number;
  createdAt: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'suggestion': return '📥';
    case 'message': return '💬';
    case 'blog': return '📚';
    case 'announcement': return '📅';
    case 'group_update': return '👥';
    case 'formation_update': return '🎓';
    default: return '🔔';
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'suggestion': return 'bg-blue-100 text-blue-800';
    case 'message': return 'bg-green-100 text-green-800';
    case 'blog': return 'bg-purple-100 text-purple-800';
    case 'announcement': return 'bg-orange-100 text-orange-800';
    case 'group_update': return 'bg-indigo-100 text-indigo-800';
    case 'formation_update': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: isOpen && !!user
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest('POST', `/api/notifications/${notificationId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    }
  });

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read first
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on notification type
    const schoolCode = sessionStorage.getItem('schoolCode');
    const basePath = schoolCode ? `/school/${schoolCode}` : '';
    
    switch (notification.type) {
      case 'blog':
        navigate(`${basePath}/blog`);
        break;
      case 'announcement':
        navigate(`${basePath}/announcements`);
        break;
      case 'group_update':
        navigate(`${basePath}/groups`);
        break;
      case 'formation_update':
        navigate(`${basePath}/formations`);
        break;
      case 'message':
        navigate(`${basePath}/messages`);
        break;
      case 'suggestion':
        if (user?.role === 'admin') {
          navigate(`${basePath}/admin/suggestions`);
        } else {
          navigate(`${basePath}/suggestions`);
        }
        break;
      default:
        // For unknown types, stay in notifications
        break;
    }
    
    // Close the panel
    onClose();
  };

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/notifications/mark-all-read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    }
  });

  console.log('NotificationPanel render - isOpen:', isOpen, 'notifications:', notifications.length);
  
  if (!isOpen) {
    console.log('Panel closed, returning null');
    return null;
  }
  
  console.log('Panel open, rendering with z-index 9999');

  return (
    <div className="fixed inset-0 bg-red-500 bg-opacity-80 z-[9999] flex justify-center items-center">
      <div className="bg-yellow-300 border-4 border-red-600 p-8 rounded-lg shadow-2xl max-w-md w-full mx-4">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-black">
              🔔 NOTIFICATIONS TEST
            </h2>
            <Button
              onClick={onClose}
              className="bg-red-600 text-white"
            >
              ❌ CLOSE
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="text-xl text-black font-bold">
              📊 Total Notifications: {notifications.length}
            </div>
            
            {notifications.map((notification, index) => (
              <div key={notification.id} className="bg-white p-4 border-2 border-black rounded">
                <div className="text-lg font-bold text-black mb-2">
                  #{index + 1}: {notification.type}
                </div>
                <div className="text-black mb-2">
                  <strong>Title:</strong> {notification.title}
                </div>
                <div className="text-black mb-2">
                  <strong>Message:</strong> {notification.message}
                </div>
                <div className="text-black text-sm">
                  <strong>Read:</strong> {notification.read ? 'Yes' : 'No'}
                </div>
                <Button 
                  onClick={() => handleNotificationClick(notification)}
                  className="mt-2 bg-green-600 text-white"
                >
                  CLICK TO NAVIGATE
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}