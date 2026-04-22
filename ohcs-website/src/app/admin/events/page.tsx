'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Trash2, CheckCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { audit } from '@/lib/audit-logger';

interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  status: 'published' | 'draft';
}

const INITIAL_EVENTS: EventItem[] = [
  {
    id: '1',
    title: 'Civil Service Week 2026 Opening Ceremony',
    date: '5 May 2026',
    location: 'AICC Accra',
    status: 'published',
  },
  {
    id: '2',
    title: 'Digital Governance Workshop',
    date: '12 May 2026',
    location: 'GIMPA Campus',
    status: 'published',
  },
  {
    id: '3',
    title: 'Quarterly Council Meeting',
    date: '20 May 2026',
    location: 'OHCS HQ',
    status: 'published',
  },
  {
    id: '4',
    title: 'Annual Staff Retreat',
    date: '15 Jun 2026',
    location: 'Kumasi',
    status: 'draft',
  },
];

const EMPTY_FORM: Omit<EventItem, 'id'> = {
  title: '',
  date: '',
  location: '',
  status: 'draft',
};

export default function AdminEventsPage() {
  const [items, setItems] = useState<EventItem[]>(INITIAL_EVENTS);
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<EventItem, 'id'>>(EMPTY_FORM);
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

  const filtered = items.filter((e) =>
    e.title.toLowerCase().includes(query.toLowerCase()) ||
    e.location.toLowerCase().includes(query.toLowerCase()),
  );

  function openCreate() {
    setForm(EMPTY_FORM);
    setIsEditing(false);
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(item: EventItem) {
    setForm({
      title: item.title,
      date: item.date,
      location: item.location,
      status: item.status,
    });
    setIsEditing(true);
    setEditingId(item.id);
    setShowModal(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (isEditing && editingId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...item, ...form } : item,
        ),
      );
      audit('update', 'event', editingId, form.title, 'Updated event');
      showSuccess('Event updated successfully.');
    } else {
      const newItem: EventItem = {
        ...form,
        // Date.now() runs only inside the submit handler, not during render.
        // eslint-disable-next-line react-hooks/purity
        id: Date.now().toString(),
      };
      setItems((prev) => [newItem, ...prev]);
      audit('create', 'event', newItem.id, newItem.title, 'Created event');
      showSuccess('Event created successfully.');
    }
    setShowModal(false);
  }

  function confirmDelete() {
    if (!deleteId) return;
    const item = items.find((i) => i.id === deleteId);
    setItems((prev) => prev.filter((i) => i.id !== deleteId));
    if (item) audit('delete', 'event', item.id, item.title, 'Deleted event');
    setDeleteId(null);
    showSuccess('Event deleted.');
  }

  function toggleStatus(id: string) {
    const item = items.find((i) => i.id === id);
    const newStatus = item?.status === 'published' ? 'draft' : 'published';
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: newStatus }
          : i,
      ),
    );
    if (item) audit('status_change', 'event', item.id, item.title, 'Changed status to ' + newStatus);
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
          <h2 className="text-2xl font-bold text-primary-dark">Events</h2>
          <p className="text-sm text-text-muted mt-1">Manage upcoming and past events listed on the website.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create Event
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search events..."
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
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider hidden sm:table-cell">Date</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider hidden md:table-cell">Location</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-text-muted">
                  No events found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-primary-dark max-w-[200px] truncate">
                    {row.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted whitespace-nowrap hidden sm:table-cell">
                    {row.date}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted hidden md:table-cell">
                    {row.location}
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
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(row)}
                        aria-label="Edit event"
                        className="p-2 rounded-lg hover:bg-primary/5 text-text-muted hover:text-primary transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(row.id)}
                        aria-label="Delete event"
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
                {isEditing ? 'Edit Event' : 'Create Event'}
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
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Event title"
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  placeholder="e.g. 5 May 2026"
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Venue or city"
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
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
                  {isEditing ? 'Save Changes' : 'Create Event'}
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
            <h3 className="font-display text-lg font-bold text-primary-dark mb-3">Delete Event?</h3>
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
