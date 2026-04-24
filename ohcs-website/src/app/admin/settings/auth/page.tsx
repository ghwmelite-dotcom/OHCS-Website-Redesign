'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function AuthModePage() {
  const [demoOn, setDemoOn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/site-config');
      if (!res.ok) throw new Error('Failed to load config');
      const body = (await res.json()) as { data: { key: string; value: string }[] };
      const row = body.data.find((c) => c.key === 'admin_demo_mode_enabled');
      setDemoOn(row?.value === 'true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle() {
    if (demoOn === null) return;
    const next = !demoOn;
    if (
      !next &&
      !confirm(
        'Disabling demo mode will sign out anyone using demo credentials and require all admins to use magic-link sign-in. Continue?',
      )
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/site-config/admin_demo_mode_enabled', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ value: next ? 'true' : 'false' }),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      setDemoOn(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-primary-dark mb-1">Auth Mode</h1>
      <p className="text-sm text-text-muted mb-6">
        Controls whether the demo email+password login is accepted alongside magic-link sign-in.
      </p>

      {loading && (
        <div className="flex items-center justify-center py-12 text-text-muted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-sm text-red-800 mb-4">
          {error}
        </div>
      )}

      {!loading && demoOn !== null && (
        <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-primary-dark">Demo Mode</h2>
              <p className="text-sm text-text-muted mt-1">
                When ON, the four hardcoded demo accounts (
                <code className="text-xs">admin@ohcs.gov.gh</code> etc.) can sign in. When OFF,
                only emails in the Admin Users allowlist can sign in via magic link.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void toggle()}
              disabled={saving}
              role="switch"
              aria-checked={demoOn}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                demoOn ? 'bg-primary' : 'bg-gray-300'
              } disabled:opacity-50`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                  demoOn ? 'translate-x-6' : 'translate-x-0.5'
                } translate-y-0.5`}
              />
            </button>
          </div>

          {demoOn && (
            <div className="mt-4 rounded-lg border-2 border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Demo mode allows anyone with knowledge of the demo passwords to sign in. Disable
                before going live to citizens.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
