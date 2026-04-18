'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventRow {
  id: number;
  title: string;
  date: string;
  location: string;
  status: 'Published' | 'Draft';
}

const SAMPLE_EVENTS: EventRow[] = [
  { id: 1, title: 'Civil Service Week 2025 Opening Ceremony', date: '5 May 2025', location: 'State House, Accra', status: 'Published' },
  { id: 2, title: 'Ghana Public Service Forum', date: '18 May 2025', location: 'Accra International Conference Centre', status: 'Published' },
  { id: 3, title: 'Annual Performance Review Workshop', date: '2 Jun 2025', location: 'OHCS Headquarters, Ridge', status: 'Draft' },
  { id: 4, title: 'Leadership Development Retreat', date: '20 Jun 2025', location: 'Volta Serene Hotel, Ho', status: 'Draft' },
];

export default function AdminEventsPage() {
  const [query, setQuery] = useState('');

  const filtered = SAMPLE_EVENTS.filter(
    (e) =>
      e.title.toLowerCase().includes(query.toLowerCase()) ||
      e.location.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark">Events</h2>
          <p className="text-sm text-text-muted mt-1">Manage upcoming and past events listed on the website.</p>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create Event
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search events..."
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
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Location</th>
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
                  <td className="px-6 py-4 text-sm font-medium text-primary-dark max-w-xs truncate">
                    {row.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted whitespace-nowrap">{row.date}</td>
                  <td className="px-6 py-4 text-sm text-text-muted">{row.location}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                        row.status === 'Published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600',
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        aria-label="View event"
                        className="p-2 rounded-lg hover:bg-primary/5 text-text-muted hover:text-primary transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        aria-label="Edit event"
                        className="p-2 rounded-lg hover:bg-primary/5 text-text-muted hover:text-primary transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
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
    </div>
  );
}
