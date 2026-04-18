'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, Edit, CheckCircle, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { audit } from '@/lib/audit-logger';

type SubmissionType = 'complaint' | 'feedback' | 'rti';
type SubmissionStatus = 'received' | 'under_review' | 'in_progress' | 'resolved' | 'closed';

interface Submission {
  id: string;
  reference: string;
  type: SubmissionType;
  name: string;
  email: string;
  subject: string;
  body: string;
  status: SubmissionStatus;
  date: string;
  adminNotes: string;
}

type FilterTab = 'all' | SubmissionType;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'complaint', label: 'Complaints' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'rti', label: 'RTI' },
];

const TYPE_COLORS: Record<SubmissionType, string> = {
  complaint: 'bg-rose-100 text-rose-800',
  feedback: 'bg-blue-100 text-blue-800',
  rti: 'bg-amber-100 text-amber-800',
};

const TYPE_LABELS: Record<SubmissionType, string> = {
  complaint: 'Complaint',
  feedback: 'Feedback',
  rti: 'RTI',
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

const STATUS_ORDER: SubmissionStatus[] = [
  'received',
  'under_review',
  'in_progress',
  'resolved',
  'closed',
];

const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-001',
    reference: 'SUB-2025-0118',
    type: 'complaint',
    name: 'Ama Boateng',
    email: 'a.boateng@example.com',
    subject: 'Delay in promotion processing',
    body: 'I have been awaiting my promotion documentation for over six months. Despite multiple follow-ups with the HR department, no progress has been made. I would appreciate urgent attention to this matter.',
    status: 'under_review',
    date: '14 Apr 2025',
    adminNotes: '',
  },
  {
    id: 'sub-002',
    reference: 'SUB-2025-0117',
    type: 'feedback',
    name: 'Kweku Asante',
    email: 'k.asante@example.com',
    subject: 'Commendation for HR Portal',
    body: 'The new HR portal has significantly improved how we access our records and submit leave requests. Excellent work by the team.',
    status: 'resolved',
    date: '12 Apr 2025',
    adminNotes: 'Forwarded to the IT team for recognition.',
  },
  {
    id: 'sub-003',
    reference: 'SUB-2025-0116',
    type: 'rti',
    name: 'Adwoa Osei',
    email: 'a.osei@example.com',
    subject: 'Request for salary scale data',
    body: 'Under the Right to Information Act, I request the current public service salary scale for grades GS-10 through GS-15, including all allowances and supplements effective 2024.',
    status: 'received',
    date: '10 Apr 2025',
    adminNotes: '',
  },
  {
    id: 'sub-004',
    reference: 'SUB-2025-0115',
    type: 'complaint',
    name: 'Yaw Darko',
    email: 'y.darko@example.com',
    subject: 'Unauthorized deduction from salary',
    body: 'An amount of GHS 450 was deducted from my April 2025 salary with no explanation provided. I request an immediate review and reversal of this deduction.',
    status: 'in_progress',
    date: '8 Apr 2025',
    adminNotes: 'Escalated to Finance Directorate for investigation.',
  },
  {
    id: 'sub-005',
    reference: 'SUB-2025-0114',
    type: 'feedback',
    name: 'Anonymous',
    email: '',
    subject: 'Training workshop feedback',
    body: 'The performance management workshop held on 2 April was very informative. Would appreciate more practical case studies in future sessions.',
    status: 'closed',
    date: '5 Apr 2025',
    adminNotes: 'Noted and forwarded to training coordinator.',
  },
  {
    id: 'sub-006',
    reference: 'SUB-2025-0113',
    type: 'rti',
    name: 'Kofi Acheampong',
    email: 'k.acheampong@example.com',
    subject: 'Records of disciplinary proceedings 2023',
    body: 'I am requesting access to anonymised records of all disciplinary proceedings conducted by the Commission in 2023, as permitted under the RTI Act.',
    status: 'under_review',
    date: '3 Apr 2025',
    adminNotes: '',
  },
];

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [query, setQuery] = useState('');
  const [viewSub, setViewSub] = useState<Submission | null>(null);
  const [editSub, setEditSub] = useState<Submission | null>(null);
  const [editStatus, setEditStatus] = useState<SubmissionStatus>('received');
  const [editNotes, setEditNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  function countForTab(tab: FilterTab) {
    if (tab === 'all') return submissions.length;
    return submissions.filter((s) => s.type === tab).length;
  }

  const filtered = submissions.filter((s) => {
    const matchesTab = activeTab === 'all' || s.type === activeTab;
    const matchesQuery =
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.reference.toLowerCase().includes(query.toLowerCase());
    return matchesTab && matchesQuery;
  });

  function openEdit(sub: Submission) {
    setEditSub(sub);
    setEditStatus(sub.status);
    setEditNotes(sub.adminNotes);
  }

  function saveEdit() {
    if (!editSub) return;
    audit('status_change', 'submission', editSub.reference, editSub.reference, 'Changed status to ' + editStatus);
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === editSub.id ? { ...s, status: editStatus, adminNotes: editNotes } : s,
      ),
    );
    setEditSub(null);
    setSuccessMsg('Submission updated successfully.');
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark">Submissions</h2>
          <p className="text-sm text-text-muted mt-1">
            Review and manage complaints, feedback, and RTI requests.
          </p>
        </div>
      </div>

      {/* Success feedback */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium text-green-800">{successMsg}</p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
              activeTab === tab.key
                ? 'bg-white text-primary-dark shadow-sm'
                : 'text-text-muted hover:text-primary-dark',
            )}
          >
            {tab.label}{' '}
            <span
              className={cn(
                'ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full',
                activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-600',
              )}
            >
              {countForTab(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Search by reference or name..."
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
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">
                Actions
              </th>
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
                  <td className="px-6 py-4 text-sm text-text-muted max-w-[200px] truncate">
                    {row.subject}
                  </td>
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
                        aria-label={`View ${row.reference}`}
                        onClick={() => setViewSub(row)}
                        className="p-2 rounded-lg hover:bg-primary/5 text-text-muted hover:text-primary transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`Edit ${row.reference}`}
                        onClick={() => openEdit(row)}
                        className="p-2 rounded-lg hover:bg-primary/5 text-text-muted hover:text-primary transition-colors"
                      >
                        <Edit className="h-4 w-4" />
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
      {viewSub && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Submission details"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewSub(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary-dark">Submission Details</h3>
              <button
                onClick={() => setViewSub(null)}
                aria-label="Close modal"
                className="p-2 rounded-lg hover:bg-gray-100 text-text-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                  TYPE_COLORS[viewSub.type],
                )}
              >
                {TYPE_LABELS[viewSub.type]}
              </span>
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                  STATUS_COLORS[viewSub.status],
                )}
              >
                {STATUS_LABELS[viewSub.status]}
              </span>
            </div>

            <dl className="space-y-4">
              {(
                [
                  ['Reference', viewSub.reference],
                  ['Submitted By', viewSub.name],
                  ...(viewSub.email ? [['Email', viewSub.email] as [string, string]] : []),
                  ['Date', viewSub.date],
                  ['Subject', viewSub.subject],
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
                  Message
                </dt>
                <dd className="text-sm text-text-muted leading-relaxed bg-gray-50 rounded-xl p-4 border border-border/40">
                  {viewSub.body}
                </dd>
              </div>
            </dl>

            {/* Status timeline */}
            <div className="mt-6 pt-6 border-t border-border/40">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
                Status History
              </h4>
              <div className="space-y-2">
                {STATUS_ORDER.slice(0, STATUS_ORDER.indexOf(viewSub.status) + 1).map(
                  (s, i, arr) => (
                    <div key={s} className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-2.5 h-2.5 rounded-full flex-shrink-0',
                          i === arr.length - 1 ? 'bg-primary' : 'bg-green-500',
                        )}
                      />
                      <span className="text-sm text-primary-dark font-medium">
                        {STATUS_LABELS[s]}
                      </span>
                      <Clock className="h-3 w-3 text-text-muted ml-auto" aria-hidden="true" />
                    </div>
                  ),
                )}
              </div>
            </div>

            {viewSub.adminNotes && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
                  Admin Notes
                </p>
                <p className="text-sm text-amber-900">{viewSub.adminNotes}</p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewSub(null)}
                className="px-5 py-2.5 border-2 border-border/60 text-sm font-semibold text-text-muted rounded-xl hover:border-primary hover:text-primary transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editSub && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Update submission status"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditSub(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-primary-dark">Update Status</h3>
                <p className="text-sm text-text-muted mt-0.5 font-mono">{editSub.reference}</p>
              </div>
              <button
                onClick={() => setEditSub(null)}
                aria-label="Close modal"
                className="p-2 rounded-lg hover:bg-gray-100 text-text-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="edit-status"
                  className="block text-sm font-semibold text-primary-dark mb-2"
                >
                  Status
                </label>
                <select
                  id="edit-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as SubmissionStatus)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 text-sm focus:border-primary focus:outline-none bg-white"
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="edit-notes"
                  className="block text-sm font-semibold text-primary-dark mb-2"
                >
                  Admin Notes
                </label>
                <textarea
                  id="edit-notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  placeholder="Add internal notes about this submission..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={saveEdit}
                className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditSub(null)}
                className="px-5 py-2.5 border-2 border-border/60 text-sm font-semibold text-text-muted rounded-xl hover:border-primary hover:text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
