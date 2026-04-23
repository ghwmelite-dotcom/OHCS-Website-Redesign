'use client';

import { useCallback, useEffect, useState } from 'react';
import { listAppeals, resolveAppeal, getApplicationDetail } from '@/lib/recruitment-api';
import type { AdminApplicationListItem, AdminApplicationDetail } from '@/types/recruitment';
import { Loader2 } from 'lucide-react';

export default function AppealsPage() {
  const [items, setItems] = useState<AdminApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<AdminApplicationDetail | null>(null);
  const [resolving, setResolving] = useState(false);
  const [notes, setNotes] = useState('');

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await listAppeals();
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appeals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount
    void refresh();
  }, [refresh]);

  async function openAppeal(id: string) {
    const detail = await getApplicationDetail(id);
    setActive(detail);
    setNotes('');
  }

  async function resolve(outcome: 'upheld' | 'overturned') {
    if (!active || notes.trim().length < 10) return;
    setResolving(true);
    try {
      await resolveAppeal(active.id, { outcome, notes });
      setActive(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve');
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-primary-dark mb-6">Appeals Queue</h1>

      {loading && (
        <div className="flex items-center justify-center py-16 text-text-muted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-sm text-red-800 mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border-2 border-border/40">
          <div className="p-4 border-b border-border/40 font-semibold">
            Pending appeals ({items.length})
          </div>
          <ul>
            {items.map((i) => (
              <li key={i.id}>
                <button
                  onClick={() => void openAppeal(i.id)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-border/40 last:border-b-0"
                >
                  <div className="font-mono text-xs text-primary-dark">{i.id}</div>
                  <div className="text-sm text-text-muted">{i.email}</div>
                </button>
              </li>
            ))}
            {items.length === 0 && !loading && (
              <li className="px-4 py-12 text-center text-text-muted">No pending appeals.</li>
            )}
          </ul>
        </div>

        <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
          {!active ? (
            <p className="text-text-muted">Select an appeal to review.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-primary-dark">{active.id}</h2>
                <p className="text-sm text-text-muted">{active.email}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                  Applicant&apos;s appeal
                </p>
                <p className="text-sm text-primary-dark whitespace-pre-wrap">
                  {active.appeal_reason ?? '(no reason recorded)'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                  Original vetting notes
                </p>
                <p className="text-sm text-primary-dark whitespace-pre-wrap">
                  {active.reviews[0]?.notes ?? '(none)'}
                </p>
              </div>
              <div>
                <label
                  htmlFor="appeal-notes"
                  className="block text-sm font-semibold text-primary-dark mb-1"
                >
                  Decision notes (visible to applicant)
                </label>
                <textarea
                  id="appeal-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => void resolve('overturned')}
                  disabled={resolving || notes.trim().length < 10}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  Overturn (applicant proceeds)
                </button>
                <button
                  onClick={() => void resolve('upheld')}
                  disabled={resolving || notes.trim().length < 10}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  Uphold original decision
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
