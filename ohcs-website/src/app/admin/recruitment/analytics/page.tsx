'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FolderOpen, Kanban, GraduationCap, MessageSquare,
  BarChart3, ShieldAlert, Trophy, Users, TrendingUp, Clock, UserCheck,
} from 'lucide-react';
import { AiInsightCard } from '@/components/admin/ai-insight-card';

/* ------------------------------------------------------------------ */
/*  Tab Navigation                                                     */
/* ------------------------------------------------------------------ */
const TABS = [
  { label: 'Dashboard', href: '/admin/recruitment', icon: LayoutDashboard },
  { label: 'Exercises', href: '/admin/recruitment/exercises', icon: FolderOpen },
  { label: 'Pipeline', href: '/admin/recruitment/pipeline', icon: Kanban },
  { label: 'Examinations', href: '/admin/recruitment/examinations', icon: GraduationCap },
  { label: 'Communications', href: '/admin/recruitment/communications', icon: MessageSquare },
  { label: 'Analytics', href: '/admin/recruitment/analytics', icon: BarChart3 },
  { label: 'Anti-Fraud', href: '/admin/recruitment/anti-fraud', icon: ShieldAlert },
  { label: 'Merit List', href: '/admin/recruitment/merit-list', icon: Trophy },
];

function RecruitmentTabs({ current }: { current: string }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-border/40 p-1.5 mb-8 overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {TABS.map((tab) => {
          const isActive = current === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap',
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-primary-dark hover:bg-primary/5',
              )}
            >
              <tab.icon className="h-4 w-4" aria-hidden="true" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const STATS = [
  { label: 'Total Applications', value: '371', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Acceptance Rate', value: '3.2%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Avg Time to Hire', value: '42 days', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Gender Split', value: '54% M / 46% F', icon: UserCheck, color: 'text-orange-600', bg: 'bg-orange-50' },
];

const REGIONS = [
  { name: 'Greater Accra', count: 124, pct: 33 },
  { name: 'Ashanti', count: 87, pct: 23 },
  { name: 'Northern', count: 62, pct: 17 },
  { name: 'Western', count: 54, pct: 15 },
  { name: 'Eastern', count: 44, pct: 12 },
];

const QUALIFICATIONS = [
  { name: 'Bachelor\'s Degree', count: 198, pct: 53, color: 'bg-blue-500' },
  { name: 'Master\'s Degree', count: 89, pct: 24, color: 'bg-purple-500' },
  { name: 'HND / Diploma', count: 52, pct: 14, color: 'bg-orange-500' },
  { name: 'PhD', count: 18, pct: 5, color: 'bg-green-500' },
  { name: 'Professional Cert', count: 14, pct: 4, color: 'bg-teal-500' },
];

const FUNNEL = [
  { stage: 'Received', count: 371, pct: 100, color: 'bg-blue-500' },
  { stage: 'Screening', count: 245, pct: 66, color: 'bg-yellow-500' },
  { stage: 'Examination', count: 156, pct: 42, color: 'bg-purple-500' },
  { stage: 'Shortlisted', count: 48, pct: 13, color: 'bg-green-500' },
  { stage: 'Appointed', count: 12, pct: 3.2, color: 'bg-teal-500' },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function AnalyticsPage() {
  return (
    <div>
      <RecruitmentTabs current="/admin/recruitment/analytics" />

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary-dark">Recruitment Analytics</h2>
        <p className="text-sm text-text-muted mt-1">
          Key metrics and insights for the current recruitment exercise.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border-2 border-border/40 p-5 hover:shadow-md transition-shadow"
          >
            <div className={cn('inline-flex p-2.5 rounded-xl mb-3', stat.bg)}>
              <stat.icon className={cn('h-5 w-5', stat.color)} aria-hidden="true" />
            </div>
            <p className="text-2xl font-bold text-primary-dark">{stat.value}</p>
            <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* AI Insight */}
      <AiInsightCard
        insight="Northern Region applications are 40% below population proportion. Targeted outreach through regional universities and the Kumasi Training Institute could improve geographic diversity."
        severity="info"
        className="mb-8"
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Applications by Region */}
        <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
          <h3 className="font-semibold text-base text-primary-dark mb-5">Applications by Region</h3>
          <div className="space-y-4">
            {REGIONS.map((region) => (
              <div key={region.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-primary-dark">{region.name}</span>
                  <span className="text-sm font-bold text-primary-dark">{region.count}</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${region.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Qualification Breakdown */}
        <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
          <h3 className="font-semibold text-base text-primary-dark mb-5">Qualification Breakdown</h3>
          <div className="space-y-4">
            {QUALIFICATIONS.map((q) => (
              <div key={q.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-primary-dark">{q.name}</span>
                  <span className="text-xs text-text-muted">
                    {q.count} ({q.pct}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', q.color)}
                    style={{ width: `${q.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
        <h3 className="font-semibold text-base text-primary-dark mb-6">Conversion Funnel</h3>
        <div className="space-y-3">
          {FUNNEL.map((step, i) => (
            <div key={step.stage} className="flex items-center gap-4">
              <div className="w-28 text-sm font-medium text-primary-dark text-right flex-shrink-0">
                {step.stage}
              </div>
              <div className="flex-1 relative">
                <div
                  className={cn('h-10 rounded-xl flex items-center justify-between px-4 transition-all', step.color)}
                  style={{ width: `${Math.max(step.pct, 8)}%` }}
                >
                  <span className="text-white text-xs font-bold">{step.count}</span>
                  <span className="text-white/70 text-xs font-medium">{step.pct}%</span>
                </div>
              </div>
              {i < FUNNEL.length - 1 && FUNNEL[i + 1] && (
                <div className="text-xs text-text-muted flex-shrink-0 w-16 text-right">
                  {Math.round((FUNNEL[i + 1]!.count / step.count) * 100)}% pass
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
