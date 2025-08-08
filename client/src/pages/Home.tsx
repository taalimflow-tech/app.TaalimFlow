import { useQuery } from '@tanstack/react-query';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Announcement } from '@/types';
import { useLocation } from 'wouter';
import { Megaphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  const { data: allAnnouncements = [], isLoading: loading } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
  });

  // Get the latest 3 announcements
  const announcements = allAnnouncements.slice(0, 3);

  // Get school context for school-specific routes
  const schoolCode = sessionStorage.getItem('schoolCode');
  const basePath = schoolCode ? `/school/${schoolCode}` : '';

  const baseQuickActions = [
    { label: 'المدونة', path: `${basePath}/blog`, icon: '📚' },
    { label: 'المجموعات', path: `${basePath}/groups`, icon: '👥' },
    { label: 'التكوينات', path: `${basePath}/formations`, icon: '🎓' },
  ];

  // Add suggestions for non-admin users only
  const quickActions = user?.role !== 'admin' 
    ? [...baseQuickActions, { label: 'الاقتراحات', path: `${basePath}/suggestions`, icon: '💡' }]
    : baseQuickActions;

  return (
    <div className="bg-background min-h-screen">
      <div className="px-4 py-6 space-y-6">
        {/* Latest Announcements Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-800">آخر الإعلانات</h2>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} />
              ))}
            </div>
          ) : (
            <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">لا توجد إعلانات حالياً</h3>
                <p className="text-gray-500 text-sm mb-6">سيتم عرض الإعلانات الجديدة هنا عند توفرها</p>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-white rounded-lg px-6 py-2"
                  onClick={() => navigate(`${basePath}/announcements`)}
                >
                  عرض جميع الإعلانات
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Quick Actions Grid */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">الخدمات السريعة</h3>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.path}
                variant="outline"
                onClick={() => navigate(action.path)}
                className="bg-white rounded-xl p-4 h-20 flex flex-col items-center justify-center space-y-2 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:scale-105 group"
              >
                <div className="text-2xl transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] group-hover:scale-110">
                  {action.icon}
                </div>
                <p className="text-sm font-medium text-gray-700">{action.label}</p>
              </Button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
