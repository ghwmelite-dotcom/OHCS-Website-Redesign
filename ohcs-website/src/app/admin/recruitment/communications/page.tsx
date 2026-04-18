'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FolderOpen, Kanban, GraduationCap, MessageSquare,
  BarChart3, ShieldAlert, Trophy, Mail, Edit3, Send, CheckCircle,
  Clock, Eye, FileText,
} from 'lucide-react';

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
/*  Types & Data                                                       */
/* ------------------------------------------------------------------ */
interface Template {
  id: string;
  name: string;
  subject: string;
  preview: string;
  stage: string;
}

interface SendLog {
  id: string;
  template: string;
  recipients: number;
  date: string;
  status: 'sent' | 'pending' | 'failed';
}

const TEMPLATES: Template[] = [
  {
    id: 'tpl-001',
    name: 'Application Received',
    subject: 'Your application has been received',
    preview: 'Dear [Name], we acknowledge receipt of your application for the position of [Position]. Your reference number is [Ref]. We will review your application and get back to you shortly.',
    stage: 'Received',
  },
  {
    id: 'tpl-002',
    name: 'Shortlisted Notification',
    subject: 'Congratulations! You have been shortlisted',
    preview: 'Dear [Name], we are pleased to inform you that you have been shortlisted for the position of [Position]. Please proceed to the next stage as outlined below.',
    stage: 'Shortlisted',
  },
  {
    id: 'tpl-003',
    name: 'Exam Scheduled',
    subject: 'Examination date and venue confirmed',
    preview: 'Dear [Name], your examination has been scheduled for [Date] at [Venue]. Please arrive 30 minutes early with a valid government-issued ID.',
    stage: 'Examination',
  },
  {
    id: 'tpl-004',
    name: 'Appointment Letter',
    subject: 'Offer of appointment to the Civil Service',
    preview: 'Dear [Name], on behalf of the Office of the Head of Civil Service, we are delighted to offer you the position of [Position]. Please report to [Location] on [Date].',
    stage: 'Appointed',
  },
];

const SEND_LOG: SendLog[] = [
  { id: 'log-001', template: 'Application Received', recipients: 45, date: '17 Apr 2026', status: 'sent' },
  { id: 'log-002', template: 'Exam Scheduled', recipients: 64, date: '16 Apr 2026', status: 'sent' },
  { id: 'log-003', template: 'Shortlisted Notification', recipients: 18, date: '15 Apr 2026', status: 'sent' },
  { id: 'log-004', template: 'Appointment Letter', recipients: 12, date: '14 Apr 2026', status: 'pending' },
  { id: 'log-005', template: 'Application Received', recipients: 32, date: '13 Apr 2026', status: 'sent' },
];

const STAGE_COLORS: Record<string, string> = {
  Received: 'bg-blue-100 text-blue-800',
  Screening: 'bg-yellow-100 text-yellow-800',
  Examination: 'bg-purple-100 text-purple-800',
  Shortlisted: 'bg-green-100 text-green-800',
  Appointed: 'bg-teal-100 text-teal-800',
};

const LOG_STATUS_COLORS: Record<string, string> = {
  sent: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
};

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function CommunicationsPage() {
  const [toast, setToast] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeStage, setComposeStage] = useState('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const previewTemplate = TEMPLATES.find((t) => t.id === previewId);

  return (
    <div>
      <RecruitmentTabs current="/admin/recruitment/communications" />

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary-dark">Communication Centre</h2>
        <p className="text-sm text-text-muted mt-1">
          Manage email templates, send bulk notifications, and track delivery.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium text-green-800">{toast}</p>
        </div>
      )}

      {/* Template Library */}
      <div className="mb-8">
        <h3 className="font-semibold text-base text-primary-dark mb-4">Template Library</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white rounded-2xl border-2 border-border/40 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h4 className="font-bold text-sm text-primary-dark">{tpl.name}</h4>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                    STAGE_COLORS[tpl.stage] ?? 'bg-gray-100 text-gray-700',
                  )}
                >
                  {tpl.stage}
                </span>
              </div>
              <p className="text-xs text-text-muted mb-1 font-medium">Subject: {tpl.subject}</p>
              <p className="text-xs text-text-muted/70 line-clamp-2 mb-4">{tpl.preview}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewId(tpl.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <Eye className="h-3 w-3" aria-hidden="true" />
                  Preview
                </button>
                <button
                  onClick={() => setToast('Template editor coming soon.')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-text-muted bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Edit3 className="h-3 w-3" aria-hidden="true" />
                  Edit
                </button>
                <button
                  onClick={() => setToast(`Sending "${tpl.name}" to all ${tpl.stage} applicants...`)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-light transition-colors"
                >
                  <Send className="h-3 w-3" aria-hidden="true" />
                  Send to Stage
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Compose New Message */}
        <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
          <h3 className="font-semibold text-base text-primary-dark mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" aria-hidden="true" />
            Compose New Message
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                Send to Stage
              </label>
              <select
                value={composeStage}
                onChange={(e) => setComposeStage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
              >
                <option value="">Select stage...</option>
                <option value="received">Received</option>
                <option value="screening">Screening</option>
                <option value="examination">Examination</option>
                <option value="interview">Interview</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="appointed">Appointed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Email subject..."
                className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                Message Body
              </label>
              <textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                rows={5}
                placeholder="Type your message..."
                className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none resize-none"
              />
            </div>
            <button
              onClick={() => {
                setToast('Message sent successfully.');
                setComposeSubject('');
                setComposeBody('');
                setComposeStage('');
              }}
              disabled={!composeStage || !composeSubject || !composeBody}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Send Message
            </button>
          </div>
        </div>

        {/* Send History */}
        <div className="bg-white rounded-2xl border-2 border-border/40 overflow-hidden">
          <div className="p-6 border-b border-border/30">
            <h3 className="font-semibold text-base text-primary-dark flex items-center gap-2">
              <Clock className="h-5 w-5" aria-hidden="true" />
              Send History
            </h3>
          </div>
          <div className="divide-y divide-border/20">
            {SEND_LOG.map((log) => (
              <div key={log.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary-dark">{log.template}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {log.recipients} recipients &bull; {log.date}
                  </p>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider',
                    LOG_STATUS_COLORS[log.status],
                  )}
                >
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Template preview"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewId(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary-dark">Template Preview</h3>
              <button
                onClick={() => setPreviewId(null)}
                aria-label="Close preview"
                className="p-2 rounded-lg hover:bg-gray-100 text-text-muted transition-colors"
              >
                <Mail className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Template</p>
                <p className="text-sm font-bold text-primary-dark">{previewTemplate.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Subject</p>
                <p className="text-sm text-primary-dark">{previewTemplate.subject}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Body</p>
                <div className="bg-gray-50 rounded-xl p-4 mt-1">
                  <p className="text-sm text-text-muted leading-relaxed">{previewTemplate.preview}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Target Stage</p>
                <span
                  className={cn(
                    'inline-block mt-1 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider',
                    STAGE_COLORS[previewTemplate.stage] ?? 'bg-gray-100 text-gray-700',
                  )}
                >
                  {previewTemplate.stage}
                </span>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setPreviewId(null)}
                className="px-5 py-2.5 border-2 border-border/60 text-sm font-semibold text-text-muted rounded-xl hover:border-primary hover:text-primary transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
