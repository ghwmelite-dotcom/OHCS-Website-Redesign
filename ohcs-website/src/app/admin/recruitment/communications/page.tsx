'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FolderOpen, Kanban, GraduationCap, MessageSquare,
  BarChart3, ShieldAlert, Trophy, Plus, CheckCircle,
} from 'lucide-react';
import { TemplatesTable } from '@/components/admin/comms/templates-table';
import { TemplateEditorModal } from '@/components/admin/comms/template-editor-modal';
import { ComposeForm } from '@/components/admin/comms/compose-form';
import { CampaignHistory } from '@/components/admin/comms/campaign-history';
import { listTemplates, type CommTemplate, type SendCampaignResult } from '@/lib/recruitment-comms-api';

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

interface ActiveExercise {
  id: string;
  name: string;
}

type Section = 'compose' | 'templates' | 'history';

export default function CommunicationsPage() {
  const [section, setSection] = useState<Section>('compose');
  const [exercise, setExercise] = useState<ActiveExercise | null>(null);
  const [templates, setTemplates] = useState<CommTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<CommTemplate | 'new' | null>(null);
  const [smsAvailable, setSmsAvailable] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    void fetch('/api/exercises/active')
      .then((r) => (r.ok ? (r.json() as Promise<{ data?: ActiveExercise }>) : Promise.resolve(null)))
      .then((b) => {
        if (b?.data) setExercise({ id: b.data.id, name: b.data.name });
      });
    void fetch('/api/admin/site-config')
      .then((r) =>
        r.ok
          ? (r.json() as Promise<{ data: { key: string; value: string }[] }>)
          : Promise.resolve({ data: [] as { key: string; value: string }[] }),
      )
      .then((b) => {
        const row = b.data.find((c) => c.key === 'hubtel_sms_available');
        setSmsAvailable(row?.value === 'true');
      });
    void refreshTemplates();
  }, []);

  async function refreshTemplates() {
    try {
      const t = await listTemplates();
      setTemplates(t);
    } catch {
      // ignored
    }
  }

  function onSent(result: SendCampaignResult) {
    setToast(
      `Sent: ${result.sent_count} email${result.sent_count === 1 ? '' : 's'}` +
        (result.failed_count > 0 ? `, ${result.failed_count} failed` : '') +
        (result.sms_requested ? `, ${result.sms_sent_count} SMS` : ''),
    );
    setHistoryKey((k) => k + 1);
    setTimeout(() => setToast(null), 5000);
  }

  return (
    <div>
      <RecruitmentTabs current="/admin/recruitment/communications" />

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary-dark">Communication Centre</h2>
        <p className="text-sm text-text-muted mt-1">
          {exercise
            ? `Active exercise: ${exercise.name}`
            : 'No active recruitment exercise — campaigns are scoped to active exercises.'}
        </p>
      </div>

      {toast && (
        <div className="flex items-center gap-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 mb-6">
          <CheckCircle className="h-5 w-5 text-emerald-700 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium text-emerald-900">{toast}</p>
        </div>
      )}

      <div className="flex border-b border-border/40 mb-6" role="tablist">
        {(['compose', 'templates', 'history'] as Section[]).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={section === s}
            onClick={() => setSection(s)}
            className={cn(
              'px-4 py-2 text-sm font-semibold transition-colors capitalize focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              section === s
                ? 'text-primary border-b-2 border-primary -mb-[2px]'
                : 'text-text-muted hover:text-primary-dark',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {section === 'compose' && (
        <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
          {!exercise ? (
            <p className="text-sm text-text-muted text-center py-12">
              No active exercise — open Exercises and activate one before composing.
            </p>
          ) : (
            <ComposeForm
              exerciseId={exercise.id}
              smsAvailable={smsAvailable}
              onSent={onSent}
            />
          )}
        </div>
      )}

      {section === 'templates' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-muted">
              Reusable email + SMS templates. Use placeholders like {`{{name}}`} for personalisation.
            </p>
            <button
              type="button"
              onClick={() => setEditingTemplate('new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light"
            >
              <Plus className="h-4 w-4" /> New Template
            </button>
          </div>
          <TemplatesTable
            rows={templates}
            onEdit={(t) => setEditingTemplate(t)}
            onChange={refreshTemplates}
          />
          <TemplateEditorModal
            template={editingTemplate}
            onClose={() => setEditingTemplate(null)}
            onSaved={refreshTemplates}
          />
        </div>
      )}

      {section === 'history' && (
        <div key={historyKey}>
          {!exercise ? (
            <p className="text-sm text-text-muted text-center py-12">
              No active exercise selected.
            </p>
          ) : (
            <CampaignHistory exerciseId={exercise.id} />
          )}
        </div>
      )}
    </div>
  );
}
