'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FolderOpen, Kanban, GraduationCap, MessageSquare,
  BarChart3, ShieldAlert, Trophy, ArrowRight,
} from 'lucide-react';
import { AiChatPanel } from '@/components/admin/ai-chat-panel';
import { AiInsightCard } from '@/components/admin/ai-insight-card';

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

export { RecruitmentTabs, TABS };

const PIPELINE_STAGES = [
  { stage: 'Received', count: 156, color: 'bg-blue-500' },
  { stage: 'Screening', count: 89, color: 'bg-yellow-500' },
  { stage: 'Examination', count: 64, color: 'bg-purple-500' },
  { stage: 'Interview', count: 32, color: 'bg-orange-500' },
  { stage: 'Shortlisted', count: 18, color: 'bg-green-500' },
  { stage: 'Appointed', count: 12, color: 'bg-teal-500' },
];

const RECENT_APPS = [
  { ref: 'OHCS-REC-20260418-A7F3', name: 'Kwaku Asante', qualification: 'BSc Administration', date: '2 hours ago', status: 'Received' },
  { ref: 'OHCS-REC-20260418-B2K1', name: 'Akosua Mensah', qualification: 'MSc Public Policy', date: '5 hours ago', status: 'Screening' },
  { ref: 'OHCS-REC-20260417-C9D2', name: 'Yaw Boateng', qualification: 'BSc Computer Science', date: '1 day ago', status: 'Examination' },
  { ref: 'OHCS-REC-20260416-E4F7', name: 'Ama Serwaa', qualification: 'MA Development Studies', date: '2 days ago', status: 'Shortlisted' },
  { ref: 'OHCS-REC-20260415-G1H8', name: 'Kofi Owusu', qualification: 'BSc Accounting', date: '3 days ago', status: 'Interview' },
];

const STATUS_COLORS: Record<string, string> = {
  Received: 'bg-blue-100 text-blue-800',
  Screening: 'bg-yellow-100 text-yellow-800',
  Examination: 'bg-purple-100 text-purple-800',
  Interview: 'bg-orange-100 text-orange-800',
  Shortlisted: 'bg-green-100 text-green-800',
  Appointed: 'bg-teal-100 text-teal-800',
};

export default function RecruitmentDashboardPage() {
  const totalApps = PIPELINE_STAGES.reduce((sum, s) => sum + s.count, 0);

  return (
    <div>
      <RecruitmentTabs current="/admin/recruitment" />

      {/* Active Exercise Card */}
      <div className="bg-gradient-to-br from-primary-dark to-primary rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 32px)',
          }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-green-500/20 border border-green-400/30 text-green-300 text-xs font-bold rounded-full uppercase tracking-wider">
                Active
              </span>
              <span className="text-white/40 text-xs">Started 15 Mar 2026</span>
            </div>
            <h2 className="font-display text-2xl font-bold mb-1 text-white drop-shadow-sm">
              2026 Graduate Entrance Examination
            </h2>
            <p className="text-white/50 text-sm">
              Civil Service Online Graduate Entrance Examination &bull; Deadline: 30 Apr 2026
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center px-5 py-3 bg-white/[0.08] rounded-xl border border-white/10">
              <p className="text-2xl font-bold text-white">{totalApps}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Total Apps</p>
            </div>
            <div className="text-center px-5 py-3 bg-white/[0.08] rounded-xl border border-white/10">
              <p className="text-2xl font-bold text-accent">18</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Shortlisted</p>
            </div>
            <div className="text-center px-5 py-3 bg-white/[0.08] rounded-xl border border-white/10">
              <p className="text-2xl font-bold text-green-400">12</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Appointed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Bar */}
      <div className="bg-white rounded-2xl border-2 border-border/40 p-6 mb-8">
        <h3 className="font-semibold text-base text-primary-dark mb-4">Application Pipeline</h3>
        <div className="flex rounded-xl overflow-hidden h-10 mb-4">
          {PIPELINE_STAGES.map((stage) => (
            <div
              key={stage.stage}
              className={cn(
                'flex items-center justify-center text-white text-xs font-bold transition-all',
                stage.color,
              )}
              style={{
                width: `${(stage.count / totalApps) * 100}%`,
                minWidth: stage.count > 0 ? 40 : 0,
              }}
              title={`${stage.stage}: ${stage.count}`}
            >
              {stage.count}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage.stage} className="flex items-center gap-2 text-xs text-text-muted">
              <div className={cn('w-3 h-3 rounded-sm', stage.color)} />
              {stage.stage} ({stage.count})
            </div>
          ))}
        </div>
      </div>

      {/* AI Insight */}
      <AiInsightCard
        insight="Screening stage has the largest backlog (89 candidates). At current processing rate, it will take approximately 12 working days to clear. Consider allocating 2 additional reviewers to maintain the 30 April deadline."
        severity="warning"
        className="mb-8"
      />

      {/* Recent Applications */}
      <div className="bg-white rounded-2xl border-2 border-border/40 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border/30">
          <h3 className="font-semibold text-base text-primary-dark">Recent Applications</h3>
          <Link
            href="/admin/recruitment/pipeline"
            className="text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Applicant
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Qualification
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {RECENT_APPS.map((app) => (
              <tr key={app.ref} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-primary-dark">{app.ref}</td>
                <td className="px-6 py-4 text-sm font-semibold text-primary-dark">{app.name}</td>
                <td className="px-6 py-4 text-sm text-text-muted">{app.qualification}</td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider',
                      STATUS_COLORS[app.status],
                    )}
                  >
                    {app.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-text-muted">{app.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AiChatPanel />
    </div>
  );
}
