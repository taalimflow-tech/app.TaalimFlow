import { Home, Calendar, MessageCircle, Lightbulb, Mail, Shield, BookOpen } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

export function BottomNavigation() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  const baseNavItems: NavItem[] = [
    { icon: Home, label: 'الرئيسية', path: '/' },
    { icon: Calendar, label: 'الجدول', path: '/schedule' },
    { icon: MessageCircle, label: 'المعلمين', path: '/teachers' },
    { icon: Mail, label: 'الرسائل', path: '/messages' },
  ];

  // Add suggestions for non-admin users only
  const userNavItems = user?.role !== 'admin' 
    ? [...baseNavItems, { icon: Lightbulb, label: 'اقتراحات', path: '/suggestions' }]
    : baseNavItems;

  // Add teacher specializations for teachers
  const teacherNavItems = user?.role === 'teacher'
    ? [...userNavItems, { icon: BookOpen, label: 'تخصصاتي', path: '/teacher-specializations' }]
    : userNavItems;

  // Add admin panel for admin users
  const navItems = user?.role === 'admin' 
    ? [...teacherNavItems, { icon: Shield, label: 'الإدارة', path: '/admin' }]
    : teacherNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`nav-item flex flex-col items-center py-3 px-4 relative transition-colors ${
                  isActive ? 'active text-primary' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
