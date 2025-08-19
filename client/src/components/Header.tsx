import { useState } from 'react';
import { Bell, Menu, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { NotificationPanel } from './NotificationPanel';

export function Header() {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  // Get school context from storage
  const selectedSchool = JSON.parse(localStorage.getItem('selectedSchool') || 'null');
  const schoolCode = sessionStorage.getItem('schoolCode');

  // Fetch unread notification count
  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
    enabled: !!user,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  return (
    <header className="bg-gradient-to-r from-white via-white to-gray-50 border-b border-gray-100 sticky top-0 z-40 shadow-sm backdrop-blur-sm bg-white/95">
      <div className="lg:max-w-none lg:px-8 max-w-md mx-auto px-4 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate(schoolCode ? `/school/${schoolCode}/profile` : '/profile')}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        
        {/* Desktop: Page title */}
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold text-gray-800 bg-gradient-to-l from-gray-800 to-gray-600 bg-clip-text">
            {location.includes('/home') ? 'الرئيسية' :
             location.includes('/schedule') ? 'الجدول الدراسي' :
             location.includes('/teachers') ? 'المعلمين' :
             location.includes('/messages') ? 'الرسائل' :
             location.includes('/groups') ? 'المجموعات' :
             location.includes('/suggestions') ? 'الاقتراحات' :
             location.includes('/admin') ? 'لوحة الإدارة' :
             'مدرستي'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-reverse space-x-3">
          {selectedSchool?.logoUrl ? (
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm border-2 border-gray-200">
              <img 
                src={selectedSchool.logoUrl} 
                alt={`${selectedSchool.name} Logo`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14l9-5-9-5-9 5 9 5z"></path>
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
              </svg>
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              {selectedSchool?.name || 'مدرستي'}
            </h1>
            <p className="text-xs text-gray-500">منصة التعلم الذكية</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-reverse space-x-2">
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors lg:hidden"
          >
            <Bell className="w-6 h-6 text-gray-600" />
            {unreadCount.count > 0 && (
              <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount.count > 9 ? '9+' : unreadCount.count}
              </span>
            )}
          </button>
          
          {user && (
            <>
              <button 
                onClick={() => navigate(schoolCode ? `/school/${schoolCode}/profile` : '/profile')}
                className="p-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-contain border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                )}
              </button>
              
              <button 
                onClick={() => logout()}
                className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </>
          )}
        </div>
      </div>
      
      <NotificationPanel 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </header>
  );
}
