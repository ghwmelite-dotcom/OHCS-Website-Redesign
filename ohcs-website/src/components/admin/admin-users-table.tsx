'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLES = ['super_admin', 'recruitment_admin', 'content_manager', 'viewer'] as const;
type Role = (typeof ROLES)[number];

const ROLE_LABEL: Record<Role, string> = {
  super_admin: 'Super Admin',
  recruitment_admin: 'Recruitment Admin',
  content_manager: 'Content Manager',
  viewer: 'Viewer',
};

export interface AdminUserRow {
  email: string;
  role: Role;
  display_name: string | null;
  is_active: number;
  created_at: number;
  last_login_at: number | null;
}

export function AdminUsersTable({
  rows,
  onChange,
}: {
  rows: AdminUserRow[];
  onChange: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function changeRole(email: string, role: Role) {
    setBusy(email);
    try {
      await fetch(`/api/admin/users/${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      await onChange();
    } finally {
      setBusy(null);
    }
  }

  async function deactivate(email: string) {
    if (!confirm(`Deactivate ${email}? They will be signed out immediately.`)) return;
    setBusy(email);
    try {
      await fetch(`/api/admin/users/${encodeURIComponent(email)}`, { method: 'DELETE' });
      await onChange();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-border/40 overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-4 py-3 font-semibold text-text-muted">Email</th>
            <th className="px-4 py-3 font-semibold text-text-muted">Name</th>
            <th className="px-4 py-3 font-semibold text-text-muted">Role</th>
            <th className="px-4 py-3 font-semibold text-text-muted">Status</th>
            <th className="px-4 py-3 font-semibold text-text-muted">Last sign-in</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.email} className="border-t border-border/40">
              <td className="px-4 py-3 font-mono text-xs">{r.email}</td>
              <td className="px-4 py-3">{r.display_name ?? '—'}</td>
              <td className="px-4 py-3">
                <select
                  value={r.role}
                  onChange={(e) => void changeRole(r.email, e.target.value as Role)}
                  disabled={busy === r.email || r.is_active === 0}
                  className="rounded border-2 border-border/60 px-2 py-1 text-sm bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABEL[role]}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'px-2 py-1 rounded text-xs font-semibold',
                    r.is_active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-600',
                  )}
                >
                  {r.is_active ? 'Active' : 'Deactivated'}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-text-muted">
                {r.last_login_at ? new Date(r.last_login_at).toLocaleString() : 'Never'}
              </td>
              <td className="px-4 py-3 text-right">
                {r.is_active === 1 && (
                  <button
                    type="button"
                    onClick={() => void deactivate(r.email)}
                    disabled={busy === r.email}
                    aria-label={`Deactivate ${r.email}`}
                    className="text-red-700 hover:text-red-900 inline-flex items-center gap-1 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded p-1"
                  >
                    {busy === r.email ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Deactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                No admins yet. Click &ldquo;Add Admin&rdquo; above to add the first one.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
