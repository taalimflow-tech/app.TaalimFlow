import { Home, Calendar, MessageCircle, Lightbulb, Mail, Shield, BookOpen, FileText } from 'lucide-react';
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

  // Get school context for school-specific routes
  const schoolCode = sessionStorage.getItem('schoolCode');
  const basePath = schoolCode ? `/school/${schoolCode}` : '';

  console.log('BottomNavigation - User:', user);
  console.log('BottomNavigation - User role:', user?.role);
  console.log('BottomNavigation - School code:', schoolCode);
  console.log('BottomNavigation - Base path:', basePath);

  const baseNavItems: NavItem[] = [
    { icon: Home, label: 'الرئيسية', path: `${basePath}/home` || '/' },
    { icon: Calendar, label: 'الجدول', path: `${basePath}/schedule` || '/schedule' },
    { icon: MessageCircle, label: 'المعلمين', path: `${basePath}/teachers` || '/teachers' },
    { icon: Mail, label: 'الرسائل', path: `${basePath}/messages` || '/messages' },
  ];

  // Role-based navigation items
  let roleSpecificItems: NavItem[] = [];
  
  if (user?.role === 'admin') {
    roleSpecificItems = [{ icon: Shield, label: 'الإدارة', path: `${basePath}/admin` || '/admin' }];
  } else if (user?.role === 'teacher') {
    roleSpecificItems = [{ icon: BookOpen, label: 'تخصصاتي', path: `${basePath}/teacher-specializations` || '/teacher-specializations' }];
  } else if (user?.role === 'student' || user?.role === 'parent') {
    roleSpecificItems = [{ icon: FileText, label: 'حضور ومدفوعات', path: `${basePath}/student-status` || '/student-status' }];
  }

  console.log('BottomNavigation - Role specific items:', roleSpecificItems);

  const navItems = [...baseNavItems, ...roleSpecificItems];

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
