'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAdminUser, adminLogout, ROLE_LABELS, ROLE_COLORS } from '@/lib/admin-auth';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import type { AdminUser } from '@/types';
import { cn } from '@/lib/utils';
import { Bell, Search } from 'lucide-react';
import Image from 'next/image';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/';

  // Hide public header/footer for ALL admin pages
  useEffect(() => {
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    if (header) header.style.display = 'none';
    if (footer) footer.style.display = 'none';
    return () => {
      if (header) header.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, []);

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

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-surface flex items-center justify-center">
        <div className="text-center">
          <Image src="/images/ohcs-crest.png" alt="OHCS" width={48} height={48} className="object-contain mx-auto mb-4 opacity-0" style={{ width: 'auto', height: 48, animation: 'hero-reveal 0.6s cubic-bezier(0.16,1,0.3,1) forwards' }} />
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
    <div className="fixed inset-0 z-50 flex bg-[#f5f6fa]">
      <AdminSidebar user={user} onLogout={handleLogout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className={cn('flex-1 flex flex-col min-h-screen overflow-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]', sidebarCollapsed ? 'lg:ml-[76px]' : 'lg:ml-72')}>
        {/* ── Top bar ── */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-border/30 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-display font-bold text-primary-dark">
              {getPageTitle(pathname)}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">{getPageSubtitle(pathname)}</p>
          </div>
          <div className="flex items-center gap-5">
            {/* Search */}
            <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-text-muted/50 hover:text-primary hover:bg-primary/5 transition-colors">
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
            {/* Notifications */}
            <button className="relative w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-text-muted/50 hover:text-primary hover:bg-primary/5 transition-colors">
              <Bell className="h-4 w-4" aria-hidden="true" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
            </button>
            {/* Divider */}
            <div className="w-px h-8 bg-border/40" aria-hidden="true" />
            {/* Role + User */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-primary-dark">{user.name}</p>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', ROLE_COLORS[user.role])}>
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8">{children}</main>

        {/* Minimal admin footer */}
        <footer className="px-8 py-4 border-t border-border/20 text-xs text-text-muted/40 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} OHCS Admin Portal</span>
          <span>v1.0.0</span>
        </footer>
      </div>
    </div>
  );
}

function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/news': 'News Management',
    '/admin/events': 'Events Management',
    '/admin/publications': 'Publications',
    '/admin/leadership': 'Leadership Profiles',
    '/admin/recruitment': 'Recruitment',
    '/admin/submissions': 'Submissions',
    '/admin/users': 'User Management',
    '/admin/audit-log': 'Audit Log',
    '/admin/settings': 'System Settings',
  };
  return map[pathname] ?? pathname.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? 'Admin';
}

function getPageSubtitle(pathname: string): string {
  const map: Record<string, string> = {
    '/admin': 'Overview of your admin portal',
    '/admin/news': 'Create, edit, and publish news articles',
    '/admin/events': 'Manage upcoming events and activities',
    '/admin/publications': 'Upload and manage official documents',
    '/admin/leadership': 'Manage leadership profiles and bios',
    '/admin/recruitment': 'Control recruitment windows and applications',
    '/admin/submissions': 'Review and manage citizen submissions',
    '/admin/users': 'Manage admin user accounts and roles',
    '/admin/audit-log': 'Track all admin actions and changes',
    '/admin/settings': 'Control system modes and service configurations',
  };
  return map[pathname] ?? '';
}
