'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAdminUser, adminLogout, ROLE_LABELS, ROLE_COLORS } from '@/lib/admin-auth';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import type { AdminUser } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Skip auth check on login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    getAdminUser().then((u) => {
      if (!u) {
        router.replace('/admin/login');
      } else {
        setUser(u);
      }
      setLoading(false);
    });
  }, [isLoginPage, router]);

  // Login page renders without the admin chrome
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted text-sm">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await adminLogout();
    router.replace('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar user={user} onLogout={handleLogout} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Top bar */}
        <header className="bg-white border-b border-border/40 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-lg font-semibold text-primary-dark">
              {getPageTitle(pathname)}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={cn(
                'text-xs font-bold px-3 py-1 rounded-full',
                ROLE_COLORS[user.role],
              )}
            >
              {ROLE_LABELS[user.role]}
            </span>
            <span className="text-sm text-text-muted">{user.name}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

function getPageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last || last === 'admin') return 'Dashboard';
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
}
