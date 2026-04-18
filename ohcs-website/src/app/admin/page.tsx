'use client';

import { useEffect, useState } from 'react';
import { getAdminUser } from '@/lib/admin-auth';
import { getAuditLog } from '@/lib/audit-logger';
import type { AuditEntry } from '@/lib/audit-logger';
import Link from 'next/link';
import type { AdminUser } from '@/types';
import {
  Newspaper,
  Calendar,
  FileText,
  Users,
  UserPlus,
  ClipboardList,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATS = [
  { label: 'News Articles', value: '12', change: '+3 this month', icon: Newspaper, href: '/admin/news', gradient: 'from-green-500 to-emerald-600', bg: 'bg-green-50', border: 'border-green-200', roles: ['super_admin', 'content_manager'] },
  { label: 'Events', value: '5', change: '2 upcoming', icon: Calendar, href: '/admin/events', gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', border: 'border-blue-200', roles: ['super_admin', 'content_manager'] },
  { label: 'Publications', value: '25', change: '+5 this quarter', icon: FileText, href: '/admin/publications', gradient: 'from-amber-500 to-yellow-600', bg: 'bg-amber-50', border: 'border-amber-200', roles: ['super_admin', 'content_manager'] },
  { label: 'Submissions', value: '48', change: '12 pending review', icon: ClipboardList, href: '/admin/submissions', gradient: 'from-purple-500 to-violet-600', bg: 'bg-purple-50', border: 'border-purple-200', roles: ['super_admin', 'recruitment_admin', 'viewer'] },
  { label: 'Applications', value: '0', change: 'Window closed', icon: UserPlus, href: '/admin/recruitment', gradient: 'from-rose-500 to-pink-600', bg: 'bg-rose-50', border: 'border-rose-200', roles: ['super_admin', 'recruitment_admin'] },
  { label: 'Admin Users', value: '4', change: 'All active', icon: Users, href: '/admin/users', gradient: 'from-teal-500 to-cyan-600', bg: 'bg-teal-50', border: 'border-teal-200', roles: ['super_admin'] },
];

const QUICK_ACTIONS = [
  { label: 'New Article', href: '/admin/news/new', icon: Newspaper, gradient: 'from-green-500 to-emerald-600', roles: ['super_admin', 'content_manager'] },
  { label: 'New Event', href: '/admin/events/new', icon: Calendar, gradient: 'from-blue-500 to-indigo-600', roles: ['super_admin', 'content_manager'] },
  { label: 'Upload Doc', href: '/admin/publications/new', icon: FileText, gradient: 'from-amber-500 to-yellow-600', roles: ['super_admin', 'content_manager'] },
  { label: 'Submissions', href: '/admin/submissions', icon: ClipboardList, gradient: 'from-purple-500 to-violet-600', roles: ['super_admin', 'recruitment_admin', 'viewer'] },
];

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-gray-500',
  logout: 'bg-gray-500',
  create: 'bg-green-500',
  update: 'bg-blue-500',
  delete: 'bg-red-500',
  status_change: 'bg-amber-500',
  publish: 'bg-purple-500',
  unpublish: 'bg-purple-500',
  activate: 'bg-teal-500',
  deactivate: 'bg-teal-500',
  export: 'bg-indigo-500',
  view: 'bg-slate-400',
};

const ACTION_LABELS: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  status_change: 'Status Changed',
  publish: 'Published',
  unpublish: 'Unpublished',
  activate: 'Activated',
  deactivate: 'Deactivated',
  export: 'Exported',
  view: 'Viewed',
};

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditEntry[]>([]);

  useEffect(() => {
    getAdminUser().then(setUser);
    setRecentActivity(getAuditLog().slice(0, 5));
  }, []);

  if (!user) return null;

  const visibleStats = STATS.filter((s) => s.roles.includes(user.role));
  const visibleActions = QUICK_ACTIONS.filter((a) => a.roles.includes(user.role));

  return (
    <div className="space-y-8">
      {/* ── Welcome Banner ── */}
      <div className="relative bg-gradient-to-br from-primary-dark via-primary-dark to-primary rounded-2xl p-8 lg:p-10 text-white overflow-hidden">
        {/* Kente threads */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[30%] left-0 right-0 h-px opacity-[0.1]" style={{ background: 'linear-gradient(90deg, transparent, #D4A017 30%, #D4A017 70%, transparent)', animation: 'kente-thread-h 8s ease-in-out infinite' }} />
          <div className="absolute top-[70%] left-0 right-0 h-px opacity-[0.07]" style={{ background: 'linear-gradient(90deg, transparent, #E8C547 20%, #E8C547 80%, transparent)', animation: 'kente-thread-h 12s ease-in-out 3s infinite reverse' }} />
          <div className="absolute left-[75%] top-0 bottom-0 w-px opacity-[0.06]" style={{ background: 'linear-gradient(0deg, transparent, #2E7D32 30%, #2E7D32 70%, transparent)', animation: 'kente-thread-v 10s ease-in-out 1s infinite' }} />
        </div>
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 32px)' }} />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h2 className="font-display text-3xl font-bold mb-3">
              <span className="text-accent text-sm font-semibold uppercase tracking-[0.2em] block mb-2">Welcome back,</span>
              <span className="text-white">{user.name || 'Administrator'}</span>
            </h2>
            <p className="text-white/45 text-base max-w-md">
              Manage content, monitor submissions, and oversee operations across Ghana&apos;s Civil Service.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {visibleActions.slice(0, 2).map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.1] hover:bg-white/[0.15] border border-white/10 hover:border-white/20 rounded-xl text-sm font-semibold text-white transition-all"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {a.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Kente stripe at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px]" aria-hidden="true" style={{ background: 'linear-gradient(90deg, #1B5E20 25%, #D4A017 25%, #D4A017 50%, #B71C1C 50%, #B71C1C 75%, #212121 75%)' }}>
          <div className="h-full" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 55%, transparent 100%)', backgroundSize: '200% 100%', animation: 'kente-shimmer 4s ease-in-out infinite' }} />
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleStats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={cn(
              'group rounded-2xl border-2 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
              stat.bg, stat.border,
            )}
          >
            <div className="flex items-center justify-between mb-5">
              <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300', stat.gradient)}>
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <ChevronRight className="h-4 w-4 text-text-muted/20 group-hover:text-primary group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
            </div>
            <p className="text-3xl font-bold text-primary-dark mb-1 font-display">{stat.value}</p>
            <p className="text-sm font-semibold text-primary-dark mb-1">{stat.label}</p>
            <p className="text-xs text-text-muted flex items-center gap-1">
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
              {stat.change}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Quick Actions ── */}
        <div className="lg:col-span-1">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {visibleActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center gap-4 bg-white rounded-2xl border-2 border-border/40 p-4 hover:border-primary/20 hover:shadow-sm transition-all"
              >
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm', action.gradient)}>
                  <action.icon className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <span className="flex-1 text-sm font-semibold text-primary-dark group-hover:text-primary transition-colors">{action.label}</span>
                <ArrowRight className="h-4 w-4 text-text-muted/20 group-hover:text-primary group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>

        {/* ── Recent Activity ── */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4" aria-hidden="true" />
              Recent Activity
            </h3>
            <span className="text-xs text-text-muted/50">Last 7 days</span>
          </div>
          <div className="bg-white rounded-2xl border-2 border-border/40 divide-y divide-border/30">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-muted">No recent activity.</div>
            ) : (
              recentActivity.map((entry) => (
                <div key={entry.id} className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors">
                  <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', ACTION_COLORS[entry.action] ?? 'bg-gray-400')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-primary-dark">
                      <span className="font-semibold">{ACTION_LABELS[entry.action] ?? entry.action}</span>{' '}
                      {entry.resourceTitle || entry.details}
                    </p>
                    <p className="text-xs text-text-muted/60 mt-0.5">by {entry.userName}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-text-muted/50 shrink-0">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {timeAgo(entry.timestamp)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
