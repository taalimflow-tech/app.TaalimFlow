import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { DesktopSidebar } from '@/components/DesktopSidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <DesktopSidebar />
        <div className="flex-1">
          <Header />
          <main className="p-8 w-full bg-white dark:bg-gray-900">
            {children}
          </main>
        </div>
      </div>
      
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <Header />
        <main className="max-w-md mx-auto pb-20 bg-white dark:bg-gray-900">
          {children}
        </main>
        <BottomNavigation />
      </div>
    </div>
  );
}
