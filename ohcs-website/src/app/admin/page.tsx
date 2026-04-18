'use client';

import { useEffect, useState } from 'react';
import { getAdminUser } from '@/lib/admin-auth';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATS = [
  {
    label: 'Total News',
    value: '12',
    icon: Newspaper,
    href: '/admin/news',
    gradient: 'from-green-500 to-emerald-600',
    roles: ['super_admin', 'content_manager'],
  },
  {
    label: 'Events',
    value: '5',
    icon: Calendar,
    href: '/admin/events',
    gradient: 'from-blue-500 to-indigo-600',
    roles: ['super_admin', 'content_manager'],
  },
  {
    label: 'Publications',
    value: '25',
    icon: FileText,
    href: '/admin/publications',
    gradient: 'from-amber-500 to-yellow-600',
    roles: ['super_admin', 'content_manager'],
  },
  {
    label: 'Submissions',
    value: '48',
    icon: ClipboardList,
    href: '/admin/submissions',
    gradient: 'from-purple-500 to-violet-600',
    roles: ['super_admin', 'recruitment_admin', 'viewer'],
  },
  {
    label: 'Applications',
    value: '0',
    icon: UserPlus,
    href: '/admin/recruitment',
    gradient: 'from-rose-500 to-pink-600',
    roles: ['super_admin', 'recruitment_admin'],
  },
  {
    label: 'Admin Users',
    value: '4',
    icon: Users,
    href: '/admin/users',
    gradient: 'from-teal-500 to-cyan-600',
    roles: ['super_admin'],
  },
];

const QUICK_ACTIONS = [
  {
    label: 'Create News Article',
    href: '/admin/news/new',
    icon: Newspaper,
    roles: ['super_admin', 'content_manager'],
  },
  {
    label: 'Add Event',
    href: '/admin/events/new',
    icon: Calendar,
    roles: ['super_admin', 'content_manager'],
  },
  {
    label: 'Upload Publication',
    href: '/admin/publications/new',
    icon: FileText,
    roles: ['super_admin', 'content_manager'],
  },
  {
    label: 'View Submissions',
    href: '/admin/submissions',
    icon: ClipboardList,
    roles: ['super_admin', 'recruitment_admin', 'viewer'],
  },
];

export default function AdminDashboardPage() {
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    getAdminUser().then(setUser);
  }, []);

  if (!user) return null;

  const visibleStats = STATS.filter((s) => s.roles.includes(user.role));
  const visibleActions = QUICK_ACTIONS.filter((a) =>
    a.roles.includes(user.role),
  );

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-primary-dark to-primary rounded-2xl p-8 text-white relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: [
              'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 32px)',
              'repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 32px)',
            ].join(', '),
          }}
        />
        <div className="relative">
          <p className="text-white/60 text-sm mb-1">Welcome back,</p>
          <h2 className="font-display text-2xl font-bold mb-2">{user.name}</h2>
          <p className="text-white/50 text-sm">
            Manage content, monitor submissions, and oversee operations from
            your dashboard.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleStats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group bg-white rounded-2xl border-2 border-border/40 p-6 hover:border-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={cn(
                  'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm',
                  stat.gradient,
                )}
              >
                <stat.icon
                  className="h-6 w-6 text-white"
                  aria-hidden="true"
                />
              </div>
              <ArrowRight
                className="h-4 w-4 text-text-muted/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                aria-hidden="true"
              />
            </div>
            <p className="text-3xl font-bold text-primary-dark mb-1">
              {stat.value}
            </p>
            <p className="text-sm text-text-muted">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold text-lg text-primary-dark mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 bg-white rounded-xl border-2 border-border/40 p-4 hover:border-primary/20 hover:shadow-sm transition-all text-sm font-medium text-text-muted hover:text-primary-dark"
            >
              <action.icon
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity placeholder */}
      <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-text-muted" aria-hidden="true" />
          <h3 className="font-semibold text-lg text-primary-dark">
            Recent Activity
          </h3>
        </div>
        <p className="text-sm text-text-muted">
          Activity log will appear here once the system is connected to the live
          database.
        </p>
      </div>
    </div>
  );
}
