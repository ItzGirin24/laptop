import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Laptop,
  FileSpreadsheet,
  Clock,
  LogOut,
  GraduationCap,
  Menu,
  AlertTriangle,
  Gavel,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students', icon: Users, label: 'Data Siswa', adminOnly: true },
  { to: '/collection', icon: Laptop, label: 'Pengumpulan' },
  { to: '/not-collected', icon: AlertTriangle, label: 'Belum Ngumpul' },
  { to: '/confiscation', icon: Gavel, label: 'Sita Laptop' },
  { to: '/permissions', icon: Clock, label: 'Izin Laptop' },
  { to: '/import', icon: FileSpreadsheet, label: 'Import/Export', adminOnly: true },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-foreground">ABBSKP</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 sidebar-gradient border-none p-0">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-sidebar-border/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
                  <GraduationCap className="h-6 w-6 text-sidebar-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-sidebar-foreground">ABBSKP</h1>
                  <p className="text-xs text-sidebar-foreground/70">Laptop Management</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
              {filteredNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-sidebar-border/30 p-4">
              <div className="rounded-lg bg-sidebar-accent/30 px-4 py-3">
                <p className="text-sm font-medium text-sidebar-foreground">{user?.name}</p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-border/30 px-4 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
