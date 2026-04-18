'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Trash2, CheckCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: 'published' | 'draft';
  publishedAt: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const INITIAL_NEWS: NewsItem[] = [
  {
    id: '1',
    title: "Nigeria's Federal Civil Service Pays Courtesy Call",
    slug: "nigerias-federal-civil-service-pays-courtesy-call",
    excerpt: "A high-level delegation from Nigeria's Federal Civil Service Commission visited OHCS headquarters to strengthen bilateral cooperation.",
    status: 'published',
    publishedAt: '15 Apr 2026',
  },
  {
    id: '2',
    title: 'OHCS Launches 2026 Training Programme',
    slug: 'ohcs-launches-2026-training-programme',
    excerpt: 'The Office of the Head of Civil Service has officially launched its comprehensive training and capacity building programme for 2026.',
    status: 'published',
    publishedAt: '10 Apr 2026',
  },
  {
    id: '3',
    title: 'Head of Civil Service Addresses Staff on Reforms',
    slug: 'head-of-civil-service-addresses-staff-on-reforms',
    excerpt: 'The Head of Civil Service delivered a keynote address outlining key reform agenda items and performance improvement plans.',
    status: 'published',
    publishedAt: '5 Apr 2026',
  },
  {
    id: '4',
    title: 'Civil Service Week 2026 Preparations Underway',
    slug: 'civil-service-week-2026-preparations-underway',
    excerpt: 'Committees have been constituted and preparations are in full swing for the annual Civil Service Week celebrations.',
    status: 'draft',
    publishedAt: '1 Apr 2026',
  },
  {
    id: '5',
    title: 'OHCS Quarterly Newsletter Published',
    slug: 'ohcs-quarterly-newsletter-published',
    excerpt: 'The latest edition of the OHCS quarterly newsletter is now available, covering highlights from Q1 2026.',
    status: 'published',
    publishedAt: '25 Mar 2026',
  },
];

const EMPTY_FORM: Omit<NewsItem, 'id'> = {
  title: '',
  slug: '',
  excerpt: '',
  status: 'draft',
  publishedAt: '',
};

export default function AdminNewsPage() {
  const [items, setItems] = useState<NewsItem[]>(INITIAL_NEWS);
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<NewsItem, 'id'>>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSuccessMsg(''), 3000);
  }

  const filtered = items.filter((n) =>
    n.title.toLowerCase().includes(query.toLowerCase()),
  );

  function openCreate() {
    setForm(EMPTY_FORM);
    setIsEditing(false);
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(item: NewsItem) {
    setForm({
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      status: item.status,
      publishedAt: item.publishedAt,
    });
    setIsEditing(true);
    setEditingId(item.id);
    setShowModal(true);
  }

  function handleTitleChange(title: string) {
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugify(title),
    }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (isEditing && editingId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...item, ...form } : item,
        ),
      );
      showSuccess('Article updated successfully.');
    } else {
      const newItem: NewsItem = {
        ...form,
        id: Date.now().toString(),
        publishedAt: form.publishedAt || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      };
      setItems((prev) => [newItem, ...prev]);
      showSuccess('Article created successfully.');
    }
    setShowModal(false);
  }

  function confirmDelete() {
    if (!deleteId) return;
    setItems((prev) => prev.filter((item) => item.id !== deleteId));
    setDeleteId(null);
    showSuccess('Article deleted.');
  }

  function toggleStatus(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'published' ? 'draft' : 'published' }
          : item,
      ),
    );
    showSuccess('Status updated.');
  }

  return (
    <div>
      {/* Success toast */}
      {successMsg && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-green-700 text-sm mb-6 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark">News Articles</h2>
          <p className="text-sm text-text-muted mt-1">Manage news and announcements published on the website.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create Article
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search articles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border-2 border-border/40 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-border/40">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider hidden md:table-cell">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider hidden sm:table-cell">Date</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-text-muted">
                  No articles found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-primary-dark max-w-[200px] truncate">
                    {row.title}
                  </td>
                  <td className="px-6 py-4 text-xs text-text-muted/70 max-w-[160px] truncate hidden md:table-cell font-mono">
                    {row.slug}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(row.id)}
                      title="Click to toggle status"
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80',
                        row.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600',
                      )}
                    >
                      <RefreshCw className="h-2.5 w-2.5" />
                      {row.status === 'published' ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted whitespace-nowrap hidden sm:table-cell">{row.publishedAt}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(row)}
                        aria-label="Edit article"
                        className="p-2 rounded-lg hover:bg-primary/5 text-text-muted hover:text-primary transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(row.id)}
                        aria-label="Delete article"
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl font-bold text-primary-dark">
                {isEditing ? 'Edit Article' : 'Create Article'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
                className="text-text-muted hover:text-primary-dark transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Article title"
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Slug
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="auto-generated-from-title"
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Excerpt
                </label>
                <textarea
                  rows={3}
                  value={form.excerpt}
                  onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief summary of the article..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 resize-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <div className="flex gap-3">
                  {(['published', 'draft'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, status: s }))}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition-colors',
                        form.status === s
                          ? s === 'published'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-400 bg-gray-50 text-gray-700'
                          : 'border-border/60 text-text-muted hover:border-gray-300',
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Published Date
                </label>
                <input
                  type="text"
                  value={form.publishedAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, publishedAt: e.target.value }))}
                  placeholder="e.g. 15 Apr 2026"
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border-2 border-border/60 text-sm font-semibold text-text-muted hover:text-primary-dark transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors"
                >
                  {isEditing ? 'Save Changes' : 'Create Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <h3 className="font-display text-lg font-bold text-primary-dark mb-3">Delete Article?</h3>
            <p className="text-sm text-text-muted mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteId(null)}
                className="px-5 py-2.5 rounded-xl border-2 border-border/60 text-sm font-semibold text-text-muted hover:text-primary-dark transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
