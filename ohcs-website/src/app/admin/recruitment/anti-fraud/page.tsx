'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FolderOpen, Kanban, GraduationCap, MessageSquare,
  BarChart3, ShieldAlert, Trophy, AlertTriangle, CheckCircle, Search,
  Eye, XCircle, Shield, Activity, Globe,
} from 'lucide-react';
import { DemoBanner } from '@/components/admin/demo-banner';

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
type Severity = 'high' | 'medium' | 'low';

interface DuplicateFlag {
  id: string;
  applicantA: string;
  refA: string;
  applicantB: string;
  refB: string;
  reason: string;
  severity: Severity;
}

interface VerificationLog {
  id: string;
  action: string;
  ref: string;
  ip: string;
  timestamp: string;
}

interface FlaggedApp {
  id: string;
  ref: string;
  name: string;
  reason: string;
  severity: Severity;
  status: 'pending' | 'investigating' | 'dismissed' | 'confirmed';
}

const SEVERITY_COLORS: Record<Severity, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800',
};

const FLAG_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  investigating: 'bg-purple-100 text-purple-800',
  dismissed: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-red-100 text-red-800',
};

const DUPLICATES: DuplicateFlag[] = [
  {
    id: 'dup-001',
    applicantA: 'Kwaku Asante',
    refA: 'OHCS-REC-20260418-A7F3',
    applicantB: 'K. Asante',
    refB: 'OHCS-REC-20260415-Q2R9',
    reason: 'Same email address: kwaku.asante@email.com',
    severity: 'high',
  },
  {
    id: 'dup-002',
    applicantA: 'Akosua Mensah',
    refA: 'OHCS-REC-20260418-B2K1',
    applicantB: 'Akosua M. Mensah',
    refB: 'OHCS-REC-20260410-S5T1',
    reason: 'Same phone number: +233 24 567 8901',
    severity: 'high',
  },
  {
    id: 'dup-003',
    applicantA: 'Yaw Boateng',
    refA: 'OHCS-REC-20260417-C9D2',
    applicantB: 'Yaw B. Boateng',
    refB: 'OHCS-REC-20260412-U8V3',
    reason: 'Similar names, same date of birth',
    severity: 'medium',
  },
];

const VERIFICATION_LOG: VerificationLog[] = [
  { id: 'vlog-001', action: 'Credential verification', ref: 'OHCS-REC-20260418-A7F3', ip: '41.215.176.42', timestamp: '17 Apr 2026, 14:23' },
  { id: 'vlog-002', action: 'ID document check', ref: 'OHCS-REC-20260418-B2K1', ip: '197.255.68.91', timestamp: '17 Apr 2026, 13:45' },
  { id: 'vlog-003', action: 'Reference verification', ref: 'OHCS-REC-20260417-C9D2', ip: '41.215.176.42', timestamp: '17 Apr 2026, 11:12' },
  { id: 'vlog-004', action: 'Academic transcript check', ref: 'OHCS-REC-20260416-E4F7', ip: '154.160.22.15', timestamp: '16 Apr 2026, 16:30' },
  { id: 'vlog-005', action: 'Employment history check', ref: 'OHCS-REC-20260415-G1H8', ip: '197.251.133.7', timestamp: '16 Apr 2026, 09:15' },
];

