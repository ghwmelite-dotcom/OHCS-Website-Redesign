'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FolderOpen, Kanban, GraduationCap, MessageSquare,
  BarChart3, ShieldAlert, Trophy, Search, X, ChevronRight, ArrowRight,
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
interface Applicant {
  id: string;
  ref: string;
  name: string;
  position: string;
  date: string;
  stage: string;
}

const STAGE_CONFIG = [
  { id: 'received', name: 'Received', color: 'bg-blue-500', headerBg: 'bg-blue-50', headerText: 'text-blue-800' },
  { id: 'screening', name: 'Screening', color: 'bg-yellow-500', headerBg: 'bg-yellow-50', headerText: 'text-yellow-800' },
  { id: 'examination', name: 'Examination', color: 'bg-purple-500', headerBg: 'bg-purple-50', headerText: 'text-purple-800' },
  { id: 'interview', name: 'Interview', color: 'bg-orange-500', headerBg: 'bg-orange-50', headerText: 'text-orange-800' },
  { id: 'shortlisted', name: 'Shortlisted', color: 'bg-green-500', headerBg: 'bg-green-50', headerText: 'text-green-800' },
  { id: 'appointed', name: 'Appointed', color: 'bg-teal-500', headerBg: 'bg-teal-50', headerText: 'text-teal-800' },
];

const POSITIONS = [
  'Administrative Officer',
  'Procurement Officer',
  'IT Specialist',
  'Policy Analyst',
  'Finance Officer',
  'HR Officer',
];

