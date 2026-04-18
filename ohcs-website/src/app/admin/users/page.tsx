'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, CheckCircle, X, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminRole } from '@/types';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/admin-auth';

interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin: string;
}

const ALL_ROLES: AdminRole[] = ['super_admin', 'content_manager', 'recruitment_admin', 'viewer'];

const INITIAL_USERS: AdminUserItem[] = [
  {
    id: 'u-001',
    name: 'System Administrator',
    email: 'admin@ohcs.gov.gh',
    role: 'super_admin',
    isActive: true,
    lastLogin: '2 hours ago',
  },
  {
    id: 'u-002',
    name: 'Content Manager',
    email: 'content@ohcs.gov.gh',
    role: 'content_manager',
    isActive: true,
    lastLogin: '1 day ago',
  },
  {
    id: 'u-003',
    name: 'Recruitment Officer',
    email: 'recruitment@ohcs.gov.gh',
    role: 'recruitment_admin',
    isActive: true,
    lastLogin: '3 days ago',
  },
  {
    id: 'u-004',
    name: 'Senior Reviewer',
    email: 'viewer@ohcs.gov.gh',
    role: 'viewer',
    isActive: true,
    lastLogin: '1 week ago',
  },
];

// The currently logged-in demo user (matches demo-001 in admin-auth)
const CURRENT_USER_ID = 'u-001';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>(INITIAL_USERS);
  const [query, setQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createRole, setCreateRole] = useState<AdminRole>('viewer');
  const [createPassword, setCreatePassword] = useState('');
  const [createError, setCreateError] = useState('');

  // Edit modal state
  const [editUser, setEditUser] = useState<AdminUserItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<AdminRole>('viewer');
  const [editActive, setEditActive] = useState(true);

  // Delete confirm state
  const [deleteUser, setDeleteUser] = useState<AdminUserItem | null>(null);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()),
  );

  // ── Create user ────────────────────────────────────────────────────────────
  function openCreate() {
    setCreateName('');
    setCreateEmail('');
    setCreateRole('viewer');
    setCreatePassword('');
    setCreateError('');
    setShowCreate(true);
  }

  function submitCreate() {
    setCreateError('');
    if (!createName.trim()) {
      setCreateError('Name is required.');
      return;
    }
    if (!createEmail.trim()) {
      setCreateError('Email is required.');
      return;
    }
    if (!createEmail.toLowerCase().endsWith('@ohcs.gov.gh')) {
      setCreateError('Email must end with @ohcs.gov.gh.');
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === createEmail.toLowerCase())) {
      setCreateError('A user with this email already exists.');
      return;
    }
    if (createPassword.length < 8) {
      setCreateError('Password must be at least 8 characters.');
      return;
    }

    const newUser: AdminUserItem = {
      id: `u-${Date.now()}`,
      name: createName.trim(),
      email: createEmail.trim().toLowerCase(),
      role: createRole,
      isActive: true,
      lastLogin: 'Never',
    };
    setUsers((prev) => [...prev, newUser]);
    setShowCreate(false);
    setSuccessMsg(`User "${newUser.name}" created successfully.`);
  }

  // ── Edit user ──────────────────────────────────────────────────────────────
  function openEdit(user: AdminUserItem) {
    setEditUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditActive(user.isActive);
  }

  function submitEdit() {
    if (!editUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === editUser.id
          ? { ...u, name: editName.trim() || u.name, role: editRole, isActive: editActive }
          : u,
      ),
    );
    setEditUser(null);
    setSuccessMsg('User updated successfully.');
  }

  // ── Toggle active ──────────────────────────────────────────────────────────
  function toggleActive(id: string) {
    if (id === CURRENT_USER_ID) return; // cannot deactivate self
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u)),
    );
    const user = users.find((u) => u.id === id);
    if (user) {
      setSuccessMsg(
        `${user.name} is now ${user.isActive ? 'inactive' : 'active'}.`,
      );
    }
  }

  // ── Delete user ────────────────────────────────────────────────────────────
  function confirmDelete() {
    if (!deleteUser) return;
    setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
    setSuccessMsg(`User "${deleteUser.name}" deleted.`);
    setDeleteUser(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark">Admin Users</h2>
          <p className="text-sm text-text-muted mt-1">
            Manage admin portal access. Only Super Admins can perform these actions.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add User
        </button>
      </div>

      {/* Success feedback */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium text-green-800">{successMsg}</p>
        </div>
      )}

      {/* Email policy notice */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-6">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-blue-800">
          All users must have{' '}
          <span className="font-mono font-semibold">@ohcs.gov.gh</span> email addresses.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Search by name or email..."
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
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">
                Actions
              </th>
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
                  <td className="px-6 py-4 text-sm font-medium text-primary-dark">
                    {row.name}
                    {row.id === CURRENT_USER_ID && (
                      <span className="ml-2 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </td>
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
                    <button
                      onClick={() => toggleActive(row.id)}
                      disabled={row.id === CURRENT_USER_ID}
                      title={
                        row.id === CURRENT_USER_ID
                          ? 'Cannot change your own status'
                          : 'Click to toggle active status'
                      }
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-opacity',
                        row.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600',
                        row.id !== CURRENT_USER_ID && 'cursor-pointer hover:opacity-75',
                        row.id === CURRENT_USER_ID && 'cursor-default',
                      )}
                    >
                      {row.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted whitespace-nowrap">
                    {row.lastLogin}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        aria-label={`Edit ${row.name}`}
                        onClick={() => openEdit(row)}
                        className="p-2 rounded-lg hover:bg-primary/5 text-text-muted hover:text-primary transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`Delete ${row.name}`}
                        onClick={() => {
                          if (row.id !== CURRENT_USER_ID) setDeleteUser(row);
                        }}
                        disabled={row.id === CURRENT_USER_ID}
                        title={
                          row.id === CURRENT_USER_ID ? 'Cannot delete your own account' : undefined
                        }
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          row.id === CURRENT_USER_ID
                            ? 'text-text-muted/30 cursor-not-allowed'
                            : 'hover:bg-red-50 text-text-muted hover:text-red-600 cursor-pointer',
                        )}
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

      {/* ── Create User Modal ──────────────────────────────────────────────── */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Create new admin user"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreate(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary-dark">Create Admin User</h3>
              <button
                onClick={() => setShowCreate(false)}
                aria-label="Close modal"
                className="p-2 rounded-lg hover:bg-gray-100 text-text-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createError && (
              <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-5">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" aria-hidden="true" />
                <p className="text-sm font-medium text-red-800">{createError}</p>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="c-name" className="block text-sm font-semibold text-primary-dark mb-2">
                  Full Name
                </label>
                <input
                  id="c-name"
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Kwame Mensah"
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="c-email" className="block text-sm font-semibold text-primary-dark mb-2">
                  Email Address
                </label>
                <input
                  id="c-email"
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="name@ohcs.gov.gh"
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
                />
                <p className="text-xs text-text-muted mt-1.5">
                  Must be an <span className="font-mono font-semibold">@ohcs.gov.gh</span> address.
                </p>
              </div>
              <div>
                <label htmlFor="c-role" className="block text-sm font-semibold text-primary-dark mb-2">
                  Role
                </label>
                <select
                  id="c-role"
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as AdminRole)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 text-sm focus:border-primary focus:outline-none bg-white"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="c-password" className="block text-sm font-semibold text-primary-dark mb-2">
                  Temporary Password
                </label>
                <input
                  id="c-password"
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={submitCreate}
                className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
              >
                Create User
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-5 py-2.5 border-2 border-border/60 text-sm font-semibold text-text-muted rounded-xl hover:border-primary hover:text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ────────────────────────────────────────────────── */}
      {editUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Edit admin user"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditUser(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary-dark">Edit User</h3>
              <button
                onClick={() => setEditUser(null)}
                aria-label="Close modal"
                className="p-2 rounded-lg hover:bg-gray-100 text-text-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm font-mono text-text-muted mb-6 bg-gray-50 px-3 py-2 rounded-lg">
              {editUser.email}
            </p>

            <div className="space-y-5">
              <div>
                <label htmlFor="e-name" className="block text-sm font-semibold text-primary-dark mb-2">
                  Full Name
                </label>
                <input
                  id="e-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="e-role" className="block text-sm font-semibold text-primary-dark mb-2">
                  Role
                </label>
                <select
                  id="e-role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as AdminRole)}
                  disabled={editUser.id === CURRENT_USER_ID}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 text-sm focus:border-primary focus:outline-none bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                {editUser.id === CURRENT_USER_ID && (
                  <p className="text-xs text-text-muted mt-1.5">
                    You cannot change your own role.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  role="switch"
                  aria-checked={editActive}
                  onClick={() => {
                    if (editUser.id !== CURRENT_USER_ID) setEditActive((v) => !v);
                  }}
                  disabled={editUser.id === CURRENT_USER_ID}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40',
                    editActive ? 'bg-primary' : 'bg-gray-300',
                    editUser.id === CURRENT_USER_ID && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
                      editActive ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
                <span className="text-sm font-medium text-primary-dark">
                  {editActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={submitEdit}
                className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditUser(null)}
                className="px-5 py-2.5 border-2 border-border/60 text-sm font-semibold text-text-muted rounded-xl hover:border-primary hover:text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ───────────────────────────────────────────── */}
      {deleteUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-label="Confirm user deletion"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-dark">Delete User</h3>
                <p className="text-sm text-text-muted mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-text-muted mb-6 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-primary-dark">{deleteUser.name}</span> (
              <span className="font-mono">{deleteUser.email}</span>)? This will immediately revoke
              their access to the admin portal.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={confirmDelete}
                className="px-6 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete User
              </button>
              <button
                onClick={() => setDeleteUser(null)}
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
