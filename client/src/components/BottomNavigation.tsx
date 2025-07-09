import { Home, Calendar, MessageCircle, Lightbulb, Mail } from 'lucide-react';
import { useLocation } from 'wouter';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'الرئيسية', path: '/' },
  { icon: Calendar, label: 'الجدول', path: '/schedule' },
  { icon: MessageCircle, label: 'المعلمين', path: '/teachers' },
  { icon: Mail, label: 'الرسائل', path: '/messages' },
  { icon: Lightbulb, label: 'اقتراحات', path: '/suggestions' },
];

export function BottomNavigation() {
  const [location, navigate] = useLocation();

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
