'use client';

import { useState } from 'react';
import { Search, Eye, Edit, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type AppStatus = 'Received' | 'Under Review' | 'Shortlisted' | 'Rejected';

interface ApplicationRow {
  id: number;
  reference: string;
  name: string;
  position: string;
  date: string;
  status: AppStatus;
}

const SAMPLE_APPLICATIONS: ApplicationRow[] = [
  { id: 1, reference: 'REC-2025-0042', name: 'Akosua Danquah', position: 'Administrative Officer Gr. II', date: '10 Apr 2025', status: 'Under Review' },
  { id: 2, reference: 'REC-2025-0041', name: 'Kwame Tetteh-Mensah', position: 'Budget Analyst', date: '9 Apr 2025', status: 'Received' },
  { id: 3, reference: 'REC-2025-0040', name: 'Abena Frimpong', position: 'HR Officer', date: '8 Apr 2025', status: 'Shortlisted' },
];

const STATUS_COLORS: Record<AppStatus, string> = {
  'Received': 'bg-blue-100 text-blue-800',
  'Under Review': 'bg-yellow-100 text-yellow-800',
  'Shortlisted': 'bg-green-100 text-green-800',
  'Rejected': 'bg-gray-100 text-gray-600',
};

export default function AdminRecruitmentPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = SAMPLE_APPLICATIONS.filter(
    (a) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.reference.toLowerCase().includes(query.toLowerCase()) ||
      a.position.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark">Recruitment</h2>
          <p className="text-sm text-text-muted mt-1">Control the recruitment window and review incoming applications.</p>
        </div>
      </div>

      {/* Recruitment Window Card */}
      <div className="bg-white rounded-2xl border-2 border-border/40 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-primary-dark">Recruitment Window</h3>
            <p className="text-sm text-text-muted mt-0.5">
              Currently:{' '}
              <span className={cn('font-semibold', isOpen ? 'text-green-600' : 'text-red-600')}>
                {isOpen ? 'Open' : 'Closed'}
              </span>
            </p>
          </div>
          <button
            onClick={() => setIsOpen((v) => !v)}
            className={cn(
              'px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors',
              isOpen
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-primary text-white hover:bg-primary-light',
            )}
          >
            {isOpen ? 'Close Recruitment' : 'Open Recruitment'}
          </button>
        </div>
      </div>

      {/* Closed Banner */}
      {!isOpen && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium text-amber-800">
            Recruitment is currently closed. No new applications are being accepted.
          </p>
        </div>
      )}

      {/* Applications section header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-primary-dark">Applications ({SAMPLE_APPLICATIONS.length})</h3>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search by name, reference or position..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border-2 border-border/40 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-border/40">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Position</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">Actions</th>
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
                  <td className="px-6 py-4 text-sm font-mono font-medium text-text-muted">{row.reference}</td>
                  <td className="px-6 py-4 text-sm font-medium text-primary-dark">{row.name}</td>
                  <td className="px-6 py-4 text-sm text-text-muted">{row.position}</td>
                  <td className="px-6 py-4 text-sm text-text-muted whitespace-nowrap">{row.date}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                        STATUS_COLORS[row.status],
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        aria-label="View application"
                        className="p-2 rounded-lg hover:bg-primary/5 text-text-muted hover:text-primary transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        aria-label="Edit application"
                        className="p-2 rounded-lg hover:bg-primary/5 text-text-muted hover:text-primary transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        aria-label="Delete application"
                        className="p-2 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
