import { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { Card, CardContent } from '@/components/ui/card';
import { Announcement } from '@/types';
import { Megaphone } from 'lucide-react';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const q = query(
          collection(db, 'announcements'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const announcementsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Announcement[];
        setAnnouncements(announcementsData);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  return (
    <div className="bg-background min-h-screen">
      <div className="px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Megaphone className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-gray-800">جميع الإعلانات</h2>
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
              <h3 className="text-lg font-medium text-gray-800 mb-2">لا توجد إعلانات</h3>
              <p className="text-gray-500 text-sm">سيتم عرض الإعلانات هنا عند إضافتها من قبل الإدارة</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}