const INITIAL_FLAGGED: FlaggedApp[] = [
  { id: 'flag-001', ref: 'OHCS-REC-20260415-Q2R9', name: 'K. Asante', reason: 'Duplicate application detected', severity: 'high', status: 'pending' },
  { id: 'flag-002', ref: 'OHCS-REC-20260410-S5T1', name: 'Akosua M. Mensah', reason: 'Phone number matches existing applicant', severity: 'high', status: 'investigating' },
  { id: 'flag-003', ref: 'OHCS-REC-20260412-U8V3', name: 'Yaw B. Boateng', reason: 'Similar name and DOB to existing applicant', severity: 'medium', status: 'pending' },
  { id: 'flag-004', ref: 'OHCS-REC-20260409-W4X6', name: 'Efua Darko', reason: 'Inconsistent employment dates', severity: 'low', status: 'pending' },
  { id: 'flag-005', ref: 'OHCS-REC-20260408-Y7Z2', name: 'Kofi Adu', reason: 'Unverifiable academic credentials', severity: 'medium', status: 'investigating' },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function AntiFraudPage() {
  const [flagged, setFlagged] = useState<FlaggedApp[]>(INITIAL_FLAGGED);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  function dismissFlag(id: string) {
    setFlagged((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'dismissed' as const } : f)),
    );
    setToast('Flag dismissed.');
  }

  function investigateFlag(id: string) {
    setFlagged((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'investigating' as const } : f)),
    );
    setToast('Flagged for investigation.');
  }

  const totalFlags = flagged.length;
  const investigating = flagged.filter((f) => f.status === 'investigating').length;
  const cleared = flagged.filter((f) => f.status === 'dismissed').length;

  return (
    <div>
      <RecruitmentTabs current="/admin/recruitment/anti-fraud" />

      <DemoBanner message="Anti-fraud detection is not yet wired to live data — figures and flagged cases are samples." />

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary-dark">Anti-Fraud Module</h2>
        <p className="text-sm text-text-muted mt-1">
          Detect duplicates, verify credentials, and investigate flagged applications.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium text-green-800">{toast}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border-2 border-border/40 p-5">
          <div className="inline-flex p-2.5 rounded-xl bg-red-50 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-primary-dark">{totalFlags}</p>
          <p className="text-xs text-text-muted">Total Flags</p>
        </div>
        <div className="bg-white rounded-2xl border-2 border-border/40 p-5">
          <div className="inline-flex p-2.5 rounded-xl bg-purple-50 mb-3">
            <Search className="h-5 w-5 text-purple-600" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-primary-dark">{investigating}</p>
          <p className="text-xs text-text-muted">Under Investigation</p>
        </div>
        <div className="bg-white rounded-2xl border-2 border-border/40 p-5">
          <div className="inline-flex p-2.5 rounded-xl bg-green-50 mb-3">
            <Shield className="h-5 w-5 text-green-600" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-primary-dark">{cleared}</p>
          <p className="text-xs text-text-muted">Cleared</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Duplicate Detection */}
        <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
          <h3 className="font-semibold text-base text-primary-dark mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
            Duplicate Detection
          </h3>
          <div className="space-y-4">
            {DUPLICATES.map((dup) => (
              <div
                key={dup.id}
                className="border-2 border-border/30 rounded-xl p-4 hover:border-red-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold text-primary-dark">
                    {dup.applicantA}{' '}
                    <span className="text-text-muted/50 font-normal">&harr;</span>{' '}
                    {dup.applicantB}
                  </p>
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0',
                      SEVERITY_COLORS[dup.severity],
                    )}
                  >
                    {dup.severity}
                  </span>
                </div>
                <p className="text-xs text-text-muted mb-1">{dup.reason}</p>
                <p className="text-[10px] font-mono text-text-muted/50">
                  {dup.refA} | {dup.refB}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Verification Log */}
        <div className="bg-white rounded-2xl border-2 border-border/40 overflow-hidden">
          <div className="p-6 border-b border-border/30">
            <h3 className="font-semibold text-base text-primary-dark flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" aria-hidden="true" />
              Verification Log
            </h3>
          </div>
          <div className="divide-y divide-border/20">
            {VERIFICATION_LOG.map((log) => (
              <div key={log.id} className="px-6 py-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-primary-dark">{log.action}</p>
                  <span className="text-[10px] text-text-muted">{log.timestamp}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span className="font-mono">{log.ref}</span>
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" aria-hidden="true" />
                    {log.ip}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Flagged Applications Table */}
      <div className="bg-white rounded-2xl border-2 border-border/40 overflow-hidden">
        <div className="p-6 border-b border-border/30">
          <h3 className="font-semibold text-base text-primary-dark">Flagged Applications</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Applicant</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {flagged.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-primary-dark">{f.ref}</td>
                <td className="px-6 py-4 text-sm font-semibold text-primary-dark">{f.name}</td>
                <td className="px-6 py-4 text-xs text-text-muted max-w-xs truncate">{f.reason}</td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider',
                      SEVERITY_COLORS[f.severity],
                    )}
                  >
                    {f.severity}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider',
                      FLAG_STATUS_COLORS[f.status],
                    )}
                  >
                    {f.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {f.status !== 'dismissed' && f.status !== 'confirmed' && (
                      <>
                        <button
                          onClick={() => investigateFlag(f.id)}
                          aria-label={`Investigate ${f.name}`}
                          className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
                          title="Investigate"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => dismissFlag(f.id)}
                          aria-label={`Dismiss flag for ${f.name}`}
                          className="p-2 rounded-lg hover:bg-gray-100 text-text-muted transition-colors"
                          title="Dismiss"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
