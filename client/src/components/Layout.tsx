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
          <main className="p-8 max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </div>
      
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <Header />
        <main className="max-w-md mx-auto pb-20">
          {children}
        </main>
        <BottomNavigation />
      </div>
    </div>
  );
}
