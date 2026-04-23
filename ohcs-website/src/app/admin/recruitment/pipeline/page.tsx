'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { listApplications, claimApplication } from '@/lib/recruitment-api';
import type { AdminApplicationListItem } from '@/types/recruitment';
import { AlertTriangle, CheckCircle2, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusBadgeClasses, getStatusLabel } from '@/lib/application-status';

const STATUS_FILTERS = [
  { key: 'submitted', label: 'New' },
  { key: 'under_review', label: 'In Review' },
  { key: 'requires_action', label: 'Awaiting Resubmit' },
  { key: 'vetting_passed', label: 'Passed' },
  { key: 'vetting_failed', label: 'Failed' },
  { key: 'all', label: 'All' },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]['key'];

export default function PipelinePage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('submitted');
  const [search, setSearch] = useState('');

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await listApplications({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search.trim() || undefined,
      });
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount + filter change
    void refresh();
  }, [refresh]);

  async function takeNext() {
    const target = items.find((i) => i.status === 'submitted' && !i.review_claimed_by);
    if (!target) return;
    try {
      await claimApplication(target.id);
      router.push(`/admin/recruitment/pipeline/detail/?id=${encodeURIComponent(target.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim');
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary-dark">Application Pipeline</h1>
        <button
          onClick={() => void takeNext()}
          disabled={items.every((i) => i.status !== 'submitted' || !!i.review_claimed_by)}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light disabled:opacity-50"
        >
          Take next
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap',
              statusFilter === f.key
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-text-muted hover:bg-gray-200',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Reference or email…"
          className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-text-muted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      {error && !loading && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-sm text-red-800">
          {error}{' '}
          <button onClick={() => void refresh()} className="underline font-semibold">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border-2 border-border/40 overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-text-muted">Reference</th>
                  <th className="px-4 py-3 font-semibold text-text-muted">Email</th>
                  <th className="px-4 py-3 font-semibold text-text-muted">Status</th>
                  <th className="px-4 py-3 font-semibold text-text-muted">Docs</th>
                  <th className="px-4 py-3 font-semibold text-text-muted">AI</th>
                  <th className="px-4 py-3 font-semibold text-text-muted">Claimed</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-border/40 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link
                        href={`/admin/recruitment/pipeline/detail/?id=${encodeURIComponent(it.id)}`}
                        className="text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded"
                      >
                        {it.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{it.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'px-2 py-1 rounded text-xs font-semibold border',
                          getStatusBadgeClasses(it.status),
                        )}
                      >
                        {getStatusLabel(it.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {it.doc_count} / {it.doc_required_count} required
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {it.ai_flag_count > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-700">
                          <AlertTriangle className="h-3.5 w-3.5" /> {it.ai_flag_count}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> clean
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {it.review_claimed_by ?? '—'}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                      No applications match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {items.map((it) => (
              <Link
                key={it.id}
                href={`/admin/recruitment/pipeline/detail/?id=${encodeURIComponent(it.id)}`}
                className="block bg-white rounded-2xl border-2 border-border/40 p-4 hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="font-mono text-xs text-primary">{it.id}</span>
                  <span
                    className={cn(
                      'px-2 py-1 rounded text-xs font-semibold border',
                      getStatusBadgeClasses(it.status),
                    )}
                  >
                    {getStatusLabel(it.status)}
                  </span>
                </div>
                <div className="text-sm text-text-muted truncate mb-2">{it.email}</div>
                <div className="flex items-center justify-between text-xs">
                  <span>
                    {it.doc_count} / {it.doc_required_count} docs
                  </span>
                  {it.ai_flag_count > 0 ? (
                    <span className="inline-flex items-center gap-1 text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" /> {it.ai_flag_count} flagged
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> AI clean
                    </span>
                  )}
                </div>
                {it.review_claimed_by && (
                  <div className="text-xs text-text-muted mt-2">
                    Claimed by {it.review_claimed_by}
                  </div>
                )}
              </Link>
            ))}
            {items.length === 0 && (
              <div className="bg-white rounded-2xl border-2 border-border/40 p-12 text-center text-text-muted">
                No applications match these filters.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
