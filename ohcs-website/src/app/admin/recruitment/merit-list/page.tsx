'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FolderOpen, Kanban, GraduationCap, MessageSquare,
  BarChart3, ShieldAlert, Trophy, Download, FileText, CheckCircle,
  ToggleLeft, ToggleRight,
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
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const EXERCISES = [
  { id: 'ex-001', name: '2026 Graduate Entrance Examination' },
  { id: 'ex-002', name: '2025 Senior Officer Recruitment' },
];

interface MeritCandidate {
  rank: number;
  name: string;
  ref: string;
  position: string;
  examScore: number;
  qualScore: number;
  total: number;
  status: 'recommended' | 'reserve' | 'not-recommended';
}

const MERIT_DATA: MeritCandidate[] = [
  { rank: 1, name: 'Nana Agyemang', ref: 'OHCS-REC-20260411-P7Q1', position: 'Procurement Officer', examScore: 91, qualScore: 95, total: 93, status: 'recommended' },
  { rank: 2, name: 'Esi Appiah', ref: 'OHCS-REC-20260406-Z5A8', position: 'IT Specialist', examScore: 88, qualScore: 92, total: 90, status: 'recommended' },
  { rank: 3, name: 'Kwabena Osei', ref: 'OHCS-REC-20260413-K5L9', position: 'Administrative Officer', examScore: 82, qualScore: 90, total: 86, status: 'recommended' },
  { rank: 4, name: 'Abena Frimpong', ref: 'OHCS-REC-20260412-M2N4', position: 'IT Specialist', examScore: 74, qualScore: 88, total: 81, status: 'recommended' },
  { rank: 5, name: 'Kwesi Antwi', ref: 'OHCS-REC-20260409-T8U2', position: 'Finance Officer', examScore: 67, qualScore: 85, total: 76, status: 'recommended' },
  { rank: 6, name: 'Akua Boakye', ref: 'OHCS-REC-20260410-R3S6', position: 'Policy Analyst', examScore: 72, qualScore: 78, total: 75, status: 'reserve' },
  { rank: 7, name: 'Yaw Amoako', ref: 'OHCS-REC-20260407-X1Y3', position: 'Administrative Officer', examScore: 55, qualScore: 82, total: 68.5, status: 'reserve' },
  { rank: 8, name: 'Adjoa Nyarko', ref: 'OHCS-REC-20260404-D6E1', position: 'Policy Analyst', examScore: 60, qualScore: 75, total: 67.5, status: 'reserve' },
  { rank: 9, name: 'Afia Mensah', ref: 'OHCS-REC-20260408-V4W7', position: 'HR Officer', examScore: 38, qualScore: 80, total: 59, status: 'not-recommended' },
  { rank: 10, name: 'Kofi Adu', ref: 'OHCS-REC-20260408-Y7Z2', position: 'Finance Officer', examScore: 42, qualScore: 70, total: 56, status: 'not-recommended' },
];

const STATUS_COLORS: Record<string, string> = {
  recommended: 'bg-green-100 text-green-800',
  reserve: 'bg-yellow-100 text-yellow-800',
  'not-recommended': 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  recommended: 'Recommended',
  reserve: 'Reserve List',
  'not-recommended': 'Not Recommended',
};

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function MeritListPage() {
  const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0]?.id ?? '');
  const [published, setPublished] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  function handleExportPDF() {
    setToast('PDF export coming soon.');
  }

  function handleExportExcel() {
    setToast('Excel export coming soon.');
  }

  return (
    <div>
      <RecruitmentTabs current="/admin/recruitment/merit-list" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark">Merit List Generator</h2>
          <p className="text-sm text-text-muted mt-1">
            Ranked candidates based on exam and qualification scores.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-border/60 bg-white text-sm font-semibold text-text-muted rounded-xl hover:border-primary hover:text-primary transition-colors"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-border/60 bg-white text-sm font-semibold text-text-muted rounded-xl hover:border-primary hover:text-primary transition-colors"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium text-green-800">{toast}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
            Select Exercise
          </label>
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="w-full md:w-96 px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
          >
            {EXERCISES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-primary-dark">Publish Merit List</span>
          <button
            onClick={() => {
              setPublished(!published);
              setToast(published ? 'Merit list unpublished.' : 'Merit list published successfully.');
            }}
            className="focus:outline-none"
            aria-label={published ? 'Unpublish merit list' : 'Publish merit list'}
          >
            {published ? (
              <ToggleRight className="h-8 w-8 text-green-600" />
            ) : (
              <ToggleLeft className="h-8 w-8 text-text-muted" />
            )}
          </button>
          {published && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-green-100 text-green-800">
              Published
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-2xl border-2 border-green-200/50 p-4 text-center">
          <p className="text-2xl font-bold text-green-800">
            {MERIT_DATA.filter((c) => c.status === 'recommended').length}
          </p>
          <p className="text-xs text-green-700 font-medium">Recommended</p>
        </div>
        <div className="bg-yellow-50 rounded-2xl border-2 border-yellow-200/50 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-800">
            {MERIT_DATA.filter((c) => c.status === 'reserve').length}
          </p>
          <p className="text-xs text-yellow-700 font-medium">Reserve List</p>
        </div>
        <div className="bg-red-50 rounded-2xl border-2 border-red-200/50 p-4 text-center">
          <p className="text-2xl font-bold text-red-800">
            {MERIT_DATA.filter((c) => c.status === 'not-recommended').length}
          </p>
          <p className="text-xs text-red-700 font-medium">Not Recommended</p>
        </div>
      </div>

      {/* Merit Table */}
      <div className="bg-white rounded-2xl border-2 border-border/40 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Candidate</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Position</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Exam Score</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Qual. Score</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {MERIT_DATA.map((c) => (
              <tr key={c.ref} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      c.rank <= 3 ? 'bg-accent/10 text-accent' : 'bg-gray-100 text-text-muted',
                    )}
                  >
                    {c.rank}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-primary-dark">{c.name}</td>
                <td className="px-6 py-4 text-sm font-mono text-text-muted">{c.ref}</td>
                <td className="px-6 py-4 text-sm text-text-muted">{c.position}</td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm font-bold text-primary-dark">{c.examScore}%</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm font-bold text-primary-dark">{c.qualScore}%</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={cn(
                      'text-sm font-bold',
                      c.total >= 75 ? 'text-green-700' : c.total >= 60 ? 'text-yellow-700' : 'text-red-700',
                    )}
                  >
                    {c.total}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider',
                      STATUS_COLORS[c.status],
                    )}
                  >
                    {STATUS_LABELS[c.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
