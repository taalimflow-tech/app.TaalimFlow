import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-md mx-auto pb-20">
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}
