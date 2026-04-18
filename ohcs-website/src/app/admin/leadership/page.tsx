'use client';

import { useState, useId } from 'react';
import { Plus, Edit, Trash2, Star, CheckCircle, X, ChevronUp, ChevronDown as ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { audit } from '@/lib/audit-logger';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderItem {
  id: string;
  name: string;
  title: string;
  bio: string;
  isFeatured: boolean;
  order: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-primary/10 text-primary',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
];

const INITIAL_LEADERS: LeaderItem[] = [
  {
    id: '1',
    name: 'Evans Aggrey-Darkoh',
    title: 'Head of Civil Service',
    bio: 'Evans Aggrey-Darkoh serves as the Head of the Office of the Head of Civil Service (OHCS), providing strategic leadership and oversight across all Civil Service institutions in Ghana.',
    isFeatured: true,
    order: 1,
  },
  {
    id: '2',
    name: 'Sylvanus Kofi Adzornu',
    title: 'Chief Director',
    bio: 'Sylvanus Kofi Adzornu is the Chief Director of the Office of the Head of Civil Service, responsible for coordinating the administrative and operational functions of the OHCS.',
    isFeatured: false,
    order: 2,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => (w[0] ?? '').toUpperCase())
    .join('');
}

// ─── Input style ─────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-colors';

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leader-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 sticky top-0 bg-white z-10">
          <h3 id="leader-modal-title" className="text-lg font-bold text-primary-dark">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Delete Confirmation ──────────────────────────────────────────────────────

interface DeleteConfirmProps {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirm({ name, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="alertdialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-primary-dark mb-2">Delete Profile?</h3>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">
          <span className="font-semibold">&ldquo;{name}&rdquo;</span> will be permanently removed from the leadership page.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-border/60 text-sm font-semibold text-text-muted hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Leader Form ──────────────────────────────────────────────────────────────

interface LeaderFormData {
  name: string;
  title: string;
  bio: string;
  isFeatured: boolean;
  order: number;
}

interface LeaderFormProps {
  initial: LeaderFormData;
  onSubmit: (data: LeaderFormData) => void;
  onCancel: () => void;
  submitLabel: string;
}

function LeaderForm({ initial, onSubmit, onCancel, submitLabel }: LeaderFormProps) {
  const [form, setForm] = useState<LeaderFormData>(initial);
  const nameId = useId();
  const titleId = useId();
  const bioId = useId();
  const orderId = useId();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.title.trim()) return;
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor={nameId} className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id={nameId}
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Evans Aggrey-Darkoh"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor={titleId} className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
          Job Title <span className="text-red-500">*</span>
        </label>
        <input
          id={titleId}
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Head of Civil Service"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor={bioId} className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
          Biography
        </label>
        <textarea
          id={bioId}
          rows={4}
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          placeholder="Short biography for the About page..."
          className={cn(inputCls, 'resize-none')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={orderId} className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
            Display Order
          </label>
          <input
            id={orderId}
            type="number"
            min={1}
            value={form.order}
            onChange={(e) => setForm((f) => ({ ...f, order: Math.max(1, Number(e.target.value)) }))}
            className={inputCls}
          />
        </div>

        <div>
          <span className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
            Featured
          </span>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              role="switch"
              aria-checked={form.isFeatured}
              onClick={() => setForm((f) => ({ ...f, isFeatured: !f.isFeatured }))}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20',
                form.isFeatured ? 'bg-amber-400' : 'bg-gray-300',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  form.isFeatured ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
            <span className="text-sm font-medium text-text-muted">
              {form.isFeatured ? 'Featured' : 'Standard'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl border-2 border-border/60 text-sm font-semibold text-text-muted hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; item: LeaderItem }
  | { type: 'delete'; item: LeaderItem };

export default function AdminLeadershipPage() {
  const [leaders, setLeaders] = useState<LeaderItem[]>(INITIAL_LEADERS);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  // Sort by order ascending for display
  const sorted = [...leaders].sort((a, b) => a.order - b.order);

  function handleCreate(data: LeaderFormData) {
    const newItem: LeaderItem = { id: generateId(), ...data };
    setLeaders((prev) => [...prev, newItem]);
    audit('create', 'leadership', newItem.id, newItem.name, 'Created leadership profile');
    setModal({ type: 'none' });
    showSuccess('Leadership profile added successfully.');
  }

  function handleEdit(data: LeaderFormData) {
    if (modal.type !== 'edit') return;
    setLeaders((prev) =>
      prev.map((l) => (l.id === modal.item.id ? { ...l, ...data } : l)),
    );
    audit('update', 'leadership', modal.item.id, data.name, 'Updated leadership profile');
    setModal({ type: 'none' });
    showSuccess('Profile updated successfully.');
  }

  function handleDelete() {
    if (modal.type !== 'delete') return;
    audit('delete', 'leadership', modal.item.id, modal.item.name, 'Deleted leadership profile');
    setLeaders((prev) => prev.filter((l) => l.id !== modal.item.id));
    setModal({ type: 'none' });
    showSuccess('Profile deleted.');
  }

  function toggleFeatured(id: string) {
    setLeaders((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isFeatured: !l.isFeatured } : l)),
    );
  }

  function moveUp(id: string) {
    const sortedList = [...leaders].sort((a, b) => a.order - b.order);
    const idx = sortedList.findIndex((l) => l.id === id);
    if (idx <= 0) return;
    const above = sortedList[idx - 1] as LeaderItem;
    const current = sortedList[idx] as LeaderItem;
    setLeaders((prev) =>
      prev.map((l) => {
        if (l.id === current.id) return { ...l, order: above.order };
        if (l.id === above.id) return { ...l, order: current.order };
        return l;
      }),
    );
  }

  function moveDown(id: string) {
    const sortedList = [...leaders].sort((a, b) => a.order - b.order);
    const idx = sortedList.findIndex((l) => l.id === id);
    if (idx < 0 || idx >= sortedList.length - 1) return;
    const below = sortedList[idx + 1] as LeaderItem;
    const current = sortedList[idx] as LeaderItem;
    setLeaders((prev) =>
      prev.map((l) => {
        if (l.id === current.id) return { ...l, order: below.order };
        if (l.id === below.id) return { ...l, order: current.order };
        return l;
      }),
    );
  }

  const nextOrder = leaders.length > 0 ? Math.max(...leaders.map((l) => l.order)) + 1 : 1;

  return (
    <div>
      {/* Success banner */}
      {successMsg && (
        <div
          role="status"
          className="flex items-center gap-2.5 mb-6 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium"
        >
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark">Leadership Profiles</h2>
          <p className="text-sm text-text-muted mt-1">
            Manage leadership profiles displayed on the About page.
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Profile
        </button>
      </div>

      {/* Cards grid */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-border/40 p-12 text-center">
          <p className="text-sm text-text-muted">No profiles yet. Add the first one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((leader, idx) => (
            <div
              key={leader.id}
              className="bg-white rounded-2xl border-2 border-border/40 p-6 hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group flex flex-col"
            >
              {/* Top row: avatar + featured badge */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0',
                    AVATAR_COLORS[idx % AVATAR_COLORS.length],
                  )}
                  aria-hidden="true"
                >
                  {getInitials(leader.name)}
                </div>

                <div className="flex items-center gap-1.5">
                  {leader.isFeatured && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                      <Star className="h-3 w-3" aria-hidden="true" />
                      Featured
                    </span>
                  )}
                  <span className="text-xs font-medium text-text-muted/50 bg-gray-50 px-2 py-1 rounded-lg">
                    #{leader.order}
                  </span>
                </div>
              </div>

              {/* Name + title */}
              <h3 className="font-semibold text-primary-dark leading-snug mb-1">{leader.name}</h3>
              <p className="text-sm text-text-muted mb-3 leading-snug">{leader.title}</p>

              {/* Bio preview */}
              {leader.bio && (
                <p className="text-xs text-text-muted/70 leading-relaxed line-clamp-2 mb-4 flex-1">
                  {leader.bio}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border/30 mt-auto">
                {/* Reorder */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => moveUp(leader.id)}
                    aria-label={`Move ${leader.name} up`}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted/50 hover:text-text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveDown(leader.id)}
                    aria-label={`Move ${leader.name} down`}
                    disabled={idx === sorted.length - 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted/50 hover:text-text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Right buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleFeatured(leader.id)}
                    aria-label={leader.isFeatured ? `Unfeature ${leader.name}` : `Feature ${leader.name}`}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      leader.isFeatured
                        ? 'text-amber-500 hover:bg-amber-50 hover:text-amber-600'
                        : 'text-text-muted/50 hover:bg-amber-50 hover:text-amber-500',
                    )}
                  >
                    <Star className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setModal({ type: 'edit', item: leader })}
                    aria-label={`Edit ${leader.name}`}
                    className="p-2 rounded-lg hover:bg-primary/5 text-text-muted hover:text-primary transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setModal({ type: 'delete', item: leader })}
                    aria-label={`Delete ${leader.name}`}
                    className="p-2 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modal.type === 'create' && (
        <Modal title="Add Leadership Profile" onClose={() => setModal({ type: 'none' })}>
          <LeaderForm
            initial={{ name: '', title: '', bio: '', isFeatured: false, order: nextOrder }}
            onSubmit={handleCreate}
            onCancel={() => setModal({ type: 'none' })}
            submitLabel="Add Profile"
          />
        </Modal>
      )}

      {modal.type === 'edit' && (
        <Modal title="Edit Profile" onClose={() => setModal({ type: 'none' })}>
          <LeaderForm
            initial={{
              name: modal.item.name,
              title: modal.item.title,
              bio: modal.item.bio,
              isFeatured: modal.item.isFeatured,
              order: modal.item.order,
            }}
            onSubmit={handleEdit}
            onCancel={() => setModal({ type: 'none' })}
            submitLabel="Save Changes"
          />
        </Modal>
      )}

      {modal.type === 'delete' && (
        <DeleteConfirm
          name={modal.item.name}
          onConfirm={handleDelete}
          onCancel={() => setModal({ type: 'none' })}
        />
      )}
    </div>
  );
}
