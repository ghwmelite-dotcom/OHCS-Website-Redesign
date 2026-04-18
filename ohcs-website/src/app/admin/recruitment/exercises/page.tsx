'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FolderOpen, Kanban, GraduationCap, MessageSquare,
  BarChart3, ShieldAlert, Trophy, Plus, X, Calendar, CheckCircle,
  Play, Pause, Lock, FileText, Users,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Tab Navigation (local copy to avoid cross-page client import)     */
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
type ExerciseStatus = 'draft' | 'active' | 'closed' | 'completed';

interface Exercise {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: ExerciseStatus;
  positions: number;
  applications: number;
}

const STATUS_CONFIG: Record<ExerciseStatus, { label: string; color: string; icon: typeof Play }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileText },
  active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: Play },
  closed: { label: 'Closed', color: 'bg-red-100 text-red-800', icon: Lock },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
};

const INITIAL_EXERCISES: Exercise[] = [
  {
    id: 'ex-001',
    name: '2026 Graduate Entrance Examination',
    description: 'Civil Service Online Graduate Entrance Examination for new graduates seeking to join the public service.',
    startDate: '2026-03-15',
    endDate: '2026-04-30',
    status: 'active',
    positions: 24,
    applications: 371,
  },
  {
    id: 'ex-002',
    name: '2025 Senior Officer Recruitment',
    description: 'Recruitment of experienced professionals for senior officer positions across MDAs.',
    startDate: '2025-09-01',
    endDate: '2025-11-30',
    status: 'completed',
    positions: 12,
    applications: 198,
  },
  {
    id: 'ex-003',
    name: '2026 Technical Specialist Drive',
    description: 'Targeted recruitment for IT, Engineering, and Scientific Officer roles in technical agencies.',
    startDate: '2026-05-01',
    endDate: '2026-06-30',
    status: 'draft',
    positions: 8,
    applications: 0,
  },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '' });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  function handleCreate() {
    if (!form.name || !form.startDate || !form.endDate) return;
    const newEx: Exercise = {
      id: `ex-${Date.now()}`,
      name: form.name,
      description: form.description,
      startDate: form.startDate,
      endDate: form.endDate,
      status: 'draft',
      positions: 0,
      applications: 0,
    };
    setExercises((prev) => [newEx, ...prev]);
    setForm({ name: '', description: '', startDate: '', endDate: '' });
    setShowModal(false);
    setToast('Exercise created successfully.');
  }

  function toggleStatus(id: string) {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== id) return ex;
        const transitions: Record<ExerciseStatus, ExerciseStatus> = {
          draft: 'active',
          active: 'closed',
          closed: 'completed',
          completed: 'completed',
        };
        const next = transitions[ex.status];
        setToast(`Exercise ${next === 'active' ? 'activated' : next === 'closed' ? 'closed' : 'completed'}.`);
        return { ...ex, status: next };
      }),
    );
  }

  return (
    <div>
      <RecruitmentTabs current="/admin/recruitment/exercises" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark">Recruitment Exercises</h2>
          <p className="text-sm text-text-muted mt-1">
            Manage recruitment exercises, timelines, and activation status.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Exercise
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium text-green-800">{toast}</p>
        </div>
      )}

      {/* Exercise Cards */}
      <div className="grid gap-6">
        {exercises.map((ex) => {
          const cfg = STATUS_CONFIG[ex.status];
          const StatusIcon = cfg.icon;
          return (
            <div
              key={ex.id}
              className="bg-white rounded-2xl border-2 border-border/40 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-primary-dark">{ex.name}</h3>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider',
                        cfg.color,
                      )}
                    >
                      <StatusIcon className="h-3 w-3" aria-hidden="true" />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mb-4 max-w-2xl">{ex.description}</p>
                  <div className="flex flex-wrap items-center gap-6 text-sm text-text-muted">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                      {ex.startDate} &mdash; {ex.endDate}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      {ex.positions} positions
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" aria-hidden="true" />
                      {ex.applications} applications
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ex.status !== 'completed' && (
                    <button
                      onClick={() => toggleStatus(ex.id)}
                      className={cn(
                        'inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors',
                        ex.status === 'draft'
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : ex.status === 'active'
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700',
                      )}
                    >
                      {ex.status === 'draft' && (
                        <>
                          <Play className="h-4 w-4" aria-hidden="true" /> Activate
                        </>
                      )}
                      {ex.status === 'active' && (
                        <>
                          <Pause className="h-4 w-4" aria-hidden="true" /> Close
                        </>
                      )}
                      {ex.status === 'closed' && (
                        <>
                          <CheckCircle className="h-4 w-4" aria-hidden="true" /> Complete
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Create recruitment exercise"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary-dark">New Recruitment Exercise</h3>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
                className="p-2 rounded-lg hover:bg-gray-100 text-text-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Exercise Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. 2026 Graduate Entrance Examination"
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Brief description of the exercise..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 border-2 border-border/60 text-sm font-semibold text-text-muted rounded-xl hover:border-primary hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.name || !form.startDate || !form.endDate}
                className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Exercise
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
