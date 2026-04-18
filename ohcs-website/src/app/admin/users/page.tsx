'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, Edit, Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminRole } from '@/types';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/admin-auth';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin: string;
}

const SAMPLE_USERS: UserRow[] = [
  { id: 'u-001', name: 'System Administrator', email: 'admin@ohcs.gov.gh', role: 'super_admin', isActive: true, lastLogin: '17 Apr 2025, 09:14' },
  { id: 'u-002', name: 'Akosua Mensah', email: 'a.mensah@ohcs.gov.gh', role: 'content_manager', isActive: true, lastLogin: '16 Apr 2025, 14:32' },
  { id: 'u-003', name: 'Kwame Boateng', email: 'k.boateng@ohcs.gov.gh', role: 'recruitment_admin', isActive: true, lastLogin: '15 Apr 2025, 10:05' },
  { id: 'u-004', name: 'Abena Asante', email: 'a.asante@ohcs.gov.gh', role: 'viewer', isActive: false, lastLogin: '2 Mar 2025, 08:47' },
];

export default function AdminUsersPage() {
  const [query, setQuery] = useState('');

  const filtered = SAMPLE_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark">Admin Users</h2>
          <p className="text-sm text-text-muted mt-1">Manage admin portal access. Only Super Admins can perform these actions.</p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add User
        </Link>
      </div>

      {/* Email policy notice */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-6">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-blue-900">Email Policy</p>
          <p className="text-sm text-blue-700 mt-0.5">
            All admin accounts must use an official <span className="font-mono font-semibold">@ohcs.gov.gh</span> email address.
            External addresses are not permitted for admin access.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search users..."
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
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Last Login</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-text-muted">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-primary-dark">{row.name}</td>
                  <td className="px-6 py-4 text-sm font-mono text-text-muted">{row.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                        ROLE_COLORS[row.role],
                      )}
                    >
                      {ROLE_LABELS[row.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                        row.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600',
                      )}
                    >
                      {row.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted whitespace-nowrap">{row.lastLogin}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        aria-label={`View ${row.name}`}
                        className="p-2 rounded-lg hover:bg-primary/5 text-text-muted hover:text-primary transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`Edit ${row.name}`}
                        className="p-2 rounded-lg hover:bg-primary/5 text-text-muted hover:text-primary transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`Delete ${row.name}`}
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
