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
  ScrollText,
  Settings,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface AdminSidebarProps {
  user: AdminUser;
  onLogout: () => void;
  collapsed: boolean;
  onToggle: () => void;
}

const NAV_SECTIONS = [
  {
    title: null,
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['super_admin', 'content_manager', 'recruitment_admin', 'viewer'] },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'News', href: '/admin/news', icon: Newspaper, roles: ['super_admin', 'content_manager'] },
      { label: 'Events', href: '/admin/events', icon: Calendar, roles: ['super_admin', 'content_manager'] },
      { label: 'Publications', href: '/admin/publications', icon: FileText, roles: ['super_admin', 'content_manager'] },
      { label: 'Leadership', href: '/admin/leadership', icon: Users, roles: ['super_admin', 'content_manager'] },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Recruitment', href: '/admin/recruitment', icon: UserPlus, roles: ['super_admin', 'recruitment_admin'] },
      { label: 'Submissions', href: '/admin/submissions', icon: ClipboardList, roles: ['super_admin', 'recruitment_admin', 'viewer'] },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Users & Roles', href: '/admin/users', icon: Shield, roles: ['super_admin'] },
      { label: 'Audit Log', href: '/admin/audit-log', icon: ScrollText, roles: ['super_admin'] },
      { label: 'Settings', href: '/admin/settings', icon: Settings, roles: ['super_admin'] },
    ],
  },
] as const;

export function AdminSidebar({ user, onLogout, collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 bg-primary-dark flex-col z-30 hidden lg:flex overflow-hidden',
        'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        collapsed ? 'w-[76px]' : 'w-72',
      )}
    >
      {/* Kente mesh texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 40px)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(46,125,50,0.15) 0%, transparent 60%)' }}
      />

      {/* ── Logo Section ── */}
      <div className="relative p-4 pb-3">
        <Link href="/admin" className="flex items-center gap-3 overflow-hidden">
          <div className="shrink-0">
            <Image src="/images/ohcs-crest.png" alt="OHCS" width={36} height={36} className="object-contain" style={{ width: 'auto', height: 36 }} />
          </div>
          <div
            className={cn(
              'flex items-center gap-2 transition-all duration-300 overflow-hidden',
              collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100',
            )}
          >
            <div className="w-[2px] h-7 rounded-full shrink-0" style={{ background: 'linear-gradient(to bottom, transparent, #D4A017, transparent)' }} />
            <div className="whitespace-nowrap">
              <span className="text-base font-bold text-white block leading-tight tracking-wide">OHCS</span>
              <span className="text-[10px] text-accent font-semibold tracking-wider uppercase">Admin Portal</span>
            </div>
          </div>
        </Link>
        {/* Kente stripe */}
        <div className="mt-4 h-[3px] rounded-full overflow-hidden" style={{ background: 'linear-gradient(90deg, #1B5E20 25%, #D4A017 25%, #D4A017 50%, #B71C1C 50%, #B71C1C 75%, #212121 75%)' }}>
          <div className="h-full" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 55%, transparent 100%)', backgroundSize: '200% 100%', animation: 'kente-shimmer 4s ease-in-out infinite' }} />
        </div>
      </div>

      {/* ── Collapse Toggle ── */}
      <div className="relative px-3 mb-1">
        <button
          onClick={onToggle}
          className={cn(
            'flex items-center gap-2 w-full rounded-lg py-2 text-white/30 hover:text-white hover:bg-white/[0.05] transition-all duration-200',
            collapsed ? 'justify-center px-2' : 'px-3',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4 shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="relative flex-1 py-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {NAV_SECTIONS.map((section, si) => {
          const visibleItems = section.items.filter((item) => isAuthorized(user.role, [...item.roles]));
          if (visibleItems.length === 0) return null;

          return (
            <div key={si} className={si > 0 ? 'pt-3' : ''}>
              {section.title && !collapsed && (
                <p className="text-[10px] text-white/25 font-bold uppercase tracking-[0.2em] px-4 mb-2 transition-opacity duration-300">
                  {section.title}
                </p>
              )}
              {collapsed && si > 0 && (
                <div className="h-px bg-white/[0.06] mx-2 mb-2" aria-hidden="true" />
              )}
              {visibleItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'group relative flex items-center rounded-xl text-sm font-medium transition-all duration-200',
                      collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-4 py-2.5',
                      isActive
                        ? 'bg-white/[0.12] text-white'
                        : 'text-white/45 hover:text-white hover:bg-white/[0.05]',
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-accent" aria-hidden="true" />
                    )}
                    <div className={cn(
                      'shrink-0 rounded-lg flex items-center justify-center transition-colors',
                      collapsed ? 'w-9 h-9' : 'w-8 h-8',
                      isActive ? 'bg-accent/20' : 'bg-white/5 group-hover:bg-white/10',
                    )}>
                      <item.icon className={cn('h-4 w-4', isActive ? 'text-accent' : 'text-white/50 group-hover:text-white/70')} aria-hidden="true" />
                    </div>
                    {!collapsed && (
                      <>
                        <span className="flex-1 whitespace-nowrap">{item.label}</span>
                        {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/30" aria-hidden="true" />}
                      </>
                    )}

                    {/* Tooltip on collapsed hover */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-3 py-1.5 bg-primary-dark border border-white/10 rounded-lg text-xs text-white font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-xl z-50">
                        {item.label}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-primary-dark border-l border-b border-white/10 rotate-45" />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* ── User Section ── */}
      <div className="relative p-3 border-t border-white/[0.06]">
        {collapsed ? (
          <>
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-primary-dark text-sm font-bold shadow-sm">
                {user.name.charAt(0)}
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="flex items-center justify-center w-full py-2.5 rounded-xl text-white/40 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-white/[0.04]">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-primary-dark text-sm font-bold shadow-sm shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-semibold truncate">{user.name}</p>
                <p className="text-[10px] text-white/30 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign Out
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
