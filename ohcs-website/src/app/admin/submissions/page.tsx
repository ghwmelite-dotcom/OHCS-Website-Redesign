'use client';

import { useState } from 'react';
import { Search, Eye, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubmissionType, SubmissionStatus } from '@/types';

interface SubmissionRow {
  id: number;
  reference: string;
  type: SubmissionType;
  name: string;
  subject: string;
  status: SubmissionStatus;
  date: string;
}

const SAMPLE_SUBMISSIONS: SubmissionRow[] = [
  { id: 1, reference: 'SUB-2025-0118', type: 'complaint', name: 'Ama Boateng', subject: 'Delay in promotion processing', status: 'under_review', date: '14 Apr 2025' },
  { id: 2, reference: 'SUB-2025-0117', type: 'feedback', name: 'Kweku Asante', subject: 'Commendation for HR Portal', status: 'resolved', date: '12 Apr 2025' },
  { id: 3, reference: 'SUB-2025-0116', type: 'rti', name: 'Adwoa Osei', subject: 'Request for salary scale data', status: 'received', date: '10 Apr 2025' },
  { id: 4, reference: 'SUB-2025-0115', type: 'complaint', name: 'Yaw Darko', subject: 'Unauthorized deduction from salary', status: 'in_progress', date: '8 Apr 2025' },
  { id: 5, reference: 'SUB-2025-0114', type: 'feedback', name: 'Anonymous', subject: 'Training workshop feedback', status: 'closed', date: '5 Apr 2025' },
];

type FilterTab = 'all' | SubmissionType;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'complaint', label: 'Complaints' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'rti', label: 'RTI' },
];

const TYPE_COLORS: Record<SubmissionType, string> = {
  complaint: 'bg-red-100 text-red-700',
  feedback: 'bg-blue-100 text-blue-800',
  rti: 'bg-purple-100 text-purple-800',
  recruitment: 'bg-amber-100 text-amber-800',
};

const TYPE_LABELS: Record<SubmissionType, string> = {
  complaint: 'Complaint',
  feedback: 'Feedback',
  rti: 'RTI',
  recruitment: 'Recruitment',
};

const STATUS_COLORS: Record<SubmissionStatus, string> = {
  received: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  received: 'Received',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export default function AdminSubmissionsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [query, setQuery] = useState('');

  const filtered = SAMPLE_SUBMISSIONS.filter((s) => {
    const matchesTab = activeTab === 'all' || s.type === activeTab;
    const matchesQuery =
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.reference.toLowerCase().includes(query.toLowerCase()) ||
      s.subject.toLowerCase().includes(query.toLowerCase());
    return matchesTab && matchesQuery;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark">Submissions</h2>
          <p className="text-sm text-text-muted mt-1">Review and manage complaints, feedback, and RTI requests.</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              activeTab === tab.key
                ? 'bg-white text-primary-dark shadow-sm'
                : 'text-text-muted hover:text-primary-dark',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search submissions..."
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
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-text-muted">
                  No submissions found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-text-muted">{row.reference}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                        TYPE_COLORS[row.type],
                      )}
                    >
                      {TYPE_LABELS[row.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-primary-dark">{row.name}</td>
                  <td className="px-6 py-4 text-sm text-text-muted max-w-[200px] truncate">{row.subject}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                        STATUS_COLORS[row.status],
                      )}
                    >
                      {STATUS_LABELS[row.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted whitespace-nowrap">{row.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        aria-label="View submission"
                        className="p-2 rounded-lg hover:bg-primary/5 text-text-muted hover:text-primary transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        aria-label="Edit submission"
                        className="p-2 rounded-lg hover:bg-primary/5 text-text-muted hover:text-primary transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        aria-label="Delete submission"
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
