'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FolderOpen, Kanban, GraduationCap, MessageSquare,
  BarChart3, ShieldAlert, Trophy, Calendar, MapPin, Monitor, Wrench,
  Upload, CheckCircle, XCircle, Settings,
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
type ExamType = 'written' | 'online' | 'practical';

interface ExamResult {
  id: string;
  ref: string;
  name: string;
  score: number;
  passed: boolean;
}

const EXAM_TYPE_ICONS: Record<ExamType, typeof Monitor> = {
  written: GraduationCap,
  online: Monitor,
  practical: Wrench,
};

const EXAM_RESULTS: ExamResult[] = [
  { id: 'r01', ref: 'OHCS-REC-20260413-K5L9', name: 'Kwabena Osei', score: 82, passed: true },
  { id: 'r02', ref: 'OHCS-REC-20260412-M2N4', name: 'Abena Frimpong', score: 74, passed: true },
  { id: 'r03', ref: 'OHCS-REC-20260411-P7Q1', name: 'Nana Agyemang', score: 91, passed: true },
  { id: 'r04', ref: 'OHCS-REC-20260410-R3S6', name: 'Akua Boakye', score: 45, passed: false },
  { id: 'r05', ref: 'OHCS-REC-20260409-T8U2', name: 'Kwesi Antwi', score: 67, passed: true },
  { id: 'r06', ref: 'OHCS-REC-20260408-V4W7', name: 'Afia Mensah', score: 38, passed: false },
  { id: 'r07', ref: 'OHCS-REC-20260407-X1Y3', name: 'Yaw Amoako', score: 55, passed: true },
  { id: 'r08', ref: 'OHCS-REC-20260406-Z5A8', name: 'Esi Appiah', score: 88, passed: true },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function ExaminationsPage() {
  const [passMark, setPassMark] = useState(50);
  const [examName, setExamName] = useState('2026 Graduate Entrance Examination');
  const [examDate, setExamDate] = useState('2026-05-10');
  const [examVenue, setExamVenue] = useState('Accra International Conference Centre');
  const [examType, setExamType] = useState<ExamType>('online');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const results = EXAM_RESULTS.map((r) => ({
    ...r,
    passed: r.score >= passMark,
  }));

  const passCount = results.filter((r) => r.passed).length;
  const failCount = results.filter((r) => !r.passed).length;
  const ExamIcon = EXAM_TYPE_ICONS[examType];

  return (
    <div>
      <RecruitmentTabs current="/admin/recruitment/examinations" />

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary-dark">Examination Hub</h2>
        <p className="text-sm text-text-muted mt-1">
          Schedule exams, upload results, and configure scoring thresholds.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium text-green-800">{toast}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Schedule Exam Card */}
        <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
          <h3 className="font-semibold text-base text-primary-dark mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" aria-hidden="true" />
            Schedule Examination
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                Exam Name
              </label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Type
                </label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value as ExamType)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
                >
                  <option value="written">Written</option>
                  <option value="online">Online</option>
                  <option value="practical">Practical</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                Venue
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40" aria-hidden="true" />
                <input
                  type="text"
                  value={examVenue}
                  onChange={(e) => setExamVenue(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={() => setToast('Examination scheduled successfully.')}
              className="w-full px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
            >
              Schedule Examination
            </button>
          </div>
        </div>

        {/* Results Upload & Threshold */}
        <div className="space-y-6">
          {/* Upload Area */}
          <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
            <h3 className="font-semibold text-base text-primary-dark mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5" aria-hidden="true" />
              Upload Results
            </h3>
            <div className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-8 w-8 text-text-muted/30 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm font-semibold text-primary-dark mb-1">
                Drop CSV or Excel file here
              </p>
              <p className="text-xs text-text-muted">or click to browse</p>
              <button
                onClick={() => setToast('Results upload feature coming soon.')}
                className="mt-4 px-4 py-2 bg-gray-100 text-sm font-semibold text-text-muted rounded-xl hover:bg-gray-200 transition-colors"
              >
                Browse Files
              </button>
            </div>
          </div>

          {/* Threshold Setting */}
          <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
            <h3 className="font-semibold text-base text-primary-dark mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" aria-hidden="true" />
              Auto-Scoring Threshold
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Pass Mark (%)
                </label>
                <input
                  type="range"
                  min={30}
                  max={80}
                  value={passMark}
                  onChange={(e) => setPassMark(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <div className="text-center px-4 py-2 bg-primary/5 rounded-xl border border-primary/20 min-w-[60px]">
                <span className="text-lg font-bold text-primary">{passMark}%</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1 text-green-700">
                <CheckCircle className="h-4 w-4" aria-hidden="true" /> {passCount} passed
              </span>
              <span className="flex items-center gap-1 text-red-700">
                <XCircle className="h-4 w-4" aria-hidden="true" /> {failCount} failed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border-2 border-border/40 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border/30">
          <h3 className="font-semibold text-base text-primary-dark">Examination Results</h3>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <ExamIcon className="h-4 w-4" aria-hidden="true" />
            {examType.charAt(0).toUpperCase() + examType.slice(1)} Exam
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Candidate
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Result
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {results.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-primary-dark">{r.ref}</td>
                <td className="px-6 py-4 text-sm font-semibold text-primary-dark">{r.name}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          r.passed ? 'bg-green-500' : 'bg-red-500',
                        )}
                        style={{ width: `${r.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-primary-dark">{r.score}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider',
                      r.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
                    )}
                  >
                    {r.passed ? (
                      <CheckCircle className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-3 w-3" aria-hidden="true" />
                    )}
                    {r.passed ? 'Pass' : 'Fail'}
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
