import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNav />
      </div>

      {/* Main Content */}
      <main className="min-h-screen pt-16 lg:ml-64 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
