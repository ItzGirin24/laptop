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
  Shield,
  AlertTriangle,
  Gavel,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/siswa', icon: Users, label: 'Data Siswa', adminOnly: true },
  { to: '/loker', icon: Laptop, label: 'Pengumpulan' },
  { to: '/belum', icon: AlertTriangle, label: 'Belum Ngumpul' },
  { to: '/sita', icon: Gavel, label: 'Sita Laptop' },
  { to: '/izin', icon: Clock, label: 'Izin Laptop' },
  { to: '/import', icon: FileSpreadsheet, label: 'Import/Export', adminOnly: true },
];

export function Sidebar() {
  const { user, logout, isAdmin } = useAuth();

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <div className="flex h-full flex-col sidebar-gradient">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border/30">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <GraduationCap className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">ABBSKP</h1>
            <p className="text-xs text-sidebar-foreground/70">Laptop Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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

        {/* User Info */}
        <div className="border-t border-sidebar-border/30 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/30 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary">
              <Shield className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-border/30 px-4 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
    </div>
  );
}
