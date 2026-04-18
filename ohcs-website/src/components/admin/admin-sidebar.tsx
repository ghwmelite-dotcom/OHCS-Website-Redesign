'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { isAuthorized } from '@/lib/admin-auth';
import type { AdminUser } from '@/types';
import {
  LayoutDashboard,
  Newspaper,
  Calendar,
  FileText,
  Users,
  UserPlus,
  ClipboardList,
  LogOut,
  Shield,
} from 'lucide-react';

interface AdminSidebarProps {
  user: AdminUser;
  onLogout: () => void;
}

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    roles: ['super_admin', 'content_manager', 'recruitment_admin', 'viewer'],
  },
  {
    label: 'News',
    href: '/admin/news',
    icon: Newspaper,
    roles: ['super_admin', 'content_manager'],
  },
  {
    label: 'Events',
    href: '/admin/events',
    icon: Calendar,
    roles: ['super_admin', 'content_manager'],
  },
  {
    label: 'Publications',
    href: '/admin/publications',
    icon: FileText,
    roles: ['super_admin', 'content_manager'],
  },
  {
    label: 'Leadership',
    href: '/admin/leadership',
    icon: Users,
    roles: ['super_admin', 'content_manager'],
  },
  {
    label: 'Recruitment',
    href: '/admin/recruitment',
    icon: UserPlus,
    roles: ['super_admin', 'recruitment_admin'],
  },
  {
    label: 'Submissions',
    href: '/admin/submissions',
    icon: ClipboardList,
    roles: ['super_admin', 'recruitment_admin', 'viewer'],
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Shield,
    roles: ['super_admin'],
  },
] as const;

export function AdminSidebar({ user, onLogout }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-primary-dark flex-col z-30 hidden lg:flex">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-3">
          <Image
            src="/images/ohcs-crest.png"
            alt="OHCS"
            width={36}
            height={36}
            className="object-contain"
            style={{ width: 'auto', height: 36 }}
          />
          <div>
            <span className="text-base font-bold text-white block leading-tight">
              OHCS Admin
            </span>
            <span className="text-[10px] text-white/40 tracking-wide">
              Management Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.filter((item) =>
          isAuthorized(user.role, [...item.roles]),
        ).map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/5',
              )}
            >
              <item.icon
                className={cn('h-5 w-5', isActive ? 'text-accent' : '')}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">
              {user.name}
            </p>
            <p className="text-[10px] text-white/40 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