const INITIAL_APPLICANTS: Applicant[] = [
  // Received
  { id: 'a01', ref: 'OHCS-REC-20260418-A7F3', name: 'Kwaku Asante', position: 'Administrative Officer', date: '18 Apr 2026', stage: 'received' },
  { id: 'a02', ref: 'OHCS-REC-20260418-B2K1', name: 'Akosua Mensah', position: 'Procurement Officer', date: '18 Apr 2026', stage: 'received' },
  { id: 'a03', ref: 'OHCS-REC-20260417-C9D2', name: 'Yaw Boateng', position: 'IT Specialist', date: '17 Apr 2026', stage: 'received' },
  { id: 'a04', ref: 'OHCS-REC-20260417-D1E5', name: 'Adwoa Amponsah', position: 'Finance Officer', date: '17 Apr 2026', stage: 'received' },
  // Screening
  { id: 'a05', ref: 'OHCS-REC-20260416-E4F7', name: 'Ama Serwaa', position: 'Policy Analyst', date: '16 Apr 2026', stage: 'screening' },
  { id: 'a06', ref: 'OHCS-REC-20260415-G1H8', name: 'Kofi Owusu', position: 'Finance Officer', date: '15 Apr 2026', stage: 'screening' },
  { id: 'a07', ref: 'OHCS-REC-20260414-H3J2', name: 'Efua Darko', position: 'HR Officer', date: '14 Apr 2026', stage: 'screening' },
  // Examination
  { id: 'a08', ref: 'OHCS-REC-20260413-K5L9', name: 'Kwabena Osei', position: 'Administrative Officer', date: '13 Apr 2026', stage: 'examination' },
  { id: 'a09', ref: 'OHCS-REC-20260412-M2N4', name: 'Abena Frimpong', position: 'IT Specialist', date: '12 Apr 2026', stage: 'examination' },
  { id: 'a10', ref: 'OHCS-REC-20260411-P7Q1', name: 'Nana Agyemang', position: 'Procurement Officer', date: '11 Apr 2026', stage: 'examination' },
  // Interview
  { id: 'a11', ref: 'OHCS-REC-20260410-R3S6', name: 'Akua Boakye', position: 'Policy Analyst', date: '10 Apr 2026', stage: 'interview' },
  { id: 'a12', ref: 'OHCS-REC-20260409-T8U2', name: 'Kwesi Antwi', position: 'Finance Officer', date: '9 Apr 2026', stage: 'interview' },
  { id: 'a13', ref: 'OHCS-REC-20260408-V4W7', name: 'Afia Mensah', position: 'HR Officer', date: '8 Apr 2026', stage: 'interview' },
  // Shortlisted
  { id: 'a14', ref: 'OHCS-REC-20260407-X1Y3', name: 'Yaw Amoako', position: 'Administrative Officer', date: '7 Apr 2026', stage: 'shortlisted' },
  { id: 'a15', ref: 'OHCS-REC-20260406-Z5A8', name: 'Esi Appiah', position: 'IT Specialist', date: '6 Apr 2026', stage: 'shortlisted' },
  { id: 'a16', ref: 'OHCS-REC-20260405-B9C2', name: 'Kojo Mensah', position: 'Procurement Officer', date: '5 Apr 2026', stage: 'shortlisted' },
  // Appointed
  { id: 'a17', ref: 'OHCS-REC-20260404-D6E1', name: 'Adjoa Nyarko', position: 'Policy Analyst', date: '4 Apr 2026', stage: 'appointed' },
  { id: 'a18', ref: 'OHCS-REC-20260403-F3G7', name: 'Kwame Tetteh', position: 'Finance Officer', date: '3 Apr 2026', stage: 'appointed' },
  { id: 'a19', ref: 'OHCS-REC-20260402-H8J4', name: 'Akosua Dufie', position: 'HR Officer', date: '2 Apr 2026', stage: 'appointed' },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function PipelinePage() {
  const [applicants, setApplicants] = useState<Applicant[]>(INITIAL_APPLICANTS);
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [selectedApp, setSelectedApp] = useState<Applicant | null>(null);

  const filtered = applicants.filter((a) => {
    const matchesSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.ref.toLowerCase().includes(search.toLowerCase());
    const matchesPosition = !positionFilter || a.position === positionFilter;
    return matchesSearch && matchesPosition;
  });

  function moveToNextStage(id: string) {
    const order = STAGE_CONFIG.map((s) => s.id);
    setApplicants((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const idx = order.indexOf(a.stage);
        const nextStage = order[idx + 1];
        if (idx < order.length - 1 && nextStage) {
          return { ...a, stage: nextStage };
        }
        return a;
      }),
    );
  }

  function getNextStageName(currentStage: string): string | null {
    const order = STAGE_CONFIG.map((s) => s.id);
    const idx = order.indexOf(currentStage);
    const nextConfig = STAGE_CONFIG[idx + 1];
    if (idx < order.length - 1 && nextConfig) {
      return nextConfig.name;
    }
    return null;
  }

  return (
    <div>
      <RecruitmentTabs current="/admin/recruitment/pipeline" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark">Application Pipeline</h2>
          <p className="text-sm text-text-muted mt-1">
            Track and advance applicants through recruitment stages.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Search applicants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none w-56"
            />
          </div>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
          >
            <option value="">All Positions</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {STAGE_CONFIG.map((stage) => {
          const cards = filtered.filter((a) => a.stage === stage.id);
          return (
            <div key={stage.id} className="bg-gray-50 rounded-2xl p-3 min-h-[400px]">
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2.5 h-2.5 rounded-full', stage.color)} />
                  <h3 className="text-sm font-bold text-primary-dark">{stage.name}</h3>
                </div>
                <span className="text-xs bg-white px-2 py-0.5 rounded-full font-semibold text-text-muted border border-border/30">
                  {cards.length}
                </span>
              </div>
              <div className="space-y-2">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => setSelectedApp(card)}
                    className="bg-white rounded-xl border-2 border-border/30 p-3 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    <p className="font-semibold text-sm text-primary-dark">{card.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">{card.position}</p>
                    <p className="text-[10px] text-text-muted/50 font-mono mt-1">{card.ref}</p>
                    {getNextStageName(card.stage) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveToNextStage(card.id);
                        }}
                        className="mt-2 flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-dark transition-colors uppercase tracking-wider"
                      >
                        Move to {getNextStageName(card.stage)}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                {cards.length === 0 && (
                  <p className="text-xs text-text-muted/40 text-center py-8">No applicants</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Applicant details"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedApp(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary-dark">Applicant Details</h3>
              <button
                onClick={() => setSelectedApp(null)}
                aria-label="Close modal"
                className="p-2 rounded-lg hover:bg-gray-100 text-text-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <dl className="space-y-4">
              {(
                [
                  ['Reference', selectedApp.ref],
                  ['Applicant Name', selectedApp.name],
                  ['Position Applied', selectedApp.position],
                  ['Date Submitted', selectedApp.date],
                  ['Current Stage', STAGE_CONFIG.find((s) => s.id === selectedApp.stage)?.name ?? selectedApp.stage],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    {label}
                  </dt>
                  <dd className="text-sm font-medium text-primary-dark">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex justify-end gap-3">
              {getNextStageName(selectedApp.stage) && (
                <button
                  onClick={() => {
                    moveToNextStage(selectedApp.id);
                    setSelectedApp(null);
                  }}
                  className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
                >
                  Move to {getNextStageName(selectedApp.stage)}
                </button>
              )}
              <button
                onClick={() => setSelectedApp(null)}
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
