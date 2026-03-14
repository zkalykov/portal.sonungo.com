'use client';

import { useAuth } from '@/lib/auth-context';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // While loading auth state, render a minimal shell to avoid layout flash
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main>{children}</main>
      </div>
    );
  }

  // Unauthenticated: minimal centered layout (no sidebar/header)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <main>{children}</main>
      </div>
    );
  }

  // Authenticated: full layout with sidebar and header
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Sidebar />
      <div className="pl-64 min-w-0">
        <Header />
        <main className="p-6 min-w-0 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
