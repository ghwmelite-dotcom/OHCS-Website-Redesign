'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getAuditLog, clearAuditLog } from '@/lib/audit-logger';
import type { AuditEntry, AuditAction, AuditResource } from '@/lib/audit-logger';
import { ROLE_COLORS, ROLE_LABELS } from '@/lib/admin-auth';
import {
  Search,
  Download,
  Trash2,
  ChevronDown,
  ChevronRight,
  Activity,
  Users,
  Zap,
  Calendar,
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

const ACTION_BADGE_COLORS: Record<AuditAction, string> = {
  login: 'bg-gray-100 text-gray-700',
  logout: 'bg-gray-100 text-gray-700',
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  status_change: 'bg-amber-100 text-amber-800',
  publish: 'bg-purple-100 text-purple-800',
  unpublish: 'bg-purple-100 text-purple-800',
  activate: 'bg-teal-100 text-teal-800',
  deactivate: 'bg-teal-100 text-teal-800',
  export: 'bg-indigo-100 text-indigo-800',
  view: 'bg-slate-100 text-slate-600',
};

const ACTION_LABELS: Record<AuditAction, string> = {
  login: 'Login',
  logout: 'Logout',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  status_change: 'Status Change',
  publish: 'Publish',
  unpublish: 'Unpublish',
  activate: 'Activate',
  deactivate: 'Deactivate',
  export: 'Export',
  view: 'View',
};

const RESOURCE_LABELS: Record<AuditResource, string> = {
  news: 'News',
  event: 'Event',
  publication: 'Publication',
  leadership: 'Leadership',
  submission: 'Submission',
  recruitment_exercise: 'Recruitment Exercise',
  recruitment_application: 'Recruitment Application',
  exam_result: 'Exam Result',
  communication: 'Communication',
  merit_list: 'Merit List',
  admin_user: 'Admin User',
  session: 'Session',
};

type DateRange = 'today' | '7days' | '30days' | 'all';

// ─── Page Component ──────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all');
  const [resourceFilter, setResourceFilter] = useState<AuditResource | 'all'>('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    setEntries(getAuditLog());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return entries.filter((entry) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const matches =
          entry.userName.toLowerCase().includes(q) ||
          entry.resourceTitle.toLowerCase().includes(q) ||
          entry.details.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Action filter
      if (actionFilter !== 'all' && entry.action !== actionFilter) return false;

      // Resource filter
      if (resourceFilter !== 'all' && entry.resource !== resourceFilter) return false;

      // Date range
      if (dateRange !== 'all') {
        const entryDate = new Date(entry.timestamp);
        if (dateRange === 'today' && entryDate < todayStart) return false;
        if (dateRange === '7days' && entryDate < new Date(now.getTime() - 7 * 86_400_000)) return false;
        if (dateRange === '30days' && entryDate < new Date(now.getTime() - 30 * 86_400_000)) return false;
      }

      return true;
    });
  }, [entries, search, actionFilter, resourceFilter, dateRange]);

  // ── Pagination ─────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, actionFilter, resourceFilter, dateRange]);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = entries.filter(
      (e) => new Date(e.timestamp) >= todayStart,
    ).length;

    // Most active user
    const userCounts: Record<string, number> = {};
    for (const entry of entries) {
      userCounts[entry.userName] = (userCounts[entry.userName] ?? 0) + 1;
    }
    const mostActiveUser =
      Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

    // Most common action
    const actionCounts: Record<string, number> = {};
    for (const entry of entries) {
      actionCounts[entry.action] = (actionCounts[entry.action] ?? 0) + 1;
    }
    const mostCommonAction =
      Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

    return {
      total: entries.length,
      today: todayCount,
      mostActiveUser,
      mostCommonAction:
        mostCommonAction !== 'N/A'
          ? ACTION_LABELS[mostCommonAction as AuditAction] ?? mostCommonAction
          : 'N/A',
    };
  }, [entries]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleClearLog() {
    if (window.confirm('Are you sure you want to clear the entire audit log? This cannot be undone.')) {
      clearAuditLog();
      setEntries([]);
      setToast('Audit log cleared.');
    }
  }

  function handleExport() {
    setToast('Export feature will be available when the backend is connected.');
  }

  function formatTimestamp(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark">Audit Log</h2>
          <p className="text-sm text-text-muted mt-1">
            Track all administrative actions across the portal.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-border/60 text-sm font-semibold text-text-muted rounded-xl hover:border-primary hover:text-primary transition-colors"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export Log
          </button>
          <button
            onClick={handleClearLog}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 border-2 border-red-200 text-sm font-semibold text-red-700 rounded-xl hover:bg-red-100 transition-colors"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-3 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <Activity className="h-5 w-5 text-blue-600 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium text-blue-800">{toast}</p>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Entries', value: stats.total.toLocaleString(), icon: Activity, color: 'text-primary' },
          { label: 'Entries Today', value: stats.today.toLocaleString(), icon: Calendar, color: 'text-green-600' },
          { label: 'Most Active User', value: stats.mostActiveUser, icon: Users, color: 'text-blue-600' },
          { label: 'Most Common Action', value: stats.mostCommonAction, icon: Zap, color: 'text-amber-600' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border-2 border-border/40 p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <stat.icon className={cn('h-5 w-5', stat.color)} aria-hidden="true" />
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
            <p className="text-lg font-bold text-primary-dark truncate">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search by user, resource, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-colors"
          />
        </div>

        {/* Action filter */}
        <div className="relative">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as AuditAction | 'all')}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-colors font-medium text-text-muted"
          >
            <option value="all">All Actions</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="status_change">Status Change</option>
            <option value="publish">Publish</option>
            <option value="unpublish">Unpublish</option>
            <option value="activate">Activate</option>
            <option value="deactivate">Deactivate</option>
            <option value="export">Export</option>
            <option value="view">View</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/60" />
        </div>

        {/* Resource filter */}
        <div className="relative">
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value as AuditResource | 'all')}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-colors font-medium text-text-muted"
          >
            <option value="all">All Resources</option>
            {(Object.entries(RESOURCE_LABELS) as [AuditResource, string][]).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/60" />
        </div>

        {/* Date range */}
        <div className="relative">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-colors font-medium text-text-muted"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/60" />
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-text-muted mb-3">
        Showing {paginated.length} of {filtered.length} entries
      </p>

      {/* Table */}
      <div className="bg-white rounded-2xl border-2 border-border/40 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-border/40">
            <tr>
              <th className="w-8 px-3 py-3" />
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider hidden md:table-cell">
                Resource
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider hidden lg:table-cell">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-text-muted">
                  No audit entries found.
                </td>
              </tr>
            ) : (
              paginated.map((entry) => {
                const isExpanded = expandedId === entry.id;
                return (
                  <tr
                    key={entry.id}
                    className="group cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    <td className="px-3 py-3">
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 text-text-muted/30 transition-transform duration-200',
                          isExpanded && 'rotate-90 text-primary',
                        )}
                        aria-hidden="true"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted whitespace-nowrap">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary-dark">
                          {entry.userName}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold',
                            ROLE_COLORS[entry.userRole] ?? 'bg-gray-100 text-gray-600',
                          )}
                        >
                          {ROLE_LABELS[entry.userRole] ?? entry.userRole}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                          ACTION_BADGE_COLORS[entry.action],
                        )}
                      >
                        {ACTION_LABELS[entry.action]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted hidden md:table-cell">
                      <span className="font-medium">
                        {RESOURCE_LABELS[entry.resource]}
                      </span>
                      {entry.resourceTitle && (
                        <span className="text-text-muted/60 ml-1.5 truncate max-w-[180px] inline-block align-bottom">
                          — {entry.resourceTitle}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted hidden lg:table-cell max-w-[280px] truncate">
                      {entry.details}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Expanded rows rendered outside table for proper layout */}
        {paginated.map((entry) => {
          if (expandedId !== entry.id) return null;
          return (
            <div
              key={`${entry.id}-detail`}
              className="border-t border-border/30 bg-gray-50 px-6 py-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Full Details
                  </span>
                  <p className="text-sm text-primary-dark">{entry.details}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                      Resource ID
                    </span>
                    <p className="text-sm font-mono text-primary-dark">{entry.resourceId || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                      IP Address
                    </span>
                    <p className="text-sm font-mono text-primary-dark">{entry.ipAddress}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                      User Email
                    </span>
                    <p className="text-sm text-primary-dark">{entry.userEmail || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                      Entry ID
                    </span>
                    <p className="text-[11px] font-mono text-text-muted truncate">{entry.id}</p>
                  </div>
                </div>
              </div>

              {/* Changes diff */}
              {entry.changes && entry.changes.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">
                    Changes
                  </span>
                  <div className="bg-white rounded-xl border border-border/40 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                            Field
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                            Before
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                            After
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {entry.changes.map((change, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 font-medium text-primary-dark capitalize">
                              {change.field}
                            </td>
                            <td className="px-4 py-2 text-red-600 bg-red-50/50 line-through">
                              {change.before}
                            </td>
                            <td className="px-4 py-2 text-green-700 bg-green-50/50 font-medium">
                              {change.after}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl border-2 border-border/60 text-sm font-semibold text-text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'w-10 h-10 rounded-xl text-sm font-semibold transition-colors',
                    page === pageNum
                      ? 'bg-primary text-white'
                      : 'border-2 border-border/60 text-text-muted hover:border-primary hover:text-primary',
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-xl border-2 border-border/60 text-sm font-semibold text-text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
