'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { AdminUsersTable, type AdminUserRow } from '@/components/admin/admin-users-table';

export default function AdminUsersPage() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add modal state
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('recruitment_admin');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const body = (await res.json()) as { data: AdminUserRow[] };
      setRows(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setAddError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          role,
          ...(name ? { display_name: name } : {}),
        }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(b.error ?? `Failed (${res.status})`);
      }
      setOpen(false);
      setEmail('');
      setName('');
      setRole('recruitment_admin');
      await refresh();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add admin');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">Admin Users</h1>
          <p className="text-sm text-text-muted mt-1">
            Anyone in this list can sign in via magic link. Adding an admin sends them a welcome
            link immediately.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Plus className="h-4 w-4" /> Add Admin
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-text-muted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      {error && !loading && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-sm text-red-800 mb-4">
          {error}{' '}
          <button onClick={() => void refresh()} className="underline font-semibold">
            Retry
          </button>
        </div>
      )}
      {!loading && !error && <AdminUsersTable rows={rows} onChange={refresh} />}

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-primary-dark mb-4">Add Admin</h2>
            <form onSubmit={onAdd} className="space-y-4">
              <div>
                <label htmlFor="add-email" className="block text-sm font-semibold mb-1">
                  Email
                </label>
                <input
                  id="add-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                />
              </div>
              <div>
                <label htmlFor="add-role" className="block text-sm font-semibold mb-1">
                  Role
                </label>
                <select
                  id="add-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="recruitment_admin">Recruitment Admin</option>
                  <option value="content_manager">Content Manager</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label htmlFor="add-name" className="block text-sm font-semibold mb-1">
                  Display name (optional)
                </label>
                <input
                  id="add-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                />
              </div>
              {addError && <p className="text-sm text-red-700">{addError}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border-2 border-border/60 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !email}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light disabled:opacity-50"
                >
                  {submitting ? 'Adding…' : 'Add + send link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
