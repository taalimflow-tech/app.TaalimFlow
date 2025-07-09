import { Announcement } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AnnouncementCardProps {
  announcement: Announcement;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  return (
    <div className="announcement-card rounded-xl p-4 text-white">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-reverse space-x-2">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="text-sm opacity-90">
            {formatDistanceToNow(new Date(announcement.createdAt), { 
              addSuffix: true, 
              locale: ar 
            })}
          </span>
        </div>
        <svg className="w-5 h-5 opacity-80" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <h4 className="font-bold text-lg mb-2">{announcement.title}</h4>
      <p className="text-sm opacity-90 leading-relaxed">{announcement.content}</p>
      <button className="mt-3 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
        اقرأ المزيد
      </button>
    </div>
  );
}
