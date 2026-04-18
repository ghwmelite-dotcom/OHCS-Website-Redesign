'use client';

import { useState, useId } from 'react';
import { Plus, Search, Edit, Trash2, CheckCircle, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type PubCategory = 'report' | 'policy' | 'form' | 'circular';
type FileType = 'PDF' | 'DOCX' | 'XLSX';
type PubStatus = 'published' | 'draft';

interface PubItem {
  id: string;
  title: string;
  category: PubCategory;
  fileType: FileType;
  date: string;
  status: PubStatus;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<PubCategory, string> = {
  report: 'bg-blue-100 text-blue-800',
  policy: 'bg-amber-100 text-amber-800',
  form: 'bg-rose-100 text-rose-800',
  circular: 'bg-purple-100 text-purple-800',
};

const CATEGORY_LABELS: Record<PubCategory, string> = {
  report: 'Report',
  policy: 'Policy',
  form: 'Form',
  circular: 'Circular',
};

const INITIAL_PUBS: PubItem[] = [
  {
    id: '1',
    title: 'Head of Department Performance Agreement 2024',
    category: 'report',
    fileType: 'PDF',
    date: '15 Jan 2025',
    status: 'published',
  },
  {
    id: '2',
    title: 'Public Service Awards Criteria and Guidelines',
    category: 'policy',
    fileType: 'PDF',
    date: '10 Dec 2024',
    status: 'published',
  },
  {
    id: '3',
    title: 'Right to Information (RTI) Manual for MDAs',
    category: 'policy',
    fileType: 'PDF',
    date: '5 Nov 2024',
    status: 'published',
  },
  {
    id: '4',
    title: 'Code of Conduct for Civil Servants',
    category: 'circular',
    fileType: 'PDF',
    date: '2 Mar 2025',
    status: 'published',
  },
  {
    id: '5',
    title: 'Annual Performance Report 2023/2024',
    category: 'report',
    fileType: 'PDF',
    date: '20 Feb 2025',
    status: 'published',
  },
  {
    id: '6',
    title: 'Training Nomination Template — Q2 2025',
    category: 'form',
    fileType: 'XLSX',
    date: '1 Apr 2025',
    status: 'draft',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Input / Select Styles ───────────────────────────────────────────────────

const inputCls =
  'w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-colors';

// ─── Modal Component ─────────────────────────────────────────────────────────

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
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <h3 id="modal-title" className="text-lg font-bold text-primary-dark">
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
  itemTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirm({ itemTitle, onConfirm, onCancel }: DeleteConfirmProps) {
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
        <h3 className="text-lg font-bold text-primary-dark mb-2">Delete Publication?</h3>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">
          <span className="font-semibold">&ldquo;{itemTitle}&rdquo;</span> will be permanently removed.
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

// ─── Pub Form ─────────────────────────────────────────────────────────────────

interface PubFormData {
  title: string;
  category: PubCategory;
  fileType: FileType;
  status: PubStatus;
}

interface PubFormProps {
  initial: PubFormData;
  onSubmit: (data: PubFormData) => void;
  onCancel: () => void;
  submitLabel: string;
}

function PubForm({ initial, onSubmit, onCancel, submitLabel }: PubFormProps) {
  const [form, setForm] = useState<PubFormData>(initial);
  const titleId = useId();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor={titleId} className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id={titleId}
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Enter publication title"
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
            Category
          </label>
          <div className="relative">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as PubCategory }))}
              className={cn(inputCls, 'appearance-none pr-10')}
            >
              <option value="report">Report</option>
              <option value="policy">Policy</option>
              <option value="form">Form</option>
              <option value="circular">Circular</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/60" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
            File Type
          </label>
          <div className="relative">
            <select
              value={form.fileType}
              onChange={(e) => setForm((f) => ({ ...f, fileType: e.target.value as FileType }))}
              className={cn(inputCls, 'appearance-none pr-10')}
            >
              <option value="PDF">PDF</option>
              <option value="DOCX">DOCX</option>
              <option value="XLSX">XLSX</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/60" />
          </div>
        </div>
      </div>

      <div>
        <span className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
          Status
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={form.status === 'published'}
            onClick={() =>
              setForm((f) => ({ ...f, status: f.status === 'published' ? 'draft' : 'published' }))
            }
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20',
              form.status === 'published' ? 'bg-green-500' : 'bg-gray-300',
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                form.status === 'published' ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
          <span className="text-sm font-medium text-text-muted capitalize">{form.status}</span>
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
  | { type: 'edit'; item: PubItem }
  | { type: 'delete'; item: PubItem };

export default function AdminPublicationsPage() {
  const [pubs, setPubs] = useState<PubItem[]>(INITIAL_PUBS);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PubCategory | 'all'>('all');
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  function handleCreate(data: PubFormData) {
    const newItem: PubItem = {
      id: generateId(),
      ...data,
      date: todayLabel(),
    };
    setPubs((prev) => [newItem, ...prev]);
    setModal({ type: 'none' });
    showSuccess('Publication added successfully.');
  }

  function handleEdit(data: PubFormData) {
    if (modal.type !== 'edit') return;
    setPubs((prev) =>
      prev.map((p) => (p.id === modal.item.id ? { ...p, ...data } : p)),
    );
    setModal({ type: 'none' });
    showSuccess('Publication updated successfully.');
  }

  function handleDelete() {
    if (modal.type !== 'delete') return;
    setPubs((prev) => prev.filter((p) => p.id !== modal.item.id));
    setModal({ type: 'none' });
    showSuccess('Publication deleted.');
  }

  function toggleStatus(id: string) {
    setPubs((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === 'published' ? 'draft' : 'published' }
          : p,
      ),
    );
  }

  const filtered = pubs.filter((p) => {
    const matchesQuery = p.title.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesQuery && matchesCategory;
  });

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
          <h2 className="text-2xl font-bold text-primary-dark">Publications</h2>
          <p className="text-sm text-text-muted mt-1">
            Manage reports, policies, forms, and circulars available for download.
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Upload Document
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search publications..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-colors"
          />
        </div>

        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as PubCategory | 'all')}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-colors font-medium text-text-muted"
          >
            <option value="all">All Categories</option>
            <option value="report">Reports</option>
            <option value="policy">Policies</option>
            <option value="form">Forms</option>
            <option value="circular">Circulars</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/60" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border-2 border-border/40 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-border/40">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                File Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                Status
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
                  No publications found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-primary-dark max-w-xs truncate">
                    {row.title}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                        CATEGORY_COLORS[row.category],
                      )}
                    >
                      {CATEGORY_LABELS[row.category]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-gray-100 text-gray-700">
                      {row.fileType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted">{row.date}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(row.id)}
                      aria-label={`Toggle status — currently ${row.status}`}
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-opacity hover:opacity-75',
                        row.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600',
                      )}
                    >
                      {row.status === 'published' ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setModal({ type: 'edit', item: row })}
                        aria-label={`Edit ${row.title}`}
                        className="p-2 rounded-lg hover:bg-primary/5 text-text-muted hover:text-primary transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setModal({ type: 'delete', item: row })}
                        aria-label={`Delete ${row.title}`}
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

      {/* Modals */}
      {modal.type === 'create' && (
        <Modal title="Upload Document" onClose={() => setModal({ type: 'none' })}>
          <PubForm
            initial={{ title: '', category: 'report', fileType: 'PDF', status: 'draft' }}
            onSubmit={handleCreate}
            onCancel={() => setModal({ type: 'none' })}
            submitLabel="Upload"
          />
        </Modal>
      )}

      {modal.type === 'edit' && (
        <Modal title="Edit Publication" onClose={() => setModal({ type: 'none' })}>
          <PubForm
            initial={{
              title: modal.item.title,
              category: modal.item.category,
              fileType: modal.item.fileType,
              status: modal.item.status,
            }}
            onSubmit={handleEdit}
            onCancel={() => setModal({ type: 'none' })}
            submitLabel="Save Changes"
          />
        </Modal>
      )}

      {modal.type === 'delete' && (
        <DeleteConfirm
          itemTitle={modal.item.title}
          onConfirm={handleDelete}
          onCancel={() => setModal({ type: 'none' })}
        />
      )}
    </div>
  );
}
