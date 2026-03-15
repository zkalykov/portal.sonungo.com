'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/use-canvas';
import { useAuth } from '@/lib/auth-context';
import { useSidebar } from './sidebar-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard,
  Calendar,
  GraduationCap,
  FileText,
  Bell,
  MessageSquare,
  CheckSquare,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/grades', label: 'Grades', icon: GraduationCap },
  { href: '/assignments', label: 'Assignments', icon: FileText },
  { href: '/todo', label: 'To-Do', icon: CheckSquare },
  { href: '/announcements', label: 'Announcements', icon: Bell },
  { href: '/discussions', label: 'Discussions', icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: user, loading } = useUser();
  const { logout } = useAuth();
  const { isOpen, close } = useSidebar();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Backdrop overlay — mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 border-r bg-background transition-transform duration-300 ease-in-out',
          // Mobile: hidden by default, slides in when open
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible
          'md:translate-x-0 md:z-40'
        )}
      >
        {/* Close button — mobile only */}
        <button
          onClick={close}
          className="absolute right-3 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex h-16 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            {loading ? (
              <>
                <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                <Skeleton className="h-5 w-32" />
              </>
            ) : user ? (
              <>
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage src={user.avatar_url} alt={user.name} />
                  <AvatarFallback>{user.short_name?.charAt(0) || user.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <span className="text-base font-semibold truncate">{user.short_name || user.name}</span>
              </>
            ) : (
              <>
                <GraduationCap className="h-6 w-6 flex-shrink-0" />
                <span className="text-lg font-semibold">Canvas Dashboard</span>
              </>
            )}
          </Link>
        </div>

        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
