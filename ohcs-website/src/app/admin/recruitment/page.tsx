'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Download,
  AlertCircle,
  CheckCircle,
  X,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AppStatus = 'received' | 'under_review' | 'shortlisted' | 'rejected';

interface Application {
  id: string;
  reference: string;
  name: string;
  email: string;
  position: string;
  date: string;
  status: AppStatus;
}

const STATUS_ORDER: AppStatus[] = ['received', 'under_review', 'shortlisted', 'rejected'];

const STATUS_COLORS: Record<AppStatus, string> = {
  received: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  shortlisted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<AppStatus, string> = {
  received: 'Received',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
};

const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'app-001',
    reference: 'OHCS-REC-2025-0042',
    name: 'Akosua Danquah',
    email: 'a.danquah@example.com',
    position: 'Administrative Officer Gr. II',
    date: '10 Apr 2025',
    status: 'under_review',
  },
  {
    id: 'app-002',
    reference: 'OHCS-REC-2025-0041',
    name: 'Kwame Tetteh-Mensah',
    email: 'k.tetteh@example.com',
    position: 'Budget Analyst',
    date: '9 Apr 2025',
    status: 'received',
  },
  {
    id: 'app-003',
    reference: 'OHCS-REC-2025-0040',
    name: 'Abena Frimpong',
    email: 'a.frimpong@example.com',
    position: 'HR Officer',
    date: '8 Apr 2025',
    status: 'shortlisted',
  },
];

export default function AdminRecruitmentPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [applications, setApplications] = useState<Application[]>(INITIAL_APPLICATIONS);
  const [viewApp, setViewApp] = useState<Application | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-clear success message
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const filtered = applications.filter(
    (a) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.reference.toLowerCase().includes(query.toLowerCase()),
  );

  function cycleStatus(id: string) {
    setApplications((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const idx = STATUS_ORDER.indexOf(a.status);
        const next = (STATUS_ORDER[(idx + 1) % STATUS_ORDER.length] ?? STATUS_ORDER[0]) as AppStatus;
        return { ...a, status: next };
      }),
    );
    setSuccessMsg('Status updated successfully.');
  }

  function toggleWindow() {
    const next = !isOpen;
    setIsOpen(next);
    setSuccessMsg(next ? 'Recruitment window opened.' : 'Recruitment window closed.');
  }

  function handleExport() {
    setSuccessMsg('Export feature coming soon.');
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark">Recruitment</h2>
          <p className="text-sm text-text-muted mt-1">
            Control the recruitment window and review incoming applications.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-border/60 bg-white text-sm font-semibold text-text-muted rounded-xl hover:border-primary hover:text-primary transition-colors"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export
        </button>
      </div>

      {/* Success feedback */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium text-green-800">{successMsg}</p>
        </div>
      )}

      {/* Recruitment Window Card */}
      <div className="bg-white rounded-2xl border-2 border-border/40 p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-semibold text-lg text-primary-dark">Recruitment Window</h3>
              <p className="text-sm text-text-muted mt-0.5">
                Public applications are currently{' '}
                <span
                  className={cn(
                    'font-bold px-2 py-0.5 rounded-full text-xs',
                    isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
                  )}
                >
                  {isOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={toggleWindow}
            className={cn(
              'px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors',
              isOpen
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-primary text-white hover:bg-primary-light',
            )}
          >
            {isOpen ? 'Close Recruitment' : 'Open Recruitment'}
          </button>
        </div>

        {isOpen && (
          <div className="mt-4 pt-4 border-t border-border/40 grid grid-cols-3 gap-4">
            {(
              [
                ['Received', applications.filter((a) => a.status === 'received').length, 'text-blue-700'],
                ['Under Review', applications.filter((a) => a.status === 'under_review').length, 'text-yellow-700'],
                ['Shortlisted', applications.filter((a) => a.status === 'shortlisted').length, 'text-green-700'],
              ] as [string, number, string][]
            ).map(([label, count, color]) => (
              <div key={label} className="text-center">
                <p className={cn('text-2xl font-bold', color)}>{count}</p>
                <p className="text-xs text-text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Closed Banner */}
      {!isOpen && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium text-amber-800">
            Recruitment is currently closed. No new applications are being accepted. Past applications are shown below.
          </p>
        </div>
      )}

      {/* Applications section */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-primary-dark">
          Applications ({applications.length})
        </h3>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Search by name or reference..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border-2 border-border/40 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-border/40">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-text-muted">
                  No applications found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono font-medium text-text-muted">
                    {row.reference}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-primary-dark">{row.name}</td>
                  <td className="px-6 py-4 text-sm text-text-muted">{row.position}</td>
                  <td className="px-6 py-4 text-sm text-text-muted whitespace-nowrap">{row.date}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => cycleStatus(row.id)}
                      title="Click to cycle status"
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-opacity hover:opacity-75',
                        STATUS_COLORS[row.status],
                      )}
                    >
                      {STATUS_LABELS[row.status]}
                      <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        aria-label={`View ${row.name}`}
                        onClick={() => setViewApp(row)}
                        className="p-2 rounded-lg hover:bg-primary/5 text-text-muted hover:text-primary transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Details Modal */}
      {viewApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Application details"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewApp(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary-dark">Application Details</h3>
              <button
                onClick={() => setViewApp(null)}
                aria-label="Close modal"
                className="p-2 rounded-lg hover:bg-gray-100 text-text-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <dl className="space-y-4">
              {(
                [
                  ['Reference', viewApp.reference],
                  ['Applicant Name', viewApp.name],
                  ['Email', viewApp.email],
                  ['Position Applied', viewApp.position],
                  ['Date Submitted', viewApp.date],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    {label}
                  </dt>
                  <dd className="text-sm font-medium text-primary-dark">{value}</dd>
                </div>
              ))}
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Status
                </dt>
                <dd>
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                      STATUS_COLORS[viewApp.status],
                    )}
                  >
                    {STATUS_LABELS[viewApp.status]}
                  </span>
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => {
                  cycleStatus(viewApp.id);
                  // Update the modal's local view too
                  setViewApp((prev) => {
                    if (!prev) return null;
                    const idx = STATUS_ORDER.indexOf(prev.status);
                    const next = (STATUS_ORDER[(idx + 1) % STATUS_ORDER.length] ?? STATUS_ORDER[0]) as AppStatus;
                    return { ...prev, status: next };
                  });
                }}
                className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
              >
                Advance Status
              </button>
              <button
                onClick={() => setViewApp(null)}
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
